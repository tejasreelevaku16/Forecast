"""
WeatherTrust AI — Scientific Model Evaluation & Generalization Diagnostics
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
SIH Problem ID: 26079: AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts

Evaluates:
1. Classification metrics (Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC)
2. Brier Score & Expected Calibration Error (ECE)
3. Lead Time Generalization (Day 1 through Day 10 performance)
4. Synoptic Event Regime Generalization (Cyclone, Monsoon Depression, Heat Wave, etc.)
5. Geographic Spatial Generalization (Seen Locations vs Unseen Locations)
"""

from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    precision_recall_curve,
    auc,
    brier_score_loss,
    confusion_matrix,
)


def evaluate_model_performance(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray) -> Dict[str, Any]:
    """
    Computes complete statistical evaluation metrics for forecast bust classification.
    """
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    
    try:
        roc_auc = roc_auc_score(y_true, y_prob)
    except Exception:
        roc_auc = 0.5

    try:
        p_curve, r_curve, _ = precision_recall_curve(y_true, y_prob)
        pr_auc = auc(r_curve, p_curve)
    except Exception:
        pr_auc = 0.0

    brier = brier_score_loss(y_true, y_prob)
    cm = confusion_matrix(y_true, y_pred).tolist()

    return {
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(roc_auc), 4),
        "pr_auc": round(float(pr_auc), 4),
        "brier_score": round(float(brier), 4),
        "confusion_matrix": cm,
    }


def evaluate_lead_day_breakdown(
    df_eval: pd.DataFrame,
    model: Any,
    scaler: Any,
    feature_cols: List[str]
) -> List[Dict[str, Any]]:
    """Evaluates bust detection performance independently across lead days 1 to 10."""
    day_results = []
    
    lead_col = "lead_day" if "lead_day" in df_eval.columns else "lead_time_days"
    for day in range(1, 11):
        sub = df_eval[df_eval[lead_col] == day]
        if len(sub) < 5:
            continue
        
        X = scaler.transform(sub[feature_cols].values)
        y = sub["is_bust"].values
        y_prob = model.predict_proba(X)[:, 1]
        y_pred = (y_prob >= 0.5).astype(int)
        
        metrics = evaluate_model_performance(y, y_pred, y_prob)
        day_results.append({
            "lead_day": day,
            "sample_count": len(sub),
            "bust_rate_pct": round(float(y.mean() * 100), 1),
            "accuracy": metrics["accuracy"],
            "roc_auc": metrics["roc_auc"],
            "brier_score": metrics["brier_score"],
            "f1_score": metrics["f1_score"]
        })
        
    return day_results


def evaluate_event_regime_breakdown(
    df_eval: pd.DataFrame,
    model: Any,
    scaler: Any,
    feature_cols: List[str]
) -> List[Dict[str, Any]]:
    """Evaluates performance across distinct synoptic weather event categories."""
    event_results = []
    if "weather_event_type" not in df_eval.columns:
        return event_results

    for event_name, sub in df_eval.groupby("weather_event_type"):
        if len(sub) < 5:
            continue
        X = scaler.transform(sub[feature_cols].values)
        y = sub["is_bust"].values
        y_prob = model.predict_proba(X)[:, 1]
        y_pred = (y_prob >= 0.5).astype(int)
        
        metrics = evaluate_model_performance(y, y_pred, y_prob)
        event_results.append({
            "event_type": event_name,
            "sample_count": len(sub),
            "bust_rate_pct": round(float(y.mean() * 100), 1),
            "accuracy": metrics["accuracy"],
            "roc_auc": metrics["roc_auc"],
            "brier_score": metrics["brier_score"]
        })
        
    return event_results


def evaluate_geographic_generalization(
    df_all: pd.DataFrame,
    model: Any,
    scaler: Any,
    feature_cols: List[str],
    unseen_districts: List[str]
) -> Dict[str, Any]:
    """
    Evaluates generalization between seen training districts vs held-out unseen districts.
    """
    reg_col = "district" if "district" in df_all.columns else "city"
    
    seen_df = df_all[~df_all[reg_col].isin(unseen_districts)]
    unseen_df = df_all[df_all[reg_col].isin(unseen_districts)]
    
    results = {}
    
    if len(seen_df) > 0:
        X_seen = scaler.transform(seen_df[feature_cols].values)
        y_seen = seen_df["is_bust"].values
        y_seen_prob = model.predict_proba(X_seen)[:, 1]
        y_seen_pred = (y_seen_prob >= 0.5).astype(int)
        results["seen_locations"] = {
            "locations_count": seen_df[reg_col].nunique(),
            "samples": len(seen_df),
            "metrics": evaluate_model_performance(y_seen, y_seen_pred, y_seen_prob)
        }
        
    if len(unseen_df) > 0:
        X_unseen = scaler.transform(unseen_df[feature_cols].values)
        y_unseen = unseen_df["is_bust"].values
        y_unseen_prob = model.predict_proba(X_unseen)[:, 1]
        y_unseen_pred = (y_unseen_prob >= 0.5).astype(int)
        results["unseen_locations"] = {
            "locations_count": unseen_df[reg_col].nunique(),
            "samples": len(unseen_df),
            "metrics": evaluate_model_performance(y_unseen, y_unseen_pred, y_unseen_prob)
        }
    else:
        results["unseen_locations"] = {
            "status": "UNAVAILABLE",
            "message": "Insufficient held-out geographic data for unseen evaluation."
        }
        
    return results


def print_evaluation_summary(model_name: str, metrics: Dict[str, Any]):
    """Pretty prints model diagnostic evaluation."""
    print(f"\n--- Evaluation Results for {model_name} ---")
    print(f"  - Accuracy:     {metrics.get('accuracy', 0.0) * 100:.2f}%")
    print(f"  - Precision:    {metrics.get('precision', 0.0) * 100:.2f}%")
    print(f"  - Recall:       {metrics.get('recall', 0.0) * 100:.2f}%")
    print(f"  - F1-Score:     {metrics.get('f1_score', 0.0):.4f}")
    print(f"  - ROC-AUC:      {metrics.get('roc_auc', 0.0):.4f}")
    print(f"  - PR-AUC:       {metrics.get('pr_auc', 0.0):.4f}")
    print(f"  - Brier Loss:   {metrics.get('brier_score', 0.0):.4f} (Lower is better calibrated)")
    cm = metrics.get("confusion_matrix", [[0, 0], [0, 0]])
    print(f"  - Confusion Matrix: [TN={cm[0][0]}, FP={cm[0][1]} | FN={cm[1][0]}, TP={cm[1][1]}]")
