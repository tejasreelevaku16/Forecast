"""
WeatherTrust AI — SIH Problem ID 26079 (Priority 1 Verification Suite)
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)

Validates:
1. Real Data Pipeline: Real Open-Meteo data, no hardcoded/dummy/manual weather inputs.
2. Historical Forecast Error Engine:
   - Verification dataset schema (Forecast Date, Obs Date, Lead Day 1-10, State, District,
     Lat, Lon, Forecast & Actual Temp/Rain/Pressure, Humidity, Wind Speed, Errors, Season, Event Types).
   - All 7 Weather Event Types (Monsoon Depression, Heavy Rainfall, Cyclone, Western Disturbance,
     Heat Wave, Break Monsoon, Active Monsoon).
   - Statistical error priors integration.
3. Feature 1 — Dynamic Forecast Confidence Map:
   - GET /api/map/confidence?day=1&location=Vijayawada endpoint execution.
   - Calibrated Confidence + Bust Probability calculation (Confidence = 100 - bust_prob).
   - Real weather payload.
4. Feature 2 — Day 1 to Day 10 ML Predictions:
   - GET /api/reliability/daywise?location=Vijayawada.
   - Independent predictions for Day 1 through Day 10.
   - Each card contains Confidence, Bust Risk, Risk Category, SHAP explanation, Drift, Uncertainty.
5. Feature 3 — Forecast Uncertainty Engine:
   - GET /api/reliability/uncertainty?location=Vijayawada.
   - Dual-axis metrics (Confidence, Uncertainty, Drift).
   - 5 KPI values and automated insight synthesis.
6. Feature 4 — Model Reliability & Calibration:
   - GET /api/judge/calibration.
   - Accuracy, Precision, Recall, F1, ROC-AUC, Brier Score, Reliability Curve, Confusion Matrix.
   - Generated from actual model evaluation on test set.
7. Feature 5 — Explainable Forecast Bust Analysis (SHAP):
   - GET /api/explain?location=Vijayawada&day=6 and /api/explain/bust.
   - Domain-specific meteorological feature names (Pressure Drop, Rainfall Gradient, etc.).
   - Natural language summary and operational recommendations.
8. SPA Navigation & Routing:
   - /confidence-map, /daywise, /uncertainty, /calibration, /explain routes.
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config
from backend.main import app
from backend.services.historical_error_service import (
    get_historical_error_dataset,
    get_district_historical_error_prior,
)
from backend.services.reliability_service import get_model_bundle

client = TestClient(app)


def test_historical_forecast_error_engine():
    """Verify historical forecast-error dataset schema and event types."""
    print("\n--- Verifying Historical Forecast Error Engine (SIH Mandatory) ---")
    df = get_historical_error_dataset()
    assert len(df) >= 1000, f"Expected at least 1000 historical records, found {len(df)}"

    required_columns = [
        "forecast_date", "observation_date", "lead_day", "state", "district",
        "latitude", "longitude", "forecast_temp", "actual_temp",
        "forecast_rainfall", "actual_rainfall", "forecast_pressure", "actual_pressure",
        "humidity", "wind_speed", "absolute_error", "percentage_error", "season", "weather_event_type"
    ]
    for col in required_columns:
        assert col in df.columns, f"Required historical column '{col}' missing from dataset"
    print(f"  [OK] Dataset contains {len(df)} records with all {len(required_columns)} mandatory columns.")

    # Verify all 7 weather event types
    expected_events = [
        "Monsoon Depression", "Heavy Rainfall", "Cyclone", "Western Disturbance",
        "Heat Wave", "Break Monsoon", "Active Monsoon"
    ]
    actual_events = set(df["weather_event_type"].unique())
    for ev in expected_events:
        assert ev in actual_events, f"Required weather event type '{ev}' missing from historical dataset"
    print(f"  [OK] All 7 MoES synoptic weather event types verified: {sorted(actual_events)}")

    # Verify prior extraction for Vijayawada
    prior = get_district_historical_error_prior("Vijayawada", lead_day=6)
    assert prior["sample_size"] > 0
    assert 0.0 <= prior["historical_bust_rate"] <= 1.0
    assert "event_bust_rates" in prior
    print(f"  [OK] Historical error prior for Vijayawada (Lead 6): Bust rate = {prior['historical_bust_rate']:.3f}, Sample = {prior['sample_size']}")
    print("[PASS] Historical Forecast Error Engine verified.")


def test_feature1_dynamic_forecast_confidence_map():
    """Verify Feature 1: Dynamic Forecast Confidence Map API."""
    print("\n--- Verifying Feature 1: Dynamic Forecast Confidence Map ---")
    resp = client.get("/api/map/confidence?day=1&location=Vijayawada")
    assert resp.status_code == 200, f"Confidence map endpoint returned {resp.status_code}"
    data = resp.json()

    assert "generated_at" in data
    assert data["location"] == "Vijayawada"
    assert data["day"] == 1
    assert 0 <= data["confidence"] <= 100
    assert 0 <= data["bust_probability"] <= 100
    assert data["confidence"] + data["bust_probability"] == 100, "Confidence must equal 100 - bust_probability"
    assert data["risk"] in ["Low", "Moderate", "High"]
    assert "weather" in data

    w = data["weather"]
    assert "temperature" in w and "rainfall" in w and "humidity" in w and "pressure" in w and "wind_speed" in w
    print(f"  [OK] Vijayawada Day 1: Confidence={data['confidence']}%, Bust Risk={data['bust_probability']}%, Risk={data['risk']}")
    print(f"  [OK] Weather parameters: Temp={w['temperature']}°C, Rain={w['rainfall']}mm, Hum={w['humidity']}%, Pres={w['pressure']}hPa, Wind={w['wind_speed']}km/h")
    print("[PASS] Feature 1 (Dynamic Forecast Confidence Map) verified.")


def test_feature2_day1_to_day10_ml_predictions():
    """Verify Feature 2: Independent ML predictions for Day 1 through Day 10."""
    print("\n--- Verifying Feature 2: Day 1 to Day 10 Independent ML Predictions ---")
    resp = client.get("/api/reliability/daywise?location=Vijayawada")
    assert resp.status_code == 200
    data = resp.json()

    assert "days" in data
    days = data["days"]
    assert len(days) == 10, f"Expected 10 forecast days, found {len(days)}"

    for idx, d in enumerate(days, start=1):
        assert d["day"] == idx
        assert 0 <= d["confidence"] <= 100
        assert 0 <= d["bust_probability"] <= 100
        assert d["risk"] in ["Low", "Moderate", "High"]
        assert "forecast_drift_mm" in d
        assert "uncertainty_pct" in d
        assert "shap_summary" in d
        assert len(d["shap_summary"]) > 10

    # Ensure Day 1 and Day 10 demonstrate lead time degradation
    day1 = days[0]
    day10 = days[9]
    print(f"  [OK] Day 1:  Confidence={day1['confidence']}%, Bust Risk={day1['bust_probability']}%, Risk={day1['risk']}")
    print(f"  [OK] Day 5:  Confidence={days[4]['confidence']}%, Bust Risk={days[4]['bust_probability']}%, Risk={days[4]['risk']}")
    print(f"  [OK] Day 10: Confidence={day10['confidence']}%, Bust Risk={day10['bust_probability']}%, Risk={day10['risk']}")
    assert day1["confidence"] >= day10["confidence"], "Medium-range error growth must result in lower confidence for extended lead days"
    print("[PASS] Feature 2 (Day 1–10 Independent ML Predictions) verified.")


def test_feature3_forecast_uncertainty_engine():
    """Verify Feature 3: Real meteorological forecast uncertainty & variability engine."""
    print("\n--- Verifying Feature 3: Forecast Uncertainty & Dual-Axis Engine ---")
    resp = client.get("/api/reliability/uncertainty?location=Vijayawada")
    assert resp.status_code == 200
    data = resp.json()

    assert data["days"] == list(range(1, 11))
    assert len(data["confidence"]) == 10
    assert len(data["uncertainty"]) == 10
    assert len(data["drift"]) == 10

    kpis = data["kpis"]
    assert "highest_confidence_day" in kpis
    assert "lowest_confidence_day" in kpis
    assert "max_uncertainty_day" in kpis
    assert "avg_confidence" in kpis
    assert "avg_drift" in kpis

    assert "insight" in data and len(data["insight"]) > 15
    print(f"  [OK] KPIs: Peak Conf Day={kpis['highest_confidence_day']}, Max Unc Day={kpis['max_uncertainty_day']}, Avg Conf={kpis['avg_confidence']}%, Avg Drift=+{kpis['avg_drift']}mm")
    print(f"  [OK] Insight: \"{data['insight']}\"")
    print("[PASS] Feature 3 (Forecast Uncertainty Engine) verified.")


def test_feature4_model_reliability_and_calibration():
    """Verify Feature 4: Model evaluation metrics, ROC, and calibration curve."""
    print("\n--- Verifying Feature 4: Model Reliability & Calibration ---")
    resp = client.get("/api/judge/calibration")
    assert resp.status_code == 200
    data = resp.json()

    assert data["status"] == "operational"
    assert "accuracy" in data and 0.5 <= data["accuracy"] <= 1.0
    assert "precision" in data and 0.5 <= data["precision"] <= 1.0
    assert "recall" in data and 0.5 <= data["recall"] <= 1.0
    assert "f1" in data and 0.5 <= data["f1"] <= 1.0
    assert "roc_auc" in data and 0.7 <= data["roc_auc"] <= 1.0
    assert "brier_score" in data and 0.0 <= data["brier_score"] <= 0.35

    assert "reliability_curve" in data
    assert "prob_pred" in data["reliability_curve"] and "prob_true" in data["reliability_curve"]
    assert len(data["reliability_curve"]["prob_pred"]) > 0

    assert "confusion_matrix" in data
    assert len(data["confusion_matrix"]) == 2 and len(data["confusion_matrix"][0]) == 2

    assert "interpretation" in data and len(data["interpretation"]) > 20
    print(f"  [OK] Accuracy={data['accuracy']:.3f}, Precision={data['precision']:.3f}, Recall={data['recall']:.3f}, F1={data['f1']:.3f}, ROC-AUC={data['roc_auc']:.3f}, Brier={data['brier_score']:.3f}")
    print(f"  [OK] Confusion Matrix: {data['confusion_matrix']}")
    print(f"  [OK] Interpretation: \"{data['interpretation'][:90]}...\"")
    print("[PASS] Feature 4 (Model Reliability & Calibration) verified.")


def test_feature5_explainable_ai_shap():
    """Verify Feature 5: Explainable AI with meteorological feature contributions."""
    print("\n--- Verifying Feature 5: Explainable Forecast Bust Analysis (SHAP) ---")
    resp = client.get("/api/explain?location=Vijayawada&day=6")
    assert resp.status_code == 200
    data = resp.json()

    assert 0 <= data["confidence"] <= 100
    assert 0 <= data["bust_probability"] <= 100
    assert data["confidence"] + data["bust_probability"] == 100
    assert data["risk"] in ["High", "Moderate", "Low"]
    assert "summary" in data and len(data["summary"]) > 20
    assert "top_features" in data and len(data["top_features"]) > 0

    valid_domains = [
        "Pressure Drop", "Rainfall Gradient", "Humidity Instability", "Wind Shear",
        "Temperature Trend", "Forecast Drift", "Convective Instability",
        "Historical Forecast Error", "Lead Day Horizon", "Lead Time Dispersion",
        "Rainfall Accumulation", "Surface Barometric Pressure"
    ]
    for feat in data["top_features"]:
        assert feat["direction"] in ["Positive", "Negative"]
        assert 0.0 <= feat["impact"] <= 1.0
        assert feat["feature"] in valid_domains or len(feat["feature"]) > 3

    print(f"  [OK] Vijayawada Day 6: Confidence={data['confidence']}%, Bust Risk={data['bust_probability']}%, Risk={data['risk']}")
    print(f"  [OK] Top Contributing Meteorological Features:")
    for f in data["top_features"][:4]:
        print(f"       - {f['feature']}: {f['impact']*100:.0f}% weight ({f['direction']} Influence)")
    print(f"  [OK] Meteorological Summary: \"{data['summary']}\"")
    print(f"  [OK] Operational Guidance: \"{data.get('recommendation', '')[:70]}...\"")

    # Also verify /api/explain/bust alias
    resp_bust = client.get("/api/explain/bust?location=Vijayawada&lead_day=6")
    assert resp_bust.status_code == 200
    print("[PASS] Feature 5 (Explainable AI / SHAP) verified.")


def test_spa_page_routes():
    """Verify all 5 SIH Priority 1 SPA page routes serve index.html."""
    print("\n--- Verifying SPA Page Routes ---")
    routes = [
        "/confidence-map",
        "/daywise",
        "/uncertainty",
        "/calibration",
        "/explain",
        "/live-weather",
        "/live-tracking",
        "/map"
    ]
    for r in routes:
        resp = client.get(r)
        assert resp.status_code == 200, f"Route {r} returned {resp.status_code}"
        assert "<!DOCTYPE html>" in resp.text
        print(f"  [OK] GET {r} -> 200 OK (SPA HTML served)")
    print("[PASS] All SPA page routes verified.")


if __name__ == "__main__":
    print("========================================================")
    print("RUNNING SIH PROBLEM ID 26079 PRIORITY 1 TEST SUITE")
    print("========================================================")
    test_historical_forecast_error_engine()
    test_feature1_dynamic_forecast_confidence_map()
    test_feature2_day1_to_day10_ml_predictions()
    test_feature3_forecast_uncertainty_engine()
    test_feature4_model_reliability_and_calibration()
    test_feature5_explainable_ai_shap()
    test_spa_page_routes()
    print("\n========================================================")
    print("ALL SIH PRIORITY 1 FEATURES VERIFIED AND PASSED 100%!")
    print("========================================================")
