"""
WeatherTrust AI — Model Training & Calibration Pipeline (SIH Problem ID: 26079)
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)

Trains & compares:
1. Calibrated Logistic Regression (Linear baseline with calibrated logits)
2. Random Forest Classifier (Non-linear bagging ensemble)
3. Gradient Boosting Classifier (GBDT sequential decision trees)

Performs 5-Fold Sigmoid Probability Calibration and exports complete audit artifacts.
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
    prepare_training_dataset
)
from ml.calibration import compute_calibration_diagnostics
from ml.evaluate import evaluate_model_performance, print_evaluation_summary

from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV


def train_and_evaluate_models():
    print("[*] Preparing dataset and extracting features...")
    df = prepare_training_dataset()

    # Time-aware Chronological Split (80% Train, 20% Test) — Zero Future Data Leakage
    train_size = int(len(df) * 0.8)
    train_df = df.iloc[:train_size]
    test_df = df.iloc[train_size:]

    print(f"[*] Train set: {len(train_df)} samples | Test set: {len(test_df)} samples (Chronological split)")

    X_train = train_df[FEATURE_COLUMNS].values
    y_train = train_df[TARGET_COLUMN].values

    X_test = test_df[FEATURE_COLUMNS].values
    y_test = test_df[TARGET_COLUMN].values

    # Feature Scaling
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Candidate Models
    candidate_models = {
        "Logistic Regression (Baseline)": LogisticRegression(max_iter=1000, random_state=42),
        "Random Forest Classifier": RandomForestClassifier(n_estimators=150, max_depth=7, min_samples_split=6, random_state=42),
        "Gradient Boosting Classifier": GradientBoostingClassifier(n_estimators=120, learning_rate=0.07, max_depth=4, random_state=42),
    }

    results = {}
    best_model_name = None
    best_roc_auc = -1.0
    best_raw_model = None

    for name, model in candidate_models.items():
        print(f"\n[*] Training {name}...")
        model.fit(X_train_scaled, y_train)

        y_pred = model.predict(X_test_scaled)
        y_prob = model.predict_proba(X_test_scaled)[:, 1]

        metrics = evaluate_model_performance(y_test, y_pred, y_prob)
        print_evaluation_summary(name, metrics)
        results[name] = metrics

        if metrics["roc_auc"] > best_roc_auc:
            best_roc_auc = metrics["roc_auc"]
            best_model_name = name
            best_raw_model = model

    print(f"\n[SELECTED] Best performing model: {best_model_name} (ROC-AUC: {best_roc_auc:.4f})")

    # Probability Calibration (5-Fold Cross-Validation)
    print(f"[*] Applying 5-fold Sigmoid Probability Calibration to {best_model_name}...")
    calibrated_model = CalibratedClassifierCV(estimator=best_raw_model, method="sigmoid", cv=5)
    calibrated_model.fit(X_train_scaled, y_train)

    # Compute Calibrated Diagnostics
    cal_prob = calibrated_model.predict_proba(X_test_scaled)[:, 1]
    calibration_diagnostics = compute_calibration_diagnostics(y_test, cal_prob)

    print("\n--- Final Calibrated Model Metrics (SIH NCMRWF Judge / Technical Audit) ---")
    print_evaluation_summary(f"Calibrated {best_model_name}", calibration_diagnostics)
    print(f"Interpretation: {calibration_diagnostics['interpretation']}")

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

    # Sort feature importances descending
    feature_importances = dict(sorted(feature_importances.items(), key=lambda item: item[1], reverse=True))

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
        "feature_importances": feature_importances,
        "trained_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "train_samples": len(train_df),
        "test_samples": len(test_df),
        "sih_problem_id": config.PROBLEM_ID,
        "organization": config.ORGANIZATION,
        "department": config.DEPARTMENT,
    }

    joblib.dump(model_bundle, config.MODEL_PATH)
    print(f"\n[SUCCESS] Model artifact bundle successfully saved to: {config.MODEL_PATH}")
    return model_bundle


if __name__ == "__main__":
    train_and_evaluate_models()
