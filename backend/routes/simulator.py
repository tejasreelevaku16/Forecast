"""
WeatherTrust AI — Real-Time Decision Simulator API (SIH Differentiator 3)
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)

Exposes interactive what-if weather scenario simulation endpoints.
"""

from typing import Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel, Field
from backend.services.decision_simulator_service import (
    simulate_atmospheric_scenario,
    get_simulator_presets,
)

router = APIRouter(prefix="/api/simulator", tags=["Decision Simulator (What-If)"])


class ScenarioSimulationRequest(BaseModel):
    rainfall_mm: float = Field(25.0, ge=0.0, le=300.0, description="Precipitation in mm")
    temp_c: float = Field(30.0, ge=-20.0, le=60.0, description="Temperature in °C")
    wind_kmh: float = Field(18.0, ge=0.0, le=180.0, description="Wind speed in km/h")
    humidity_pct: float = Field(70.0, ge=0.0, le=100.0, description="Relative humidity in %")
    pressure_hpa: float = Field(1010.0, ge=920.0, le=1050.0, description="Barometric pressure in hPa")
    cloud_cover_pct: float = Field(50.0, ge=0.0, le=100.0, description="Cloud cover percentage")
    lead_day: int = Field(5, ge=1, le=10, description="Lead forecast day (1 to 10)")
    location: str = Field("Vijayawada", description="District or location name")


@router.get("/presets", summary="Get Pre-Configured Weather Scenario Presets")
def api_get_presets() -> Dict[str, Any]:
    """Returns curated extreme and benign atmospheric scenario presets."""
    return {
        "status": "success",
        "presets": get_simulator_presets(),
    }


@router.post("/run", summary="Run Real-Time Decision Simulation (SIH Differentiator 3)")
def api_run_simulation(payload: ScenarioSimulationRequest) -> Dict[str, Any]:
    """
    Evaluates simulated atmospheric variables in real time.
    Returns dynamic Trust Score, Bust Probability, Reliability Tier,
    Active Alerts, SHAP Feature Importance, and Sector Decision Support.
    """
    return simulate_atmospheric_scenario(payload.model_dump())
