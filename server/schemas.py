"""
Marshmallow schemas describing the JSON the server actually sends to the
client: the /crawl SSE events, and the /models response.

This is the single source of truth for that shape. ``export_schema.py`` dumps
these to JSON Schema, which the client's ``npm run gen:types`` compiles into
client/src/types.generated.ts — so the two sides can't silently drift the way
the /crawl route and the vulnerabilities shape once did.

Classes here are named after the entity they describe (``Site``, not
``SiteSchema``) because marshmallow-jsonschema uses the class name verbatim
as the JSON Schema definition key, which becomes the generated TS type name.

app.py also runs every outgoing SSE event through these schemas (dump, then
load) before it hits the wire, so a payload that stops matching the schema
surfaces as an error instead of silently reaching the client malformed.
"""

from marshmallow import Schema, fields, validate

_SEVERITY = validate.OneOf(["critical", "high", "medium", "low", "info"])

_FINDING_TYPE = validate.OneOf(
    [
        "comment",
        "form",
        "link",
        "package",
        "secret",
        "script:external",
        "script:internal",
        "script:in-element",
    ]
)

# "lines" is either a single line number or a list of them — no single JSON
# Schema "type" expresses that, so it's given an explicit mapping here.
_LINES_TYPE_MAPPING = {
    "oneOf": [
        {"type": "integer"},
        {"type": "array", "items": {"type": "integer"}},
    ]
}

# The certificate payload is Python's ssl.getpeercert() plus a few derived
# fields (see crawler/ssl_utils.py) — an open-ended object, not worth pinning
# down field-by-field since nothing in the client reads it today. It's None
# for non-HTTPS sites, so "null" has to be listed explicitly here — a custom
# _jsonschema_type_mapping bypasses marshmallow-jsonschema's usual allow_none
# handling.
_OPEN_OBJECT_TYPE_MAPPING = {
    "type": ["object", "null"],
    "additionalProperties": True,
}


class Vulnerability(Schema):
    severity = fields.Str(required=True, validate=_SEVERITY)
    description = fields.Str(required=True)
    recommendation = fields.Str(required=True)


class CodeFinding(Schema):
    type = fields.Str(required=True, validate=_FINDING_TYPE)
    content = fields.Str(required=True)
    lines = fields.Raw(
        required=True, metadata={"_jsonschema_type_mapping": _LINES_TYPE_MAPPING}
    )
    vulnerabilities = fields.List(fields.Nested(Vulnerability), required=True)


class CodeAnalysisError(Schema):
    source = fields.Str(required=True)
    message = fields.Str(required=True)


class Link(Schema):
    type = fields.Str(required=True, validate=validate.OneOf(["absolute", "relative"]))
    link = fields.Str(required=True)


class HeaderFinding(Schema):
    header = fields.Str(required=True)
    present = fields.Bool(required=True)
    value = fields.Str(required=True, allow_none=True)
    severity = fields.Str(required=True, validate=_SEVERITY)
    description = fields.Str(required=True)
    recommendation = fields.Str(required=True)


class CookieIssue(Schema):
    severity = fields.Str(required=True, validate=_SEVERITY)
    attribute = fields.Str(required=True)
    description = fields.Str(required=True)
    recommendation = fields.Str(required=True)


class CookieFinding(Schema):
    name = fields.Str(required=True)
    raw = fields.Str(required=True)
    issues = fields.List(fields.Nested(CookieIssue), required=True)


class Site(Schema):
    path = fields.Str(required=True)
    html_content = fields.Str(required=True)
    links = fields.List(fields.Nested(Link), required=True)
    # "K: V" strings, one per response header — not a dict, since a header can
    # legally repeat (e.g. multiple Set-Cookie values) and a dict would lose that.
    response_headers = fields.List(fields.Str(), required=True)
    code_analysis = fields.List(fields.Nested(CodeFinding), required=True)
    code_analysis_errors = fields.List(fields.Nested(CodeAnalysisError), required=True)
    header_analysis = fields.List(fields.Nested(HeaderFinding), required=True)
    cookie_analysis = fields.List(fields.Nested(CookieFinding), required=True)


class RobotsTxtRule(Schema):
    user_agent = fields.Str(required=True)
    disallowed = fields.List(fields.Str(), required=True)
    allowed = fields.List(fields.Str(), required=True)


class RobotsTxtResult(Schema):
    found = fields.Bool(required=True)
    raw = fields.Str(required=True, allow_none=True)
    rules = fields.List(fields.Nested(RobotsTxtRule), required=True)
    sitemaps = fields.List(fields.Str(), required=True)
    crawl_delay = fields.Int(required=True, allow_none=True)


class SsePageEvent(Schema):
    type = fields.Str(required=True, validate=validate.OneOf(["page"]))
    page = fields.Nested(Site, required=True)


class SseDoneEvent(Schema):
    type = fields.Str(required=True, validate=validate.OneOf(["done"]))
    certificate = fields.Raw(
        required=True,
        allow_none=True,
        metadata={"_jsonschema_type_mapping": _OPEN_OBJECT_TYPE_MAPPING},
    )
    robots_txt = fields.Nested(RobotsTxtResult, required=True, allow_none=True)


class SseErrorEvent(Schema):
    type = fields.Str(required=True, validate=validate.OneOf(["error"]))
    message = fields.Str(required=True)


class ModelsResponse(Schema):
    models = fields.List(fields.Str(), required=True)
    default = fields.Str(required=True)


# Keyed by the SSE event's "type" field, for dispatch in app.py.
SSE_EVENT_SCHEMAS = {
    "page": SsePageEvent,
    "done": SseDoneEvent,
    "error": SseErrorEvent,
}
