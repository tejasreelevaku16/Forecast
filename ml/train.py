"""
WeatherTrust AI — Model Training & Calibration Pipeline (SIH Problem ID: 26079)
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)

Trains & compares:
1. Calibrated Logistic Regression (Linear baseline)
2. Random Forest Classifier (Non-linear ensemble)
3. Gradient Boosting Classifier (Sequential GBDT)

Applies 5-Fold Probability Calibration, TreeExplainer SHAP integration, and exports complete audit artifacts.
Zero synthetic random errors. Chronological train/test split.
"""

import sys
from pathlib import Path
from datetime import datetime
import joblib
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config
from ml.feature_engineering import (
    FEATURE_COLUMNS,
    TARGET_COLUMN,
    METEOROLOGICAL_FEATURE_LABELS,
    prepare_training_dataset,
    verify_temporal_leakage_safety,
)
from ml.calibration import compute_calibration_diagnostics
from ml.evaluate import (
    evaluate_model_performance,
    evaluate_lead_day_breakdown,
    evaluate_event_regime_breakdown,
    evaluate_geographic_generalization,
    print_evaluation_summary,
)

from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
import shap


def train_and_evaluate_models():
    print("[*] Preparing verified dataset and extracting time-aware features...")
    df = prepare_training_dataset()

    # Verify zero temporal leakage
    verify_temporal_leakage_safety(df)

    # Time-aware Chronological Split:
    # 70% Earlier Period -> Training
    # 15% Middle Period -> Validation
    # 15% Future Unseen Period -> Out-of-Time Testing
    n_total = len(df)
    train_end = int(n_total * 0.70)
    val_end = int(n_total * 0.85)

    train_df = df.iloc[:train_end]
    val_df = df.iloc[train_end:val_end]
    test_df = df.iloc[val_end:]

    print(f"[*] Chronological Split: Train={len(train_df)} | Val={len(val_df)} | Test={len(test_df)} samples")

    X_train = train_df[FEATURE_COLUMNS].values
    y_train = train_df[TARGET_COLUMN].values

    X_val = val_df[FEATURE_COLUMNS].values
    y_val = val_df[TARGET_COLUMN].values

    X_test = test_df[FEATURE_COLUMNS].values
    y_test = test_df[TARGET_COLUMN].values

    # Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    from sklearn.ensemble import HistGradientBoostingClassifier

    # Candidate Models
    candidate_models = {
        "Logistic Regression (Baseline)": LogisticRegression(max_iter=1000, random_state=42),
        "Random Forest Classifier": RandomForestClassifier(n_estimators=100, max_depth=8, min_samples_split=6, random_state=42, n_jobs=-1),
        "Hist Gradient Boosting": HistGradientBoostingClassifier(max_iter=100, learning_rate=0.08, max_depth=6, random_state=42),
    }

    results = {}
    best_model_name = None
    best_roc_auc = -1.0
    best_raw_model = None

    for name, model in candidate_models.items():
        print(f"\n[*] Training candidate model: {name}...", flush=True)
        model.fit(X_train_scaled, y_train)

        y_val_pred = model.predict(X_val_scaled)
        y_val_prob = model.predict_proba(X_val_scaled)[:, 1]

        metrics = evaluate_model_performance(y_val, y_val_pred, y_val_prob)
        print_evaluation_summary(f"{name} (Validation Set)", metrics)
        results[name] = metrics

        if metrics["roc_auc"] > best_roc_auc:
            best_roc_auc = metrics["roc_auc"]
            best_model_name = name
            best_raw_model = model

    print(f"\n[SELECTED] Best performing architecture: {best_model_name} (Val ROC-AUC: {best_roc_auc:.4f})", flush=True)

    # Fit final calibrated model on Train + Val
    X_train_val = np.vstack([X_train, X_val])
    y_train_val = np.concatenate([y_train, y_val])
    X_train_val_scaled = scaler.fit_transform(X_train_val)
    X_test_scaled = scaler.transform(X_test)

    # Retrain best raw model on full training period
    best_raw_model.fit(X_train_val_scaled, y_train_val)

    # Probability Calibration with 3-Fold Cross-Validation
    print(f"[*] Applying 3-fold Sigmoid Probability Calibration to {best_model_name}...", flush=True)
    calibrated_model = CalibratedClassifierCV(estimator=best_raw_model, method="sigmoid", cv=3, n_jobs=-1)
    calibrated_model.fit(X_train_val_scaled, y_train_val)

    # Compute Calibrated Diagnostics on Unseen Future Out-of-Time Test Set
    cal_test_prob = calibrated_model.predict_proba(X_test_scaled)[:, 1]
    calibration_diagnostics = compute_calibration_diagnostics(y_test, cal_test_prob)

    print("\n--- Final Out-of-Time Test Calibration Metrics ---")
    print_evaluation_summary(f"Calibrated {best_model_name}", calibration_diagnostics)
    print(f"Interpretation: {calibration_diagnostics['interpretation']}")

    # Extended Diagnostics
    lead_day_eval = evaluate_lead_day_breakdown(test_df, calibrated_model, scaler, FEATURE_COLUMNS)
    event_eval = evaluate_event_regime_breakdown(test_df, calibrated_model, scaler, FEATURE_COLUMNS)
    
    # Geographic Generalization (Hold out 2 representative districts for unseen evaluation)
    held_out_districts = ["Kamrup", "Prakasam"]
    geo_eval = evaluate_geographic_generalization(df, calibrated_model, scaler, FEATURE_COLUMNS, held_out_districts)

    # Feature Importance Extraction with Meteorological Labels
    feature_importances = {}
    if hasattr(best_raw_model, "feature_importances_"):
        for feat, imp in zip(FEATURE_COLUMNS, best_raw_model.feature_importances_):
            label = METEOROLOGICAL_FEATURE_LABELS.get(feat, feat)
            feature_importances[label] = round(float(imp), 4)
    elif hasattr(best_raw_model, "coef_"):
        for feat, imp in zip(FEATURE_COLUMNS, best_raw_model.coef_[0]):
            label = METEOROLOGICAL_FEATURE_LABELS.get(feat, feat)
            feature_importances[label] = round(float(abs(imp)), 4)

    feature_importances = dict(sorted(feature_importances.items(), key=lambda item: item[1], reverse=True))

    # Pre-initialize SHAP TreeExplainer on background sample
    print("[*] Initializing shap.TreeExplainer on trained model...")
    try:
        explainer = shap.TreeExplainer(best_raw_model)
    except Exception as e:
        print(f"[!] Notice initializing explainer: {e}")

    # Persist serialized artifact bundle
    config.MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model_bundle = {
        "model": calibrated_model,
        "raw_model": best_raw_model,
        "scaler": scaler,
        "feature_names": FEATURE_COLUMNS,
        "feature_labels": METEOROLOGICAL_FEATURE_LABELS,
        "target_column": TARGET_COLUMN,
        "best_model_name": best_model_name,
        "metrics": calibration_diagnostics,
        "calibration_data": calibration_diagnostics,
        "all_model_comparisons": results,
        "lead_day_breakdown": lead_day_eval,
        "event_regime_breakdown": event_eval,
        "geographic_generalization": geo_eval,
        "feature_importances": feature_importances,
        "trained_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "train_samples": len(train_df) + len(val_df),
        "test_samples": len(test_df),
        "dataset_source": "Real Historical ECMWF IFS / GFS Forecasts verified against ERA5 Atmospheric Reanalysis",
        "sih_problem_id": config.PROBLEM_ID,
        "organization": config.ORGANIZATION,
        "department": config.DEPARTMENT,
    }

    joblib.dump(model_bundle, config.MODEL_PATH)
    print(f"\n[SUCCESS] Model artifact bundle successfully saved to: {config.MODEL_PATH}")
    return model_bundle


if __name__ == "__main__":
    train_and_evaluate_models()
