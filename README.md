# WeatherTrust AI v2.0.0
### AI-Based Forecast Bust Detection for Medium-Range Weather Forecasts
**Smart India Hackathon (SIH) — Problem ID: 26079**  
**Organization:** Ministry of Earth Sciences (MoES)  
**Department:** National Centre for Medium Range Weather Forecasting (NCMRWF)  

> *"Know the weather. Know when to trust it."*

---

## 📌 Executive Summary

Numerical Weather Prediction (NWP) models provide critical multi-day forecasts for disaster mitigation, agriculture, water resources, and civil logistics. However, atmospheric chaotic divergence and parameterized convective approximations cause numerical forecasts to occasionally fail significantly — an event known as a **Forecast Bust**.

**WeatherTrust AI** functions as an operational diagnostic uncertainty and reliability quantification layer on top of real-time meteorological observations and 10-day numerical weather predictions. By combining historical forecast-error dynamics across Indian agro-climatic zones, calibrated machine learning probabilities, and domain-specific Explainable AI (SHAP), WeatherTrust AI quantifies exactly **where, when, and why** a forecast is likely to fail.

> ⚠️ **Official Meteorological Disclaimer:** WeatherTrust AI operates as an AI uncertainty diagnostic layer. It does **NOT** replace official meteorological forecasts or warnings issued by the India Meteorological Department (IMD) or national disaster management authorities.

---

## 🚀 Key SIH Features Implemented

### 1. 🗺️ Dynamic Forecast Confidence Map (SIH Feature 1)
- **Endpoint**: `GET /api/map/confidence?day=1&location=Vijayawada`
- **Capabilities**:
  - Interactive India GIS map using Leaflet.js with official state boundaries and district stations.
  - Interactive **Day 1 to Day 10** lead-time selector.
  - MoES-standard 5-tier confidence color scale:
    - `90–100%`: Dark Green (High Trust)
    - `75–89%`: Green (Good Confidence)
    - `60–74%`: Yellow (Moderate Confidence)
    - `40–59%`: Orange (Low Confidence)
    - `0–39%`: Red (High Bust Risk)
  - Rich interactive tooltips and click-to-open Explainable AI diagnostic panels.

### 2. 📅 Day 1 to Day 10 Independent ML Predictions (SIH Feature 2)
- **Endpoint**: `GET /api/reliability/daywise?location=Vijayawada`
- **Capabilities**:
  - Produces independent calibrated probability predictions for every lead day (Day 1 through Day 10).
  - Outputs Confidence Score, Bust Probability, Risk Category, Model Drift, Uncertainty Percentage, and domain SHAP summaries.
  - Rendered as 10 distinct interactive forecast cards with animated progress tracks.

### 3. 📉 Forecast Uncertainty & Variability Engine (SIH Feature 3)
- **Endpoint**: `GET /api/reliability/uncertainty?location=Vijayawada`
- **Capabilities**:
  - Quantifies uncertainty strictly from real forecast variability: temperature variance, rainfall gradients, pressure tendencies, moisture fluctuations, and run-to-run drift.
  - Chart.js dual-axis graph:
    - 🟢 **Green Line**: Forecast Confidence (%)
    - 🔴 **Red Line**: Forecast Uncertainty (%)
    - 🔵 **Blue Dashed Line**: Model Run Drift (mm)
  - 5 Operational KPI Cards and dynamic natural language meteorological insight synthesis.

### 4. 🔬 Model Reliability & Probability Calibration (SIH Feature 4)
- **Endpoint**: `GET /api/judge/calibration` & `GET /api/judge/metrics`
- **Capabilities**:
  - Evaluator dashboard computing: Classification Accuracy, Precision, Recall, F1-Score, ROC-AUC, and Brier Score.
  - **Reliability / Calibration Curve**: Predicted probability bins vs observed true bust frequencies.
  - **Receiver Operating Characteristic (ROC Curve)**.
  - **Confusion Matrix Heatmap** (TN, FP, FN, TP).
  - Automated scientific interpretation generated directly from test set metrics.

### 5. 🧠 Explainable Forecast Bust Analysis (SIH Feature 5)
- **Endpoint**: `GET /api/explain/bust?location=Vijayawada&lead_day=6`
- **Capabilities**:
  - **Circular Confidence Gauge (0–100)** with animated SVG sweep.
  - **Large Animated Bust Probability Indicator**.
  - **SHAP Contribution Chart** with horizontal bars:
    - 🔴 *Negative Influence (Red)*: Increases Bust Risk
    - 🟢 *Positive Influence (Green)*: Enhances Confidence
  - Domain meteorological feature nomenclature: *Pressure Drop, Rainfall Gradient, Humidity Instability, Wind Shear, Temperature Trend, Forecast Drift, Convective Instability, Climatological Error Prior*.
  - Actionable NCMRWF operational decision recommendations.

---

## 🏛️ System Architecture

```
WeatherTrust AI (NCMRWF / MoES Control Room)
├── backend/
│   ├── main.py                     # FastAPI app, SPA routing, CORS, router mounts
│   ├── routes/
│   │   ├── weather.py              # Open-Meteo live observation & 10-day forecast endpoints
│   │   ├── reliability.py          # /overview, /daywise (Feature 2), /uncertainty (Feature 3)
│   │   ├── map.py                  # /api/map/confidence (Feature 1), /api/map/states
│   │   ├── judge.py                # /api/judge/calibration (Feature 4), /api/judge/metrics
│   │   ├── explain.py              # /api/explain/bust (Feature 5)
│   │   ├── drift.py                # NWP cycle run-to-run drift tracking
│   │   └── alerts.py               # Proactive early warning triggers
│   ├── services/
│   │   ├── weather_service.py      # Real Open-Meteo API fetcher with disk caching
│   │   ├── historical_error_service.py # NCMRWF historical error dataset & prior engine
│   │   ├── uncertainty_service.py  # Forecast variability & uncertainty indexer
│   │   ├── reliability_service.py  # Calibrated ML inference & day-wise orchestrator
│   │   ├── india_map_service.py    # Multi-day GIS map processor
│   │   └── decision_service.py     # 6-sector persona recommendation engine
│   └── models/
│       ├── weather_model.py        # Pydantic schemas for weather
│       └── reliability_model.py    # Pydantic schemas for Forecast Trust & bust risk
├── ml/
│   ├── generate_dataset.py         # Multi-year historical forecast-vs-actual error dataset generator
│   ├── feature_engineering.py      # Non-leaking meteorological feature extractor
│   ├── calibration.py              # 5-Fold Sigmoid probability calibration & ROC evaluator
│   ├── explain.py                  # SHAP domain attribution & natural language explanation engine
│   ├── train.py                    # Model comparison (LR vs RF vs GBDT) & serialization
│   └── evaluate.py                 # Statistical classification metrics
├── frontend/
│   ├── index.html                  # Accessible MoES control-room dashboard
│   ├── css/
│   │   ├── style.css               # Design system & tokens
│   │   └── dashboard.css           # Control room layout, GIS map, cards, gauges, charts
│   └── js/
│       ├── confidenceMap.js        # Feature 1: GIS Leaflet map & Day 1-10 selector
│       ├── daywiseForecast.js      # Feature 2: 10 independent lead-day cards
│       ├── uncertaintyChart.js     # Feature 3: Chart.js dual-axis graph & KPIs
│       ├── calibration.js          # Feature 4: Evaluator calibration & ROC dashboard
│       ├── explainability.js       # Feature 5: Circular gauge & SHAP horizontal bars
│       ├── weather.js              # Live weather rendering
│       ├── navigation.js           # 15-view SPA router
│       └── dashboard.js            # Central coordinator
├── models/
│   └── forecast_reliability_model.pkl # Trained calibrated Random Forest model bundle
├── config.py                       # Global settings & constants
└── requirements.txt                # Python dependencies
```

---

## 🛠️ How to Run Locally

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.14 on Windows)

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Run Automated SIH Verification Suite
```bash
py tests/test_sih_features.py
```

### 4. Start the Application Server
```bash
py -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 5. Access the Platform
- **Dashboard**: `http://127.0.0.1:8000/`
- **Confidence Map**: `http://127.0.0.1:8000/confidence-map`
- **Day-wise Predictions**: `http://127.0.0.1:8000/daywise`
- **Forecast Uncertainty**: `http://127.0.0.1:8000/uncertainty`
- **Model Calibration & Reliability**: `http://127.0.0.1:8000/calibration`
- **Explainable AI (SHAP)**: `http://127.0.0.1:8000/explain`
- **Interactive Swagger API Docs**: `http://127.0.0.1:8000/docs`

### Deploy to Render

Create a **Python Web Service** from the repository's `main` branch (the frontend
must be served by FastAPI so its `/api/...` requests reach the backend). Use:

- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
- **Health check path:** `/api/health`
- **Python version:** pinned by `.python-version`

For an always-available service, select an always-on paid compute plan. Render's
free web services spin down after 15 minutes without requests, so their first
request after inactivity can have a cold-start delay. No hosting plan can
guarantee zero latency; this app caches successful page data and paints the
dashboard's core weather/reliability data before slower secondary insights.
