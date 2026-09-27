"""
WeatherTrust AI — Sector Decision Support Service (Phase 14 / SIH Extension)
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)

Translates technical forecast uncertainty and bust probabilities into simple,
actionable guidance tailored to specific societal and industrial sectors:
- General Public
- Farmer (Agriculture)
- Disaster Management
- Event Organizer
- Logistics & Transport
- Renewable Energy
"""

from typing import Dict, Any, Optional


def get_sector_recommendation(
    sector: str = "General Public",
    bust_prob_pct: int = 76,
    reliability_score: int = 24,
    lead_day: int = 6,
    rain_mm: float = 80.0,
    risk_level: Optional[str] = None,
    focus_lead_day: Optional[int] = None,
    forecast_rain_mm: Optional[float] = None,
    **kwargs
) -> Dict[str, Any]:
    """
    Generates sector-specific decision support advice based on forecast reliability.
    """
    if focus_lead_day is not None:
        lead_day = focus_lead_day
    if forecast_rain_mm is not None:
        rain_mm = forecast_rain_mm
    if risk_level is not None and bust_prob_pct == 76:
        if risk_level.upper() == "LOW":
            bust_prob_pct = 15
            reliability_score = 85
        elif risk_level.upper() == "MODERATE":
            bust_prob_pct = 40
            reliability_score = 60
        else:
            bust_prob_pct = 75
            reliability_score = 25

    sector_normalized = (sector or "General Public").strip()

    # Categorize Risk
    if bust_prob_pct <= 30:
        tier = "LOW_RISK"
        urgency = "Standard Planning"
    elif bust_prob_pct <= 60:
        tier = "MODERATE_RISK"
        urgency = "Caution & Verification"
    else:
        tier = "HIGH_RISK"
        urgency = "Contingency / High Uncertainty"

    recommendations = {
        "General Public": {
            "LOW_RISK": "Forecast is stable. You can proceed with outdoor plans and travel with confidence.",
            "MODERATE_RISK": "Forecast has moderate uncertainty. Keep an eye on daily updates before finalizing outdoor activities.",
            "HIGH_RISK": "Do not make important decisions based only on this forecast. Check the next forecast cycle before committing.",
        },
        "Farmer": {
            "LOW_RISK": "Optimal window for fertilizer application and irrigation based on steady rainfall projections.",
            "MODERATE_RISK": "Postpone pesticide spraying or costly chemical applications until precipitation probability stabilizes.",
            "HIGH_RISK": "Hold off on fertilizer application or harvesting operations due to high rainfall bust potential.",
        },
        "Disaster Management": {
            "LOW_RISK": "Routine monitoring active. No heightened flood or squall alert thresholds triggered.",
            "MODERATE_RISK": "Stage preliminary regional readiness and monitor Doppler radar scans for convective cell growth.",
            "HIGH_RISK": "Issue early cautionary advisory to local emergency response teams. Prepare drainage infrastructure for potential bust surges.",
        },
        "Event Organizer": {
            "LOW_RISK": "Low weather risk. Outdoor setups and stage construction can proceed according to schedule.",
            "MODERATE_RISK": "Secure waterproof canopy covers and prepare contingency indoor staging if rainfall materializes.",
            "HIGH_RISK": "High risk of rainfall discrepancy. Activate indoor fallback venue or review cancellation insurance terms.",
        },
        "Logistics": {
            "LOW_RISK": "Highway transit corridors are clear with low risk of weather-related disruption.",
            "MODERATE_RISK": "Anticipate minor transit delays along coastal ghat routes; prepare alternate routing buffers.",
            "HIGH_RISK": "Heavy forecast volatility. Re-evaluate long-haul freight schedules along flood-prone corridors.",
        },
        "Renewable Energy": {
            "LOW_RISK": "High confidence in solar irradiance and wind velocity profiles for grid dispatch commitment.",
            "MODERATE_RISK": "Moderate cloud cover variability expected. Maintain spinning reserve capacity.",
            "HIGH_RISK": "Volatile irradiance projections. Avoid aggressive day-ahead grid power commitments without thermal backup.",
        },
    }

    sec_recs = recommendations.get(sector_normalized, recommendations["General Public"])
    rec_text = sec_recs.get(tier, sec_recs["HIGH_RISK"])

    return {
        "sector": sector_normalized,
        "risk_tier": tier,
        "urgency": urgency,
        "recommendation": rec_text,
        "action_text": rec_text,
        "summary": rec_text,
        "action_required": tier == "HIGH_RISK",
        "lead_day": lead_day,
        "projected_rain_mm": rain_mm,
    }
