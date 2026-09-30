"""
WeatherTrust AI — Stakeholder Workspace API Router
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
SIH Problem ID: 26079

Exposes role-based operational endpoints for 5 stakeholder portals:
- Forecaster (IMD / MoES)
- Disaster Management Authority
- Agriculture Department
- Public Citizen
- Administrator
"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Query, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from backend.services.stakeholder_service import (
    get_all_stakeholder_states,
    get_stakeholder_districts_by_state,
    get_forecaster_portal_data,
    get_disaster_portal_data,
    get_agriculture_portal_data,
    get_public_portal_data,
    get_admin_portal_data,
    retrain_model_pipeline,
    process_dataset_upload,
    create_system_backup_snapshot,
    OPERATIONAL_LOGS,
    MOCK_USERS,
)
from backend.services.resource_optimization_service import get_resource_optimization_plan
from backend.models.stakeholder_model import (
    ModelRetrainRequest,
    ModelRetrainResponse,
    DatasetUploadResponse,
)

router = APIRouter(prefix="/api/stakeholder", tags=["Stakeholder Workspace"])


def _stakeholder_error(role: str, location: Optional[str], err: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "error": True,
            "status": "error",
            "message": f"Stakeholder {role} portal error: {str(err)}",
            "detail": str(err),
            "role": role,
            "location": location or "Unknown",
        },
    )


@router.get("/states", summary="Get All Indian States and UTs Directory for Stakeholders")
def api_get_states() -> List[Dict[str, Any]]:
    """Returns directory of all 36 Indian states and Union Territories with official district counts."""
    return get_all_stakeholder_states()


@router.get("/districts", summary="Get Districts for Selected State")
def api_get_districts(
    state: str = Query("Andhra Pradesh", description="Target Indian state name or code")
) -> List[Dict[str, Any]]:
    """Returns the list of districts and coordinates belonging to the requested Indian state."""
    return get_stakeholder_districts_by_state(state)


@router.get("/overview", summary="Unified Stakeholder Workspace Overview")
def get_stakeholder_overview(
    role: str = Query("forecaster", description="Target role: forecaster, disaster, agriculture, public, admin"),
    location: Optional[str] = Query(None, description="City, district, or place name"),
    state: Optional[str] = Query(None, description="Optional target state"),
    district: Optional[str] = Query(None, description="Optional target district"),
    lead_day: int = Query(6, ge=1, le=10, description="Lead day (1 to 10)"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude"),
) -> Any:
    """
    Returns role-tailored operational data payload for the requested role and location.
    All portals draw from the same shared weather database and calibrated ML models.
    """
    role_clean = role.lower().strip()
    try:
        if role_clean == "disaster":
            return {"role": "disaster", "data": get_disaster_portal_data(location=location, state=state, district=district, focus_lead_day=lead_day, lat=lat, lon=lon)}
        elif role_clean == "agriculture":
            return {"role": "agriculture", "data": get_agriculture_portal_data(location=location, state=state, district=district, focus_lead_day=lead_day, lat=lat, lon=lon)}
        elif role_clean == "public":
            return {"role": "public", "data": get_public_portal_data(location=location, state=state, district=district, lat=lat, lon=lon)}
        elif role_clean == "admin":
            return {"role": "admin", "data": get_admin_portal_data()}
        else:
            return {"role": "forecaster", "data": get_forecaster_portal_data(location=location, state=state, district=district, focus_lead_day=lead_day, lat=lat, lon=lon)}
    except Exception as e:
        return _stakeholder_error(role_clean, location or district or state, e)


@router.get("/forecaster", summary="Forecaster (IMD / MoES) Portal Operational Data")
def api_forecaster_portal(
    location: Optional[str] = Query(None, description="City or district name"),
    state: Optional[str] = Query(None, description="Optional state name"),
    district: Optional[str] = Query(None, description="Optional district name"),
    lead_day: int = Query(6, ge=1, le=10, description="Lead day (1 to 10)"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude"),
) -> Any:
    """Operational weather forecasting, bust probability, SHAP, and ensemble consensus."""
    try:
        return get_forecaster_portal_data(location=location, state=state, district=district, focus_lead_day=lead_day, lat=lat, lon=lon)
    except Exception as e:
        return _stakeholder_error("forecaster", location or district or state, e)


@router.get("/disaster", summary="Disaster Management Authority Portal Operational Data")
def api_disaster_portal(
    location: Optional[str] = Query(None, description="City or district name"),
    state: Optional[str] = Query(None, description="Optional state name"),
    district: Optional[str] = Query(None, description="Optional district name"),
    lead_day: int = Query(6, ge=1, le=10, description="Lead day (1 to 10)"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude"),
) -> Any:
    """Emergency planning, flood and cyclone risk, 72h impact timeline, evacuation support."""
    try:
        return get_disaster_portal_data(location=location, state=state, district=district, focus_lead_day=lead_day, lat=lat, lon=lon)
    except Exception as e:
        return _stakeholder_error("disaster", location or district or state, e)


@router.get("/agriculture", summary="Agriculture Department Portal Operational Data")
def api_agriculture_portal(
    location: Optional[str] = Query(None, description="City or district name"),
    state: Optional[str] = Query(None, description="Optional state name"),
    district: Optional[str] = Query(None, description="Optional district name"),
    lead_day: int = Query(6, ge=1, le=10, description="Lead day (1 to 10)"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude"),
) -> Any:
    """Agro-meteorological decision support, soil moisture, crop stress, and sowing advisories."""
    try:
        return get_agriculture_portal_data(location=location, state=state, district=district, focus_lead_day=lead_day, lat=lat, lon=lon)
    except Exception as e:
        return _stakeholder_error("agriculture", location or district or state, e)


@router.get("/agriculture/map", summary="Agriculture Agro-Meteorological Map Data")
def api_agriculture_map(
    location: Optional[str] = Query(None, description="City or district name"),
    state: Optional[str] = Query(None, description="Optional state name"),
    district: Optional[str] = Query(None, description="Optional district name"),
    lead_day: int = Query(6, ge=1, le=10, description="Lead day (1 to 10)"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude"),
) -> Dict[str, Any]:
    """Provides district-level agro-meteorological map data, soil moisture, and crop suitability."""
    try:
        portal_data = get_agriculture_portal_data(location=location, state=state, district=district, focus_lead_day=lead_day, lat=lat, lon=lon)
        return {
            "status": "success",
            "role": "agriculture",
            "location": location or district or state or "Krishna District",
            "lead_day": lead_day,
            "map_data": portal_data.get("agro_map_data", []),
            "kpis": {
                "reliable_districts": portal_data.get("reliable_rainfall_districts_count", 0),
                "crop_risk_level": portal_data.get("crop_risk_level", "Moderate"),
                "irrigation_need": portal_data.get("irrigation_need", "Postpone"),
                "rainfall_reliability": portal_data.get("rainfall_reliability_score", 75),
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "map_data": []}


@router.get("/disaster/map", summary="Disaster Management Flood Risk Map Data")
def api_disaster_map(
    location: Optional[str] = Query(None, description="City or district name"),
    state: Optional[str] = Query(None, description="Optional state name"),
    district: Optional[str] = Query(None, description="Optional district name"),
    lead_day: int = Query(6, ge=1, le=10, description="Lead day (1 to 10)"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude"),
) -> Dict[str, Any]:
    """Provides district-level inundation, flood risk, and 72h accumulation map data."""
    try:
        portal_data = get_disaster_portal_data(location=location, state=state, district=district, focus_lead_day=lead_day, lat=lat, lon=lon)
        return {
            "status": "success",
            "role": "disaster",
            "location": location or district or state or "Krishna District",
            "lead_day": lead_day,
            "map_data": portal_data.get("flood_risk_map_data", []),
            "kpis": {
                "red_alerts": portal_data.get("red_alert_districts_count", 0),
                "population_at_risk": portal_data.get("population_at_risk_total", 0),
                "critical_zones": portal_data.get("critical_rainfall_zones_count", 0),
                "active_systems": portal_data.get("active_weather_systems_count", 1),
            }
        }
    except Exception as e:
        return {"status": "error", "message": str(e), "map_data": []}


@router.get("/public", summary="Public Citizen Portal Weather & Reliability Data")
def api_public_portal(
    location: Optional[str] = Query(None, description="City or district name"),
    state: Optional[str] = Query(None, description="Optional state name"),
    district: Optional[str] = Query(None, description="Optional district name"),
    lat: Optional[float] = Query(None, description="Optional latitude"),
    lon: Optional[float] = Query(None, description="Optional longitude"),
) -> Any:
    """Citizen-friendly plain-language weather dashboard, safety checklist, and shareable card."""
    try:
        return get_public_portal_data(location=location, state=state, district=district, lat=lat, lon=lon)
    except Exception as e:
        return _stakeholder_error("public", location or district or state, e)


@router.get("/admin", summary="Administrator Portal System Diagnostics & Controls")
def api_admin_portal() -> Any:
    """System health telemetry, API response monitoring, server logs, and accuracy analytics."""
    try:
        return get_admin_portal_data()
    except Exception as e:
        return _stakeholder_error("admin", "System", e)


@router.get("/users", summary="Get Stakeholder Users and Roles")
def api_get_users() -> Dict[str, Any]:
    """Returns list of active stakeholder users, permissions, and roles."""
    return {"users": MOCK_USERS}


@router.post("/admin/retrain", summary="Trigger Model Retraining Pipeline")
def api_retrain_model(request: ModelRetrainRequest) -> Dict[str, Any]:
    """Triggers ML model bundle retraining with hyperparameter tuning and calibration."""
    return retrain_model_pipeline(
        n_estimators=request.n_estimators,
        learning_rate=request.learning_rate,
        calibration_method=request.calibration_method,
    )


class DatasetUploadRequest(BaseModel):
    filename: str
    content: str


@router.post("/admin/upload-dataset", summary="Upload Historical Dataset for Retraining")
def api_upload_dataset(request: DatasetUploadRequest) -> Dict[str, Any]:
    """Processes historical forecast verification CSV/JSON dataset for model training."""
    return process_dataset_upload(filename=request.filename, content_str=request.content)


@router.get("/admin/logs", summary="Get Operational Audit Logs")
def api_get_logs() -> Dict[str, Any]:
    """Returns immutable operational audit log stream."""
    return {"logs": OPERATIONAL_LOGS}


@router.post("/admin/backup", summary="Take System Backup Snapshot")
def api_admin_backup() -> Dict[str, Any]:
    """Creates operational system state and model weights backup snapshot."""
    return create_system_backup_snapshot()


@router.get("/resource-optimization", summary="Resource Optimization AI Plan")
def api_resource_optimization(
    location: str = Query("Vijayawada", description="Target district or place"),
    lead_day: int = Query(6, ge=1, le=10, description="Forecast lead day (1 to 10)"),
) -> Dict[str, Any]:
    """Dynamic resource allocation recommendations: NDRF staging, Relief Camps, Reservoirs, and Pumps."""
    return get_resource_optimization_plan(location=location, lead_day=lead_day)
