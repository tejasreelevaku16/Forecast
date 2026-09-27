"""Weather-derived trust, replay, disagreement, and impact insights."""

from typing import Any, Dict, List, Optional

from backend.models.insight_model import ForecastInsightsRequest
from backend.models.weather_model import DailyForecastItem

TRUST_WEIGHTS = {
    "Rainfall": 0.32,
    "Wind": 0.18,
    "Pressure": 0.20,
    "Cloud Cover": 0.12,
    "Humidity": 0.18,
}


def _clamp(value: float, lower: float = 0.0, upper: float = 100.0) -> float:
    return max(lower, min(upper, value))


def _weather_code_risk(code: int) -> float:
    if code in (95, 96, 97, 99):
        return 100.0
    if code in (65, 67, 82, 86):
        return 90.0
    if code in (63, 75, 81, 85):
        return 75.0
    if code in (61, 71, 80, 73):
        return 55.0
    if code in (51, 53, 55, 56, 57, 66):
        return 35.0
    if code in (45, 48):
        return 25.0
    return 0.0


def calculate_weather_trust(
    forecast_day: DailyForecastItem,
    pressure_reference_hpa: Optional[float] = None,
) -> Dict[str, Any]:
    """Calculate a transparent 0-100 trust score from a real forecast day's fields."""
    required = {
        "rainfall_mm": forecast_day.precipitation_mm,
        "precipitation_probability_pct": forecast_day.rain_chance_pct,
        "temperature_min_c": forecast_day.temp_min_c,
        "temperature_max_c": forecast_day.temp_max_c,
        "humidity_pct": forecast_day.humidity_pct,
        "wind_speed_kmh": forecast_day.wind_speed_kmh,
        "pressure_hpa": forecast_day.pressure_hpa,
        "cloud_cover_pct": forecast_day.cloud_cover_pct,
        "wmo_code": forecast_day.wmo_code,
    }
    missing = [name for name, value in required.items() if value is None]
    if missing:
        return {"available": False, "error": f"Forecast inputs unavailable: {', '.join(missing)}"}

    rainfall = float(forecast_day.precipitation_mm)
    rain_chance = float(forecast_day.rain_chance_pct)
    temp_min = float(forecast_day.temp_min_c)
    temp_max = float(forecast_day.temp_max_c)
    humidity = float(forecast_day.humidity_pct)
    wind = float(forecast_day.wind_speed_kmh)
    pressure = float(forecast_day.pressure_hpa)
    cloud = float(forecast_day.cloud_cover_pct)
    wmo_code = int(forecast_day.wmo_code)
    temperature = (temp_min + temp_max) / 2

    temperature_risk = _clamp(max(temp_max - 35, 5 - temp_min) * 5)
    rain_risk = _clamp(max(rainfall / 30 * 100, rain_chance * 0.75))
    rain_signal = max(rain_risk, _weather_code_risk(wmo_code) * 0.85, temperature_risk * 0.4)
    wind_signal = _clamp((wind - 20) * 2.5)
    pressure_drop = max(0.0, float(pressure_reference_hpa) - pressure) if pressure_reference_hpa is not None else 0.0
    pressure_signal = _clamp(max((1005 - pressure) * 4, pressure_drop * 8))
    cloud_signal = _clamp((cloud - 40) * 1.25)
    humidity_signal = _clamp(max((humidity - 70) * 2, (25 - humidity) * 1.5, temperature_risk * 0.5))

    signals = {
        "Rainfall": rain_signal,
        "Wind": wind_signal,
        "Pressure": pressure_signal,
        "Cloud Cover": cloud_signal,
        "Humidity": humidity_signal,
    }
    weighted_risk = {name: TRUST_WEIGHTS[name] * signal for name, signal in signals.items()}
    total_risk = sum(weighted_risk.values())
    score = int(round(_clamp(100 - total_risk)))
    label = "Reliable" if score >= 80 else "Watch" if score >= 50 else "Unreliable"
    contributions = [
        {
            "name": name,
            "signal_pct": round(signals[name], 1),
            "contribution_pct": round(weighted_risk[name] / total_risk * 100, 1) if total_risk else 0,
        }
        for name in TRUST_WEIGHTS
    ]

    if wmo_code in (95, 96, 97, 99):
        reason = f"Convective instability: the forecast carries WMO thunderstorm code {wmo_code}."
    elif pressure_drop >= 4:
        reason = f"Rapid pressure fall: pressure is down {pressure_drop:.1f} hPa from Day 1."
    elif rainfall >= 20 and rain_chance >= 50:
        reason = f"Moisture surge detected: {rainfall:.1f} mm rainfall is forecast with {rain_chance:.0f}% precipitation probability."
    elif humidity >= 80 and temperature >= 30:
        reason = "Convective instability: warm, humid forecast conditions increase atmospheric sensitivity."
    elif wind >= 40:
        reason = f"Strong wind signal: forecast wind reaches {wind:.1f} km/h."
    elif cloud >= 85:
        reason = f"Extensive cloud cover: {cloud:.0f}% cloud cover reduces forecast stability."
    elif score >= 80:
        reason = "Stable atmosphere: the selected forecast day has comparatively low weather-stress signals."
    else:
        reason = "Mixed weather signals: review the feature contributions before making a weather-sensitive decision."

    return {
        "available": True,
        "score": score,
        "label": label,
        "bust_probability_pct": 100 - score,
        "reason": reason,
        "features": {
            "rainfall_mm": round(rainfall, 1),
            "temperature_c": round(temperature, 1),
            "humidity_pct": round(humidity, 1),
            "wind_speed_kmh": round(wind, 1),
            "pressure_hpa": round(pressure, 1),
            "pressure_drop_hpa": round(pressure_drop, 1),
            "cloud_cover_pct": round(cloud, 1),
            "wmo_code": wmo_code,
        },
        "contributions": contributions,
    }


def _trajectory_confidence(days: List[DailyForecastItem]) -> Optional[int]:
    if len(days) < 2:
        return None
    scales = {
        "precipitation_mm": 30.0,
        "temperature": 15.0,
        "wind_speed_kmh": 40.0,
        "humidity_pct": 50.0,
        "pressure_hpa": 15.0,
    }
    changes = []
    for previous, latest in zip(days, days[1:]):
        pairs = [
            (previous.precipitation_mm, latest.precipitation_mm, scales["precipitation_mm"]),
            ((previous.temp_min_c + previous.temp_max_c) / 2, (latest.temp_min_c + latest.temp_max_c) / 2, scales["temperature"]),
            (previous.wind_speed_kmh, latest.wind_speed_kmh, scales["wind_speed_kmh"]),
            (previous.humidity_pct, latest.humidity_pct, scales["humidity_pct"]),
            (previous.pressure_hpa, latest.pressure_hpa, scales["pressure_hpa"]),
        ]
        for before, after, scale in pairs:
            if before is None or after is None:
                return None
            changes.append(_clamp(abs(float(after) - float(before)) / scale * 100))
    return int(round(100 - sum(changes) / len(changes))) if changes else None


def _risk_level(signal: float) -> str:
    return "HIGH" if signal >= 60 else "MODERATE" if signal >= 30 else "LOW"


def _impact_advisories(day: DailyForecastItem) -> List[Dict[str, str]]:
    rainfall = float(day.precipitation_mm)
    rain_chance = float(day.rain_chance_pct)
    wind = float(day.wind_speed_kmh)
    humidity = float(day.humidity_pct)
    temp_max = float(day.temp_max_c)
    wmo_risk = _weather_code_risk(int(day.wmo_code))
    rain_risk = _clamp(max(rainfall / 30 * 100, rain_chance * 0.75, wmo_risk * 0.85))
    wind_risk = _clamp((wind - 20) * 2.5)
    heat_risk = _clamp((temp_max - 34) * 6)
    humidity_risk = _clamp((humidity - 75) * 2)

    conditions = [
        ("Disaster Management", max(rain_risk, wind_risk, wmo_risk),
         f"{rainfall:.1f} mm forecast rainfall at {rain_chance:.0f}% probability; wind {wind:.1f} km/h.",
         "Review local thresholds and drainage readiness." if rain_risk >= 60 else "Monitor the next forecast update and local alerts." if rain_risk >= 30 else "Continue routine monitoring."),
        ("Agriculture", max(rain_risk, heat_risk, humidity_risk),
         f"Forecast rainfall {rainfall:.1f} mm, maximum temperature {temp_max:.1f}°C, humidity {humidity:.0f}%.",
         "Protect harvested crops and avoid weather-sensitive field work." if rain_risk >= 60 or heat_risk >= 60 else "Time spraying and irrigation around the forecast window." if rain_risk >= 30 or humidity_risk >= 30 else "Proceed with routine field planning."),
        ("Fisheries", max(wind_risk, wmo_risk, rain_chance * 0.5),
         f"Forecast wind {wind:.1f} km/h with WMO weather code {int(day.wmo_code)}.",
         "Check official marine warnings before departure." if wind_risk >= 60 or wmo_risk >= 75 else "Confirm local sea conditions before departure." if wind_risk >= 30 else "Follow normal local marine advisories."),
        ("Transportation", max(rain_risk, wind_risk, wmo_risk),
         f"Rainfall {rainfall:.1f} mm, wind {wind:.1f} km/h, and WMO weather code {int(day.wmo_code)}.",
         "Review exposed routes and allow additional travel time." if rain_risk >= 60 or wind_risk >= 60 else "Monitor route conditions near the forecast period." if rain_risk >= 30 or wind_risk >= 30 else "No weather-driven route change is indicated by this forecast."),
        ("Reservoir & Water Resources", max(rain_risk, rain_chance * 0.8),
         f"Forecast rainfall {rainfall:.1f} mm at {rain_chance:.0f}% probability.",
         "Review inflow and operating thresholds using local observations." if rain_risk >= 60 else "Compare the next forecast cycle with current catchment conditions." if rain_risk >= 30 else "Continue routine level monitoring."),
    ]
    return [
        {"sector": sector, "risk_level": _risk_level(signal), "expected_impact": impact, "recommended_action": action}
        for sector, signal, impact, action in conditions
    ]


def build_forecast_insights(request: ForecastInsightsRequest) -> Dict[str, Any]:
    forecast = request.forecast
    reliability = request.reliability
    if forecast.available is False or not forecast.daily:
        return {"available": False, "error": forecast.error or "Forecast fields unavailable"}

    days = forecast.daily
    pressure_reference = days[0].pressure_hpa
    replay_days = []
    trust_by_day = []
    for day in days:
        trust = calculate_weather_trust(day, pressure_reference)
        trust_by_day.append(trust)
        reliability_day = next((item for item in reliability.lead_days if item.lead_day == day.day_index), None) if reliability and reliability.available else None
        replay_days.append({
            "day": day.day_index,
            "day_name": day.day_name,
            "date": day.date,
            "rainfall_mm": day.precipitation_mm,
            "temperature_min_c": day.temp_min_c,
            "temperature_max_c": day.temp_max_c,
            "wind_speed_kmh": day.wind_speed_kmh,
            "humidity_pct": day.humidity_pct,
            "pressure_hpa": day.pressure_hpa,
            "cloud_cover_pct": day.cloud_cover_pct,
            "wmo_code": day.wmo_code,
            "trust": trust,
            "bust_probability_pct": reliability_day.bust_probability_pct if reliability_day else None,
            "reliability_score": reliability_day.reliability_score if reliability_day else None,
        })

    focus_index = min(max(request.focus_lead_day - 1, 0), len(days) - 1)
    focus_day = days[focus_index]
    focus_trust = trust_by_day[focus_index]
    nwp_confidence = _trajectory_confidence(days)
    ai_confidence = None
    bust_probability = None
    if reliability and reliability.available:
        reliability_day = next((item for item in reliability.lead_days if item.lead_day == request.focus_lead_day), None)
        if reliability_day:
            ai_confidence = reliability_day.reliability_score
            bust_probability = reliability_day.bust_probability_pct

    disagreement_index = abs(nwp_confidence - ai_confidence) if nwp_confidence is not None and ai_confidence is not None else None
    disagreement_level = None
    disagreement_reason = "Comparison unavailable until both forecast consistency and AI reliability are available."
    if disagreement_index is not None:
        disagreement_level = "LOW" if disagreement_index <= 15 else "MEDIUM" if disagreement_index <= 35 else "HIGH"
        if disagreement_index <= 15:
            disagreement_reason = "NWP trajectory consistency and AI reliability confidence are closely aligned."
        elif ai_confidence < nwp_confidence:
            disagreement_reason = f"AI reliability is lower because {focus_trust.get('reason', 'weather feature risks are elevated').lower()}"
        else:
            disagreement_reason = "The day-to-day NWP weather trajectory varies more than the calibrated AI reliability estimate."

    first = replay_days[0]
    last = replay_days[-1]
    drift_fields = ("rainfall_mm", "temperature_min_c", "temperature_max_c", "wind_speed_kmh", "humidity_pct", "pressure_hpa")
    drift = {}
    for field in drift_fields:
        first_value = first.get(field)
        last_value = last.get(field)
        drift[field] = round(last_value - first_value, 1) if first_value is not None and last_value is not None else None

    return {
        "available": focus_trust.get("available", False),
        "location": forecast.current.location if forecast.current else "",
        "focus_lead_day": request.focus_lead_day,
        "weather_trust": focus_trust,
        "replay": {
            "days": replay_days,
            "earliest": first,
            "latest": last,
            "drift": drift,
        },
        "disagreement": {
            "available": disagreement_index is not None,
            "nwp_confidence_pct": nwp_confidence,
            "nwp_confidence_basis": "Day-to-day Open-Meteo forecast trajectory consistency",
            "ai_reliability_confidence_pct": ai_confidence,
            "difference_pct": disagreement_index,
            "disagreement_index": disagreement_index,
            "risk_level": disagreement_level,
            "bust_probability_pct": bust_probability,
            "explanation": disagreement_reason,
        },
        "advisories": _impact_advisories(focus_day) if focus_trust.get("available") else [],
    }
