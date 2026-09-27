"""
Forecast Trust API Routes (SIH Problem ID: 26079)
Exposes endpoints for the WeatherTrust AI reliability layer, day-wise ML predictions,
uncertainty quantification, and explainability factors.
"""

from typing import Dict, Any
from fastapi import APIRouter, Query
from backend.models.reliability_model import ReliabilityOverview
from backend.services.reliability_service import (
    get_forecast_reliability_overview,
    get_daywise_reliability,
    get_shap_explainability_detail,
)
from backend.services.uncertainty_service import calculate_forecast_uncertainty_profile

router = APIRouter(prefix="/api/reliability", tags=["Forecast Trust Layer"])


@router.get("/overview", response_model=ReliabilityOverview, summary="Get Forecast Trust Overview")
def trust_overview(
    location: str = Query("Vijayawada", description="Location name or query"),
    lead_day: int = Query(6, description="Focus lead day: 1 to 10"),
    sector: str = Query("General Public", description="User persona for decision support"),
):
    """
    Returns ML-backed Forecast Trust profile, Bust Risk probability,
    lead-day risk breakdown, model-backed explainability factors, and sector recommendations.
    """
    return get_forecast_reliability_overview(location=location, focus_lead_day=lead_day, sector=sector)


@router.get("/daywise", summary="Get Day 1 to Day 10 Independent ML Predictions (SIH Feature 2)")
def api_daywise_reliability(
    location: str = Query("Vijayawada", description="City or district name")
) -> Dict[str, Any]:
    """
    SIH Feature 2 Endpoint:
    Produces independent ML predictions for every lead day (Day 1 through Day 10)
    with Confidence, Bust Probability, Risk Category, SHAP summary, Drift, and Uncertainty.
    """
    return get_daywise_reliability(location=location)


@router.get("/uncertainty", summary="Get Forecast Uncertainty & Variability Profile (SIH Feature 3)")
def api_uncertainty_profile(
    location: str = Query("Vijayawada", description="City or district name")
) -> Dict[str, Any]:
    """
    SIH Feature 3 Endpoint:
    Calculates forecast uncertainty from real meteorological variability across Day 1–10.
    Returns confidence series, uncertainty series, drift series, KPI summaries, and automated insights.
    """
    return calculate_forecast_uncertainty_profile(location=location)


@router.get("/demo", response_model=ReliabilityOverview, summary="Alias for Forecast Trust Overview")
def demo_overview(
    location: str = Query("Vijayawada", description="Location name or query"),
    lead_day: int = Query(6, description="Focus lead day"),
    sector: str = Query("General Public", description="User persona"),
):
    """Convenience alias for reliability overview."""
    return get_forecast_reliability_overview(location=location, focus_lead_day=lead_day, sector=sector)
