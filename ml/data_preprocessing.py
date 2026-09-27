"""
WeatherTrust AI — Data Preprocessing & Forecast Bust Definition (Phase 6)
Defines the mathematical and meteorological criteria for a Forecast Bust:
1. Significant Precipitation Bust: Error >= 25mm or false alarm (predicted >=20mm, observed <=5mm)
2. Significant Temperature Bust: Error >= 3.5°C
Combines criteria into binary ground-truth target: `is_bust`.
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config


def load_raw_dataset(filepath: Path = config.RAW_DATA_PATH) -> pd.DataFrame:
    """Loads raw forecast vs actual dataset."""
    if not filepath.exists():
        raise FileNotFoundError(f"Raw dataset not found at {filepath}. Run generate_dataset.py first.")
    df = pd.read_csv(filepath)
    df["forecast_issue_date"] = pd.to_datetime(df["forecast_issue_date"])
    df["target_date"] = pd.to_datetime(df["target_date"])
    return df


def calculate_errors_and_bust_labels(df: pd.DataFrame) -> pd.DataFrame:
    """
    Computes absolute error metrics and labels forecast busts according to
    meteorologically justified thresholds.
    """
    data = df.copy()

    # Absolute Errors
    data["rain_error_mm"] = (data["forecast_rainfall_mm"] - data["actual_rainfall_mm"]).abs()
    data["temp_error_c"] = (data["forecast_temp_c"] - data["actual_temp_c"]).abs()
    data["humidity_error_pct"] = (data["forecast_humidity_pct"] - data["actual_humidity_pct"]).abs()

    # Precipitation Bust Criterion
    # A forecast bust occurs when:
    # (a) Absolute rainfall error is >= 25mm (severe volume discrepancy), OR
    # (b) Heavy rain forecasted (>= 20mm) but virtually none occurred (<= 5mm, False Alarm Bust), OR
    # (c) Nil rain forecasted (<= 2mm) but heavy localized downpour occurred (>= 30mm, Missed Bust)
    condition_severe_volume = data["rain_error_mm"] >= config.RAIN_BUST_ABSOLUTE_DIFF_MM
    condition_false_alarm = (data["forecast_rainfall_mm"] >= config.RAIN_BUST_MIN_SIGNIFICANT_MM) & (data["actual_rainfall_mm"] <= 5.0)
    condition_missed_event = (data["forecast_rainfall_mm"] <= 2.0) & (data["actual_rainfall_mm"] >= 30.0)
    data["is_rain_bust"] = (condition_severe_volume | condition_false_alarm | condition_missed_event).astype(int)

    # Temperature Bust Criterion
    data["is_temp_bust"] = (data["temp_error_c"] >= config.TEMP_BUST_ABSOLUTE_DIFF_C).astype(int)

    # Combined Composite Forecast Bust
    data["is_bust"] = (data["is_rain_bust"] | data["is_temp_bust"]).astype(int)

    return data


def summarize_bust_statistics(df: pd.DataFrame):
    """Prints diagnostic statistics showing bust frequency by lead day."""
    print("=" * 60)
    print("FORECAST BUST DISTRIBUTION BY LEAD TIME")
    print("=" * 60)
    summary = df.groupby("lead_time_days").agg(
        total_samples=("record_id", "count"),
        total_busts=("is_bust", "sum"),
        bust_rate=("is_bust", "mean"),
        mean_rain_error=("rain_error_mm", "mean"),
        mean_temp_error=("temp_error_c", "mean"),
    ).reset_index()

    summary["bust_rate_pct"] = (summary["bust_rate"] * 100).round(1).astype(str) + "%"
    summary["mean_rain_error"] = summary["mean_rain_error"].round(2)
    summary["mean_temp_error"] = summary["mean_temp_error"].round(2)
    
    print(summary[["lead_time_days", "total_samples", "total_busts", "bust_rate_pct", "mean_rain_error", "mean_temp_error"]].to_string(index=False))
    print("=" * 60)
    overall_rate = (df["is_bust"].mean() * 100).round(1)
    print(f"Overall Dataset Bust Rate: {overall_rate}% across {len(df)} forecast events.")
    print("=" * 60)


if __name__ == "__main__":
    df = load_raw_dataset()
    labeled_df = calculate_errors_and_bust_labels(df)
    summarize_bust_statistics(labeled_df)
