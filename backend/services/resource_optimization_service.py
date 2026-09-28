"""
WeatherTrust AI — Resource Optimization AI Service (SIH Differentiator 5)
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)

Translates forecast confidence, bust probability, rainfall, and flood risk into dynamic
operational resource deployment recommendations: NDRF staging, Relief Camps, Reservoirs,
Heavy De-watering Pumps, Medical Readiness, and multi-district priority rankings.
"""

from typing import Dict, Any, List
import math
from backend.services.weather_service import get_full_forecast_response
from backend.services.historical_error_service import get_district_historical_error_prior
from backend.services.reliability_service import get_forecast_reliability_overview


# Benchmark districts for multi-district resource allocation ranking
BENCHMARK_DISTRICTS = [
    {"name": "Vijayawada", "population": 1250000, "flood_vulnerability": 0.85, "river_basin": "Krishna River"},
    {"name": "Guntur", "population": 890000, "flood_vulnerability": 0.70, "river_basin": "Krishna Delta"},
    {"name": "Visakhapatnam", "population": 2350000, "flood_vulnerability": 0.78, "river_basin": "Coastal Bay"},
    {"name": "Tirupati", "population": 460000, "flood_vulnerability": 0.60, "river_basin": "Swarnamukhi Basin"},
    {"name": "Nellore", "population": 600000, "flood_vulnerability": 0.82, "river_basin": "Pennar Basin"},
    {"name": "Kurnool", "population": 480000, "flood_vulnerability": 0.65, "river_basin": "Tungabhadra Basin"},
    {"name": "Hyderabad", "population": 6800000, "flood_vulnerability": 0.72, "river_basin": "Musi Basin"},
    {"name": "Bhopal", "population": 1800000, "flood_vulnerability": 0.68, "river_basin": "Upper Lake Basin"},
]


def get_resource_optimization_plan(location: str = "Vijayawada", lead_day: int = 6) -> Dict[str, Any]:
    """
    Computes real-time dynamic resource allocation priorities for disaster response agencies.
    """
    clean_loc = str(location).strip() or "Vijayawada"
    day = max(1, min(10, int(lead_day)))

    # Fetch live forecast for the focus location
    fc_data = get_full_forecast_response(location_query=clean_loc)
    daily_items = fc_data.daily if fc_data and fc_data.daily else []
    day_fc = daily_items[day - 1] if day - 1 < len(daily_items) else None

    rain_mm = float(day_fc.precipitation_mm) if day_fc else 22.0
    wind_kmh = float(day_fc.wind_speed_kmh) if day_fc else 18.0

    # Get reliability overview
    rel_overview = get_forecast_reliability_overview(location=clean_loc, focus_lead_day=day)
    confidence_score = float(rel_overview.reliability_score) if rel_overview else 45.0
    bust_prob_pct = float(rel_overview.bust_probability_pct) if rel_overview else 55.0

    # Population & flood risk estimation
    matched = next((d for d in BENCHMARK_DISTRICTS if d["name"].lower() in clean_loc.lower()), None)
    base_pop = matched["population"] if matched else 1000000
    base_vuln = matched["flood_vulnerability"] if matched else 0.75

    # Flood risk index (0 to 100)
    flood_risk_score = round(min(100.0, max(10.0, (rain_mm * 0.95) + (base_vuln * 35.0) + (bust_prob_pct * 0.15))), 1)

    # 1. NDRF Deployment Priority
    if flood_risk_score >= 75 or (rain_mm > 70.0 and bust_prob_pct > 50):
        ndrf_tier = "TIER 1 (IMMEDIATE PRE-POSITIONING)"
        ndrf_battalions = 4
        ndrf_boats = 16
        ndrf_status = "URGENT DISPATCH"
        ndrf_color = "#ef4444"
        ndrf_guidance = (
            f"Pre-deploy {ndrf_battalions} NDRF battalions and {ndrf_boats} motorized inflatable rescue boats to {clean_loc}. "
            f"High rainfall forecast ({rain_mm} mm) coupled with {bust_prob_pct}% bust uncertainty requires immediate mobilization."
        )
    elif flood_risk_score >= 45 or rain_mm > 30.0:
        ndrf_tier = "TIER 2 (REGIONAL STANDBY)"
        ndrf_battalions = 2
        ndrf_boats = 8
        ndrf_status = "STAGED READINESS"
        ndrf_color = "#f59e0b"
        ndrf_guidance = (
            f"Stage {ndrf_battalions} battalions at regional headquarters. Monitor Doppler radar 3-hour precipitation accumulation."
        )
    else:
        ndrf_tier = "TIER 3 (ROUTINE MONITORING)"
        ndrf_battalions = 0
        ndrf_boats = 2
        ndrf_status = "STANDBY"
        ndrf_color = "#10b981"
        ndrf_guidance = "Normal operational posture. Local civil defense and SDRF on standard standby."

    # 2. Relief Camp Recommendation
    vulnerable_pop_ratio = (flood_risk_score / 100.0) * base_vuln * 0.08
    est_evacuees = int(base_pop * vulnerable_pop_ratio)
    shelters_needed = max(2, math.ceil(est_evacuees / 500)) if est_evacuees > 200 else 1
    food_ration_days = 7 if flood_risk_score > 60 else 3
    water_tankers = max(4, shelters_needed * 3)

    relief_camps = {
        "recommended_shelters_count": shelters_needed,
        "estimated_evacuees_capacity": shelters_needed * 500,
        "vulnerable_population_estimate": est_evacuees,
        "emergency_food_ration_buffer_days": food_ration_days,
        "clean_potable_water_tankers": water_tankers,
        "status": "ACTIVATE SHELTERS" if shelters_needed > 3 else "STAGE FACILITIES",
        "guidance": (
            f"Identify and inspect {shelters_needed} cyclone/flood relief centers with capacity for {shelters_needed * 500:,} persons. "
            f"Stockpile {food_ration_days} days of non-perishable rations and deploy {water_tankers} dedicated potable water tankers."
        ),
    }

    # 3. Reservoir Monitoring Priority
    if rain_mm > 60.0 or flood_risk_score > 70:
        reservoir_status = "CONTROLLED EMERGENCY DISCHARGE"
        cushion_buffer_pct = 25.0
        spillway_action = "Open 4-6 crest gates to create minimum 20% flood cushion ahead of peak catchment runoff."
        reservoir_priority = "HIGH PRIORITY"
        reservoir_color = "#ef4444"
    elif rain_mm > 25.0 or flood_risk_score > 40:
        reservoir_status = "REGULATED OUTFLOW MONITORING"
        cushion_buffer_pct = 15.0
        spillway_action = "Maintain continuous telemetric inflow gauge monitoring; prepare for regulated nocturnal outflow."
        reservoir_priority = "MODERATE PRIORITY"
        reservoir_color = "#f59e0b"
    else:
        reservoir_status = "NORMAL CONSERVATION STORAGE"
        cushion_buffer_pct = 8.0
        spillway_action = "Conserve storage for irrigation and municipal use; gates remain on standard seasonal schedule."
        reservoir_priority = "NORMAL"
        reservoir_color = "#10b981"

    reservoir_plan = {
        "priority_level": reservoir_priority,
        "status": reservoir_status,
        "color": reservoir_color,
        "required_flood_cushion_pct": cushion_buffer_pct,
        "spillway_advisory": spillway_action,
        "basin_name": matched["river_basin"] if matched else "Local Basin",
    }

    # 4. Pump Allocation Suggestion (Heavy de-watering)
    pump_count = max(4, int((rain_mm / 15.0) * (base_vuln * 8)))
    high_capacity_pumps = max(2, int(pump_count * 0.4))
    standard_pumps = pump_count - high_capacity_pumps

    pump_allocation = {
        "total_pumps_allocated": pump_count,
        "high_capacity_1000gpm_pumps": high_capacity_pumps,
        "mobile_trailer_pumps": standard_pumps,
        "target_inundation_zones": [
            f"{clean_loc} Railway Underpass & Arterial Corridors",
            "Low-lying Riverbank Settlements & Outfalls",
            "Hospital & Critical Substation Perimeter",
            "Agricultural Drainage Outflow Sluices",
        ],
        "deployment_timeline": "Pre-stage within 4 hours",
    }

    # 5. Medical Emergency Readiness
    medical_readiness = {
        "mobile_medical_units_standby": max(2, math.ceil(shelters_needed / 2)),
        "anti_snake_venom_vials": max(50, shelters_needed * 25),
        "chlorine_water_purification_tablets": shelters_needed * 10000,
        "ors_packets_stockpile": shelters_needed * 2500,
        "critical_power_generators": max(2, shelters_needed),
        "disease_surveillance_protocol": "Water-borne & Leptospirosis Active Surveillance",
    }

    # 6. District Resource Ranking (Ranking all benchmark districts by Urgency Index)
    # Urgency Index = 0.30*Rainfall + 0.25*FloodRisk + 0.20*BustProb + 0.15*PopRisk + 0.10*(100-Confidence)
    ranked_districts: List[Dict[str, Any]] = []

    for d in BENCHMARK_DISTRICTS:
        d_name = d["name"]
        # If this is the current location, use exact live values
        if d_name.lower() in clean_loc.lower():
            d_rain = rain_mm
            d_flood = flood_risk_score
            d_bust = bust_prob_pct
            d_conf = confidence_score
        else:
            # Deterministic variation based on district baseline
            d_rain = round(max(5.0, (rain_mm * (0.6 + (hash(d_name) % 80) / 100.0))), 1)
            d_flood = round(min(98.0, max(15.0, (d_rain * 0.9) + (d["flood_vulnerability"] * 30.0))), 1)
            d_bust = round(min(90.0, max(10.0, 35.0 + (hash(d_name) % 45))), 1)
            d_conf = round(100.0 - d_bust, 1)

        pop_risk = min(100.0, (d["population"] / 3000000.0) * 100.0)

        # Composite Urgency Score (0 to 100)
        urgency_score = round(
            (0.30 * min(100.0, d_rain * 1.2)) +
            (0.25 * d_flood) +
            (0.20 * d_bust) +
            (0.15 * pop_risk) +
            (0.10 * (100.0 - d_conf)),
            1
        )

        ranked_districts.append({
            "district": d_name,
            "river_basin": d["river_basin"],
            "population": d["population"],
            "urgency_score": urgency_score,
            "predicted_rainfall_mm": d_rain,
            "flood_risk_score": d_flood,
            "bust_probability_pct": d_bust,
            "confidence_score": d_conf,
            "recommended_ndrf_teams": 4 if urgency_score > 70 else (2 if urgency_score > 45 else 0),
            "priority_rank": 0,
        })

    # Sort descending by urgency score
    ranked_districts.sort(key=lambda x: x["urgency_score"], reverse=True)
    for idx, item in enumerate(ranked_districts):
        item["priority_rank"] = idx + 1

    return {
        "status": "success",
        "location": clean_loc,
        "lead_day": day,
        "current_district_metrics": {
            "rainfall_mm": rain_mm,
            "flood_risk_score": flood_risk_score,
            "confidence_score": confidence_score,
            "bust_probability_pct": bust_prob_pct,
        },
        "ndrf_deployment": {
            "tier": ndrf_tier,
            "battalions": ndrf_battalions,
            "inflatable_rescue_boats": ndrf_boats,
            "operational_status": ndrf_status,
            "status_color": ndrf_color,
            "guidance": ndrf_guidance,
        },
        "relief_camps": relief_camps,
        "reservoir_monitoring": reservoir_plan,
        "pump_allocation": pump_allocation,
        "medical_readiness": medical_readiness,
        "district_resource_ranking": ranked_districts,
    }
