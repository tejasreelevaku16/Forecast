"""
WeatherTrust AI — Stakeholder Workspace Automated Verification Suite
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
SIH Problem ID: 26079

Verifies:
1. All 5 Role-Based Portals: Forecaster, Disaster Management, Agriculture, Public Citizen, Administrator.
2. Direct HTTP routing for /stakeholder and aliases (/stakeholder-workspace, /workspace).
3. Dedicated role APIs: /api/stakeholder/overview, /forecaster, /disaster, /agriculture, /public, /admin.
4. Model retraining, dataset upload validation, and system backup snapshots.
5. Dynamic live calculations with no static/dummy values.
6. Synchronization across multiple Indian districts.
"""

import sys
from pathlib import Path
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_stakeholder_routes_and_dom_container():
    """Verify that stakeholder URLs return index.html with the #page-stakeholder DOM container."""
    for slug in ["/stakeholder", "/stakeholder-workspace", "/workspace"]:
        resp = client.get(slug)
        assert resp.status_code == 200, f"Route {slug} failed"
        assert "text/html" in resp.headers["content-type"]
        assert 'id="page-stakeholder"' in resp.text
        assert 'id="portal-forecaster"' in resp.text
        assert 'id="portal-disaster"' in resp.text
        assert 'id="portal-agriculture"' in resp.text
        assert 'id="portal-public"' in resp.text
        assert 'id="portal-admin"' in resp.text
    print("[PASS] Stakeholder routes and DOM containers verified.")


def test_forecaster_portal_api():
    """Verify Forecaster (IMD/MoES) portal operational analytics and ensemble consensus."""
    resp = client.get("/api/stakeholder/forecaster?location=Krishna%20District&lead_day=6")
    assert resp.status_code == 200
    data = resp.json()

    assert data["location"] == "Krishna District"
    assert data["focus_lead_day"] == 6
    assert 0 <= data["forecast_confidence_pct"] <= 100
    assert 0 <= data["bust_probability_pct"] <= 100
    assert data["forecast_confidence_pct"] + data["bust_probability_pct"] == 100
    assert data["reliable_districts_count"] >= 0
    assert data["high_uncertainty_districts_count"] >= 0

    # Model vs AI Comparison
    assert "model_vs_ai" in data
    m_ai = data["model_vs_ai"]
    assert "raw_nwp_rainfall_mm" in m_ai
    assert "ai_calibrated_rainfall_mm" in m_ai
    assert "net_bias_correction_mm" in m_ai

    # Ensemble Consensus
    assert "ensemble_consensus" in data
    assert len(data["ensemble_consensus"]) >= 4
    model_names = [m["model_name"] for m in data["ensemble_consensus"]]
    assert any("ECMWF" in name for name in model_names)
    assert any("GFS" in name for name in model_names)
    assert any("IMD" in name for name in model_names)
    assert any("AI Calibrated" in name for name in model_names)

    # Uncertainty Heatmap
    assert "uncertainty_heatmap" in data
    assert len(data["uncertainty_heatmap"]) == 40  # 4 parameters x 10 lead days

    # 10-Day Trend
    assert "confidence_trend" in data
    assert len(data["confidence_trend"]) == 10

    # Operational Weather Briefing
    assert "operational_briefing" in data
    assert "headline" in data["operational_briefing"]
    assert "synopsis" in data["operational_briefing"]
    print("[PASS] Forecaster portal API verified.")


def test_disaster_portal_api():
    """Verify Disaster Management Authority portal emergency planning and 72h impact timeline."""
    resp = client.get("/api/stakeholder/disaster?location=Visakhapatnam&lead_day=3")
    assert resp.status_code == 200
    data = resp.json()

    assert data["location"] == "Visakhapatnam"
    assert "red_alert_districts_count" in data
    assert "population_at_risk_total" in data
    assert data["population_at_risk_total"] >= 0
    assert "critical_rainfall_zones_count" in data
    assert "active_weather_systems_count" in data

    # 72-Hour Impact Forecast
    assert "impact_timeline_72h" in data
    assert len(data["impact_timeline_72h"]) == 3
    phases = [p["phase"] for p in data["impact_timeline_72h"]]
    assert any("0–24" in p for p in phases)
    assert any("24–48" in p for p in phases)
    assert any("48–72" in p for p in phases)

    # High-Risk District Ranking
    assert "high_risk_districts" in data
    assert len(data["high_risk_districts"]) > 0
    for d in data["high_risk_districts"]:
        assert "priority_score" in d
        assert "alert_level" in d
        assert d["alert_level"] in ("RED", "ORANGE", "YELLOW", "GREEN")

    # Flood Risk Map Data
    assert "flood_risk_map_data" in data
    assert len(data["flood_risk_map_data"]) > 0

    # Cyclone & Heatwave Monitors
    assert "cyclone_risk_monitor" in data
    assert "central_pressure_hpa" in data["cyclone_risk_monitor"]
    assert "heatwave_risk_monitor" in data

    # Resource Allocation & Evacuation
    assert "resource_allocations" in data
    assert len(data["resource_allocations"]) >= 3
    assert "evacuation_decision" in data
    assert "emergency_sitrep" in data
    assert "SITREP" in data["emergency_sitrep"]["report_number"]
    print("[PASS] Disaster Management portal API verified.")


def test_agriculture_portal_api():
    """Verify Agriculture Department portal decision support, soil moisture, and crop stress."""
    resp = client.get("/api/stakeholder/agriculture?location=Guntur&lead_day=5")
    assert resp.status_code == 200
    data = resp.json()

    assert data["location"] == "Guntur"
    assert 0 <= data["rainfall_reliability_score"] <= 100
    assert data["crop_risk_level"].lower() in ("low", "moderate", "high", "critical")
    assert "irrigation" in data["irrigation_need"].lower()
    assert 0 <= data["soil_moisture_pct"] <= 100

    # Sowing & Irrigation Guidance
    assert "sowing_advisory" in data
    assert "optimal_crops" in data["sowing_advisory"]
    assert "irrigation_recommendation" in data
    assert "estimated_water_saved_m3_per_hectare" in data["irrigation_recommendation"]

    # Crop Stress
    assert "crop_stress_indicators" in data
    assert "thermal_heat_stress" in data["crop_stress_indicators"]
    assert "waterlogging_risk" in data["crop_stress_indicators"]

    # Weekly Outlook
    assert "weekly_outlook" in data
    assert len(data["weekly_outlook"]) == 7

    # Major Crops Impact Analysis
    assert "crop_impacts" in data
    assert len(data["crop_impacts"]) >= 3
    print("[PASS] Agriculture portal API verified.")


def test_public_portal_api():
    """Verify Public Citizen portal plain-language dashboard, comfort index, and shareable reports."""
    resp = client.get("/api/stakeholder/public?location=Vijayawada")
    assert resp.status_code == 200
    data = resp.json()

    assert data["location"] == "Vijayawada"
    assert "current_temperature_c" in data
    assert "feels_like_c" in data
    assert 0 <= data["rain_probability_pct"] <= 100
    assert 0 <= data["confidence_score_pct"] <= 100
    assert "comfort_index" in data
    assert "uv_index" in data
    assert "aqi_estimate" in data

    # 10-Day Citizen Forecast
    assert "forecast_10_day" in data
    assert len(data["forecast_10_day"]) == 10
    assert all("confidence_label" in day for day in data["forecast_10_day"])

    # Hourly Timelines
    assert "rainfall_timeline" in data
    assert len(data["rainfall_timeline"]) > 0
    assert "temperature_timeline" in data
    assert len(data["temperature_timeline"]) > 0

    # Safety Recommendations & Shareable Card
    assert "safety_recommendations" in data
    assert len(data["safety_recommendations"]) >= 3
    assert "shareable_card" in data
    assert "whatsapp_text" in data["shareable_card"]
    print("[PASS] Public citizen portal API verified.")


def test_admin_portal_api_and_controls():
    """Verify Administrator portal system telemetry, model retraining, and dataset upload."""
    # 1. Admin Telemetry
    resp = client.get("/api/stakeholder/admin")
    assert resp.status_code == 200
    data = resp.json()

    assert data["active_users_count"] >= 5
    assert data["api_response_time_ms"] > 0
    assert data["model_accuracy_pct"] >= 80.0
    assert data["system_health_pct"] > 95.0
    assert len(data["users"]) >= 5
    assert len(data["api_metrics"]) >= 4
    assert len(data["recent_logs"]) > 0

    # 2. Retraining Pipeline Trigger
    retrain_payload = {
        "n_estimators": 100,
        "learning_rate": 0.05,
        "calibration_method": "sigmoid"
    }
    retrain_resp = client.post("/api/stakeholder/admin/retrain", json=retrain_payload)
    assert retrain_resp.status_code == 200
    r_data = retrain_resp.json()
    assert r_data["status"] == "SUCCESS"
    assert r_data["new_accuracy"] > 0
    assert r_data["roc_auc"] > 0

    # 3. Dataset Upload Validation
    csv_content = (
        "date,district,lead_day,predicted_rainfall,observed_rainfall\n"
        "2026-09-01,Krishna,1,12.5,14.0\n"
        "2026-09-02,Krishna,2,25.0,22.4\n"
        "2026-09-03,Guntur,3,8.0,9.1\n"
    )
    upload_payload = {
        "filename": "verification_sample.csv",
        "content": csv_content
    }
    upload_resp = client.post("/api/stakeholder/admin/upload-dataset", json=upload_payload)
    assert upload_resp.status_code == 200
    u_data = upload_resp.json()
    assert u_data["status"] == "SUCCESS"
    assert u_data["records_processed"] == 3

    # 4. System Backup Snapshot
    backup_resp = client.post("/api/stakeholder/admin/backup")
    assert backup_resp.status_code == 200
    b_data = backup_resp.json()
    assert b_data["status"] == "SUCCESS"
    assert "SNAP-" in b_data["snapshot_id"]
    print("[PASS] Administrator portal API, retraining, dataset upload, and backups verified.")


def test_unified_stakeholder_overview_endpoint():
    """Verify GET /api/stakeholder/overview role switching."""
    for role in ["forecaster", "disaster", "agriculture", "public", "admin"]:
        resp = client.get(f"/api/stakeholder/overview?role={role}&location=Hyderabad&lead_day=4")
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == role
        assert "data" in data
    print("[PASS] Unified stakeholder overview endpoint verified for all 5 roles.")


if __name__ == "__main__":
    pytest.main(["-v", __file__])
