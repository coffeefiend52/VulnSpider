from analysis.cookie_analysis import analyze_cookies


def _attrs(finding):
    return {issue["attribute"] for issue in finding["issues"]}


def test_fully_secured_cookie_has_no_issues():
    raw = "session=abc123; HttpOnly; Secure; SameSite=Strict"
    assert analyze_cookies([raw]) == []


def test_bare_cookie_flags_all_three_attributes():
    raw = "session=abc123"
    findings = analyze_cookies([raw])
    assert len(findings) == 1
    finding = findings[0]
    assert finding["name"] == "session"
    assert finding["raw"] == raw
    assert _attrs(finding) == {"HttpOnly", "Secure", "SameSite"}


def test_missing_httponly_only():
    raw = "session=abc123; Secure; SameSite=Lax"
    finding = analyze_cookies([raw])[0]
    assert _attrs(finding) == {"HttpOnly"}


def test_missing_secure_only():
    raw = "session=abc123; HttpOnly; SameSite=Lax"
    finding = analyze_cookies([raw])[0]
    assert _attrs(finding) == {"Secure"}


def test_samesite_none_without_secure_is_flagged():
    raw = "session=abc123; HttpOnly; SameSite=None"
    finding = analyze_cookies([raw])[0]
    assert _attrs(finding) == {"Secure", "SameSite=None requires Secure"}


def test_samesite_none_with_secure_is_not_flagged_for_that_pairing():
    raw = "session=abc123; HttpOnly; Secure; SameSite=None"
    assert analyze_cookies([raw]) == []


def test_multiple_cookies_are_each_evaluated():
    raws = [
        "a=1; HttpOnly; Secure; SameSite=Strict",
        "b=2",
    ]
    findings = analyze_cookies(raws)
    assert len(findings) == 1
    assert findings[0]["name"] == "b"


def test_accepts_plain_dict_with_single_set_cookie():
    headers = {"Set-Cookie": "session=abc123"}
    findings = analyze_cookies(headers)
    assert len(findings) == 1
    assert findings[0]["name"] == "session"
