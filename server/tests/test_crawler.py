from types import SimpleNamespace

from bs4 import BeautifulSoup

from crawler import crawler as crawler_module


def _fake_response(text, headers=None):
    return SimpleNamespace(
        text=text,
        headers=headers or {},
        raise_for_status=lambda: None,
        raw=SimpleNamespace(headers=SimpleNamespace(getlist=lambda name: [])),
    )


class TestProcessPageErrorSurfacing:
    def test_html_scan_error_is_recorded_instead_of_dropped(self, monkeypatch):
        monkeypatch.setattr(
            crawler_module, "safe_get", lambda *a, **k: _fake_response("<html></html>")
        )
        monkeypatch.setattr(
            crawler_module,
            "scan_code_for_vulnerabilities",
            lambda code, content_type="html", model=None: {
                "error": "boom",
                "results": [],
            },
        )

        page_data, _soup = crawler_module.process_page("https://example.com/")

        assert page_data["code_analysis_errors"] == [
            {"source": "page", "message": "boom"}
        ]
        assert page_data["code_analysis"] == []

    def test_clean_scan_has_no_errors(self, monkeypatch):
        monkeypatch.setattr(
            crawler_module, "safe_get", lambda *a, **k: _fake_response("<html></html>")
        )
        monkeypatch.setattr(
            crawler_module,
            "scan_code_for_vulnerabilities",
            lambda code, content_type="html", model=None: {"results": []},
        )

        page_data, _soup = crawler_module.process_page("https://example.com/")

        assert page_data["code_analysis_errors"] == []


class TestFetchLinkedScriptsErrorSurfacing:
    def test_script_scan_error_is_recorded_with_its_source_path(self, monkeypatch):
        soup = BeautifulSoup('<script src="/app.js"></script>', "html.parser")
        monkeypatch.setattr(
            crawler_module, "safe_get", lambda *a, **k: _fake_response("var x = 1;")
        )
        monkeypatch.setattr(
            crawler_module,
            "scan_code_for_vulnerabilities",
            lambda code, content_type="html", model=None: {
                "error": "timed out",
                "results": [],
            },
        )

        findings, errors = crawler_module.fetch_linked_scripts(
            soup, "https://example.com/"
        )

        assert findings == []
        assert errors == [{"source": "/app.js", "message": "timed out"}]

    def test_clean_script_scan_has_no_errors(self, monkeypatch):
        soup = BeautifulSoup('<script src="/app.js"></script>', "html.parser")
        monkeypatch.setattr(
            crawler_module, "safe_get", lambda *a, **k: _fake_response("var x = 1;")
        )
        monkeypatch.setattr(
            crawler_module,
            "scan_code_for_vulnerabilities",
            lambda code, content_type="html", model=None: {"results": []},
        )

        findings, errors = crawler_module.fetch_linked_scripts(
            soup, "https://example.com/"
        )

        assert findings == []
        assert errors == []
