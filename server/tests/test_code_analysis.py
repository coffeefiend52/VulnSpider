import json

from analysis import code_analysis


class TestOllamaTimeoutConfiguration:
    def test_new_client_carries_a_bounded_timeout(self):
        llm = code_analysis._new_ollama("some-test-model")
        assert llm.client_kwargs == {"timeout": code_analysis._OLLAMA_TIMEOUT_SECONDS}

    def test_timeout_is_not_none(self):
        # ollama's own client defaults to timeout=None (no timeout at all), so a
        # hung backend would otherwise block the scanning thread indefinitely.
        assert code_analysis._OLLAMA_TIMEOUT_SECONDS is not None
        assert code_analysis._OLLAMA_TIMEOUT_SECONDS > 0


class TestScanErrorSurfacing:
    def test_invoke_exception_is_returned_as_a_visible_error(self, monkeypatch):
        class FakeLLM:
            def invoke(self, prompt):
                raise TimeoutError("timed out")

        monkeypatch.setattr(code_analysis, "_get_ollama", lambda model: FakeLLM())

        result = code_analysis.scan_code_for_vulnerabilities(
            "<html></html>", model="fake"
        )

        assert result == {"error": "timed out", "results": []}

    def test_malformed_json_response_is_returned_as_a_visible_error(self, monkeypatch):
        class FakeLLM:
            def invoke(self, prompt):
                return "this is not json"

        monkeypatch.setattr(code_analysis, "_get_ollama", lambda model: FakeLLM())

        result = code_analysis.scan_code_for_vulnerabilities(
            "<html></html>", model="fake"
        )

        assert "error" in result
        assert result["results"] == []

    def test_well_formed_response_has_no_error_key(self, monkeypatch):
        payload = {
            "results": [
                {
                    "type": "secret",
                    "lines": 1,
                    "content": "x",
                    "vulnerabilities": [
                        {"severity": "high", "description": "d", "recommendation": "r"}
                    ],
                }
            ]
        }

        class FakeLLM:
            def invoke(self, prompt):
                return json.dumps(payload)

        monkeypatch.setattr(code_analysis, "_get_ollama", lambda model: FakeLLM())

        result = code_analysis.scan_code_for_vulnerabilities(
            "<html></html>", model="fake"
        )

        assert "error" not in result
        assert len(result["results"]) == 1
        assert result["results"][0]["vulnerabilities"][0]["severity"] == "high"
