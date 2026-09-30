"""
WeatherTrust AI — Centralized Synoptic Weather Event Classifier
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)

Provides a unified, deterministic, and scientifically consistent taxonomy for weather events:
- Normal
- Heavy Rainfall
- Cyclone
- Heat Wave
- Western Disturbance
- Monsoon Depression
- Active Monsoon
- Break Monsoon
- UNKNOWN

Exact identical logic is shared across:
Training Data Generation -> Validation -> Testing -> Live Feature Engineering -> Real-time Inference.
"""

from typing import Tuple, Dict, Any, Optional

# Supported Synoptic Weather Events Taxonomy
EVENT_NORMAL = "Normal"
EVENT_HEAVY_RAINFALL = "Heavy Rainfall"
EVENT_CYCLONE = "Cyclone"
EVENT_HEAT_WAVE = "Heat Wave"
EVENT_WESTERN_DISTURBANCE = "Western Disturbance"
EVENT_MONSOON_DEPRESSION = "Monsoon Depression"
EVENT_ACTIVE_MONSOON = "Active Monsoon"
EVENT_BREAK_MONSOON = "Break Monsoon"
EVENT_UNKNOWN = "UNKNOWN"

SUPPORTED_EVENT_TAXONOMY = [
    EVENT_NORMAL,
    EVENT_HEAVY_RAINFALL,
    EVENT_CYCLONE,
    EVENT_HEAT_WAVE,
    EVENT_WESTERN_DISTURBANCE,
    EVENT_MONSOON_DEPRESSION,
    EVENT_ACTIVE_MONSOON,
    EVENT_BREAK_MONSOON,
    EVENT_UNKNOWN,
]


def classify_synoptic_weather_event(
    month: Optional[int],
    rainfall_mm: float,
    temp_c: float,
    pressure_hpa: float = 1013.25,
    wind_speed_kmh: float = 15.0,
    humidity_pct: float = 65.0,
    latitude: Optional[float] = None,
    climate_zone: Optional[str] = None,
) -> Tuple[str, str, Dict[str, Any]]:
    """
    Classifies the synoptic weather regime and season based on physical meteorological criteria.
    
    Returns:
        (season, event_type, metadata_dict)
    """
    # Guard against invalid or missing month
    if month is None or not (1 <= int(month) <= 12):
        return "Unknown", EVENT_UNKNOWN, {"detection_method": "INSUFFICIENT_DATA", "reason": "Month missing"}

    month = int(month)
    climate = (climate_zone or "").lower()
    lat = float(latitude) if latitude is not None else 18.0

    # Determine Meteorological Season (India Meteorological Department standard)
    if month in [6, 7, 8, 9]:
        season = "Southwest Monsoon"
    elif month in [10, 11, 12]:
        season = "Post-Monsoon / Northeast Monsoon"
    elif month in [1, 2]:
        season = "Winter"
    else:  # [3, 4, 5]
        season = "Pre-Monsoon / Summer"

    event = EVENT_NORMAL
    detection_rule = "CLIMATOLOGICAL_BASELINE"

    # 1. Cyclonic Storm / Severe Low Pressure System
    is_cyclonic_conditions = (
        (pressure_hpa <= 1002.0 and wind_speed_kmh >= 50.0 and rainfall_mm >= 30.0) or
        (pressure_hpa <= 998.0 and wind_speed_kmh >= 45.0) or
        (wind_speed_kmh >= 65.0 and rainfall_mm >= 40.0)
    )
    if is_cyclonic_conditions and ("coastal" in climate or "cyclon" in climate or (month in [4, 5, 10, 11, 12] and lat < 23.0)):
        event = EVENT_CYCLONE
        detection_rule = "DEEP_DEPRESSION_OR_CYCLONIC_CIRCULATION"

    # 2. Western Disturbance (Active in Northern/Subtropical India during Winter & Early Spring)
    elif month in [11, 12, 1, 2, 3] and lat >= 22.0 and (rainfall_mm >= 8.0 or (pressure_hpa <= 1010.0 and rainfall_mm >= 4.0)):
        event = EVENT_WESTERN_DISTURBANCE
        detection_rule = "MID_LATITUDE_TROUGH_INTERACTION"

    # 3. Monsoon Depression / Active vs Break Monsoon (Southwest Monsoon Phase)
    elif season == "Southwest Monsoon":
        if rainfall_mm >= 65.0 or (rainfall_mm >= 40.0 and pressure_hpa <= 1004.0):
            event = EVENT_MONSOON_DEPRESSION
            detection_rule = "SYNOPTIC_MONSOON_LOW"
        elif rainfall_mm >= 30.0:
            event = EVENT_HEAVY_RAINFALL
            detection_rule = "OROGRAPHIC_CONVECTIVE_PRECIPITATION"
        elif rainfall_mm >= 2.0:
            event = EVENT_ACTIVE_MONSOON
            detection_rule = "MONSOON_TROUGH_NORMAL"
        elif rainfall_mm <= 1.5 and humidity_pct < 60.0:
            event = EVENT_BREAK_MONSOON
            detection_rule = "MONSOON_CONVERGENCE_BREAK"
        else:
            event = EVENT_NORMAL
            detection_rule = "STANDARD_MONSOON_REGIME"

    # 4. Heat Wave (Pre-Monsoon & Summer)
    elif (temp_c >= 42.0) or (temp_c >= 40.0 and ("arid" in climate or "desert" in climate or month in [4, 5])):
        event = EVENT_HEAT_WAVE
        detection_rule = "THERMAL_ADVECTION_EXTREME"

    # 5. Heavy Rainfall (Non-Monsoon isolated convective burst)
    elif rainfall_mm >= 35.0:
        event = EVENT_HEAVY_RAINFALL
        detection_rule = "SEVERE_MESOSCALE_CONVECTION"

    # 6. Post-Monsoon Coastal Northeast Monsoon Rain
    elif season == "Post-Monsoon / Northeast Monsoon" and ("tamil" in climate or "coastal" in climate or lat < 15.0) and rainfall_mm >= 20.0:
        event = EVENT_HEAVY_RAINFALL
        detection_rule = "NORTHEAST_MONSOON_EASTERLIES"

    else:
        event = EVENT_NORMAL
        detection_rule = "QUIET_SYNOPTIC_BACKGROUND"

    metadata = {
        "season": season,
        "event_type": event,
        "detection_method": "NWP_SYNOPTIC_PHYSICAL_RULES",
        "detection_rule": detection_rule,
        "parameters": {
            "month": month,
            "rainfall_mm": round(rainfall_mm, 1),
            "temp_c": round(temp_c, 1),
            "pressure_hpa": round(pressure_hpa, 1),
            "wind_speed_kmh": round(wind_speed_kmh, 1),
            "humidity_pct": round(humidity_pct, 1),
            "latitude": round(lat, 4) if latitude is not None else None,
        }
    }

    return season, event, metadata
