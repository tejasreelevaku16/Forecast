"""
Pydantic models for WeatherTrust AI basic weather data structures.
Covers current weather, hourly forecast, 10-day outlook, and weather alerts.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class WeatherAlert(BaseModel):
    id: str
    severity: str = Field(description="Alert level: advisory, warning, or watch")
    headline: str
    description: str
    issued_at: str


class CurrentWeather(BaseModel):
    location: str
    region: str
    country: str = "India"
    latitude: float
    longitude: float
    condition: str
    condition_icon: str
    temperature_c: float
    feels_like_c: float
    temp_min_c: float
    temp_max_c: float
    humidity_pct: int
    wind_speed_kmh: float
    wind_direction: str
    pressure_hpa: int
    precipitation_mm: float
    rain_chance_pct: int
    uv_index: int
    visibility_km: float
    sunrise: str
    sunset: str
    updated_at: str
    cloud_cover_pct: int = 40
    dew_point_c: float = 23.5
    wind_gusts_kmh: float = 26.0
    air_quality_index: str = "Moderate (AQI 82)"


class HourlyForecastItem(BaseModel):
    time: str
    temperature_c: float
    condition: str
    condition_icon: str
    rain_chance_pct: int
    precipitation_mm: float
    wind_speed_kmh: float


class DailyForecastItem(BaseModel):
    day_index: int = Field(description="Forecast lead day: 1 to 10")
    day_name: str
    date: str
    condition: str
    condition_icon: str
    temp_min_c: float
    temp_max_c: float
    rain_chance_pct: int
    precipitation_mm: float
    humidity_pct: int
    wind_speed_kmh: float


class LocationSearchResult(BaseModel):
    location_id: str
    name: str
    region: str
    country: str
    latitude: float
    longitude: float


class WeatherForecastResponse(BaseModel):
    current: CurrentWeather
    hourly: List[HourlyForecastItem]
    daily: List[DailyForecastItem]
    alerts: List[WeatherAlert]
