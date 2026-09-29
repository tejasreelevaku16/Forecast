/**
 * WeatherTrust AI — Decision Simulator Controller (SIH Differentiator 3)
 * Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
 */

const DecisionSimulator = {
  debounceTimer: null,
  presets: {},
  _initialized: false,

  init() {
    if (!this._initialized) {
      this.setupListeners();
      this.fetchPresets();
      this._initialized = true;
    }
    this.runSimulation(); // initial run
  },

  async fetchPresets() {
    try {
      const resp = await fetch("/api/simulator/presets");
      if (!resp.ok) return;
      const data = await resp.json();
      this.presets = data.presets || {};
    } catch (err) {
      console.warn("[DecisionSimulator] failed to load presets:", err);
    }
  },

  setupListeners() {
    const sliders = [
      { id: "simRainSlider", valId: "simRainVal", suffix: " mm" },
      { id: "simTempSlider", valId: "simTempVal", suffix: " °C" },
      { id: "simWindSlider", valId: "simWindVal", suffix: " km/h" },
      { id: "simHumSlider", valId: "simHumVal", suffix: " %" },
      { id: "simPresSlider", valId: "simPresVal", suffix: " hPa" },
      { id: "simCloudSlider", valId: "simCloudVal", suffix: " %" },
    ];

    sliders.forEach(({ id, valId, suffix }) => {
      const input = document.getElementById(id);
      const valEl = document.getElementById(valId);
      if (input) {
        input.addEventListener("input", (e) => {
          if (valEl) valEl.textContent = `${e.target.value}${suffix}`;
          this.queueSimulation();
        });
      }
    });

    // Preset buttons
    const presetBtns = document.querySelectorAll(".sim-preset-btn");
    presetBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const pKey = btn.getAttribute("data-preset");
        this.applyPreset(pKey);
      });
    });
  },

  applyPreset(presetKey) {
    const p = this.presets[presetKey];
    if (!p) return;

    this.setSliderValue("simRainSlider", "simRainVal", p.rainfall_mm, " mm");
    this.setSliderValue("simTempSlider", "simTempVal", p.temp_c, " °C");
    this.setSliderValue("simWindSlider", "simWindVal", p.wind_kmh, " km/h");
    this.setSliderValue("simHumSlider", "simHumVal", p.humidity_pct, " %");
    this.setSliderValue("simPresSlider", "simPresVal", p.pressure_hpa, " hPa");
    this.setSliderValue("simCloudSlider", "simCloudVal", p.cloud_cover_pct, " %");

    this.runSimulation();
  },

  setSliderValue(sliderId, labelId, val, suffix) {
    const slider = document.getElementById(sliderId);
    const label = document.getElementById(labelId);
    if (slider) slider.value = val;
    if (label) label.textContent = `${val}${suffix}`;
  },

  queueSimulation() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.runSimulation(), 100);
  },

  async runSimulation() {
    const payload = {
      rainfall_mm: parseFloat(document.getElementById("simRainSlider")?.value || "25"),
      temp_c: parseFloat(document.getElementById("simTempSlider")?.value || "30"),
      wind_kmh: parseFloat(document.getElementById("simWindSlider")?.value || "18"),
      humidity_pct: parseFloat(document.getElementById("simHumSlider")?.value || "70"),
      pressure_hpa: parseFloat(document.getElementById("simPresSlider")?.value || "1010"),
      cloud_cover_pct: parseFloat(document.getElementById("simCloudSlider")?.value || "50"),
      lead_day: 5,
      location: window.currentSelectedLocation || "Vijayawada",
    };

    try {
      const resp = await fetch("/api/simulator/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error("Simulation request failed");
      const res = await resp.json();
      this.renderResults(res);
    } catch (err) {
      console.error("[DecisionSimulator] run error:", err);
    }
  },

  renderResults(res) {
    // 1. Trust Score & Bust
    const scoreVal = document.getElementById("simTrustScoreVal");
    const bustVal = document.getElementById("simBustProbVal");
    const tierBadge = document.getElementById("simReliabilityTierBadge");

    if (scoreVal) scoreVal.textContent = `${res.trust_score} / 100`;
    if (bustVal) bustVal.textContent = `${res.bust_probability_pct}%`;
    if (tierBadge) {
      tierBadge.textContent = res.reliability_tier;
      tierBadge.className = `badge ${res.badge_class}`;
    }

    // 2. Alerts
    const alertsContainer = document.getElementById("simAlertsContainer");
    if (alertsContainer) {
      alertsContainer.innerHTML = "";
      (res.alerts || []).forEach((alt) => {
        const card = document.createElement("div");
        card.style.background = alt.severity === "CRITICAL" ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)";
        card.style.border = `1px solid ${alt.severity === "CRITICAL" ? "rgba(239, 68, 68, 0.4)" : "rgba(245, 158, 11, 0.4)"}`;
        card.style.borderRadius = "6px";
        card.style.padding = "8px 12px";
        card.style.marginBottom = "8px";
        card.innerHTML = `
          <strong style="color: ${alt.severity === "CRITICAL" ? "#ef4444" : "#f59e0b"}; font-size: 0.82rem;">${alt.title}</strong>
          <p style="font-size: 0.78rem; color: #cbd5e1; margin-top: 3px;">${alt.message}</p>
        `;
        alertsContainer.appendChild(card);
      });
    }

    // 3. SHAP Bars
    const shapContainer = document.getElementById("simShapBarsContainer");
    if (shapContainer) {
      shapContainer.innerHTML = "";
      (res.shap_feature_importance || []).forEach((feat) => {
        const pct = Math.round(feat.impact * 100);
        const barColor = feat.positive_contribution ? "#10b981" : "#ef4444";
        const row = document.createElement("div");
        row.style.marginBottom = "10px";
        row.innerHTML = `
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 3px;">
            <span style="color: #f8fafc;">${feat.feature} (${feat.value})</span>
            <span style="color: ${barColor}; font-weight: 600;">${pct}%</span>
          </div>
          <div style="background: rgba(148, 163, 184, 0.15); height: 6px; border-radius: 3px; overflow: hidden;">
            <div style="background: ${barColor}; width: ${pct}%; height: 100%;"></div>
          </div>
        `;
        shapContainer.appendChild(row);
      });
    }

    // 4. Sector Decision Support
    const sectorsContainer = document.getElementById("simSectorGuidanceContainer");
    if (sectorsContainer && res.sector_decision_support) {
      sectorsContainer.innerHTML = "";
      Object.entries(res.sector_decision_support).forEach(([sec, data]) => {
        const tile = document.createElement("div");
        tile.style.background = "rgba(30, 41, 59, 0.6)";
        tile.style.border = "1px solid rgba(255, 255, 255, 0.08)";
        tile.style.borderRadius = "6px";
        tile.style.padding = "10px";
        tile.style.marginBottom = "8px";
        tile.innerHTML = `
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 4px;">
            <strong style="color: #38bdf8;">${sec}</strong>
            <span style="font-size: 0.72rem; color: #94a3b8;">${data.urgency || "Standard"}</span>
          </div>
          <p style="font-size: 0.78rem; color: #cbd5e1; line-height: 1.4;">${data.recommendation}</p>
        `;
        sectorsContainer.appendChild(tile);
      });
    }
  },
};

window.DecisionSimulator = DecisionSimulator;
