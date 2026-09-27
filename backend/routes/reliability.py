"""
Forecast Trust API Routes (Phase 1)
Exposes endpoints for the WeatherTrust AI reliability layer, bust probabilities,
stability assessments, and explainability factors.
"""

from fastapi import APIRouter, Query
from backend.models.reliability_model import ReliabilityOverview
from backend.services.reliability_service import get_forecast_reliability_overview

router = APIRouter(prefix="/api/reliability", tags=["Forecast Trust Layer"])


@router.get("/overview", response_model=ReliabilityOverview, summary="Get Forecast Trust Overview")
def trust_overview(
    location: str = Query("Krishna District", description="Location name or query"),
    lead_day: int = Query(6, description="Focus lead day: 1 to 10"),
    sector: str = Query("General Public", description="User persona for decision support"),
):
    """
    Returns ML-backed Forecast Trust profile, Bust Risk probability,
    lead-day risk breakdown, model-backed explainability factors, and sector recommendations.
    """
    return get_forecast_reliability_overview(location=location, focus_lead_day=lead_day, sector=sector)


@router.get("/demo", response_model=ReliabilityOverview, summary="Alias for Forecast Trust Overview")
def demo_overview(
    location: str = Query("Krishna District", description="Location name or query"),
    lead_day: int = Query(6, description="Focus lead day"),
    sector: str = Query("General Public", description="User persona"),
):
    """Convenience alias for reliability overview."""
    return get_forecast_reliability_overview(location=location, focus_lead_day=lead_day, sector=sector)
