import json
import logging
import os

import requests as http_client
from flask import Flask, Response, request, jsonify, stream_with_context
from flask_cors import CORS
from urllib.parse import urlparse
from marshmallow import Schema, fields, ValidationError, post_load

from analysis.code_analysis import OLLAMA_BASE_URL, OLLAMA_MODEL
from crawler.crawler import crawl_website_stream
from crawler.url_utils import _is_ssrf_safe
from schemas import SSE_EVENT_SCHEMAS, ModelsResponse


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

_cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://localhost:4000").split(",") if o.strip()]
# Match all routes so /models and any future endpoints are also covered
CORS(app, resources={r"/*": {"origins": _cors_origins}})


class CrawlRequestSchema(Schema):
    url = fields.URL(required=True)
    headers = fields.Dict(missing={})
    max_pages = fields.Int(
        missing=50,
        validate=lambda x: 1 <= x <= 200 or ValueError("must be between 1 and 200"),
    )
    max_depth = fields.Int(
        missing=None,
        allow_none=True,
        validate=lambda x: x is None or (1 <= x <= 20 or ValueError("must be between 1 and 20")),
    )
    respect_robots = fields.Bool(missing=False)
    model = fields.Str(missing=OLLAMA_MODEL, validate=lambda x: x.strip() or ValueError("must be non-empty"))

    @post_load
    def process_url(self, data, **kwargs):
        """Validate URL scheme and SSRF safety, then extract base_url."""
        url = data["url"]
        parsed_url = urlparse(url)

        if parsed_url.scheme not in ("http", "https"):
            raise ValidationError({"url": "Only http and https URLs are allowed"})

        if not _is_ssrf_safe(parsed_url.hostname):
            raise ValidationError({"url": "URL resolves to a disallowed address"})

        data["base_url"] = f"{parsed_url.scheme}://{parsed_url.netloc}"
        return data


crawl_schema = CrawlRequestSchema()


def _validate_sse_event(event: dict) -> dict:
    """Round-trip *event* through its schema (schemas.py) before it's sent.

    Dumping strips anything that isn't part of the documented contract, and
    reloading enforces that every required field is actually present, so a
    payload that drifts from the schema fails loudly here instead of quietly
    reaching the client malformed.
    """
    schema = SSE_EVENT_SCHEMAS[event["type"]]()
    dumped = schema.dump(event)
    schema.load(dumped)
    return dumped


@app.route('/crawl', methods=['POST'])
def crawl():
    try:
        params = crawl_schema.load(request.get_json())
    except ValidationError as err:
        return jsonify({"error": err.messages}), 400

    def generate():
        try:
            for event in crawl_website_stream(
                params["url"],
                params["base_url"],
                headers=params["headers"],
                max_pages=params["max_pages"],
                max_depth=params["max_depth"],
                respect_robots=params["respect_robots"],
                model=params["model"],
            ):
                yield f"data: {json.dumps(_validate_sse_event(event))}\n\n"
        except Exception as e:
            error_event = _validate_sse_event({"type": "error", "message": str(e)})
            yield f"data: {json.dumps(error_event)}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@app.route('/models', methods=['GET'])
def list_models():
    try:
        resp = http_client.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        resp.raise_for_status()
        models = [m["name"] for m in resp.json().get("models", [])]
        payload = ModelsResponse().dump({"models": models, "default": OLLAMA_MODEL})
        ModelsResponse().load(payload)
        return jsonify(payload), 200
    except http_client.RequestException as e:
        logger.warning("Failed to reach Ollama API: %s", e)
        return jsonify({"error": "Could not reach Ollama API", "models": [], "default": OLLAMA_MODEL}), 502


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "ai_web_crawler_security"}), 200
