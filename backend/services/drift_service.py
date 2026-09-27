"""
WeatherTrust AI — Forecast Drift Monitor Service (Phase 11)
Tracks successive numerical weather prediction (NWP) model runs for identical future target dates.
Calculates run-to-run drift, percentage shift, and categorizes forecast stability.
"""

from typing import Dict, Any, List
from datetime import datetime, timedelta
import config


def calculate_drift_metrics(
    variable_name: str,
    previous_val: float,
    current_val: float,
    unit: str,
    target_lead_day: int
) -> Dict[str, Any]:
    """
    Computes absolute and relative run-to-run drift and determines stability level.
    """
    delta = current_val - previous_val
    abs_delta = abs(delta)

    if previous_val > 0.1:
        pct_change = round((delta / previous_val) * 100.0, 1)
    else:
        pct_change = 100.0 if current_val > 5.0 else 0.0

    # Stability criteria
    if "rain" in variable_name.lower() or unit == "mm":
        if abs_delta <= 10.0:
            stability = "HIGH"
            drift_level = "LOW"
        elif abs_delta <= 25.0:
            stability = "MODERATE"
            drift_level = "MODERATE"
        else:
            stability = "LOW"
            drift_level = "HIGH"
    else:  # Temperature
        if abs_delta <= 1.5:
            stability = "HIGH"
            drift_level = "LOW"
        elif abs_delta <= 3.0:
            stability = "MODERATE"
            drift_level = "MODERATE"
        else:
            stability = "LOW"
            drift_level = "HIGH"

    return {
        "variable_name": variable_name,
        "unit": unit,
        "target_lead_day": target_lead_day,
        "previous_run_value": round(previous_val, 1),
        "latest_run_value": round(current_val, 1),
        "absolute_change": round(abs_delta, 1),
        "direction": "+" if delta >= 0 else "-",
        "percentage_change": pct_change,
        "stability_level": stability,
        "drift_level": drift_level,
        "explanation": (
            f"Forecast for Day {target_lead_day} shifted by {delta:+.1f} {unit} ({pct_change:+}% change). "
            f"Stability is {stability}."
        )
    }


def get_drift_history(location: str = "Krishna District") -> List[Dict[str, Any]]:
    """
    Provides multi-cycle drift history (last 4 model update cycles) for visualization.
    """
    now = datetime.now()
    cycles = [
        {"cycle_time": (now - timedelta(hours=18)).strftime("%d %b %H:%M"), "run_name": "Cycle -18h (00Z)", "predicted_rain_mm": 25.0, "predicted_temp_c": 32.0},
        {"cycle_time": (now - timedelta(hours=12)).strftime("%d %b %H:%M"), "run_name": "Cycle -12h (06Z)", "predicted_rain_mm": 35.0, "predicted_temp_c": 31.5},
        {"cycle_time": (now - timedelta(hours=6)).strftime("%d %b %H:%M"), "run_name": "Cycle -06h (12Z)", "predicted_rain_mm": 55.0, "predicted_temp_c": 30.0},
        {"cycle_time": now.strftime("%d %b %H:%M"), "run_name": "Latest (18Z)", "predicted_rain_mm": 80.0, "predicted_temp_c": 28.5},
    ]
    return cycles
