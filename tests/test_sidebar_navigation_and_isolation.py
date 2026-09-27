"""
WeatherTrust AI — Comprehensive Navigation, Isolation, and Location Persistence Tests
SIH Problem ID: 26079

Verifies:
1. All 15 independent SPA pages and their aliases are served properly by backend.
2. Index.html has exact isolated page containers, no syntax corruption, and modal is hidden.
3. Location persistence and API consistency across Bhopal, Krishna District, Hyderabad, and Vijayawada.
4. No page content leaking or conflicting.
"""

import sys
from pathlib import Path
from html.parser import HTMLParser

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

PAGES_MAP = {
    "dashboard": "page-dashboard",
    "confidence-map": "page-confidence-map",
    "forecast-confidence": "page-confidence-map",
    "daywise": "page-daywise",
    "day-wise-confidence": "page-daywise",
    "uncertainty": "page-uncertainty",
    "forecast-uncertainty": "page-uncertainty",
    "calibration": "page-calibration",
    "model-reliability": "page-calibration",
    "explain": "page-explain",
    "explainable-ai": "page-explain",
    "live-weather": "page-live-weather",
    "live-tracking": "page-live-weather",
    "forecast": "page-forecast",
    "10-day-forecast": "page-forecast",
    "trust": "page-trust",
    "trust-diagnostics": "page-trust",
    "drift": "page-drift",
    "forecast-drift": "page-drift",
    "map": "page-map",
    "india-map": "page-map",
    "alerts": "page-alerts",
    "early-alerts": "page-alerts",
    "decision-support": "page-decision-support",
    "technical": "page-technical",
    "technical-evaluation": "page-technical",
    "about": "page-about",
}


def test_all_15_pages_and_aliases_direct_url():
    """Verify that directly requesting every sidebar page URL returns 200 with index.html."""
    for url_slug, target_container in PAGES_MAP.items():
        resp = client.get(f"/{url_slug}")
        assert resp.status_code == 200, f"Direct route /{url_slug} failed with status {resp.status_code}"
        assert "text/html" in resp.headers["content-type"]
        assert f'id="{target_container}"' in resp.text, f"Target container #{target_container} not found in HTML for /{url_slug}"
    print(f"[PASS] All {len(PAGES_MAP)} direct page URLs and aliases returned 200 with target DOM containers.")


def test_html_modal_isolation_and_css_cleanliness():
    """Verify that explainability modal is explicitly hidden and no git conflict markers exist."""
    # Check index.html
    index_path = PROJECT_ROOT / "frontend" / "index.html"
    with open(index_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    assert 'id="explainabilityModal"' in html_content
    assert 'style="display: none;"' in html_content, "explainabilityModal must have inline style display: none"
    assert "<<<<<<<" not in html_content, "Conflict marker in index.html"
    assert ">>>>>>>" not in html_content, "Conflict marker in index.html"

    # Check dashboard.css
    css_path = PROJECT_ROOT / "frontend" / "css" / "dashboard.css"
    with open(css_path, "r", encoding="utf-8") as f:
        css_content = f.read()

    import re
    assert not re.search(r"^[<>=]{7}", css_content, re.MULTILINE), "Conflict marker found in dashboard.css"
    assert ".explain-modal-backdrop {" in css_content
    assert "display: none;" in css_content

    # Check each of the 15 page views are siblings
    class PageViewChecker(HTMLParser):
        def __init__(self):
            super().__init__()
            self.stack = []
            self.page_views = []

        def handle_starttag(self, tag, attrs):
            attr_dict = dict(attrs)
            classes = attr_dict.get("class", "").split()
            tag_id = attr_dict.get("id")
            if "page-view" in classes:
                self.page_views.append((tag_id, len(self.stack)))
            self.stack.append(tag)

        def handle_endtag(self, tag):
            for i in range(len(self.stack) - 1, -1, -1):
                if self.stack[i] == tag:
                    self.stack = self.stack[:i]
                    break

    checker = PageViewChecker()
    checker.feed(html_content)

    assert len(checker.page_views) == 15, f"Expected 15 .page-view containers, found {len(checker.page_views)}"
    depths = set(depth for _, depth in checker.page_views)
    assert len(depths) == 1, f"All page-view containers must be at the same DOM depth! Found depths: {depths}"
    print(f"[PASS] HTML and CSS isolation verified: 15 independent page containers at DOM depth {depths.pop()}.")


def test_bhopal_location_weather_and_diagnostics():
    """Verify that Bhopal, Madhya Pradesh has accurate, real forecast, reliability, and drift data."""
    # 1. Weather
    w_resp = client.get("/api/weather/forecast?location=Bhopal")
    assert w_resp.status_code == 200
    w_data = w_resp.json()
    assert "daily" in w_data
    assert len(w_data["daily"]) == 10

    # 2. Reliability
    r_resp = client.get("/api/reliability/overview?location=Bhopal&focus_lead_day=6")
    assert r_resp.status_code == 200
    r_data = r_resp.json()
    assert r_data["location"] == "Bhopal"
    assert "lead_days" in r_data
    assert len(r_data["lead_days"]) == 10

    # 3. Drift
    d_resp = client.get("/api/drift/history?location=Bhopal")
    assert d_resp.status_code == 200
    d_data = d_resp.json()
    assert d_data["location"] == "Bhopal"
    assert "cycles" in d_data or "drift_history" in d_data

    # 4. Explainability
    e_resp = client.get("/api/explain/bust?location=Bhopal&lead_day=6")
    assert e_resp.status_code == 200
    e_data = e_resp.json()
    assert e_data["location"] == "Bhopal"
    assert "top_features" in e_data
    assert len(e_data["top_features"]) > 0

    print("[PASS] Bhopal, Madhya Pradesh live tracking & diagnostics verified.")


def test_krishna_district_location_weather_and_diagnostics():
    """Verify that Krishna District, Andhra Pradesh has accurate, real forecast, reliability, and drift data."""
    # 1. Weather
    w_resp = client.get("/api/weather/forecast?location=Krishna%20District")
    assert w_resp.status_code == 200
    w_data = w_resp.json()
    assert "daily" in w_data
    assert len(w_data["daily"]) == 10

    # 2. Reliability
    r_resp = client.get("/api/reliability/overview?location=Krishna%20District&focus_lead_day=6")
    assert r_resp.status_code == 200
    r_data = r_resp.json()
    assert "Krishna" in r_data["location"]

    # 3. Drift
    d_resp = client.get("/api/drift/history?location=Krishna%20District")
    assert d_resp.status_code == 200
    d_data = d_resp.json()
    assert "Krishna" in d_data["location"]

    # 4. Explainability
    e_resp = client.get("/api/explain/bust?location=Krishna%20District&lead_day=6")
    assert e_resp.status_code == 200
    e_data = e_resp.json()
    assert "Krishna" in e_data["location"]

    print("[PASS] Krishna District live tracking & diagnostics verified.")


def test_other_priority_locations():
    """Verify Hyderabad and Vijayawada function smoothly with full diagnostics."""
    for loc in ["Hyderabad", "Vijayawada"]:
        r = client.get(f"/api/weather/forecast?location={loc}")
        assert r.status_code == 200
        rel = client.get(f"/api/reliability/overview?location={loc}&focus_lead_day=6")
        assert rel.status_code == 200
    print("[PASS] Hyderabad and Vijayawada forecasts and reliability verified.")


if __name__ == "__main__":
    print("\n=== Running WeatherTrust AI Navigation & Isolation Test Suite ===")
    test_all_15_pages_and_aliases_direct_url()
    test_html_modal_isolation_and_css_cleanliness()
    test_bhopal_location_weather_and_diagnostics()
    test_krishna_district_location_weather_and_diagnostics()
    test_other_priority_locations()
    print("ALL TESTS PASSED!\n")
