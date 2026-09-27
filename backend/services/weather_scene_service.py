"""
WeatherTrust AI — Weather Scene Service (Live Weather Scene Engine)
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
Maps Open-Meteo WMO weather codes to animated scene types with priority rules.
"""

from typing import Dict, Any, Optional, Tuple
from enum import Enum


class SceneType(Enum):
    """Enum for all supported weather scene types."""
    CLEAR_SKY = "clear_sky"
    PARTLY_CLOUDY = "partly_cloudy"
    FOG = "fog"
    RAIN = "rain"
    THUNDERSTORM = "thunderstorm"
    SNOW = "snow"
    WINDY = "windy"


class WeatherSceneService:
    """
    Service for determining weather scenes based on Open-Meteo data.
    Implements WMO code mapping with priority rules and wind overlay logic.
    """

    # WMO code ranges for each scene type
    WMO_SCENE_MAPPING = {
        SceneType.CLEAR_SKY: [0, 1],
        SceneType.PARTLY_CLOUDY: [1, 2, 3],
        SceneType.FOG: [45, 48],
        SceneType.RAIN: [51, 52, 53, 55, 61, 63, 65, 80, 81, 82],
        SceneType.THUNDERSTORM: [95, 96, 99],
        SceneType.SNOW: [71, 72, 73, 75, 77, 85, 86],
    }

    # Wind speed threshold for windy overlay (km/h)
    WIND_THRESHOLD_KMH = 25.0

    # Cloud cover thresholds for clear/partly cloudy distinction
    CLOUD_COVER_CLEAR_MAX = 30  # < 30% = clear
    CLOUD_COVER_PARTLY_MIN = 30  # 30-70% = partly cloudy
    CLOUD_COVER_PARTLY_MAX = 70

    # Temperature threshold for conditional snow (°C)
    SNOW_TEMP_THRESHOLD = 0.0

    # Humidity threshold for conditional snow
    SNOW_HUMIDITY_THRESHOLD = 70

    # Cloud cover threshold for conditional snow
    SNOW_CLOUD_COVER_THRESHOLD = 60

    @staticmethod
    def determine_scene(
        wmo_code: int,
        cloud_cover: Optional[float] = None,
        temperature_c: Optional[float] = None,
        humidity_pct: Optional[float] = None,
        wind_speed_kmh: Optional[float] = None
    ) -> Tuple[SceneType, bool]:
        """
        Determine the base scene type and whether to apply wind overlay.

        Args:
            wmo_code: WMO weather code from Open-Meteo
            cloud_cover: Cloud cover percentage (0-100)
            temperature_c: Temperature in Celsius
            humidity_pct: Relative humidity percentage
            wind_speed_kmh: Wind speed in km/h

        Returns:
            Tuple of (base_scene_type, apply_wind_overlay)
        """
        # Normalize inputs
        cloud_cover = cloud_cover if cloud_cover is not None else 50
        temperature_c = temperature_c if temperature_c is not None else 20
        humidity_pct = humidity_pct if humidity_pct is not None else 70
        wind_speed_kmh = wind_speed_kmh if wind_speed_kmh is not None else 15

        # Priority 1: Precipitation codes (Rain, Thunderstorm, Snow, Fog)
        # These always determine the base scene
        if wmo_code in WeatherSceneService.WMO_SCENE_MAPPING[SceneType.THUNDERSTORM]:
            return SceneType.THUNDERSTORM, wind_speed_kmh > WeatherSceneService.WIND_THRESHOLD_KMH

        if wmo_code in WeatherSceneService.WMO_SCENE_MAPPING[SceneType.RAIN]:
            return SceneType.RAIN, wind_speed_kmh > WeatherSceneService.WIND_THRESHOLD_KMH

        if wmo_code in WeatherSceneService.WMO_SCENE_MAPPING[SceneType.FOG]:
            return SceneType.FOG, wind_speed_kmh > WeatherSceneService.WIND_THRESHOLD_KMH

        # Snow: either direct WMO code OR conditional (cold + humid + cloudy)
        if wmo_code in WeatherSceneService.WMO_SCENE_MAPPING[SceneType.SNOW]:
            return SceneType.SNOW, wind_speed_kmh > WeatherSceneService.WIND_THRESHOLD_KMH

        # Conditional snow: temp ≤ 0°C AND cloud cover > 60% AND humidity > 70%
        if (temperature_c <= WeatherSceneService.SNOW_TEMP_THRESHOLD and
            cloud_cover > WeatherSceneService.SNOW_CLOUD_COVER_THRESHOLD and
            humidity_pct > WeatherSceneService.SNOW_HUMIDITY_THRESHOLD):
            return SceneType.SNOW, wind_speed_kmh > WeatherSceneService.WIND_THRESHOLD_KMH

        # Priority 2: Clear vs Partly Cloudy (based on cloud cover)
        if wmo_code in WeatherSceneService.WMO_SCENE_MAPPING[SceneType.CLEAR_SKY]:
            if cloud_cover < WeatherSceneService.CLOUD_COVER_CLEAR_MAX:
                base_scene = SceneType.CLEAR_SKY
            else:
                base_scene = SceneType.PARTLY_CLOUDY
        elif wmo_code in WeatherSceneService.WMO_SCENE_MAPPING[SceneType.PARTLY_CLOUDY]:
            if WeatherSceneService.CLOUD_COVER_PARTLY_MIN <= cloud_cover <= WeatherSceneService.CLOUD_COVER_PARTLY_MAX:
                base_scene = SceneType.PARTLY_CLOUDY
            elif cloud_cover < WeatherSceneService.CLOUD_COVER_PARTLY_MIN:
                base_scene = SceneType.CLEAR_SKY
            else:
                base_scene = SceneType.PARTLY_CLOUDY
        else:
            # Fallback for unknown codes
            base_scene = SceneType.PARTLY_CLOUDY

        # Windy is only base scene when wind > threshold AND no precipitation
        apply_wind_overlay = wind_speed_kmh > WeatherSceneService.WIND_THRESHOLD_KMH

        return base_scene, apply_wind_overlay

    @staticmethod
    def get_scene_data(
        wmo_code: int,
        cloud_cover: Optional[float] = None,
        temperature_c: Optional[float] = None,
        humidity_pct: Optional[float] = None,
        wind_speed_kmh: Optional[float] = None,
        wind_direction_deg: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Get complete scene data for frontend rendering.

        Args:
            wmo_code: WMO weather code from Open-Meteo
            cloud_cover: Cloud cover percentage (0-100)
            temperature_c: Temperature in Celsius
            humidity_pct: Relative humidity percentage
            wind_speed_kmh: Wind speed in km/h
            wind_direction_deg: Wind direction in degrees (0-360)

        Returns:
            Dictionary with scene type, wind overlay status, and animation parameters
        """
        base_scene, apply_wind_overlay = WeatherSceneService.determine_scene(
            wmo_code, cloud_cover, temperature_c, humidity_pct, wind_speed_kmh
        )

        # Calculate wind direction vector for particle animation
        wind_rad = (wind_direction_deg or 0) * (3.14159 / 180) if wind_direction_deg else 0
        wind_vector_x = -1 * (wind_speed_kmh or 15) / 50  # Normalize for animation
        wind_vector_y = 0

        # Scene-specific animation parameters
        scene_params = {
            "scene_type": base_scene.value,
            "apply_wind_overlay": apply_wind_overlay,
            "wind_speed_kmh": wind_speed_kmh or 15,
            "wind_direction_deg": wind_direction_deg or 0,
            "wind_vector_x": wind_vector_x,
            "wind_vector_y": wind_vector_y,
            "cloud_cover": cloud_cover or 50,
            "temperature_c": temperature_c or 20,
            "humidity_pct": humidity_pct or 70,
        }

        # Add scene-specific parameters
        if base_scene == SceneType.CLEAR_SKY:
            scene_params.update({
                "sky_brightness": 1.0,
                "sun_rotation_speed": 0.01,
                "cloud_density": 0.3,
            })
        elif base_scene == SceneType.PARTLY_CLOUDY:
            scene_params.update({
                "sky_brightness": 0.85,
                "sun_rotation_speed": 0.008,
                "cloud_density": 0.6,
                "parallax_layers": 3,
            })
        elif base_scene == SceneType.RAIN:
            scene_params.update({
                "sky_brightness": 0.7,
                "rain_density": 150,
                "rain_speed": 8,
                "ripple_interval": 2000,
            })
        elif base_scene == SceneType.THUNDERSTORM:
            scene_params.update({
                "sky_brightness": 0.5,
                "rain_density": 200,
                "rain_speed": 12,
                "lightning_interval_min": 4000,
                "lightning_interval_max": 10000,
            })
        elif base_scene == SceneType.SNOW:
            scene_params.update({
                "sky_brightness": 0.8,
                "snow_density": 80,
                "snow_speed": 2,
                "snow_haze": 0.4,
            })
        elif base_scene == SceneType.FOG:
            scene_params.update({
                "sky_brightness": 0.6,
                "fog_density": 0.7,
                "fog_layers": 3,
            })

        # Wind overlay parameters
        if apply_wind_overlay:
            scene_params.update({
                "wind_streak_speed": 15,
                "wind_streak_density": 30,
                "tree_sway_speed": 0.15,
                "leaf_particle_count": 40,
            })

        return scene_params

    @staticmethod
    def get_scene_from_weather_data(weather_data) -> Dict[str, Any]:
        """
        Extract scene data from full weather response.

        Args:
            weather_data: WeatherForecastResponse object or dictionary containing current weather data from Open-Meteo

        Returns:
            Scene data dictionary
        """
        # Handle both Pydantic model and dictionary
        if hasattr(weather_data, 'current'):
            current = weather_data.current
            wmo_code = getattr(current, 'wmo_code', 2)
            cloud_cover = getattr(current, 'cloud_cover_pct', 50)
            temperature_c = getattr(current, 'temperature_c', 25)
            humidity_pct = getattr(current, 'humidity_pct', 70)
            wind_speed_kmh = getattr(current, 'wind_speed_kmh', 15)
            # Convert wind direction string to degrees (simplified)
            wind_direction_deg = 0  # Default to North
        else:
            current = weather_data.get("current", {}) if isinstance(weather_data, dict) else {}
            wmo_code = current.get("weather_code", 2)
            cloud_cover = current.get("cloud_cover", 50)
            temperature_c = current.get("temperature_2m", 25)
            humidity_pct = current.get("relative_humidity_2m", 70)
            wind_speed_kmh = current.get("wind_speed_10m", 15)
            wind_direction_deg = current.get("wind_direction_10m", 0)

        return WeatherSceneService.get_scene_data(
            wmo_code=wmo_code,
            cloud_cover=cloud_cover,
            temperature_c=temperature_c,
            humidity_pct=humidity_pct,
            wind_speed_kmh=wind_speed_kmh,
            wind_direction_deg=wind_direction_deg
        )


def get_weather_scene(location: str = "Krishna District") -> Dict[str, Any]:
    """
    Get weather scene data for a location.

    Args:
        location: Location name to fetch weather for

    Returns:
        Dictionary with scene data and weather information
    """
    from backend.services.weather_service import get_full_forecast_response
    
    try:
        weather_data = get_full_forecast_response(location)
        scene_data = WeatherSceneService.get_scene_from_weather_data(weather_data)
        
        return {
            "location": location,
            "scene": scene_data,
            "weather": weather_data.current if weather_data else None,
            "success": True
        }
    except Exception as e:
        print(f"[!] Error getting weather scene: {e}")
        # Return fallback scene
        return {
            "location": location,
            "scene": WeatherSceneService.get_scene_data(
                wmo_code=2,  # Partly cloudy fallback
                cloud_cover=50,
                temperature_c=25,
                humidity_pct=70,
                wind_speed_kmh=15
            ),
            "weather": None,
            "success": False,
            "error": str(e)
        }