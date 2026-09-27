"""
Test Suite for Location Integrity, Availability Contracts, and Anti-Leakage
Ensures:
1. No silent fallbacks to Krishna District / Vijayawada coordinates when location resolution fails.
2. Unresolvable locations return available=False with clean error messages.
3. No hardcoded weather values (31.5°C, 78%, etc.) are used for unresolvable locations.
4. Valid locations (Hyderabad, Jaipur, Krishna District) maintain strictly isolated coordinates and live data.
"""

import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.main import app
from backend.services.weather_service import geocode_location, get_full_forecast_response
from backend.services.reliability_service import (
    get_forecast_reliability_overview,
    get_daywise_reliability,
    get_shap_explainability_detail,
)
from backend.services.uncertainty_service import calculate_forecast_uncertainty_profile

client = TestClient(app)


def test_invalid_location_geocoding_returns_none():
    """Unresolvable place name must return None, not default to Krishna District."""
    res = geocode_location("NonExistentCityXYZ999")
    assert res is None, f"Expected None for unresolvable location, got {res}"


def test_invalid_location_weather_availability_contract():
    """Weather service must return available=False when location cannot be resolved."""
    resp = get_full_forecast_response("NonExistentCityXYZ999")
    assert resp.available is False
    assert resp.current is None
    assert "not found" in resp.error.lower()


def test_invalid_location_reliability_availability_contract():
    """Reliability overview must return available=False when weather is unavailable."""
    overview = get_forecast_reliability_overview("NonExistentCityXYZ999")
    assert overview.available is False
    assert overview.reliability_score == 0
    assert overview.bust_probability_pct == 0
    assert overview.confidence_label == "DATA UNAVAILABLE"
    assert "unavailable" in overview.recommendation.lower()


def test_invalid_location_shap_and_uncertainty():
    """SHAP and Uncertainty engines must gracefully return available=False for invalid locations."""
    shap_res = get_shap_explainability_detail("NonExistentCityXYZ999", lead_day=6)
    assert shap_res["available"] is False

    unc_res = calculate_forecast_uncertainty_profile("NonExistentCityXYZ999")
    assert unc_res["available"] is False


def test_api_endpoints_return_unavailable_for_invalid_location():
    """FastAPI endpoints must propagate availability status without 500 errors."""
    # 1. Weather Forecast
    w_res = client.get("/api/weather/forecast?location=NonExistentCityXYZ999")
    assert w_res.status_code == 200
    data = w_res.json()
    assert data["available"] is False
    assert data["current"] is None

    # 2. Reliability Overview
    r_res = client.get("/api/reliability/overview?location=NonExistentCityXYZ999")
    assert r_res.status_code == 200
    r_data = r_res.json()
    assert r_data["available"] is False

    # 3. Daywise Reliability
    d_res = client.get("/api/reliability/daywise?location=NonExistentCityXYZ999")
    assert d_res.status_code == 200
    d_data = d_res.json()
    assert d_data["available"] is False
    assert len(d_data["days"]) == 0

    # 4. Map Confidence
    m_res = client.get("/api/map/confidence?location=NonExistentCityXYZ999")
    assert m_res.status_code == 200
    m_data = m_res.json()
    assert m_data["available"] is False


def test_weather_search_preserves_normalized_location_metadata(monkeypatch):
    from backend.services import weather_service

    class GeocodingUnavailable:
        status_code = 503

    monkeypatch.setattr(weather_service, "_safe_get", lambda *args, **kwargs: GeocodingUnavailable())
    response = client.get("/api/weather/search?q=Alappuzha")

    assert response.status_code == 200
    result = response.json()[0]
    assert result["location_id"] == "in-kl-alappuzha"
    assert result["name"] == result["city"] == "Alappuzha"
    assert result["display_name"] == "Alappuzha, Alappuzha, Kerala, India"
    assert result["district"] == "Alappuzha"
    assert result["state"] == "Kerala"
    assert result["region"] == "Alappuzha, Kerala"
    assert result["latitude"] == 9.4981
    assert result["longitude"] == 76.3388


def test_valid_location_resolution_and_isolation():
    """Valid locations must resolve to their own exact coordinates and metadata."""
    # Krishna District
    krishna_geo = geocode_location("Krishna District")
    assert krishna_geo is not None
    assert abs(krishna_geo["lat"] - 16.1875) < 0.1
    assert abs(krishna_geo["lon"] - 81.1389) < 0.1
    assert "Andhra Pradesh" in krishna_geo["region"]

    # Jaipur, Rajasthan
    jaipur_geo = geocode_location("Jaipur, Rajasthan")
    assert jaipur_geo is not None
    assert abs(jaipur_geo["lat"] - 26.9124) < 0.2
    assert "Rajasthan" in jaipur_geo["region"]

    # Coordinates must not bleed into each other
    assert abs(krishna_geo["lat"] - jaipur_geo["lat"]) > 5.0
