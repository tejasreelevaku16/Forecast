"""
Unit and Integration Tests for Forecast Trust & Machine Learning Inference (Phase 16)
Tests model loading, probability inference, explainability factors, and sector decision support.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config
from backend.services.reliability_service import get_model_bundle, get_forecast_reliability_overview
from backend.services.decision_service import get_sector_recommendation
from backend.routes.alerts import get_reliability_alerts


def test_ml_model_loading():
    bundle = get_model_bundle()
    assert bundle is not None, "Trained ML model bundle must exist and load successfully"
    assert "model" in bundle
    assert "scaler" in bundle
    assert "metrics" in bundle
    assert bundle["metrics"]["roc_auc"] >= 0.75
    print(f"[PASS] ML model loaded ({bundle['best_model_name']}, Test ROC-AUC: {bundle['metrics']['roc_auc']:.4f}).")


def test_forecast_trust_overview():
    overview = get_forecast_reliability_overview("Krishna District", focus_lead_day=6)
    assert 0 <= overview.reliability_score <= 100
    assert 0 <= overview.bust_probability_pct <= 100
    assert overview.reliability_score == 100 - overview.bust_probability_pct
    assert overview.risk_level in ["LOW", "MODERATE", "HIGH"]
    assert len(overview.lead_days) == 10
    assert len(overview.reasons) >= 1
    assert "IMD" in overview.disclaimer
    print(f"[PASS] Reliability Overview verified (Trust: {overview.reliability_score}/100, Bust: {overview.bust_probability_pct}%).")


def test_sector_decision_support():
    sectors = config.SUPPORTED_SECTORS
    for sec in sectors:
        rec = get_sector_recommendation(
            sector=sec,
            bust_prob_pct=76,
            reliability_score=24,
            lead_day=6,
            rain_mm=80.0
        )
        assert rec["sector"] == sec
        assert rec["risk_tier"] == "HIGH_RISK"
        assert len(rec["action_text"]) > 20
    print(f"[PASS] All {len(sectors)} sector decision personas verified.")


def test_proactive_reliability_alerts():
    alerts_data = get_reliability_alerts("Krishna District")
    assert "alerts" in alerts_data
    assert alerts_data["active_alerts_count"] >= 1
    print(f"[PASS] Proactive alerts verified ({alerts_data['active_alerts_count']} alerts active).")


if __name__ == "__main__":
    print("\n--- Running Forecast Trust & ML Test Suite ---")
    test_ml_model_loading()
    test_forecast_trust_overview()
    test_sector_decision_support()
    test_proactive_reliability_alerts()
    print("ALL RELIABILITY & ML TESTS PASSED!\n")
