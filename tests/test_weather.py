"""
Unit and Integration Tests for Weather Service (Phase 16)
Tests live Open-Meteo ingestion, geocoding for Indian cities, and sample cache fallbacks.
"""

import sys
from pathlib import Path
from datetime import date, timedelta

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.services.weather_service import (
    geocode_location,
    get_current_weather,
    get_hourly_forecast,
    get_daily_forecast,
    get_full_forecast_response,
    search_locations,
    fetch_live_forecast,
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


def test_daily_forecast_uses_open_meteo_hourly_aggregates(monkeypatch):
    from backend.services import weather_service

    dates = [(date.today() + timedelta(days=offset)).isoformat() for offset in range(10)]
    hourly_times = [f"{forecast_date}T{hour:02d}:00" for forecast_date in dates for hour in range(24)]
    day_values = [float(day + 1) for day in range(10) for _ in range(24)]
    payload = {
        "current": {
            "temperature_2m": 27.0, "relative_humidity_2m": 60, "apparent_temperature": 28.0,
            "precipitation": 0.0, "weather_code": 1, "surface_pressure": 1008.0,
            "wind_speed_10m": 12.0, "wind_direction_10m": 90, "cloud_cover": 25,
            "dew_point_2m": 18.0, "wind_gusts_10m": 18.0,
        },
        "hourly": {
            "time": hourly_times,
            "temperature_2m": [27.0] * 240,
            "relative_humidity_2m": [50 + day for day in range(10) for _ in range(24)],
            "pressure_msl": [1000 + day for day in range(10) for _ in range(24)],
            "cloud_cover": [20 + day for day in range(10) for _ in range(24)],
            "precipitation_probability": [10] * 240,
            "precipitation": [0.0] * 240,
            "weather_code": [1] * 240,
            "wind_speed_10m": day_values,
        },
        "daily": {
            "time": dates,
            "weather_code": [1] * 10,
            "temperature_2m_max": [30.0] * 10,
            "temperature_2m_min": [22.0] * 10,
            "precipitation_sum": [float(day) for day in range(10)],
            "precipitation_probability_max": [10] * 10,
            "wind_speed_10m_max": [float(day + 5) for day in range(10)],
            "sunrise": [f"{forecast_date}T06:00" for forecast_date in dates],
            "sunset": [f"{forecast_date}T18:00" for forecast_date in dates],
        },
    }

    class ApiResponse:
        status_code = 200

        def json(self):
            return payload

    monkeypatch.setattr(weather_service, "_safe_get", lambda *args, **kwargs: ApiResponse())
    forecast = fetch_live_forecast(9.5, 76.3, "Test City", "Kerala", "India")

    assert forecast.daily[0].humidity_pct == 50
    assert forecast.daily[0].pressure_hpa == 1000.0
    assert forecast.daily[0].cloud_cover_pct == 20
    assert forecast.daily[0].wind_speed_kmh == 5.0
    assert forecast.daily[0].wmo_code == 1
    assert forecast.daily[5].precipitation_mm == 5.0


if __name__ == "__main__":
    print("\n--- Running Weather Service Test Suite ---")
    test_geocoding()
    test_live_weather_and_fallback()
    test_location_search_suggestions()
    print("ALL WEATHER SERVICE TESTS PASSED!\n")
