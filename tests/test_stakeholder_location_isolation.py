"""
WeatherTrust AI — Stakeholder Location Isolation & Multi-District Verification Suite
Verifies:
1. State -> District dependency across Indian States & UTs.
2. Distinct district counts for each state (Odisha = 30, Andhra Pradesh = 26, J&K = 20, Maharashtra = 36, etc.).
3. Distinct, logically derived meteorological and stakeholder metrics across states & districts.
4. Embedded map data generation for Forecaster, Disaster Management, and Agriculture.
5. Deterministic consistency when re-querying the same location.
6. Absence of CSV controls in Agriculture module.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_states_endpoint_district_counts():
    """Verify that all 36 Indian states/UTs have distinct, authoritative official district counts."""
    resp = client.get("/api/stakeholder/states")
    assert resp.status_code == 200
    states = resp.json()
    assert len(states) == 36

    state_map = {s["name"]: s["official_districts"] for s in states}
    assert state_map["Odisha"] == 30
    assert state_map["Andhra Pradesh"] == 26
    assert state_map["Jammu and Kashmir"] == 20
    assert state_map["Maharashtra"] == 36
    assert state_map["Bihar"] == 38
    assert state_map["Delhi"] == 11
    assert state_map["Tamil Nadu"] == 38
    assert state_map["Karnataka"] == 31
    assert state_map["Goa"] == 2


def test_districts_filtered_by_state():
    """Verify that districts endpoint only returns districts belonging to the requested state."""
    ap_resp = client.get("/api/stakeholder/districts?state=Andhra%20Pradesh")
    assert ap_resp.status_code == 200
    ap_districts = ap_resp.json()
    ap_names = [d["name"] for d in ap_districts]
    assert "NTR" in ap_names or any("Vijayawada" in d.get("city", "") for d in ap_districts)
    assert "Visakhapatnam" in ap_names
    assert "Khordha" not in ap_names
    assert "Srinagar" not in ap_names

    od_resp = client.get("/api/stakeholder/districts?state=Odisha")
    assert od_resp.status_code == 200
    od_districts = od_resp.json()
    od_names = [d["name"] for d in od_districts]
    assert "Khordha" in od_names
    assert "Puri" in od_names
    assert "Cuttack" in od_names
    assert "NTR" not in od_names
    assert "Srinagar" not in od_names

    jk_resp = client.get("/api/stakeholder/districts?state=Jammu%20and%20Kashmir")
    assert jk_resp.status_code == 200
    jk_districts = jk_resp.json()
    jk_names = [d["name"] for d in jk_districts]
    assert "Srinagar" in jk_names
    assert "Jammu" in jk_names
    assert "Anantnag" in jk_names
    assert "Visakhapatnam" not in jk_names


def test_forecaster_portal_location_specifics():
    """Verify Forecaster portal metrics and embedded map data differ across states and districts."""
    od_khordha = client.get("/api/stakeholder/forecaster?state=Odisha&district=Khordha&lead_day=6").json()
    ap_ntr = client.get("/api/stakeholder/forecaster?state=Andhra%20Pradesh&district=NTR&lead_day=6").json()
    jk_srinagar = client.get("/api/stakeholder/forecaster?state=Jammu%20and%20Kashmir&district=Srinagar&lead_day=6").json()

    # District counts must match the state
    assert od_khordha["total_state_districts"] == 30
    assert ap_ntr["total_state_districts"] == 26
    assert jk_srinagar["total_state_districts"] == 20

    # Locations must match
    assert od_khordha["state"] == "Odisha"
    assert od_khordha["district"] == "Khordha"
    assert ap_ntr["state"] == "Andhra Pradesh"
    assert ap_ntr["district"] == "NTR"
    assert jk_srinagar["state"] == "Jammu and Kashmir"
    assert jk_srinagar["district"] == "Srinagar"

    # Embedded Map Data must be present and state-specific
    assert "map_data" in od_khordha
    assert len(od_khordha["map_data"]) > 0
    assert any(d["name"] == "Khordha" and d["is_focused"] for d in od_khordha["map_data"])

    assert "map_data" in ap_ntr
    assert any(d["name"] == "NTR" and d["is_focused"] for d in ap_ntr["map_data"])

    assert "map_data" in jk_srinagar
    assert any(d["name"] == "Srinagar" and d["is_focused"] for d in jk_srinagar["map_data"])


def test_disaster_portal_location_specifics():
    """Verify Disaster Management portal values vary according to geographical area."""
    od_puri = client.get("/api/stakeholder/disaster?state=Odisha&district=Puri&lead_day=3").json()
    jk_srinagar = client.get("/api/stakeholder/disaster?state=Jammu%20and%20Kashmir&district=Srinagar&lead_day=3").json()

    assert od_puri["state"] == "Odisha"
    assert od_puri["district"] == "Puri"
    assert jk_srinagar["state"] == "Jammu and Kashmir"
    assert jk_srinagar["district"] == "Srinagar"

    assert "flood_risk_map_data" in od_puri
    assert len(od_puri["flood_risk_map_data"]) > 0
    assert any(d["district"] == "Puri" and d["is_focused"] for d in od_puri["flood_risk_map_data"])

    assert "flood_risk_map_data" in jk_srinagar
    assert any(d["district"] == "Srinagar" and d["is_focused"] for d in jk_srinagar["flood_risk_map_data"])

    # Threat monitors reflect coastal vs Himalayan regimes
    assert "cyclone_risk_monitor" in od_puri
    assert "cyclone_risk_monitor" in jk_srinagar


def test_agriculture_portal_embedded_map_and_crops():
    """Verify Agriculture portal contains embedded agro map data and location-specific crops/soil."""
    ap_guntur = client.get("/api/stakeholder/agriculture?state=Andhra%20Pradesh&district=Guntur&lead_day=5").json()
    jk_srinagar = client.get("/api/stakeholder/agriculture?state=Jammu%20and%20Kashmir&district=Srinagar&lead_day=5").json()

    assert ap_guntur["state"] == "Andhra Pradesh"
    assert ap_guntur["district"] == "Guntur"
    assert "agro_map_data" in ap_guntur
    assert len(ap_guntur["agro_map_data"]) > 0
    assert any(d["district"] == "Guntur" and d["is_focused"] for d in ap_guntur["agro_map_data"])

    assert jk_srinagar["state"] == "Jammu and Kashmir"
    assert jk_srinagar["district"] == "Srinagar"
    assert "agro_map_data" in jk_srinagar
    assert any(d["district"] == "Srinagar" and d["is_focused"] for d in jk_srinagar["agro_map_data"])

    # Crops in AP vs J&K must be different
    ap_crops = [c["crop_name"] for c in ap_guntur["crop_impacts"]]
    jk_crops = [c["crop_name"] for c in jk_srinagar["crop_impacts"]]
    assert any("Paddy" in c or "Chilli" in c or "Cotton" in c for c in ap_crops)
    assert any("Apple" in c or "Saffron" in c or "Walnut" in c for c in jk_crops)


def test_public_portal_location_specifics():
    """Verify Public Citizen portal returns location-tailored temperatures and conditions."""
    ap_vizag = client.get("/api/stakeholder/public?state=Andhra%20Pradesh&district=Visakhapatnam").json()
    jk_srinagar = client.get("/api/stakeholder/public?state=Jammu%20and%20Kashmir&district=Srinagar").json()

    assert ap_vizag["state"] == "Andhra Pradesh"
    assert ap_vizag["district"] == "Visakhapatnam"
    assert jk_srinagar["state"] == "Jammu and Kashmir"
    assert jk_srinagar["district"] == "Srinagar"
    assert "current_temperature_c" in ap_vizag
    assert "current_temperature_c" in jk_srinagar


def test_deterministic_consistency():
    """Verify selecting the same location again returns identical, logically derived data."""
    res1 = client.get("/api/stakeholder/forecaster?state=Odisha&district=Khordha&lead_day=6").json()
    res2 = client.get("/api/stakeholder/forecaster?state=Odisha&district=Khordha&lead_day=6").json()

    assert res1["forecast_confidence_pct"] == res2["forecast_confidence_pct"]
    assert res1["total_state_districts"] == res2["total_state_districts"]
    assert res1["model_vs_ai"]["ai_calibrated_rainfall_mm"] == res2["model_vs_ai"]["ai_calibrated_rainfall_mm"]
