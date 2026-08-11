import json
import socket

import pytest

import app as app_module


def _sse_events(response):
    body = response.get_data(as_text=True)
    return [
        json.loads(line[len("data: ") :])
        for line in body.splitlines()
        if line.startswith("data: ")
    ]


@pytest.fixture
def client(monkeypatch):
    # Resolve every hostname to a public address so the SSRF check passes by default.
    monkeypatch.setattr(
        socket,
        "getaddrinfo",
        lambda host, port: [
            (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("93.184.216.34", 0))
        ],
    )
    app_module.app.config["TESTING"] = True
    return app_module.app.test_client()


class TestCrawlEndpoint:
    def test_streams_page_and_done_events(self, client, monkeypatch):
        def fake_crawl_website_stream(url, base_url, **kwargs):
            yield {
                "type": "page",
                "page": {
                    "path": "/",
                    "html_content": "",
                    "links": [],
                    "response_headers": [],
                    "code_analysis": [],
                    "header_analysis": [],
                    "cookie_analysis": [],
                },
            }
            yield {"type": "done", "certificate": None, "robots_txt": None}

        monkeypatch.setattr(
            app_module, "crawl_website_stream", fake_crawl_website_stream
        )

        response = client.post(
            "/crawl", json={"url": "https://example.com", "max_pages": 5}
        )

        assert response.status_code == 200
        assert response.mimetype == "text/event-stream"

        events = _sse_events(response)
        assert [e["type"] for e in events] == ["page", "done"]
        assert events[0]["page"]["path"] == "/"

    def test_generator_error_becomes_sse_error_event(self, client, monkeypatch):
        def fake_crawl_website_stream(url, base_url, **kwargs):
            yield {"type": "page", "page": {"path": "/"}}
            raise RuntimeError("boom")

        monkeypatch.setattr(
            app_module, "crawl_website_stream", fake_crawl_website_stream
        )

        response = client.post("/crawl", json={"url": "https://example.com"})

        events = _sse_events(response)
        assert events[-1] == {"type": "error", "message": "boom"}

    def test_rejects_invalid_url(self, client):
        response = client.post("/crawl", json={"url": "not-a-url"})

        assert response.status_code == 400
        assert "url" in response.get_json()["error"]

    def test_rejects_ssrf_unsafe_url(self, client, monkeypatch):
        monkeypatch.setattr(
            socket,
            "getaddrinfo",
            lambda host, port: [
                (socket.AF_INET, socket.SOCK_STREAM, 6, "", ("127.0.0.1", 0))
            ],
        )

        response = client.post("/crawl", json={"url": "http://evil.example"})

        assert response.status_code == 400
        assert "url" in response.get_json()["error"]

    def test_rejects_non_http_scheme(self, client):
        response = client.post("/crawl", json={"url": "ftp://example.com"})

        assert response.status_code == 400
