"""
Pydantic models for the WeatherTrust AI Forecast Trust Layer.
Includes trust scores, bust probability, lead-day risk matrix,
explainability factors, forecast drift metrics, and demo disclaimers.
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class ExplainabilityFactor(BaseModel):
    id: str
    icon_type: str = Field(description="error, drift, or variability")
    title: str
    description: str
    severity: str = Field(description="high, moderate, or low")


class ForecastDriftSnapshot(BaseModel):
    target_lead_day: int
    variable_name: str
    previous_run_value: float
    latest_run_value: float
    unit: str
    absolute_change: float
    stability_level: str = Field(description="HIGH, MODERATE, or LOW")


class LeadDayReliability(BaseModel):
    lead_day: int
    day_name: str
    date: str
    reliability_score: int = Field(ge=0, le=100)
    bust_probability_pct: int = Field(ge=0, le=100)
    risk_level: str = Field(description="LOW, MODERATE, or HIGH")
    stability: str = Field(description="HIGH, MODERATE, or LOW")
    primary_risk_driver: str


class ReliabilityOverview(BaseModel):
    location: str
    focus_lead_day: int = Field(default=6, description="Lead day highlighted on the trust card")
    reliability_score: int = Field(ge=0, le=100)
    confidence_label: str = Field(description="HIGH CONFIDENCE, MODERATE CONFIDENCE, or LOW CONFIDENCE")
    bust_probability_pct: int = Field(ge=0, le=100)
    risk_level: str = Field(description="LOW, MODERATE, or HIGH")
    forecast_stability: str = Field(description="HIGH, MODERATE, or LOW")
    
    # Explainable "Why?" bullets
    reasons: List[ExplainabilityFactor]
    
    # Forecast Drift summary
    drift_monitor: ForecastDriftSnapshot
    
    # Action recommendation
    recommendation: str
    
    # 10-Day progression
    lead_days: List[LeadDayReliability]
    
    # Transparency & Disclaimers
    is_demo: bool = True
    demo_badge_text: str = "DEMO / SAMPLE SIMULATION"
    disclaimer: str
