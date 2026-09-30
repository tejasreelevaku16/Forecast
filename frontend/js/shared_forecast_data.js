/**
 * WeatherTrust AI — Shared Forecast & Risk Consistency Controller
 * Central single source of truth for:
 * 1. Bust Risk & Reliability Classification (strictly standardized thresholds: 0-29% Low, 30-59% Moderate, 60-100% High).
 * 2. Forecast Drift formatting (guarantees no 'undefined mm' or 'NaN' is ever shown).
 * 3. Shared synchronized forecast data state across all pages.
 */

const WeatherTrustCommon = {
  // Authoritative single location state across all pages
  currentLocation: {
    name: "Krishna District",
    displayName: "Krishna District, Andhra Pradesh, India",
    city: "Krishna District",
    place: "Krishna District",
    district: "Krishna District",
    state: "Andhra Pradesh",
    latitude: 16.1875,
    longitude: 81.1389,
    country: "India",
  },

  setLocation(locObj) {
    if (!locObj) return;
    const name = locObj.name || locObj.place || "Selected Location";
    const rawLat = locObj.latitude !== undefined && locObj.latitude !== null ? locObj.latitude : (locObj.lat !== undefined && locObj.lat !== null ? locObj.lat : null);
    const rawLon = locObj.longitude !== undefined && locObj.longitude !== null ? locObj.longitude : (locObj.lon !== undefined && locObj.lon !== null ? locObj.lon : null);

    const lat = rawLat !== null && !isNaN(Number(rawLat)) ? Number(rawLat) : null;
    const lon = rawLon !== null && !isNaN(Number(rawLon)) ? Number(rawLon) : null;

    this.currentLocation = {
      name: name,
      displayName: locObj.displayName || locObj.display_name || name,
      city: locObj.city || locObj.place || name,
      place: locObj.place || name,
      district: locObj.district || locObj.name || name,
      state: locObj.state || locObj.region || "",
      state_code: locObj.state_code || "",
      latitude: lat,
      longitude: lon,
      country: locObj.country || "India",
      location_id: locObj.location_id || locObj.locationId || locObj.unique_id || (lat !== null && lon !== null ? `${name}_${lat.toFixed(3)}_${lon.toFixed(3)}` : name),
      unique_id: locObj.unique_id || locObj.location_id || locObj.locationId || (lat !== null && lon !== null ? `${name}_${lat.toFixed(3)}_${lon.toFixed(3)}` : name)
    };
    try {
      localStorage.setItem('weathertrust-authoritative-location', JSON.stringify(this.currentLocation));
      window.currentSelectedLocation = name;
      window.currentSelectedLat = lat;
      window.currentSelectedLon = lon;
      window.selectedLocation = this.currentLocation;
      window.dispatchEvent(new CustomEvent("weathertrust:locationChanged", { detail: this.currentLocation }));
    } catch (e) {}
  },

  getLocation() {
    return this.currentLocation;
  },

  // Common Data Store
  current: {
    available: true,
    location: "Krishna District",
    target_date: "Lead Day 6 Outlook",
    forecast_run: "00Z GFS Cycle",
    rainfall: 80.0,
    temperature: 28.0,
    precipitation_probability: 85,
    trust_score: 24,
    bust_probability: 76,
    bust_risk: "HIGH RISK",
    forecast_drift: 55.0,
    forecast_drift_str: "+55 mm Drift",
    confidence: "Low",
    confidence_label: "LOW CONFIDENCE",
    stability: "LOW",
    stability_label: "LOW STABILITY",
    last_updated: "Today, 6:30 PM",
  },

  /**
   * Centralized Bust Probability to Risk / Reliability Tier Classifier
   * 0–29%   : LOW RISK      | HIGH RELIABILITY     | HIGH CONFIDENCE     | #10b981 (Green)
   * 30–59%  : MODERATE RISK | MODERATE RELIABILITY | MODERATE CONFIDENCE | #f59e0b (Amber)
   * 60–100% : HIGH RISK     | LOW RELIABILITY      | LOW CONFIDENCE      | #ef4444 (Red)
   */
  classifyRisk(bustProbPct) {
    let prob = 50;
    if (bustProbPct !== undefined && bustProbPct !== null && !isNaN(Number(bustProbPct))) {
      prob = Math.max(0, Math.min(100, Math.round(Number(bustProbPct))));
    }
    const trust = 100 - prob;

    if (prob < 30) {
      return {
        bust_probability: prob,
        trust_score: trust,
        risk_level: "LOW",
        risk_label: "LOW RISK",
        risk_display: "Low Risk",
        reliability_level: "HIGH",
        confidence: "High",
        confidence_label: "HIGH CONFIDENCE",
        stability: "HIGH",
        stability_label: "HIGH STABILITY",
        color: "#10b981",
        badge_class: "badge-risk-low",
      };
    } else if (prob < 60) {
      return {
        bust_probability: prob,
        trust_score: trust,
        risk_level: "MODERATE",
        risk_label: "MODERATE RISK",
        risk_display: "Moderate Risk",
        reliability_level: "MODERATE",
        confidence: "Moderate",
        confidence_label: "MODERATE CONFIDENCE",
        stability: "MODERATE",
        stability_label: "MODERATE STABILITY",
        color: "#f59e0b",
        badge_class: "badge-risk-mod",
      };
    } else {
      return {
        bust_probability: prob,
        trust_score: trust,
        risk_level: "HIGH",
        risk_label: "HIGH RISK",
        risk_display: "High Risk",
        reliability_level: "LOW",
        confidence: "Low",
        confidence_label: "LOW CONFIDENCE",
        stability: "LOW",
        stability_label: "LOW STABILITY",
        color: "#ef4444",
        badge_class: "badge-risk-high",
      };
    }
  },

  /**
   * Safely formats Forecast Drift.
   * NEVER returns 'undefined mm', 'null', or 'NaN'.
   * If available: '+55 mm Drift' or '+12 mm Drift'.
   * If unavailable: 'Drift data unavailable'.
   */
  formatDrift(driftVal) {
    if (driftVal === undefined || driftVal === null || driftVal === '' || String(driftVal).trim() === '') {
      return "Drift data unavailable";
    }
    const val = Number(driftVal);
    if (isNaN(val)) {
      return "Drift data unavailable";
    }
    const sign = val > 0 ? "+" : "";
    return `${sign}${Math.round(val)} mm Drift`;
  },

  /**
   * Formats stability badge/text consistently.
   */
  formatStability(stab) {
    if (!stab || typeof stab !== 'string') return "STABILITY";
    const clean = stab.trim().toUpperCase();
    if (clean.includes("STABILITY")) return clean;
    return `${clean} STABILITY`;
  },

  /**
   * Updates common store from backend payloads to keep all pages synchronized
   */
  syncForecastData(payload) {
    if (!payload) return;
    if (payload.available === false) {
      this.current.available = false;
      if (payload.location) this.current.location = payload.location;
      this.current.target_date = "Data Unavailable";
      this.current.rainfall = null;
      this.current.temperature = null;
      this.current.precipitation_probability = null;
      this.current.trust_score = null;
      this.current.bust_probability = null;
      this.current.bust_risk = "DATA UNAVAILABLE";
      this.current.forecast_drift = null;
      this.current.forecast_drift_str = "Drift data unavailable";
      this.current.confidence = "Unavailable";
      this.current.confidence_label = "DATA UNAVAILABLE";
      this.current.stability = "UNKNOWN";
      this.current.stability_label = "STABILITY UNAVAILABLE";
      return;
    }
    this.current.available = true;
    if (payload.location) this.current.location = payload.location;
    if (payload.target_date) this.current.target_date = payload.target_date;
    if (payload.forecast_run) this.current.forecast_run = payload.forecast_run;
    if (payload.rainfall_mm !== undefined) this.current.rainfall = payload.rainfall_mm;
    if (payload.temperature_c !== undefined) this.current.temperature = payload.temperature_c;
    if (payload.precipitation_probability_pct !== undefined) {
      this.current.precipitation_probability = payload.precipitation_probability_pct;
    }
    if (payload.reliability_score !== undefined) this.current.trust_score = payload.reliability_score;
    if (payload.bust_probability_pct !== undefined) this.current.bust_probability = payload.bust_probability_pct;

    const driftVal = payload.forecast_drift_mm ?? (payload.drift_monitor ? payload.drift_monitor.absolute_change : null);
    if (driftVal !== null && driftVal !== undefined && !isNaN(driftVal)) {
      this.current.forecast_drift = Number(driftVal);
      this.current.forecast_drift_str = this.formatDrift(driftVal);
    } else {
      this.current.forecast_drift = null;
      this.current.forecast_drift_str = "Drift data unavailable";
    }

    const riskInfo = this.classifyRisk(this.current.bust_probability);
    this.current.bust_risk = riskInfo.risk_label;
    this.current.confidence = riskInfo.confidence;
    this.current.confidence_label = riskInfo.confidence_label;
    this.current.stability = payload.forecast_stability || riskInfo.stability;
    this.current.stability_label = this.formatStability(this.current.stability);
    if (payload.last_updated) this.current.last_updated = payload.last_updated;
  },

  getForecast() {
    return this.current;
  }
};

// Expose globally
window.WeatherTrustCommon = WeatherTrustCommon;

// Restore the full selected location, including GPS coordinates, between visits.
try {
  const savedLocation = localStorage.getItem("weathertrust-authoritative-location");
  if (savedLocation) {
    const parsedLocation = JSON.parse(savedLocation);
    if (parsedLocation && (parsedLocation.place || parsedLocation.name)) {
      WeatherTrustCommon.setLocation(parsedLocation);
    }
  }
} catch (_) {}

// Cache GET responses for the SPA session so page-specific loaders can reuse
// their own warmed data when a page is opened. Endpoints and payloads remain
// separate; the cache key is the complete request URL.
const WEATHERTRUST_API_CACHE_TTL = 5 * 60 * 1000;
const WEATHERTRUST_API_CACHE_LIMIT = 128;
const WEATHERTRUST_API_STALE_TTL = 24 * 60 * 60 * 1000;
const WEATHERTRUST_API_SESSION_KEY = "weathertrust-api-cache-v1";
const WEATHERTRUST_API_SESSION_LIMIT = 1536 * 1024;
const weatherTrustApiCache = new Map();
const weatherTrustApiInflight = new Map();
const weatherTrustNativeFetch = window.fetch.bind(window);

// Restore compact, successful page-specific responses for this browser tab.
// This lets pages render immediately from their own last result while live
// requests refresh in the background after a reload or brief connection loss.
try {
  const saved = JSON.parse(sessionStorage.getItem(WEATHERTRUST_API_SESSION_KEY) || "{}");
  for (const [key, value] of Object.entries(saved)) {
    if (value && value.savedAt && Date.now() - value.savedAt <= WEATHERTRUST_API_STALE_TTL) {
      weatherTrustApiCache.set(key, {
        ...value.record,
        expiresAt: value.savedAt + WEATHERTRUST_API_CACHE_TTL,
        savedAt: value.savedAt,
      });
    }
  }
} catch (_) {}

function weatherTrustPersistApiResponse(key, record) {
  // Large GIS responses are fetched on demand and should not consume browser
  // storage needed by the location-specific page data.
  if (record.body.length > 128 * 1024) return;
  try {
    const saved = JSON.parse(sessionStorage.getItem(WEATHERTRUST_API_SESSION_KEY) || "{}");
    saved[key] = { savedAt: Date.now(), record };
    let entries = Object.entries(saved).sort((a, b) => b[1].savedAt - a[1].savedAt);
    let compact = Object.fromEntries(entries);
    while (entries.length && JSON.stringify(compact).length > WEATHERTRUST_API_SESSION_LIMIT) {
      entries.pop();
      compact = Object.fromEntries(entries);
    }
    sessionStorage.setItem(WEATHERTRUST_API_SESSION_KEY, JSON.stringify(compact));
  } catch (_) {}
}

function weatherTrustResponse(record) {
  const headers = record.contentType ? { "Content-Type": record.contentType } : {};
  if (record.stale) headers["X-WeatherTrust-Stale"] = "true";
  return new Response(record.body, {
    status: record.status,
    statusText: record.statusText,
    headers,
  });
}

function weatherTrustAbortable(promise, signal) {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(signal.reason || new DOMException("Aborted", "AbortError"));
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason || new DOMException("Aborted", "AbortError"));
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => { signal.removeEventListener("abort", onAbort); resolve(value); },
      (error) => { signal.removeEventListener("abort", onAbort); reject(error); }
    );
  });
}

window.fetch = function weatherTrustCachedFetch(input, init = {}) {
  const requestUrl = typeof input === "string" ? input : input.url;
  const method = String(init.method || (typeof input === "string" ? "GET" : input.method) || "GET").toUpperCase();
  let url;
  try { url = new URL(requestUrl, window.location.href); } catch (_) { return weatherTrustNativeFetch(input, init); }

  if (method !== "GET" || url.origin !== window.location.origin || !url.pathname.startsWith("/api/") || init.cache === "no-store") {
    return weatherTrustNativeFetch(input, init);
  }

  const key = url.href;
  const now = Date.now();
  const cached = weatherTrustApiCache.get(key);
  if (cached && cached.expiresAt > now) return Promise.resolve(weatherTrustResponse(cached));
  const stale = cached && cached.savedAt && now - cached.savedAt <= WEATHERTRUST_API_STALE_TTL
    ? { ...cached, stale: true }
    : null;

  let pending = weatherTrustApiInflight.get(key);
  if (!pending) {
    // Keep the shared network request alive when one page is left mid-load;
    // other pages and the background warmer can still use its result.
    const requestInit = { ...init };
    delete requestInit.signal;
    pending = weatherTrustNativeFetch(input, requestInit)
      .then(async (response) => {
        const body = await response.clone().text();
        const record = {
          body,
          status: response.status,
          statusText: response.statusText,
          contentType: response.headers.get("content-type") || "",
        };
        if (response.ok) {
          if (weatherTrustApiCache.size >= WEATHERTRUST_API_CACHE_LIMIT) {
            weatherTrustApiCache.delete(weatherTrustApiCache.keys().next().value);
          }
          const savedAt = Date.now();
          weatherTrustApiCache.set(key, { ...record, expiresAt: savedAt + WEATHERTRUST_API_CACHE_TTL, savedAt });
          weatherTrustPersistApiResponse(key, record);
        }
        return response.ok || !stale ? record : stale;
      })
      .catch((error) => {
        if (stale) return stale;
        throw error;
      })
      .finally(() => weatherTrustApiInflight.delete(key));
    weatherTrustApiInflight.set(key, pending);
  }

  return weatherTrustAbortable(pending, init.signal).then(weatherTrustResponse);
};

const weatherTrustPreloadRuns = new Map();
WeatherTrustCommon.preloadPageData = function preloadPageData(location = this.getLocation()) {
  const selected = location && typeof location === "object" ? location : { name: String(location || "Krishna District") };
  const place = selected.place || selected.name || selected.city || "Krishna District";
  const district = selected.district || place;
  const state = selected.state || selected.region || "";
  const lat = selected.latitude ?? selected.lat ?? null;
  const lon = selected.longitude ?? selected.lon ?? null;
  const sector = typeof currentSector !== "undefined" ? currentSector : "General Public";
  const preloadKey = `${place.toLowerCase()}|${lat ?? ""}|${lon ?? ""}|${state.toLowerCase()}|${sector}`;
  const existingRun = weatherTrustPreloadRuns.get(preloadKey);
  if (existingRun && existingRun.expiresAt > Date.now()) return existingRun.promise;
  const hasCoords = lat !== null && lon !== null && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon));
  const enc = encodeURIComponent;
  const gpsParams = hasCoords ? `&lat=${lat}&lon=${lon}` : "";
  const regionParam = state ? `&region=${enc(state)}` : "";
  let activeRole = "forecaster";
  try { activeRole = localStorage.getItem("weathertrust_active_role") || activeRole; } catch (_) {}
  const urls = [
    `/api/weather/forecast?location=${enc(place)}${hasCoords ? `&lat=${lat}&lon=${lon}` : ""}${regionParam}`,
    `/api/reliability/overview?location=${enc(place)}&lead_day=6&sector=${enc(sector)}${gpsParams}${regionParam}`,
    `/api/reliability/daywise?location=${enc(place)}${hasCoords ? `&lat=${lat}&lon=${lon}` : ""}`,
    `/api/reliability/uncertainty?location=${enc(place)}${hasCoords ? `&lat=${lat}&lon=${lon}` : ""}`,
    `/api/drift/history?location=${enc(place)}${hasCoords ? `&lat=${lat}&lon=${lon}` : ""}`,
    `/api/explain/bust?location=${enc(place)}&lead_day=6`,
    `/api/explain/why-chain?location=${enc(place)}&lead_day=6`,
    `/api/weather/digital-twin?location=${enc(place)}`,
    `/api/weather/scene?location=${enc(place)}${hasCoords ? `&lat=${lat}&lon=${lon}` : ""}`,
    `/api/insights/badge?location=${enc(place)}&lead_day=1${gpsParams}${regionParam}`,
    `/api/alerts/reliability?location=${enc(place)}`,
    `/api/intelligence/multi-agent?location=${enc(place)}&lead_day=6`,
    `/api/reliability/passport?district=${enc(district)}`,
    `/api/stakeholder/resource-optimization?location=${enc(place)}&lead_day=6`,
    `/api/stakeholder/${activeRole}?state=${enc(state || "Andhra Pradesh")}&district=${enc(district)}&location=${enc(place)}&lead_day=6${gpsParams}`,
    "/api/judge/calibration",
    "/api/judge/metrics",
    "/api/simulator/presets",
    "/api/locations/hierarchy",
    "/api/stakeholder/states",
    "/api/map/states?day=1",
    "/api/map/states?day=6",
    "/api/map/india-reliability?day=1",
    "/api/map/india-reliability?day=6",
    `/api/stakeholder/agriculture?state=${enc(state || "Andhra Pradesh")}&district=${enc(district)}&location=${enc(place)}&lead_day=6${gpsParams}`,
    `/api/stakeholder/disaster?state=${enc(state || "Andhra Pradesh")}&district=${enc(district)}&location=${enc(place)}&lead_day=6${gpsParams}`,
    `/api/stakeholder/forecaster?state=${enc(state || "Andhra Pradesh")}&district=${enc(district)}&location=${enc(place)}&lead_day=6${gpsParams}`,
    `/api/stakeholder/public?state=${enc(state || "Andhra Pradesh")}&district=${enc(district)}&location=${enc(place)}&lead_day=6${gpsParams}`,
    "/api/stakeholder/admin",
    `/api/stakeholder/agriculture/map?location=${enc(place)}&state=${enc(state || "Andhra Pradesh")}&district=${enc(district)}&lead_day=6`,
    `/api/stakeholder/disaster/map?location=${enc(place)}&state=${enc(state || "Andhra Pradesh")}&district=${enc(district)}&lead_day=6`,
    `/api/stakeholder/districts?state=${enc(state || "Andhra Pradesh")}`,
  ];
  if (hasCoords) {
    urls.push(`/api/live-weather?latitude=${lat}&longitude=${lon}&location=${enc(place)}&region=${enc(state)}`);
    urls.push(`/api/drift/summary?location=${enc(place)}&lat=${lat}&lon=${lon}`);
  }

  let cursor = 0;
  const workers = Array.from({ length: 3 }, async () => {
    while (cursor < urls.length) {
      const url = urls[cursor++];
      try { await window.fetch(url, { priority: "low" }); } catch (_) {}
    }
  });
  const promise = Promise.all(workers);
  weatherTrustPreloadRuns.set(preloadKey, { promise, expiresAt: Date.now() + WEATHERTRUST_API_CACHE_TTL });
  return promise;
};
