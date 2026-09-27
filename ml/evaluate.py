"""
WeatherTrust AI — Model Evaluation (Phase 9)
Computes rigorous classification metrics on time-aware validation splits:
- Accuracy, Precision, Recall, F1-Score
- ROC-AUC (Area Under Receiver Operating Characteristic Curve)
- Brier Score (Probability Calibration loss)
- Confusion Matrix (True Positive, False Positive, True Negative, False Negative)
"""

from typing import Dict, Any
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    brier_score_loss,
    confusion_matrix,
    classification_report,
)


def evaluate_model_performance(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray) -> Dict[str, Any]:
    """
    Computes complete statistical evaluation metrics for forecast bust classification.
    """
    acc = accuracy_score(y_true, y_pred)
    prec = precision_score(y_true, y_pred, zero_division=0)
    rec = recall_score(y_true, y_pred, zero_division=0)
    f1 = f1_score(y_true, y_pred, zero_division=0)
    roc_auc = roc_auc_score(y_true, y_prob)
    brier = brier_score_loss(y_true, y_prob)
    cm = confusion_matrix(y_true, y_pred).tolist()

    return {
        "accuracy": round(float(acc), 4),
        "precision": round(float(prec), 4),
        "recall": round(float(rec), 4),
        "f1_score": round(float(f1), 4),
        "roc_auc": round(float(roc_auc), 4),
        "brier_score": round(float(brier), 4),
        "confusion_matrix": cm,
    }


def print_evaluation_summary(model_name: str, metrics: Dict[str, Any]):
    """Pretty prints model diagnostic evaluation."""
    print(f"\n--- Evaluation Results for {model_name} ---")
    print(f"  - Accuracy:     {metrics['accuracy'] * 100:.2f}%")
    print(f"  - Precision:    {metrics['precision'] * 100:.2f}%")
    print(f"  - Recall:       {metrics['recall'] * 100:.2f}%")
    print(f"  - F1-Score:     {metrics['f1_score']:.4f}")
    print(f"  - ROC-AUC:      {metrics['roc_auc']:.4f}")
    print(f"  - Brier Loss:   {metrics['brier_score']:.4f} (Lower is better calibrated)")
    cm = metrics["confusion_matrix"]
    print(f"  - Confusion Matrix: [TN={cm[0][0]}, FP={cm[0][1]} | FN={cm[1][0]}, TP={cm[1][1]}]")
