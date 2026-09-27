"""
Indian Geographic Location Hierarchy Routes
Exposes hierarchical endpoints for States, Places, Coordinates, and Location Search across India.
"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, HTTPException
from backend.services.location_service import (
    get_all_states,
    get_places_by_state,
    search_indian_locations,
    get_location_by_place_and_state,
    get_full_hierarchy,
)

router = APIRouter(prefix="/api/locations", tags=["Indian Locations Hierarchy"])


@router.get("/states", summary="Get All Indian States and Union Territories")
def list_states() -> List[Dict[str, Any]]:
    """Returns all 36 Indian States and Union Territories with state codes and place counts."""
    return get_all_states()


@router.get("/places", summary="Get Places for a Selected State")
def list_places(state: str = Query(..., description="Indian State or Union Territory name")) -> List[Dict[str, Any]]:
    """
    Returns only the places/cities belonging to the selected State/UT.
    Prevents cross-state place contamination (e.g. AP places never show for Karnataka).
    """
    places = get_places_by_state(state)
    return places


@router.get("/search", summary="Search Indian Locations by Place, District, or State")
def search_locations_api(
    q: str = Query(..., min_length=1, description="Place or city search query"),
    limit: int = Query(15, ge=1, le=50, description="Max results")
) -> List[Dict[str, Any]]:
    """
    Searches across Indian locations and returns disambiguated results with State and District.
    """
    return search_indian_locations(q, limit=limit)


@router.get("/resolve", summary="Resolve Coordinates and Metadata for Place and State")
def resolve_location(
    place: str = Query(..., description="Place name (e.g. Vijayawada)"),
    state: Optional[str] = Query(None, description="Optional state name to disambiguate")
) -> Dict[str, Any]:
    """
    Resolves authentic latitude, longitude, district, state code, and country for a location.
    """
    loc = get_location_by_place_and_state(place, state)
    if not loc:
        raise HTTPException(status_code=404, detail=f"Location '{place}' not found in Indian directory")
    return loc


@router.get("/hierarchy", summary="Get Complete Indian States and Places Hierarchy")
def full_hierarchy() -> Dict[str, List[Dict[str, Any]]]:
    """Returns the complete hierarchical mapping of states to places for instant frontend caching."""
    return get_full_hierarchy()
