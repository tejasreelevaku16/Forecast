"""
Explainable AI (XAI) API Routes (SIH Problem ID: 26079)
Exposes SHAP meteorological feature contributions, confidence gauges, and domain insights.
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, Query
from backend.services.reliability_service import get_shap_explainability_detail

router = APIRouter(prefix="/api/explain", tags=["Explainable AI (XAI)"])


@router.get("", summary="Get Explainable Forecast Bust Analysis (SIH Feature 5)")
def api_explain_root(
    location: str = Query("Vijayawada", description="City or district name"),
    lead_day: int = Query(6, description="Lead day (1 to 10)"),
    day: Optional[int] = Query(None, description="Lead day alias (1 to 10)"),
) -> Dict[str, Any]:
    """
    SIH Feature 5 Root Endpoint:
    Returns SHAP-equivalent meteorological feature contributions (Pressure Drop, Rainfall Gradient,
    Wind Shear, Forecast Drift, etc.), natural language summary, and operational recommendations.
    """
    final_day = day if day is not None and not hasattr(day, "default") else lead_day
    clean_loc = str(location) if location and not hasattr(location, "default") else "Vijayawada"
    return get_shap_explainability_detail(location=clean_loc, lead_day=final_day)


@router.get("/bust", summary="Get Explainable Forecast Bust Analysis (SIH Feature 5 Alias)")
def api_explain_bust(
    location: str = Query("Vijayawada", description="City or district name"),
    lead_day: int = Query(6, description="Lead day (1 to 10)"),
    day: Optional[int] = Query(None, description="Lead day alias (1 to 10)"),
) -> Dict[str, Any]:
    """
    SIH Feature 5 Endpoint:
    Returns SHAP-equivalent meteorological feature contributions (Pressure Drop, Rainfall Gradient,
    Wind Shear, Forecast Drift, etc.), natural language summary, and operational recommendations.
    """
    final_day = day if day is not None and not hasattr(day, "default") else lead_day
    clean_loc = str(location) if location and not hasattr(location, "default") else "Vijayawada"
    return get_shap_explainability_detail(location=clean_loc, lead_day=final_day)


@router.get("/why-chain", summary="Get AI Why-Chain Meteorological Reasoning Flow (SIH Differentiator 2)")
def api_explain_why_chain(
    location: str = Query("Vijayawada", description="City or district name"),
    lead_day: int = Query(6, description="Lead day (1 to 10)"),
) -> Dict[str, Any]:
    """
    SIH Differentiator 2 Endpoint:
    Returns multi-level meteorological causal reasoning chain beyond SHAP,
    tracing Atmospheric Trigger -> Moisture Dynamics -> Kinematic Shear ->
    Convective Instability -> NWP Drift -> Calibrated Confidence Score.
    """
    from backend.services.why_chain_service import generate_meteorological_why_chain
    clean_loc = str(location) if location and not hasattr(location, "default") else "Vijayawada"
    final_day = max(1, min(10, int(lead_day)))
    return generate_meteorological_why_chain(location=clean_loc, lead_day=final_day)
