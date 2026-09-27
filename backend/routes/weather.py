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


def _extract_coords(lat, lon, latitude, longitude):
    final_lat = lat if lat is not None and not hasattr(lat, "default") else (latitude if latitude is not None and not hasattr(latitude, "default") else None)
    final_lon = lon if lon is not None and not hasattr(lon, "default") else (longitude if longitude is not None and not hasattr(longitude, "default") else None)
    if final_lat is not None:
        try:
            final_lat = float(final_lat)
        except (ValueError, TypeError):
            final_lat = None
    if final_lon is not None:
        try:
            final_lon = float(final_lon)
        except (ValueError, TypeError):
            final_lon = None
    return final_lat, final_lon


@router.get("/current", response_model=CurrentWeather, summary="Get Current Weather")
def current_weather(
    location: str = Query("Krishna District", description="Location name or query"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude"),
    latitude: Optional[float] = Query(None, description="Exact latitude alias"),
    longitude: Optional[float] = Query(None, description="Exact longitude alias"),
    region: Optional[str] = Query(None, description="Optional state/region name"),
):
    """Returns current weather conditions using exact coordinates or resolved location."""
    final_lat, final_lon = _extract_coords(lat, lon, latitude, longitude)
    clean_loc = str(location) if location and not hasattr(location, "default") else "Krishna District"
    clean_reg = str(region) if region and not hasattr(region, "default") else None
    return get_full_forecast_response(location_query=clean_loc, lat=final_lat, lon=final_lon, region=clean_reg).current


@router.get("/hourly", response_model=List[HourlyForecastItem], summary="Get 24-Hour Forecast")
def hourly_forecast(
    location: str = Query("Krishna District", description="Location name or query"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude"),
    latitude: Optional[float] = Query(None, description="Exact latitude alias"),
    longitude: Optional[float] = Query(None, description="Exact longitude alias"),
    region: Optional[str] = Query(None, description="Optional state/region name"),
):
    """Returns hourly weather forecast for the next 24 hours using exact coordinates."""
    final_lat, final_lon = _extract_coords(lat, lon, latitude, longitude)
    clean_loc = str(location) if location and not hasattr(location, "default") else "Krishna District"
    clean_reg = str(region) if region and not hasattr(region, "default") else None
    return get_full_forecast_response(location_query=clean_loc, lat=final_lat, lon=final_lon, region=clean_reg).hourly


@router.get("/daily", response_model=List[DailyForecastItem], summary="Get 10-Day Forecast")
def daily_forecast(
    location: str = Query("Krishna District", description="Location name or query"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude"),
    latitude: Optional[float] = Query(None, description="Exact latitude alias"),
    longitude: Optional[float] = Query(None, description="Exact longitude alias"),
    region: Optional[str] = Query(None, description="Optional state/region name"),
):
    """Returns day 1 to day 10 daily forecast outlook using exact coordinates."""
    final_lat, final_lon = _extract_coords(lat, lon, latitude, longitude)
    clean_loc = str(location) if location and not hasattr(location, "default") else "Krishna District"
    clean_reg = str(region) if region and not hasattr(region, "default") else None
    return get_full_forecast_response(location_query=clean_loc, lat=final_lat, lon=final_lon, region=clean_reg).daily


@router.get("/alerts", response_model=List[WeatherAlert], summary="Get Active Weather Alerts")
def active_alerts(location: str = Query("Krishna District", description="Location name or query")):
    """Returns active meteorological advisories and warnings."""
    return get_weather_alerts(location)


@router.get("/search", response_model=List[LocationSearchResult], summary="Search Locations")
def search_city(q: str = Query(..., min_length=1, description="Search term")):
    """Returns matching preset locations for search autocomplete."""
    return search_locations(q)


@router.get("/forecast", response_model=WeatherForecastResponse, summary="Get Consolidated Forecast")
def consolidated_forecast(
    location: str = Query("Krishna District", description="Location name or query"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude"),
    latitude: Optional[float] = Query(None, description="Exact latitude alias"),
    longitude: Optional[float] = Query(None, description="Exact longitude alias"),
    region: Optional[str] = Query(None, description="Optional state/region name"),
):
    """Returns consolidated weather payload using exact coordinates."""
    final_lat, final_lon = _extract_coords(lat, lon, latitude, longitude)
    clean_loc = str(location) if location and not hasattr(location, "default") else "Krishna District"
    clean_reg = str(region) if region and not hasattr(region, "default") else None
    return get_full_forecast_response(location_query=clean_loc, lat=final_lat, lon=final_lon, region=clean_reg)


@router.get("/live", response_model=WeatherForecastResponse, summary="Get Live Weather Forecast for Exact Coordinates")
def live_weather_endpoint(
    latitude: Optional[float] = Query(None, description="Exact latitude"),
    longitude: Optional[float] = Query(None, description="Exact longitude"),
    lat: Optional[float] = Query(None, description="Latitude alias"),
    lon: Optional[float] = Query(None, description="Longitude alias"),
    location: Optional[str] = Query("Krishna District", description="Location or place name"),
    region: Optional[str] = Query(None, description="State/Region name"),
):
    """Fetches real-time weather from Open-Meteo for exact latitude and longitude."""
    final_lat, final_lon = _extract_coords(lat, lon, latitude, longitude)
    clean_loc = str(location) if location and not hasattr(location, "default") else "Krishna District"
    clean_reg = str(region) if region and not hasattr(region, "default") else None
    return get_full_forecast_response(location_query=clean_loc, lat=final_lat, lon=final_lon, region=clean_reg)


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


@router.get("/scene", summary="Get Weather Scene Data")
def weather_scene(
    location: str = Query("Krishna District", description="Location name or query"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude"),
    latitude: Optional[float] = Query(None, description="Exact latitude alias"),
    longitude: Optional[float] = Query(None, description="Exact longitude alias"),
    region: Optional[str] = Query(None, description="Optional state/region name"),
):
    """
    Returns weather scene data for animated canvas rendering based on Open-Meteo WMO codes.
    Includes scene type, wind overlay status, and animation parameters.
    """
    from backend.services.weather_scene_service import get_weather_scene
    
    final_lat, final_lon = _extract_coords(lat, lon, latitude, longitude)
    clean_loc = str(location) if location and not hasattr(location, "default") else "Krishna District"
    clean_reg = str(region) if region and not hasattr(region, "default") else None
    
    # If coordinates are provided, append them to location for precision
    if final_lat is not None and final_lon is not None:
        location_query = f"{clean_loc} ({final_lat:.4f}, {final_lon:.4f})"
    else:
        location_query = clean_loc
    
    return get_weather_scene(location=location_query)

