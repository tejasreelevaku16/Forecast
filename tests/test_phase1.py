"""
Automated Integration Verification for WeatherTrust AI Phase 1
Tests service layers, route handlers, and static files directly without external test-client dependencies.
"""

import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config
config.IS_DEMO_MODE = True
from backend.routes.weather import (
    current_weather,
    hourly_forecast,
    daily_forecast,
    active_alerts,
    search_city,
    consolidated_forecast,
)
from backend.routes.reliability import trust_overview
from backend.services.weather_service import get_current_weather, get_daily_forecast
from backend.services.reliability_service import get_forecast_reliability_overview


def test_configuration():
    assert config.APP_NAME == "WeatherTrust AI"
    assert isinstance(config.IS_DEMO_MODE, bool)
    assert "IMD" in config.OFFICIAL_DISCLAIMER
    print("[PASS] Configuration verified.")


def test_weather_services_and_routes():
    # 1. Current Weather
    curr = current_weather(location="Krishna District")
    assert "Krishna" in curr.location
    assert 0 <= curr.humidity_pct <= 100
    assert -50 <= curr.temperature_c <= 60
    assert curr.wind_direction
    assert 800 <= curr.pressure_hpa <= 1100
    print("[PASS] Current weather endpoint & service verified.")

    # 2. Hourly Forecast (24 hours)
    hourly = hourly_forecast(location="Krishna District")
    assert len(hourly) == 24
    for h in hourly:
        assert h.time
        assert -50 <= h.temperature_c <= 60
        assert 0 <= h.rain_chance_pct <= 100
    print("[PASS] 24-hour hourly forecast timeline verified.")

    # 3. 10-Day Daily Forecast
    daily = daily_forecast(location="Krishna District")
    assert len(daily) == 10
    day6 = next(d for d in daily if d.day_index == 6)
    assert day6.precipitation_mm >= 0
    assert 0 <= day6.rain_chance_pct <= 100
    assert day6.condition
    print("[PASS] 10-day daily forecast verified.")

    # 4. Location Search
    results = search_city(q="krishna")
    assert len(results) > 0
    assert any("krishna" in r.name.lower() or "krishna" in r.region.lower() for r in results)
    print("[PASS] Location search autocomplete verified.")

    # 5. Consolidated Forecast Response
    full = consolidated_forecast(location="Krishna District")
    assert "Krishna" in full.current.location
    assert len(full.hourly) == 24
    assert len(full.daily) == 10
    print("[PASS] Consolidated dashboard forecast payload verified.")


def test_reliability_services_and_routes():
    rel = trust_overview(location="Krishna District")
    assert 0 <= rel.reliability_score <= 100
    assert rel.reliability_score + rel.bust_probability_pct == 100
    assert rel.risk_level in ("LOW", "MODERATE", "HIGH")
    assert rel.forecast_stability in ("HIGH", "MODERATE", "LOW")
    assert all(r.title for r in rel.reasons)
    assert rel.drift_monitor is not None
    assert rel.drift_monitor.absolute_change == rel.forecast_drift_mm
    assert len(rel.lead_days) == 10
    print("[PASS] Forecast Trust Layer returns consistent live reliability, bust risk, and drift values.")


def test_frontend_assets():
    frontend_dir = PROJECT_ROOT / "frontend"
    assert (frontend_dir / "index.html").exists(), "index.html missing"
    assert (frontend_dir / "css" / "style.css").exists(), "style.css missing"
    assert (frontend_dir / "css" / "dashboard.css").exists(), "dashboard.css missing"
    assert (frontend_dir / "js" / "weather.js").exists(), "weather.js missing"
    assert (frontend_dir / "js" / "reliability.js").exists(), "reliability.js missing"
    assert (frontend_dir / "js" / "charts.js").exists(), "charts.js missing"
    assert (frontend_dir / "js" / "dashboard.js").exists(), "dashboard.js missing"

    index_html = (frontend_dir / "index.html").read_text(encoding="utf-8")
    assert "WeatherTrust AI" in index_html
    assert "hourlyTrendChart" in index_html
    assert "bustRiskChart" in index_html
    assert "indiaMap" in index_html
    print("[PASS] Frontend files and DOM element IDs verified.")


def test_sample_json_data():
    sample_dir = PROJECT_ROOT / "data" / "sample"
    assert (sample_dir / "sample_weather.json").exists()
    assert (sample_dir / "sample_reliability.json").exists()
    print("[PASS] Sample JSON data files in data/sample/ verified.")


if __name__ == "__main__":
    print("\n--- Running WeatherTrust AI Phase 1 Automated Verification ---")
    test_configuration()
    test_weather_services_and_routes()
    test_reliability_services_and_routes()
    test_frontend_assets()
    test_sample_json_data()
    print("\n========================================================")
    print("ALL PHASE 1 VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("========================================================\n")
