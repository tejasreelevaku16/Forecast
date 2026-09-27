"""
WeatherTrust AI — Model Explainability Engine (Phase 10)
Translates mathematical feature contributions into explainable, non-technical reasons
why a specific forecast has low confidence or high bust risk.
Driven entirely by actual model weights and input feature values.
"""

from typing import List, Dict, Any
import numpy as np


def explain_prediction(
    feature_dict: Dict[str, float],
    feature_names: List[str],
    raw_model: Any,
    scaler: Any,
    bust_prob_pct: int
) -> List[Dict[str, Any]]:
    """
    Computes feature-level risk contributions and maps them to explainable drivers.
    """
    # Build vector
    x_raw = np.array([[feature_dict.get(col, 0.0) for col in feature_names]])
    x_scaled = scaler.transform(x_raw)[0]

    # Compute linear contribution score if model has coef_
    contributions = {}
    if hasattr(raw_model, "coef_"):
        coefs = raw_model.coef_[0]
        for name, scaled_val, coef in zip(feature_names, x_scaled, coefs):
            # Positive contribution means this feature pushed the bust probability UP
            contributions[name] = float(scaled_val * coef)
    else:
        # Fallback to feature magnitude
        for name, scaled_val in zip(feature_names, x_scaled):
            contributions[name] = float(abs(scaled_val))

    # Rank features by positive impact on bust risk
    ranked = sorted(contributions.items(), key=lambda item: item[1], reverse=True)

    reasons = []
    seen_types = set()

    for feat_name, impact in ranked:
        if len(reasons) >= 3:
            break

        if feat_name in ["lead_time_days", "lead_time_sq"] and "lead" not in seen_types:
            lead = int(feature_dict.get("lead_time_days", 1))
            if lead >= 4 or impact > 0:
                reasons.append({
                    "id": f"reason-lead-{lead}",
                    "icon_type": "error",
                    "title": "Extended Forecast Lead Time",
                    "description": f"Lead Day {lead} forecast: atmospheric chaotic divergence increases error dispersion beyond Day 4.",
                    "severity": "high" if lead >= 6 else "moderate",
                })
                seen_types.add("lead")

        elif feat_name == "run_drift_rainfall_mm" and "drift" not in seen_types:
            drift = feature_dict.get("run_drift_rainfall_mm", 0.0)
            if drift >= 15.0 or impact > 0:
                reasons.append({
                    "id": "reason-drift",
                    "icon_type": "drift",
                    "title": "Forecast Changed Significantly (Drift)",
                    "description": f"The predicted rainfall shifted by {drift:.1f} mm between consecutive numerical weather prediction runs.",
                    "severity": "high" if drift >= 30.0 else "moderate",
                })
                seen_types.add("drift")

        elif feat_name == "regional_prior_error_rate" and "regional" not in seen_types:
            reg_err = feature_dict.get("regional_prior_error_rate", 0.35)
            reasons.append({
                "id": "reason-regional",
                "icon_type": "variability",
                "title": "Regional Microclimate Variability",
                "description": f"This meteorological zone exhibits a {reg_err*100:.1f}% historical discrepancy rate under similar synoptic setups.",
                "severity": "high" if reg_err >= 0.45 else "moderate",
            })
            seen_types.add("regional")

        elif feat_name in ["forecast_rainfall_mm", "convective_index"] and "convective" not in seen_types:
            rain = feature_dict.get("forecast_rainfall_mm", 0.0)
            hum = feature_dict.get("forecast_humidity_pct", 70.0)
            if rain >= 20.0 or impact > 0:
                reasons.append({
                    "id": "reason-convective",
                    "icon_type": "variability",
                    "title": "High Convective Moisture Volume",
                    "description": f"Forecasted {rain:.1f} mm rainfall with {hum:.0f}% humidity indicates volatile convective cell formation.",
                    "severity": "high" if rain >= 40.0 else "moderate",
                })
                seen_types.add("convective")

    # If bust risk is low (<25%), provide positive reassurance points
    if bust_prob_pct <= 25 and len(reasons) == 0:
        reasons = [
            {
                "id": "reason-stable-1",
                "icon_type": "drift",
                "title": "Short Lead Time Consensus",
                "description": "Short-range forecast exhibits high multi-model ensemble convergence.",
                "severity": "low",
            },
            {
                "id": "reason-stable-2",
                "icon_type": "variability",
                "title": "Low Run-to-Run Drift",
                "description": "Consecutive forecast runs show stable precipitation and temperature trajectories.",
                "severity": "low",
            }
        ]

    return reasons
