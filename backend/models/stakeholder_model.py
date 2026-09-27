"""
WeatherTrust AI — Stakeholder Workspace Pydantic Models
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
SIH Problem ID: 26079

Defines structured response models for five role-based portals:
1. Forecaster (IMD / MoES)
2. Disaster Management Authority
3. Agriculture Department
4. Public Citizen
5. Administrator
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


# =============================================================================
# RBAC & USER MANAGEMENT
# =============================================================================
class StakeholderUser(BaseModel):
    user_id: str
    name: str
    email: str
    role: str  # forecaster, disaster, agriculture, public, admin
    role_display: str
    agency: str
    permissions: List[str]
    last_active: str
    status: str = "Active"


# =============================================================================
# 1. FORECASTER PORTAL MODELS
# =============================================================================
class EnsembleModelPrediction(BaseModel):
    model_name: str  # ECMWF, GFS, IMD NCUM, AI Calibrated
    rainfall_mm: float
    temperature_c: float
    wind_kmh: float
    confidence_pct: int
    bias_correction_mm: float
    status: str


class UncertaintyCell(BaseModel):
    parameter: str
    lead_day: int
    uncertainty_level: str  # LOW, MODERATE, HIGH, EXTREME
    uncertainty_score: int  # 0 to 100
    spread_value: float
    unit: str


class ForecasterPortalData(BaseModel):
    location: str
    state: str
    focus_lead_day: int
    forecast_confidence_pct: int
    bust_probability_pct: int
    risk_level: str
    forecast_stability: str
    reliable_districts_count: int
    reliable_districts_pct: float
    high_uncertainty_districts_count: int
    model_vs_ai: Dict[str, Any]
    ensemble_consensus: List[EnsembleModelPrediction]
    ensemble_spread_mm: float
    forecast_drift: Dict[str, Any]
    shap_explainability: List[Dict[str, Any]]
    confidence_trend: List[Dict[str, Any]]
    uncertainty_heatmap: List[UncertaintyCell]
    data_quality: Dict[str, Any]
    historical_error_analytics: Dict[str, Any]
    operational_briefing: Dict[str, Any]
    last_updated: str


# =============================================================================
# 2. DISASTER MANAGEMENT PORTAL MODELS
# =============================================================================
class HighRiskDistrict(BaseModel):
    district_id: str
    name: str
    state: str
    risk_level: str
    color: str
    lead_day: int
    expected_rainfall_mm: float
    wind_speed_kmh: float
    bust_risk_pct: int
    population_at_risk: int
    alert_level: str  # RED, ORANGE, YELLOW, GREEN
    priority_score: float
    key_threat: str


class ImpactPhase72h(BaseModel):
    phase: str  # 0-24 Hours, 24-48 Hours, 48-72 Hours
    label: str
    rainfall_mm: float
    max_wind_kmh: float
    hazard_type: str
    severity: str
    recommended_action: str


class ResourceSuggestion(BaseModel):
    resource_type: str
    quantity: str
    target_zone: str
    readiness_status: str
    urgency: str  # IMMEDIATE, STANDBY, MONITOR


class DisasterPortalData(BaseModel):
    location: str
    state: str
    focus_lead_day: int
    red_alert_districts_count: int
    orange_alert_districts_count: int
    population_at_risk_total: int
    critical_rainfall_zones_count: int
    active_weather_systems_count: int
    active_weather_systems: List[Dict[str, Any]]
    high_risk_districts: List[HighRiskDistrict]
    flood_risk_map_data: List[Dict[str, Any]]
    cyclone_risk_monitor: Dict[str, Any]
    heatwave_risk_monitor: Dict[str, Any]
    active_bulletins: List[Dict[str, Any]]
    impact_timeline_72h: List[ImpactPhase72h]
    resource_allocations: List[ResourceSuggestion]
    evacuation_decision: Dict[str, Any]
    emergency_sitrep: Dict[str, Any]
    last_updated: str


# =============================================================================
# 3. AGRICULTURE PORTAL MODELS
# =============================================================================
class CropImpactInfo(BaseModel):
    crop_name: str
    season: str
    stage: str
    vulnerability: str
    threat_description: str
    advisory: str


class WeeklyAgroOutlookDay(BaseModel):
    day_name: str
    date_str: str
    lead_day: int
    expected_rain_mm: float
    rain_probability_pct: int
    max_temp_c: float
    soil_moisture_pct: int
    sowing_status: str
    spraying_status: str
    irrigation_advice: str


class AgriculturePortalData(BaseModel):
    location: str
    state: str
    focus_lead_day: int
    rainfall_reliability_score: int
    crop_risk_level: str
    irrigation_need: str
    weekly_rainfall_confidence_pct: int
    reliable_rainfall_districts_count: int
    soil_moisture_pct: int
    soil_moisture_status: str
    sowing_advisory: Dict[str, Any]
    irrigation_recommendation: Dict[str, Any]
    crop_stress_indicators: Dict[str, Any]
    heatwave_crop_warning: Dict[str, Any]
    heavy_rain_crop_warning: Dict[str, Any]
    water_availability: Dict[str, Any]
    crop_impacts: List[CropImpactInfo]
    weekly_outlook: List[WeeklyAgroOutlookDay]
    last_updated: str


# =============================================================================
# 4. PUBLIC PORTAL MODELS
# =============================================================================
class PublicForecastDay(BaseModel):
    day_name: str
    date_str: str
    condition: str
    icon: str
    temp_max: float
    temp_min: float
    rain_chance_pct: int
    confidence_label: str
    confidence_pct: int
    safety_summary: str


class PublicPortalData(BaseModel):
    location: str
    state: str
    current_temperature_c: float
    feels_like_c: float
    weather_condition: str
    weather_icon: str
    rain_probability_pct: int
    confidence_score_pct: int
    confidence_tier: str  # High Confidence, Moderate, Plan Ahead
    alert_status: str
    alert_color: str
    alert_message: str
    comfort_index: str
    humidity_pct: int
    wind_kmh: float
    wind_direction: str
    uv_index: float
    uv_level: str
    aqi_estimate: int
    aqi_label: str
    confidence_meter: Dict[str, Any]
    rainfall_timeline: List[Dict[str, Any]]
    temperature_timeline: List[Dict[str, Any]]
    forecast_10_day: List[PublicForecastDay]
    safety_recommendations: List[Dict[str, Any]]
    shareable_card: Dict[str, Any]
    last_updated: str


# =============================================================================
# 5. ADMINISTRATOR PORTAL MODELS
# =============================================================================
class ApiEndpointMetric(BaseModel):
    endpoint: str
    method: str
    requests_per_min: int
    avg_latency_ms: float
    p95_latency_ms: float
    error_rate_pct: float
    cache_hit_pct: float


class ServerLogEntry(BaseModel):
    timestamp: str
    level: str  # INFO, WARNING, ERROR, DEBUG
    service: str
    message: str


class AdminPortalData(BaseModel):
    active_users_count: int
    api_response_time_ms: float
    model_accuracy_pct: float
    system_health_pct: float
    uptime_hours: float
    users: List[StakeholderUser]
    api_metrics: List[ApiEndpointMetric]
    system_health: Dict[str, Any]
    data_quality_validation: Dict[str, Any]
    forecast_accuracy_analytics: Dict[str, Any]
    recent_logs: List[ServerLogEntry]
    model_status: Dict[str, Any]
    backup_status: Dict[str, Any]
    last_updated: str


# =============================================================================
# RETRAIN & DATASET REQUEST / RESPONSE
# =============================================================================
class ModelRetrainRequest(BaseModel):
    n_estimators: int = 150
    learning_rate: float = 0.05
    calibration_method: str = "sigmoid"  # sigmoid or isotonic
    epochs: int = 25


class ModelRetrainResponse(BaseModel):
    status: str
    message: str
    previous_accuracy: float
    new_accuracy: float
    roc_auc: float
    brier_score: float
    training_duration_sec: float
    retrained_at: str


class DatasetUploadResponse(BaseModel):
    status: str
    filename: str
    records_processed: int
    valid_records: int
    invalid_records: int
    columns_detected: List[str]
    summary: Dict[str, Any]
