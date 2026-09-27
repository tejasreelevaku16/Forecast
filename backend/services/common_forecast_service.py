"""
WeatherTrust AI — Common Forecast Data Service
Provides one unified source of truth for weather forecasts, reliability metrics,
and risk evaluations across the entire application (Dashboard, Map, Forecast, Trust, Drift, Alerts).

Ensures that the exact same (Location + Target Date + Forecast Run) yields identical values everywhere.
"""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from backend.services.reliability_service import get_forecast_reliability_overview
from backend.services.risk_classifier import classify_bust_risk


def get_common_forecast_data(
    location: str = "Krishna District",
    lead_day: int = 6,
    sector: str = "General Public"
) -> Dict[str, Any]:
    """
    Returns the single unified forecast and reliability data payload.
    Any page requesting data for a location uses this exact dataset.
    """
    overview = get_forecast_reliability_overview(location=location, focus_lead_day=lead_day, sector=sector)
    
    today = datetime.now()
    target_dt = today + timedelta(days=lead_day)
    target_date_str = target_dt.strftime("%b %d, %Y")

    if not overview.available:
        return {
            "available": False,
            "error": overview.error or "Forecast data unavailable",
            "location": location,
            "target_date": target_date_str,
            "focus_lead_day": lead_day,
            "forecast_run": "NWP Cycle",
            "rainfall": None,
            "rainfall_mm": None,
            "temperature": None,
            "temperature_c": None,
            "precipitation_probability": None,
            "precipitation_probability_pct": None,
            "trust_score": None,
            "bust_probability": None,
            "bust_risk": "DATA UNAVAILABLE",
            "bust_risk_display": "Data Unavailable",
            "risk_level": "UNKNOWN",
            "reliability_level": "UNKNOWN",
            "forecast_drift": None,
            "forecast_drift_mm": None,
            "forecast_drift_str": "Drift data unavailable",
            "confidence": "Unavailable",
            "confidence_label": "DATA UNAVAILABLE",
            "forecast_stability": "UNKNOWN",
            "stability_label": "STABILITY UNAVAILABLE",
            "color": "#94a3b8",
            "badge_class": "badge-risk-mod",
            "recommendation": "Data unavailable for this location.",
            "last_updated": datetime.now().strftime("%I:%M %p"),
            "is_demo": False,
            "disclaimer": overview.disclaimer,
        }
    
    # Extract matching lead day details
    target_lead = next((ld for ld in overview.lead_days if ld.lead_day == lead_day), None)
    
    bust_prob = overview.bust_probability_pct
    trust_score = overview.reliability_score
    risk_info = classify_bust_risk(bust_prob)
    
    rainfall = overview.rainfall_mm if overview.rainfall_mm is not None else (target_lead.primary_risk_driver if target_lead else 0.0)
    temperature = overview.temperature_c if overview.temperature_c is not None else 28.0
    precip_prob = overview.precipitation_probability_pct if overview.precipitation_probability_pct is not None else 50
    drift_val = overview.forecast_drift_mm if overview.forecast_drift_mm is not None else 0.0
    
    return {
        "location": overview.location,
        "target_date": target_date_str,
        "focus_lead_day": lead_day,
        "forecast_run": overview.forecast_run or "00Z GFS Cycle",
        "rainfall": rainfall,
        "rainfall_mm": rainfall,
        "temperature": temperature,
        "temperature_c": temperature,
        "precipitation_probability": precip_prob,
        "precipitation_probability_pct": precip_prob,
        "trust_score": trust_score,
        "bust_probability": bust_prob,
        "bust_risk": risk_info["risk_label"],        # e.g. "HIGH RISK"
        "bust_risk_display": risk_info["risk_display"], # e.g. "High Risk"
        "risk_level": risk_info["risk_level"],        # e.g. "HIGH"
        "reliability_level": risk_info["reliability_level"], # e.g. "LOW"
        "forecast_drift": drift_val,
        "forecast_drift_mm": drift_val,
        "forecast_drift_str": f"+{drift_val:.1f} mm Drift" if drift_val is not None else "Drift data unavailable",
        "confidence": risk_info["confidence"],
        "confidence_label": risk_info["confidence_label"],
        "forecast_stability": overview.forecast_stability,
        "stability_label": f"{overview.forecast_stability} STABILITY",
        "color": risk_info["color"],
        "badge_class": risk_info["badge_class"],
        "recommendation": overview.recommendation,
        "last_updated": overview.last_updated or "Today, 6:30 PM",
        "is_demo": overview.is_demo,
        "disclaimer": overview.disclaimer,
    }
