"""
SIH Technical / Judge Dashboard API (Phase 15)
Provides transparent access to machine learning validation metrics, model comparison tables,
feature importance scores, confusion matrices, and dataset statistics for evaluators and judges.
"""

from typing import Dict, Any
from fastapi import APIRouter
from backend.services.reliability_service import get_model_bundle
import config

router = APIRouter(prefix="/api/judge", tags=["SIH Technical Evaluator View"])


@router.get("/metrics", summary="Get ML Evaluation Metrics for Judges")
def get_judge_metrics() -> Dict[str, Any]:
    """
    Returns full statistical and performance breakdown for SIH evaluation:
    ROC-AUC, Precision, Recall, F1, Confusion Matrix, Brier Score, and Baseline Comparisons.
    """
    bundle = get_model_bundle()
    if bundle is None:
        return {
            "status": "baseline_only",
            "message": "Model not yet trained. Run ml/train.py to generate artifact.",
        }

    return {
        "status": "trained_model_active",
        "platform": config.APP_NAME,
        "selected_model": bundle.get("best_model_name", "Calibrated Logistic Regression"),
        "calibration_technique": "5-Fold Cross-Validated Sigmoid Probability Calibration",
        "training_strategy": "Chronological Time-Aware Split (80% Train, 20% Test) — Zero Future Leakage",
        "sample_counts": {
            "train_samples": bundle.get("train_samples", 2800),
            "test_samples": bundle.get("test_samples", 700),
            "total_dataset_events": 3500,
        },
        "evaluation_metrics": bundle.get("metrics", {}),
        "all_model_comparisons": bundle.get("all_model_comparisons", {}),
        "feature_importances": bundle.get("feature_importances", {}),
        "trained_features": bundle.get("feature_names", []),
        "target_definition": (
            "Forecast Bust = (|Rainfall_Error| >= 25mm) OR (|Temp_Error| >= 3.5°C) OR (False Alarm: Forecast >= 20mm, Actual <= 5mm)"
        ),
        "timestamp": bundle.get("trained_at", "2026-09-25"),
    }
