"""
WeatherTrust AI - Configuration File (Phase 1)
Central configuration for application settings, defaults, and demo flags.
"""

from typing import List

# Server configuration
HOST: str = "127.0.0.1"
PORT: int = 8000
DEBUG: bool = True

# Platform Branding
APP_NAME: str = "WeatherTrust AI"
TAGLINE: str = "Know the weather. Know when to trust it."
VERSION: str = "1.0.0-phase1"

# Operational Defaults
DEFAULT_LOCATION: str = "Krishna District, Andhra Pradesh"
SUPPORTED_LOCATIONS: List[str] = [
    "Krishna District, Andhra Pradesh",
    "Hyderabad, Telangana",
    "Bengaluru, Karnataka",
    "Delhi, NCR",
    "Mumbai, Maharashtra"
]

# Forecast Trust Layer Settings
IS_DEMO_MODE: bool = True
OFFICIAL_DISCLAIMER: str = (
    "WeatherTrust AI is a forecast reliability & risk assessment layer. "
    "It does NOT replace official forecasts issued by the India Meteorological Department (IMD) "
    "or other national meteorological agencies."
)
