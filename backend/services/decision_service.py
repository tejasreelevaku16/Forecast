"""
WeatherTrust AI — Sector Decision Support Service (Phase 14)
Translates technical forecast uncertainty and bust probabilities into simple,
actionable guidance tailored to specific societal and industrial sectors:
- General Public
- Farmer (Agriculture)
- Disaster Management
- Event Organizer
- Logistics & Transport
- Renewable Energy
"""

from typing import Dict, Any


def get_sector_recommendation(
    sector: str,
    bust_prob_pct: int,
    reliability_score: int,
    lead_day: int,
    rain_mm: float
) -> Dict[str, Any]:
    """
    Generates sector-specific decision support advice based on forecast reliability.
    """
    sector_normalized = (sector or "General Public").strip()
    
    # Categorize Risk
    if bust_prob_pct <= 25:
        tier = "LOW_RISK"
        urgency = "Standard Planning"
    elif bust_prob_pct <= 50:
        tier = "MODERATE_RISK"
        urgency = "Caution & Verification"
    else:
        tier = "HIGH_RISK"
        urgency = "Contingency / High Uncertainty"

    recommendations = {
        "General Public": {
            "LOW_RISK": "Forecast is highly stable. Routine travel, errands, and outdoor plans can proceed as scheduled.",
            "MODERATE_RISK": "Forecast exhibits moderate variance. Check for forecast updates before making irreversible weekend plans.",
            "HIGH_RISK": "Forecast has high uncertainty. Avoid planning weather-dependent activities solely on this outlook; keep a backup plan."
        },
        "Farmer": {
            "LOW_RISK": "High forecast confidence. Suitable for planned irrigation, harvesting, or pesticide spraying based on predicted weather.",
            "MODERATE_RISK": "Moderate rainfall uncertainty. Delay high-cost pesticide spraying or nitrogen fertilizer application until next forecast run.",
            "HIGH_RISK": "Rainfall forecast confidence is low. Avoid making major irrigation, de-silting, or spraying commitments; check next IMD update."
        },
        "Disaster Management": {
            "LOW_RISK": "Forecast trajectory is consistent across models. Maintain normal monitoring posture.",
            "MODERATE_RISK": "Ensemble spread is increasing. Review emergency crew readiness and drainage equipment standby protocols.",
            "HIGH_RISK": "High forecast bust potential. Rapid runoff or dry-slot shift possible. Establish multi-scenario contingency protocols."
        },
        "Event Organizer": {
            "LOW_RISK": "Forecast confidence is strong. Outdoor staging and ticketing can proceed confidently.",
            "MODERATE_RISK": "Moderate rain chance drift. Confirm availability of covered canopies or waterproof electrical shielding.",
            "HIGH_RISK": "High forecast volatility. Do not sign non-refundable outdoor event commitments without weather cancellation clauses."
        },
        "Logistics": {
            "LOW_RISK": "Highway weather conditions predictable. Standard delivery schedules and route allocations apply.",
            "MODERATE_RISK": "Possible localized delays. Monitor road corridor conditions and prepare alternative bypass routes.",
            "HIGH_RISK": "Heavy forecast instability. High risk of sudden localized downpours impacting fleet transit times."
        },
        "Renewable Energy": {
            "LOW_RISK": "Solar irradiance and wind speed profiles are dependable for grid load balancing commitments.",
            "MODERATE_RISK": "Cloud cover variability may fluctuate solar yield by ±20%. Plan spinning reserve buffers.",
            "HIGH_RISK": "Extreme solar/wind forecast uncertainty. High ramp-rate or sudden curtailment risk; avoid aggressive day-ahead bidding."
        }
    }

    sec_map = recommendations.get(sector_normalized, recommendations["General Public"])
    action_text = sec_map.get(tier, sec_map["MODERATE_RISK"])

    return {
        "sector": sector_normalized,
        "risk_tier": tier,
        "urgency_label": urgency,
        "action_text": action_text,
        "reliability_score": reliability_score,
        "bust_probability_pct": bust_prob_pct,
        "disclaimer": "Decision support guidance only. Always cross-reference official warnings from IMD."
    }
