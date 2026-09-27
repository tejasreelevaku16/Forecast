"""
WeatherTrust AI — Feature Engineering (Phase 7)
Transforms preprocessed forecast data into ML training features.
Enforces strict prevention of data leakage: all features represent information
available strictly at or prior to forecast issue time.
"""

import sys
from pathlib import Path
import numpy as np
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config
from ml.data_preprocessing import load_raw_dataset, calculate_errors_and_bust_labels

FEATURE_COLUMNS = [
    "lead_time_days",
    "lead_time_sq",
    "forecast_rainfall_mm",
    "forecast_temp_c",
    "forecast_humidity_pct",
    "forecast_pressure_hpa",
    "run_drift_rainfall_mm",
    "is_monsoon_season",
    "sin_month",
    "cos_month",
    "convective_index",
    "regional_prior_error_rate",
]

TARGET_COLUMN = "is_bust"


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Transforms forecast records into feature vectors without temporal leakage.
    """
    data = df.copy()

    # 1. Non-linear lead time dispersion
    data["lead_time_sq"] = (data["lead_time_days"] ** 2).astype(float)

    # 2. Cyclical month encoding (seasons repeat cyclically)
    data["sin_month"] = np.sin(2 * np.pi * data["target_month"] / 12.0)
    data["cos_month"] = np.cos(2 * np.pi * data["target_month"] / 12.0)

    # 3. Convective moisture index (high rain + high humidity = severe convective uncertainty)
    data["convective_index"] = (data["forecast_rainfall_mm"] * data["forecast_humidity_pct"]) / 100.0

    # 4. Regional Prior Historical Bust Rate (Time-aware Expanding Mean to prevent leakage)
    # For each region, compute the cumulative bust rate prior to the current forecast issue date
    data = data.sort_values(by="forecast_issue_date").reset_index(drop=True)
    
    # Compute expanding historical regional bust rate
    regional_priors = []
    region_counts = {}
    region_busts = {}
    
    global_prior = 0.34  # Climatological prior baseline

    for _, row in data.iterrows():
        reg = row["location"]
        if reg not in region_counts or region_counts[reg] < 5:
            # Not enough past events: default to global prior
            regional_priors.append(global_prior)
        else:
            prior_rate = region_busts[reg] / region_counts[reg]
            regional_priors.append(round(prior_rate, 4))
            
        # Update running tallies AFTER assigning prior to current row (Strictly zero lookahead)
        region_counts[reg] = region_counts.get(reg, 0) + 1
        region_busts[reg] = region_busts.get(reg, 0) + row["is_bust"]

    data["regional_prior_error_rate"] = regional_priors

    return data


def prepare_training_dataset() -> pd.DataFrame:
    """Loads raw dataset, labels busts, engineers features, and saves processed dataset."""
    raw_df = load_raw_dataset()
    labeled_df = calculate_errors_and_bust_labels(raw_df)
    features_df = engineer_features(labeled_df)

    output_path = config.PROCESSED_DATA_PATH
    features_df.to_csv(output_path, index=False)
    print(f"[SUCCESS] Processed features dataset saved to {output_path} ({len(features_df)} rows, {len(FEATURE_COLUMNS)} features)")
    return features_df


if __name__ == "__main__":
    prepare_training_dataset()
