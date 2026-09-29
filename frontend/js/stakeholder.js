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
  currentState: "Andhra Pradesh",
  currentDistrict: "NTR",
  currentLocation: "Vijayawada",

  forecasterMap: null,
  disasterMap: null,
  agricultureMap: null,

  forecasterMarkerLayer: null,
  disasterMarkerLayer: null,
  agricultureMarkerLayer: null,

  charts: {},
  cachedData: {},
  cachedStates: [],
  cachedDistricts: {},
  _initialized: false,
  _listenersBound: false,
  _activeFetchController: null,

  init() {
    if (!this._initialized) {
      this.setupEventListeners();
      this.setupRoleTabs();
      this._initialized = true;
    }

    // Resolve initial state & district from global context if available
    this.syncFromGlobalLocation(window.currentSelectedLocation || "Vijayawada");
    this.loadStatesAndDistricts(() => {
      this.setLeadDay(this.currentLeadDay, false);
      this.switchRole(this.activeRole, true);
    });
  },

  setupEventListeners() {
    if (this._listenersBound) return;
    this._listenersBound = true;

    // Lead day pills delegation
    document.addEventListener("click", (e) => {
      const pill = e.target.closest(".sync-lead-day-pills .lead-day-pill");
      if (pill) {
        e.preventDefault();
        const d = parseInt(pill.getAttribute("data-day") || "6", 10);
        this.setLeadDay(d, true);
      }
    });

    // State select dropdown change
    document.addEventListener("change", (e) => {
      if (e.target && e.target.id === "stakeholderStateSelect") {
        this.onStateChanged(e.target.value);
      }
    });

    // District select dropdown change
    document.addEventListener("change", (e) => {
      if (e.target && e.target.id === "stakeholderDistrictSelect") {
        this.onDistrictChanged(e.target.value);
      }
    });

    // Role tabs delegation
    document.addEventListener("click", (e) => {
      const roleBtn = e.target.closest(".role-tab-btn");
      if (roleBtn) {
        e.preventDefault();
        const role = roleBtn.getAttribute("data-role");
        if (role) this.switchRole(role, true);
      }
    });

    // Global Action Buttons Delegation
    document.addEventListener("click", (e) => {
      if (e.target.closest("#forecasterExportCsvBtn")) {
        this.exportForecasterCSV();
      } else if (e.target.closest("#forecasterExportPdfBtn")) {
        this.exportBriefingPDF();
      } else if (e.target.closest("#disasterExportSitrepBtn")) {
        this.exportDisasterSitrep();
      } else if (e.target.closest("#adminRetrainSubmitBtn")) {
        this.triggerModelRetrain();
      } else if (e.target.closest("#adminCreateBackupBtn")) {
        this.triggerBackup();
      } else if (e.target.closest("#publicShareBtn")) {
        this.sharePublicReport();
      } else if (e.target.closest("#publicCopyWaBtn")) {
        this.copyWhatsAppText();
      }
    });

    const datasetInput = document.getElementById("adminDatasetFileInput");
    if (datasetInput) {
      datasetInput.addEventListener("change", (e) => this.handleDatasetUpload(e));
    }

    const logFilter = document.getElementById("adminLogFilter");
    if (logFilter) {
      logFilter.addEventListener("change", (e) => this.filterLogs(e.target.value));
    }
  },

  setupRoleTabs() {
    const roleBtns = document.querySelectorAll(".role-tab-btn");
    roleBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-role") === this.activeRole);
    });
  },

  syncFromGlobalLocation(locStr) {
    if (!locStr) return;
    const clean = String(locStr).trim();
    if (!clean) return;

    // Direct match against known state names
    const cleanLower = clean.toLowerCase();
    if (cleanLower.includes("odisha") || cleanLower.includes("bhubaneswar") || cleanLower.includes("puri") || cleanLower.includes("cuttack")) {
      this.currentState = "Odisha";
      if (cleanLower.includes("puri")) this.currentDistrict = "Puri";
      else if (cleanLower.includes("cuttack")) this.currentDistrict = "Cuttack";
      else this.currentDistrict = "Khordha";
      this.currentLocation = clean;
    } else if (cleanLower.includes("jammu") || cleanLower.includes("kashmir") || cleanLower.includes("srinagar")) {
      this.currentState = "Jammu and Kashmir";
      if (cleanLower.includes("srinagar")) this.currentDistrict = "Srinagar";
      else if (cleanLower.includes("anantnag")) this.currentDistrict = "Anantnag";
      else this.currentDistrict = "Jammu";
      this.currentLocation = clean;
    } else if (cleanLower.includes("maharashtra") || cleanLower.includes("mumbai") || cleanLower.includes("pune") || cleanLower.includes("nagpur")) {
      this.currentState = "Maharashtra";
      if (cleanLower.includes("pune")) this.currentDistrict = "Pune";
      else if (cleanLower.includes("nagpur")) this.currentDistrict = "Nagpur";
      else this.currentDistrict = "Mumbai City";
      this.currentLocation = clean;
    } else if (cleanLower.includes("bihar") || cleanLower.includes("patna") || cleanLower.includes("gaya")) {
      this.currentState = "Bihar";
      if (cleanLower.includes("gaya")) this.currentDistrict = "Gaya";
      else this.currentDistrict = "Patna";
      this.currentLocation = clean;
    } else if (cleanLower.includes("delhi")) {
      this.currentState = "Delhi";
      this.currentDistrict = "New Delhi";
      this.currentLocation = "New Delhi";
    } else if (cleanLower.includes("andhra") || cleanLower.includes("vijayawada") || cleanLower.includes("visakhapatnam") || cleanLower.includes("krishna") || cleanLower.includes("guntur")) {
      this.currentState = "Andhra Pradesh";
      if (cleanLower.includes("visakhapatnam")) this.currentDistrict = "Visakhapatnam";
      else if (cleanLower.includes("guntur")) this.currentDistrict = "Guntur";
      else this.currentDistrict = "NTR";
      this.currentLocation = clean;
    } else {
      this.currentLocation = clean;
    }
  },

  async loadStatesAndDistricts(callback) {
    try {
      if (!this.cachedStates || this.cachedStates.length === 0) {
        const res = await fetch("/api/stakeholder/states");
        if (res.ok) {
          this.cachedStates = await res.json();
        }
      }
    } catch (err) {
      console.warn("[StakeholderUI] Error fetching states:", err);
    }

    const stateSelect = document.getElementById("stakeholderStateSelect");
    if (stateSelect && this.cachedStates.length > 0) {
      stateSelect.innerHTML = this.cachedStates
        .map((s) => `<option value="${s.name}" ${s.name === this.currentState ? "selected" : ""}>${s.name} (${s.official_districts})</option>`)
        .join("");
    }

    await this.fetchAndPopulateDistricts(this.currentState);

    if (typeof callback === "function") {
      callback();
    }
  },

  async fetchAndPopulateDistricts(stateName) {
    const distSelect = document.getElementById("stakeholderDistrictSelect");
    const countBadge = document.getElementById("stakeholderStateCountBadge");

    try {
      let districts = this.cachedDistricts[stateName];
      if (!districts) {
        const res = await fetch(`/api/stakeholder/districts?state=${encodeURIComponent(stateName)}`);
        if (res.ok) {
          districts = await res.json();
          this.cachedDistricts[stateName] = districts;
        }
      }

      if (districts && districts.length > 0) {
        if (distSelect) {
          distSelect.innerHTML = districts
            .map((d) => {
              const isSelected =
                d.name.toLowerCase() === this.currentDistrict.toLowerCase() ||
                (d.city && d.city.toLowerCase() === this.currentDistrict.toLowerCase());
              return `<option value="${d.name}" ${isSelected ? "selected" : ""}>${d.name} ${d.city && d.city !== d.name ? `(${d.city})` : ""}</option>`;
            })
            .join("");

          // If currentDistrict is not in the new state, select the first district
          const hasSelected = districts.some(
            (d) => d.name.toLowerCase() === this.currentDistrict.toLowerCase() || (d.city && d.city.toLowerCase() === this.currentDistrict.toLowerCase())
          );
          if (!hasSelected && districts.length > 0) {
            this.currentDistrict = districts[0].name;
            this.currentLocation = districts[0].city || districts[0].name;
            distSelect.selectedIndex = 0;
          }
        }

        const stateObj = this.cachedStates.find((s) => s.name === stateName);
        const officialCount = stateObj ? stateObj.official_districts : districts.length;
        if (countBadge) {
          countBadge.textContent = `${officialCount} Districts in ${stateName}`;
        }
      }
    } catch (err) {
      console.warn("[StakeholderUI] Error fetching districts for state:", stateName, err);
    }
  },

  async onStateChanged(newState) {
    if (!newState) return;
    this.currentState = newState;
    await this.fetchAndPopulateDistricts(newState);

    const distSelect = document.getElementById("stakeholderDistrictSelect");
    if (distSelect && distSelect.value) {
      this.currentDistrict = distSelect.value;
      const stateDistricts = this.cachedDistricts[newState] || [];
      const dObj = stateDistricts.find((d) => d.name === this.currentDistrict);
      this.currentLocation = dObj ? dObj.city || dObj.name : this.currentDistrict;
    }

    window.currentSelectedLocation = this.currentLocation;
    this.loadActivePortalData();
  },

  onDistrictChanged(newDistrict) {
    if (!newDistrict) return;
    this.currentDistrict = newDistrict;

    const stateDistricts = this.cachedDistricts[this.currentState] || [];
    const dObj = stateDistricts.find(
      (d) => d.name.toLowerCase() === newDistrict.toLowerCase() || (d.city && d.city.toLowerCase() === newDistrict.toLowerCase())
    );
    this.currentLocation = dObj ? dObj.city || dObj.name : newDistrict;
    window.currentSelectedLocation = this.currentLocation;

    this.loadActivePortalData();
  },

  setLeadDay(day, shouldFetch = true) {
    this.currentLeadDay = parseInt(day, 10);
    const pills = document.querySelectorAll(".sync-lead-day-pills .lead-day-pill");
    pills.forEach((p) => {
      const pDay = parseInt(p.getAttribute("data-day"), 10);
      if (pDay === this.currentLeadDay) {
        p.classList.add("active");
      } else {
        p.classList.remove("active");
      }
    });

    if (shouldFetch) {
      this.loadActivePortalData();
    }
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

    // Invalidate active maps
    setTimeout(() => {
      if (roleName === "forecaster" && this.forecasterMap) {
        this.forecasterMap.invalidateSize();
      } else if (roleName === "disaster" && this.disasterMap) {
        this.disasterMap.invalidateSize();
      } else if (roleName === "agriculture" && this.agricultureMap) {
        this.agricultureMap.invalidateSize();
      }
    }, 150);

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
    const state = this.currentState || "Andhra Pradesh";
    const district = this.currentDistrict || "NTR";
    const loc = this.currentLocation || "Vijayawada";
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
          if (err.name === "AbortError") return;
          console.error("[StakeholderUI] Admin fetch error:", err);
          this.renderPortalError("admin", err.message, loc);
        });
      return;
    }

    const endpoint = `/api/stakeholder/${role}?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}&location=${encodeURIComponent(loc)}&lead_day=${day}`;

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
        if (err.name === "AbortError") return;
        console.error(`[StakeholderUI] ${role} fetch error:`, err);
        this.renderPortalError(role, err.message, `${district}, ${state}`);
      });
  },

  renderPortalError(role, errorMsg, location) {
    const container = document.getElementById(`portal-${role}`);
    if (!container) return;
    let alertBox = container.querySelector(".stakeholder-error-banner");
    if (!alertBox) {
      alertBox = document.createElement("div");
      alertBox.className = "stakeholder-error-banner";
      alertBox.style.cssText =
        "background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; color: #fca5a5; font-size: 0.85rem; display: flex; justify-content: space-between; align-items: center;";
      container.prepend(alertBox);
    }
    alertBox.innerHTML = `
      <div>
        <strong>Operational Data Notice:</strong> Loading ${role} intelligence for <em>${location}</em>... (${errorMsg}).
      </div>
      <button onclick="StakeholderUI.loadActivePortalData()" class="btn btn-sm btn-outline-neutral" style="padding: 4px 10px; font-size: 0.75rem; cursor: pointer;">
        🔄 Refresh
      </button>
    `;
  },

  clearPortalError(role) {
    const container = document.getElementById(`portal-${role}`);
    if (!container) return;
    const alertBox = container.querySelector(".stakeholder-error-banner");
    if (alertBox) alertBox.remove();
  },

  // Helper: Create Dark OpenStreetMap Tile Layer
  buildMapTileLayer() {
    return L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 18,
    });
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
    if (relDistVal) relDistVal.textContent = `${d.reliable_districts_count} / ${d.total_state_districts}`;

    const relDistHint = document.getElementById("fcKpiRelDistHint");
    if (relDistHint) relDistHint.textContent = `Districts with Trust Score ≥ 60% in ${d.state}`;

    const highUncertVal = document.getElementById("fcKpiHighUncertainty");
    if (highUncertVal) highUncertVal.textContent = `${d.high_uncertainty_districts_count}`;

    const highUncertHint = document.getElementById("fcKpiHighUncertHint");
    if (highUncertHint) highUncertHint.textContent = `Districts with Bust Probability ≥ 60% in ${d.state}`;

    // 2. Forecaster Embedded Map
    this.renderForecasterMap(d.map_data, d.district, d.state);

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

    // 7. Uncertainty Heatmap
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
    if (briefTitle) briefTitle.textContent = brief.headline || `Operational Synoptic Assessment for ${d.district}, ${d.state}`;

    const briefText = document.getElementById("fcBriefingSynopsis");
    if (briefText) briefText.textContent = brief.synopsis || "Analyzing atmospheric consistency...";

    const briefGuidance = document.getElementById("fcChiefGuidance");
    if (briefGuidance) briefGuidance.textContent = brief.chief_meteorologist_guidance || "Standard operational guidelines.";
  },

  renderForecasterMap(mapData, focusDistrict, stateName) {
    const mapContainer = document.getElementById("forecasterConfidenceMap");
    if (!mapContainer || typeof L === "undefined") return;

    if (!this.forecasterMap) {
      try {
        if (mapContainer._leaflet_id) {
          mapContainer._leaflet_id = null;
        }
        this.forecasterMap = L.map("forecasterConfidenceMap", {
          center: [20.5937, 78.9629],
          zoom: 5,
          zoomControl: true,
        });
        this.buildMapTileLayer().addTo(this.forecasterMap);
      } catch (err) {
        console.warn("[StakeholderUI] Forecaster map init warning:", err);
      }
    }

    if (this.forecasterMap) {
      setTimeout(() => this.forecasterMap.invalidateSize(), 100);
    }

    if (this.forecasterMarkerLayer && this.forecasterMap) {
      this.forecasterMap.removeLayer(this.forecasterMarkerLayer);
    }
    if (this.forecasterMap) {
      this.forecasterMarkerLayer = L.layerGroup().addTo(this.forecasterMap);
    }

    if (mapData && mapData.length > 0) {
      const latLngs = [];
      let focusLatLng = null;

      mapData.forEach((d) => {
        const isFocused = d.is_focused || (focusDistrict && d.name.toLowerCase() === focusDistrict.toLowerCase());
        const latLng = [d.lat, d.lon];
        latLngs.push(latLng);
        if (isFocused) focusLatLng = latLng;

        const radius = isFocused ? 11 : 7;
        const color = d.color || (d.confidence_score >= 60 ? "#10b981" : d.confidence_score >= 40 ? "#f59e0b" : "#ef4444");

        const marker = L.circleMarker(latLng, {
          radius: radius,
          fillColor: color,
          color: isFocused ? "#ffffff" : "#0f172a",
          weight: isFocused ? 3 : 1.5,
          opacity: 1.0,
          fillOpacity: 0.85,
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 170px; color: #0b1120; padding: 2px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="font-size: 0.95rem; color: #0f172a;">${d.name}</strong>
              <span style="font-size: 0.7rem; background: ${color}; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
                ${d.confidence_score}% Trust
              </span>
            </div>
            <span style="font-size: 0.75rem; color: #64748b;">${stateName || d.state}</span>
            <hr style="margin: 6px 0; border: 0; border-top: 1px solid #cbd5e1;">
            <div style="font-size: 0.8rem; margin-bottom: 2px;">🌧️ Rain: <strong>${d.expected_rainfall_mm} mm</strong></div>
            <div style="font-size: 0.8rem; margin-bottom: 2px;">🌡️ Temp: <strong>${d.temperature_c} °C</strong> | 💨 Wind: <strong>${d.wind_kmh} km/h</strong></div>
            <div style="font-size: 0.8rem; margin-bottom: 2px;">⚠️ Bust Risk: <strong>${d.bust_probability}%</strong></div>
            <div style="font-size: 0.8rem; color: #0284c7; font-weight: 600;">☁️ ${d.weather_condition}</div>
            <button onclick="StakeholderUI.onDistrictChanged('${d.name}')" style="margin-top: 8px; width: 100%; padding: 5px; background: #0284c7; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: 600;">
              ${isFocused ? "✓ Currently Selected" : "Select District"}
            </button>
          </div>
        `);

        this.forecasterMarkerLayer.addLayer(marker);

        // Highlight ring for focused district
        if (isFocused) {
          const pulseRing = L.circleMarker(latLng, {
            radius: 17,
            color: "#38bdf8",
            weight: 2,
            opacity: 0.7,
            fill: false,
          });
          this.forecasterMarkerLayer.addLayer(pulseRing);
        }
      });

      if (latLngs.length > 0 && this.forecasterMap) {
        if (latLngs.length === 1 && focusLatLng) {
          this.forecasterMap.setView(focusLatLng, 9);
        } else {
          this.forecasterMap.fitBounds(L.latLngBounds(latLngs), { padding: [25, 25], maxZoom: 9 });
        }
      }
    }
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
          const cls =
            item.uncertainty_level === "LOW"
              ? "cell-low"
              : item.uncertainty_level === "MODERATE"
              ? "cell-moderate"
              : item.uncertainty_level === "HIGH"
              ? "cell-high"
              : "cell-extreme";
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
            pointRadius: 4,
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
            <span class="phase-badge ${
              phaseData.severity === "CRITICAL"
                ? "badge-risk-high"
                : phaseData.severity === "HIGH ALERT"
                ? "badge-risk-high"
                : "badge-risk-mod"
            }">${phaseData.severity}</span>
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
    this.renderDisasterMap(d.flood_risk_map_data, d.district, d.state);

    // 4. High-Risk District Ranking Table
    const tableBody = document.getElementById("dmDistrictRankingTableBody");
    if (tableBody && d.high_risk_districts) {
      tableBody.innerHTML = d.high_risk_districts
        .map(
          (dist, idx) => `
        <tr style="${dist.is_focused ? "background: rgba(56, 189, 248, 0.1);" : ""}">
          <td><span style="font-weight: 800; color: #94a3b8;">#${idx + 1}</span></td>
          <td><strong style="color: #f8fafc;">${dist.name}</strong><br><span style="font-size: 0.7rem; color: #64748b;">${dist.state}</span></td>
          <td><span class="badge ${
            dist.alert_level === "RED" ? "badge-risk-high" : dist.alert_level === "ORANGE" ? "badge-risk-mod" : "badge-risk-low"
          }">${dist.alert_level}</span></td>
          <td><span style="color: #38bdf8; font-weight: 700;">${dist.expected_rainfall_mm} mm</span></td>
          <td>${dist.wind_speed_kmh} km/h</td>
          <td><span style="color: ${dist.bust_risk_pct >= 50 ? "#ef4444" : "#10b981"}; font-weight: 700;">${dist.bust_risk_pct}%</span></td>
          <td>${dist.population_at_risk.toLocaleString()}</td>
          <td><span style="font-size: 0.75rem; color: #cbd5e1;">${dist.key_threat}</span></td>
          <td>
            <button onclick="StakeholderUI.onDistrictChanged('${dist.name}')" class="btn btn-sm btn-outline-neutral" style="padding: 2px 8px; font-size: 0.7rem;">
              ${dist.is_focused ? "✓ Focused" : "Focus"}
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
    if (cycName) cycName.textContent = cyc.active_system_name || "Regional Trough";

    const cycBadge = document.getElementById("dmCycloneBadge");
    if (cycBadge) cycBadge.textContent = cyc.system_category || "Tracked System";

    const cycPress = document.getElementById("dmCyclonePressure");
    if (cycPress) cycPress.textContent = `${cyc.central_pressure_hpa || 1012} hPa (Drop: ${cyc.pressure_drop_hpa || 0} hPa)`;

    const cycWind = document.getElementById("dmCycloneWind");
    if (cycWind) cycWind.textContent = `${cyc.max_sustained_winds_kmh || 30} km/h`;

    const cycSurge = document.getElementById("dmCycloneSurge");
    if (cycSurge) cycSurge.textContent = cyc.coastal_surge_warning || "Normal Water Level";

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

  renderDisasterMap(floodData, focusDistrict, stateName) {
    const mapContainer = document.getElementById("disasterFloodMap");
    if (!mapContainer || typeof L === "undefined") return;

    if (!this.disasterMap) {
      try {
        if (mapContainer._leaflet_id) {
          mapContainer._leaflet_id = null;
        }
        this.disasterMap = L.map("disasterFloodMap", {
          center: [20.5937, 78.9629],
          zoom: 5,
          zoomControl: true,
        });
        this.buildMapTileLayer().addTo(this.disasterMap);
      } catch (err) {
        console.warn("[StakeholderUI] Disaster map init warning:", err);
      }
    }

    if (this.disasterMap) {
      setTimeout(() => this.disasterMap.invalidateSize(), 100);
    }

    if (this.disasterMarkerLayer && this.disasterMap) {
      this.disasterMap.removeLayer(this.disasterMarkerLayer);
    }
    if (this.disasterMap) {
      this.disasterMarkerLayer = L.layerGroup().addTo(this.disasterMap);
    }

    if (floodData && floodData.length > 0) {
      const latLngs = [];
      let focusLatLng = null;

      floodData.forEach((f) => {
        const isFocused = f.is_focused || (focusDistrict && f.district.toLowerCase() === focusDistrict.toLowerCase());
        const latLng = [f.lat, f.lon];
        latLngs.push(latLng);
        if (isFocused) focusLatLng = latLng;

        const baseRadiusKm = Math.max(12, Math.min(32, f.rain_mm * 0.45));
        const circle = L.circle(latLng, {
          radius: baseRadiusKm * 1000,
          color: f.color || (f.alert_level === "RED" ? "#ef4444" : f.alert_level === "ORANGE" ? "#f59e0b" : "#10b981"),
          fillColor: f.color || "#ef4444",
          fillOpacity: isFocused ? 0.6 : 0.35,
          weight: isFocused ? 3 : 1.5,
        });

        circle.bindPopup(`
          <div style="font-family: sans-serif; min-width: 170px; color: #0b1120; padding: 2px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="font-size: 0.95rem; color: #0f172a;">${f.district}</strong>
              <span style="font-size: 0.7rem; background: ${f.color}; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
                ${f.alert_level} ALERT
              </span>
            </div>
            <span style="font-size: 0.75rem; color: #64748b;">${stateName || f.state}</span>
            <hr style="margin: 6px 0; border: 0; border-top: 1px solid #cbd5e1;">
            <div style="font-size: 0.8rem; margin-bottom: 2px;">🌧️ Expected 24h Rain: <strong>${f.rain_mm} mm</strong></div>
            <div style="font-size: 0.8rem; margin-bottom: 2px;">🌊 Flood Risk Index: <strong>${f.flood_index} / 100</strong></div>
            <div style="font-size: 0.8rem; margin-bottom: 2px;">💨 Max Wind: <strong>${f.wind_kmh} km/h</strong></div>
            <div style="font-size: 0.8rem; margin-bottom: 2px;">👥 Pop at Risk: <strong>${(f.population_at_risk || 0).toLocaleString()}</strong></div>
            <div style="font-size: 0.775rem; color: #dc2626; font-weight: 600; margin-top: 4px;">⚠️ ${f.key_threat}</div>
            <button onclick="StakeholderUI.onDistrictChanged('${f.district}')" style="margin-top: 8px; width: 100%; padding: 5px; background: #dc2626; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: 600;">
              ${isFocused ? "✓ Focused District" : "Focus District Risk"}
            </button>
          </div>
        `);

        this.disasterMarkerLayer.addLayer(circle);

        if (isFocused) {
          const centerDot = L.circleMarker(latLng, {
            radius: 6,
            fillColor: "#ffffff",
            color: f.color,
            weight: 2,
            fillOpacity: 1.0,
          });
          this.disasterMarkerLayer.addLayer(centerDot);
        }
      });

      if (latLngs.length > 0 && this.disasterMap) {
        if (latLngs.length === 1 && focusLatLng) {
          this.disasterMap.setView(focusLatLng, 8);
        } else {
          this.disasterMap.fitBounds(L.latLngBounds(latLngs), { padding: [25, 25], maxZoom: 9 });
        }
      }
    }
  },

  // =========================================================================
  // 3. RENDER AGRICULTURE PORTAL
  // =========================================================================
  renderAgriculturePortal(d) {
    // 1. KPI Cards
    const relAgri = document.getElementById("agKpiReliableDistricts");
    if (relAgri) relAgri.textContent = `${d.reliable_rainfall_districts_count || 0} / ${d.total_state_districts || 0}`;

    const cropRisk = document.getElementById("agKpiCropRisk");
    if (cropRisk) cropRisk.textContent = d.crop_risk_level || "Moderate";

    const irrigNeed = document.getElementById("agKpiIrrigationNeed");
    if (irrigNeed) irrigNeed.textContent = d.irrigation_need || "Postpone";

    const rainConf = document.getElementById("agKpiRainConfidence");
    if (rainConf) rainConf.textContent = `${d.rainfall_reliability_score || 72}%`;

    // 2. Embedded Agriculture Spatial Map
    this.renderAgricultureMap(d.agro_map_data, d.district, d.state);

    // 3. Soil Moisture & Sowing Advisory
    const soilMoist = document.getElementById("agSoilMoistureVal");
    if (soilMoist) soilMoist.textContent = `${d.soil_moisture_pct}%`;

    const soilStatus = document.getElementById("agSoilMoistureStatus");
    if (soilStatus) soilStatus.textContent = `${d.soil_moisture_status} (${d.soil_type || "Alluvial"})`;

    const sow = d.sowing_advisory || {};
    const sowTitle = document.getElementById("agSowingWindowTitle");
    if (sowTitle) sowTitle.textContent = sow.window_status || "Optimal Sowing Window";

    const sowGuide = document.getElementById("agSowingGuidance");
    if (sowGuide) sowGuide.textContent = sow.guidance || "";

    const sowCrops = document.getElementById("agSowingCropsList");
    if (sowCrops && sow.optimal_crops) {
      sowCrops.innerHTML = sow.optimal_crops
        .map((c) => `<span class="badge badge-neutral" style="margin-right: 6px; margin-bottom: 6px; font-size: 0.75rem;">🌾 ${c}</span>`)
        .join("");
    }

    // 4. Irrigation Recommendation
    const irrig = d.irrigation_recommendation || {};
    const irrigAction = document.getElementById("agIrrigActionTitle");
    if (irrigAction) irrigAction.textContent = irrig.recommendation || "Postpone Irrigation";

    const irrigDetail = document.getElementById("agIrrigDetail");
    if (irrigDetail) irrigDetail.textContent = irrig.detail || "";

    const irrigSaved = document.getElementById("agIrrigWaterSaved");
    if (irrigSaved) irrigSaved.textContent = `${irrig.estimated_water_saved_m3_per_hectare || 0} m³/ha`;

    // 5. Crop Stress Indicators
    const stress = d.crop_stress_indicators || {};
    const heatStress = document.getElementById("agThermalStressVal");
    if (heatStress) heatStress.textContent = stress.thermal_heat_stress || "Low";

    const moistStress = document.getElementById("agMoistStressVal");
    if (moistStress) moistStress.textContent = stress.soil_moisture_stress || "Optimal";

    const waterlogRisk = document.getElementById("agWaterlogRiskVal");
    if (waterlogRisk) waterlogRisk.textContent = stress.waterlogging_risk || "Low";

    // 6. Weekly Agricultural Calendar (7 Days)
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

    // 7. District Crop Impacts
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

  renderAgricultureMap(agroData, focusDistrict, stateName) {
    const mapContainer = document.getElementById("agricultureSpatialMap");
    if (!mapContainer || typeof L === "undefined") return;

    if (!this.agricultureMap) {
      try {
        if (mapContainer._leaflet_id) {
          mapContainer._leaflet_id = null;
        }
        this.agricultureMap = L.map("agricultureSpatialMap", {
          center: [20.5937, 78.9629],
          zoom: 5,
          zoomControl: true,
        });
        this.buildMapTileLayer().addTo(this.agricultureMap);
      } catch (err) {
        console.warn("[StakeholderUI] Agriculture map init warning:", err);
      }
    }

    if (this.agricultureMap) {
      setTimeout(() => this.agricultureMap.invalidateSize(), 100);
    }

    if (this.agricultureMarkerLayer && this.agricultureMap) {
      this.agricultureMap.removeLayer(this.agricultureMarkerLayer);
    }
    if (this.agricultureMap) {
      this.agricultureMarkerLayer = L.layerGroup().addTo(this.agricultureMap);
    }

    if (agroData && agroData.length > 0) {
      const latLngs = [];
      let focusLatLng = null;

      agroData.forEach((a) => {
        const isFocused = a.is_focused || (focusDistrict && a.district.toLowerCase() === focusDistrict.toLowerCase());
        const latLng = [a.lat, a.lon];
        latLngs.push(latLng);
        if (isFocused) focusLatLng = latLng;

        const radius = isFocused ? 12 : 8;
        const color = a.color || (a.suitability_score >= 70 ? "#10b981" : a.suitability_score >= 50 ? "#f59e0b" : "#ef4444");

        const marker = L.circleMarker(latLng, {
          radius: radius,
          fillColor: color,
          color: isFocused ? "#ffffff" : "#0f172a",
          weight: isFocused ? 3 : 1.5,
          opacity: 1.0,
          fillOpacity: 0.85,
        });

        marker.bindPopup(`
          <div style="font-family: sans-serif; min-width: 175px; color: #0b1120; padding: 2px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <strong style="font-size: 0.95rem; color: #0f172a;">${a.district}</strong>
              <span style="font-size: 0.7rem; background: ${color}; color: #ffffff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">
                ${a.suitability_score}/100 Suitability
              </span>
            </div>
            <span style="font-size: 0.75rem; color: #64748b;">${stateName || a.state}</span>
            <hr style="margin: 6px 0; border: 0; border-top: 1px solid #cbd5e1;">
            <div style="font-size: 0.8rem; margin-bottom: 2px;">🌱 Soil Type: <strong>${a.soil_type}</strong></div>
            <div style="font-size: 0.8rem; margin-bottom: 2px;">💧 Soil Moisture: <strong>${a.soil_moisture_pct}%</strong> (${a.soil_moisture_status})</div>
            <div style="font-size: 0.8rem; margin-bottom: 2px;">🌧️ 7-Day Rainfall: <strong>${a.rainfall_mm} mm</strong></div>
            <div style="font-size: 0.8rem; margin-bottom: 2px;">⚠️ Crop Risk: <strong>${a.crop_risk_level}</strong></div>
            <div style="font-size: 0.75rem; color: #059669; font-weight: 600; margin-top: 4px;">
              🌾 Recommended: ${(a.recommended_crops || []).join(", ")}
            </div>
            <button onclick="StakeholderUI.onDistrictChanged('${a.district}')" style="margin-top: 8px; width: 100%; padding: 5px; background: #059669; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: 600;">
              ${isFocused ? "✓ Focused District" : "Select District for Advisory"}
            </button>
          </div>
        `);

        this.agricultureMarkerLayer.addLayer(marker);

        if (isFocused) {
          const pulseRing = L.circleMarker(latLng, {
            radius: 18,
            color: "#10b981",
            weight: 2,
            opacity: 0.8,
            fill: false,
          });
          this.agricultureMarkerLayer.addLayer(pulseRing);
        }
      });

      if (latLngs.length > 0 && this.agricultureMap) {
        if (latLngs.length === 1 && focusLatLng) {
          this.agricultureMap.setView(focusLatLng, 9);
        } else {
          this.agricultureMap.fitBounds(L.latLngBounds(latLngs), { padding: [25, 25], maxZoom: 9 });
        }
      }
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
        if (!icon) return "⛅";
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
    const text = card.whatsapp_text || `Weather in ${this.currentDistrict}, ${this.currentState}: Checked via WeatherTrust AI.`;
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
    link.setAttribute("download", `WeatherTrust_Forecaster_${this.currentState}_${this.currentDistrict}_Day${this.currentLeadDay}.csv`);
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
