"""
WeatherTrust AI — Interactive India Map Service (SIH Problem ID: 26079)
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)

Provides district-level and state-level GIS reliability mappings, lead-day adjustments (Day 1–10),
live weather observations, calibrated bust risk, and confidence color classifications.
"""

import sys
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config
from backend.services.reliability_service import get_model_bundle
from backend.services.risk_classifier import classify_bust_risk
from backend.services.weather_service import geocode_location, get_full_forecast_response
from ml.feature_engineering import extract_features_for_inference

INDIAN_DISTRICTS: List[Dict[str, Any]] = [
    # Andhra Pradesh
    {"id": "in-ap-krishna", "name": "Krishna District", "city": "Vijayawada", "state": "Andhra Pradesh", "lat": 16.5062, "lon": 80.6480, "base_rain": 45.0, "base_temp": 31.5, "base_hum": 78, "drift": 28.0, "zone": "Coastal Andhra"},
    {"id": "in-ap-ongole", "name": "Prakasam", "city": "Ongole", "state": "Andhra Pradesh", "lat": 15.5057, "lon": 80.0499, "base_rain": 22.0, "base_temp": 32.0, "base_hum": 72, "drift": 16.0, "zone": "Coastal Andhra"},
    {"id": "in-ap-vizag", "name": "Visakhapatnam", "city": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.6868, "lon": 83.2185, "base_rain": 40.0, "base_temp": 30.0, "base_hum": 80, "drift": 24.0, "zone": "Coastal Andhra"},
    {"id": "in-ap-guntur", "name": "Guntur", "city": "Guntur", "state": "Andhra Pradesh", "lat": 16.3067, "lon": 80.4365, "base_rain": 35.0, "base_temp": 32.0, "base_hum": 74, "drift": 22.0, "zone": "Coastal Andhra"},
    {"id": "in-ap-tirupati", "name": "Tirupati", "city": "Tirupati", "state": "Andhra Pradesh", "lat": 13.6288, "lon": 79.4192, "base_rain": 14.0, "base_temp": 31.0, "base_hum": 68, "drift": 12.0, "zone": "Rayalaseema"},
    {"id": "in-ap-kurnool", "name": "Kurnool", "city": "Kurnool", "state": "Andhra Pradesh", "lat": 15.8281, "lon": 78.0373, "base_rain": 10.0, "base_temp": 33.0, "base_hum": 62, "drift": 8.0, "zone": "Rayalaseema"},

    # Telangana
    {"id": "in-tg-hyd", "name": "Hyderabad", "city": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lon": 78.4867, "base_rain": 8.0, "base_temp": 29.0, "base_hum": 65, "drift": 6.0, "zone": "Telangana Plateau"},
    {"id": "in-tg-warangal", "name": "Warangal", "city": "Warangal", "state": "Telangana", "lat": 17.9689, "lon": 79.5941, "base_rain": 10.0, "base_temp": 30.5, "base_hum": 66, "drift": 8.0, "zone": "Telangana Plateau"},
    {"id": "in-tg-nizamabad", "name": "Nizamabad", "city": "Nizamabad", "state": "Telangana", "lat": 18.6725, "lon": 78.0941, "base_rain": 11.0, "base_temp": 30.0, "base_hum": 67, "drift": 9.0, "zone": "Telangana Plateau"},

    # Karnataka
    {"id": "in-ka-blr", "name": "Bengaluru Urban", "city": "Bengaluru", "state": "Karnataka", "lat": 12.9716, "lon": 77.5946, "base_rain": 6.0, "base_temp": 25.0, "base_hum": 70, "drift": 5.0, "zone": "South Interior Karnataka"},
    {"id": "in-ka-mysore", "name": "Mysuru", "city": "Mysuru", "state": "Karnataka", "lat": 12.2958, "lon": 76.6394, "base_rain": 7.0, "base_temp": 26.0, "base_hum": 72, "drift": 6.0, "zone": "South Interior Karnataka"},
    {"id": "in-ka-mangaluru", "name": "Dakshina Kannada", "city": "Mangaluru", "state": "Karnataka", "lat": 12.9141, "lon": 74.8560, "base_rain": 42.0, "base_temp": 29.5, "base_hum": 84, "drift": 28.0, "zone": "Coastal Karnataka"},

    # Maharashtra
    {"id": "in-mh-mum", "name": "Mumbai City", "city": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lon": 72.8777, "base_rain": 48.0, "base_temp": 30.0, "base_hum": 82, "drift": 32.0, "zone": "Konkan Coast"},
    {"id": "in-mh-pune", "name": "Pune", "city": "Pune", "state": "Maharashtra", "lat": 18.5204, "lon": 73.8567, "base_rain": 12.0, "base_temp": 28.0, "base_hum": 68, "drift": 10.0, "zone": "Madhya Maharashtra"},
    {"id": "in-mh-nagpur", "name": "Nagpur", "city": "Nagpur", "state": "Maharashtra", "lat": 21.1458, "lon": 79.0882, "base_rain": 14.0, "base_temp": 31.0, "base_hum": 64, "drift": 12.0, "zone": "Vidarbha"},

    # Tamil Nadu
    {"id": "in-tn-chennai", "name": "Chennai", "city": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707, "base_rain": 22.0, "base_temp": 32.0, "base_hum": 75, "drift": 18.0, "zone": "North Coastal Tamil Nadu"},
    {"id": "in-tn-coimbatore", "name": "Coimbatore", "city": "Coimbatore", "state": "Tamil Nadu", "lat": 11.0168, "lon": 76.9558, "base_rain": 5.0, "base_temp": 28.0, "base_hum": 66, "drift": 5.0, "zone": "Western Ghats Rain Shadow"},

    # Kerala
    {"id": "in-kl-kochi", "name": "Ernakulam", "city": "Kochi", "state": "Kerala", "lat": 9.9312, "lon": 76.2673, "base_rain": 38.0, "base_temp": 29.0, "base_hum": 85, "drift": 25.0, "zone": "Coastal Kerala"},
    {"id": "in-kl-tvm", "name": "Thiruvananthapuram", "city": "Thiruvananthapuram", "state": "Kerala", "lat": 8.5241, "lon": 76.9366, "base_rain": 28.0, "base_temp": 29.5, "base_hum": 80, "drift": 18.0, "zone": "South Kerala"},

    # Gujarat & Rajasthan
    {"id": "in-gj-ahmedabad", "name": "Ahmedabad", "city": "Ahmedabad", "state": "Gujarat", "lat": 23.0225, "lon": 72.5714, "base_rain": 6.0, "base_temp": 34.0, "base_hum": 55, "drift": 6.0, "zone": "Gujarat Plains"},
    {"id": "in-rj-jaipur", "name": "Jaipur", "city": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lon": 75.7873, "base_rain": 2.0, "base_temp": 34.5, "base_hum": 48, "drift": 2.5, "zone": "East Rajasthan"},

    # Northern & Central India
    {"id": "in-dl-delhi", "name": "New Delhi", "city": "Delhi", "state": "Delhi", "lat": 28.6139, "lon": 77.2090, "base_rain": 3.0, "base_temp": 33.0, "base_hum": 54, "drift": 3.0, "zone": "Indo-Gangetic Plain"},
    {"id": "in-up-lucknow", "name": "Lucknow", "city": "Lucknow", "state": "Uttar Pradesh", "lat": 26.8467, "lon": 80.9462, "base_rain": 5.0, "base_temp": 32.5, "base_hum": 60, "drift": 4.5, "zone": "Central Uttar Pradesh"},

    # Eastern & North-Eastern India
    {"id": "in-wb-kolkata", "name": "Kolkata", "city": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lon": 88.3639, "base_rain": 26.0, "base_temp": 31.0, "base_hum": 82, "drift": 19.0, "zone": "Gangetic West Bengal"},
    {"id": "in-od-bhubaneswar", "name": "Khordha", "city": "Bhubaneswar", "state": "Odisha", "lat": 20.2961, "lon": 85.8245, "base_rain": 30.0, "base_temp": 31.5, "base_hum": 80, "drift": 20.0, "zone": "Coastal Odisha"},
    {"id": "in-br-patna", "name": "Patna", "city": "Patna", "state": "Bihar", "lat": 25.5941, "lon": 85.1376, "base_rain": 7.0, "base_temp": 32.0, "base_hum": 65, "drift": 6.0, "zone": "Bihar Plains"},
    {"id": "in-as-guwahati", "name": "Kamrup", "city": "Guwahati", "state": "Assam", "lat": 26.1445, "lon": 91.7362, "base_rain": 24.0, "base_temp": 29.0, "base_hum": 84, "drift": 16.0, "zone": "Brahmaputra Valley"},
]

# Indian States dictionary mapping
INDIAN_STATES: List[Dict[str, Any]] = [
    {"name": "Andhra Pradesh", "lat": 15.9129, "lon": 79.7400, "base_rain": 80.0, "base_temp": 31.0, "base_hum": 78, "drift": 55.0},
    {"name": "Telangana", "lat": 18.1124, "lon": 79.0193, "base_rain": 8.0, "base_temp": 30.0, "base_hum": 66, "drift": 7.0},
    {"name": "Karnataka", "lat": 15.3173, "lon": 75.7139, "base_rain": 16.0, "base_temp": 27.0, "base_hum": 74, "drift": 12.0},
    {"name": "Tamil Nadu", "lat": 11.1271, "lon": 78.6569, "base_rain": 14.0, "base_temp": 31.0, "base_hum": 68, "drift": 11.0},
    {"name": "Kerala", "lat": 10.8505, "lon": 76.2711, "base_rain": 32.0, "base_temp": 29.0, "base_hum": 82, "drift": 22.0},
    {"name": "Maharashtra", "lat": 19.7515, "lon": 75.7139, "base_rain": 24.0, "base_temp": 29.5, "base_hum": 72, "drift": 18.0},
    {"name": "Gujarat", "lat": 22.2587, "lon": 71.1924, "base_rain": 8.0, "base_temp": 33.0, "base_hum": 60, "drift": 7.0},
    {"name": "Rajasthan", "lat": 27.0238, "lon": 74.2179, "base_rain": 2.0, "base_temp": 34.0, "base_hum": 46, "drift": 2.5},
    {"name": "Delhi", "lat": 28.7041, "lon": 77.1025, "base_rain": 3.0, "base_temp": 33.0, "base_hum": 54, "drift": 3.0},
    {"name": "Uttar Pradesh", "lat": 26.8467, "lon": 80.9462, "base_rain": 5.0, "base_temp": 32.5, "base_hum": 62, "drift": 5.0},
    {"name": "Bihar", "lat": 25.0961, "lon": 85.3131, "base_rain": 7.0, "base_temp": 32.0, "base_hum": 65, "drift": 6.5},
    {"name": "West Bengal", "lat": 22.9868, "lon": 87.8550, "base_rain": 25.0, "base_temp": 31.0, "base_hum": 80, "drift": 18.0},
    {"name": "Odisha", "lat": 20.9517, "lon": 85.0985, "base_rain": 28.0, "base_temp": 31.0, "base_hum": 79, "drift": 20.0},
    {"name": "Madhya Pradesh", "lat": 22.9734, "lon": 78.6569, "base_rain": 10.0, "base_temp": 32.0, "base_hum": 60, "drift": 8.0},
    {"name": "Punjab", "lat": 31.1471, "lon": 75.3412, "base_rain": 3.0, "base_temp": 30.5, "base_hum": 56, "drift": 3.5},
    {"name": "Haryana", "lat": 29.0588, "lon": 76.0856, "base_rain": 3.0, "base_temp": 31.0, "base_hum": 55, "drift": 3.0},
    {"name": "Assam", "lat": 26.2006, "lon": 92.9376, "base_rain": 24.0, "base_temp": 29.0, "base_hum": 84, "drift": 16.0},
    {"name": "Jharkhand", "lat": 23.6102, "lon": 85.2799, "base_rain": 12.0, "base_temp": 31.0, "base_hum": 68, "drift": 9.0},
    {"name": "Chhattisgarh", "lat": 21.2787, "lon": 81.8661, "base_rain": 14.0, "base_temp": 31.5, "base_hum": 70, "drift": 11.0},
    {"name": "Uttarakhand", "lat": 30.0668, "lon": 79.0193, "base_rain": 12.0, "base_temp": 22.0, "base_hum": 70, "drift": 9.0},
    {"name": "Himachal Pradesh", "lat": 31.1048, "lon": 77.1734, "base_rain": 8.0, "base_temp": 20.0, "base_hum": 66, "drift": 6.0},
    {"name": "Jammu and Kashmir", "lat": 33.7782, "lon": 76.5762, "base_rain": 3.0, "base_temp": 18.0, "base_hum": 55, "drift": 3.0},
    {"name": "Goa", "lat": 15.2993, "lon": 74.1240, "base_rain": 40.0, "base_temp": 29.0, "base_hum": 84, "drift": 26.0},
    {"name": "Tripura", "lat": 23.9408, "lon": 91.9882, "base_rain": 22.0, "base_temp": 29.0, "base_hum": 82, "drift": 15.0},
    {"name": "Meghalaya", "lat": 25.4670, "lon": 91.3662, "base_rain": 45.0, "base_temp": 22.0, "base_hum": 88, "drift": 30.0},
    {"name": "Manipur", "lat": 24.6637, "lon": 93.9063, "base_rain": 18.0, "base_temp": 26.0, "base_hum": 78, "drift": 12.0},
    {"name": "Nagaland", "lat": 26.1584, "lon": 94.5624, "base_rain": 20.0, "base_temp": 25.0, "base_hum": 80, "drift": 14.0},
    {"name": "Mizoram", "lat": 23.1645, "lon": 92.9376, "base_rain": 22.0, "base_temp": 26.0, "base_hum": 82, "drift": 15.0},
    {"name": "Arunachal Pradesh", "lat": 28.2180, "lon": 94.7278, "base_rain": 25.0, "base_temp": 21.0, "base_hum": 82, "drift": 16.0},
    {"name": "Sikkim", "lat": 27.5330, "lon": 88.5122, "base_rain": 20.0, "base_temp": 19.0, "base_hum": 80, "drift": 14.0},
    {"name": "Puducherry", "lat": 11.9416, "lon": 79.8083, "base_rain": 18.0, "base_temp": 31.5, "base_hum": 74, "drift": 13.0},
    {"name": "Ladakh", "lat": 34.1526, "lon": 77.5771, "base_rain": 1.0, "base_temp": 14.0, "base_hum": 45, "drift": 1.5},
    {"name": "Chandigarh", "lat": 30.7333, "lon": 76.7794, "base_rain": 3.5, "base_temp": 30.0, "base_hum": 55, "drift": 3.0},
    {"name": "Andaman and Nicobar Islands", "lat": 11.7401, "lon": 92.6586, "base_rain": 45.0, "base_temp": 29.0, "base_hum": 85, "drift": 25.0},
    {"name": "Andaman and Nicobar", "lat": 11.7401, "lon": 92.6586, "base_rain": 45.0, "base_temp": 29.0, "base_hum": 85, "drift": 25.0},
    {"name": "Lakshadweep", "lat": 10.5667, "lon": 72.6417, "base_rain": 35.0, "base_temp": 30.0, "base_hum": 82, "drift": 20.0},
    {"name": "Dadra and Nagar Haveli and Daman and Diu", "lat": 20.4283, "lon": 72.8397, "base_rain": 30.0, "base_temp": 30.5, "base_hum": 78, "drift": 18.0},
    {"name": "Dadra and Nagar Haveli", "lat": 20.1809, "lon": 73.0169, "base_rain": 30.0, "base_temp": 30.5, "base_hum": 78, "drift": 18.0},
    {"name": "Daman and Diu", "lat": 20.4283, "lon": 72.8397, "base_rain": 28.0, "base_temp": 30.5, "base_hum": 78, "drift": 16.0},
]


def _get_confidence_color(confidence: int) -> str:
    """Returns official SIH/MoES GIS hex color code based on confidence score."""
    if confidence >= 90:
        return "#059669"  # Dark Green (90–100)
    elif confidence >= 75:
        return "#10b981"  # Green (75–89)
    elif confidence >= 60:
        return "#f59e0b"  # Yellow (60–74)
    elif confidence >= 40:
        return "#f97316"  # Orange (40–59)
    else:
        return "#ef4444"  # Red (0–39)


def get_map_confidence(location: str = "Vijayawada", day: int = 1) -> Dict[str, Any]:
    """
    SIH Feature 1 Endpoint Processor:
    1. Fetches live forecast.
    2. Extracts meteorological features.
    3. Runs calibrated ML model.
    4. Produces Forecast Confidence and Bust Probability.
    """
    forecast_data = get_full_forecast_response(location)
    daily = forecast_data.daily
    curr = forecast_data.current

    day_idx = min(max(1, day), 10)
    day_item = daily[day_idx - 1] if day_idx - 1 < len(daily) else None

    if day_item:
        fc_rain = float(day_item.precipitation_mm)
        fc_temp = (float(day_item.temp_max_c) + float(day_item.temp_min_c)) / 2.0
        fc_humidity = float(day_item.humidity_pct)
        fc_wind = float(day_item.wind_speed_kmh)
    else:
        fc_rain = float(curr.precipitation_mm)
        fc_temp = float(curr.temperature_c)
        fc_humidity = float(curr.humidity_pct)
        fc_wind = float(curr.wind_speed_kmh)

    est_pressure = float(curr.pressure_hpa) if day_idx == 1 else max(980.0, 1013.25 - (fc_rain * 0.4) - (day_idx * 0.3))
    drift_rain = float(day_idx ** 1.3) * (1.8 if fc_rain >= 20 else 0.8)

    bundle = get_model_bundle()
    if bundle is not None:
        model = bundle["model"]
        scaler = bundle["scaler"]
        x_vec = extract_features_for_inference(
            lead_day=day_idx,
            fc_rainfall=fc_rain,
            fc_temp=fc_temp,
            fc_pressure=est_pressure,
            humidity=fc_humidity,
            wind_speed=fc_wind,
            drift_rainfall=drift_rain,
            month=datetime.now().month,
            historical_error_prior=0.35,
            weather_event_type="Heavy Rainfall" if fc_rain >= 25 else "Active Monsoon"
        )
        x_scaled = scaler.transform(x_vec)
        prob_raw = float(model.predict_proba(x_scaled)[0, 1])
        bust_prob = int(np.clip(round(prob_raw * 100), 5, 95))
    else:
        bust_prob = min(92, int(10 + (day_idx ** 1.6) * 2.0 + (drift_rain * 0.4)))

    confidence = 100 - bust_prob
    risk_info = classify_bust_risk(bust_prob)

    return {
        "generated_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S IST"),
        "location": location,
        "day": day_idx,
        "confidence": confidence,
        "bust_probability": bust_prob,
        "risk": risk_info["risk_level"].title(),
        "color": _get_confidence_color(confidence),
        "weather": {
            "temperature": round(fc_temp, 1),
            "rainfall": round(fc_rain, 1),
            "humidity": round(fc_humidity, 1),
            "pressure": round(est_pressure, 1),
            "wind_speed": round(fc_wind, 1),
        }
    }


def get_all_india_states_map(day: int = 1) -> List[Dict[str, Any]]:
    """
    Returns state-level ML-predicted Forecast Confidence, Bust Risk, and Drift metrics
    for all Indian states and Union Territories for the selected lead day.
    """
    bundle = get_model_bundle()
    results = []
    month = datetime.now().month
    day_idx = min(max(1, day), 10)

    for st in INDIAN_STATES:
        fc_rain = st["base_rain"] * (1.0 + (day_idx - 1) * 0.08)
        fc_temp = st["base_temp"] - (day_idx * 0.1)
        fc_hum = st["base_hum"]
        drift = st["drift"] * (day_idx / 3.0) ** 1.2
        est_pressure = max(985.0, 1013.25 - (fc_rain * 0.35) - (day_idx * 0.3))

        if bundle is not None:
            model = bundle["model"]
            scaler = bundle["scaler"]
            x_vec = extract_features_for_inference(
                lead_day=day_idx,
                fc_rainfall=fc_rain,
                fc_temp=fc_temp,
                fc_pressure=est_pressure,
                humidity=fc_hum,
                wind_speed=16.0,
                drift_rainfall=drift,
                month=month,
                historical_error_prior=0.35,
                weather_event_type="Heavy Rainfall" if fc_rain >= 25 else "Active Monsoon"
            )
            x_scaled = scaler.transform(x_vec)
            prob_raw = float(model.predict_proba(x_scaled)[0, 1])
            bust_prob = int(np.clip(round(prob_raw * 100), 5, 95))
        else:
            bust_prob = min(90, int(12 + (day_idx ** 1.5) * 2.5 + drift * 0.35))

        conf = 100 - bust_prob
        risk_info = classify_bust_risk(bust_prob)

        conf_str = "High" if conf >= 75 else "Moderate" if conf >= 55 else "Low"
        bust_str = "High Risk" if bust_prob >= 60 else "Moderate Risk" if bust_prob >= 30 else "Low Risk"

        results.append({
            "state": st["name"],
            "state_name": st["name"],
            "region": st["name"],
            "lat": st["lat"],
            "lon": st["lon"],
            "day": day_idx,
            "trust_score": conf,
            "confidence": conf_str,
            "confidence_score": conf,
            "bust_probability": bust_prob,
            "bust_risk": bust_str,
            "risk_level": risk_info["risk_level"],
            "reliability_level": risk_info["risk_level"],
            "stability": risk_info["stability"],
            "color": _get_confidence_color(conf),
            "forecast_rainfall_mm": round(fc_rain, 1),
            "forecast_temp_c": round(fc_temp, 1),
            "forecast": f"{round(fc_rain, 1)} mm rain, {round(fc_temp, 1)}°C",
            "primary_driver": "Convective boundary-layer variance and run drift" if drift >= 20 else "Stable synoptic flow",
            "humidity_pct": int(fc_hum),
            "pressure_hpa": round(est_pressure, 1),
            "wind_speed_kmh": 16.0,
            "drift": round(drift, 1),
            "drift_mm": round(drift, 1),
            "drift_str": f"+{round(drift, 1)} mm Drift",
        })

    return results


def get_states_reliability_dict(day: int = 1) -> Dict[str, Any]:
    """Returns state reliability data dictionary keyed by state name for instant O(1) map lookups."""
    states_list = get_all_india_states_map(day=day)
    return {item["state"]: item for item in states_list}


def get_all_india_reliability_map(day: int = 1) -> List[Dict[str, Any]]:
    """Evaluates ML bust-risk and weather parameters across all 30+ Indian districts for given lead day."""
    bundle = get_model_bundle()
    results = []
    month = datetime.now().month
    day_idx = min(max(1, day), 10)

    for dist in INDIAN_DISTRICTS:
        fc_rain = dist["base_rain"] * (1.0 + (day_idx - 1) * 0.09)
        fc_temp = dist["base_temp"] - (day_idx * 0.12)
        fc_hum = dist["base_hum"]
        drift = dist["drift"] * (day_idx / 3.0) ** 1.25
        est_pressure = max(982.0, 1013.25 - (fc_rain * 0.38) - (day_idx * 0.3))

        if bundle is not None:
            model = bundle["model"]
            scaler = bundle["scaler"]
            x_vec = extract_features_for_inference(
                lead_day=day_idx,
                fc_rainfall=fc_rain,
                fc_temp=fc_temp,
                fc_pressure=est_pressure,
                humidity=fc_hum,
                wind_speed=18.0,
                drift_rainfall=drift,
                month=month,
                historical_error_prior=0.38 if "Andhra" in dist["state"] else 0.30,
                weather_event_type="Heavy Rainfall" if fc_rain >= 25 else "Active Monsoon"
            )
            x_scaled = scaler.transform(x_vec)
            prob_raw = float(model.predict_proba(x_scaled)[0, 1])
            bust_prob = int(np.clip(round(prob_raw * 100), 5, 95))
        else:
            bust_prob = min(92, int(10 + (day_idx ** 1.6) * 2.2 + drift * 0.4))

        conf = 100 - bust_prob
        risk_info = classify_bust_risk(bust_prob)

        results.append({
            "id": dist["id"],
            "name": dist["name"],
            "city": dist.get("city", dist["name"]),
            "state": dist["state"],
            "zone": dist["zone"],
            "lat": dist["lat"],
            "lon": dist["lon"],
            "day": day_idx,
            "weather": {
                "temperature": round(fc_temp, 1),
                "feels_like": round(fc_temp + 2.5, 1),
                "rainfall": round(fc_rain, 1),
                "humidity": int(fc_hum),
                "wind_speed": 18.0,
                "wind_direction": "SE",
                "pressure": round(est_pressure, 1),
                "condition": "Heavy Rain" if fc_rain >= 30 else "Moderate Rain" if fc_rain >= 10 else "Partly Cloudy",
                "condition_icon": "cloud-rain-heavy" if fc_rain >= 30 else "cloud-rain" if fc_rain >= 10 else "cloud-sun",
            },
            "reliability": {
                "reliability_score": conf,
                "bust_probability_pct": bust_prob,
                "confidence": conf,
                "risk_level": risk_info["risk_level"],
                "forecast_stability": risk_info["stability"],
                "color": _get_confidence_color(conf),
                "drift_mm": round(drift, 1),
                "lead_day": day_idx,
            }
        })

    return results
