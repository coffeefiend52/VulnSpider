import socket

import pytest

from crawler.url_utils import _is_ssrf_safe, categorize_url


def _fake_getaddrinfo(*ips):
    """Build a socket.getaddrinfo-shaped return value for the given IP strings."""

    def fake(hostname, port):
        return [(socket.AF_INET, socket.SOCK_STREAM, 6, "", (ip, 0)) for ip in ips]

    return fake


class TestIsSsrfSafe:
    @pytest.mark.parametrize(
        "ip",
        [
            "127.0.0.1",  # loopback
            "10.0.0.1",  # private
            "192.168.1.1",  # private
            "172.16.0.1",  # private
            "169.254.1.1",  # link-local
            "0.0.0.0",  # reserved
            "224.0.0.1",  # multicast
            "::1",  # loopback (IPv6)
        ],
    )
    def test_blocks_unsafe_addresses(self, monkeypatch, ip):
        monkeypatch.setattr(socket, "getaddrinfo", _fake_getaddrinfo(ip))
        assert _is_ssrf_safe("evil.example") is False

    def test_allows_public_address(self, monkeypatch):
        monkeypatch.setattr(socket, "getaddrinfo", _fake_getaddrinfo("8.8.8.8"))
        assert _is_ssrf_safe("dns.google") is True

    def test_blocks_if_any_resolved_address_is_unsafe(self, monkeypatch):
        # A hostname resolving to both a public and a private address is unsafe overall
        fake = _fake_getaddrinfo("8.8.8.8", "127.0.0.1")
        monkeypatch.setattr(socket, "getaddrinfo", fake)
        assert _is_ssrf_safe("mixed.example") is False

    def test_unresolvable_hostname_is_unsafe(self, monkeypatch):
        def raise_gaierror(hostname, port):
            raise socket.gaierror("name resolution failed")

        monkeypatch.setattr(socket, "getaddrinfo", raise_gaierror)
        assert _is_ssrf_safe("nonexistent.invalid") is False


class TestCategorizeUrl:
    @pytest.mark.parametrize(
        "href,expected",
        [
            ("", "empty"),
            ("   ", "empty"),
            ("#section", "fragment"),
            ("//example.com/page", "protocol-relative"),
            ("http://example.com/page", "absolute"),
            ("https://example.com/page", "absolute"),
            ("mailto:a@example.com", "special-mailto"),
            ("tel:+15551234567", "special-tel"),
            ("ftp://example.com/file", "special-ftp"),
            ("file:///etc/passwd", "special-file"),
            ("javascript:alert(1)", "special-scheme"),
            ("/page.html", "root-relative"),
            ("?query=1", "query-only"),
            ("page.html", "relative"),
            ("../page.html", "relative"),
        ],
    )
    def test_categorizes(self, href, expected):
        assert categorize_url(href) == expected
