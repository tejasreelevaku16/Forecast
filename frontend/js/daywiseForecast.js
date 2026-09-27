/**
 * WeatherTrust AI — Day 1 to Day 10 ML Prediction Engine (SIH Feature 2)
 * Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
 * 
 * Fetches and renders independent calibrated ML predictions for Day 1 through Day 10.
 */

async function loadDaywiseForecast(location = "Vijayawada") {
  const container = document.getElementById("daywiseCardsGrid");
  const locLabel = document.getElementById("daywiseLocationHeader");
  if (!container) return;

  const loadingMessage = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8;">
      <div class="loading-spinner"></div>
      <p style="margin-top: 15px;">Executing Calibrated ML Multi-Lead Inference for ${location} (Day 1–10)...</p>
    </div>
  `;
  container.innerHTML = loadingMessage;

  if (locLabel) locLabel.textContent = location;

  try {
    const resp = await fetch(`/api/reliability/daywise?location=${encodeURIComponent(location)}`);
    if (!resp.ok) throw new Error("Failed to fetch daywise reliability");
    const data = await resp.json();
    renderDaywiseCards(data && Array.isArray(data.days) ? data.days : [], location);
  } catch (err) {
    console.error("Error loading daywise forecast:", err);
    container.innerHTML = `
      <div class="alert-box alert-error" style="grid-column: 1 / -1;">
        <strong>Data unavailable for this location/horizon.</strong><br>
        The Day 1–10 reliability model did not return usable forecast values for ${location}. Please retry or choose another location.
      </div>
    `;
  }
}

function renderDaywiseCards(days, location) {
  const container = document.getElementById("daywiseCardsGrid");
  if (!container) return;

  if (!Array.isArray(days) || days.length === 0) {
    container.innerHTML = `
      <div class="alert-box alert-warning" style="grid-column: 1 / -1;">
        <strong>Data unavailable for ${location}.</strong><br>
        No usable Day 1–10 forecast confidence values were returned for this location and lead-time horizon.
      </div>
    `;
    return;
  }

  container.innerHTML = days
    .map((item) => {
      const riskClass =
        item.risk.toLowerCase() === "low"
          ? "risk-card-low"
          : item.risk.toLowerCase() === "moderate"
          ? "risk-card-moderate"
          : "risk-card-high";

      const badgeColor =
        item.confidence >= 75 ? "#10b981" : item.confidence >= 55 ? "#f59e0b" : "#ef4444";

      return `
      <div class="daywise-forecast-card ${riskClass}" data-day="${item.day}">
        <div class="daywise-card-header">
          <div class="day-indicator">
            <span class="day-num">DAY ${item.day}</span>
            <span class="day-date">${item.day_name}, ${item.date_str}</span>
          </div>
          <span class="day-risk-badge" style="background:${badgeColor}22; color:${badgeColor}; border:1px solid ${badgeColor}55;">
            ${item.risk} Risk
          </span>
        </div>

        <div class="daywise-kpi-row">
          <div class="daywise-kpi-item">
            <span class="kpi-title">Forecast Confidence</span>
            <span class="kpi-value conf-val" style="color:${badgeColor}">${item.confidence}%</span>
          </div>
          <div class="daywise-kpi-item">
            <span class="kpi-title">Bust Probability</span>
            <span class="kpi-value bust-val">${item.bust_probability}%</span>
          </div>
        </div>

        <!-- Progress Track -->
        <div class="conf-progress-track">
          <div class="conf-progress-fill" style="width: ${item.confidence}%; background-color: ${badgeColor};"></div>
        </div>

        <div class="daywise-weather-metrics">
          <div class="metric-pill">
            <span class="lbl">Rain:</span> <strong>${item.rainfall_mm} mm</strong>
          </div>
          <div class="metric-pill">
            <span class="lbl">Temp:</span> <strong>${item.temperature_c}°C</strong>
          </div>
          <div class="metric-pill">
            <span class="lbl">NWP Drift:</span> <strong>+${item.forecast_drift_mm} mm</strong>
          </div>
          <div class="metric-pill">
            <span class="lbl">Uncertainty:</span> <strong>${item.uncertainty_pct}%</strong>
          </div>
        </div>

        <div class="daywise-shap-box">
          <div class="shap-icon">🧠</div>
          <p class="shap-text">${item.shap_summary}</p>
        </div>

        <button class="btn btn-sm btn-outline-primary daywise-explain-btn" onclick="openExplainabilityModal('${location}', ${item.day})">
          Explain Day ${item.day} Uncertainty
        </button>
      </div>
    `;
    })
    .join("");
}

// Global accessor
window.loadDaywiseForecast = loadDaywiseForecast;
