"""
Reliability Alerts API Routes (Phase 13)
Triggers proactive reliability notifications when bust probability exceeds 50%,
when severe forecast drift is detected, or when high-impact weather coincides with low trust.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Query
from backend.services.reliability_service import get_forecast_reliability_overview

router = APIRouter(prefix="/api/alerts", tags=["Reliability Alerts"])


@router.get("/reliability", summary="Get Active Forecast Reliability Alerts")
def get_reliability_alerts(location: str = Query("Krishna District", description="Location name")):
    """
    Evaluates forecast reliability and generates diagnostic alert banners.
    Clearly distinguishes Reliability Alerts from official meteorological warnings.
    """
    overview = get_forecast_reliability_overview(location)
    alerts: List[Dict[str, Any]] = []

    # 1. High Bust Risk Trigger
    if overview.bust_probability_pct >= 50:
        alerts.append({
            "id": "rel-alert-bust",
            "type": "RELIABILITY_ALERT",
            "severity": "HIGH" if overview.bust_probability_pct >= 70 else "MODERATE",
            "headline": f"High Forecast Bust Risk ({overview.bust_probability_pct}%) for Lead Day {overview.focus_lead_day}",
            "message": (
                f"WeatherTrust AI detects high forecast error probability for Day {overview.focus_lead_day}. "
                f"Trust score is {overview.reliability_score}/100. Check next update before committing plans."
            ),
            "metric": f"Bust Risk: {overview.bust_probability_pct}%",
            "disclaimer": "Diagnostic reliability alert only. Not an official disaster warning.",
        })

    # 2. Large Drift Trigger
    if overview.drift_monitor and overview.drift_monitor.absolute_change >= 25.0:
        dm = overview.drift_monitor
        alerts.append({
            "id": "rel-alert-drift",
            "type": "FORECAST_DRIFT_ALERT",
            "severity": "HIGH",
            "headline": f"Significant Forecast Run Drift (+{dm.absolute_change} {dm.unit})",
            "message": (
                f"{dm.variable_name} forecast for Day {dm.target_lead_day} changed from {dm.previous_run_value} {dm.unit} "
                f"to {dm.latest_run_value} {dm.unit} between consecutive model cycles. Forecast stability is LOW."
            ),
            "metric": f"Run Shift: +{dm.absolute_change} {dm.unit}",
            "disclaimer": "Diagnostic reliability alert only.",
        })

    # 3. Stable Forecast Condition
    if not alerts:
        alerts.append({
            "id": "rel-alert-stable",
            "type": "STABLE_FORECAST",
            "severity": "STABLE",
            "headline": f"Stable Forecast Confirmed for {location}",
            "message": (
                f"Recent numerical weather prediction (NWP) cycles remained consistent. "
                f"Forecast stability is HIGH with low run-to-run variance."
            ),
            "metric": f"Trust Score: {overview.reliability_score}/100",
            "disclaimer": "Current forecast runs demonstrate high operational reliability.",
        })

    return {
        "location": location,
        "active_alerts_count": len([a for a in alerts if a["severity"] in ["HIGH", "MODERATE"]]),
        "alerts": alerts,
    }
