from backend.models.insight_model import ForecastInsightsRequest
from backend.models.reliability_model import LeadDayReliability, ReliabilityOverview
from backend.models.weather_model import DailyForecastItem, WeatherForecastResponse
from backend.services.weather_insights_service import build_forecast_insights, calculate_weather_trust
from backend.main import app
from fastapi.testclient import TestClient

client = TestClient(app)


def make_day(day: int, **overrides) -> DailyForecastItem:
    values = {
        "day_index": day,
        "day_name": f"Day {day}",
        "date": f"Oct {day:02d}",
        "condition": "Clear",
        "condition_icon": "sun",
        "temp_min_c": 22.0,
        "temp_max_c": 30.0,
        "rain_chance_pct": 10,
        "precipitation_mm": 0.0,
        "humidity_pct": 50,
        "wind_speed_kmh": 10.0,
        "pressure_hpa": 1013.0,
        "cloud_cover_pct": 10,
        "wmo_code": 0,
    }
    values.update(overrides)
    return DailyForecastItem(**values)


def test_trust_score_uses_live_feature_values_and_thresholds():
    stable = calculate_weather_trust(make_day(1), pressure_reference_hpa=1013.0)
    watch = calculate_weather_trust(
        make_day(1, precipitation_mm=10.0, rain_chance_pct=60, wind_speed_kmh=30.0,
                 pressure_hpa=1009.0, cloud_cover_pct=60, humidity_pct=80),
        pressure_reference_hpa=1013.0,
    )
    severe = calculate_weather_trust(
        make_day(1, precipitation_mm=80.0, rain_chance_pct=100, temp_max_c=40.0,
                 humidity_pct=95, wind_speed_kmh=80.0, pressure_hpa=990.0,
                 cloud_cover_pct=100, wmo_code=95),
        pressure_reference_hpa=1013.0,
    )

    assert stable["score"] >= 80 and stable["label"] == "Reliable"
    assert 50 <= watch["score"] < 80 and watch["label"] == "Watch"
    assert severe["score"] < 50 and severe["label"] == "Unreliable"
    assert len(watch["contributions"]) == 5
    assert "thunderstorm" in severe["reason"].lower()


def test_missing_weather_features_do_not_get_fabricated_scores():
    result = calculate_weather_trust(make_day(1, pressure_hpa=None), pressure_reference_hpa=1013.0)
    assert result["available"] is False
    assert "pressure_hpa" in result["error"]


def test_replay_disagreement_and_sector_advisories_are_derived_from_forecast():
    days = [
        make_day(
            day,
            precipitation_mm=float(day * 2),
            rain_chance_pct=day * 5,
            temp_min_c=20.0 + day / 2,
            temp_max_c=29.0 + day / 2,
            humidity_pct=50 + day,
            wind_speed_kmh=10.0 + day,
            pressure_hpa=1013.0 - day / 2,
            cloud_cover_pct=15 + day * 5,
        )
        for day in range(1, 11)
    ]
    reliability = ReliabilityOverview(
        location="Test City",
        reliability_score=72,
        bust_probability_pct=28,
        lead_days=[
            LeadDayReliability(
                lead_day=day,
                day_name=f"Day {day}",
                date=f"Oct {day:02d}",
                reliability_score=72,
                bust_probability_pct=28,
                risk_level="LOW",
                stability="HIGH",
                primary_risk_driver="Measured forecast values",
            )
            for day in range(1, 11)
        ],
    )
    result = build_forecast_insights(ForecastInsightsRequest(
        forecast=WeatherForecastResponse(daily=days),
        reliability=reliability,
        focus_lead_day=6,
    ))

    assert result["available"] is True
    assert len(result["replay"]["days"]) == 10
    assert result["replay"]["days"][5]["rainfall_mm"] == 12.0
    assert result["replay"]["earliest"]["rainfall_mm"] == 2.0
    assert result["replay"]["latest"]["rainfall_mm"] == 20.0
    assert result["disagreement"]["difference_pct"] is not None
    assert result["disagreement"]["risk_level"] in ("LOW", "MEDIUM", "HIGH")
    assert len(result["advisories"]) == 5
    assert all({"risk_level", "expected_impact", "recommended_action"} <= advisory.keys() for advisory in result["advisories"])


def test_insights_api_accepts_existing_weather_and_reliability_payloads():
    forecast = WeatherForecastResponse(daily=[make_day(day) for day in range(1, 11)])
    reliability = ReliabilityOverview(location="Test City", lead_days=[
        LeadDayReliability(
            lead_day=day,
            day_name=f"Day {day}",
            date=f"Oct {day:02d}",
            reliability_score=82,
            bust_probability_pct=18,
            risk_level="LOW",
            stability="HIGH",
            primary_risk_driver="Measured forecast values",
        )
        for day in range(1, 11)
    ])
    response = client.post("/api/insights", json={
        "forecast": forecast.model_dump(),
        "reliability": reliability.model_dump(),
        "focus_lead_day": 1,
    })

    assert response.status_code == 200
    payload = response.json()
    assert payload["weather_trust"]["available"] is True
    assert len(payload["replay"]["days"]) == 10
    assert len(payload["advisories"]) == 5
