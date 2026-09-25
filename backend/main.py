"""
WeatherTrust AI - Main Backend Application Entrypoint (Phase 1)
Integrates FastAPI, CORS, API routers, and serves the frontend dashboard.
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

# Initialize FastAPI App
app = FastAPI(
    title=config.APP_NAME,
    description="Explainable Weather Forecast Reliability & Bust-Risk Detection Platform",
    version=config.VERSION,
)

# CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from backend.services.weather_service import get_current_weather, get_full_forecast_response
from backend.services.reliability_service import get_forecast_reliability_overview

# Register API Routers
app.include_router(weather_router)
app.include_router(reliability_router)


@app.get("/api/health", tags=["System"])
def health_check():
    """Health check endpoint verifying backend operational status."""
    return {
        "status": "healthy",
        "app": config.APP_NAME,
        "version": config.VERSION,
        "is_demo_mode": config.IS_DEMO_MODE,
        "tagline": config.TAGLINE,
    }


@app.get("/api/weather", tags=["Weather"])
def api_weather(location: str = "Krishna District"):
    """Direct endpoint: GET /api/weather returning current weather."""
    return get_current_weather(location)


@app.get("/api/forecast", tags=["Weather"])
def api_forecast(location: str = "Krishna District"):
    """Direct endpoint: GET /api/forecast returning hourly and 10-day forecasts."""
    return get_full_forecast_response(location)


@app.get("/api/reliability", tags=["Forecast Trust Layer"])
def api_reliability(location: str = "Krishna District"):
    """Direct endpoint: GET /api/reliability returning Forecast Trust metrics."""
    return get_forecast_reliability_overview(location)


# Static Frontend Mounting
PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=config.HOST, port=config.PORT, reload=config.DEBUG)
