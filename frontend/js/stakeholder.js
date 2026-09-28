/**
 * WeatherTrust AI — Complete Stakeholder Workspace Frontend Controller
 * Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
 * SIH Problem ID: 26079
 *
 * Implements 5 Role-Based Operational Portals:
 * 1. Forecaster (IMD / MoES)
 * 2. Disaster Management Authority
 * 3. Agriculture Department
 * 4. Public Citizen
 * 5. Administrator
 */

const StakeholderUI = {
  activeRole: localStorage.getItem("weathertrust_active_role") || "forecaster",
  currentLeadDay: 6,
  currentLocation: "Krishna District",
  forecasterMap: null,
  disasterMap: null,
  charts: {},
  cachedData: {},

  init() {
    this.currentLocation = window.currentSelectedLocation || "Krishna District";
    this.setupEventListeners();
    this.setupRoleTabs();
    this.populateDistrictSelect();
    this.setLeadDay(this.currentLeadDay, false);
    this.switchRole(this.activeRole, false);
  },

  setupEventListeners() {
    // Lead day pills
    const pills = document.querySelectorAll(".sync-lead-day-pills .lead-day-pill");
    pills.forEach((pill) => {
      pill.addEventListener("click", (e) => {
        const d = parseInt(e.target.getAttribute("data-day") || "6", 10);
        this.setLeadDay(d);
      });
    });

    // District select dropdown
    const distSelect = document.getElementById("stakeholderDistrictSelect");
    if (distSelect) {
      distSelect.addEventListener("change", (e) => {
        const loc = e.target.value;
        this.onDistrictChanged(loc);
      });
    }

    // Role tabs
    const roleBtns = document.querySelectorAll(".role-tab-btn");
    roleBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const role = btn.getAttribute("data-role");
        if (role) this.switchRole(role);
      });
    });

    // Forecaster Export PDF & CSV
    const exportCsvBtn = document.getElementById("forecasterExportCsvBtn");
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener("click", () => this.exportForecasterCSV());
    }

    const exportPdfBtn = document.getElementById("forecasterExportPdfBtn");
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener("click", () => this.exportBriefingPDF());
    }

    // Disaster SITREP Export
    const exportSitrepBtn = document.getElementById("disasterExportSitrepBtn");
    if (exportSitrepBtn) {
      exportSitrepBtn.addEventListener("click", () => this.exportDisasterSitrep());
    }

    // Admin Retrain Form
    const retrainBtn = document.getElementById("adminRetrainSubmitBtn");
    if (retrainBtn) {
      retrainBtn.addEventListener("click", () => this.triggerModelRetrain());
    }

    // Admin Dataset Upload
    const datasetInput = document.getElementById("adminDatasetFileInput");
    if (datasetInput) {
      datasetInput.addEventListener("change", (e) => this.handleDatasetUpload(e));
    }

    // Admin Backup Button
    const backupBtn = document.getElementById("adminCreateBackupBtn");
    if (backupBtn) {
      backupBtn.addEventListener("click", () => this.triggerBackup());
    }

    // Admin Log Filter
    const logFilter = document.getElementById("adminLogFilter");
    if (logFilter) {
      logFilter.addEventListener("change", (e) => this.filterLogs(e.target.value));
    }

    // Public Share Button
    const shareBtn = document.getElementById("publicShareBtn");
    if (shareBtn) {
      shareBtn.addEventListener("click", () => this.sharePublicReport());
    }

    // Public Copy WhatsApp text
    const copyWaBtn = document.getElementById("publicCopyWaBtn");
    if (copyWaBtn) {
      copyWaBtn.addEventListener("click", () => this.copyWhatsAppText());
    }
  },

  setupRoleTabs() {
    const roleBtns = document.querySelectorAll(".role-tab-btn");
    roleBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-role") === this.activeRole);
    });
  },

  populateDistrictSelect() {
    const distSelect = document.getElementById("stakeholderDistrictSelect");
    if (!distSelect) return;

    fetch("/api/map/districts")
      .then((r) => r.json())
      .then((districts) => {
        distSelect.innerHTML = "";
        districts.forEach((d) => {
          const opt = document.createElement("option");
          opt.value = d.name;
          opt.textContent = `${d.name} (${d.state})`;
          if (d.name.toLowerCase() === this.currentLocation.toLowerCase()) {
            opt.selected = true;
          }
          distSelect.appendChild(opt);
        });
      })
      .catch(() => {
        // Fallback default options
        const defaults = ["Krishna District", "Vijayawada", "Visakhapatnam", "Guntur", "Hyderabad", "Bengaluru Urban", "Mumbai City", "Delhi, NCR"];
        distSelect.innerHTML = defaults.map((d) => `<option value="${d}">${d}</option>`).join("");
      });
  },

  setLeadDay(day, shouldFetch = true) {
    this.currentLeadDay = day;
    const pills = document.querySelectorAll(".sync-lead-day-pills .lead-day-pill");
    pills.forEach((p) => {
      p.classList.toggle("active", parseInt(p.getAttribute("data-day"), 10) === day);
    });

    if (shouldFetch) {
      this.loadActivePortalData();
    }
  },

  onDistrictChanged(newLoc) {
    this.currentLocation = newLoc;
    window.currentSelectedLocation = newLoc;
    localStorage.setItem("weathertrust-selected-location", JSON.stringify({ name: newLoc }));

    // Sync header input if present
    const headerInput = document.getElementById("citySearchInput");
    if (headerInput) headerInput.value = newLoc;

    this.loadActivePortalData();
  },

  switchRole(roleName, shouldFetch = true) {
    this.activeRole = roleName;
    localStorage.setItem("weathertrust_active_role", roleName);

    // Update Tab UI
    const roleBtns = document.querySelectorAll(".role-tab-btn");
    roleBtns.forEach((b) => {
      b.classList.toggle("active", b.getAttribute("data-role") === roleName);
    });

    // Update Active Portal View
    const portalViews = document.querySelectorAll(".portal-role-container");
    portalViews.forEach((view) => {
      view.classList.toggle("active", view.id === `portal-${roleName}`);
    });

    // Update Operator Banner
    this.updateOperatorBanner(roleName);

    if (shouldFetch) {
      this.loadActivePortalData();
    }
  },

  updateOperatorBanner(role) {
    const nameEl = document.getElementById("operatorNameBadge");
    const roleEl = document.getElementById("operatorRoleBadge");
    const avatarEl = document.getElementById("operatorAvatarIcon");

    const roleMap = {
      forecaster: { name: "Dr. Sunita Rao", role: "Senior Meteorologist — IMD / MoES", icon: "🔬" },
      disaster: { name: "Col. Vikramaditya Singh", role: "Chief Operations Officer — NDMA / SDMA", icon: "🚨" },
      agriculture: { name: "Dr. K. Swaminathan", role: "Director of Agro-Meteorology — ICAR", icon: "🌾" },
      public: { name: "Citizen Observer", role: "Public Transparency Portal", icon: "👥" },
      admin: { name: "HPC System Administrator", role: "Platform Super Administrator — NCMRWF", icon: "⚙️" },
    };

    const info = roleMap[role] || roleMap.forecaster;
    if (nameEl) nameEl.textContent = info.name;
    if (roleEl) roleEl.textContent = info.role;
    if (avatarEl) avatarEl.textContent = info.icon;
  },

  loadActivePortalData() {
    const loc = this.currentLocation || window.currentSelectedLocation || "Krishna District";
    const day = this.currentLeadDay || 6;
    const role = this.activeRole || "forecaster";

    if (this._activeFetchController) {
      this._activeFetchController.abort();
    }
    const controller = new AbortController();
    this._activeFetchController = controller;

    if (role === "admin") {
      fetch("/api/stakeholder/admin", { signal: controller.signal })
        .then(async (r) => {
          if (!r.ok) {
            const errText = await r.text().catch(() => "");
            throw new Error(`HTTP ${r.status}: ${errText || r.statusText}`);
          }
          return r.json();
        })
        .then((data) => {
          this.cachedData.admin = data;
          this.clearPortalError("admin");
          this.renderAdminPortal(data);
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          console.error("[StakeholderUI] Admin fetch error:", err);
          this.renderPortalError("admin", err.message, loc);
        });
      return;
    }

    let endpoint = `/api/stakeholder/${role}?location=${encodeURIComponent(loc)}&lead_day=${day}`;
    if (window.selectedLocation && (window.selectedLocation.place === loc || window.selectedLocation.district === loc || window.selectedLocation.displayName === loc)) {
      if (window.selectedLocation.latitude !== null && window.selectedLocation.longitude !== null) {
        endpoint += `&lat=${window.selectedLocation.latitude}&lon=${window.selectedLocation.longitude}`;
      }
    } else if (window.currentSelectedLat && window.currentSelectedLon) {
      endpoint += `&lat=${window.currentSelectedLat}&lon=${window.currentSelectedLon}`;
    }

    fetch(endpoint, { signal: controller.signal })
      .then(async (r) => {
        if (!r.ok) {
          const errText = await r.text().catch(() => "");
          throw new Error(`HTTP ${r.status}: ${errText || r.statusText}`);
        }
        return r.json();
      })
      .then((data) => {
        this.cachedData[role] = data;
        this.clearPortalError(role);
        if (role === "forecaster") this.renderForecasterPortal(data);
        else if (role === "disaster") this.renderDisasterPortal(data);
        else if (role === "agriculture") this.renderAgriculturePortal(data);
        else if (role === "public") this.renderPublicPortal(data);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.error(`[StakeholderUI] ${role} fetch error:`, err);
        this.renderPortalError(role, err.message, loc);
      });
  },

  renderPortalError(role, errorMsg, location) {
    const container = document.getElementById(`portal-${role}`);
    if (!container) return;
    let alertBox = container.querySelector(".stakeholder-error-banner");
    if (!alertBox) {
      alertBox = document.createElement("div");
      alertBox.className = "stakeholder-error-banner";
      alertBox.style.cssText = "background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; color: #fca5a5; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center;";
      container.prepend(alertBox);
    }
    alertBox.innerHTML = `
      <div>
        <strong>Operational Data Unavailable:</strong> Unable to load ${role} portal data for <em>${location}</em> (${errorMsg}).
      </div>
      <button onclick="StakeholderUI.loadActivePortalData()" class="btn btn-sm btn-outline-neutral" style="padding: 4px 10px; font-size: 0.75rem; cursor: pointer;">
        🔄 Retry
      </button>
    `;
  },

  clearPortalError(role) {
    const container = document.getElementById(`portal-${role}`);
    if (!container) return;
    const alertBox = container.querySelector(".stakeholder-error-banner");
    if (alertBox) alertBox.remove();
  },

  // =========================================================================
  // 1. RENDER FORECASTER PORTAL
  // =========================================================================
  renderForecasterPortal(d) {
    // 1. KPI Cards
    const confVal = document.getElementById("fcKpiConfidence");
    if (confVal) confVal.textContent = `${d.forecast_confidence_pct}%`;

    const bustVal = document.getElementById("fcKpiBustProb");
    if (bustVal) bustVal.textContent = `${d.bust_probability_pct}%`;

    const relDistVal = document.getElementById("fcKpiReliableDistricts");
    if (relDistVal) relDistVal.textContent = `${d.reliable_districts_count} (${d.reliable_districts_pct}%)`;

    const highUncertVal = document.getElementById("fcKpiHighUncertainty");
    if (highUncertVal) highUncertVal.textContent = `${d.high_uncertainty_districts_count}`;

    // 2. Forecaster Live Leaflet Confidence Map
    this.renderForecasterMap(d.focus_lead_day);

    // 3. Model vs AI Comparison
    const mAi = d.model_vs_ai || {};
    const rawRain = document.getElementById("fcRawNwpRain");
    if (rawRain) rawRain.textContent = `${mAi.raw_nwp_rainfall_mm || 0} mm`;

    const aiRain = document.getElementById("fcAiCalibratedRain");
    if (aiRain) aiRain.textContent = `${mAi.ai_calibrated_rainfall_mm || 0} mm`;

    const biasCorr = document.getElementById("fcBiasCorrection");
    if (biasCorr) biasCorr.textContent = `${mAi.net_bias_correction_mm > 0 ? "+" : ""}${mAi.net_bias_correction_mm || 0} mm`;

    const farRate = document.getElementById("fcFalseAlarmRate");
    if (farRate) farRate.textContent = `${mAi.false_alarm_ratio || 0}`;

    // 4. Ensemble Consensus Matrix
    const ensembleTable = document.getElementById("fcEnsembleTableBody");
    if (ensembleTable && d.ensemble_consensus) {
      ensembleTable.innerHTML = d.ensemble_consensus
        .map(
          (m) => `
        <tr>
          <td><strong style="color: #f8fafc;">${m.model_name}</strong></td>
          <td><span style="color: #38bdf8; font-weight: 700;">${m.rainfall_mm} mm</span></td>
          <td>${m.temperature_c} °C</td>
          <td>${m.wind_kmh} km/h</td>
          <td><span class="badge ${m.confidence_pct >= 70 ? "badge-risk-low" : "badge-risk-mod"}">${m.confidence_pct}%</span></td>
          <td><span style="font-size: 0.75rem; color: #94a3b8;">${m.status}</span></td>
        </tr>
      `
        )
        .join("");
    }

    // 5. SHAP Explainability Decomposition
    const shapContainer = document.getElementById("fcShapFeaturesList");
    if (shapContainer && d.shap_explainability) {
      shapContainer.innerHTML = d.shap_explainability
        .map(
          (f) => `
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; padding: 12px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <strong style="color: #f8fafc; font-size: 0.825rem;">${f.feature_name}</strong>
            <span class="badge ${f.severity === "high" ? "badge-risk-high" : f.severity === "moderate" ? "badge-risk-mod" : "badge-risk-low"}">
              Weight ${f.importance_pct}%
            </span>
          </div>
          <p style="font-size: 0.775rem; color: #94a3b8; margin: 0; line-height: 1.4;">${f.description}</p>
        </div>
      `
        )
        .join("");
    }

    // 6. Forecast Drift Monitor
    const drift = d.forecast_drift || {};
    const driftValEl = document.getElementById("fcDriftShiftVal");
    if (driftValEl) driftValEl.textContent = drift.drift_str || "+0.0 mm";

    const driftStabEl = document.getElementById("fcDriftStabilityBadge");
    if (driftStabEl) {
      driftStabEl.textContent = `${drift.stability || "MODERATE"} STABILITY`;
      driftStabEl.className = `badge ${drift.stability === "HIGH" ? "badge-risk-low" : drift.stability === "LOW" ? "badge-risk-high" : "badge-risk-mod"}`;
    }

    // 7. Uncertainty Heatmap (Day 1-10 x 4 parameters)
    const heatmapTable = document.getElementById("fcUncertaintyHeatmapTable");
    if (heatmapTable && d.uncertainty_heatmap) {
      this.renderUncertaintyHeatmap(d.uncertainty_heatmap);
    }

    // 8. 10-Day Confidence Trend Chart
    if (d.confidence_trend) {
      this.renderForecasterTrendChart(d.confidence_trend);
    }

    // 9. Operational Briefing
    const brief = d.operational_briefing || {};
    const briefTitle = document.getElementById("fcBriefingTitle");
    if (briefTitle) briefTitle.textContent = brief.headline || "Operational Synoptic Assessment";

    const briefText = document.getElementById("fcBriefingSynopsis");
    if (briefText) briefText.textContent = brief.synopsis || "Analyzing atmospheric consistency...";

    const briefGuidance = document.getElementById("fcChiefGuidance");
    if (briefGuidance) briefGuidance.textContent = brief.chief_meteorologist_guidance || "Standard operational guidelines.";
  },

  renderForecasterMap(leadDay) {
    const mapContainer = document.getElementById("forecasterConfidenceMap");
    if (!mapContainer || typeof L === "undefined") return;

    if (!this.forecasterMap) {
      this.forecasterMap = L.map("forecasterConfidenceMap", {
        center: [20.5937, 78.9629],
        zoom: 4,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap',
        maxZoom: 18,
      }).addTo(this.forecasterMap);
    }

    // Clear previous markers
    if (this.forecasterMarkerLayer) {
      this.forecasterMap.removeLayer(this.forecasterMarkerLayer);
    }
    this.forecasterMarkerLayer = L.layerGroup().addTo(this.forecasterMap);

    fetch(`/api/map/india-reliability?day=${leadDay}`)
      .then((r) => r.json())
      .then((districts) => {
        districts.forEach((d) => {
          const lat = d.lat;
          const lon = d.lon;
          const score = d.reliability.reliability_score;
          const bust = d.reliability.bust_probability_pct;
          const color = d.reliability.color || (score >= 60 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444");

          const circle = L.circleMarker([lat, lon], {
            radius: 8,
            fillColor: color,
            color: "#ffffff",
            weight: 1.5,
            opacity: 0.9,
            fillOpacity: 0.85,
          });

          circle.bindPopup(`
            <div style="font-family: sans-serif; min-width: 160px; color: #0b1120;">
              <strong style="font-size: 0.95rem;">${d.name}</strong><br>
              <span style="font-size: 0.8rem; color: #475569;">${d.state}</span>
              <hr style="margin: 6px 0; border: 0; border-top: 1px solid #cbd5e1;">
              <div style="font-size: 0.8rem;">Confidence: <strong>${score}%</strong></div>
              <div style="font-size: 0.8rem;">Bust Risk: <strong>${bust}%</strong></div>
              <div style="font-size: 0.8rem;">Rain: <strong>${d.weather.rainfall || 0} mm</strong></div>
              <button onclick="StakeholderUI.onDistrictChanged('${d.name}')" style="margin-top: 8px; width: 100%; padding: 4px; background: #0284c7; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                Select District
              </button>
            </div>
          `);

          this.forecasterMarkerLayer.addLayer(circle);
        });

        // Invalidate size to ensure crisp display
        setTimeout(() => this.forecasterMap.invalidateSize(), 150);
      });
  },

  renderUncertaintyHeatmap(data) {
    const table = document.getElementById("fcUncertaintyHeatmapTable");
    if (!table) return;

    const params = ["Precipitation", "Surface Temperature", "Wind Speed", "Barometric Pressure"];
    let html = `<thead><tr><th style="text-align: left; width: 140px;">Parameter</th>`;
    for (let d = 1; d <= 10; d++) {
      html += `<th>Day ${d}</th>`;
    }
    html += `</tr></thead><tbody>`;

    params.forEach((param) => {
      html += `<tr><td style="text-align: left; font-weight: 600; color: #f8fafc;">${param}</td>`;
      for (let d = 1; d <= 10; d++) {
        const item = data.find((x) => x.parameter === param && x.lead_day === d);
        if (item) {
          const cls = item.uncertainty_level === "LOW" ? "cell-low" : item.uncertainty_level === "MODERATE" ? "cell-moderate" : item.uncertainty_level === "HIGH" ? "cell-high" : "cell-extreme";
          html += `<td><div class="heatmap-cell ${cls}" title="${item.uncertainty_level}: ±${item.spread_value} ${item.unit}">${item.spread_value} <span style="font-size: 0.6rem;">${item.unit}</span></div></td>`;
        } else {
          html += `<td>-</td>`;
        }
      }
      html += `</tr>`;
    });

    html += `</tbody>`;
    table.innerHTML = html;
  },

  renderForecasterTrendChart(trendData) {
    const canvas = document.getElementById("fcConfidenceTrendCanvas");
    if (!canvas || typeof Chart === "undefined") return;

    if (this.charts.forecasterTrend) {
      this.charts.forecasterTrend.destroy();
    }

    const labels = trendData.map((t) => `${t.day_name} (${t.date})`);
    const confScores = trendData.map((t) => t.confidence_score);
    const upperCi = trendData.map((t) => t.upper_ci);
    const lowerCi = trendData.map((t) => t.lower_ci);

    const ctx = canvas.getContext("2d");
    this.charts.forecasterTrend = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Forecast Confidence (%)",
            data: confScores,
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56, 189, 248, 0.15)",
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: "#38bdf8",
            pointRadius: 5,
          },
          {
            label: "Upper 95% Bound",
            data: upperCi,
            borderColor: "rgba(56, 189, 248, 0.3)",
            borderDash: [5, 5],
            borderWidth: 1.5,
            fill: false,
            pointRadius: 0,
          },
          {
            label: "Lower 95% Bound",
            data: lowerCi,
            borderColor: "rgba(239, 68, 68, 0.3)",
            borderDash: [5, 5],
            borderWidth: 1.5,
            fill: false,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: "#94a3b8", font: { size: 11 } },
          },
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#94a3b8", callback: (v) => `${v}%` },
          },
          x: {
            grid: { color: "rgba(255, 255, 255, 0.05)" },
            ticks: { color: "#94a3b8" },
          },
        },
      },
    });
  },

  // =========================================================================
  // 2. RENDER DISASTER MANAGEMENT PORTAL
  // =========================================================================
  renderDisasterPortal(d) {
    // 1. KPI Cards
    const redCount = document.getElementById("dmKpiRedAlerts");
    if (redCount) redCount.textContent = d.red_alert_districts_count || "0";

    const popRisk = document.getElementById("dmKpiPopAtRisk");
    if (popRisk) popRisk.textContent = (d.population_at_risk_total || 0).toLocaleString();

    const critZones = document.getElementById("dmKpiCritRainZones");
    if (critZones) critZones.textContent = d.critical_rainfall_zones_count || "0";

    const activeSys = document.getElementById("dmKpiActiveSystems");
    if (activeSys) activeSys.textContent = d.active_weather_systems_count || "1";

    // 2. 72-Hour Impact Forecast
    const p1El = document.getElementById("dmPhase1Card");
    const p2El = document.getElementById("dmPhase2Card");
    const p3El = document.getElementById("dmPhase3Card");

    if (d.impact_timeline_72h && d.impact_timeline_72h.length >= 3) {
      const renderPhase = (container, phaseData) => {
        if (!container) return;
        container.innerHTML = `
          <div class="phase-header-row">
            <span class="phase-title">${phaseData.phase}</span>
            <span class="phase-badge ${phaseData.severity === "CRITICAL" ? "badge-risk-high" : phaseData.severity === "HIGH ALERT" ? "badge-risk-high" : "badge-risk-mod"}">${phaseData.severity}</span>
          </div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #f8fafc; margin-bottom: 4px;">
            ${phaseData.rainfall_mm} mm <span style="font-size: 0.8rem; color: #94a3b8; font-weight: 500;">/ Max Wind ${phaseData.max_wind_kmh} km/h</span>
          </div>
          <div style="font-size: 0.8rem; color: #38bdf8; font-weight: 600; margin-bottom: 8px;">${phaseData.hazard_type}</div>
          <div style="font-size: 0.775rem; color: #cbd5e1; line-height: 1.4; background: rgba(0,0,0,0.25); padding: 8px; border-radius: 6px;">
            <strong>Action:</strong> ${phaseData.recommended_action}
          </div>
        `;
      };

      renderPhase(p1El, d.impact_timeline_72h[0]);
      renderPhase(p2El, d.impact_timeline_72h[1]);
      renderPhase(p3El, d.impact_timeline_72h[2]);
    }

    // 3. Disaster Flood Risk Leaflet Map
    this.renderDisasterMap(d.flood_risk_map_data);

    // 4. High-Risk District Ranking Table
    const tableBody = document.getElementById("dmDistrictRankingTableBody");
    if (tableBody && d.high_risk_districts) {
      tableBody.innerHTML = d.high_risk_districts
        .map(
          (dist, idx) => `
        <tr>
          <td><span style="font-weight: 800; color: #94a3b8;">#${idx + 1}</span></td>
          <td><strong style="color: #f8fafc;">${dist.name}</strong><br><span style="font-size: 0.7rem; color: #64748b;">${dist.state}</span></td>
          <td><span class="badge ${dist.alert_level === "RED" ? "badge-risk-high" : dist.alert_level === "ORANGE" ? "badge-risk-mod" : "badge-risk-low"}">${dist.alert_level}</span></td>
          <td><span style="color: #38bdf8; font-weight: 700;">${dist.expected_rainfall_mm} mm</span></td>
          <td>${dist.wind_speed_kmh} km/h</td>
          <td><span style="color: ${dist.bust_risk_pct >= 50 ? "#ef4444" : "#10b981"}; font-weight: 700;">${dist.bust_risk_pct}%</span></td>
          <td>${dist.population_at_risk.toLocaleString()}</td>
          <td><span style="font-size: 0.75rem; color: #cbd5e1;">${dist.key_threat}</span></td>
          <td>
            <button onclick="StakeholderUI.onDistrictChanged('${dist.name}')" class="btn btn-sm btn-outline-neutral" style="padding: 2px 8px; font-size: 0.7rem;">
              Focus
            </button>
          </td>
        </tr>
      `
        )
        .join("");
    }

    // 5. Cyclone & Heatwave Risk Monitor
    const cyc = d.cyclone_risk_monitor || {};
    const cycName = document.getElementById("dmCycloneName");
    if (cycName) cycName.textContent = cyc.active_system_name || "Normal Trough";

    const cycPress = document.getElementById("dmCyclonePressure");
    if (cycPress) cycPress.textContent = `${cyc.central_pressure_hpa || 1012} hPa (Drop: ${cyc.pressure_drop_hpa || 0} hPa)`;

    const cycWind = document.getElementById("dmCycloneWind");
    if (cycWind) cycWind.textContent = `${cyc.max_sustained_winds_kmh || 30} km/h`;

    const cycSurge = document.getElementById("dmCycloneSurge");
    if (cycSurge) cycSurge.textContent = cyc.coastal_surge_warning || "Normal Tide";

    // 6. Resource Allocations
    const resList = document.getElementById("dmResourceAllocationsList");
    if (resList && d.resource_allocations) {
      resList.innerHTML = d.resource_allocations
        .map(
          (r) => `
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; padding: 12px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #f8fafc; font-size: 0.85rem;">${r.resource_type}</strong>
            <span class="badge ${r.urgency === "IMMEDIATE" ? "badge-risk-high" : "badge-risk-mod"}">${r.urgency}</span>
          </div>
          <div style="color: #38bdf8; font-size: 0.8rem; font-weight: 600;">Qty: ${r.quantity}</div>
          <div style="color: #94a3b8; font-size: 0.75rem; margin-top: 2px;">Target Zone: ${r.target_zone} — Status: ${r.readiness_status}</div>
        </div>
      `
        )
        .join("");
    }

    // 7. Evacuation Decision Support
    const evac = d.evacuation_decision || {};
    const evacHeadline = document.getElementById("dmEvacHeadline");
    if (evacHeadline) evacHeadline.textContent = evac.recommendation_headline || "Monitor Situation";

    const evacRationale = document.getElementById("dmEvacRationale");
    if (evacRationale) evacRationale.textContent = evac.confidence_rationale || "";

    const evacPop = document.getElementById("dmEvacPopTarget");
    if (evacPop) evacPop.textContent = evac.target_population_bracket || "";

    // 8. Emergency SITREP
    const sitrep = d.emergency_sitrep || {};
    const sitrepNum = document.getElementById("dmSitrepNumber");
    if (sitrepNum) sitrepNum.textContent = sitrep.report_number || "SITREP-01";

    const sitrepSummary = document.getElementById("dmSitrepSummary");
    if (sitrepSummary) sitrepSummary.textContent = sitrep.executive_summary || "";
  },

  renderDisasterMap(floodData) {
    const mapContainer = document.getElementById("disasterFloodMap");
    if (!mapContainer || typeof L === "undefined") return;

    if (!this.disasterMap) {
      this.disasterMap = L.map("disasterFloodMap", {
        center: [17.0, 81.0],
        zoom: 6,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 18,
      }).addTo(this.disasterMap);
    }

    if (this.disasterMarkerLayer) {
      this.disasterMap.removeLayer(this.disasterMarkerLayer);
    }
    this.disasterMarkerLayer = L.layerGroup().addTo(this.disasterMap);

    if (floodData) {
      floodData.forEach((f) => {
        const radius = Math.max(12, Math.min(30, f.rain_mm * 0.4));
        const circle = L.circle([f.lat, f.lon], {
          radius: radius * 1000,
          color: f.color,
          fillColor: f.color,
          fillOpacity: 0.45,
          weight: 2,
        });

        circle.bindPopup(`
          <div style="font-family: sans-serif; min-width: 150px; color: #0b1120;">
            <strong style="font-size: 0.95rem;">${f.district} (${f.state})</strong><br>
            <span style="font-weight: 700; color: ${f.color};">Alert: ${f.alert_level}</span>
            <hr style="margin: 6px 0; border: 0; border-top: 1px solid #cbd5e1;">
            <div>Expected Rain: <strong>${f.rain_mm} mm</strong></div>
            <div>Flood Risk Index: <strong>${f.flood_index} / 100</strong></div>
          </div>
        `);

        this.disasterMarkerLayer.addLayer(circle);
      });

      setTimeout(() => this.disasterMap.invalidateSize(), 150);
    }
  },

  // =========================================================================
  // 3. RENDER AGRICULTURE PORTAL
  // =========================================================================
  renderAgriculturePortal(d) {
    // 1. KPI Cards
    const relAgri = document.getElementById("agKpiReliableDistricts");
    if (relAgri) relAgri.textContent = `${d.reliable_rainfall_districts_count || 14} Districts`;

    const cropRisk = document.getElementById("agKpiCropRisk");
    if (cropRisk) cropRisk.textContent = d.crop_risk_level || "Moderate";

    const irrigNeed = document.getElementById("agKpiIrrigationNeed");
    if (irrigNeed) irrigNeed.textContent = d.irrigation_need || "Postpone";

    const rainConf = document.getElementById("agKpiRainConfidence");
    if (rainConf) rainConf.textContent = `${d.rainfall_reliability_score || 72}%`;

    // 2. Soil Moisture & Sowing Advisory
    const soilMoist = document.getElementById("agSoilMoistureVal");
    if (soilMoist) soilMoist.textContent = `${d.soil_moisture_pct}%`;

    const soilStatus = document.getElementById("agSoilMoistureStatus");
    if (soilStatus) soilStatus.textContent = d.soil_moisture_status || "Optimal Field Capacity";

    const sow = d.sowing_advisory || {};
    const sowTitle = document.getElementById("agSowingWindowTitle");
    if (sowTitle) sowTitle.textContent = sow.window_status || "Optimal Sowing Window";

    const sowGuide = document.getElementById("agSowingGuidance");
    if (sowGuide) sowGuide.textContent = sow.guidance || "";

    const sowCrops = document.getElementById("agSowingCropsList");
    if (sowCrops && sow.optimal_crops) {
      sowCrops.innerHTML = sow.optimal_crops.map((c) => `<span class="badge badge-neutral" style="margin-right: 6px; margin-bottom: 6px;">${c}</span>`).join("");
    }

    // 3. Irrigation Recommendation
    const irrig = d.irrigation_recommendation || {};
    const irrigAction = document.getElementById("agIrrigActionTitle");
    if (irrigAction) irrigAction.textContent = irrig.recommendation || "Postpone Irrigation";

    const irrigDetail = document.getElementById("agIrrigDetail");
    if (irrigDetail) irrigDetail.textContent = irrig.detail || "";

    const irrigSaved = document.getElementById("agIrrigWaterSaved");
    if (irrigSaved) irrigSaved.textContent = `${irrig.estimated_water_saved_m3_per_hectare || 0} m³/ha`;

    // 4. Crop Stress Indicators
    const stress = d.crop_stress_indicators || {};
    const heatStress = document.getElementById("agThermalStressVal");
    if (heatStress) heatStress.textContent = stress.thermal_heat_stress || "Low";

    const moistStress = document.getElementById("agMoistStressVal");
    if (moistStress) moistStress.textContent = stress.soil_moisture_stress || "Optimal";

    const waterlogRisk = document.getElementById("agWaterlogRiskVal");
    if (waterlogRisk) waterlogRisk.textContent = stress.waterlogging_risk || "Low";

    // 5. Weekly Agricultural Calendar (7 Days)
    const calendarGrid = document.getElementById("agWeeklyCalendarGrid");
    if (calendarGrid && d.weekly_outlook) {
      calendarGrid.innerHTML = d.weekly_outlook
        .map(
          (day) => `
        <div class="agro-day-card">
          <div class="agro-day-name">${day.day_name.substring(0, 3)}</div>
          <div class="agro-day-date">${day.date_str}</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: #38bdf8; margin: 4px 0;">${day.expected_rain_mm} mm</div>
          <div style="font-size: 0.7rem; color: #94a3b8;">Rain Prob: ${day.rain_probability_pct}%</div>
          <div style="font-size: 0.7rem; color: #f59e0b; margin-top: 2px;">Soil: ${day.soil_moisture_pct}%</div>
          <div style="margin-top: 8px; font-size: 0.65rem;">
            <div style="color: ${day.spraying_status.includes("Prohibited") ? "#ef4444" : "#10b981"}; font-weight: 600;">Spray: ${day.spraying_status.split(" ")[0]}</div>
            <div style="color: #cbd5e1; margin-top: 2px;">${day.irrigation_advice}</div>
          </div>
        </div>
      `
        )
        .join("");
    }

    // 6. District Crop Impacts
    const cropList = document.getElementById("agCropImpactsList");
    if (cropList && d.crop_impacts) {
      cropList.innerHTML = d.crop_impacts
        .map(
          (c) => `
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; padding: 12px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #10b981; font-size: 0.9rem;">${c.crop_name}</strong>
            <span style="font-size: 0.7rem; color: #94a3b8;">${c.season} | ${c.stage}</span>
          </div>
          <div style="font-size: 0.75rem; color: #f59e0b; margin: 4px 0;">Vulnerability: ${c.vulnerability}</div>
          <p style="font-size: 0.775rem; color: #cbd5e1; margin: 0; line-height: 1.4;"><strong>Advisory:</strong> ${c.advisory}</p>
        </div>
      `
        )
        .join("");
    }
  },

  // =========================================================================
  // 4. RENDER PUBLIC PORTAL
  // =========================================================================
  renderPublicPortal(d) {
    // 1. KPI Cards
    const curTemp = document.getElementById("pubKpiCurTemp");
    if (curTemp) curTemp.textContent = `${d.current_temperature_c} °C`;

    const rainProb = document.getElementById("pubKpiRainProb");
    if (rainProb) rainProb.textContent = `${d.rain_probability_pct}%`;

    const confScore = document.getElementById("pubKpiConfidence");
    if (confScore) confScore.textContent = `${d.confidence_score_pct}%`;

    const alertStatus = document.getElementById("pubKpiAlertStatus");
    if (alertStatus) {
      alertStatus.textContent = d.alert_status.split("—")[0].trim();
      alertStatus.style.color = d.alert_color || "#10b981";
    }

    // 2. Weather Overview Card
    const mainTemp = document.getElementById("pubHeroTemp");
    if (mainTemp) mainTemp.textContent = `${d.current_temperature_c} °C`;

    const feelsLike = document.getElementById("pubFeelsLike");
    if (feelsLike) feelsLike.textContent = `Feels like ${d.feels_like_c} °C`;

    const condText = document.getElementById("pubWeatherCondition");
    if (condText) condText.textContent = d.weather_condition;

    const comfortBadge = document.getElementById("pubComfortIndexBadge");
    if (comfortBadge) comfortBadge.textContent = d.comfort_index;

    const windHumid = document.getElementById("pubWindHumidity");
    if (windHumid) windHumid.textContent = `Wind: ${d.wind_kmh} km/h ${d.wind_direction} | Humidity: ${d.humidity_pct}%`;

    const uvEl = document.getElementById("pubUvIndexBadge");
    if (uvEl) uvEl.textContent = `UV Index: ${d.uv_index} (${d.uv_level})`;

    // 3. Citizen Confidence Meter
    const meterDesc = document.getElementById("pubConfidenceMeterText");
    if (meterDesc && d.confidence_meter) {
      meterDesc.textContent = d.confidence_meter.description;
    }

    // 4. 10-Day Citizen Forecast Grid
    const cardsGrid = document.getElementById("pub10DayCardsGrid");
    if (cardsGrid && d.forecast_10_day) {
      const getIconEmoji = (icon) => {
        if (icon.includes("heavy")) return "⛈️";
        if (icon.includes("rain")) return "🌧️";
        if (icon.includes("lightning")) return "⚡";
        if (icon.includes("cloud-sun")) return "⛅";
        if (icon.includes("cloud")) return "☁️";
        return "☀️";
      };

      cardsGrid.innerHTML = d.forecast_10_day
        .map(
          (day) => `
        <div class="public-day-card">
          <div style="font-weight: 700; color: #f8fafc; font-size: 0.85rem;">${day.day_name}</div>
          <div style="font-size: 0.7rem; color: #94a3b8;">${day.date_str}</div>
          <div class="public-day-icon">${getIconEmoji(day.icon)}</div>
          <div class="public-day-temps">${Math.round(day.temp_max)}° <span style="font-size: 0.8rem; color: #64748b;">${Math.round(day.temp_min)}°</span></div>
          <div class="public-day-rain">💧 ${day.rain_chance_pct}% rain</div>
          <span class="badge ${day.confidence_pct >= 70 ? "badge-risk-low" : "badge-risk-mod"}" style="margin-top: 6px; font-size: 0.65rem;">
            ${day.confidence_label.split(" ")[0]}
          </span>
        </div>
      `
        )
        .join("");
    }

    // 5. Hourly Timeline Charts (Rain & Temperature)
    if (d.rainfall_timeline && d.temperature_timeline) {
      this.renderPublicHourlyCharts(d.rainfall_timeline, d.temperature_timeline);
    }

    // 6. Safety Recommendations
    const safetyList = document.getElementById("pubSafetyRecommendationsList");
    if (safetyList && d.safety_recommendations) {
      safetyList.innerHTML = d.safety_recommendations
        .map(
          (rec) => `
        <div style="display: flex; gap: 10px; align-items: flex-start; background: rgba(15, 23, 42, 0.5); padding: 10px; border-radius: 8px; margin-bottom: 6px;">
          <span style="font-size: 1.3rem;">${rec.icon}</span>
          <div>
            <strong style="color: #f8fafc; font-size: 0.825rem;">${rec.title}</strong>
            <p style="font-size: 0.775rem; color: #94a3b8; margin: 2px 0 0 0;">${rec.tip}</p>
          </div>
        </div>
      `
        )
        .join("");
    }
  },

  renderPublicHourlyCharts(rainTimeline, tempTimeline) {
    const rainCanvas = document.getElementById("pubHourlyRainCanvas");
    const tempCanvas = document.getElementById("pubHourlyTempCanvas");
    if (!rainCanvas || !tempCanvas || typeof Chart === "undefined") return;

    if (this.charts.pubRain) this.charts.pubRain.destroy();
    if (this.charts.pubTemp) this.charts.pubTemp.destroy();

    const labels = rainTimeline.slice(0, 12).map((x) => x.time);
    const rainProbs = rainTimeline.slice(0, 12).map((x) => x.rain_prob_pct);
    const temps = tempTimeline.slice(0, 12).map((x) => x.temperature_c);

    // Rain probability chart
    const rCtx = rainCanvas.getContext("2d");
    this.charts.pubRain = new Chart(rCtx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Rain Probability (%)",
            data: rainProbs,
            backgroundColor: "rgba(56, 189, 248, 0.6)",
            borderColor: "#38bdf8",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 0, max: 100, ticks: { color: "#94a3b8", callback: (v) => `${v}%` }, grid: { color: "rgba(255,255,255,0.05)" } },
          x: { ticks: { color: "#94a3b8" }, grid: { display: false } },
        },
      },
    });

    // Temperature chart
    const tCtx = tempCanvas.getContext("2d");
    this.charts.pubTemp = new Chart(tCtx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Temperature (°C)",
            data: temps,
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { ticks: { color: "#94a3b8", callback: (v) => `${v}°C` }, grid: { color: "rgba(255,255,255,0.05)" } },
          x: { ticks: { color: "#94a3b8" }, grid: { display: false } },
        },
      },
    });
  },

  sharePublicReport() {
    const card = (this.cachedData.public && this.cachedData.public.shareable_card) || {};
    if (navigator.share) {
      navigator
        .share({
          title: card.title || "WeatherTrust AI Live Forecast",
          text: card.summary || "Live weather reliability update.",
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      this.copyWhatsAppText();
    }
  },

  copyWhatsAppText() {
    const card = (this.cachedData.public && this.cachedData.public.shareable_card) || {};
    const text = card.whatsapp_text || `Weather in ${this.currentLocation}: Checked via WeatherTrust AI.`;
    navigator.clipboard.writeText(text).then(() => {
      alert("Weather update copied to clipboard! Paste directly into WhatsApp or SMS.");
    });
  },

  // =========================================================================
  // 5. RENDER ADMINISTRATOR PORTAL
  // =========================================================================
  renderAdminPortal(d) {
    // 1. KPI Cards
    const actUsers = document.getElementById("adminKpiActiveUsers");
    if (actUsers) actUsers.textContent = d.active_users_count || "5";

    const respTime = document.getElementById("adminKpiRespTime");
    if (respTime) respTime.textContent = `${d.api_response_time_ms} ms`;

    const modAcc = document.getElementById("adminKpiAccuracy");
    if (modAcc) modAcc.textContent = `${d.model_accuracy_pct}%`;

    const sysHealth = document.getElementById("adminKpiSysHealth");
    if (sysHealth) sysHealth.textContent = `${d.system_health_pct}%`;

    // 2. Users Table
    const userTable = document.getElementById("adminUsersTableBody");
    if (userTable && d.users) {
      userTable.innerHTML = d.users
        .map(
          (u) => `
        <tr>
          <td><strong style="color: #f8fafc;">${u.name}</strong><br><span style="font-size: 0.7rem; color: #64748b;">${u.email}</span></td>
          <td><span class="badge ${u.role === "admin" ? "badge-risk-high" : "badge-risk-low"}">${u.role_display}</span></td>
          <td>${u.agency}</td>
          <td>${u.permissions.map((p) => `<span class="badge badge-neutral" style="font-size: 0.65rem; margin-right: 4px;">${p}</span>`).join("")}</td>
          <td><span style="color: #10b981; font-weight: 700;">● ${u.status}</span></td>
          <td>
            <button onclick="StakeholderUI.switchRole('${u.role}')" class="btn btn-sm btn-outline-neutral" style="padding: 2px 8px; font-size: 0.7rem;">
              Simulate Role
            </button>
          </td>
        </tr>
      `
        )
        .join("");
    }

    // 3. API Monitoring Table
    const apiTable = document.getElementById("adminApiMetricsTableBody");
    if (apiTable && d.api_metrics) {
      apiTable.innerHTML = d.api_metrics
        .map(
          (m) => `
        <tr>
          <td><code style="color: #38bdf8;">${m.endpoint}</code></td>
          <td><span class="badge badge-neutral">${m.method}</span></td>
          <td>${m.requests_per_min} req/m</td>
          <td><strong style="color: #f8fafc;">${m.avg_latency_ms} ms</strong></td>
          <td>${m.p95_latency_ms} ms</td>
          <td><span style="color: #10b981;">${m.cache_hit_pct}%</span></td>
        </tr>
      `
        )
        .join("");
    }

    // 4. Server Logs Terminal
    this.renderLogs(d.recent_logs);
  },

  renderLogs(logs) {
    const logBox = document.getElementById("adminLogsConsole");
    if (!logBox || !logs) return;

    logBox.innerHTML = logs
      .map((l) => {
        const lvlClass = l.level === "ERROR" ? "log-level-err" : l.level === "WARNING" ? "log-level-warn" : "log-level-info";
        return `
        <div class="log-line">
          <span class="log-time">[${l.timestamp}]</span>
          <span class="${lvlClass}">[${l.level}]</span>
          <span class="log-service">&lt;${l.service}&gt;</span>
          <span style="color: #f1f5f9;">${l.message}</span>
        </div>
      `;
      })
      .join("");

    logBox.scrollTop = logBox.scrollHeight;
  },

  filterLogs(level) {
    const logs = (this.cachedData.admin && this.cachedData.admin.recent_logs) || [];
    if (level === "ALL") {
      this.renderLogs(logs);
    } else {
      this.renderLogs(logs.filter((l) => l.level === level));
    }
  },

  triggerModelRetrain() {
    const nEst = parseInt(document.getElementById("adminEstimatorsInput")?.value || "150", 10);
    const lr = parseFloat(document.getElementById("adminLearningRateInput")?.value || "0.05");
    const method = document.getElementById("adminCalibrationMethodSelect")?.value || "sigmoid";
    const statusBox = document.getElementById("adminRetrainStatusAlert");

    if (statusBox) {
      statusBox.style.display = "block";
      statusBox.className = "recommendation-card";
      statusBox.innerHTML = `<strong>Retraining in progress...</strong> Optimizing ${nEst} decision trees with ${method} calibration.`;
    }

    fetch("/api/stakeholder/admin/retrain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ n_estimators: nEst, learning_rate: lr, calibration_method: method }),
    })
      .then((r) => r.json())
      .then((resp) => {
        if (statusBox) {
          statusBox.innerHTML = `
            <strong style="color: #10b981;">✓ Model Retraining Completed!</strong><br>
            New Accuracy: <strong>${resp.new_accuracy}%</strong> (Gain: +${(resp.new_accuracy - resp.previous_accuracy).toFixed(2)}%) | ROC-AUC: <strong>${resp.roc_auc}</strong> | Duration: ${resp.training_duration_sec}s
          `;
        }
        // Refresh admin data
        this.loadActivePortalData();
      })
      .catch((err) => {
        if (statusBox) statusBox.innerHTML = `<strong style="color: #ef4444;">Retraining failed:</strong> ${err.message}`;
      });
  },

  handleDatasetUpload(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const summaryBox = document.getElementById("adminDatasetSummaryBox");
    if (summaryBox) {
      summaryBox.style.display = "block";
      summaryBox.innerHTML = `<em>Reading and parsing ${file.name}...</em>`;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      fetch("/api/stakeholder/admin/upload-dataset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, content: content }),
      })
        .then((r) => r.json())
        .then((resp) => {
          if (summaryBox) {
            summaryBox.innerHTML = `
              <strong style="color: #10b981;">✓ Dataset Ingested Successfully!</strong><br>
              Records: <strong>${resp.records_processed}</strong> | Columns: <code>${resp.columns_detected.join(", ")}</code><br>
              Integrity: <strong>${resp.summary.data_completeness_pct}%</strong> (${resp.summary.validation_note})
            `;
          }
        })
        .catch((err) => {
          if (summaryBox) summaryBox.innerHTML = `<strong style="color: #ef4444;">Upload error:</strong> ${err.message}`;
        });
    };
    reader.readAsText(file);
  },

  triggerBackup() {
    fetch("/api/stakeholder/admin/backup", { method: "POST" })
      .then((r) => r.json())
      .then((data) => {
        alert(`System backup snapshot created successfully!\nSnapshot ID: ${data.snapshot_id}\nSize: ${data.size_kb} KB`);
      })
      .catch(() => alert("Backup creation failed. Check server logs."));
  },

  // =========================================================================
  // EXPORT UTILITIES (CSV & PDF)
  // =========================================================================
  exportForecasterCSV() {
    const d = this.cachedData.forecaster;
    if (!d || !d.ensemble_consensus) {
      alert("Loading forecast data, please wait...");
      return;
    }

    let csv = "Model,Rainfall_mm,Temperature_C,Wind_kmh,Confidence_pct,Status\n";
    d.ensemble_consensus.forEach((m) => {
      csv += `"${m.model_name}",${m.rainfall_mm},${m.temperature_c},${m.wind_kmh},${m.confidence_pct},"${m.status}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `WeatherTrust_Forecaster_${this.currentLocation}_Day${this.currentLeadDay}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportBriefingPDF() {
    window.print();
  },

  exportDisasterSitrep() {
    const sitrep = (this.cachedData.disaster && this.cachedData.disaster.emergency_sitrep) || {};
    const text = `
==============================================================================
NATIONAL DISASTER MANAGEMENT AUTHORITY — EMERGENCY SITREP
==============================================================================
Report ID: ${sitrep.report_number || "SITREP-01"}
Timestamp: ${sitrep.date_time || new Date().toLocaleString()}
Incident:  ${sitrep.incident_name || "Hydro-Meteorological Warning"}
Commander: ${sitrep.duty_incident_commander || "State Relief Commissioner"}
------------------------------------------------------------------------------
EXECUTIVE SUMMARY:
${sitrep.executive_summary || "Routine operational monitoring."}
------------------------------------------------------------------------------
ACTIONS TAKEN:
${(sitrep.key_actions_taken || []).map((a, i) => `${i + 1}. ${a}`).join("\n")}
==============================================================================
    `.trim();

    const blob = new Blob([text], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${sitrep.report_number || "SITREP"}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

// Global hook for navigation.js
window.initStakeholderWorkspace = function () {
  StakeholderUI.init();
};
