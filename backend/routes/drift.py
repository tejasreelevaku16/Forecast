"""
Forecast Drift API Routes (Phase 11)
Endpoints for tracking run-to-run changes, model stability, and cycle history.
"""

from typing import Optional
from fastapi import APIRouter, Query
from backend.services.drift_service import (
    calculate_drift_metrics,
    get_drift_history,
    get_location_drift_summary,
)

router = APIRouter(prefix="/api/drift", tags=["Forecast Drift Monitor"])


@router.get("/compare", summary="Compare Successive Forecast Runs")
def compare_runs(
    variable: str = Query("Rainfall", description="Weather parameter (Rainfall or Temperature)"),
    previous: float = Query(25.0, description="Previous run value"),
    current: float = Query(80.0, description="Latest run value"),
    unit: str = Query("mm", description="Measurement unit (mm or °C)"),
    lead_day: int = Query(6, description="Target forecast lead day"),
):
    """Calculates run-to-run drift, percentage shift, and stability level."""
    return calculate_drift_metrics(variable, previous, current, unit, lead_day)


@router.get("/history", summary="Get Multi-Cycle NWP Run History")
def drift_history(
    location: str = Query("Krishna District", description="Location name"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude"),
):
    """Returns 4-cycle historical run progression for the target date, strictly isolated by location coordinates."""
    clean_lat = lat if lat is not None and not hasattr(lat, "default") else None
    clean_lon = lon if lon is not None and not hasattr(lon, "default") else None
    cycles = get_drift_history(location=location, lat=clean_lat, lon=clean_lon)
    return {
        "location": location,
        "latitude": clean_lat,
        "longitude": clean_lon,
        "cycles": cycles,
    }


@router.get("/summary", summary="Get Location-Specific Drift Summary")
def drift_summary(
    location: str = Query("Krishna District", description="Location name"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude"),
):
    """Returns location-specific drift summary comparing previous and latest forecast runs."""
    clean_lat = lat if lat is not None and not hasattr(lat, "default") else None
    clean_lon = lon if lon is not None and not hasattr(lon, "default") else None
    return get_location_drift_summary(location=location, lat=clean_lat, lon=clean_lon)
