"""
WeatherTrust AI — Historical Forecast Error Service (SIH Problem ID: 26079)
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)

Analyzes historical forecast failures, error growth by lead day, synoptic event failure rates,
and retrieves statistical error priors for live forecast calibration.
"""

import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import config

_HISTORICAL_DF: Optional[pd.DataFrame] = None


def get_historical_error_dataset() -> pd.DataFrame:
    """Loads and caches the historical forecast error dataset."""
    global _HISTORICAL_DF
    if _HISTORICAL_DF is not None:
        return _HISTORICAL_DF

    if config.RAW_DATA_PATH.exists():
        _HISTORICAL_DF = pd.read_csv(config.RAW_DATA_PATH)
    else:
        from ml.generate_dataset import generate_historical_error_dataset
        _HISTORICAL_DF = generate_historical_error_dataset(num_events=4500)
        config.RAW_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        _HISTORICAL_DF.to_csv(config.RAW_DATA_PATH, index=False)

    return _HISTORICAL_DF


def get_district_historical_error_prior(district_or_city: str, lead_day: int = 6) -> Dict[str, Any]:
    """
    Computes empirical historical forecast error statistics for a given location and lead time.
    """
    df = get_historical_error_dataset()
    loc_clean = district_or_city.lower().replace("district", "").strip()

    # Match by district or city
    mask = df["district"].str.lower().str.contains(loc_clean, na=False) | \
           df["city"].str.lower().str.contains(loc_clean, na=False) | \
           df["state"].str.lower().str.contains(loc_clean, na=False)

    subset = df[mask]
    if len(subset) < 10:
        subset = df  # Fallback to national distribution

    lead_subset = subset[subset["lead_day"] == lead_day]
    if len(lead_subset) < 5:
        lead_subset = subset

    bust_rate = float(lead_subset["is_bust"].mean())
    avg_rain_error = float(lead_subset["absolute_error"].mean())
    avg_temp_error = float(lead_subset["absolute_error_temp"].mean())
    pct_error = float(lead_subset["percentage_error"].mean())

    # Event failure breakdown
    event_busts = lead_subset.groupby("weather_event_type")["is_bust"].mean().to_dict()

    return {
        "location": district_or_city,
        "lead_day": lead_day,
        "sample_size": len(lead_subset),
        "historical_bust_rate": round(bust_rate, 4),
        "mean_rainfall_error_mm": round(avg_rain_error, 2),
        "mean_temp_error_c": round(avg_temp_error, 2),
        "mean_percentage_error": round(pct_error, 1),
        "event_bust_rates": {k: round(float(v), 3) for k, v in event_busts.items()}
    }
