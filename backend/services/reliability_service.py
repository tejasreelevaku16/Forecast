"""
Reliability Service (Phase 1)
Supplies sample Forecast Trust metrics, bust probability distributions,
explainability factors, and actionable recommendations.

IMPORTANT:
All data returned by this service in Phase 1 is clearly flagged as DEMO / SAMPLE DATA.
No mock calculations are represented as trained AI models until real datasets
and ML pipelines are developed in Phases 5-7.
"""

from datetime import datetime, timedelta
from typing import List
from config import OFFICIAL_DISCLAIMER
from backend.models.reliability_model import (
    ReliabilityOverview,
    ExplainabilityFactor,
    ForecastDriftSnapshot,
    LeadDayReliability,
)


def get_forecast_reliability_overview(location: str = "Krishna District") -> ReliabilityOverview:
    """
    Returns the Forecast Trust profile for the requested location.
    In Phase 1, returns the benchmark scenario specified for Krishna District, Andhra Pradesh.
    """
    base_time = datetime.now()
    
    # 10 Lead Days Progression as described in project specifications
    lead_day_definitions = [
        (1, 88, 12, "LOW", "HIGH", "Stable short-range consensus"),
        (2, 82, 18, "LOW", "HIGH", "High ensemble agreement"),
        (3, 69, 31, "MODERATE", "MODERATE", "Minor moisture boundary variance"),
        (4, 55, 45, "MODERATE", "MODERATE", "Model track divergence begins"),
        (5, 29, 71, "HIGH", "LOW", "Significant rainfall volume drift (+30mm)"),
        (6, 24, 76, "HIGH", "LOW", "Severe forecast drift (+55mm) & historical Day-6 error"),
        (7, 19, 81, "HIGH", "LOW", "High atmospheric chaos across ensemble members"),
        (8, 16, 84, "HIGH", "LOW", "Convective trigger uncertainty"),
        (9, 12, 88, "HIGH", "LOW", "Long-range deterministic limit reached"),
        (10, 9, 91, "HIGH", "LOW", "Climatological baseline uncertainty"),
    ]
    
    lead_days: List[LeadDayReliability] = []
    for day_idx, rel_score, bust_prob, risk, stab, driver in lead_day_definitions:
        target_date = base_time + timedelta(days=day_idx)
        day_label = "Tomorrow" if day_idx == 1 else target_date.strftime("%a")
        date_str = target_date.strftime("%b %d")
        
        lead_days.append(
            LeadDayReliability(
                lead_day=day_idx,
                day_name=f"Day {day_idx} ({day_label})",
                date=date_str,
                reliability_score=rel_score,
                bust_probability_pct=bust_prob,
                risk_level=risk,
                stability=stab,
                primary_risk_driver=driver,
            )
        )
        
    # Explainable reasons for Day-6 low confidence
    reasons = [
        ExplainabilityFactor(
            id="reason-1",
            icon_type="error",
            title="Historical forecast error is high",
            description="Similar Day-6 forecasts for this region historically exhibited mean absolute errors exceeding 45mm.",
            severity="high",
        ),
        ExplainabilityFactor(
            id="reason-2",
            icon_type="drift",
            title="Forecast changed significantly (Drift)",
            description="The predicted 24h rainfall jumped from 25 mm to 80 mm (+55 mm) between the last two model cycles.",
            severity="high",
        ),
        ExplainabilityFactor(
            id="reason-3",
            icon_type="variability",
            title="Regional variability is high",
            description="Similar historical atmospheric conditions along coastal Andhra produced divergent, localized rainbands.",
            severity="moderate",
        ),
    ]
    
    # Forecast Drift Snapshot
    drift = ForecastDriftSnapshot(
        target_lead_day=6,
        variable_name="24h Cumulative Rainfall",
        previous_run_value=25.0,
        latest_run_value=80.0,
        unit="mm",
        absolute_change=55.0,
        stability_level="LOW",
    )
    
    return ReliabilityOverview(
        location=location or "Krishna District, Andhra Pradesh",
        focus_lead_day=6,
        reliability_score=24,
        confidence_label="LOW CONFIDENCE",
        bust_probability_pct=76,
        risk_level="HIGH",
        forecast_stability="LOW",
        reasons=reasons,
        drift_monitor=drift,
        recommendation="Do not make important decisions based only on this forecast. Check the next forecast update.",
        lead_days=lead_days,
        is_demo=True,
        demo_badge_text="DEMO DATA — AI reliability model will be integrated later.",
        disclaimer=OFFICIAL_DISCLAIMER,
    )
