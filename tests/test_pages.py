"""
Unit and Integration Tests for Complete SPA Navigation & 10 Dedicated Pages (SIH Upgrade)
Tests HTTP routing for all 10 page URLs, index.html structure, and core API endpoints.
"""

import sys
from pathlib import Path
import requests

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

BASE_URL = "http://127.0.0.1:8000"

PAGES = [
    "dashboard",
    "live-weather",
    "forecast",
    "trust",
    "drift",
    "map",
    "alerts",
    "decision-support",
    "technical",
    "about",
]


def test_spa_page_routes():
    """Verify that all 10 dedicated SPA page URLs return status 200 with HTML content."""
    for page in PAGES:
        resp = requests.get(f"{BASE_URL}/{page}")
        assert resp.status_code == 200, f"Route /{page} failed with status {resp.status_code}"
        assert "text/html" in resp.headers["content-type"]
        assert "WeatherTrust AI" in resp.text
        assert f'id="page-{page}"' in resp.text, f"Missing #page-{page} in response for /{page}"
    print(f"[PASS] All {len(PAGES)} SPA page routes returned status 200 with valid HTML.")


def test_html_structure_and_components():
    """Verify that index.html contains all necessary navigation, header controls, and cards."""
    resp = requests.get(f"{BASE_URL}/")
    assert resp.status_code == 200
    html = resp.text

    # Sidebar & Brand
    assert 'id="sidebar"' in html
    assert 'id="hamburgerBtn"' in html
    assert 'Know when to trust the forecast' in html

    # All 10 navigation items
    for page in PAGES:
        assert f'data-page="{page}"' in html, f"Missing nav link for {page}"

    # Header controls
    assert 'id="citySearchInput"' in html
    assert 'id="locateMeBtn"' in html
    assert 'id="headerLastUpdated"' in html
    assert 'id="refreshNowBtn"' in html

    # Dashboard central entry point cards
    assert 'id="dashLocationTitle"' in html
    assert 'id="dashForecastRain"' in html
    assert 'id="dashTrustScore"' in html
    assert 'id="dashBustProb"' in html
    assert 'id="dashStability"' in html
    assert 'id="dashActionGuidance"' in html

    # Global overlays
    assert 'id="globalLoadingOverlay"' in html
    assert 'id="globalErrorCard"' in html

    print("[PASS] HTML structure and core UI components verified.")


def test_api_endpoints_operational():
    """Verify all underlying REST API endpoints continue functioning smoothly."""
    endpoints = [
        ("/api/health", 200),
        ("/api/weather/current?location=Krishna%20District", 200),
        ("/api/weather/forecast?location=Krishna%20District", 200),
        ("/api/reliability/overview?location=Krishna%20District", 200),
        ("/api/drift/history?location=Krishna%20District", 200),
        ("/api/alerts/reliability?location=Krishna%20District", 200),
        ("/api/map/india-reliability?risk_filter=ALL", 200),
        ("/api/judge/metrics", 200),
    ]

    for path, expected_status in endpoints:
        r = requests.get(f"{BASE_URL}{path}")
        assert r.status_code == expected_status, f"Endpoint {path} returned {r.status_code}"
    print(f"[PASS] All {len(endpoints)} core API endpoints operational.")


if __name__ == "__main__":
    print("\n--- Running WeatherTrust AI Page & Routing Test Suite ---")
    test_spa_page_routes()
    test_html_structure_and_components()
    test_api_endpoints_operational()
    print("ALL PAGE NAVIGATION & COMPONENT TESTS PASSED!\n")
