"""
WeatherTrust AI — Model Training & Comparison Pipeline (Phase 8)
Compares baseline models:
1. Logistic Regression
2. Random Forest Classifier
3. Gradient Boosting Classifier
Performs probability calibration and saves the winning model bundle to models/forecast_reliability_model.pkl.
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
from ml.feature_engineering import FEATURE_COLUMNS, TARGET_COLUMN
from ml.evaluate import evaluate_model_performance, print_evaluation_summary

from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV


def train_and_compare_models():
    print("[*] Loading preprocessed dataset...")
    if not config.PROCESSED_DATA_PATH.exists():
        from ml.feature_engineering import prepare_training_dataset
        df = prepare_training_dataset()
    else:
        df = pd.read_csv(config.PROCESSED_DATA_PATH)

    # Time-aware Chronological Split (80% train, 20% test)
    # Never use random shuffle for forecast time series to avoid data leakage!
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
        "Random Forest Classifier": RandomForestClassifier(n_estimators=120, max_depth=6, random_state=42),
        "Gradient Boosting Classifier": GradientBoostingClassifier(n_estimators=100, learning_rate=0.08, max_depth=4, random_state=42),
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
    print(f"[*] Applying 5-fold probability calibration to {best_model_name}...")
    calibrated_model = CalibratedClassifierCV(estimator=best_raw_model, method="sigmoid", cv=5)
    calibrated_model.fit(X_train_scaled, y_train)

    # Final Calibrated Metrics
    cal_prob = calibrated_model.predict_proba(X_test_scaled)[:, 1]
    cal_pred = (cal_prob >= 0.5).astype(int)
    final_metrics = evaluate_model_performance(y_test, cal_pred, cal_prob)

    print("\n--- Final Calibrated Model Metrics (For Technical/Judge View) ---")
    print_evaluation_summary(f"Calibrated {best_model_name}", final_metrics)

    # Feature Importance Extraction
    feature_importances = {}
    if hasattr(best_raw_model, "feature_importances_"):
        for feat, imp in zip(FEATURE_COLUMNS, best_raw_model.feature_importances_):
            feature_importances[feat] = round(float(imp), 4)
    elif hasattr(best_raw_model, "coef_"):
        for feat, imp in zip(FEATURE_COLUMNS, best_raw_model.coef_[0]):
            feature_importances[feat] = round(float(abs(imp)), 4)

    # Persist serialized artifact bundle
    config.MODEL_DIR.mkdir(parents=True, exist_ok=True)
    model_bundle = {
        "model": calibrated_model,
        "raw_model": best_raw_model,
        "scaler": scaler,
        "feature_names": FEATURE_COLUMNS,
        "target_column": TARGET_COLUMN,
        "best_model_name": best_model_name,
        "metrics": final_metrics,
        "all_model_comparisons": results,
        "feature_importances": feature_importances,
        "trained_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "train_samples": len(train_df),
        "test_samples": len(test_df),
    }

    joblib.dump(model_bundle, config.MODEL_PATH)
    print(f"[SUCCESS] Model artifact bundle successfully saved to: {config.MODEL_PATH}")
    return model_bundle


if __name__ == "__main__":
    train_and_compare_models()
