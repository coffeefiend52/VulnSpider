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


def _valid_page(path="/"):
    return {
        "path": path,
        "html_content": "",
        "links": [],
        "response_headers": [],
        "code_analysis": [],
        "code_analysis_errors": [],
        "header_analysis": [],
        "cookie_analysis": [],
    }


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
            yield {"type": "page", "page": _valid_page()}
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
            yield {"type": "page", "page": _valid_page()}
            raise RuntimeError("boom")

        monkeypatch.setattr(
            app_module, "crawl_website_stream", fake_crawl_website_stream
        )

        response = client.post("/crawl", json={"url": "https://example.com"})

        events = _sse_events(response)
        assert events[-1] == {"type": "error", "message": "boom"}

    def test_page_event_that_violates_the_schema_becomes_an_sse_error(
        self, client, monkeypatch
    ):
        def fake_crawl_website_stream(url, base_url, **kwargs):
            # Missing several required Site fields — simulates a page_data dict
            # that has drifted from schemas.Site.
            yield {"type": "page", "page": {"path": "/"}}

        monkeypatch.setattr(
            app_module, "crawl_website_stream", fake_crawl_website_stream
        )

        response = client.post("/crawl", json={"url": "https://example.com"})

        events = _sse_events(response)
        assert events == [{"type": "error", "message": events[0]["message"]}]
        assert "html_content" in events[0]["message"]

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
