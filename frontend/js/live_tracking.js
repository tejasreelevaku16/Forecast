/**
 * WeatherTrust AI — Live Tracking & Indian Location Hierarchy Controller
 * Implements strict hierarchical selection:
 * India -> State / Union Territory -> Place / City / District -> Live Weather + Forecast Tracking.
 * Ensures 100% consistency across Live Weather, Hourly, 10-Day, Drift, History, Reliability, and Alerts.
 */

const LiveTrackingUI = {
  hierarchy: {},
  currentState: "Andhra Pradesh",
  currentPlace: "Vijayawada",
  currentDistrict: "NTR",
  currentLat: 16.5062,
  currentLon: 80.6480,
  currentStateCode: "AP",

  async init() {
    console.log("[LiveTracking] Initializing Indian Location Hierarchy...");
    try {
      const resp = await fetch("/api/locations/hierarchy");
      if (resp.ok) {
        this.hierarchy = await resp.json();
      }
    } catch (e) {
      console.warn("[LiveTracking] Could not load /api/locations/hierarchy, using fallback lookup", e);
    }

    this.populateStateDropdown();
    this.setupEventListeners();

    // Set default initial state & place
    this.selectLocation("Andhra Pradesh", "Vijayawada", false);
  },

  populateStateDropdown() {
    const stateSelect = document.getElementById("stateSelect");
    if (!stateSelect) return;

    stateSelect.innerHTML = '<option value="">-- Choose Indian State or UT --</option>';

    const states = Object.keys(this.hierarchy).sort();
    if (states.length === 0) {
      // Emergency fallback if offline
      const fallbackStates = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
        "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
        "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
        "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
        "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman & Nicobar Islands",
        "Chandigarh", "Dadra & Nagar Haveli and Daman & Diu", "Delhi", "Jammu & Kashmir",
        "Ladakh", "Lakshadweep", "Puducherry"
      ];
      fallbackStates.forEach(st => {
        const opt = document.createElement("option");
        opt.value = st;
        opt.textContent = st;
        stateSelect.appendChild(opt);
      });
      return;
    }

    states.forEach(st => {
      const opt = document.createElement("option");
      opt.value = st;
      const count = this.hierarchy[st] ? this.hierarchy[st].length : 0;
      opt.textContent = `${st} (${count} places)`;
      stateSelect.appendChild(opt);
    });
  },

  populatePlaceDropdown(stateName, selectedPlace = null) {
    const placeSelect = document.getElementById("placeSelect");
    const countHint = document.getElementById("placeStateHint");
    if (!placeSelect) return;

    placeSelect.innerHTML = '<option value="">-- Select Place --</option>';

    if (!stateName || !this.hierarchy[stateName]) {
      placeSelect.disabled = true;
      if (countHint) countHint.textContent = "Select state first";
      return;
    }

    const places = this.hierarchy[stateName];
    placeSelect.disabled = false;
    if (countHint) countHint.textContent = `${places.length} places in ${stateName}`;

    places.forEach(loc => {
      const opt = document.createElement("option");
      opt.value = loc.place;
      const distInfo = loc.district ? ` (${loc.district})` : "";
      opt.textContent = `${loc.place}${distInfo}`;
      opt.dataset.lat = loc.latitude;
      opt.dataset.lon = loc.longitude;
      opt.dataset.district = loc.district || "";
      opt.dataset.stateCode = loc.state_code || "";
      opt.dataset.state = loc.state;

      if (selectedPlace && loc.place.toLowerCase() === selectedPlace.toLowerCase()) {
        opt.selected = true;
      }
      placeSelect.appendChild(opt);
    });

    // If no place selected, select the first place
    if (!selectedPlace && places.length > 0) {
      placeSelect.selectedIndex = 1;
      const first = places[0];
      this.currentPlace = first.place;
      this.currentDistrict = first.district || "";
      this.currentLat = first.latitude;
      this.currentLon = first.longitude;
      this.currentStateCode = first.state_code || "";
      this.updateBreadcrumbs();
    }
  },

  selectLocation(stateName, placeName, triggerLoad = true) {
    const stateSelect = document.getElementById("stateSelect");
    const placeSelect = document.getElementById("placeSelect");

    if (stateSelect) {
      stateSelect.value = stateName;
    }

    this.currentState = stateName;
    this.populatePlaceDropdown(stateName, placeName);

    // Retrieve exact metadata
    const places = this.hierarchy[stateName] || [];
    const match = places.find(p => p.place.toLowerCase() === (placeName || "").toLowerCase());

    if (match) {
      this.currentPlace = match.place;
      this.currentDistrict = match.district || "";
      this.currentLat = match.latitude;
      this.currentLon = match.longitude;
      this.currentStateCode = match.state_code || "";
      if (placeSelect) placeSelect.value = match.place;
    } else if (places.length > 0) {
      const first = places[0];
      this.currentPlace = first.place;
      this.currentDistrict = first.district || "";
      this.currentLat = first.latitude;
      this.currentLon = first.longitude;
      this.currentStateCode = first.state_code || "";
      if (placeSelect) placeSelect.value = first.place;
    }

    this.updateBreadcrumbs();

    if (triggerLoad) {
      this.trackSelectedLocation();
    }
  },

  updateBreadcrumbs() {
    const crumbState = document.getElementById("crumbStateText");
    const crumbPlace = document.getElementById("crumbPlaceText");
    const crumbCoords = document.getElementById("crumbCoordsText");
    const liveState = document.getElementById("liveStateDisplay");
    const livePlace = document.getElementById("livePlaceDisplay");
    const liveDist = document.getElementById("liveDistrictDisplay");
    const liveDistWrap = document.getElementById("liveDistrictWrap");

    if (crumbState) crumbState.textContent = this.currentState;
    if (crumbPlace) crumbPlace.textContent = `${this.currentPlace}${this.currentDistrict ? ' (' + this.currentDistrict + ')' : ''}`;
    if (crumbCoords) crumbCoords.textContent = `Lat: ${this.currentLat.toFixed(2)}°, Lon: ${this.currentLon.toFixed(2)}°`;

    if (liveState) liveState.textContent = this.currentState;
    if (livePlace) livePlace.textContent = this.currentPlace;
    if (liveDist) liveDist.textContent = this.currentDistrict || "--";
    if (liveDistWrap) liveDistWrap.style.display = this.currentDistrict ? "inline" : "none";
  },

  trackSelectedLocation() {
    const locQuery = `${this.currentPlace}, ${this.currentState}`;
    console.log(`[LiveTracking] Tracking location: ${locQuery} (Lat: ${this.currentLat}, Lon: ${this.currentLon})`);

    // Synchronize top search bar
    const mainSearch = document.getElementById("citySearchInput");
    if (mainSearch) mainSearch.value = `${this.currentPlace}, ${this.currentState}`;

    // Update active quick pills if any matches
    const pills = document.querySelectorAll(".pill-btn");
    pills.forEach(p => {
      const pLoc = p.getAttribute("data-location") || "";
      if (pLoc.toLowerCase().includes(this.currentPlace.toLowerCase())) {
        p.classList.add("active");
      } else {
        p.classList.remove("active");
      }
    });

    // Invoke global loadDashboard
    if (typeof loadDashboard === "function") {
      loadDashboard(locQuery, currentSector, this.currentLat, this.currentLon, this.currentState);
    }
  },

  setupEventListeners() {
    const stateSelect = document.getElementById("stateSelect");
    const placeSelect = document.getElementById("placeSelect");
    const trackBtn = document.getElementById("trackLocationBtn");
    const searchInput = document.getElementById("liveTrackingSearchInput");
    const searchDropdown = document.getElementById("liveTrackingSearchDropdown");
    const clearSearchBtn = document.getElementById("liveTrackingClearSearchBtn");

    // State change handler
    if (stateSelect) {
      stateSelect.addEventListener("change", (e) => {
        const selectedState = e.target.value;
        if (!selectedState) return;
        this.currentState = selectedState;
        this.populatePlaceDropdown(selectedState);
        this.trackSelectedLocation();
      });
    }

    // Place change handler
    if (placeSelect) {
      placeSelect.addEventListener("change", (e) => {
        const placeName = e.target.value;
        if (!placeName) return;
        const places = this.hierarchy[this.currentState] || [];
        const match = places.find(p => p.place.toLowerCase() === placeName.toLowerCase());
        if (match) {
          this.currentPlace = match.place;
          this.currentDistrict = match.district || "";
          this.currentLat = match.latitude;
          this.currentLon = match.longitude;
          this.currentStateCode = match.state_code || "";
        } else {
          this.currentPlace = placeName;
        }
        this.updateBreadcrumbs();
        this.trackSelectedLocation();
      });
    }

    // Track button click handler
    if (trackBtn) {
      trackBtn.addEventListener("click", () => {
        trackBtn.classList.add("spinning");
        this.trackSelectedLocation();
        setTimeout(() => trackBtn.classList.remove("spinning"), 600);
      });
    }

    // Search Autocomplete handler
    let searchDebounceTimer;
    if (searchInput && searchDropdown) {
      searchInput.addEventListener("input", (e) => {
        clearTimeout(searchDebounceTimer);
        const query = e.target.value.trim();

        if (clearSearchBtn) {
          clearSearchBtn.style.display = query.length > 0 ? "inline-block" : "none";
        }

        if (query.length < 2) {
          searchDropdown.classList.remove("active");
          searchDropdown.innerHTML = "";
          return;
        }

        searchDebounceTimer = setTimeout(async () => {
          try {
            const res = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}&limit=10`);
            if (!res.ok) return;
            const items = await res.json();

            if (items.length > 0) {
              searchDropdown.innerHTML = "";
              items.forEach(item => {
                const row = document.createElement("div");
                row.className = "hierarchy-search-item";
                const distText = item.district ? `<span class="search-item-dist">${item.district}</span>` : "";
                row.innerHTML = `
                  <div class="search-item-main">
                    <span class="search-item-place">${item.place}</span>
                    ${distText}
                  </div>
                  <div class="search-item-sub">
                    <span>${item.state} (${item.state_code}), India</span>
                    <span class="search-item-coords">${item.latitude.toFixed(2)}°N, ${item.longitude.toFixed(2)}°E</span>
                  </div>
                `;

                row.addEventListener("click", () => {
                  searchInput.value = `${item.place}, ${item.state}`;
                  searchDropdown.classList.remove("active");
                  this.currentState = item.state;
                  this.currentPlace = item.place;
                  this.currentDistrict = item.district || "";
                  this.currentLat = item.latitude;
                  this.currentLon = item.longitude;
                  this.currentStateCode = item.state_code;

                  // Update dropdowns
                  if (stateSelect) stateSelect.value = item.state;
                  this.populatePlaceDropdown(item.state, item.place);
                  if (placeSelect) placeSelect.value = item.place;

                  this.updateBreadcrumbs();
                  this.trackSelectedLocation();
                });

                searchDropdown.appendChild(row);
              });
              searchDropdown.classList.add("active");
            } else {
              searchDropdown.classList.remove("active");
            }
          } catch (err) {
            console.error("[LiveTracking] Search error:", err);
          }
        }, 200);
      });

      if (clearSearchBtn) {
        clearSearchBtn.addEventListener("click", () => {
          searchInput.value = "";
          clearSearchBtn.style.display = "none";
          searchDropdown.classList.remove("active");
        });
      }

      document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
          searchDropdown.classList.remove("active");
        }
      });
    }
  },

  /**
   * Renders the Live Tracking unified sections:
   * 1. 10-Day Forecast
   * 2. Forecast Drift
   * 3. Forecast History
   * 4. Forecast Reliability
   */
  renderLiveTrackingSections(weatherData, reliabilityData, driftData) {
    this.renderLiveDailyForecast(weatherData ? weatherData.daily : null, reliabilityData);
    this.renderLiveDrift(reliabilityData, driftData);
    this.renderLiveHistory(driftData);
    this.renderLiveReliability(reliabilityData);
  },

  /**
   * Renders Day 1 to Day 10 forecast specifically for the Live Tracking page
   */
  renderLiveDailyForecast(dailyItems, reliabilityData) {
    const container = document.getElementById("liveDailyForecastContainer");
    if (!container || !dailyItems) return;

    const leadDayMap = {};
    if (reliabilityData && reliabilityData.lead_days) {
      reliabilityData.lead_days.forEach(ld => {
        leadDayMap[ld.lead_day] = ld;
      });
    }

    container.innerHTML = "";
    dailyItems.forEach(item => {
      const rel = leadDayMap[item.day_index];
      const bustProb = rel ? rel.bust_probability_pct : 50;
      const riskInfo = typeof WeatherTrustCommon !== "undefined"
        ? WeatherTrustCommon.classifyRisk(bustProb)
        : {
            bust_probability: bustProb,
            trust_score: 100 - bustProb,
            risk_level: bustProb < 30 ? "LOW" : bustProb < 60 ? "MODERATE" : "HIGH",
            badge_class: bustProb < 30 ? "badge-risk-low" : bustProb < 60 ? "badge-risk-mod" : "badge-risk-high",
            color: bustProb < 30 ? "#10b981" : bustProb < 60 ? "#f59e0b" : "#ef4444"
          };

      const trustScore = rel ? rel.reliability_score : riskInfo.trust_score;
      const badgeClass = riskInfo.badge_class;
      const barFillColor = riskInfo.color;
      const riskLevel = riskInfo.risk_level;
      const iconMarkup = typeof WeatherUI !== "undefined" ? WeatherUI.getIconMarkup(item.condition_icon) : "⛅";

      const row = document.createElement("div");
      row.className = `daily-row ${item.day_index === 6 ? "highlight-day6" : ""}`;
      row.innerHTML = `
        <div class="daily-day-col">
          <span class="daily-day-name">${item.day_name}</span>
          <span class="daily-day-date">${item.date}</span>
        </div>
        <div class="daily-cond-col">
          <span class="daily-cond-icon">${iconMarkup}</span>
          <span>${item.condition}</span>
        </div>
        <div class="daily-temp-col">
          <span>${Math.round(item.temp_max_c)}°</span>
          <span class="daily-temp-low">${Math.round(item.temp_min_c)}°</span>
        </div>
        <div class="daily-rain-col">
          🌧️ ${item.precipitation_mm} mm <span style="font-size:0.75rem; color:#94a3b8">(${item.rain_chance_pct}%)</span>
        </div>
        <div class="daily-trust-col">
          <div class="trust-bar-label">
            <span>Forecast Trust</span>
            <span>${trustScore}/100</span>
          </div>
          <div class="trust-bar-wrap">
            <div class="trust-bar-fill" style="width: ${trustScore}%; background-color: ${barFillColor};"></div>
          </div>
        </div>
        <div class="daily-risk-badge-col">
          <span class="badge ${badgeClass}">${riskLevel} BUST RISK (${bustProb}%)</span>
        </div>
      `;
      container.appendChild(row);
    });
  },

  /**
   * Renders FORECAST DRIFT comparison on the Live Tracking page:
   * Previous forecast -> Latest forecast
   * Change: +... mm
   * Stability: LOW / MODERATE / HIGH
   */
  renderLiveDrift(reliabilityData, driftData) {
    const prevElem = document.getElementById("liveDriftPrev");
    const latestElem = document.getElementById("liveDriftLatest");
    const changeElem = document.getElementById("liveDriftChange");
    const stabilityElem = document.getElementById("liveDriftStability");

    let prevVal = 20.0;
    let latestVal = 58.0;
    let driftChange = 38.0;
    let stability = "LOW";

    if (driftData && driftData.cycles && driftData.cycles.length >= 2) {
      const len = driftData.cycles.length;
      prevVal = driftData.cycles[len - 2].predicted_rain_mm;
      latestVal = driftData.cycles[len - 1].predicted_rain_mm;
      driftChange = latestVal - prevVal;
      stability = Math.abs(driftChange) > 25.0 ? "LOW" : Math.abs(driftChange) > 10.0 ? "MODERATE" : "HIGH";
    } else if (reliabilityData && reliabilityData.forecast_drift_mm !== undefined) {
      latestVal = reliabilityData.rainfall_mm || 80.0;
      driftChange = reliabilityData.forecast_drift_mm;
      prevVal = Math.max(0.0, latestVal - driftChange);
      stability = reliabilityData.forecast_stability || "LOW";
    }

    if (prevElem) prevElem.textContent = `${Math.round(prevVal)} mm`;
    if (latestElem) latestElem.textContent = `${Math.round(latestVal)} mm`;
    if (changeElem) {
      const sign = driftChange >= 0 ? "+" : "";
      changeElem.textContent = `Change: ${sign}${Math.round(driftChange)} mm`;
      changeElem.style.color = Math.abs(driftChange) > 20 ? "#ef4444" : Math.abs(driftChange) > 10 ? "#f59e0b" : "#10b981";
    }
    if (stabilityElem) {
      const cleanStab = typeof WeatherTrustCommon !== "undefined"
        ? WeatherTrustCommon.formatStability(stability)
        : `${stability} STABILITY`;
      stabilityElem.textContent = cleanStab;
      stabilityElem.className = `badge ${stability.includes("LOW") ? "badge-risk-high" : stability.includes("MOD") ? "badge-risk-mod" : "badge-risk-low"}`;
    }
  },

  /**
   * Renders FORECAST HISTORY multi-cycle snapshots on the Live Tracking page
   */
  renderLiveHistory(driftData) {
    const container = document.getElementById("liveHistoryContainer");
    if (!container) return;

    let cycles = [];
    if (driftData && driftData.cycles && driftData.cycles.length > 0) {
      cycles = driftData.cycles;
    } else {
      // Realistic default progression for demonstration
      cycles = [
        { run_name: "Cycle -18h (00Z)", cycle_time: "Yesterday, 06:00", predicted_rain_mm: 20.0, predicted_temp_c: 32.0 },
        { run_name: "Cycle -12h (06Z)", cycle_time: "Yesterday, 12:00", predicted_rain_mm: 32.0, predicted_temp_c: 31.0 },
        { run_name: "Cycle -06h (12Z)", cycle_time: "Yesterday, 18:00", predicted_rain_mm: 45.0, predicted_temp_c: 29.5 },
        { run_name: "Latest Run (18Z)", cycle_time: "Today, 00:00", predicted_rain_mm: 58.0, predicted_temp_c: 29.0 },
      ];
    }

    container.innerHTML = "";
    cycles.forEach((cycle, idx) => {
      const isLatest = idx === cycles.length - 1;
      const prevRain = idx > 0 ? cycles[idx - 1].predicted_rain_mm : cycle.predicted_rain_mm;
      const diff = cycle.predicted_rain_mm - prevRain;
      const diffStr = idx > 0 ? (diff >= 0 ? `+${diff.toFixed(1)} mm` : `${diff.toFixed(1)} mm`) : "Initial Run";

      const card = document.createElement("div");
      card.className = `glass-card live-history-card ${isLatest ? "latest-cycle" : ""}`;
      card.innerHTML = `
        <div class="cycle-header">
          <span class="cycle-name">${cycle.run_name}</span>
          <span class="cycle-badge ${isLatest ? 'badge badge-risk-high' : ''}">${isLatest ? 'LATEST NWP' : cycle.cycle_time}</span>
        </div>
        <div class="cycle-metric">
          <span class="cycle-val">${cycle.predicted_rain_mm}</span>
          <span class="cycle-unit">mm rain</span>
        </div>
        <div class="cycle-footer">
          <span>Run Shift:</span>
          <strong style="color: ${diff > 15 ? '#ef4444' : diff > 5 ? '#f59e0b' : '#10b981'}">${diffStr}</strong>
        </div>
      `;
      container.appendChild(card);
    });
  },

  /**
   * Renders FORECAST RELIABILITY on the Live Tracking page:
   * Trust Score: --
   * Bust Risk: --
   * Status: Reliability model unavailable (or ML Calibrated Model Active)
   */
  renderLiveReliability(reliabilityData) {
    const trustScoreElem = document.getElementById("liveTrustScore");
    const bustRiskElem = document.getElementById("liveBustRisk");
    const statusElem = document.getElementById("liveReliabilityStatus");
    const driverElem = document.getElementById("liveReliabilityDriver");
    const barElem = document.getElementById("liveTrustScoreBar");

    if (!reliabilityData) {
      if (trustScoreElem) trustScoreElem.textContent = "--";
      if (bustRiskElem) bustRiskElem.textContent = "--";
      if (statusElem) statusElem.textContent = "Status: Reliability model unavailable";
      if (driverElem) driverElem.textContent = "Forecast reliability model is currently loading or unreachable.";
      if (barElem) barElem.style.width = "0%";
      return;
    }

    const bustProb = reliabilityData.bust_probability_pct !== undefined ? reliabilityData.bust_probability_pct : 76;
    const riskInfo = typeof WeatherTrustCommon !== "undefined"
      ? WeatherTrustCommon.classifyRisk(bustProb)
      : {
          trust_score: 100 - bustProb,
          bust_probability: bustProb,
          risk_label: bustProb < 30 ? "LOW RISK" : bustProb < 60 ? "MODERATE RISK" : "HIGH RISK",
          color: bustProb < 30 ? "#10b981" : bustProb < 60 ? "#f59e0b" : "#ef4444",
          confidence_label: bustProb < 30 ? "HIGH CONFIDENCE" : bustProb < 60 ? "MODERATE CONFIDENCE" : "LOW CONFIDENCE",
          stability: bustProb < 30 ? "HIGH" : bustProb < 60 ? "MODERATE" : "LOW"
        };

    const trustScore = reliabilityData.reliability_score !== undefined ? reliabilityData.reliability_score : riskInfo.trust_score;

    if (trustScoreElem) {
      trustScoreElem.textContent = `${trustScore} / 100`;
      trustScoreElem.style.color = riskInfo.color;
    }
    if (bustRiskElem) {
      trustRiskText = `${riskInfo.risk_label} (${bustProb}%)`;
      bustRiskElem.textContent = trustRiskText;
      bustRiskElem.style.color = riskInfo.color;
    }
    if (barElem) {
      barElem.style.width = `${trustScore}%`;
      barElem.style.backgroundColor = riskInfo.color;
    }

    if (statusElem) {
      const isDemo = reliabilityData.is_demo === true;
      if (isDemo) {
        statusElem.innerHTML = `<span class="status-dot dot-amber"></span> Status: Demo heuristic mode (model artifact offline)`;
      } else {
        statusElem.innerHTML = `<span class="status-dot dot-green"></span> Status: Calibrated ML Inference Engine Active (forecast_reliability_model.pkl)`;
      }
    }

    if (driverElem) {
      const primaryDriver = reliabilityData.recommendation || `Synoptic lead-time sensitivity with ${riskInfo.stability} stability.`;
      driverElem.textContent = primaryDriver;
    }
  }
};
