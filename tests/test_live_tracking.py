"""
Unit and Integration Tests for Indian Geographic Location Hierarchy & Live Tracking (Phase Live-Tracking)
Tests:
1. All 36 Indian States and Union Territories listed.
2. State-to-place cascading hierarchy and strict state isolation (e.g., Karnataka places != AP places).
3. Location schema completeness: country, state, state_code, place, district, latitude, longitude.
4. Real geographic coordinate ranges (India lat: 6°N - 38°N, lon: 68°E - 98°E).
5. Disambiguated location search autocomplete (e.g. Vijayawada).
6. Live weather & 10-day forecast retrieval using real geographic coordinates.
7. Consistent location flow: State -> Place -> Coordinates -> Weather -> Drift -> Reliability.
8. SPA page routing: /live-tracking and /live-weather with all UI components.
"""

import sys
from pathlib import Path
from fastapi.testclient import TestClient

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.main import app
from backend.services.location_service import (
    get_all_states,
    get_places_by_state,
    search_indian_locations,
    get_location_by_place_and_state,
    INDIAN_LOCATIONS,
)
from backend.services.weather_service import get_full_forecast_response
from backend.services.reliability_service import get_forecast_reliability_overview
from backend.services.drift_service import get_drift_history

client = TestClient(app)


def test_indian_states_and_uts_count():
    """Verify all 36 Indian States and Union Territories are represented."""
    states = get_all_states()
    assert len(states) == 36, f"Expected 36 States/UTs, found {len(states)}"
    state_names = [s["state"] for s in states]

    # Verify key states & UTs
    expected_sample = [
        "Andhra Pradesh", "Karnataka", "Maharashtra", "Tamil Nadu", "Telangana",
        "Uttar Pradesh", "West Bengal", "Delhi", "Jammu & Kashmir", "Ladakh",
        "Kerala", "Gujarat", "Punjab", "Rajasthan", "Assam"
    ]
    for exp in expected_sample:
        assert exp in state_names, f"Expected state/UT '{exp}' not found"

    # API endpoint check
    resp = client.get("/api/locations/states")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 36
    print(f"[PASS] All {len(states)} Indian States and Union Territories verified.")


def test_state_isolation_and_place_cascading():
    """Verify places belong only to their respective states without cross-contamination."""
    # 1. Andhra Pradesh places
    ap_places = get_places_by_state("Andhra Pradesh")
    ap_names = [p["place"] for p in ap_places]
    assert "Vijayawada" in ap_names
    assert "Visakhapatnam" in ap_names
    assert "Guntur" in ap_names
    assert "Nellore" in ap_names
    assert "Tirupati" in ap_names
    assert "Kurnool" in ap_names
    assert "Rajahmundry" in ap_names
    assert "Kadapa" in ap_names

    # 2. Karnataka places
    ka_places = get_places_by_state("Karnataka")
    ka_names = [p["place"] for p in ka_places]
    assert "Bengaluru" in ka_names
    assert "Mysuru" in ka_names
    assert "Mangaluru" in ka_names
    assert "Hubballi" in ka_names

    # 3. Strict isolation: Karnataka places MUST NOT appear in AP
    for ka_p in ka_names:
        assert ka_p not in ap_names, f"State leak: Karnataka place '{ka_p}' found in Andhra Pradesh"

    # 4. Strict isolation: AP places MUST NOT appear in Karnataka
    for ap_p in ap_names:
        assert ap_p not in ka_names, f"State leak: Andhra Pradesh place '{ap_p}' found in Karnataka"

    # API endpoint check
    resp_ap = client.get("/api/locations/places?state=Andhra%20Pradesh")
    assert resp_ap.status_code == 200
    assert any(p["place"] == "Vijayawada" for p in resp_ap.json())
    assert not any(p["place"] == "Bengaluru" for p in resp_ap.json())

    resp_ka = client.get("/api/locations/places?state=Karnataka")
    assert resp_ka.status_code == 200
    assert any(p["place"] == "Bengaluru" for p in resp_ka.json())
    assert not any(p["place"] == "Vijayawada" for p in resp_ka.json())

    print("[PASS] Strict state-level place isolation and cascading verified.")


def test_location_metadata_and_genuine_coordinates():
    """Verify every location contains required fields and authentic coordinates within India's bounds."""
    assert len(INDIAN_LOCATIONS) >= 200, f"Expected 200+ places, found {len(INDIAN_LOCATIONS)}"

    for loc in INDIAN_LOCATIONS:
        # Field presence
        assert loc.get("country") == "India", f"Invalid country in {loc}"
        assert loc.get("state"), f"Missing state in {loc}"
        assert loc.get("state_code"), f"Missing state_code in {loc}"
        assert loc.get("place"), f"Missing place in {loc}"
        assert "latitude" in loc and isinstance(loc["latitude"], (int, float)), f"Invalid lat in {loc}"
        assert "longitude" in loc and isinstance(loc["longitude"], (int, float)), f"Invalid lon in {loc}"

        # Real geographic coordinates in India: Latitude 6.0°N to 38.0°N, Longitude 68.0°E to 98.5°E
        lat = loc["latitude"]
        lon = loc["longitude"]
        assert 6.0 <= lat <= 38.0, f"Latitude {lat} out of India bounds for {loc['place']}"
        assert 68.0 <= lon <= 98.5, f"Longitude {lon} out of India bounds for {loc['place']}"

    # Specific check for Vijayawada (NTR district)
    vjy = get_location_by_place_and_state("Vijayawada", "Andhra Pradesh")
    assert vjy is not None
    assert vjy["district"] == "NTR"
    assert vjy["state_code"] == "AP"
    assert round(vjy["latitude"], 2) == 16.51
    assert round(vjy["longitude"], 2) == 80.65

    print(f"[PASS] {len(INDIAN_LOCATIONS)} locations verified with authentic coordinates and complete metadata.")


def test_disambiguated_location_search():
    """Verify search returns matching places with State and District to resolve ambiguity."""
    # Search Vijayawada
    results = search_indian_locations("Vijayawada")
    assert len(results) > 0
    top = results[0]
    assert top["place"] == "Vijayawada"
    assert top["state"] == "Andhra Pradesh"
    assert top["district"] == "NTR"
    assert "India" in top["display_name"]

    # API endpoint check
    resp = client.get("/api/locations/search?q=Vijayawada")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) > 0
    assert data[0]["place"] == "Vijayawada"
    assert data[0]["state"] == "Andhra Pradesh"

    print("[PASS] Disambiguated location search autocomplete verified.")


def test_live_tracking_flow_weather_and_forecast():
    """Verify the flow: State -> Place -> Coordinates -> Weather -> Forecast -> Drift -> Reliability."""
    vjy = get_location_by_place_and_state("Vijayawada", "Andhra Pradesh")
    assert vjy is not None

    lat = vjy["latitude"]
    lon = vjy["longitude"]
    loc_str = f"{vjy['place']}, {vjy['state']}"

    # 1. Weather Forecast with explicit coordinates
    fc = get_full_forecast_response(loc_str, lat=lat, lon=lon, region=vjy["state"])
    assert fc.current is not None
    assert fc.current.location == "Vijayawada"
    assert fc.current.region == "Andhra Pradesh"
    assert round(fc.current.latitude, 2) == round(lat, 2)
    assert round(fc.current.longitude, 2) == round(lon, 2)
    assert len(fc.hourly) == 24
    assert len(fc.daily) == 10

    # 2. Forecast Reliability
    rel = get_forecast_reliability_overview(loc_str, focus_lead_day=6)
    assert rel is not None
    assert 0 <= rel.reliability_score <= 100
    assert 0 <= rel.bust_probability_pct <= 100
    assert len(rel.lead_days) == 10

    # 3. Forecast Drift History
    drift_cycles = get_drift_history(loc_str)
    assert len(drift_cycles) >= 2

    # 4. API endpoint verification
    api_resp = client.get(f"/api/weather/forecast?location=Vijayawada&lat={lat}&lon={lon}&region=Andhra%20Pradesh")
    assert api_resp.status_code == 200
    api_fc = api_resp.json()
    assert api_fc["current"]["location"] == "Vijayawada"
    assert len(api_fc["hourly"]) == 24
    assert len(api_fc["daily"]) == 10

    print("[PASS] Complete Live Tracking meteorological pipeline verified.")


def test_live_tracking_spa_page_and_components():
    """Verify Live Tracking page is served on /live-tracking and /live-weather with all required UI components."""
    for path in ["/live-tracking", "/live-weather"]:
        resp = client.get(path)
        assert resp.status_code == 200, f"Route {path} failed with {resp.status_code}"
        html = resp.text

        # Page view identifier
        assert 'id="page-live-weather"' in html

        # Location Hierarchy UI elements
        assert 'id="locationHierarchyCard"' in html
        assert 'id="stateSelect"' in html
        assert 'id="placeSelect"' in html
        assert 'id="trackLocationBtn"' in html
        assert 'id="liveTrackingSearchInput"' in html

        # Location and Current Weather Displays
        assert 'id="liveStateDisplay"' in html
        assert 'id="livePlaceDisplay"' in html
        assert 'id="currentLocationTitle"' in html
        assert 'id="currentTemp"' in html

        # All required tracking sections
        assert 'HOURLY FORECAST' in html
        assert 'id="hourlyTimelineContainer"' in html
        assert '10-DAY FORECAST' in html
        assert 'id="liveDailyForecastContainer"' in html
        assert 'FORECAST DRIFT' in html
        assert 'id="liveDriftPrev"' in html
        assert 'id="liveDriftLatest"' in html
        assert 'id="liveDriftChange"' in html
        assert 'FORECAST HISTORY' in html
        assert 'id="liveHistoryContainer"' in html
        assert 'RELIABILITY' in html
        assert 'id="liveTrustScore"' in html
        assert 'id="liveBustRisk"' in html
        assert 'id="liveReliabilityStatus"' in html

        # Scripts
        assert 'src="/js/live_tracking.js"' in html

    print("[PASS] SPA Page routes /live-tracking and /live-weather verified with complete component markup.")


if __name__ == "__main__":
    print("\n========================================================")
    print("RUNNING LIVE TRACKING & INDIAN LOCATION HIERARCHY TESTS")
    print("========================================================")
    test_indian_states_and_uts_count()
    test_state_isolation_and_place_cascading()
    test_location_metadata_and_genuine_coordinates()
    test_disambiguated_location_search()
    test_live_tracking_flow_weather_and_forecast()
    test_live_tracking_spa_page_and_components()
    print("========================================================")
    print("ALL LIVE TRACKING & LOCATION HIERARCHY TESTS PASSED! 100%")
    print("========================================================\n")
