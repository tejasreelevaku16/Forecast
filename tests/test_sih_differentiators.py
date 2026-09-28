"""
WeatherTrust AI — SIH Differentiator Features Test Suite
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)

Validates all 6 SIH Differentiators:
1. Forecast Confidence Digital Twin (10-Day Synoptic Replay)
2. AI Why-Chain Meteorological Reasoning Engine
3. Real-Time Decision Simulator (What-If Sandbox)
4. District Reliability Passport
5. Resource Optimization AI
6. Multi-Agent Weather Intelligence
"""

import sys
from pathlib import Path
import pytest

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_differentiator_1_digital_twin():
    """Verify Forecast Confidence Digital Twin 10-day replay and comparative analytics."""
    resp = client.get("/api/weather/digital-twin?location=Vijayawada")
    assert resp.status_code == 200, f"Digital twin failed with {resp.status_code}"
    data = resp.json()
    assert data["status"] == "success"
    assert data["district"] == "Vijayawada"
    assert "days" in data and len(data["days"]) == 10
    assert "chart_series" in data

    # Verify first and last day progression
    day_10 = data["days"][0]
    assert day_10["lead_day"] == 10
    assert "forecast" in day_10 and "actual_simulated" in day_10
    assert "error_delta" in day_10
    assert "ai_confidence_pct" in day_10 and "bust_probability_pct" in day_10
    assert "animation_cues" in day_10
    assert "synoptic_narrative" in day_10

    # Verification: Lead Day 10 uncertainty is higher than Day 1
    day_1 = data["days"][-1]
    assert day_1["lead_day"] == 1
    assert day_1["ai_confidence_pct"] >= day_10["ai_confidence_pct"]


def test_differentiator_2_why_chain_engine():
    """Verify AI Why-Chain Meteorological Causal Reasoning Engine beyond SHAP."""
    resp = client.get("/api/explain/why-chain?location=Vijayawada&lead_day=6")
    assert resp.status_code == 200, f"Why-chain failed with {resp.status_code}"
    data = resp.json()
    assert data["status"] == "success"
    assert "nodes" in data and len(data["nodes"]) == 6
    assert "reasoning_summary" in data
    assert "Pressure" in data["reasoning_summary"] or "deficit" in data["reasoning_summary"]

    # Verify node hierarchy levels
    levels = [n["hierarchy_level"] for n in data["nodes"]]
    assert "Atmospheric Trigger" in levels
    assert "Moisture Dynamics" in levels
    assert "Kinematic Convergence" in levels
    assert "Operational Calibration" in levels

    for node in data["nodes"]:
        assert "factor_name" in node
        assert "observation" in node
        assert "confidence_impact_pct" in node
        assert "cumulative_confidence_pct" in node
        assert "explanation" in node


def test_differentiator_3_decision_simulator():
    """Verify Real-Time Decision Simulator presets and custom what-if runs."""
    # 1. Presets endpoint
    presets_resp = client.get("/api/simulator/presets")
    assert presets_resp.status_code == 200
    presets_data = presets_resp.json()
    assert "presets" in presets_data
    assert "monsoon_cloudburst" in presets_data["presets"]
    assert "cyclonic_squall" in presets_data["presets"]

    # 2. Simulation run endpoint
    payload = {
        "rainfall_mm": 120.0,
        "temp_c": 28.0,
        "wind_kmh": 65.0,
        "humidity_pct": 92.0,
        "pressure_hpa": 985.0,
        "cloud_cover_pct": 95.0,
        "lead_day": 4,
        "location": "Vijayawada",
    }
    sim_resp = client.post("/api/simulator/run", json=payload)
    assert sim_resp.status_code == 200, f"Simulation failed with {sim_resp.status_code}"
    sim_data = sim_resp.json()

    assert "trust_score" in sim_data
    assert "bust_probability_pct" in sim_data
    assert "reliability_tier" in sim_data
    assert "alerts" in sim_data and len(sim_data["alerts"]) > 0
    assert "shap_feature_importance" in sim_data and len(sim_data["shap_feature_importance"]) > 0
    assert "sector_decision_support" in sim_data
    assert "Farmer" in sim_data["sector_decision_support"]
    assert "Disaster Management" in sim_data["sector_decision_support"]


def test_differentiator_4_district_reliability_passport():
    """Verify District Reliability Passport historical profiling."""
    resp = client.get("/api/reliability/passport?district=Vijayawada")
    assert resp.status_code == 200, f"Passport failed with {resp.status_code}"
    data = resp.json()

    assert data["status"] == "success"
    assert "passport_metadata" in data
    assert "trust_tier" in data["passport_metadata"]
    assert "scores" in data

    scores = data["scores"]
    assert "overall_reliability" in scores
    assert "monsoon_reliability" in scores
    assert "heatwave_reliability" in scores
    assert "cyclone_reliability" in scores
    assert "heavy_rainfall_reliability" in scores
    assert "most_error_prone_month" in scores
    assert "historical_forecast_accuracy_pct" in scores

    assert "seasonal_performance" in data and len(data["seasonal_performance"]) == 4
    assert "lead_day_trend" in data and len(data["lead_day_trend"]) == 10
    assert "ai_synoptic_summary" in data and len(data["ai_synoptic_summary"]) > 50


def test_differentiator_5_resource_optimization_ai():
    """Verify Resource Optimization AI recommendations and district ranking."""
    resp = client.get("/api/stakeholder/resource-optimization?location=Vijayawada&lead_day=6")
    assert resp.status_code == 200, f"Resource optimization failed with {resp.status_code}"
    data = resp.json()

    assert data["status"] == "success"
    assert "ndrf_deployment" in data
    assert "tier" in data["ndrf_deployment"]
    assert "battalions" in data["ndrf_deployment"]
    assert "inflatable_rescue_boats" in data["ndrf_deployment"]

    assert "relief_camps" in data
    assert "recommended_shelters_count" in data["relief_camps"]
    assert "estimated_evacuees_capacity" in data["relief_camps"]

    assert "reservoir_monitoring" in data
    assert "pump_allocation" in data
    assert "medical_readiness" in data

    # Verify Multi-District Priority Ranking
    assert "district_resource_ranking" in data
    ranking = data["district_resource_ranking"]
    assert len(ranking) >= 6
    # Verify ranking is sorted by urgency_score descending
    urgency_scores = [d["urgency_score"] for d in ranking]
    assert urgency_scores == sorted(urgency_scores, reverse=True)


def test_differentiator_6_multi_agent_intelligence():
    """Verify Multi-Agent Weather Intelligence War Room with 5 independent AI agents."""
    resp = client.get("/api/intelligence/multi-agent?location=Vijayawada&lead_day=6")
    assert resp.status_code == 200, f"Multi-agent failed with {resp.status_code}"
    data = resp.json()

    assert data["status"] == "success"
    assert "consensus" in data
    assert "score_pct" in data["consensus"]
    assert "status" in data["consensus"]
    assert "joint_directive" in data["consensus"]

    assert "agents" in data
    agents = data["agents"]
    assert len(agents) == 5

    agent_names = [a["name"] for a in agents]
    assert "Forecast Agent" in agent_names
    assert "Reliability Agent" in agent_names
    assert "Disaster Agent" in agent_names
    assert "Agriculture Agent" in agent_names
    assert "Explanation Agent" in agent_names

    for agent in agents:
        assert "observation" in agent and len(agent["observation"]) > 10
        assert "risk_level" in agent
        assert "recommendation" in agent and len(agent["recommendation"]) > 10
        assert "confidence_pct" in agent
        assert 0 <= agent["confidence_pct"] <= 100
