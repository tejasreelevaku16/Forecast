from typing import Any, Dict, Optional

from fastapi import APIRouter, Query

from backend.models.insight_model import ForecastInsightsRequest
from backend.services.weather_insights_service import build_forecast_insights, calculate_weather_trust
from backend.services.weather_service import get_full_forecast_response

router = APIRouter(prefix="/api/insights", tags=["Weather Insights"])


@router.post("", summary="Calculate Dynamic WeatherTrust Insights")
def forecast_insights(request: ForecastInsightsRequest) -> Dict[str, Any]:
    return build_forecast_insights(request)


_badge_cache: Dict[str, Any] = {}

@router.get("/badge", summary="Calculate a Live Location Reliability Badge")
def location_reliability_badge(
    location: str = Query(..., min_length=1),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    region: Optional[str] = Query(None),
    lead_day: int = Query(6, ge=1, le=10),
) -> Dict[str, Any]:
    cache_key = f"{location.strip().lower()}_{lat}_{lon}_{region}_{lead_day}"
    if cache_key in _badge_cache:
        return _badge_cache[cache_key]

    forecast = get_full_forecast_response(location_query=location, lat=lat, lon=lon, region=region)
    if not forecast.available or not forecast.daily or len(forecast.daily) < lead_day:
        result = {
            "available": False,
            "location": location,
            "error": forecast.error or "Forecast inputs unavailable",
        }
        _badge_cache[cache_key] = result
        return result

    pressure_reference = forecast.daily[0].pressure_hpa
    score = calculate_weather_trust(forecast.daily[lead_day - 1], pressure_reference)
    result = {"location": location, **score}
    _badge_cache[cache_key] = result
    return result
