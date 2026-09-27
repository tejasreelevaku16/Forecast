/**
 * WeatherTrust AI — Main Dashboard Coordinator & Controller (Phase 2.0)
 * Manages search interactions, city selection, sector persona switching,
 * central dashboard hierarchy, real-time sync across all 10 page views,
 * auto-refresh timer, and global loading/error states.
 */

let mapInstance = null;
let currentLocation = "Krishna District";
let currentSector = "General Public";

/**
 * Global Loading and Error State Helpers
 */
function showLoading(msg = "Evaluating forecast reliability...") {
  const overlay = document.getElementById('globalLoadingOverlay');
  const text = document.getElementById('globalLoadingText');
  if (overlay) overlay.classList.add('active');
  if (text) text.textContent = msg;
}

function hideLoading() {
  const overlay = document.getElementById('globalLoadingOverlay');
  if (overlay) overlay.classList.remove('active');
}

function showError(msg) {
  const card = document.getElementById('globalErrorCard');
  const text = document.getElementById('globalErrorMessage');
  if (card) card.classList.add('active');
  if (text) text.textContent = msg;
}

function hideError() {
  const card = document.getElementById('globalErrorCard');
  if (card) card.classList.remove('active');
}

/**
 * Synchronizes Dashboard Central Entrypoint Overview Cards
 */
function updateDashboardHeroCards(weatherData, reliabilityData) {
  const locTitle = document.getElementById('dashLocationTitle');
  const heroTemp = document.getElementById('dashHeroTemp');
  const heroCond = document.getElementById('dashHeroCond');
  const heroSum = document.getElementById('dashHeroSummary');

  if (weatherData && weatherData.available !== false && weatherData.current) {
    const c = weatherData.current;
    if (locTitle) locTitle.textContent = `${c.location}, ${c.region}`;
    if (heroTemp) heroTemp.textContent = `${Math.round(c.temperature_c)}°C`;
    if (heroCond) heroCond.textContent = `${c.condition}`;
    if (heroSum) {
      if (weatherData.daily && weatherData.daily.length > 5) {
        const d6 = weatherData.daily[5];
        heroSum.textContent = `Current: ${c.condition}, ${Math.round(c.temperature_c)}°C. Day 6 projection indicates ${d6.precipitation_mm} mm rainfall with significant atmospheric sensitivity.`;
      } else {
        heroSum.textContent = `Current observation: ${c.condition}, ${Math.round(c.temperature_c)}°C with ${c.humidity_pct}% relative humidity.`;
      }
    }
  } else {
    if (locTitle) locTitle.textContent = currentLocation;
    if (heroTemp) heroTemp.textContent = `--°C`;
    if (heroCond) heroCond.textContent = `Weather Unavailable`;
    if (heroSum) heroSum.textContent = `Live meteorological observation is unavailable for ${currentLocation}.`;
  }

  // Header freshness
  const updatedElem = document.getElementById('headerLastUpdated');
  if (updatedElem) {
    const now = new Date();
    updatedElem.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const rainElem = document.getElementById('dashForecastRain');
  const condElem = document.getElementById('dashForecastCond');
  const dateElem = document.getElementById('dashForecastDate');
  const trustScoreElem = document.getElementById('dashTrustScore');
  const confTierElem = document.getElementById('dashConfidenceTier');
  const bustProbElem = document.getElementById('dashBustProb');
  const riskTierElem = document.getElementById('dashRiskTier');
  const stabElem = document.getElementById('dashStability');
  const runChangeElem = document.getElementById('dashRunChange');
  const actionGuidance = document.getElementById('dashActionGuidance');

  if (reliabilityData && reliabilityData.available !== false) {
    if (typeof WeatherTrustCommon !== 'undefined') {
      WeatherTrustCommon.syncForecastData(reliabilityData);
    }
    const bustProb = reliabilityData.bust_probability_pct !== undefined ? reliabilityData.bust_probability_pct : 50;
    const riskInfo = typeof WeatherTrustCommon !== 'undefined'
      ? WeatherTrustCommon.classifyRisk(bustProb)
      : {
          bust_probability: bustProb,
          trust_score: 100 - bustProb,
          risk_level: bustProb < 30 ? "LOW" : bustProb < 60 ? "MODERATE" : "HIGH",
          risk_label: bustProb < 30 ? "LOW RISK" : bustProb < 60 ? "MODERATE RISK" : "HIGH RISK",
          confidence_label: bustProb < 30 ? "HIGH CONFIDENCE" : bustProb < 60 ? "MODERATE CONFIDENCE" : "LOW CONFIDENCE",
          color: bustProb < 30 ? "#10b981" : bustProb < 60 ? "#f59e0b" : "#ef4444",
          badge_class: bustProb < 30 ? "badge-risk-low" : bustProb < 60 ? "badge-risk-mod" : "badge-risk-high",
          stability: bustProb < 30 ? "HIGH" : bustProb < 60 ? "MODERATE" : "LOW",
        };

    if (rainElem) {
      const rainVal = (reliabilityData.rainfall_mm !== undefined && reliabilityData.rainfall_mm !== null)
        ? reliabilityData.rainfall_mm
        : (reliabilityData.focus_lead_rainfall_mm !== undefined ? reliabilityData.focus_lead_rainfall_mm : 0);
      rainElem.textContent = `${Math.round(rainVal)} mm`;
    }

    if (condElem) {
      const rainVal = (reliabilityData.rainfall_mm !== undefined && reliabilityData.rainfall_mm !== null)
        ? reliabilityData.rainfall_mm
        : (reliabilityData.focus_lead_rainfall_mm || 0);
      condElem.textContent = rainVal > 30 ? "Heavy Rain Expected" : rainVal > 5 ? "Moderate Rain / Showers" : "Stable Forecast";
    }

    if (dateElem) {
      dateElem.textContent = reliabilityData.target_date
        ? `Target: ${reliabilityData.target_date} (${reliabilityData.forecast_run || '00Z GFS'})`
        : `Target: Lead Day ${reliabilityData.focus_lead_day || 6} Outlook`;
    }

    if (trustScoreElem) {
      trustScoreElem.textContent = `${riskInfo.trust_score} / 100`;
      trustScoreElem.style.color = riskInfo.color;
    }
    if (confTierElem) {
      const icon = riskInfo.risk_level === 'LOW' ? '🟢' : riskInfo.risk_level === 'MODERATE' ? '🟡' : '🔴';
      confTierElem.textContent = `${icon} ${riskInfo.confidence_label}`;
      confTierElem.style.color = riskInfo.color;
    }

    if (bustProbElem) {
      bustProbElem.textContent = `${riskInfo.bust_probability}%`;
      bustProbElem.style.color = riskInfo.color;
    }
    if (riskTierElem) {
      const icon = riskInfo.risk_level === 'LOW' ? '🟢' : riskInfo.risk_level === 'MODERATE' ? '🟡' : '🔴';
      riskTierElem.textContent = `${icon} ${riskInfo.risk_label}`;
      riskTierElem.style.color = riskInfo.color;
    }

    if (stabElem) {
      const rawStab = reliabilityData.forecast_stability || (reliabilityData.drift_monitor ? reliabilityData.drift_monitor.stability_level : null) || riskInfo.stability;
      const formattedStab = typeof WeatherTrustCommon !== 'undefined'
        ? WeatherTrustCommon.formatStability(rawStab)
        : `${rawStab} STABILITY`;
      stabElem.textContent = formattedStab;
      stabElem.style.color = (rawStab === 'HIGH' || rawStab === 'HIGH STABILITY') ? '#10b981' : (rawStab === 'MODERATE' || rawStab === 'MODERATE STABILITY') ? '#f59e0b' : '#ef4444';
    }
    if (runChangeElem) {
      const rawDrift = reliabilityData.forecast_drift_mm ?? (reliabilityData.drift_monitor ? reliabilityData.drift_monitor.absolute_change : null);
      const driftText = typeof WeatherTrustCommon !== 'undefined'
        ? WeatherTrustCommon.formatDrift(rawDrift)
        : (rawDrift !== null && rawDrift !== undefined && !isNaN(rawDrift) ? `+${Math.round(rawDrift)} mm Drift` : "Drift data unavailable");
      runChangeElem.textContent = driftText;
      if (rawDrift !== null && rawDrift !== undefined && !isNaN(rawDrift)) {
        runChangeElem.style.color = Number(rawDrift) > 20 ? '#ef4444' : '#f59e0b';
      } else {
        runChangeElem.style.color = '#94a3b8';
      }
    }

    if (actionGuidance) {
      actionGuidance.textContent = reliabilityData.recommendation;
    }

    // Also update Decision Support page advisory
    const secTitle = document.getElementById('decisionSupportSectorTitle');
    const secBadge = document.getElementById('decisionSupportTierBadge');
    const secAction = document.getElementById('decisionSupportActionText');
    if (secTitle) secTitle.textContent = `${currentSector} Operational Advisory`;
    if (secBadge) {
      secBadge.textContent = `${riskInfo.risk_label} WINDOW`;
      secBadge.className = `badge ${riskInfo.badge_class}`;
    }
    if (secAction) secAction.textContent = reliabilityData.recommendation;
  } else {
    if (typeof WeatherTrustCommon !== 'undefined') {
      WeatherTrustCommon.syncForecastData({ available: false, location: currentLocation });
    }
    if (rainElem) rainElem.textContent = `-- mm`;
    if (condElem) condElem.textContent = `Forecast Unavailable`;
    if (dateElem) dateElem.textContent = `Target: Data Unavailable`;
    if (trustScoreElem) {
      trustScoreElem.textContent = `-- / 100`;
      trustScoreElem.style.color = '#94a3b8';
    }
    if (confTierElem) {
      confTierElem.textContent = `⚪ DATA UNAVAILABLE`;
      confTierElem.style.color = '#94a3b8';
    }
    if (bustProbElem) {
      bustProbElem.textContent = `--%`;
      bustProbElem.style.color = '#94a3b8';
    }
    if (riskTierElem) {
      riskTierElem.textContent = `⚪ DATA UNAVAILABLE`;
      riskTierElem.style.color = '#94a3b8';
    }
    if (stabElem) {
      stabElem.textContent = `DATA UNAVAILABLE`;
      stabElem.style.color = '#94a3b8';
    }
    if (runChangeElem) {
      runChangeElem.textContent = `Drift data unavailable`;
      runChangeElem.style.color = '#94a3b8';
    }
    if (actionGuidance) {
      actionGuidance.textContent = `Reliability analysis unavailable for ${currentLocation}.`;
    }
  }
}

/**
 * Loads and refreshes all dashboard modules across all 10 pages
 */
async function loadDashboard(locationQuery, sector = currentSector, lat = null, lon = null, state = null) {
  currentLocation = locationQuery;
  currentSector = sector;

  if (typeof WeatherTrustCommon !== 'undefined') {
    WeatherTrustCommon.setLocation({
      name: locationQuery,
      place: locationQuery,
      district: locationQuery,
      state: state || '',
      latitude: lat,
      longitude: lon,
      country: 'India'
    });
  }

  // Clear previous location rendering immediately to prevent data leakage
  WeatherUI.renderCurrentWeather(null, locationQuery);
  WeatherUI.renderHourlyTimeline([]);
  WeatherUI.renderDailyForecast([], null);
  updateDashboardHeroCards(null, null);

  showLoading(`Analyzing forecast reliability for ${locationQuery}...`);
  hideError();

  try {
    // Concurrent data retrieval from existing backend services
    const [weatherData, reliabilityData, driftData] = await Promise.all([
      WeatherUI.fetchForecast(locationQuery, lat, lon, state),
      ReliabilityUI.fetchOverview(locationQuery, 6, sector, lat, lon, state),
      DriftUI.fetchDriftHistory(locationQuery, lat, lon),
    ]);

    // Update Central Dashboard Overview Entrypoint
    updateDashboardHeroCards(weatherData, reliabilityData);

    // Update Weather Scene Engine (Live Weather Scene)
    if (typeof WeatherSceneEngine !== 'undefined' && WeatherSceneEngine.loadSceneForLocation) {
      WeatherSceneEngine.loadSceneForLocation(locationQuery);
    }

    // Page 2: Live Weather / Live Tracking Page View
    if (weatherData && weatherData.available !== false && weatherData.current) {
      WeatherUI.renderCurrentWeather(weatherData.current);
      WeatherUI.renderHourlyTimeline(weatherData.hourly);
      WeatherUI.renderDailyForecast(weatherData.daily, reliabilityData);
      WeatherUI.renderAlerts(weatherData.alerts);

      if (typeof renderHourlyTrendChart === 'function') {
        renderHourlyTrendChart(weatherData.hourly);
      }
    } else {
      WeatherUI.renderCurrentWeather(null, locationQuery);
      WeatherUI.renderHourlyTimeline([]);
      WeatherUI.renderDailyForecast([], null);
      WeatherUI.renderAlerts([]);
    }

    // Live Tracking Unified Sections (Daily Forecast, Drift, History, Reliability)
    if (typeof LiveTrackingUI !== 'undefined' && typeof LiveTrackingUI.renderLiveTrackingSections === 'function') {
      LiveTrackingUI.renderLiveTrackingSections(weatherData, reliabilityData, driftData);
    }

    // Page 4: Forecast Trust Page View
    if (reliabilityData) {
      ReliabilityUI.renderHero(reliabilityData);
      if (typeof renderBustRiskChart === 'function' && reliabilityData.available !== false) {
        renderBustRiskChart(reliabilityData.lead_days);
      }
    }

    // Page 5: Forecast Drift Page View
    if (driftData) {
      DriftUI.renderDriftSection(driftData);
    }

    // Page 7: Alerts Page View
    await fetchAndRenderAlertsPage(locationQuery);

    // Page 6: India Map View synchronization
    if (typeof IndiaMapUI !== 'undefined' && typeof IndiaMapUI.selectLocation === 'function') {
      if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
        const locObj = {
          place: locationQuery,
          district: locationQuery,
          state: state || 'Andhra Pradesh',
          country: 'India',
          latitude: Number(lat),
          longitude: Number(lon)
        };
        IndiaMapUI.selectLocation(locObj, false);
      }
    }

    // Page 9: Technical / Judge View
    if (typeof JudgeUI !== 'undefined') {
      JudgeUI.fetchMetrics().then(data => {
        JudgeUI.renderJudgeDashboard(data);
      });
    }

    // SIH 10/10 Synchronization
    window.currentSelectedLocation = locationQuery;
    if (typeof loadDaywiseForecast === 'function') loadDaywiseForecast(locationQuery);
    if (typeof loadUncertaintyView === 'function') loadUncertaintyView(locationQuery);
    if (typeof loadCalibrationView === 'function') loadCalibrationView();
    if (typeof loadExplainabilityData === 'function') loadExplainabilityData(locationQuery, 6);
    if (typeof loadConfidenceMapData === 'function' && typeof currentConfidenceLeadDay !== 'undefined') {
      loadConfidenceMapData(currentConfidenceLeadDay);
    }

    hideLoading();
  } catch (err) {
    console.error("loadDashboard error:", err);
    hideLoading();
    showError(err.message || "Failed to retrieve forecast data. Please retry.");
  }
}

/**
 * Fetches and renders alerts for the dedicated Alerts page view
 */
async function fetchAndRenderAlertsPage(locationName) {
  try {
    const res = await fetch(`/api/alerts/reliability?location=${encodeURIComponent(locationName)}`);
    if (!res.ok) return;
    const payload = await res.json();
    const container = document.getElementById('alertsListContainer');
    const badge = document.getElementById('alertsNavBadge');
    const activeBadge = document.getElementById('activeAlertCountBadge');

    if (badge) badge.textContent = payload.active_alerts_count;
    if (activeBadge) activeBadge.textContent = `Active Alerts: ${payload.active_alerts_count}`;

    if (container && payload.alerts) {
      container.innerHTML = '';
      payload.alerts.forEach(a => {
        const severityClass = a.severity === 'HIGH' ? 'high-severity' : a.severity === 'MODERATE' ? 'mod-severity' : 'stable-severity';
        const badgeClass = a.severity === 'HIGH' ? 'badge-risk-high' : a.severity === 'MODERATE' ? 'badge-risk-mod' : 'badge-risk-low';
        const icon = a.severity === 'HIGH' ? '⚠️' : a.severity === 'MODERATE' ? '🛡️' : '✓';

        const card = document.createElement('div');
        card.className = `alert-card ${severityClass}`;
        card.innerHTML = `
          <div class="alert-main">
            <span class="alert-icon-wrap">${icon}</span>
            <div class="alert-info">
              <div style="display:flex; align-items:center; gap:8px;">
                <h4>${a.headline}</h4>
                <span class="badge ${badgeClass}">${a.severity}</span>
              </div>
              <p>${a.message}</p>
              <div class="alert-meta">
                <span>📍 ${payload.location}</span>
                <span>•</span>
                <span>${a.metric}</span>
                <span>•</span>
                <span>${a.disclaimer}</span>
              </div>
            </div>
          </div>
          <button class="alert-ack-btn" onclick="this.closest('.alert-card').classList.toggle('read')">Mark Read</button>
        `;
        container.appendChild(card);
      });
    }
  } catch (e) {
    console.error("fetchAndRenderAlertsPage error:", e);
  }
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  // Quick location pills
  const pills = document.querySelectorAll('.pill-btn');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const loc = pill.getAttribute('data-location');
      loadDashboard(loc);
    });
  });

  // Sector Persona Selector
  const sectorBtns = document.querySelectorAll('.sector-pill');
  sectorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sectorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const sec = btn.getAttribute('data-sector');
      currentSector = sec;
      ReliabilityUI.fetchOverview(currentLocation, 6, currentSector).then(data => {
        ReliabilityUI.renderHero(data);
        updateDashboardHeroCards(null, data);
      });
    });
  });

  // Search input & autocomplete
  const searchInput = document.getElementById('citySearchInput');
  const searchDropdown = document.getElementById('searchDropdown');

  let debounceTimer;
  if (searchInput && searchDropdown) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      const query = e.target.value.trim();

      if (query.length < 2) {
        searchDropdown.classList.remove('active');
        searchDropdown.innerHTML = '';
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/weather/search?q=${encodeURIComponent(query)}`);
          const results = await res.json();

          if (results.length > 0) {
            searchDropdown.innerHTML = '';
            results.forEach(item => {
              const div = document.createElement('div');
              div.className = 'search-dropdown-item';
              div.innerHTML = `
                <span><strong>${item.name}</strong>, ${item.region}</span>
                <span style="font-size: 0.75rem; color: #94a3b8;">${item.country}</span>
              `;
              div.addEventListener('click', () => {
                searchInput.value = `${item.name}, ${item.region}`;
                searchDropdown.classList.remove('active');
                pills.forEach(p => p.classList.remove('active'));
                const statePart = item.region ? item.region.split(',').pop().trim() : (item.state || 'Andhra Pradesh');
                const locObj = {
                  place: item.name,
                  district: item.district || item.name,
                  state: statePart,
                  state_code: item.state_code || '',
                  country: item.country || 'India',
                  latitude: Number(item.latitude),
                  longitude: Number(item.longitude),
                };
                if (typeof LiveTrackingUI !== 'undefined') {
                  LiveTrackingUI.selectLocation(statePart, item.name, false);
                }
                if (typeof IndiaMapUI !== 'undefined' && typeof IndiaMapUI.selectLocation === 'function') {
                  IndiaMapUI.selectLocation(locObj, false);
                }
                loadDashboard(item.name, currentSector, item.latitude, item.longitude, item.region);
              });
              searchDropdown.appendChild(div);
            });
            searchDropdown.classList.add('active');
          } else {
            searchDropdown.classList.remove('active');
          }
        } catch (err) {
          console.error("Search failed:", err);
        }
      }, 250);
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.remove('active');
      }
    });

    searchInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          searchDropdown.classList.remove('active');
          try {
            const resp = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`);
            if (resp.ok) {
              const matches = await resp.json();
              if (matches && matches.length > 0) {
                const match = matches[0];
                pills.forEach(p => p.classList.remove('active'));
                if (typeof LiveTrackingUI !== 'undefined') {
                  LiveTrackingUI.selectLocation(match.state, match.place, false);
                }
                if (typeof IndiaMapUI !== 'undefined' && typeof IndiaMapUI.selectLocation === 'function') {
                  IndiaMapUI.selectLocation(match, false);
                }
                loadDashboard(match.place, currentSector, match.latitude, match.longitude, match.state);
                return;
              }
            }
            const weatherSearchResp = await fetch(`/api/weather/search?q=${encodeURIComponent(query)}`);
            if (weatherSearchResp.ok) {
              const wMatches = await weatherSearchResp.json();
              if (wMatches && wMatches.length > 0) {
                const wMatch = wMatches[0];
                pills.forEach(p => p.classList.remove('active'));
                loadDashboard(wMatch.name, currentSector, wMatch.latitude, wMatch.longitude, wMatch.region);
                return;
              }
            }
          } catch (err) {}
          showError(`Location "${query}" not found. Please select a valid Indian city or district.`);
        }
      }
    });
  }

  // GPS Locate Me Button Handler
  const locateBtn = document.getElementById('locateMeBtn');
  if (locateBtn) {
    locateBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }
      locateBtn.innerHTML = '<span>⏳</span> Locating...';
      locateBtn.disabled = true;

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(`/api/weather/locate?lat=${latitude}&lon=${longitude}`);
            if (res.ok) {
              const data = await res.json();
              if (data.current && data.current.location) {
                const matchedLoc = data.current.location;
                if (searchInput) searchInput.value = matchedLoc;
                pills.forEach(p => p.classList.remove('active'));
                loadDashboard(matchedLoc);
              }
            }
          } catch (err) {
            console.error("GPS locate error:", err);
          } finally {
            locateBtn.innerHTML = '<span>📍</span> Locate';
            locateBtn.disabled = false;
          }
        },
        (err) => {
          console.warn("Geolocation denied or error:", err.message);
          alert("Unable to fetch GPS location. Please allow location permissions or search manually.");
          locateBtn.innerHTML = '<span>📍</span> Locate';
          locateBtn.disabled = false;
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }

  // Manual Refresh Now Button
  const refreshBtn = document.getElementById('refreshNowBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.classList.add('spinning');
      await loadDashboard(currentLocation);
      setTimeout(() => refreshBtn.classList.remove('spinning'), 600);
    });
  }

  // Retry Button in Global Error Card
  const retryBtn = document.getElementById('globalRetryBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      hideError();
      loadDashboard(currentLocation);
    });
  }

  // Auto-refresh every 30 minutes
  setInterval(() => {
    console.log("[WeatherTrust] 30-minute auto-refresh triggered...");
    loadDashboard(currentLocation);
  }, 30 * 60 * 1000);
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  if (typeof LiveTrackingUI !== 'undefined' && typeof LiveTrackingUI.init === 'function') {
    LiveTrackingUI.init();
  }
  const activePill = document.querySelector('.pill-btn.active');
  const initialLoc = activePill ? activePill.getAttribute('data-location') : "Delhi";
  loadDashboard(initialLoc);
  if (typeof IndiaMapUI !== 'undefined' && typeof IndiaMapUI.initMap === 'function') {
    IndiaMapUI.initMap();
  }
});
