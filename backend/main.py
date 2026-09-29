"""
WeatherTrust AI — Main Backend Application Entrypoint
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
SIH Problem ID: 26079: AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts
"""

import os
import sys
from pathlib import Path
from typing import Optional, List, Dict, Any

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

import config
from backend.routes.weather import router as weather_router
from backend.routes.reliability import router as reliability_router
from backend.routes.drift import router as drift_router
from backend.routes.alerts import router as alerts_router
from backend.routes.judge import router as judge_router
from backend.routes.map import router as map_router
from backend.routes.explain import router as explain_router
from backend.routes.locations import router as locations_router
from backend.routes.insights import router as insights_router
from backend.routes.stakeholder import router as stakeholder_router
from backend.routes.simulator import router as simulator_router
from backend.routes.intelligence import router as intelligence_router

from backend.services.weather_service import get_current_weather, get_full_forecast_response
from backend.services.reliability_service import get_forecast_reliability_overview

# Initialize FastAPI App
app = FastAPI(
    title=config.APP_NAME,
    description=f"{config.FULL_TITLE} | {config.ORGANIZATION} — {config.DEPARTMENT}",
    version=config.VERSION,
)

# CORS middleware for local development and dashboard clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_no_cache_headers(request, call_next):
    response = await call_next(request)
    # Prevent browser caching of frontend HTML, JS, and CSS files during operational review
    if any(request.url.path.endswith(ext) for ext in [".js", ".css", ".html"]) or request.url.path == "/" or not "." in request.url.path:
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
    return response

# Register API Routers
app.include_router(weather_router)
app.include_router(reliability_router)
app.include_router(drift_router)
app.include_router(alerts_router)
app.include_router(judge_router)
app.include_router(map_router)
app.include_router(explain_router)
app.include_router(locations_router)
app.include_router(insights_router)
app.include_router(stakeholder_router)
app.include_router(simulator_router)
app.include_router(intelligence_router)


@app.on_event("startup")
def prewarm_ml_services():
    """Pre-warms ML model bundle and location caches for fast response."""
    try:
        from backend.services.reliability_service import get_model_bundle
        get_model_bundle()
    except Exception as e:
        print(f"[!] Startup prewarm notice: {e}")



@app.get("/api/health", tags=["System"])
def health_check():
    """Health check endpoint verifying backend operational status."""
    return {
        "status": "healthy",
        "app": config.APP_NAME,
        "organization": config.ORGANIZATION,
        "department": config.DEPARTMENT,
        "problem_id": config.PROBLEM_ID,
        "version": config.VERSION,
        "is_demo_mode": config.IS_DEMO_MODE,
        "tagline": config.TAGLINE,
    }


@app.get("/api/weather", tags=["Weather"])
def api_weather(location: str = "Vijayawada"):
    """Direct endpoint: GET /api/weather returning current weather."""
    return get_current_weather(location)


@app.get("/api/forecast", tags=["Weather"])
def api_forecast(location: str = "Vijayawada"):
    """Direct endpoint: GET /api/forecast returning hourly and 10-day forecasts."""
    return get_full_forecast_response(location)


@app.get("/api/reliability", tags=["Forecast Trust Layer"])
def api_reliability(location: str = "Vijayawada", lead_day: int = 6, sector: str = "General Public"):
    """Direct endpoint: GET /api/reliability returning Forecast Trust metrics."""
    return get_forecast_reliability_overview(location=location, focus_lead_day=lead_day, sector=sector)


@app.get("/api/live-weather", tags=["Weather"])
def api_live_weather(
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    location: Optional[str] = "Krishna District",
    region: Optional[str] = None,
):
    """Direct endpoint: GET /api/live-weather with exact coordinate support."""
    from backend.routes.weather import _extract_coords
    final_lat, final_lon = _extract_coords(lat, lon, latitude, longitude)
    clean_loc = str(location) if location and not hasattr(location, "default") else "Krishna District"
    clean_reg = str(region) if region and not hasattr(region, "default") else None
    return get_full_forecast_response(location_query=clean_loc, lat=final_lat, lon=final_lon, region=clean_reg)


# Static Frontend Mounting & SPA Page Routing
PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

PAGES = [
    "dashboard",
    "confidence-map",
    "forecast-confidence",
    "forecast-confidence-map",
    "daywise",
    "day-wise",
    "day-wise-confidence",
    "uncertainty",
    "forecast-uncertainty",
    "calibration",
    "model-reliability",
    "model-reliability-calibration",
    "explain",
    "explainable-ai",
    "live-weather",
    "live-tracking",
    "forecast",
    "forecast-replay",
    "10-day-forecast",
    "trust",
    "trust-diagnostics",
    "drift",
    "forecast-drift",
    "map",
    "india-map",
    "india-reliability-map",
    "alerts",
    "early-alerts",
    "decision-support",
    "technical",
    "technical-evaluation",
    "technical-evaluator",
    "about",
    "stakeholder",
    "stakeholder-workspace",
    "workspace",
    "forecaster",
    "disaster",
    "agriculture",
    "public",
    "admin",
]

if FRONTEND_DIR.exists():
    index_html = str(FRONTEND_DIR / "index.html")

    def _make_page_handler():
        async def _page_handler():
            return FileResponse(index_html)
        return _page_handler

    for page in PAGES:
        app.add_api_route(f"/{page}", _make_page_handler(), methods=["GET"], include_in_schema=False)

    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=config.HOST, port=config.PORT, reload=config.DEBUG)
