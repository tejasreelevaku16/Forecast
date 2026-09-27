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

  const locName = location || window.currentSelectedLocation || "Selected Location";
  if (locLabel) locLabel.textContent = locName;

  container.innerHTML = `
    <div style="grid-column: 1 / -1; text-align: center; padding: 48px 24px; color: #94a3b8;">
      <div class="loading-spinner" style="margin: 0 auto 16px auto; width: 36px; height: 36px; border: 3px solid rgba(56, 189, 248, 0.2); border-top-color: #38bdf8; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <h4 style="color: #f8fafc; font-size: 1rem; margin-bottom: 6px;">Executing Calibrated ML Multi-Lead Inference...</h4>
      <p style="font-size: 0.825rem; color: #64748b; max-width: 460px; margin: 0 auto;">Analyzing numerical weather prediction drift, atmospheric stability indices, and calibrated bust probability for ${locName} (Days 1–10)</p>
    </div>
  `;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);

  try {
    let url = `/api/reliability/daywise?location=${encodeURIComponent(locName)}`;
    if (window.currentSelectedLat && window.currentSelectedLon) {
      url += `&lat=${window.currentSelectedLat}&lon=${window.currentSelectedLon}`;
    }
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    const data = await resp.json();
    const days = (data && Array.isArray(data.days)) ? data.days : [];
    renderDaywiseCards(days, locName);
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("Error loading daywise forecast:", err);
    container.innerHTML = `
      <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px 24px; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.05);">
        <div style="font-size: 2rem; margin-bottom: 10px;">⚠️</div>
        <h4 style="color: #f8fafc; font-size: 1.05rem; margin-bottom: 6px;">Data Unavailable for ${locName}</h4>
        <p style="color: #94a3b8; font-size: 0.85rem; max-width: 480px; margin: 0 auto 16px auto; line-height: 1.5;">
          The Day 1–10 calibrated ML inference engine was unable to compute trust scores for this location horizon within the timeout window.
        </p>
        <button onclick="loadDaywiseForecast('${locName}')" class="btn btn-primary" style="padding: 8px 18px; font-size: 0.85rem; background: var(--accent-cyan); color: #0b1120; font-weight: 700; border-radius: 6px; cursor: pointer; border: none;">
          🔄 Retry Inference
        </button>
      </div>
    `;
  }
}

function renderDaywiseCards(days, location) {
  const container = document.getElementById("daywiseCardsGrid");
  if (!container) return;

  if (!Array.isArray(days) || days.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="grid-column: 1 / -1; text-align: center; padding: 40px 24px; border: 1px solid rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.05);">
        <div style="font-size: 2rem; margin-bottom: 10px;">ℹ️</div>
        <h4 style="color: #f8fafc; font-size: 1.05rem; margin-bottom: 6px;">Data Unavailable for ${location}</h4>
        <p style="color: #94a3b8; font-size: 0.85rem; max-width: 480px; margin: 0 auto 16px auto; line-height: 1.5;">
          No usable Day 1–10 forecast confidence values were returned for this location and lead-time horizon.
        </p>
        <button onclick="loadDaywiseForecast('${location}')" class="btn btn-primary" style="padding: 8px 18px; font-size: 0.85rem; background: var(--accent-cyan); color: #0b1120; font-weight: 700; border-radius: 6px; cursor: pointer; border: none;">
          🔄 Retry
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = days
    .map((item) => {
      const risk = (item.risk || 'MODERATE').toUpperCase();
      const riskClass =
        risk === "LOW"
          ? "risk-card-low"
          : risk === "MODERATE"
          ? "risk-card-moderate"
          : "risk-card-high";

      const confidence = Number(item.confidence) || 0;
      const bustProb = Number(item.bust_probability) || 0;

      const badgeColor =
        confidence >= 75 ? "#10b981" : confidence >= 50 ? "#f59e0b" : "#ef4444";

      return `
      <div class="daywise-forecast-card ${riskClass}" data-day="${item.day}">
        <div class="daywise-card-header">
          <div class="day-indicator">
            <span class="day-num">DAY ${item.day}</span>
            <span class="day-date">${item.day_name || ''}${item.date_str ? ', ' + item.date_str : ''}</span>
          </div>
          <span class="day-risk-badge" style="background:${badgeColor}22; color:${badgeColor}; border:1px solid ${badgeColor}55;">
            ${risk} RISK
          </span>
        </div>

        <div class="daywise-kpi-row">
          <div class="daywise-kpi-item">
            <span class="kpi-title">Forecast Confidence</span>
            <span class="kpi-value conf-val" style="color:${badgeColor}">${confidence}%</span>
          </div>
          <div class="daywise-kpi-item">
            <span class="kpi-title">Bust Probability</span>
            <span class="kpi-value bust-val">${bustProb}%</span>
          </div>
        </div>

        <!-- Progress Track -->
        <div class="conf-progress-track">
          <div class="conf-progress-fill" style="width: ${confidence}%; background-color: ${badgeColor};"></div>
        </div>

        <div class="daywise-weather-metrics">
          <div class="metric-pill">
            <span class="lbl">Rain:</span> <strong>${Number(item.rainfall_mm || 0).toFixed(1)} mm</strong>
          </div>
          <div class="metric-pill">
            <span class="lbl">Temp:</span> <strong>${Number(item.temperature_c || 0).toFixed(1)}°C</strong>
          </div>
          <div class="metric-pill">
            <span class="lbl">NWP Drift:</span> <strong>+${Number(item.forecast_drift_mm || 0).toFixed(1)} mm</strong>
          </div>
          <div class="metric-pill">
            <span class="lbl">Uncertainty:</span> <strong>${Number(item.uncertainty_pct || 0).toFixed(0)}%</strong>
          </div>
        </div>

        <div class="daywise-shap-box">
          <div class="shap-icon">🧠</div>
          <p class="shap-text">${item.shap_summary || 'Evaluating atmospheric stability index and ensemble spread...'}</p>
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
