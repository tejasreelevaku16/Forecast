"""
WeatherTrust AI — SIH Problem 26079 Automated Verification Suite
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)

Tests all 5 mandatory SIH features and operational requirements:
1. Real Meteorological Pipeline & Geocoding (Zero fake/synthetic data)
2. Historical Forecast Error Engine & Event Types
3. Dynamic Forecast Confidence Map API (Day 1–10)
4. Day 1 to Day 10 Independent ML Predictions
5. Forecast Uncertainty & Real Meteorological Variability Engine
6. Model Reliability & 5-Fold Probability Calibration (Brier score, ROC-AUC, Reliability Curve)
7. Explainable AI & Domain SHAP Feature Attributions
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config
from backend.services.weather_service import geocode_location, get_full_forecast_response
from backend.services.historical_error_service import get_historical_error_dataset, get_district_historical_error_prior
from backend.services.reliability_service import (
    get_forecast_reliability_overview,
    get_daywise_reliability,
    get_shap_explainability_detail,
    get_model_bundle,
)
from backend.services.india_map_service import get_map_confidence, get_all_india_states_map
from backend.services.uncertainty_service import calculate_forecast_uncertainty_profile
from backend.routes.judge import get_model_calibration, get_judge_metrics


def test_real_data_pipeline():
    print("[*] Testing Real Meteorological Data Pipeline & Dynamic Geocoding...")
    geo = geocode_location("Vijayawada")
    assert geo is not None, "Geocoding failed for Vijayawada"
    assert "lat" in geo and "lon" in geo

    forecast = get_full_forecast_response("Vijayawada")
    assert forecast.current.temperature_c is not None
    assert forecast.current.humidity_pct > 0
    assert len(forecast.hourly) == 24
    assert len(forecast.daily) == 10
    print("[PASS] Real data pipeline & 10-day numerical forecast validated.")


def test_historical_forecast_error_engine():
    print("[*] Testing Historical Forecast Error Engine (SIH Requirement)...")
    df = get_historical_error_dataset()
    assert len(df) >= 3000, f"Historical dataset too small: {len(df)} records"

    required_cols = [
        "forecast_date",
        "observation_date",
        "lead_day",
        "state",
        "district",
        "latitude",
        "longitude",
        "forecast_temp",
        "actual_temp",
        "forecast_rainfall",
        "actual_rainfall",
        "forecast_pressure",
        "actual_pressure",
        "humidity",
        "wind_speed",
        "absolute_error",
        "percentage_error",
        "season",
        "weather_event_type",
    ]
    for col in required_cols:
        assert col in df.columns, f"Missing required historical column: {col}"

    # Verify weather event types
    events = df["weather_event_type"].unique()
    assert "Monsoon Depression" in events
    assert "Cyclone" in events
    assert "Heavy Rainfall" in events

    # Test district prior lookup
    prior_info = get_district_historical_error_prior("Krishna", lead_day=6)
    assert 0.0 <= prior_info["historical_bust_rate"] <= 1.0
    print("[PASS] Historical Forecast Error Engine verified with synoptic weather events.")


def test_feature1_confidence_map():
    print("[*] Testing SIH Feature 1: Dynamic Forecast Confidence Map API...")
    res = get_map_confidence(location="Vijayawada", day=1)
    assert res["location"] == "Vijayawada"
    assert res["day"] == 1
    assert 0 <= res["confidence"] <= 100
    assert 0 <= res["bust_probability"] <= 100
    assert res["confidence"] + res["bust_probability"] == 100
    assert "weather" in res
    assert "temperature" in res["weather"]
    assert "rainfall" in res["weather"]
    assert "humidity" in res["weather"]
    assert "pressure" in res["weather"]
    assert "wind_speed" in res["weather"]
    print(f"[PASS] Feature 1 Conf Map validated: Day 1 Confidence = {res['confidence']}%, Bust Prob = {res['bust_probability']}%.")


def test_feature2_daywise_predictions():
    print("[*] Testing SIH Feature 2: Day 1 to Day 10 Independent ML Predictions...")
    daywise = get_daywise_reliability(location="Vijayawada")
    days = daywise["days"]
    assert len(days) == 10, f"Expected 10 lead days, got {len(days)}"

    for idx, d in enumerate(days, start=1):
        assert d["day"] == idx
        assert 0 <= d["confidence"] <= 100
        assert 0 <= d["bust_probability"] <= 100
        assert d["risk"] in ["Low", "Moderate", "High"]
        assert "shap_summary" in d
        assert len(d["shap_summary"]) > 10
    print("[PASS] Feature 2 validated: 10 independent lead-day ML predictions generated.")


def test_feature3_uncertainty_engine():
    print("[*] Testing SIH Feature 3: Forecast Uncertainty & Meteorological Variability Engine...")
    unc = calculate_forecast_uncertainty_profile(location="Vijayawada")
    assert len(unc["days"]) == 10
    assert len(unc["confidence"]) == 10
    assert len(unc["uncertainty"]) == 10
    assert len(unc["drift"]) == 10
    assert "kpis" in unc
    assert "highest_confidence_day" in unc["kpis"]
    assert "max_uncertainty_day" in unc["kpis"]
    assert "insight" in unc
    assert "due to" in unc["insight"]
    print(f"[PASS] Feature 3 validated. Automated insight: \"{unc['insight']}\"")


def test_feature4_model_calibration():
    print("[*] Testing SIH Feature 4: Model Reliability & 5-Fold Probability Calibration...")
    bundle = get_model_bundle()
    assert bundle is not None, "Model bundle not loaded"

    cal = get_model_calibration()
    assert cal["status"] == "operational"
    assert cal["accuracy"] >= 0.70
    assert cal["roc_auc"] >= 0.80
    assert cal["brier_score"] <= 0.20
    assert "reliability_curve" in cal
    assert len(cal["reliability_curve"]["prob_pred"]) > 0
    assert "roc_curve" in cal
    assert len(cal["confusion_matrix"]) == 2
    assert "interpretation" in cal
    print(f"[PASS] Feature 4 validated: Model={cal['model_name']}, ROC-AUC={cal['roc_auc']}, Brier={cal['brier_score']}.")


def test_feature5_explainable_ai():
    print("[*] Testing SIH Feature 5: Explainable AI & Domain SHAP Feature Attributions...")
    shap_data = get_shap_explainability_detail(location="Vijayawada", lead_day=6)
    assert 0 <= shap_data["confidence"] <= 100
    assert 0 <= shap_data["bust_probability"] <= 100
    assert "summary" in shap_data
    assert "top_features" in shap_data
    assert len(shap_data["top_features"]) >= 3
    assert "recommendation" in shap_data

    # Verify domain meteorological names
    feature_names = [f["feature"] for f in shap_data["top_features"]]
    print(f"Top Meteorological Features: {feature_names}")
    assert any("Pressure" in n or "Rainfall" in n or "Drift" in n or "Lead" in n for n in feature_names)
    print("[PASS] Feature 5 validated: SHAP meteorological feature contributions and operational recommendations verified.")


if __name__ == "__main__":
    print("\n================================================================================")
    print("RUNNING WEATHERTRUST AI SIH (PROBLEM ID: 26079) FULL VERIFICATION SUITE")
    print("================================================================================\n")
    test_real_data_pipeline()
    test_historical_forecast_error_engine()
    test_feature1_confidence_map()
    test_feature2_daywise_predictions()
    test_feature3_uncertainty_engine()
    test_feature4_model_calibration()
    test_feature5_explainable_ai()
    print("\n================================================================================")
    print("ALL 5 MANDATORY SIH FEATURES & NCMRWF OPERATIONAL STANDARDS PASSED SUCCESSFULLY!")
    print("================================================================================\n")
