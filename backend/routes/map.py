"""
Interactive India Map API Routes (SIH Problem ID: 26079)
Exposes district-level and state-level live weather tracking and ML reliability data across India.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Query
from backend.services.india_map_service import (
    get_all_india_reliability_map,
    get_all_india_states_map,
    get_states_reliability_dict,
    get_map_confidence,
    INDIAN_DISTRICTS,
    INDIAN_STATES,
)

router = APIRouter(tags=["Interactive India Map"])


@router.get("/api/map/confidence", summary="Get Forecast Confidence for Location and Lead Day (SIH Feature 1)")
def api_map_confidence(
    location: str = Query("Vijayawada", description="City or district name"),
    day: int = Query(1, description="Lead day (1 to 10)"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude"),
) -> Dict[str, Any]:
    """
    SIH Feature 1 Endpoint:
    Fetches live weather, computes features, runs calibrated ML model, and returns
    Forecast Confidence, Bust Probability, and real meteorological parameters.
    """
    return get_map_confidence(location=location, day=day, lat=lat, lon=lon)


@router.get("/api/map-data", summary="Get All India States Forecast Reliability")
def get_map_data(day: int = Query(1, description="Lead day (1 to 10)")) -> List[Dict[str, Any]]:
    """
    Returns state-level ML-predicted Forecast Trust, Bust Risk, and Drift metrics
    for all Indian states and Union Territories.
    """
    return get_all_india_states_map(day=day)


@router.get("/api/map/states", summary="Get Indian States Reliability Dictionary")
def get_map_states_dict(day: int = Query(1, description="Lead day (1 to 10)")) -> Dict[str, Any]:
    """Returns state reliability data dictionary keyed by state name for instant O(1) map lookups."""
    return get_states_reliability_dict(day=day)


@router.get("/api/map/india-reliability", summary="Get District-Level India Reliability & Weather")
def india_reliability_map(
    day: int = Query(1, description="Lead day (1 to 10)"),
    risk_filter: str = Query("ALL", description="Filter by risk level: ALL, HIGH, MODERATE, LOW")
) -> List[Dict[str, Any]]:
    """
    Returns live weather observations and ML-predicted Forecast Trust & Bust Risk
    for 30+ major Indian districts across all regions.
    """
    all_districts = get_all_india_reliability_map(day=day)
    filter_upper = (risk_filter or "ALL").upper().strip()

    if filter_upper in ["HIGH", "MODERATE", "LOW"]:
        return [d for d in all_districts if d["reliability"]["risk_level"] == filter_upper]

    return all_districts


@router.get("/api/map/districts", summary="Get Indian Districts Directory")
def district_directory():
    """Returns directory of supported Indian districts for autocomplete search."""
    return [
        {
            "id": d["id"],
            "name": d["name"],
            "city": d.get("city", d["name"]),
            "state": d["state"],
            "lat": d["lat"],
            "lon": d["lon"],
            "zone": d["zone"]
        }
        for d in INDIAN_DISTRICTS
    ]
