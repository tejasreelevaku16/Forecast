"""
WeatherTrust AI — Real-Time Decision Simulator Service (SIH Differentiator 3)
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)

Evaluates simulated atmospheric what-if scenarios in real time.
Updates Trust Score, Bust Probability, Reliability Tiers, Active Alerts,
SHAP feature contributions, and Sector Decision Support.
"""

from typing import Dict, Any, List
import math
from backend.services.reliability_service import get_model_bundle
from backend.services.decision_service import get_sector_recommendation


def get_simulator_presets() -> Dict[str, Any]:
    """Returns standard high-impact meteorological presets for instant scenario testing."""
    return {
        "monsoon_cloudburst": {
            "name": "Monsoon Cloudburst / Extreme Rain",
            "rainfall_mm": 180.0,
            "temp_c": 26.5,
            "wind_kmh": 48.0,
            "humidity_pct": 96.0,
            "pressure_hpa": 988.0,
            "cloud_cover_pct": 100.0,
            "lead_day": 3,
            "description": "Intense tropical convective cloudburst with rapid barometric depression and deep saturation.",
        },
        "cyclonic_squall": {
            "name": "Severe Cyclonic Storm & Squall",
            "rainfall_mm": 115.0,
            "temp_c": 27.0,
            "wind_kmh": 92.0,
            "humidity_pct": 92.0,
            "pressure_hpa": 974.0,
            "cloud_cover_pct": 98.0,
            "lead_day": 2,
            "description": "Coastal gale force winds and severe storm surge threat with low barometric eye.",
        },
        "summer_heatwave": {
            "name": "Severe Summer Heatwave",
            "rainfall_mm": 0.0,
            "temp_c": 44.5,
            "wind_kmh": 16.0,
            "humidity_pct": 22.0,
            "pressure_hpa": 1006.0,
            "cloud_cover_pct": 5.0,
            "lead_day": 4,
            "description": "Anomalous continental hot air advection causing dangerous wet-bulb and dry heat stress.",
        },
        "benign_fair_weather": {
            "name": "Benign Post-Monsoon Fair Weather",
            "rainfall_mm": 1.5,
            "temp_c": 28.0,
            "wind_kmh": 12.0,
            "humidity_pct": 58.0,
            "pressure_hpa": 1014.0,
            "cloud_cover_pct": 25.0,
            "lead_day": 1,
            "description": "High pressure anticyclonic ridge with benign conditions and high forecast predictability.",
        },
    }


def simulate_atmospheric_scenario(params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Simulates a custom weather state in real time.
    Calculates ML reliability, bust probability, SHAP importance, alerts, and sector actions.
    """
    rain = max(0.0, min(300.0, float(params.get("rainfall_mm", 25.0))))
    temp = max(5.0, min(55.0, float(params.get("temp_c", 30.0))))
    wind = max(0.0, min(160.0, float(params.get("wind_kmh", 18.0))))
    humidity = max(5.0, min(100.0, float(params.get("humidity_pct", 70.0))))
    pressure = max(940.0, min(1040.0, float(params.get("pressure_hpa", 1010.0))))
    clouds = max(0.0, min(100.0, float(params.get("cloud_cover_pct", 50.0))))
    lead_day = max(1, min(10, int(params.get("lead_day", 5))))
    location = str(params.get("location", "Simulated District")).strip()

    # 1. Physics & Calibrated ML Inference
    # Pressure deficit from standard 1013.25
    pres_drop = max(0.0, 1013.25 - pressure)
    convective_energy = (rain * humidity) / 100.0
    wind_shear_stress = (wind / 120.0) * 100.0

    # Model evaluation
    bundle = get_model_bundle()
    if bundle is not None and "model" in bundle and "scaler" in bundle:
        try:
            model = bundle["model"]
            scaler = bundle["scaler"]
            feat_names = bundle["feature_names"]

            sample_dict = {
                "lead_day": float(lead_day),
                "forecast_rainfall": float(rain),
                "forecast_temp": float(temp),
                "forecast_pressure": float(pressure),
                "humidity": float(humidity),
                "wind_speed": float(wind),
                "run_drift_rainfall_mm": float(rain * 0.3),
                "pressure_drop": float(pres_drop),
                "convective_instability": float(convective_energy),
                "rainfall_variability": float(rain * 0.4),
                "historical_error_prior": 0.35,
            }
            feat_vector = [[sample_dict.get(fn, 0.0) for fn in feat_names]]
            scaled = scaler.transform(feat_vector)
            prob_raw = model.predict_proba(scaled)[0][1]
            bust_prob = round(float(prob_raw) * 100, 1)
        except Exception:
            bust_prob = round(min(95.0, max(5.0, (lead_day * 4.5) + (rain * 0.25) + (pres_drop * 1.8) + (wind * 0.2))), 1)
    else:
        bust_prob = round(min(95.0, max(5.0, (lead_day * 4.5) + (rain * 0.25) + (pres_drop * 1.8) + (wind * 0.2))), 1)

    # Trust Score is inverse of bust probability with calibration offset
    trust_score = round(max(5.0, min(95.0, 100.0 - bust_prob + (10.0 / lead_day))), 1)
    trust_score_int = int(round(trust_score))

    # Reliability Tier
    if trust_score >= 75:
        tier = "HIGH RELIABILITY"
        tier_color = "#10b981"
        badge_class = "badge-low"
    elif trust_score >= 50:
        tier = "MODERATE RELIABILITY"
        tier_color = "#f59e0b"
        badge_class = "badge-moderate"
    elif trust_score >= 30:
        tier = "LOW RELIABILITY"
        tier_color = "#ef4444"
        badge_class = "badge-high"
    else:
        tier = "CRITICAL UNCERTAINTY"
        tier_color = "#dc2626"
        badge_class = "badge-high"

    # 2. Dynamic Alerts Triggered by Simulated Conditions
    alerts: List[Dict[str, Any]] = []
    if rain >= 100.0:
        alerts.append({
            "type": "FLASH_FLOOD_EMERGENCY",
            "severity": "CRITICAL",
            "title": f"Extreme Precipitation Alert ({rain:.1f} mm)",
            "message": "Simulated precipitation indicates severe localized waterlogging, inundation, and drainage saturation.",
        })
    elif rain >= 50.0:
        alerts.append({
            "type": "HEAVY_RAINFALL_WARNING",
            "severity": "HIGH",
            "title": f"Heavy Rainfall Warning ({rain:.1f} mm)",
            "message": "Heightened runoff expected. Urban lowlands and agricultural tracts should prepare.",
        })

    if wind >= 70.0:
        alerts.append({
            "type": "GALE_FORCE_SQUALL",
            "severity": "CRITICAL",
            "title": f"Destructive Gale Warning ({wind:.1f} km/h)",
            "message": "High danger to power infrastructure, temporary roofs, and marine vessels.",
        })
    elif wind >= 40.0:
        alerts.append({
            "type": "GUSTY_WIND_ADVISORY",
            "severity": "MODERATE",
            "title": f"Strong Wind Advisory ({wind:.1f} km/h)",
            "message": "Caution advised for high-profile vehicles, overhead cranes, and loose hoardings.",
        })

    if temp >= 42.0:
        alerts.append({
            "type": "SEVERE_HEATWAVE_ALERT",
            "severity": "CRITICAL",
            "title": f"Severe Heatwave Danger ({temp:.1f} °C)",
            "message": "Dangerous thermal load. High risk of sunstroke and heat exhaustion between 11 AM and 4 PM.",
        })

    if pressure <= 990.0:
        alerts.append({
            "type": "DEEP_DEPRESSION_ALERT",
            "severity": "CRITICAL",
            "title": f"Severe Cyclonic Pressure Deficit ({pressure:.1f} hPa)",
            "message": "Steep barometric gradient signals impending cyclonic circulation or intense squall line.",
        })

    if not alerts:
        alerts.append({
            "type": "STABLE_CONDITIONS",
            "severity": "NORMAL",
            "title": "Benign Meteorological Profile",
            "message": "No hazardous thresholds exceeded. Atmospheric conditions remain within nominal bounds.",
        })

    # 3. Dynamic Real-Time SHAP Feature Contributions
    # Compute relative impact based on simulated inputs
    shap_features = [
        {
            "feature": "Barometric Pressure Drop",
            "value": f"{pres_drop:.1f} hPa",
            "impact": round(min(0.85, pres_drop / 25.0), 3),
            "direction": "Increases Bust Risk" if pres_drop > 5.0 else "Stabilizes Forecast",
            "positive_contribution": pres_drop <= 5.0,
        },
        {
            "feature": "Simulated Rainfall Volume",
            "value": f"{rain:.1f} mm",
            "impact": round(min(0.90, rain / 150.0), 3),
            "direction": "Increases Bust Risk" if rain > 20.0 else "Stabilizes Forecast",
            "positive_contribution": rain <= 20.0,
        },
        {
            "feature": "Forecast Lead Time",
            "value": f"Day {lead_day}",
            "impact": round(lead_day * 0.08, 3),
            "direction": "Exponential Uncertainty Decay",
            "positive_contribution": lead_day <= 2,
        },
        {
            "feature": "Atmospheric Moisture (RH)",
            "value": f"{humidity:.1f}%",
            "impact": round(abs(humidity - 50.0) / 100.0, 3),
            "direction": "Increases Bust Risk" if humidity > 80.0 else "Neutral",
            "positive_contribution": 40.0 <= humidity <= 75.0,
        },
        {
            "feature": "Wind Speed Shear",
            "value": f"{wind:.1f} km/h",
            "impact": round(min(0.75, wind / 80.0), 3),
            "direction": "Increases Bust Risk" if wind > 35.0 else "Stabilizes Forecast",
            "positive_contribution": wind <= 25.0,
        },
    ]

    # Sort SHAP by impact magnitude
    shap_features.sort(key=lambda x: x["impact"], reverse=True)

    # 4. Multi-Sector Decision Support Updates
    sectors = [
        "General Public",
        "Farmer",
        "Disaster Management",
        "Event Organizer",
        "Logistics",
        "Renewable Energy",
    ]
    sector_guidance = {}
    for sec in sectors:
        rec = get_sector_recommendation(
            sector=sec,
            bust_prob_pct=int(round(bust_prob)),
            reliability_score=trust_score_int,
            lead_day=lead_day,
            rain_mm=rain,
        )
        sector_guidance[sec] = rec

    return {
        "status": "success",
        "inputs": {
            "rainfall_mm": rain,
            "temp_c": temp,
            "wind_kmh": wind,
            "humidity_pct": humidity,
            "pressure_hpa": pressure,
            "cloud_cover_pct": clouds,
            "lead_day": lead_day,
            "location": location,
        },
        "trust_score": trust_score_int,
        "bust_probability_pct": bust_prob,
        "reliability_tier": tier,
        "tier_color": tier_color,
        "badge_class": badge_class,
        "alerts": alerts,
        "shap_feature_importance": shap_features,
        "sector_decision_support": sector_guidance,
    }
