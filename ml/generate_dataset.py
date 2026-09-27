"""
WeatherTrust AI — Historical Forecast vs Actual Error Engine (SIH Problem ID: 26079)
MoES / NCMRWF Historical Verification & Error Benchmark Dataset Generator.

Stores multi-year meteorological forecast-versus-observation records across Indian agro-climatic zones
with synoptic weather event types, error tracking, lead-time error growth, and bust flags.
"""

import os
import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import sys
from pathlib import Path

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config

# Set deterministic seed for scientific reproducibility
random.seed(42)
np.random.seed(42)

DISTRICTS_METADATA = [
    {"district": "Krishna", "city": "Vijayawada", "state": "Andhra Pradesh", "lat": 16.5062, "lon": 80.6480, "climate": "coastal_humid"},
    {"district": "Prakasam", "city": "Ongole", "state": "Andhra Pradesh", "lat": 15.5057, "lon": 80.0499, "climate": "coastal_semi_arid"},
    {"district": "Visakhapatnam", "city": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.6868, "lon": 83.2185, "climate": "coastal_cyclonic"},
    {"district": "Hyderabad", "city": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lon": 78.4867, "climate": "deccan_semi_arid"},
    {"district": "Bengaluru Urban", "city": "Bengaluru", "state": "Karnataka", "lat": 12.9716, "lon": 77.5946, "climate": "plateau_temperate"},
    {"district": "Chennai", "city": "Chennai", "state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707, "climate": "coastal_northeast_monsoon"},
    {"district": "Mumbai City", "city": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lon": 72.8777, "climate": "coastal_heavy_monsoon"},
    {"district": "New Delhi", "city": "Delhi", "state": "Delhi", "lat": 28.6139, "lon": 77.2090, "climate": "subtropical_continental"},
    {"district": "Kolkata", "city": "Kolkata", "state": "West Bengal", "lat": 22.5726, "lon": 88.3639, "climate": "gangetic_delta_humid"},
    {"district": "Pune", "city": "Pune", "state": "Maharashtra", "lat": 18.5204, "lon": 73.8567, "climate": "western_ghats_lee"},
    {"district": "Ahmedabad", "city": "Ahmedabad", "state": "Gujarat", "lat": 23.0225, "lon": 72.5714, "climate": "arid_western"},
    {"district": "Khordha", "city": "Bhubaneswar", "state": "Odisha", "lat": 20.2961, "lon": 85.8245, "climate": "bay_of_bengal_cyclonic"},
    {"district": "Jaipur", "city": "Jaipur", "state": "Rajasthan", "lat": 26.9124, "lon": 75.7873, "climate": "semi_arid_desert"},
    {"district": "Patna", "city": "Patna", "state": "Bihar", "lat": 25.5941, "lon": 85.1376, "climate": "gangetic_plains"},
    {"district": "Kamrup", "city": "Guwahati", "state": "Assam", "lat": 26.1445, "lon": 91.7362, "climate": "northeastern_heavy_rain"}
]

SYNOPTIC_WEATHER_EVENTS = [
    "Monsoon Depression",
    "Heavy Rainfall",
    "Cyclone",
    "Western Disturbance",
    "Heat Wave",
    "Break Monsoon",
    "Active Monsoon"
]


def determine_weather_event(month: int, climate: str, fc_rain: float, fc_temp: float) -> tuple:
    """Returns (Season, Weather Event Type) based on month and synoptic conditions."""
    if month in [6, 7, 8, 9]:
        season = "Monsoon"
        if fc_rain > 45.0:
            event = "Heavy Rainfall"
        elif fc_rain > 25.0:
            event = "Monsoon Depression" if "coastal" in climate else "Active Monsoon"
        elif fc_rain < 4.0:
            event = "Break Monsoon"
        else:
            event = "Active Monsoon"
    elif month in [10, 11]:
        season = "Post-Monsoon"
        if "coastal" in climate and (fc_rain > 30.0 or random.random() < 0.25):
            event = "Cyclone"
        elif fc_rain > 20.0:
            event = "Heavy Rainfall"
        else:
            event = "Monsoon Depression"
    elif month in [12, 1, 2]:
        season = "Winter"
        if "continental" in climate or "subtropical" in climate or "gangetic" in climate:
            event = "Western Disturbance" if random.random() < 0.45 else "Break Monsoon"
        else:
            event = "Break Monsoon"
    else:  # [3, 4, 5]
        season = "Pre-Monsoon/Summer"
        if fc_temp >= 38.0 or random.random() < 0.4:
            event = "Heat Wave"
        elif "cyclonic" in climate and random.random() < 0.2:
            event = "Cyclone"
        else:
            event = "Heavy Rainfall" if fc_rain > 15.0 else "Heat Wave"
            
    return season, event


def generate_historical_error_dataset(num_events: int = 4200) -> pd.DataFrame:
    """
    Generates historical forecast-vs-actual error records strictly adhering to
    MoES/NCMRWF medium-range verification metrics.
    """
    records = []
    base_start_date = datetime(2022, 1, 1)

    for i in range(num_events):
        loc = random.choice(DISTRICTS_METADATA)
        day_offset = random.randint(0, 1050)
        forecast_date = base_start_date + timedelta(days=day_offset)
        lead_day = random.randint(1, 10)
        observation_date = forecast_date + timedelta(days=lead_day)
        month = observation_date.month

        # Climatological distributions
        is_monsoon = month in [6, 7, 8, 9]
        is_coastal = "coastal" in loc["climate"] or "cyclonic" in loc["climate"]

        if is_monsoon:
            base_rain_mean = 28.0 if is_coastal else 14.0
            base_temp_mean = 29.0
            base_humidity = 82.0
            base_pressure = 1002.0
            base_wind = 22.0
        elif month in [10, 11] and is_coastal:
            base_rain_mean = 32.0
            base_temp_mean = 28.0
            base_humidity = 84.0
            base_pressure = 1005.0
            base_wind = 24.0
        elif month in [3, 4, 5]:
            base_rain_mean = 3.5
            base_temp_mean = 36.5 if "arid" in loc["climate"] or "plains" in loc["climate"] else 32.5
            base_humidity = 48.0
            base_pressure = 1010.0
            base_wind = 14.0
        else:  # Winter
            base_rain_mean = 2.0
            base_temp_mean = 22.0 if "continental" in loc["climate"] else 26.0
            base_humidity = 58.0
            base_pressure = 1015.0
            base_wind = 10.0

        # Forecast values (NWP model output)
        fc_rainfall = max(0.0, float(np.random.exponential(scale=base_rain_mean)))
        fc_temp = float(np.random.normal(loc=base_temp_mean, scale=2.8))
        fc_pressure = float(np.random.normal(loc=base_pressure, scale=3.5))
        humidity = min(99.0, max(20.0, float(np.random.normal(loc=base_humidity, scale=8.5))))
        wind_speed = max(2.0, float(np.random.normal(loc=base_wind, scale=5.0)))

        season, weather_event_type = determine_weather_event(month, loc["climate"], fc_rainfall, fc_temp)

        # Run drift (model shift across update cycles)
        drift_sigma = (lead_day ** 1.35) * (1.6 if is_monsoon or weather_event_type == "Cyclone" else 0.75)
        run_drift_rainfall = float(np.random.normal(loc=0.0, scale=drift_sigma))
        previous_rainfall_forecast = max(0.0, fc_rainfall - run_drift_rainfall)

        # Atmospheric error growth with lead time (Lorenz chaos)
        error_scale = 1.0 + (lead_day / 3.0) ** 1.55
        if weather_event_type in ["Cyclone", "Monsoon Depression", "Heavy Rainfall"]:
            error_scale *= 1.35

        # Convective rain error realization
        rain_bias = np.random.normal(loc=0.0, scale=error_scale * (3.0 + 0.32 * fc_rainfall))
        actual_rainfall = max(0.0, round(fc_rainfall + rain_bias, 1))

        # Severe bust triggers (extreme convective shift, track error, burst)
        is_bust_injected = False
        if lead_day >= 5 and random.random() < 0.16:
            is_bust_injected = True
            if random.random() < 0.5:
                actual_rainfall = max(0.0, actual_rainfall - 38.0)  # Heavy forecast, zero actual (False Alarm)
            else:
                actual_rainfall = actual_rainfall + random.uniform(32.0, 85.0)  # Missed sudden burst

        temp_bias = np.random.normal(loc=0.0, scale=0.35 + 0.38 * lead_day)
        actual_temp = round(fc_temp + temp_bias, 1)

        pressure_bias = np.random.normal(loc=0.0, scale=0.4 + 0.25 * lead_day)
        actual_pressure = round(fc_pressure + pressure_bias, 1)

        # Absolute and percentage error calculations
        abs_error_rain = abs(fc_rainfall - actual_rainfall)
        abs_error_temp = abs(fc_temp - actual_temp)
        abs_error_pressure = abs(fc_pressure - actual_pressure)

        # Percentage error on rainfall
        denom = max(fc_rainfall, actual_rainfall, 1.0)
        pct_error_rain = round((abs_error_rain / denom) * 100.0, 1)

        # Target Forecast Bust Definition
        condition_severe_volume = abs_error_rain >= config.RAIN_BUST_ABSOLUTE_DIFF_MM
        condition_false_alarm = (fc_rainfall >= config.RAIN_BUST_MIN_SIGNIFICANT_MM) and (actual_rainfall <= 5.0)
        condition_missed_event = (fc_rainfall <= 2.0) and (actual_rainfall >= 30.0)
        condition_temp_bust = abs_error_temp >= config.TEMP_BUST_ABSOLUTE_DIFF_C

        is_bust = 1 if (condition_severe_volume or condition_false_alarm or condition_missed_event or condition_temp_bust) else 0

        records.append({
            "record_id": f"MOES_NCMRWF_{i+1:05d}",
            "forecast_date": forecast_date.strftime("%Y-%m-%d"),
            "observation_date": observation_date.strftime("%Y-%m-%d"),
            "lead_day": lead_day,
            "state": loc["state"],
            "district": loc["district"],
            "city": loc["city"],
            "latitude": loc["lat"],
            "longitude": loc["lon"],
            "climate_zone": loc["climate"],
            "forecast_temp": round(fc_temp, 1),
            "actual_temp": actual_temp,
            "forecast_rainfall": round(fc_rainfall, 1),
            "actual_rainfall": actual_rainfall,
            "forecast_pressure": round(fc_pressure, 1),
            "actual_pressure": actual_pressure,
            "humidity": round(humidity, 1),
            "wind_speed": round(wind_speed, 1),
            "absolute_error": round(abs_error_rain, 1),
            "absolute_error_temp": round(abs_error_temp, 1),
            "percentage_error": pct_error_rain,
            "season": season,
            "weather_event_type": weather_event_type,
            "run_drift_rainfall_mm": round(abs(run_drift_rainfall), 1),
            "previous_run_rainfall_mm": round(previous_rainfall_forecast, 1),
            "target_month": month,
            "is_bust": is_bust,
        })

    df = pd.DataFrame(records)
    df = df.sort_values(by=["forecast_date", "lead_day"]).reset_index(drop=True)
    return df


def main():
    config.RAW_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    config.PROCESSED_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)

    print("[*] Generating MoES / NCMRWF Historical Forecast Error Dataset...")
    df = generate_historical_error_dataset(num_events=4500)
    df.to_csv(config.RAW_DATA_PATH, index=False)
    print(f"[SUCCESS] Saved {len(df)} historical forecast error records to: {config.RAW_DATA_PATH}")


if __name__ == "__main__":
    main()
