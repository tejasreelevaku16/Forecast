"""
WeatherTrust AI — Multi-Agent Weather Intelligence API Routes (SIH Differentiator 6)
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)

Coordinates 5 autonomous specialized agents:
1. Forecast Agent (Numerical Dynamics)
2. Reliability Agent (Statistical ML)
3. Disaster Agent (Civil Protection)
4. Agriculture Agent (Agro-Met Impact)
5. Explanation Agent (Atmospheric Why-Chain)
"""

from typing import Dict, Any
from fastapi import APIRouter, Query
from backend.services.multi_agent_service import get_multi_agent_collaborative_intelligence

router = APIRouter(prefix="/api/intelligence", tags=["Multi-Agent Weather Intelligence"])


@router.get("/multi-agent", summary="Get Collaborative Multi-Agent Weather Intelligence (SIH Differentiator 6)")
def api_multi_agent_intelligence(
    location: str = Query("Vijayawada", description="District or location name"),
    lead_day: int = Query(6, description="Lead forecast day (1 to 10)"),
) -> Dict[str, Any]:
    """
    SIH Differentiator 6 Endpoint:
    Returns independent analyses from 5 AI agents (Forecast, Reliability, Disaster,
    Agriculture, and Explanation) along with Collaborative Consensus Score and Joint Operational Directives.
    """
    clean_loc = str(location) if location and not hasattr(location, "default") else "Vijayawada"
    day = max(1, min(10, int(lead_day)))
    return get_multi_agent_collaborative_intelligence(location=clean_loc, lead_day=day)
