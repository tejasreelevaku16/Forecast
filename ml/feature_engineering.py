"""
WeatherTrust AI — AI Feature Engineering Pipeline (SIH Problem ID: 26079)
MoES / NCMRWF Operational Medium-Range Forecast Feature Extractor.

Extracts real meteorological features:
- Lead Day & Dispersion
- Temperature Trend
- Rainfall Accumulation & Variability
- Pressure Change & Barometric Gradient
- Humidity Dynamics & Convective Index
- Wind Speed & Directional Shift
- Forecast Drift
- Seasonal & Cyclical Indices
- Regional Climatology & Historical Forecast Error Priors
- Weather Event Encoding
"""

import sys
from pathlib import Path
import numpy as np
import pandas as pd
from typing import List, Dict, Any

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config

FEATURE_COLUMNS = [
    "lead_day",
    "lead_day_sq",
    "forecast_rainfall",
    "forecast_temp",
    "forecast_pressure",
    "humidity",
    "wind_speed",
    "run_drift_rainfall_mm",
    "pressure_drop",
    "convective_instability",
    "rainfall_variability",
    "sin_month",
    "cos_month",
    "historical_error_prior",
    "is_cyclone_or_depression",
    "is_heat_wave",
]

TARGET_COLUMN = "is_bust"

# Mapping human-readable meteorological explanation names for SHAP and Explainable AI
METEOROLOGICAL_FEATURE_LABELS = {
    "lead_day": "Lead Day Horizon",
    "lead_day_sq": "Lead Time Dispersion",
    "forecast_rainfall": "Rainfall Accumulation",
    "forecast_temp": "Temperature Trend",
    "forecast_pressure": "Surface Pressure",
    "humidity": "Atmospheric Moisture",
    "wind_speed": "Wind Speed Shear",
    "run_drift_rainfall_mm": "Forecast Drift",
    "pressure_drop": "Pressure Drop",
    "convective_instability": "Convective Instability",
    "rainfall_variability": "Rainfall Gradient",
    "sin_month": "Seasonal Cycle",
    "cos_month": "Monsoon Phase",
    "historical_error_prior": "Historical Forecast Error",
    "is_cyclone_or_depression": "Monsoon Depression / Cyclone",
    "is_heat_wave": "Heat Wave Instability",
}


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Transforms raw dataset into normalized ML feature vectors without temporal leakage."""
    data = df.copy()

    # 1. Non-linear lead time dispersion
    data["lead_day_sq"] = (data["lead_day"] ** 2).astype(float)

    # 2. Pressure drop indicator (Standard atmospheric pressure baseline 1013.25 hPa)
    data["pressure_drop"] = np.maximum(0.0, 1013.25 - data["forecast_pressure"])

    # 3. Convective instability index (high rainfall with high moisture)
    data["convective_instability"] = (data["forecast_rainfall"] * data["humidity"]) / 100.0

    # 4. Rainfall gradient / variability proxy
    data["rainfall_variability"] = data["forecast_rainfall"] * 0.35 + data["run_drift_rainfall_mm"] * 0.65

    # 5. Cyclical month encoding (seasonal dynamics)
    month_col = data["target_month"] if "target_month" in data.columns else pd.to_datetime(data["observation_date"]).dt.month
    data["sin_month"] = np.sin(2 * np.pi * month_col / 12.0)
    data["cos_month"] = np.cos(2 * np.pi * month_col / 12.0)

    # 6. Synoptic weather event flags
    if "weather_event_type" in data.columns:
        data["is_cyclone_or_depression"] = data["weather_event_type"].isin(["Cyclone", "Monsoon Depression", "Heavy Rainfall"]).astype(int)
        data["is_heat_wave"] = (data["weather_event_type"] == "Heat Wave").astype(int)
    else:
        data["is_cyclone_or_depression"] = 0
        data["is_heat_wave"] = 0

    # 7. Expanding Historical Regional Error Priors (Zero future data leakage)
    data = data.sort_values(by="forecast_date").reset_index(drop=True)
    
    regional_priors = []
    region_counts: Dict[str, int] = {}
    region_busts: Dict[str, int] = {}
    global_prior = 0.35

    for _, row in data.iterrows():
        reg = row.get("district", row.get("city", "Standard"))
        if reg not in region_counts or region_counts[reg] < 5:
            regional_priors.append(global_prior)
        else:
            prior_rate = region_busts[reg] / region_counts[reg]
            regional_priors.append(round(prior_rate, 4))

        region_counts[reg] = region_counts.get(reg, 0) + 1
        region_busts[reg] = region_busts.get(reg, 0) + int(row["is_bust"])

    data["historical_error_prior"] = regional_priors

    return data


def prepare_training_dataset() -> pd.DataFrame:
    """Loads raw dataset, engineers features, and saves processed feature dataset."""
    if not config.RAW_DATA_PATH.exists():
        from ml.generate_dataset import main as gen_main
        gen_main()

    df = pd.read_csv(config.RAW_DATA_PATH)
    features_df = engineer_features(df)

    output_path = config.PROCESSED_DATA_PATH
    output_path.parent.mkdir(parents=True, exist_ok=True)
    features_df.to_csv(output_path, index=False)
    print(f"[SUCCESS] Processed features dataset saved to {output_path} ({len(features_df)} rows, {len(FEATURE_COLUMNS)} features)")
    return features_df


def extract_features_for_inference(
    lead_day: int,
    fc_rainfall: float,
    fc_temp: float,
    fc_pressure: float,
    humidity: float,
    wind_speed: float,
    drift_rainfall: float,
    month: int = None,
    historical_error_prior: float = 0.35,
    weather_event_type: str = "Active Monsoon"
) -> np.ndarray:
    """
    Extracts a 1D feature array for live inference matching exact training schema.
    """
    if month is None:
        month = pd.Timestamp.now().month

    lead_day_sq = float(lead_day ** 2)
    pressure_drop = max(0.0, 1013.25 - fc_pressure)
    convective_instability = (fc_rainfall * humidity) / 100.0
    rainfall_variability = fc_rainfall * 0.35 + drift_rainfall * 0.65
    sin_month = float(np.sin(2 * np.pi * month / 12.0))
    cos_month = float(np.cos(2 * np.pi * month / 12.0))
    is_cyclone_or_depression = 1 if weather_event_type in ["Cyclone", "Monsoon Depression", "Heavy Rainfall"] else 0
    is_heat_wave = 1 if weather_event_type == "Heat Wave" or fc_temp >= 38.0 else 0

    vector = [
        float(lead_day),
        lead_day_sq,
        float(fc_rainfall),
        float(fc_temp),
        float(fc_pressure),
        float(humidity),
        float(wind_speed),
        float(drift_rainfall),
        pressure_drop,
        convective_instability,
        rainfall_variability,
        sin_month,
        cos_month,
        float(historical_error_prior),
        float(is_cyclone_or_depression),
        float(is_heat_wave),
    ]
    return np.array([vector], dtype=np.float64)


if __name__ == "__main__":
    prepare_training_dataset()
