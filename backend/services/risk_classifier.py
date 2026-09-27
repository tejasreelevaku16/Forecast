"""
WeatherTrust AI — Centralized Risk Classifier
Single source of truth for converting Bust Probability into standardized risk tiers,
reliability levels, confidence labels, color codes, and stability classifications.

Standard Thresholds:
  0–29%   : LOW RISK      | HIGH RELIABILITY     | HIGH CONFIDENCE     | #10b981 (Green)
  30–59%  : MODERATE RISK | MODERATE RELIABILITY | MODERATE CONFIDENCE | #f59e0b (Amber)
  60–100% : HIGH RISK     | LOW RELIABILITY      | LOW CONFIDENCE      | #ef4444 (Red)
"""

from typing import Dict, Any, Union


def classify_bust_risk(bust_prob_pct: Union[int, float]) -> Dict[str, Any]:
    """
    Classifies a bust probability percentage into standardized WeatherTrust AI tiers.
    Guarantees 100% consistency across all backend endpoints and frontend views.
    Example: 76% bust probability always maps to HIGH RISK, LOW RELIABILITY, LOW CONFIDENCE.
    """
    try:
        prob = int(round(float(bust_prob_pct)))
    except (ValueError, TypeError):
        prob = 50

    prob = max(0, min(100, prob))
    trust_score = 100 - prob

    if prob < 30:
        return {
            "bust_probability": prob,
            "trust_score": trust_score,
            "risk_level": "LOW",
            "risk_label": "LOW RISK",
            "risk_display": "Low Risk",
            "reliability_level": "HIGH",
            "confidence_label": "HIGH CONFIDENCE",
            "confidence": "High",
            "stability": "HIGH",
            "stability_label": "HIGH STABILITY",
            "color": "#10b981",
            "badge_class": "badge-risk-low",
        }
    elif prob < 60:
        return {
            "bust_probability": prob,
            "trust_score": trust_score,
            "risk_level": "MODERATE",
            "risk_label": "MODERATE RISK",
            "risk_display": "Moderate Risk",
            "reliability_level": "MODERATE",
            "confidence_label": "MODERATE CONFIDENCE",
            "confidence": "Moderate",
            "stability": "MODERATE",
            "stability_label": "MODERATE STABILITY",
            "color": "#f59e0b",
            "badge_class": "badge-risk-mod",
        }
    else:
        return {
            "bust_probability": prob,
            "trust_score": trust_score,
            "risk_level": "HIGH",
            "risk_label": "HIGH RISK",
            "risk_display": "High Risk",
            "reliability_level": "LOW",
            "confidence_label": "LOW CONFIDENCE",
            "confidence": "Low",
            "stability": "LOW",
            "stability_label": "LOW STABILITY",
            "color": "#ef4444",
            "badge_class": "badge-risk-high",
        }
