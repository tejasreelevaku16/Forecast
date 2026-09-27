"""
Weather API Routes (Phase 1)
Provides endpoints for current weather, hourly forecast, 10-day outlook, and location search.
"""

from typing import List, Optional
from fastapi import APIRouter, Query
from backend.models.weather_model import (
    CurrentWeather,
    HourlyForecastItem,
    DailyForecastItem,
    WeatherAlert,
    WeatherForecastResponse,
    LocationSearchResult,
)
from backend.services.weather_service import (
    get_current_weather,
    get_hourly_forecast,
    get_daily_forecast,
    get_weather_alerts,
    search_locations,
    get_full_forecast_response,
)

router = APIRouter(prefix="/api/weather", tags=["Weather"])


@router.get("/current", response_model=CurrentWeather, summary="Get Current Weather")
def current_weather(location: str = Query("Krishna District", description="Location name or query")):
    """Returns current weather conditions and essential observational parameters."""
    return get_current_weather(location)


@router.get("/hourly", response_model=List[HourlyForecastItem], summary="Get 24-Hour Forecast")
def hourly_forecast(location: str = Query("Krishna District", description="Location name or query")):
    """Returns hourly weather forecast for the next 24 hours."""
    return get_hourly_forecast(location)


@router.get("/daily", response_model=List[DailyForecastItem], summary="Get 10-Day Forecast")
def daily_forecast(location: str = Query("Krishna District", description="Location name or query")):
    """Returns day 1 to day 10 daily forecast outlook."""
    return get_daily_forecast(location)


@router.get("/alerts", response_model=List[WeatherAlert], summary="Get Active Weather Alerts")
def active_alerts(location: str = Query("Krishna District", description="Location name or query")):
    """Returns active meteorological advisories and warnings."""
    return get_weather_alerts(location)


@router.get("/search", response_model=List[LocationSearchResult], summary="Search Locations")
def search_city(q: str = Query(..., min_length=1, description="Search term")):
    """Returns matching preset locations for search autocomplete."""
    return search_locations(q)


@router.get("/forecast", response_model=WeatherForecastResponse, summary="Get Consolidated Forecast")
def consolidated_forecast(location: str = Query("Krishna District", description="Location name or query")):
    """Returns consolidated weather payload (current, hourly, daily, alerts) for optimal dashboard loading."""
    return get_full_forecast_response(location)


@router.get("/locate", response_model=WeatherForecastResponse, summary="Locate User GPS Weather")
def locate_weather(
    lat: float = Query(..., description="Latitude from GPS"),
    lon: float = Query(..., description="Longitude from GPS"),
):
    """Resolves GPS coordinates to nearest Indian district and returns live weather tracking data."""
    from backend.services.weather_service import reverse_geocode, fetch_live_forecast, _sample_fallback
    geo = reverse_geocode(lat, lon)
    try:
        return fetch_live_forecast(lat, lon, geo["name"], geo["region"], geo["country"])
    except Exception:
        return _sample_fallback(geo["name"], geo)


@router.get("/common", summary="Get Unified Common Forecast & Reliability Data")
def common_forecast(
    location: str = Query("Krishna District", description="Location name or query"),
    lead_day: int = Query(6, description="Lead day: 1 to 10"),
    sector: str = Query("General Public", description="User persona")
):
    """
    Returns single common forecast data source covering Location + Target Date + Forecast Run,
    ensuring 100% consistent values across Dashboard, Map, Forecast, Trust, Drift, Alerts, and Decision Support.
    """
    from backend.services.common_forecast_service import get_common_forecast_data
    return get_common_forecast_data(location=location, lead_day=lead_day, sector=sector)

