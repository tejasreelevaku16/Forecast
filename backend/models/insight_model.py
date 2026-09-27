from typing import Optional

from pydantic import BaseModel, Field

from backend.models.reliability_model import ReliabilityOverview
from backend.models.weather_model import WeatherForecastResponse


class ForecastInsightsRequest(BaseModel):
    forecast: WeatherForecastResponse
    reliability: Optional[ReliabilityOverview] = None
    focus_lead_day: int = Field(default=6, ge=1, le=10)
