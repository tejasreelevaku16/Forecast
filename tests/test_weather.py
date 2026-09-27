"""
Unit and Integration Tests for Weather Service (Phase 16)
Tests live Open-Meteo ingestion, geocoding for Indian cities, and sample cache fallbacks.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.services.weather_service import (
    geocode_location,
    get_current_weather,
    get_hourly_forecast,
    get_daily_forecast,
    get_full_forecast_response,
    search_locations,
)


def test_geocoding():
    geo = geocode_location("Krishna District")
    assert geo is not None
    assert "lat" in geo and "lon" in geo
    assert 15.0 <= geo["lat"] <= 18.0
    print("[PASS] Geocoding location test passed.")


def test_live_weather_and_fallback():
    full = get_full_forecast_response("Krishna District")
    assert full.current is not None
    assert full.current.location is not None
    assert -20 <= full.current.temperature_c <= 55
    assert 0 <= full.current.humidity_pct <= 100
    assert len(full.hourly) == 24
    assert len(full.daily) == 10
    print("[PASS] Full forecast response (current, 24h hourly, 10-day daily) passed.")


def test_location_search_suggestions():
    results = search_locations("Hyderabad")
    assert len(results) > 0
    assert any("Hyderabad" in r.name for r in results)
    print("[PASS] Location search autocomplete test passed.")


if __name__ == "__main__":
    print("\n--- Running Weather Service Test Suite ---")
    test_geocoding()
    test_live_weather_and_fallback()
    test_location_search_suggestions()
    print("ALL WEATHER SERVICE TESTS PASSED!\n")
