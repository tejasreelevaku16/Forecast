from typing import Any, Dict, Optional

from fastapi import APIRouter, Query

from backend.models.insight_model import ForecastInsightsRequest
from backend.services.weather_insights_service import build_forecast_insights, calculate_weather_trust
from backend.services.weather_service import get_full_forecast_response

router = APIRouter(prefix="/api/insights", tags=["Weather Insights"])


@router.post("", summary="Calculate Dynamic WeatherTrust Insights")
def forecast_insights(request: ForecastInsightsRequest) -> Dict[str, Any]:
    return build_forecast_insights(request)


@router.get("/badge", summary="Calculate a Live Location Reliability Badge")
def location_reliability_badge(
    location: str = Query(..., min_length=1),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    region: Optional[str] = Query(None),
    lead_day: int = Query(6, ge=1, le=10),
) -> Dict[str, Any]:
    forecast = get_full_forecast_response(location_query=location, lat=lat, lon=lon, region=region)
    if not forecast.available or not forecast.daily or len(forecast.daily) < lead_day:
        return {
            "available": False,
            "location": location,
            "error": forecast.error or "Forecast inputs unavailable",
        }

    pressure_reference = forecast.daily[0].pressure_hpa
    score = calculate_weather_trust(forecast.daily[lead_day - 1], pressure_reference)
    return {"location": location, **score}
