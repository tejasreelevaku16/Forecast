"""
WeatherTrust AI — Real TreeExplainer SHAP & Data Provenance Test Suite
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
SIH Problem ID: 26079: AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts

Validates:
1. Real TreeExplainer execution and non-simulated SHAP values
2. Feature order preservation across training, model, and explainability
3. Transparent provenance tags on all operational outputs
"""

import pytest
import joblib
import numpy as np

import config
from ml.feature_engineering import FEATURE_COLUMNS, extract_features_for_inference
from ml.explain import compute_shap_explanations, get_tree_explainer
from backend.services.reliability_service import get_model_bundle, get_forecast_reliability_overview
from backend.services.drift_service import get_location_drift_summary


def test_shap_tree_explainer_real_attribution():
    """Verify shap.TreeExplainer runs on the real trained model bundle with genuine attribution."""
    bundle = get_model_bundle()
    assert bundle is not None, "Model bundle must be trained and persisted."
    assert "model" in bundle and "raw_model" in bundle and "scaler" in bundle

    raw_model = bundle["raw_model"]
    scaler = bundle["scaler"]

    # Construct test sample feature dict
    feat_dict = {
        "lead_day": 6.0,
        "lead_day_sq": 36.0,
        "forecast_rainfall": 45.0,
        "forecast_temp": 32.0,
        "forecast_pressure": 1004.0,
        "humidity": 82.0,
        "wind_speed": 24.0,
        "run_drift_rainfall_mm": 18.0,
        "pressure_drop": 9.25,
        "convective_instability": 36.9,
        "rainfall_variability": 27.45,
        "sin_month": -0.5,
        "cos_month": -0.866,
        "historical_error_prior": 0.40,
        "is_cyclone_or_depression": 1.0,
        "is_heat_wave": 0.0,
    }

    res = compute_shap_explanations(
        feature_dict=feat_dict,
        feature_names=bundle["feature_names"],
        raw_model=raw_model,
        scaler=scaler,
        bust_prob_pct=65
    )

    assert res["status"] == "success"
    assert res["method"] == "shap.TreeExplainer"
    assert len(res["top_features"]) > 0
    assert "all_shap_values" in res
    assert len(res["all_shap_values"]) == len(FEATURE_COLUMNS)

    # Check top feature has genuine float SHAP attribution
    top_f = res["top_features"][0]
    assert "shap_value" in top_f
    assert isinstance(top_f["shap_value"], float)
    assert top_f["direction"] in ["Positive", "Negative"]
    assert res["provenance"]["feature_alignment_verified"] is True


def test_data_provenance_labels():
    """Verify that operational responses include transparent data provenance."""
    # Reliability overview
    rel = get_forecast_reliability_overview(location="Vijayawada", focus_lead_day=6)
    assert rel is not None
    assert rel.confidence_label in ["HIGH CONFIDENCE", "MODERATE CONFIDENCE", "LOW CONFIDENCE", "DATA UNAVAILABLE"]

    # Drift summary provenance
    drift = get_location_drift_summary(location="Vijayawada", focus_lead_day=6)
    assert "provenance" in drift
    assert drift["provenance"] in ["HISTORICAL_BENCHMARK_DRIFT", "LIVE_SUCCESSIVE_NWP_RUNS", "UNAVAILABLE"]
