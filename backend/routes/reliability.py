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
def trust_overview(location: str = Query("Krishna District", description="Location name or query")):
    """
    Returns the Forecast Trust profile, Bust Risk probability,
    lead-day risk breakdown, explainability factors, and user recommendations.
    Clearly marked as DEMO / SAMPLE DATA during Phase 1.
    """
    return get_forecast_reliability_overview(location)


@router.get("/demo", response_model=ReliabilityOverview, summary="Alias for Demo Trust Overview")
def demo_overview(location: str = Query("Krishna District", description="Location name or query")):
    """Convenience alias for demo reliability overview."""
    return get_forecast_reliability_overview(location)
