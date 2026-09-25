"""
Weather Service (Phase 1)
Supplies realistic, structured weather forecast data for Indian locations,
with primary focus on Krishna District, Andhra Pradesh as specified in the SIH prompt.
Designed for seamless transition to live meteorological APIs in Phase 2.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Any
from backend.models.weather_model import (
    CurrentWeather,
    HourlyForecastItem,
    DailyForecastItem,
    WeatherAlert,
    WeatherForecastResponse,
    LocationSearchResult,
)


LOCATION_PRESETS: Dict[str, Dict[str, Any]] = {
    "krishna district": {
        "location": "Krishna District",
        "region": "Andhra Pradesh",
        "country": "India",
        "latitude": 16.5062,
        "longitude": 80.6480,
        "current": {
            "condition": "Humid & Partly Cloudy",
            "condition_icon": "cloud-sun",
            "temperature_c": 31.5,
            "feels_like_c": 37.0,
            "temp_min_c": 26.0,
            "temp_max_c": 34.0,
            "humidity_pct": 78,
            "wind_speed_kmh": 19.5,
            "wind_direction": "SE",
            "pressure_hpa": 1007,
            "precipitation_mm": 2.4,
            "rain_chance_pct": 40,
            "uv_index": 7,
            "visibility_km": 8.5,
            "sunrise": "06:01 AM",
            "sunset": "06:12 PM",
        },
        "day6_override": {
            "condition": "Heavy Monsoonal Downpour",
            "condition_icon": "cloud-rain-heavy",
            "precipitation_mm": 80.0,
            "rain_chance_pct": 92,
            "temp_min_c": 24.0,
            "temp_max_c": 29.0,
        }
    },
    "hyderabad": {
        "location": "Hyderabad",
        "region": "Telangana",
        "country": "India",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "current": {
            "condition": "Scattered Clouds",
            "condition_icon": "cloud",
            "temperature_c": 29.0,
            "feels_like_c": 32.5,
            "temp_min_c": 23.0,
            "temp_max_c": 31.0,
            "humidity_pct": 65,
            "wind_speed_kmh": 14.0,
            "wind_direction": "ENE",
            "pressure_hpa": 1011,
            "precipitation_mm": 0.0,
            "rain_chance_pct": 20,
            "uv_index": 8,
            "visibility_km": 9.0,
            "sunrise": "06:08 AM",
            "sunset": "06:19 PM",
        }
    },
    "bengaluru": {
        "location": "Bengaluru",
        "region": "Karnataka",
        "country": "India",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "current": {
            "condition": "Mild Breeze & Overcast",
            "condition_icon": "cloud",
            "temperature_c": 24.5,
            "feels_like_c": 25.0,
            "temp_min_c": 19.0,
            "temp_max_c": 27.0,
            "humidity_pct": 72,
            "wind_speed_kmh": 18.0,
            "wind_direction": "W",
            "pressure_hpa": 1014,
            "precipitation_mm": 1.2,
            "rain_chance_pct": 35,
            "uv_index": 6,
            "visibility_km": 10.0,
            "sunrise": "06:09 AM",
            "sunset": "06:17 PM",
        }
    },
    "delhi": {
        "location": "Delhi",
        "region": "National Capital Region",
        "country": "India",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "current": {
            "condition": "Hazy Sunshine",
            "condition_icon": "sun",
            "temperature_c": 33.0,
            "feels_like_c": 36.0,
            "temp_min_c": 24.5,
            "temp_max_c": 35.0,
            "humidity_pct": 55,
            "wind_speed_kmh": 11.0,
            "wind_direction": "NW",
            "pressure_hpa": 1010,
            "precipitation_mm": 0.0,
            "rain_chance_pct": 10,
            "uv_index": 7,
            "visibility_km": 6.0,
            "sunrise": "06:14 AM",
            "sunset": "06:18 PM",
        }
    },
    "mumbai": {
        "location": "Mumbai",
        "region": "Maharashtra",
        "country": "India",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "current": {
            "condition": "Passing Coastal Showers",
            "condition_icon": "cloud-rain",
            "temperature_c": 30.0,
            "feels_like_c": 36.5,
            "temp_min_c": 26.0,
            "temp_max_c": 32.0,
            "humidity_pct": 82,
            "wind_speed_kmh": 22.0,
            "wind_direction": "WSW",
            "pressure_hpa": 1008,
            "precipitation_mm": 5.8,
            "rain_chance_pct": 60,
            "uv_index": 5,
            "visibility_km": 7.0,
            "sunrise": "06:29 AM",
            "sunset": "06:36 PM",
        }
    }
}


def _match_preset(query: str) -> Dict[str, Any]:
    cleaned = (query or "").lower().strip()
    for key, data in LOCATION_PRESETS.items():
        if key in cleaned or cleaned in key:
            return data
    # Default fallback is Krishna District
    return LOCATION_PRESETS["krishna district"]


def get_current_weather(location_query: str = "Krishna District") -> CurrentWeather:
    data = _match_preset(location_query)
    c = data["current"]
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    
    return CurrentWeather(
        location=data["location"],
        region=data["region"],
        country=data["country"],
        latitude=data["latitude"],
        longitude=data["longitude"],
        condition=c["condition"],
        condition_icon=c["condition_icon"],
        temperature_c=c["temperature_c"],
        feels_like_c=c["feels_like_c"],
        temp_min_c=c["temp_min_c"],
        temp_max_c=c["temp_max_c"],
        humidity_pct=c["humidity_pct"],
        wind_speed_kmh=c["wind_speed_kmh"],
        wind_direction=c["wind_direction"],
        pressure_hpa=c["pressure_hpa"],
        precipitation_mm=c["precipitation_mm"],
        rain_chance_pct=c["rain_chance_pct"],
        uv_index=c["uv_index"],
        visibility_km=c["visibility_km"],
        sunrise=c["sunrise"],
        sunset=c["sunset"],
        updated_at=now,
    )


def get_hourly_forecast(location_query: str = "Krishna District") -> List[HourlyForecastItem]:
    data = _match_preset(location_query)
    base_temp = data["current"]["temperature_c"]
    
    # 24-hour simulation curve
    hourly_items: List[HourlyForecastItem] = []
    base_time = datetime.now()
    
    temp_offsets = [0.0, -0.4, -0.8, -1.2, -0.9, 0.2, 1.4, 2.3, 2.8, 2.1, 1.0, 0.2, -0.5, -1.0, -1.5, -1.8, -2.0, -2.2, -2.0, -1.5, -0.8, -0.2, 0.1, 0.0]
    rain_profile = [20, 25, 30, 45, 50, 40, 35, 20, 15, 10, 15, 25, 35, 55, 65, 70, 60, 45, 35, 30, 25, 20, 15, 20]
    
    for i in range(24):
        item_time = base_time + timedelta(hours=i)
        offset = temp_offsets[i % len(temp_offsets)]
        temp = round(base_temp + offset, 1)
        rain_chance = rain_profile[i % len(rain_profile)]
        
        if rain_chance >= 60:
            cond = "Thunderstorm / Rain"
            icon = "cloud-lightning"
            precip = round(rain_chance * 0.08, 1)
        elif rain_chance >= 35:
            cond = "Scattered Showers"
            icon = "cloud-rain"
            precip = round(rain_chance * 0.03, 1)
        elif rain_chance >= 20:
            cond = "Partly Cloudy"
            icon = "cloud-sun"
            precip = 0.0
        else:
            cond = "Clear Skies"
            icon = "sun"
            precip = 0.0
            
        hourly_items.append(
            HourlyForecastItem(
                time=item_time.strftime("%I:%M %p"),
                temperature_c=temp,
                condition=cond,
                condition_icon=icon,
                rain_chance_pct=rain_chance,
                precipitation_mm=precip,
                wind_speed_kmh=round(12.0 + (i % 7), 1)
            )
        )
        
    return hourly_items


def get_daily_forecast(location_query: str = "Krishna District") -> List[DailyForecastItem]:
    data = _match_preset(location_query)
    is_krishna = (data["location"] == "Krishna District")
    base_time = datetime.now()
    
    # 10 lead days simulation
    daily_items: List[DailyForecastItem] = []
    
    general_conditions = [
        ("Partly Cloudy", "cloud-sun", 25.0, 33.0, 30, 1.5, 70, 14.0),
        ("Scattered Showers", "cloud-rain", 24.5, 32.0, 55, 6.2, 75, 16.5),
        ("Isolated Thunderstorms", "cloud-lightning", 24.0, 31.0, 65, 12.0, 80, 19.0),
        ("Cloudy with Light Rain", "cloud-rain", 25.0, 31.5, 45, 4.0, 74, 15.0),
        ("Heavy Rain Developing", "cloud-rain-heavy", 23.5, 29.5, 80, 35.0, 88, 22.0),
        ("Extreme Monsoonal Rainfall", "cloud-rain-heavy", 23.0, 28.0, 92, 80.0, 92, 28.0), # Day 6
        ("Gradual Clearing", "cloud-sun", 24.0, 30.5, 60, 18.0, 82, 20.0),
        ("Partly Cloudy", "cloud-sun", 25.0, 32.0, 35, 2.0, 72, 13.0),
        ("Sunny Intervals", "sun", 25.5, 33.5, 20, 0.0, 68, 12.0),
        ("Warm and Humid", "sun", 26.0, 34.0, 15, 0.0, 65, 11.0),
    ]
    
    for lead_day in range(1, 11):
        target_date = base_time + timedelta(days=lead_day)
        day_name = "Tomorrow" if lead_day == 1 else target_date.strftime("%a")
        date_str = target_date.strftime("%b %d")
        
        cond_info = general_conditions[lead_day - 1]
        
        # Override specifically for Krishna District Day 6 to match prompt requirements (80mm)
        if is_krishna and lead_day == 6 and "day6_override" in data:
            ovr = data["day6_override"]
            daily_items.append(
                DailyForecastItem(
                    day_index=lead_day,
                    day_name=f"Day {lead_day} ({day_name})",
                    date=date_str,
                    condition=ovr["condition"],
                    condition_icon=ovr["condition_icon"],
                    temp_min_c=ovr["temp_min_c"],
                    temp_max_c=ovr["temp_max_c"],
                    rain_chance_pct=ovr["rain_chance_pct"],
                    precipitation_mm=ovr["precipitation_mm"],
                    humidity_pct=92,
                    wind_speed_kmh=28.5
                )
            )
        else:
            daily_items.append(
                DailyForecastItem(
                    day_index=lead_day,
                    day_name=f"Day {lead_day} ({day_name})",
                    date=date_str,
                    condition=cond_info[0],
                    condition_icon=cond_info[1],
                    temp_min_c=cond_info[2],
                    temp_max_c=cond_info[3],
                    rain_chance_pct=cond_info[4],
                    precipitation_mm=cond_info[5],
                    humidity_pct=cond_info[6],
                    wind_speed_kmh=cond_info[7]
                )
            )
            
    return daily_items


def get_weather_alerts(location_query: str = "Krishna District") -> List[WeatherAlert]:
    data = _match_preset(location_query)
    if data["location"] == "Krishna District":
        return [
            WeatherAlert(
                id="alert-001",
                severity="advisory",
                headline="Elevated Monsoonal Moisture Advisory",
                description="Coastal Andhra Pradesh experiences humid onshore winds. Long-range forecast indicates potential rainfall surges around Day 5–6.",
                issued_at="Today, 08:30 IST"
            )
        ]
    return []


def search_locations(query: str) -> List[LocationSearchResult]:
    q = (query or "").lower().strip()
    results = []
    for key, data in LOCATION_PRESETS.items():
        if q in key or q in data["location"].lower() or q in data["region"].lower():
            results.append(
                LocationSearchResult(
                    location_id=key,
                    name=data["location"],
                    region=data["region"],
                    country=data["country"],
                    latitude=data["latitude"],
                    longitude=data["longitude"],
                )
            )
    return results


def get_full_forecast_response(location_query: str = "Krishna District") -> WeatherForecastResponse:
    return WeatherForecastResponse(
        current=get_current_weather(location_query),
        hourly=get_hourly_forecast(location_query),
        daily=get_daily_forecast(location_query),
        alerts=get_weather_alerts(location_query)
    )
