"""
WeatherTrust AI — Main Backend Application Entrypoint
Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
SIH Problem ID: 26079: AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts
"""

import os
from pathlib import Path
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

# Register API Routers
app.include_router(weather_router)
app.include_router(reliability_router)
app.include_router(drift_router)
app.include_router(alerts_router)
app.include_router(judge_router)
app.include_router(map_router)
app.include_router(explain_router)


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


# Static Frontend Mounting & SPA Page Routing
PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

PAGES = [
    "dashboard",
    "confidence-map",
    "daywise",
    "uncertainty",
    "calibration",
    "explain",
    "live-weather",
    "forecast",
    "trust",
    "drift",
    "map",
    "alerts",
    "decision-support",
    "technical",
    "about",
]

if FRONTEND_DIR.exists():
    index_html = str(FRONTEND_DIR / "index.html")

    for page_path in PAGES:
        @app.get(f"/{page_path}", include_in_schema=False)
        async def serve_spa_page():
            return FileResponse(index_html)

    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=config.HOST, port=config.PORT, reload=config.DEBUG)
