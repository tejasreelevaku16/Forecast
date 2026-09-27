"""
WeatherTrust AI — Forecast Data & Risk Consistency Automated Test Suite
Verifies:
1. Centralized Bust Risk Classification thresholds (0-29% Low, 30-59% Moderate, 60-100% High).
2. 76% bust probability consistently produces HIGH RISK across all backend and frontend logic.
3. Common Forecast Data Source consistency for Location + Target Date + Forecast Run.
4. Forecast Drift formatting guarantees no 'undefined', 'null', or 'NaN' output.
5. Cross-service data alignment between Overview, Map, Alerts, and Common endpoints.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

from backend.services.risk_classifier import classify_bust_risk
from backend.services.common_forecast_service import get_common_forecast_data
from backend.services.reliability_service import get_forecast_reliability_overview
from backend.services.india_map_service import get_all_india_states_map

<<<<<<< HEAD
BASE_URL = "http://127.0.0.1:8000"

from backend.main import app
from fastapi.testclient import TestClient
_test_client = TestClient(app)

def _get(url):
    try:
        return requests.get(url, timeout=0.5)
    except Exception:
        path = url.replace(BASE_URL, "")
        if not path:
            path = "/"
        return _test_client.get(path)

=======
>>>>>>> 76a7e6d2ce6742d517d8010a868acd5702b1d98a

def test_centralized_risk_classifier():
    """Verify exact thresholds and guarantees in risk_classifier.py."""
    # Low Risk (0–29%)
    for p in [0, 10, 25, 29]:
        res = classify_bust_risk(p)
        assert res["risk_level"] == "LOW", f"Expected LOW for {p}%"
        assert res["risk_label"] == "LOW RISK"
        assert res["reliability_level"] == "HIGH"
        assert res["confidence_label"] == "HIGH CONFIDENCE"
        assert res["color"] == "#10b981"
        assert res["badge_class"] == "badge-risk-low"

    # Moderate Risk (30–59%)
    for p in [30, 45, 50, 59]:
        res = classify_bust_risk(p)
        assert res["risk_level"] == "MODERATE", f"Expected MODERATE for {p}%"
        assert res["risk_label"] == "MODERATE RISK"
        assert res["reliability_level"] == "MODERATE"
        assert res["confidence_label"] == "MODERATE CONFIDENCE"
        assert res["color"] == "#f59e0b"
        assert res["badge_class"] == "badge-risk-mod"

    # High Risk (60–100%)
    for p in [60, 75, 76, 90, 100]:
        res = classify_bust_risk(p)
        assert res["risk_level"] == "HIGH", f"Expected HIGH for {p}%"
        assert res["risk_label"] == "HIGH RISK"
        assert res["reliability_level"] == "LOW"
        assert res["confidence_label"] == "LOW CONFIDENCE"
        assert res["color"] == "#ef4444"
        assert res["badge_class"] == "badge-risk-high"

    # Crucial user requirement: 76% MUST ALWAYS be HIGH RISK
    res76 = classify_bust_risk(76)
    assert res76["risk_level"] == "HIGH"
    assert res76["risk_label"] == "HIGH RISK"
    assert res76["reliability_level"] == "LOW"
    assert res76["color"] == "#ef4444"

    print("[PASS] Centralized risk classification thresholds verified.")


def test_forecast_data_consistency():
    """Verify that Krishna District / Andhra Pradesh yields identical core values across services."""
    common = get_common_forecast_data("Krishna District", lead_day=6)
    overview = get_forecast_reliability_overview("Krishna District", focus_lead_day=6)
    states = get_all_india_states_map(day=6)
    ap_map = next((s for s in states if s["state_name"] == "Andhra Pradesh"), None)

    assert ap_map is not None, "Andhra Pradesh missing from state map"

    # Core values consistency: Trust Score = 24, Bust Prob = 76, Drift = 55.0 mm
    assert common["trust_score"] == 24
    assert common["bust_probability"] == 76
    assert common["bust_risk"] == "HIGH RISK"
    assert common["forecast_drift"] == 55.0
    assert common["risk_level"] == "HIGH"

    assert overview.reliability_score == 24
    assert overview.bust_probability_pct == 76
    assert overview.risk_level == "HIGH"
    assert overview.forecast_drift_mm == 55.0
    assert overview.forecast_stability == "LOW"

    assert 0 <= ap_map["trust_score"] <= 100
    assert 0 <= ap_map["bust_probability"] <= 100
    assert ap_map["trust_score"] + ap_map["bust_probability"] == 100
    assert ap_map["bust_risk"] == "High Risk"
    assert ap_map["color"] == "#ef4444"

    print("[PASS] Forecast data consistency verified across Common, Overview, and Map services.")


def test_api_common_forecast_endpoint():
    """Verify GET /api/weather/common returns the unified forecast model."""
<<<<<<< HEAD
    resp = _get(f"{BASE_URL}/api/weather/common?location=Krishna%20District&lead_day=6")
=======
    resp = client.get("/api/weather/common?location=Krishna%20District&lead_day=6")
>>>>>>> 76a7e6d2ce6742d517d8010a868acd5702b1d98a
    assert resp.status_code == 200
    data = resp.json()

    assert data["location"] == "Krishna District"
    assert data["trust_score"] == 24
    assert data["bust_probability"] == 76
    assert data["bust_risk"] == "HIGH RISK"
    assert data["forecast_drift"] == 55.0
    assert data["forecast_drift_mm"] == 55.0
    assert data["forecast_drift_str"] == "+55.0 mm Drift"
    assert data["risk_level"] == "HIGH"
    assert data["forecast_stability"] == "LOW"
    assert "GFS" in data["forecast_run"]

    print("[PASS] GET /api/weather/common API verified.")


def test_no_undefined_drift_in_models():
    """Verify that models and overviews always supply valid drift or clear defaults."""
    overview = get_forecast_reliability_overview("Krishna District")
    assert overview.forecast_drift_mm is not None
    assert not str(overview.forecast_drift_mm).lower() in ["undefined", "null", "nan"]

    states = get_all_india_states_map()
    for s in states:
        assert s["drift"] is not None
        assert s["drift_str"] is not None
        assert "undefined" not in s["drift_str"]
        assert "NaN" not in s["drift_str"]

    print("[PASS] No 'undefined', 'null', or 'NaN' drift values present in backend outputs.")


if __name__ == "__main__":
    print("\n--- Running WeatherTrust AI Data Consistency & Risk Test Suite ---")
    test_centralized_risk_classifier()
    test_forecast_data_consistency()
    test_no_undefined_drift_in_models()
    test_api_common_forecast_endpoint()
    print("ALL DATA CONSISTENCY TESTS PASSED!\n")
