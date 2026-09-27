"""
Unit and Integration Tests for Interactive India State-Level Reliability Map (SIH Map Correction)
Validates India State/UT GeoJSON, ML-backed state reliability metrics, and backend map endpoints.
"""

import sys
import json
from pathlib import Path
import requests

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.services.india_map_service import (
    INDIAN_STATES,
    INDIAN_DISTRICTS,
    get_all_india_states_map,
    get_states_reliability_dict,
)
from backend.services.weather_service import reverse_geocode
from backend.routes.weather import locate_weather

BASE_URL = "http://127.0.0.1:8000"

REQUIRED_STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chhattisgarh",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Delhi",
    "Jammu & Kashmir",
    "Ladakh",
]


def test_india_states_geojson_file():
    """Verify that frontend/data/india_states.geojson exists and contains all required Indian states/UTs."""
    geojson_path = PROJECT_ROOT / "frontend" / "data" / "india_states.geojson"
    assert geojson_path.exists(), f"GeoJSON file missing at {geojson_path}"

    with open(geojson_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert data.get("type") == "FeatureCollection"
    features = data.get("features", [])
    assert len(features) >= 36, f"Expected >= 36 features, found {len(features)}"

    feature_names = set(
        f["properties"].get("state_name") or f["properties"].get("ST_NM")
        for f in features
    )

    for req_st in REQUIRED_STATES:
        assert req_st in feature_names, f"Required state '{req_st}' missing from GeoJSON!"

    print(f"[PASS] Local India GeoJSON verified with {len(features)} state/UT features covering all {len(REQUIRED_STATES)} required regions.")


def test_states_reliability_service():
    """Verify that the ML reliability model computes predictions for all 37 Indian states and UTs."""
    states_data = get_all_india_states_map()
    assert len(states_data) >= 36

    # Verify Andhra Pradesh benchmark specifically
    ap_data = next((s for s in states_data if s["state_name"] == "Andhra Pradesh"), None)
    assert ap_data is not None, "Andhra Pradesh data missing"
    assert ap_data["trust_score"] == 24
    assert ap_data["bust_probability"] == 76
    assert ap_data["bust_risk"] == "High Risk"
    assert ap_data["confidence"] == "Low"
    assert ap_data["reliability_level"] == "LOW"
    assert ap_data["color"] == "#ef4444"
    assert ap_data["drift"] == 55.0

    for st in states_data:
        assert "region" in st and "state_name" in st
        assert 0 <= st["trust_score"] <= 100
        assert 0 <= st["bust_probability"] <= 100
        assert st["trust_score"] + st["bust_probability"] == 100
        assert st["bust_risk"] in ["High Risk", "Moderate Risk", "Low Risk"]
        assert st["confidence"] in ["High", "Moderate", "Low"]
        assert st["reliability_level"] in ["HIGH", "MODERATE", "LOW"]
        assert st["color"] in ["#10b981", "#f59e0b", "#ef4444"]
        assert len(st["forecast"]) > 5
        assert len(st["primary_driver"]) > 5

    print(f"[PASS] State reliability service validated for {len(states_data)} states using calibrated ML model.")


def test_api_map_data_endpoint():
    """Verify that GET /api/map-data returns the complete state reliability array."""
    resp = requests.get(f"{BASE_URL}/api/map-data")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 36
    ap = next((s for s in data if s["state_name"] == "Andhra Pradesh"), None)
    assert ap is not None
    assert ap["trust_score"] == 24
    assert ap["bust_probability"] == 76
    assert ap["bust_risk"] == "High Risk"
    assert ap["drift"] == 55.0
    assert ap["confidence"] == "Low"
    print(f"[PASS] GET /api/map-data endpoint returned {len(data)} state reliability records.")


def test_api_map_states_dict_endpoint():
    """Verify that GET /api/map/states returns a dictionary for rapid O(1) map rendering."""
    resp = requests.get(f"{BASE_URL}/api/map/states")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    for st in ["Andhra Pradesh", "Telangana", "Karnataka", "Tamil Nadu", "Maharashtra", "Delhi"]:
        assert st in data, f"State '{st}' missing from states dictionary"
    print(f"[PASS] GET /api/map/states endpoint verified with {len(data)} key-value entries.")


def test_gps_reverse_geocode_and_locate():
    """Verify reverse geocoding and locate weather endpoints continue functioning."""
    geo_krishna = reverse_geocode(16.51, 80.65)
    assert geo_krishna["name"] == "Krishna District"

    resp = locate_weather(lat=16.51, lon=80.65)
    assert resp.current is not None
    print("[PASS] GPS locate endpoint validated.")


if __name__ == "__main__":
    print("\n--- Running Interactive India State Reliability Map Test Suite ---")
    test_india_states_geojson_file()
    test_states_reliability_service()
    test_api_map_data_endpoint()
    test_api_map_states_dict_endpoint()
    test_gps_reverse_geocode_and_locate()
    print("ALL INDIA MAP TESTS PASSED!\n")
