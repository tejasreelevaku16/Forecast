"""
Interactive India Map API Routes
Exposes district-level live weather tracking and ML reliability data across India.
"""

from typing import List, Dict, Any
from fastapi import APIRouter, Query
from backend.services.india_map_service import (
    get_all_india_reliability_map,
    get_all_india_states_map,
    get_states_reliability_dict,
    INDIAN_DISTRICTS,
    INDIAN_STATES,
)

router = APIRouter(tags=["Interactive India Map"])


@router.get("/api/map-data", summary="Get All India States Forecast Reliability (User Requested)")
def get_map_data() -> List[Dict[str, Any]]:
    """
    Returns state-level ML-predicted Forecast Trust, Bust Risk, and Drift metrics
    for all Indian states and Union Territories.
    """
    return get_all_india_states_map()


@router.get("/api/map/states", summary="Get Indian States Reliability Dictionary")
def get_map_states_dict() -> Dict[str, Any]:
    """Returns state reliability data dictionary keyed by state name for instant O(1) map lookups."""
    return get_states_reliability_dict()


@router.get("/api/map/india-reliability", summary="Get District-Level India Reliability & Weather")
def india_reliability_map(
    risk_filter: str = Query("ALL", description="Filter by risk level: ALL, HIGH, MODERATE, LOW")
) -> List[Dict[str, Any]]:
    """
    Returns live weather observations and ML-predicted Forecast Trust & Bust Risk
    for 30+ major Indian districts across all regions.
    """
    all_districts = get_all_india_reliability_map()
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
            "state": d["state"],
            "lat": d["lat"],
            "lon": d["lon"],
            "zone": d["zone"]
        }
        for d in INDIAN_DISTRICTS
    ]

