"""
Unit and Integration Tests for Forecast Drift Service (Phase 16)
Tests run-to-run drift calculations, stability levels, and historical cycle progression.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.services.drift_service import calculate_drift_metrics, get_drift_history


def test_large_rainfall_drift():
    # Prompt benchmark: Previous = 25mm, Latest = 80mm -> Change: +55mm, Stability: LOW
    drift = calculate_drift_metrics(
        variable_name="Rainfall",
        previous_val=25.0,
        current_val=80.0,
        unit="mm",
        target_lead_day=6
    )
    assert drift["absolute_change"] == 55.0
    assert drift["direction"] == "+"
    assert drift["stability_level"] == "LOW"
    assert drift["drift_level"] == "HIGH"
    print("[PASS] Benchmark rainfall drift calculation test passed (+55mm -> Stability: LOW).")


def test_stable_forecast_drift():
    # Small drift: Previous = 12.0mm, Latest = 14.0mm -> Change: +2.0mm, Stability: HIGH
    drift = calculate_drift_metrics(
        variable_name="Rainfall",
        previous_val=12.0,
        current_val=14.0,
        unit="mm",
        target_lead_day=2
    )
    assert drift["absolute_change"] == 2.0
    assert drift["stability_level"] == "HIGH"
    assert drift["drift_level"] == "LOW"
    print("[PASS] Stable forecast drift calculation test passed (+2mm -> Stability: HIGH).")


def test_drift_history_cycles():
    cycles = get_drift_history("Krishna District")
    assert len(cycles) == 4
    for c in cycles:
        assert "predicted_rain_mm" in c
        assert "run_name" in c
    print("[PASS] 4-cycle NWP run history test passed.")


def test_expanded_drift_locations():
    from fastapi.testclient import TestClient
    from backend.main import app
    client = TestClient(app)

    # 1. Delhi
    resp = client.get("/api/drift/history?location=Delhi")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["cycles"]) == 4
    assert data["cycles"][-1]["predicted_rain_mm"] == 34.0

    # 2. Mumbai
    resp = client.get("/api/drift/history?location=Mumbai")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["cycles"]) == 4
    assert data["cycles"][-1]["predicted_rain_mm"] == 68.0

    # 3. Bhopal
    resp = client.get("/api/drift/history?location=Bhopal")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["cycles"]) == 4
    assert data["cycles"][-1]["predicted_rain_mm"] == 35.0

    # 4. Unregistered locations have no fabricated forecast history
    resp = client.get("/api/drift/history?location=RemoteVillage")
    assert resp.status_code == 200
    data = resp.json()
    assert data["cycles"] == []


if __name__ == "__main__":
    print("\n--- Running Forecast Drift Test Suite ---")
    test_large_rainfall_drift()
    test_stable_forecast_drift()
    test_drift_history_cycles()
    test_expanded_drift_locations()
    print("ALL FORECAST DRIFT TESTS PASSED!\n")
