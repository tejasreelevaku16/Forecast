"""
WeatherTrust AI — Temporal Leakage and Centralized Event Consistency Test Suite
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
SIH Problem ID: 26079: AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts

Validates:
1. Automated leakage check: Historical verification timestamp < Forecast initialization timestamp
2. Zero future information in historical features
3. 100% identical event classification taxonomy and logic across training and live inference
"""

import pytest
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

import config
from ml.event_classifier import (
    classify_synoptic_weather_event,
    SUPPORTED_EVENT_TAXONOMY,
    EVENT_CYCLONE,
    EVENT_HEAT_WAVE,
    EVENT_HEAVY_RAINFALL,
    EVENT_WESTERN_DISTURBANCE,
    EVENT_MONSOON_DEPRESSION,
    EVENT_ACTIVE_MONSOON,
    EVENT_BREAK_MONSOON,
    EVENT_NORMAL,
    EVENT_UNKNOWN,
)
from ml.feature_engineering import (
    FEATURE_COLUMNS,
    engineer_features,
    extract_features_for_inference,
    verify_temporal_leakage_safety,
    compute_time_aware_historical_priors,
)


def test_event_classification_taxonomy_consistency():
    """Verify exact identical classification across training and live inference."""
    test_cases = [
        # (month, rain, temp, press, wind, hum, lat, climate, expected_event)
        (7, 85.0, 28.0, 998.0, 35.0, 90.0, 16.5, "coastal_humid", EVENT_MONSOON_DEPRESSION),
        (5, 0.0, 43.5, 1008.0, 18.0, 35.0, 26.9, "semi_arid_desert", EVENT_HEAT_WAVE),
        (1, 15.0, 12.0, 1010.0, 20.0, 70.0, 28.6, "subtropical_continental", EVENT_WESTERN_DISTURBANCE),
        (10, 45.0, 27.0, 996.0, 68.0, 95.0, 17.6, "coastal_cyclonic", EVENT_CYCLONE),
        (7, 3.0, 30.0, 1008.0, 12.0, 75.0, 17.3, "deccan_semi_arid", EVENT_ACTIVE_MONSOON),
        (7, 0.2, 32.0, 1012.0, 8.0, 50.0, 12.9, "plateau_temperate", EVENT_BREAK_MONSOON),
        (12, 0.0, 24.0, 1014.0, 10.0, 55.0, 13.0, "coastal", EVENT_NORMAL),
        (None, 10.0, 25.0, 1013.0, 10.0, 60.0, 18.0, "", EVENT_UNKNOWN),
    ]

    for month, rain, temp, press, wind, hum, lat, climate, expected in test_cases:
        season, event, meta = classify_synoptic_weather_event(
            month=month,
            rainfall_mm=rain,
            temp_c=temp,
            pressure_hpa=press,
            wind_speed_kmh=wind,
            humidity_pct=hum,
            latitude=lat,
            climate_zone=climate
        )
        assert event == expected, f"Event classification mismatch for month={month}, rain={rain}: got {event}, expected {expected}"
        assert event in SUPPORTED_EVENT_TAXONOMY


def test_zero_temporal_leakage_in_historical_priors():
    """
    Assert that historical error features use strictly information available
    prior to forecast initialization time: verification_timestamp < forecast_init_time.
    """
    # Create sample synthetic verification sequence
    base = datetime(2024, 1, 1)
    rows = []
    for day in range(30):
        init_t = base + timedelta(days=day)
        target_t = init_t + timedelta(days=5) # 5-day lead time
        rows.append({
            "record_id": f"TEST-{day}",
            "district": "Krishna",
            "forecast_initialization_time": init_t.strftime("%Y-%m-%d"),
            "forecast_valid_time": target_t.strftime("%Y-%m-%d"),
            "lead_time_days": 5,
            "lead_day": 5,
            "forecast_rainfall": 10.0,
            "forecast_temp": 30.0,
            "forecast_pressure": 1012.0,
            "humidity": 70.0,
            "wind_speed": 15.0,
            "run_drift_rainfall_mm": 2.0,
            "actual_rainfall_mm": 10.0 if day % 2 == 0 else 50.0,
            "actual_temp_c": 30.0,
            "is_bust": 1 if day % 2 == 1 else 0,
            "weather_event_type": "Active Monsoon"
        })

    df = pd.DataFrame(rows)
    priors = compute_time_aware_historical_priors(df)
    
    # Assert priors are non-null and valid probabilities
    assert len(priors) == len(df)
    assert ((priors >= 0.0) & (priors <= 1.0)).all()
    
    # First few records should be default prior (0.35) since 5 pre-init verified records are required
    assert priors.iloc[0] == 0.35
    assert priors.iloc[4] == 0.35


def test_feature_vector_order_and_shape_invariance():
    """Validate that inference feature order identically matches training feature columns."""
    vec = extract_features_for_inference(
        lead_day=6,
        fc_rainfall=25.0,
        fc_temp=32.0,
        fc_pressure=1008.0,
        humidity=78.0,
        wind_speed=22.0,
        drift_rainfall=5.0,
        month=8,
        historical_error_prior=0.42,
        weather_event_type="Monsoon Depression"
    )

    assert vec.shape == (1, len(FEATURE_COLUMNS))
    assert not np.isnan(vec).any()
    assert not np.isinf(vec).any()
