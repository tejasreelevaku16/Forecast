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
let _loadingTimer = null;
function showLoading(msg = "Evaluating forecast reliability...") {
  const overlay = document.getElementById('globalLoadingOverlay');
  const text = document.getElementById('globalLoadingText');
  if (overlay) overlay.classList.add('active');
  if (text) text.textContent = msg;

  if (_loadingTimer) clearTimeout(_loadingTimer);
  _loadingTimer = setTimeout(() => {
    hideLoading();
  }, 2000);
}

function hideLoading() {
  if (_loadingTimer) {
    clearTimeout(_loadingTimer);
    _loadingTimer = null;
  }
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
    
    // Synchronize scene condition elements if present
    const sceneLoc = document.getElementById('sceneLocationTitle');
    const sceneCondCard = document.getElementById('sceneConditionCard');
    const sceneCondSub = document.getElementById('sceneConditionSubtitle');
    const sceneTemp = document.getElementById('sceneTemperature');
    const sceneHum = document.getElementById('sceneHumidity');
    const sceneWind = document.getElementById('sceneWind');
    const scenePress = document.getElementById('scenePressure');
    const sceneConf = document.getElementById('sceneConfidence');

    if (sceneLoc) sceneLoc.textContent = `${c.location}, ${c.region}`;
    if (sceneCondCard) sceneCondCard.textContent = c.condition;
    if (sceneCondSub) sceneCondSub.textContent = c.condition;
    if (sceneTemp) sceneTemp.innerHTML = `${Math.round(c.temperature_c)}<span class="weather-card-unit">°C</span>`;
    if (sceneHum) sceneHum.innerHTML = `${c.humidity_pct}<span class="weather-card-unit">%</span>`;
    if (sceneWind) sceneWind.innerHTML = `${c.wind_speed_kmh}<span class="weather-card-unit"> km/h</span>`;
    if (scenePress) scenePress.innerHTML = `${c.pressure_hpa}<span class="weather-card-unit"> hPa</span>`;
    if (sceneConf && reliabilityData && reliabilityData.reliability_score !== undefined) {
      sceneConf.innerHTML = `${reliabilityData.reliability_score}<span class="weather-card-unit">/100</span>`;
    }

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
    
    const sceneLoc = document.getElementById('sceneLocationTitle');
    const sceneCondCard = document.getElementById('sceneConditionCard');
    const sceneCondSub = document.getElementById('sceneConditionSubtitle');
    const sceneTemp = document.getElementById('sceneTemperature');
    const sceneHum = document.getElementById('sceneHumidity');
    const sceneWind = document.getElementById('sceneWind');
    const scenePress = document.getElementById('scenePressure');
    const sceneConf = document.getElementById('sceneConfidence');

    if (sceneLoc) sceneLoc.textContent = currentLocation;
    if (sceneCondCard) sceneCondCard.textContent = `Data unavailable`;
    if (sceneCondSub) sceneCondSub.textContent = `Weather unavailable`;
    if (sceneTemp) sceneTemp.innerHTML = `--<span class="weather-card-unit">°C</span>`;
    if (sceneHum) sceneHum.innerHTML = `--<span class="weather-card-unit">%</span>`;
    if (sceneWind) sceneWind.innerHTML = `--<span class="weather-card-unit"> km/h</span>`;
    if (scenePress) scenePress.innerHTML = `--<span class="weather-card-unit"> hPa</span>`;
    if (sceneConf) sceneConf.innerHTML = `--<span class="weather-card-unit">/100</span>`;

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
  const riskBadgeElem = document.getElementById('dashRiskBadge');
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
    if (riskBadgeElem) {
      riskBadgeElem.textContent = riskInfo.risk_label;
      riskBadgeElem.className = `badge ${riskInfo.badge_class}`;
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
    if (riskBadgeElem) {
      riskBadgeElem.textContent = 'DATA UNAVAILABLE';
      riskBadgeElem.className = 'badge badge-neutral';
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
let activeSearchController = null;

function normalizeLocationSelection(location, lat = null, lon = null, state = null) {
  const source = location && typeof location === 'object'
    ? location
    : { name: String(location || ''), place: String(location || ''), latitude: lat, longitude: lon, state };
  const place = source.place || source.name || source.city || '';
  const rawRegion = source.state || state || source.region || '';
  const regionParts = String(rawRegion).split(',').map(part => part.trim()).filter(Boolean);
  const stateName = source.state && !String(source.state).includes(',')
    ? source.state
    : regionParts[regionParts.length - 1] || '';
  const district = source.district || (regionParts.length > 1 ? regionParts[0] : place);
  const latitude = source.latitude ?? source.lat ?? lat;
  const longitude = source.longitude ?? source.lon ?? lon;
  const validLatitude = latitude !== null && latitude !== undefined && Number.isFinite(Number(latitude)) ? Number(latitude) : null;
  const validLongitude = longitude !== null && longitude !== undefined && Number.isFinite(Number(longitude)) ? Number(longitude) : null;
  const city = source.city || source.name || place;
  const country = source.country || 'India';

  return {
    location_id: source.location_id || source.locationId || source.unique_id || null,
    unique_id: source.unique_id || source.location_id || source.locationId || null,
    name: place,
    displayName: source.displayName || source.display_name || [city, district && district !== city ? district : '', stateName, country].filter(Boolean).join(', '),
    city,
    place,
    district,
    state: stateName,
    state_code: source.state_code || '',
    latitude: validLatitude,
    longitude: validLongitude,
    country,
  };
}

async function searchLocationResults(query, signal = null) {
  const response = await fetch(`/api/weather/search?q=${encodeURIComponent(query)}`, { signal });
  if (!response.ok) throw new Error(`Location search returned HTTP ${response.status}`);
  const results = await response.json();
  return Array.isArray(results) ? results.map(result => normalizeLocationSelection(result)) : [];
}

function updateAppLocation(locationInput, lat = null, lon = null, state = null) {
  const selectedLocation = normalizeLocationSelection(locationInput, lat, lon, state);
  const locationQuery = selectedLocation.place;
  currentLocation = locationQuery;
  window.selectedLocation = selectedLocation;
  window.currentSelectedLocation = locationQuery;
  window.currentSelectedLat = selectedLocation.latitude;
  window.currentSelectedLon = selectedLocation.longitude;

  if (typeof WeatherTrustCommon !== 'undefined') {
    WeatherTrustCommon.setLocation(selectedLocation);
  }

  // Update search input to resolved displayName
  const searchInput = document.getElementById('citySearchInput');
  if (searchInput && selectedLocation.displayName) {
    searchInput.value = selectedLocation.displayName;
  }

  // Update active page view without re-triggering unwanted modules
  const activePage = (typeof AppRouter !== 'undefined' && AppRouter.currentPage) ? AppRouter.currentPage : 'dashboard';
  if (activePage === 'dashboard') {
    loadDashboard(selectedLocation);
  } else if (activePage === 'daywise' && typeof loadDaywiseForecast === 'function') {
    loadDaywiseForecast(locationQuery);
  } else if (activePage === 'uncertainty' && typeof loadUncertaintyView === 'function') {
    loadUncertaintyView(locationQuery);
  } else if (activePage === 'drift' && typeof DriftUI !== 'undefined' && typeof DriftUI.reloadDrift === 'function') {
    DriftUI.reloadDrift(locationQuery);
  } else if (activePage === 'live-weather' && typeof LiveTrackingUI !== 'undefined' && typeof LiveTrackingUI.selectLocation === 'function') {
    LiveTrackingUI.selectLocation(selectedLocation.state, locationQuery, false, selectedLocation);
  } else if (activePage === 'map' && typeof IndiaMapUI !== 'undefined' && typeof IndiaMapUI.selectLocation === 'function') {
    IndiaMapUI.selectLocation(selectedLocation, false);
    if (typeof window.DistrictPassport !== 'undefined') {
      window.DistrictPassport.loadPassport(locationQuery);
    }
  } else if (activePage === 'stakeholder' && typeof StakeholderUI !== 'undefined' && typeof StakeholderUI.onDistrictChanged === 'function') {
    StakeholderUI.onDistrictChanged(selectedLocation.district || locationQuery);
  } else if (activePage === 'explain' && typeof loadExplainabilityData === 'function') {
    loadExplainabilityData(locationQuery, 6);
  } else if (activePage === 'forecast-replay' && typeof window.DigitalTwin !== 'undefined' && typeof window.DigitalTwin.fetchReplayData === 'function') {
    window.DigitalTwin.fetchReplayData(locationQuery);
  } else {
    loadDashboard(selectedLocation);
  }
}

function selectSearchResult(result) {
  const location = normalizeLocationSelection(result);
  if (!location.place || location.latitude === null || location.longitude === null) {
    showError(`Location "${location.displayName || location.place || 'Selected location'}" does not have usable coordinates.`);
    return;
  }

  const searchInput = document.getElementById('citySearchInput');
  const searchDropdown = document.getElementById('searchDropdown');
  if (searchInput) searchInput.value = location.displayName;
  if (searchDropdown) {
    searchDropdown.classList.remove('active');
    searchDropdown.innerHTML = '';
  }
  updateAppLocation(location);
}

async function loadDashboard(locationInput, sector = currentSector, lat = null, lon = null, state = null) {
  const reliabilityUi = typeof window !== 'undefined' ? window.ReliabilityUI : undefined;
  const selectedLocation = normalizeLocationSelection(locationInput, lat, lon, state);
  const locationQuery = selectedLocation.place;
  lat = selectedLocation.latitude;
  lon = selectedLocation.longitude;
  state = selectedLocation.state;
  currentLocation = locationQuery;
  currentSector = sector;
  window.selectedLocation = selectedLocation;
  window.currentSelectedLocation = locationQuery;
  window.currentSelectedLat = lat;
  window.currentSelectedLon = lon;
  window.currentWeatherInsights = null;
  if (typeof WeatherTrustInsightsUI !== 'undefined') WeatherTrustInsightsUI.renderAll(null);

  if (typeof WeatherTrustCommon !== 'undefined') {
    WeatherTrustCommon.setLocation(selectedLocation);
  }
  if (selectedLocation.latitude !== null && selectedLocation.longitude !== null && typeof LiveTrackingUI !== 'undefined' && typeof LiveTrackingUI.selectLocation === 'function') {
    LiveTrackingUI.selectLocation(state, locationQuery, false, selectedLocation);
  }

  // Clear previous location rendering immediately to prevent data leakage
  WeatherUI.renderCurrentWeather(null, locationQuery);
  WeatherUI.renderHourlyTimeline([]);
  WeatherUI.renderDailyForecast([], null);
  if (typeof ReliabilityUI !== 'undefined' && typeof ReliabilityUI.renderHero === 'function') ReliabilityUI.renderHero(null);
  updateDashboardHeroCards(null, null);

  showLoading(`Analyzing forecast reliability for ${locationQuery}...`);
  hideError();

  try {
    // Concurrent data retrieval scoped strictly to Dashboard needs
    const [weatherData, reliabilityData, driftData] = await Promise.all([
      WeatherUI.fetchForecast(locationQuery, lat, lon, state),
      ReliabilityUI.fetchOverview(locationQuery, 6, sector, lat, lon, state),
      DriftUI.fetchDriftHistory(locationQuery, lat, lon),
    ]);
    const insightsData = typeof WeatherTrustInsightsUI !== 'undefined'
      ? await WeatherTrustInsightsUI.fetchInsights(weatherData, reliabilityData, reliabilityData?.focus_lead_day || 6)
      : null;
    window.currentWeatherInsights = insightsData;
    if (typeof WeatherTrustInsightsUI !== 'undefined') WeatherTrustInsightsUI.renderAll(insightsData);

    // Resolve exact coordinates and state dynamically from returned weather data
    const resolvedLat = (lat !== null && !isNaN(lat)) ? Number(lat) : (weatherData && weatherData.current ? Number(weatherData.current.latitude) : null);
    const resolvedLon = (lon !== null && !isNaN(lon)) ? Number(lon) : (weatherData && weatherData.current ? Number(weatherData.current.longitude) : null);
    const resolvedState = selectedLocation.state || (weatherData && weatherData.current ? weatherData.current.region : '');
    const resolvedDistrict = selectedLocation.district || (weatherData && weatherData.current && weatherData.current.district) || locationQuery;
    const resolvedLocation = normalizeLocationSelection({
      ...selectedLocation,
      district: resolvedDistrict,
      state: resolvedState,
      latitude: resolvedLat,
      longitude: resolvedLon,
    });

    if (typeof WeatherTrustCommon !== 'undefined') {
      WeatherTrustCommon.setLocation(resolvedLocation);
    }
    window.selectedLocation = resolvedLocation;
    window.currentSelectedLocation = resolvedLocation.place;
    window.currentSelectedLat = resolvedLat;
    window.currentSelectedLon = resolvedLon;

    // Update Central Dashboard Overview Entrypoint
    updateDashboardHeroCards(weatherData, reliabilityData);
    hideLoading();

    // Update Weather Scene Engine with exact coordinates and existing score
    if (typeof WeatherSceneEngine !== 'undefined' && WeatherSceneEngine.loadSceneForLocation) {
      WeatherSceneEngine.loadSceneForLocation(locationQuery, resolvedLat, resolvedLon, reliabilityData?.reliability_score);
    }

    // Populate weather elements for seamless transition if user clicks into details
    if (weatherData && weatherData.available !== false && weatherData.current) {
      WeatherUI.renderCurrentWeather(weatherData.current);
      WeatherUI.renderHourlyTimeline(weatherData.hourly);
      WeatherUI.renderDailyForecast(weatherData.daily, reliabilityData, insightsData);
      WeatherUI.renderAlerts(weatherData.alerts);

      if (typeof renderHourlyTrendChart === 'function') {
        renderHourlyTrendChart(weatherData.hourly);
      }
    }

    // Forecast Trust Overview Hero
    if (reliabilityData && reliabilityUi && typeof reliabilityUi.renderHero === 'function') {
      reliabilityUi.renderHero(reliabilityData);
      if (typeof renderBustRiskChart === 'function' && reliabilityData.available !== false) {
        renderBustRiskChart(reliabilityData.lead_days);
      }
    }

    // Drift Hero Card Snapshot
    if (driftData) {
      DriftUI.renderDriftSection(driftData);
    }

    // Alerts Badge Count
    fetchAndRenderAlertsPage(locationQuery);

    // Dashboard Multi-Agent Intelligence Widget
    if (typeof window.MultiAgentIntelligence !== 'undefined') {
      window.MultiAgentIntelligence.loadIntelligence(locationQuery, 6);
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
  if (window._dashboardListenersSetup) return;
  window._dashboardListenersSetup = true;

  // Quick location pills
  const pills = document.querySelectorAll('.pill-btn');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const loc = pill.getAttribute('data-location');
      updateAppLocation(loc);
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
      const reliabilityUi = typeof window !== 'undefined' ? window.ReliabilityUI : undefined;
      if (reliabilityUi && typeof reliabilityUi.fetchOverview === 'function') {
        reliabilityUi.fetchOverview(currentLocation, 6, currentSector).then(data => {
          reliabilityUi.renderHero(data);
          updateDashboardHeroCards(null, data);
        });
      }
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
      searchDropdown.classList.remove('active');
      searchDropdown.innerHTML = '';

      if (query.length < 2) {
        if (activeSearchController) {
          activeSearchController.abort();
          activeSearchController = null;
        }
        return;
      }

      debounceTimer = setTimeout(async () => {
        try {
          if (activeSearchController) {
            activeSearchController.abort();
          }
          activeSearchController = new AbortController();

          const results = await searchLocationResults(query, activeSearchController.signal);
          if (searchInput.value.trim() !== query) return;

          if (results.length > 0) {
            searchDropdown.innerHTML = '';
            results.forEach(item => {
              const div = document.createElement('div');
              div.className = 'search-dropdown-item';
              const name = document.createElement('strong');
              name.textContent = item.displayName || item.name;

              const badge = document.createElement('span');
              badge.className = 'badge badge-neutral search-reliability-badge';
              badge.textContent = item.state || item.country || 'India';

              div.append(name, badge);
              div.addEventListener('click', () => {
                selectSearchResult(item);
              });
              searchDropdown.appendChild(div);
            });
            searchDropdown.classList.add('active');
          } else {
            searchDropdown.classList.remove('active');
          }
        } catch (err) {
          if (err.name === 'AbortError') return;
          console.error("Location search failed:", err);
          if (searchInput.value.trim() === query) showError("Location search is temporarily unavailable. Please try again.");
        } finally {
          activeSearchController = null;
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
            const matches = await searchLocationResults(query);
            if (matches.length > 0) {
              selectSearchResult(matches[0]);
              return;
            }
            showError(`Location "${query}" not found. Please select a valid Indian city or district.`);
          } catch (err) {
            if (err.name === 'AbortError') return;
            console.error("Location search failed:", err);
            showError("Location search is temporarily unavailable. Please try again.");
          }
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
                updateAppLocation(matchedLoc, latitude, longitude);
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
      updateAppLocation(currentLocation);
      setTimeout(() => refreshBtn.classList.remove('spinning'), 600);
    });
  }

  // Retry Button in Global Error Card
  const retryBtn = document.getElementById('globalRetryBtn');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      hideError();
      updateAppLocation(currentLocation);
    });
  }

  // Auto-refresh every 30 minutes (single registration)
  if (!window._weatherTrustRefreshTimer) {
    window._weatherTrustRefreshTimer = setInterval(() => {
      console.log("[WeatherTrust] 30-minute auto-refresh triggered...");
      updateAppLocation(currentLocation);
    }, 30 * 60 * 1000);
  }
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  if (typeof WeatherTrustInsightsUI !== 'undefined') WeatherTrustInsightsUI.init();
  if (typeof LiveTrackingUI !== 'undefined' && typeof LiveTrackingUI.init === 'function') {
    LiveTrackingUI.init();
  }
  const currentRoute = (typeof AppRouter !== 'undefined' && typeof AppRouter.getRouteFromUrl === 'function')
    ? AppRouter.getRouteFromUrl()
    : 'dashboard';
  if (currentRoute === 'dashboard') {
    const activePill = document.querySelector('.pill-btn.active');
    const initialLoc = window.currentSelectedLocation || (activePill ? activePill.getAttribute('data-location') : "Delhi");
    loadDashboard(initialLoc);
  }
});
