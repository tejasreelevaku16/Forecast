"""
Explainable AI (XAI) API Routes (SIH Problem ID: 26079)
Exposes SHAP meteorological feature contributions, confidence gauges, and domain insights.
"""

from typing import Dict, Any
from fastapi import APIRouter, Query
from backend.services.reliability_service import get_shap_explainability_detail

router = APIRouter(prefix="/api/explain", tags=["Explainable AI (XAI)"])


@router.get("/bust", summary="Get Explainable Forecast Bust Analysis (SIH Feature 5)")
def api_explain_bust(
    location: str = Query("Vijayawada", description="City or district name"),
    lead_day: int = Query(6, description="Lead day (1 to 10)")
) -> Dict[str, Any]:
    """
    SIH Feature 5 Endpoint:
    Returns SHAP-equivalent meteorological feature contributions (Pressure Drop, Rainfall Gradient,
    Wind Shear, Forecast Drift, etc.), natural language summary, and operational recommendations.
    """
    return get_shap_explainability_detail(location=location, lead_day=lead_day)
