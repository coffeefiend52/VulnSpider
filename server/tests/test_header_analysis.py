from analysis.header_analysis import analyze_headers

_ALL_HEADER_NAMES = {
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
}


def _finding_for(findings, header):
    return next((f for f in findings if f["header"] == header), None)


def test_no_headers_present_flags_all_rules():
    findings = analyze_headers({})
    assert {f["header"] for f in findings} == _ALL_HEADER_NAMES
    assert all(f["present"] is False for f in findings)


def test_fully_configured_headers_produce_no_findings():
    headers = {
        "Content-Security-Policy": "default-src 'self'",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=()",
    }
    assert analyze_headers(headers) == []


def test_header_lookup_is_case_insensitive():
    headers = {"x-content-type-options": "nosniff"}
    findings = analyze_headers(headers)
    assert _finding_for(findings, "X-Content-Type-Options") is None


def test_hsts_missing_max_age_is_high_severity():
    headers = {"Strict-Transport-Security": "includeSubDomains"}
    finding = _finding_for(analyze_headers(headers), "Strict-Transport-Security")
    assert finding["severity"] == "high"


def test_hsts_short_max_age_is_medium_severity():
    headers = {"Strict-Transport-Security": "max-age=3600"}
    finding = _finding_for(analyze_headers(headers), "Strict-Transport-Security")
    assert finding["severity"] == "medium"


def test_xfo_invalid_value_is_flagged():
    headers = {"X-Frame-Options": "ALLOW-FROM https://example.com"}
    finding = _finding_for(analyze_headers(headers), "X-Frame-Options")
    assert finding is not None
    assert finding["severity"] == "medium"


def test_xfo_sameorigin_is_accepted():
    headers = {"X-Frame-Options": "SAMEORIGIN"}
    assert _finding_for(analyze_headers(headers), "X-Frame-Options") is None


def test_xcto_wrong_value_is_flagged():
    headers = {"X-Content-Type-Options": "sniff"}
    finding = _finding_for(analyze_headers(headers), "X-Content-Type-Options")
    assert finding is not None
    assert finding["severity"] == "medium"
