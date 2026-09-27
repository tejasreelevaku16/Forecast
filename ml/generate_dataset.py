"""
WeatherTrust AI — Historical Forecast vs Actual Dataset Generator (Phase 5)
Generates realistic multi-year historical meteorological forecast-versus-observation records
modeled on Indian synoptic patterns (monsoon surges, cyclones, convective storms)
across multiple agro-climatic zones.
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

# Set deterministic seed for reproducibility
random.seed(42)
np.random.seed(42)

REGIONS = [
    {"name": "Krishna District", "state": "Andhra Pradesh", "lat": 16.5062, "lon": 80.6480, "climate": "coastal_humid"},
    {"name": "Visakhapatnam", "state": "Andhra Pradesh", "lat": 17.6868, "lon": 83.2185, "climate": "coastal_cyclonic"},
    {"name": "Hyderabad", "state": "Telangana", "lat": 17.3850, "lon": 78.4867, "climate": "semi_arid"},
    {"name": "Bengaluru", "state": "Karnataka", "lat": 12.9716, "lon": 77.5946, "climate": "plateau_temperate"},
    {"name": "Mumbai", "state": "Maharashtra", "lat": 19.0760, "lon": 72.8777, "climate": "coastal_heavy_monsoon"},
    {"name": "Delhi", "state": "NCR", "lat": 28.6139, "lon": 77.2090, "climate": "continental_subtropical"}
]


def generate_historical_records(num_events: int = 3200) -> pd.DataFrame:
    records = []
    base_start_date = datetime(2022, 6, 1)

    for i in range(num_events):
        region = random.choice(REGIONS)
        # Random issue date across 2.5 years
        day_offset = random.randint(0, 900)
        issue_date = base_start_date + timedelta(days=day_offset)
        lead_time_days = random.randint(1, 10)
        target_date = issue_date + timedelta(days=lead_time_days)
        month = target_date.month

        # Seasonal flags (Monsoon: June-September; Post-monsoon: Oct-Nov; Winter: Dec-Feb; Summer: Mar-May)
        is_monsoon = 1 if month in [6, 7, 8, 9] else 0
        is_cyclone_season = 1 if month in [10, 11, 5] else 0

        # Base climatology
        if is_monsoon:
            base_rain_mean = 28.0 if "coastal" in region["climate"] else 14.0
            base_temp_mean = 29.0
            base_humidity = 82
        elif is_cyclone_season and "coastal" in region["climate"]:
            base_rain_mean = 35.0
            base_temp_mean = 28.0
            base_humidity = 85
        else:
            base_rain_mean = 3.0
            base_temp_mean = 33.0 if month in [3, 4, 5] else 24.0
            base_humidity = 55

        # Numerical Weather Prediction (NWP) Forecast generation
        fc_rainfall = max(0.0, float(np.random.exponential(scale=base_rain_mean)))
        fc_temp = float(np.random.normal(loc=base_temp_mean, scale=3.0))
        fc_humidity = min(98.0, max(25.0, float(np.random.normal(loc=base_humidity, scale=8.0))))
        fc_pressure = float(np.random.normal(loc=1008.0, scale=4.0))

        # Model Run Drift (shift from previous NWP cycle)
        # Higher lead times experience larger run-to-run drift
        drift_sigma = (lead_time_days ** 1.3) * (1.8 if is_monsoon else 0.8)
        run_drift_rainfall = float(np.random.normal(loc=0.0, scale=drift_sigma))
        previous_rainfall_forecast = max(0.0, fc_rainfall - run_drift_rainfall)

        # Actual Weather Realization (Atmospheric physics error growth with lead time)
        # Error dispersion grows non-linearly with lead days (Lorenz chaos)
        error_scale = 1.0 + (lead_time_days / 3.0) ** 1.5
        
        # Convective rain error: often zero-inflation or massive spike
        rain_bias = np.random.normal(loc=0.0, scale=error_scale * (3.5 + 0.3 * fc_rainfall))
        actual_rainfall = max(0.0, round(fc_rainfall + rain_bias, 1))

        # Extreme convective shift: in ~12% of high-lead cases, rainband completely misses or bursts
        if lead_time_days >= 5 and random.random() < 0.14:
            if random.random() < 0.5:
                actual_rainfall = max(0.0, actual_rainfall - 35.0)  # Forecasted heavy rain, observed near zero
            else:
                actual_rainfall = actual_rainfall + random.uniform(30.0, 75.0)  # Extreme unexpected bust burst

        temp_bias = np.random.normal(loc=0.0, scale=0.4 + 0.35 * lead_time_days)
        actual_temp = round(fc_temp + temp_bias, 1)

        humidity_bias = np.random.normal(loc=0.0, scale=2.0 + 1.2 * lead_time_days)
        actual_humidity = min(100.0, max(15.0, round(fc_humidity + humidity_bias, 1)))

        records.append({
            "record_id": f"REC_{i+1:05d}",
            "location": region["name"],
            "region": region["state"],
            "latitude": region["lat"],
            "longitude": region["lon"],
            "climate_zone": region["climate"],
            "forecast_issue_date": issue_date.strftime("%Y-%m-%d"),
            "target_date": target_date.strftime("%Y-%m-%d"),
            "lead_time_days": lead_time_days,
            "forecast_rainfall_mm": round(fc_rainfall, 1),
            "actual_rainfall_mm": round(actual_rainfall, 1),
            "forecast_temp_c": round(fc_temp, 1),
            "actual_temp_c": round(actual_temp, 1),
            "forecast_humidity_pct": round(fc_humidity, 1),
            "actual_humidity_pct": round(actual_humidity, 1),
            "forecast_pressure_hpa": round(fc_pressure, 1),
            "previous_run_rainfall_mm": round(previous_rainfall_forecast, 1),
            "run_drift_rainfall_mm": round(abs(run_drift_rainfall), 1),
            "is_monsoon_season": is_monsoon,
            "target_month": month,
        })

    df = pd.DataFrame(records)
    # Sort chronologically by issue date to respect physical timeline
    df = df.sort_values(by=["forecast_issue_date", "lead_time_days"]).reset_index(drop=True)
    return df


def main():
    config.RAW_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    config.PROCESSED_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    print("[*] Generating multi-year historical forecast-vs-actual dataset...")
    df = generate_historical_records(num_events=3500)
    
    df.to_csv(config.RAW_DATA_PATH, index=False)
    print(f"[SUCCESS] Saved {len(df)} historical forecast-vs-actual records to: {config.RAW_DATA_PATH}")


if __name__ == "__main__":
    main()
