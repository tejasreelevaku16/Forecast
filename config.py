"""
WeatherTrust AI - Configuration File (Production / Complete Phases)
Central configuration for application settings, live weather API, ML models, and thresholds.
"""

from pathlib import Path
from typing import List

# Paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_PATH = DATA_DIR / "raw" / "historical_forecast_vs_actual.csv"
PROCESSED_DATA_PATH = DATA_DIR / "processed" / "features_dataset.csv"
MODEL_DIR = BASE_DIR / "models"
MODEL_PATH = MODEL_DIR / "forecast_reliability_model.pkl"
SAMPLE_DIR = DATA_DIR / "sample"

# Server configuration
HOST: str = "127.0.0.1"
PORT: int = 8000
DEBUG: bool = True

# Platform Branding
APP_NAME: str = "WeatherTrust AI"
FULL_TITLE: str = "WeatherTrust AI: An Explainable Weather Forecast Reliability and Bust-Risk Detection Platform"
TAGLINE: str = "Know the weather. Know when to trust it."
VERSION: str = "2.0.0"
IS_DEMO_MODE: bool = False

# Operational Defaults
DEFAULT_LOCATION: str = "Krishna District, Andhra Pradesh"
DEFAULT_LAT: float = 16.5062
DEFAULT_LON: float = 80.6480

SUPPORTED_LOCATIONS: List[str] = [
    "Krishna District, Andhra Pradesh",
    "Hyderabad, Telangana",
    "Bengaluru, Karnataka",
    "Delhi, NCR",
    "Mumbai, Maharashtra",
    "Visakhapatnam, Andhra Pradesh",
    "Chennai, Tamil Nadu",
    "Kolkata, West Bengal"
]

# Supported Decision Support Sectors
SUPPORTED_SECTORS: List[str] = [
    "General Public",
    "Farmer",
    "Disaster Management",
    "Event Organizer",
    "Logistics",
    "Renewable Energy"
]

# Live Weather API Settings (Open-Meteo: free, accurate, zero secret leakage)
OPEN_METEO_FORECAST_URL: str = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_GEOCODING_URL: str = "https://geocoding-api.open-meteo.com/v1/search"
API_TIMEOUT_SECONDS: int = 6

# Forecast Bust Definition Criteria (Phase 6)
RAIN_BUST_ABSOLUTE_DIFF_MM: float = 25.0
RAIN_BUST_RELATIVE_RATIO: float = 1.0  # 100% error when forecast >= 20mm
RAIN_BUST_MIN_SIGNIFICANT_MM: float = 20.0
TEMP_BUST_ABSOLUTE_DIFF_C: float = 3.5
HUMIDITY_BUST_ABSOLUTE_DIFF_PCT: float = 25.0

# Official Legal Disclaimer
OFFICIAL_DISCLAIMER: str = (
    "WeatherTrust AI is a forecast reliability & decision-support diagnostic platform. "
    "It does NOT replace official meteorological forecasts or warnings issued by the "
    "India Meteorological Department (IMD) or national meteorological authorities."
)
