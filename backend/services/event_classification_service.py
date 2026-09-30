"""
WeatherTrust AI — Synoptic Event Classification Service
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)

Provides backend service layer for centralized synoptic weather event classification.
"""

from typing import Tuple, Dict, Any, Optional
from ml.event_classifier import (
    classify_synoptic_weather_event,
    SUPPORTED_EVENT_TAXONOMY,
    EVENT_NORMAL,
    EVENT_HEAVY_RAINFALL,
    EVENT_CYCLONE,
    EVENT_HEAT_WAVE,
    EVENT_WESTERN_DISTURBANCE,
    EVENT_MONSOON_DEPRESSION,
    EVENT_ACTIVE_MONSOON,
    EVENT_BREAK_MONSOON,
    EVENT_UNKNOWN,
)

__all__ = [
    "classify_synoptic_weather_event",
    "SUPPORTED_EVENT_TAXONOMY",
    "EVENT_NORMAL",
    "EVENT_HEAVY_RAINFALL",
    "EVENT_CYCLONE",
    "EVENT_HEAT_WAVE",
    "EVENT_WESTERN_DISTURBANCE",
    "EVENT_MONSOON_DEPRESSION",
    "EVENT_ACTIVE_MONSOON",
    "EVENT_BREAK_MONSOON",
    "EVENT_UNKNOWN",
]
