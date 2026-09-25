# WEATHERTRUST AI
### Explainable Weather Forecast Reliability & Bust-Risk Detection Platform
> *"Know the weather. Know when to trust it."*

---

## 📌 Concept & Vision

Normal weather applications answer:
> **"What will the weather be?"**

**WeatherTrust AI** answers:
> **"How much should I trust this forecast?"**

The platform functions as an independent **FORECAST RELIABILITY & FORECAST TRUST LAYER** on top of weather data. It quantifies uncertainty, estimates bust risk for Day 1–Day 10 lead times, explains *why* confidence is low in simple, accessible language, and provides actionable recommendations to non-technical users.

> ⚠️ **Official Meteorological Disclaimer:** WeatherTrust AI is a diagnostic reliability layer. It does **NOT** replace official meteorological forecasts or warnings issued by the India Meteorological Department (IMD) or national weather agencies.

---

## 🚀 Phase 1 Overview

Phase 1 establishes the operational core and user experience using structured sample baselines (clearly marked as **DEMO / SAMPLE SIMULATION**):

1. **Dashboard UI**:
   - Modern, responsive meteorological interface with dark theme.
   - Sidebar navigation: Dashboard, Forecast, Forecast Trust, Risk Map, Forecast Drift, Alerts, About.
   - Location search with autocomplete and quick preset selection for Indian regions (Krishna District, AP; Hyderabad; Bengaluru; Delhi; Mumbai).
2. **Standard Weather Platform**:
   - Current weather conditions (Temperature, feels-like, condition icon, min/max).
   - 8-metric weather detail grid: Humidity, Wind Speed/Direction, Pressure, Precipitation, Rain Chance, UV Index, Visibility, Sunrise/Sunset.
   - 24-hour horizontal hourly forecast timeline.
   - Day 1 to Day 10 extended forecast.
3. **Forecast Trust Innovation Layer (Demo Baseline)**:
   - **Forecast Reliability Score**: `24 / 100` (Low Confidence) for the Krishna District Day-6 benchmark.
   - **Bust Probability**: `76%` (High Risk).
   - **Forecast Stability**: `LOW`.
   - **Forecast Drift Monitor**: Captures run-to-run changes (`25 mm → 80 mm (+55 mm)`).
   - **Explainable "Why?" Section**:
     - 🔴 *Historical forecast error is high* (Day-6 errors historically high).
     - 🔄 *Forecast changed significantly* (+55mm shift across recent runs).
     - 📊 *Regional variability is high* (divergent historical analogs).
   - **Actionable User Recommendation**: *"Do not make important decisions based only on this forecast. Check the next forecast update."*
4. **Visual Analytics**:
   - Interactive 24-Hour Temperature vs. Rain Chance chart (Chart.js).
   - Day 1–Day 10 Bust Probability progression chart (Chart.js).
   - Regional reliability map with confidence markers (Leaflet.js).

---

## 📂 Phase 1 File Structure

```
WeatherTrustAI/
├── backend/
│   ├── main.py                     # FastAPI app, static mount, CORS, health endpoint
│   ├── routes/
│   │   ├── weather.py              # Weather API routes (/current, /hourly, /daily, /forecast, /search)
│   │   └── reliability.py          # Forecast Trust routes (/overview, /demo)
│   ├── services/
│   │   ├── weather_service.py      # Structured sample weather data provider
│   │   └── reliability_service.py  # Demo trust score, bust risks & explainability points
│   └── models/
│       ├── weather_model.py        # Pydantic schemas for weather
│       └── reliability_model.py    # Pydantic schemas for Forecast Trust & bust risk
├── frontend/
│   ├── index.html                  # Accessible dashboard HTML5
│   ├── css/
│   │   ├── style.css               # Design system tokens & accessible risk classes
│   │   └── dashboard.css           # Layouts, responsive sidebar, timelines, cards
│   └── js/
│       ├── charts.js               # Chart.js initialization for trends & bust risk
│       ├── weather.js              # Weather data fetcher and DOM updater
│       ├── reliability.js          # Forecast Trust layer renderer
│       └── dashboard.js            # Main coordinator (search, pills, Leaflet map)
├── config.py                       # Global settings & constants
├── requirements.txt                # Python dependencies
├── .gitignore                      # Git ignore rules
└── README.md                       # Documentation
```

---

## 🛠️ How to Run Locally

### 1. Prerequisites
- Python 3.10+ (or Python 3.14 via `py` on Windows)

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```
*(Dependencies: `fastapi`, `uvicorn`, `pydantic`)*

### 3. Start the FastAPI Server
```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
or via the Python launcher:
```bash
py -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Access the Dashboard
Open your browser and navigate to:
```
http://127.0.0.1:8000/
```
Interactive API documentation is also available at:
```
http://127.0.0.1:8000/docs
```

---

## 🗺️ Project Roadmap

- [x] **Phase 1**: Basic Weather & Forecast Trust UI Foundation (Sample Data Baseline)
- [ ] **Phase 2**: Real-time Weather API Integration
- [ ] **Phase 3**: Enhanced Weather Visualizations & Radar
- [ ] **Phase 4**: Advanced Forecast Trust UI with interactive lead-day filtering
- [ ] **Phase 5**: Historical Forecast-vs-Actual Dataset Preparation
- [ ] **Phase 6**: Feature Engineering (Lead time, regional variance, drift)
- [ ] **Phase 7**: ML Classification for Bust-Risk (Baselines -> Random Forest / GBDT)
- [ ] **Phase 8**: SHAP Explainability Engine
- [ ] **Phase 9**: Automated Forecast Run-to-Run Drift Monitor
- [ ] **Phase 10**: Geographic Regional Bust-Risk Choropleth Map
- [ ] **Phase 11**: Sector-Based Decision Support (Agriculture, Disaster Relief, Logistics)
