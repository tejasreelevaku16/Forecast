/**
 * WeatherTrust AI — Interactive India State & District Reliability Map Controller
 * Implements:
 * 1. Two-level geographic separation:
 *    LEVEL 1 — REGIONAL MAP: India -> State/UT -> District/Place (State = regional context)
 *    LEVEL 2 — WEATHER TRACKING: District/Place -> Exact Latitude + Longitude -> Live Weather API
 * 2. Unwatermarked OpenStreetMap tiles with compliant attribution.
 * 3. Exact coordinate-based weather requests for any selected Indian district/place.
 * 4. Location-isolated Forecast Drift (snapshots strictly keyed by location & coordinates).
 * 5. Transparent Reliability: Regional State Reliability vs District Reliability (no faked district scores).
 * 6. Full synchronization with Dashboard and Live Tracking.
 */

function buildOsmTileLayer() {
  return L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    maxZoom: 19,
  });
}

const IndiaMapUI = {
  map: null,
  geoJsonLayer: null,
  statesData: {},
  rawGeoJson: null,
  hierarchy: {},
  selectedState: "Andhra Pradesh",
  selectedLocation: {
    country: "India",
    state: "Andhra Pradesh",
    state_code: "AP",
    district: "Krishna",
    place: "Krishna District",
    latitude: 16.1875,
    longitude: 81.1389,
  },
  districtMarker: null,
  currentFilter: "ALL", // "ALL", "HIGH", "MODERATE", "LOW"
  currentDay: 6, // 1 to 10
  stateLayersMap: {},
  searchDebounceTimer: null,

  /**
   * Fits the complete Indian region (mainland India down to southern tip, Kerala,
   * Tamil Nadu, Lakshadweep, Andaman & Nicobar Islands, and Sri Lanka for geographic context)
   * comfortably within the map container without clipping southern latitudes.
   */
  fitIndiaBounds(animate = false) {
    if (!this.map) return;

    // Subcontinent bounding box covering Siachen/Ladakh in the North to south of Sri Lanka & Great Nicobar
    // South: 4.0°N | North: 37.5°N | West: 67.0°E | East: 98.0°E
    const comprehensiveBounds = L.latLngBounds(
      [4.0, 67.0],
      [37.5, 98.0]
    );

    this.map.invalidateSize({ pan: false });
    this.map.fitBounds(comprehensiveBounds, {
      padding: [12, 12],
      maxZoom: 5.5,
      animate,
    });
  },

  /**
   * Initializes the Leaflet map and loads reliability & boundary data
   */
  async initMap() {
    const mapContainer = document.getElementById('indiaMap');
    if (!mapContainer || typeof L === 'undefined') return;

    if (this.map) {
      this.map.invalidateSize(true);
      this.fitIndiaBounds(false);
      return;
    }

    this.showMapLoading("Loading India reliability map...");

    try {
      this.map = L.map('indiaMap', {
        center: [21.0, 82.5],
        zoom: 4.25,
        minZoom: 3.5,
        maxZoom: 12,
        zoomSnap: 0.25,
        zoomDelta: 0.5,
        zoomControl: true,
        maxBounds: [
          [-12.0, 50.0],
          [45.0, 115.0]
        ],
        maxBoundsViscosity: 0.0,
      });

      buildOsmTileLayer().addTo(this.map);

      this.setupControls();

      // Fetch state reliability, GeoJSON, and Indian location hierarchy concurrently
      let geoJsonErr = false;
      let relDataErr = false;

      await Promise.all([
        this.fetchStatesReliability(this.currentDay).catch(e => {
          relDataErr = true;
          console.error("fetchStatesReliability failed:", e);
        }),
        this.fetchIndiaGeoJson().catch(e => {
          geoJsonErr = true;
          console.error("fetchIndiaGeoJson failed:", e);
        }),
        this.fetchLocationHierarchy().catch(e => {
          console.warn("fetchLocationHierarchy warning:", e);
        }),
      ]);

      if (geoJsonErr) {
        this.showMapError("India map could not be loaded.", "geojson");
        return;
      }

      if (relDataErr) {
        this.showMapError("Reliability data unavailable.", "reliability");
        return;
      }

      this.renderGeoJsonLayer();
      this.hideMapLoading();

      // Synchronize with currently active location if set, without zooming in to preserve India view
      const activeLoc = (typeof WeatherTrustCommon !== 'undefined' && WeatherTrustCommon.currentLocation && WeatherTrustCommon.currentLocation.latitude && WeatherTrustCommon.currentLocation.longitude)
        ? {
            country: WeatherTrustCommon.currentLocation.country || 'India',
            state: WeatherTrustCommon.currentLocation.state || 'Andhra Pradesh',
            state_code: WeatherTrustCommon.currentLocation.state_code || '',
            district: WeatherTrustCommon.currentLocation.district || WeatherTrustCommon.currentLocation.name,
            place: WeatherTrustCommon.currentLocation.place || WeatherTrustCommon.currentLocation.name,
            latitude: Number(WeatherTrustCommon.currentLocation.latitude),
            longitude: Number(WeatherTrustCommon.currentLocation.longitude),
          }
        : {
            country: "India",
            state: "Andhra Pradesh",
            state_code: "AP",
            district: "Krishna",
            place: "Krishna District",
            latitude: 16.1875,
            longitude: 81.1389,
          };
      await this.selectLocation(activeLoc, false);

      requestAnimationFrame(() => {
        this.map.invalidateSize(true);
        this.fitIndiaBounds(false);
      });
    } catch (err) {
      console.error("India Map Initialization Error:", err);
      this.showMapError("India map could not be loaded. Please retry.", "general");
    }
  },

  /**
   * Fetches state-level ML reliability metrics from backend for specified day horizon
   */
  async fetchStatesReliability(day = (this.currentDay || 6)) {
    try {
      const resp = await fetch(`/api/map/states?day=${day}`);
      if (!resp.ok) {
        const fallbackResp = await fetch(`/api/map-data?day=${day}`);
        if (!fallbackResp.ok) throw new Error("Failed to fetch map data");
        const list = await fallbackResp.json();
        this.statesData = {};
        list.forEach(item => {
          this.statesData[item.state_name || item.region] = item;
        });
      } else {
        this.statesData = await resp.json();
      }
    } catch (e) {
      console.error("fetchStatesReliability error:", e);
      throw e;
    }
  },

  /**
   * Updates forecast horizon day (1 to 10) and refreshes map choropleth & panel
   */
  async setDayHorizon(day) {
    this.currentDay = Number(day) || 6;
    
    // Update active pill UI
    const dayPills = document.querySelectorAll('.map-day-pill');
    dayPills.forEach(p => {
      const pDay = parseInt(p.getAttribute('data-day'), 10);
      if (pDay === this.currentDay) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    try {
      await this.fetchStatesReliability(this.currentDay);
      if (this.geoJsonLayer) {
        this.geoJsonLayer.setStyle(feature => this.getStateStyle(feature));
      }
      if (this.selectedLocation) {
        await this.selectLocation(this.selectedLocation, false);
      } else {
        this.renderIndiaOverviewPanel();
      }
    } catch (err) {
      console.error("Error setting day horizon:", err);
    }
  },

  /**
   * Fetches and caches local India States GeoJSON
   */
  async fetchIndiaGeoJson() {
    if (this.rawGeoJson) return this.rawGeoJson;
    try {
      const resp = await fetch('/data/india_states.geojson');
      if (!resp.ok) throw new Error("Failed to fetch /data/india_states.geojson");
      this.rawGeoJson = await resp.json();
      return this.rawGeoJson;
    } catch (e) {
      console.error("fetchIndiaGeoJson error:", e);
      throw e;
    }
  },

  /**
   * Fetches Indian location hierarchy for place resolution
   */
  async fetchLocationHierarchy() {
    if (this.hierarchy && Object.keys(this.hierarchy).length > 0) return this.hierarchy;
    if (typeof LiveTrackingUI !== 'undefined' && LiveTrackingUI.hierarchy && Object.keys(LiveTrackingUI.hierarchy).length > 0) {
      this.hierarchy = LiveTrackingUI.hierarchy;
      return this.hierarchy;
    }
    try {
      const resp = await fetch('/api/locations/hierarchy');
      if (resp.ok) {
        this.hierarchy = await resp.json();
      }
    } catch (e) {
      console.warn("Could not load location hierarchy:", e);
    }
    return this.hierarchy;
  },

  /**
   * Renders Indian state polygon boundaries with reliability styling
   */
  renderGeoJsonLayer() {
    if (!this.map || !this.rawGeoJson) return;

    if (this.geoJsonLayer) {
      this.map.removeLayer(this.geoJsonLayer);
      this.geoJsonLayer = null;
    }

    this.stateLayersMap = {};

    this.geoJsonLayer = L.geoJSON(this.rawGeoJson, {
      style: (feature) => {
        const stateName = feature.properties.state_name || feature.properties.ST_NM;
        const data = this.statesData[stateName];
        
        let color = '#64748b';
        let relLevel = "LOW";
        if (data) {
          const bustProb = data.bust_probability ?? data.bust_risk_pct ?? 50;
          const riskInfo = typeof WeatherTrustCommon !== 'undefined'
            ? WeatherTrustCommon.classifyRisk(bustProb)
            : { color: data.color || '#f59e0b', reliability_level: data.reliability_level || 'MODERATE' };
          color = riskInfo.color;
          relLevel = riskInfo.reliability_level;
        }

        let opacity = 0.65;
        if (this.currentFilter !== "ALL") {
          if (!data || relLevel !== this.currentFilter) {
            opacity = 0.15;
          }
        }

        return {
          fillColor: color,
          weight: 1.2,
          opacity: 0.95,
          color: '#ffffff',
          fillOpacity: opacity,
        };
      },
      onEachFeature: (feature, layer) => {
        const stateName = feature.properties.state_name || feature.properties.ST_NM;
        this.stateLayersMap[stateName] = layer;

        const data = this.statesData[stateName];
        let riskInfo = {
          trust_score: 50,
          bust_probability: 50,
          risk_display: "Moderate Risk",
          color: "#f59e0b"
        };
        if (data) {
          const bustProb = data.bust_probability ?? data.bust_risk_pct ?? 50;
          riskInfo = typeof WeatherTrustCommon !== 'undefined'
            ? WeatherTrustCommon.classifyRisk(bustProb)
            : {
                trust_score: data.trust_score ?? (100 - bustProb),
                bust_probability: bustProb,
                risk_display: data.bust_risk || "Risk",
                color: data.color || '#38bdf8'
              };
        }
        const regionBadge = data && typeof WeatherTrustInsightsUI !== 'undefined'
          ? WeatherTrustInsightsUI.badgeInfo(riskInfo.trust_score)
          : null;

        // Single Region Reliability Card Popup
        // Enforces: Exactly ONE active popup at a time.
        // autoClose: true and closeOnClick: true ensure that clicking another region
        // or clicking the map closes/replaces the previous card. No cards stack or pile up.
        const popupContent = `
          <div class="state-reliability-popup" style="font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; min-width: 210px; padding: 4px 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0,0,0,0.08); padding-bottom: 6px; margin-bottom: 8px;">
              <strong style="font-size: 0.95rem; color: #0f172a;">${stateName}</strong>
              <span style="font-size: 0.7rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${riskInfo.color}22; color: ${riskInfo.color}; border: 1px solid ${riskInfo.color}66;">
                ${data ? (riskInfo.risk_display || data.bust_risk || "Monitored") : "Unavailable"}
              </span>
            </div>
            ${regionBadge ? `<span class="badge reliability-badge ${regionBadge.className}">${regionBadge.label}</span>` : ''}
            <div style="font-size: 0.725rem; color: #64748b; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
              Regional Reliability Overview
            </div>
            ${data ? `
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; font-size: 0.8rem;">
                <span style="color: #475569;">Trust Score:</span>
                <strong style="color: ${riskInfo.color}; font-size: 0.9rem;">${riskInfo.trust_score} / 100</strong>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 0.8rem;">
                <span style="color: #475569;">Bust Risk:</span>
                <strong style="color: ${riskInfo.color}; font-size: 0.9rem;">${riskInfo.bust_probability}%</strong>
              </div>
            ` : `
              <div style="font-size: 0.775rem; color: #94a3b8; font-style: italic; margin-bottom: 6px;">
                State model calibration unavailable
              </div>
            `}
            <div style="font-size: 0.7rem; color: #64748b; border-top: 1px dashed rgba(0,0,0,0.08); padding-top: 6px; margin-top: 4px;">
              📍 Clicked region loaded in Live Weather panel
            </div>
          </div>
        `;

        layer.bindPopup(popupContent, {
          autoClose: true,
          closeOnClick: true,
          className: 'custom-region-popup',
          maxWidth: 270,
        });

        // Simple transient hover tooltip showing only state name (does NOT stick or pile up)
        layer.bindTooltip(stateName, {
          sticky: false,
          permanent: false,
          direction: 'top',
          className: 'leaflet-state-hover-hint',
          opacity: 0.9,
        });

        layer.on({
          mouseover: (e) => {
            const target = e.target;
            target.setStyle({
              weight: 2.5,
              color: '#38bdf8',
              fillOpacity: 0.85,
            });
            target.bringToFront();
            if (this.districtMarker) this.districtMarker.bringToFront();
          },
          mouseout: (e) => {
            this.geoJsonLayer.resetStyle(e.target);
            if (this.selectedState === stateName) {
              e.target.setStyle({
                weight: 2.8,
                color: '#facc15',
                fillOpacity: 0.9,
              });
            }
            if (this.districtMarker) this.districtMarker.bringToFront();
          },
          click: () => {
            this.selectState(stateName, false);
          }
        });
      }
    }).addTo(this.map);

  },

  /**
   * Resolves a default district/place for a given state from hierarchy
   */
  resolveDefaultPlaceForState(stateName) {
    if (this.hierarchy && this.hierarchy[stateName] && this.hierarchy[stateName].length > 0) {
      const places = this.hierarchy[stateName];
      if (stateName === "Andhra Pradesh") {
        const krishna = places.find(p => p.place.toLowerCase().includes("krishna"));
        if (krishna) return krishna;
        const vja = places.find(p => p.place.toLowerCase().includes("vijayawada"));
        if (vja) return vja;
      }
      return places[0];
    }

    // Fallback coordinates for key states
    const fallbacks = {
      "Andhra Pradesh": { place: "Krishna District", district: "Krishna", state: "Andhra Pradesh", state_code: "AP", country: "India", latitude: 16.1875, longitude: 81.1389 },
      "Telangana": { place: "Hyderabad", district: "Hyderabad", state: "Telangana", state_code: "TG", country: "India", latitude: 17.3850, longitude: 78.4867 },
      "Karnataka": { place: "Bengaluru", district: "Bengaluru Urban", state: "Karnataka", state_code: "KA", country: "India", latitude: 12.9716, longitude: 77.5946 },
      "Tamil Nadu": { place: "Chennai", district: "Chennai", state: "Tamil Nadu", state_code: "TN", country: "India", latitude: 13.0827, longitude: 80.2707 },
      "Maharashtra": { place: "Mumbai", district: "Mumbai City", state: "Maharashtra", state_code: "MH", country: "India", latitude: 19.0760, longitude: 72.8777 },
      "Delhi": { place: "New Delhi", district: "New Delhi", state: "Delhi", state_code: "DL", country: "India", latitude: 28.6139, longitude: 77.2090 },
    };

    return fallbacks[stateName] || {
      place: `${stateName} Headquarters`,
      district: stateName,
      state: stateName,
      state_code: "",
      country: "India",
      latitude: 20.5937,
      longitude: 78.9629
    };
  },

  /**
   * When user clicks a state polygon, select primary district in that state
   * Keeps State = regional context, District = weather tracking location
   */
  selectState(stateName, zoomTo = false) {
    this.selectedState = stateName;
    const defaultPlace = this.resolveDefaultPlaceForState(stateName);
    if (typeof loadDashboard === 'function') {
      loadDashboard(defaultPlace, typeof currentSector !== 'undefined' ? currentSector : 'General Public');
      return;
    }
    this.selectLocation(defaultPlace, zoomTo);
  },

  /**
   * LEVEL 2 — WEATHER TRACKING
   * Selects a specific district/place, resolves exact coordinates, fetches weather for that coordinate,
   * highlights marker, and updates the right-side details panel.
   */
  async selectLocation(loc, zoomTo = true) {
    if (!loc) return;

    this.selectedLocation = loc;
    this.selectedState = loc.state || "Andhra Pradesh";

    // Synchronize across application state
    try {
      localStorage.setItem('selectedLocation', JSON.stringify(loc));
      if (typeof currentLocation !== 'undefined') {
        currentLocation = loc.place;
      }
      if (typeof LiveTrackingUI !== 'undefined' && typeof LiveTrackingUI.selectLocation === 'function') {
        LiveTrackingUI.selectLocation(loc.state, loc.place, false, loc);
      }
    } catch (e) {
      console.warn("Storage sync note:", e);
    }

    // 1. Highlight state boundary on map
    if (this.geoJsonLayer) {
      this.geoJsonLayer.eachLayer(layer => {
        this.geoJsonLayer.resetStyle(layer);
      });
      const selectedLayer = this.stateLayersMap[this.selectedState];
      if (selectedLayer) {
        selectedLayer.setStyle({
          weight: 2.8,
          color: '#facc15', // gold highlight boundary
          fillOpacity: 0.88,
        });
        selectedLayer.bringToFront();
      }
    }

    // 2. Add / Move District Location Marker at exact coordinates
    const lat = Number(loc.latitude);
    const lon = Number(loc.longitude);

    if (this.map && !isNaN(lat) && !isNaN(lon)) {
      if (this.districtMarker) {
        this.map.removeLayer(this.districtMarker);
        this.districtMarker = null;
      }

      this.districtMarker = L.circleMarker([lat, lon], {
        radius: 8,
        fillColor: '#38bdf8',
        color: '#ffffff',
        weight: 2.5,
        opacity: 1,
        fillOpacity: 0.95,
      }).addTo(this.map);

      this.districtMarker.bindPopup(`
        <div style="font-family: Inter, sans-serif; padding: 4px 6px; min-width: 150px;">
          <div style="font-size: 0.7rem; text-transform: uppercase; color: #0284c7; font-weight: 700;">Tracked Weather Location</div>
          <strong style="font-size: 0.95rem; color: #0f172a;">${loc.place}</strong>
          <div style="font-size: 0.775rem; color: #475569; margin-top: 2px;">${loc.district ? loc.district + ' District • ' : ''}${loc.state}</div>
          <div style="font-size: 0.725rem; color: #64748b; margin-top: 4px;">📍 ${lat.toFixed(4)}° N, ${lon.toFixed(4)}° E</div>
        </div>
      `, {
        autoClose: true,
        closeOnClick: true,
        maxWidth: 240,
      });

      if (zoomTo) {
        this.map.setView([lat, lon], 7, { animate: true });
        this.districtMarker.openPopup();
      }
    }

    // 3. Render loading state in panel
    this.renderPanelLoading(loc);

    // 4. Fetch Weather for THAT COORDINATE and Drift for THAT LOCATION
    let weatherData = null;
    let driftData = null;

    try {
      const [wResp, dResp] = await Promise.all([
        fetch(`/api/live-weather?latitude=${lat}&longitude=${lon}&location=${encodeURIComponent(loc.place)}&region=${encodeURIComponent(loc.state)}`),
        fetch(`/api/drift/summary?location=${encodeURIComponent(loc.place)}&lat=${lat}&lon=${lon}`),
      ]);

      if (wResp.ok) weatherData = await wResp.json();
      if (dResp.ok) driftData = await dResp.json();
    } catch (err) {
      console.error("[IndiaMapUI] Failed fetching location weather:", err);
    }

    const stateRelData = this.statesData[this.selectedState] || null;

    // 5. Render location-aware Right-Side Details Panel
    this.renderLocationDetailsPanel(loc, weatherData, driftData, stateRelData);
  },

  /**
   * Displays loading state in the details panel while fetching weather
   */
  renderPanelLoading(loc) {
    const panel = document.getElementById('mapSelectedRegionPanel');
    if (!panel) return;

    panel.innerHTML = `
      <div style="border-bottom: 1px solid var(--bg-card-border); padding-bottom: 12px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 2px;">${loc.place.toUpperCase()}</h3>
            <span style="font-size: 0.75rem; color: #94a3b8;">${loc.state} • ${Number(loc.latitude).toFixed(4)}° N, ${Number(loc.longitude).toFixed(4)}° E</span>
          </div>
          <span class="badge badge-neutral" style="color: #38bdf8;">Fetching Live...</span>
        </div>
      </div>
      <div style="padding: 40px 12px; text-align: center; color: #94a3b8;">
        <div class="loading-spinner" style="margin: 0 auto 12px;"></div>
        <div style="font-size: 0.85rem; font-weight: 600; color: #cbd5e1;">Contacting Open-Meteo for ${loc.place}...</div>
        <div style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">Lat: ${Number(loc.latitude).toFixed(4)}, Lon: ${Number(loc.longitude).toFixed(4)}</div>
      </div>
    `;
  },

  /**
   * Renders the national India overview panel when no specific place is selected
   */
  renderIndiaOverviewPanel() {
    const panel = document.getElementById('mapSelectedRegionPanel');
    if (!panel) return;

    const states = Object.values(this.statesData || {});
    const scoredStates = states.map(state => {
      const bust = state.bust_probability ?? state.bust_risk_pct;
      const score = state.trust_score ?? (bust === undefined || bust === null ? null : 100 - Number(bust));
      return score === null || !Number.isFinite(Number(score)) ? null : Number(score);
    }).filter(score => score !== null);
    const totalCount = scoredStates.length;
    const avgTrust = totalCount ? Math.round(scoredStates.reduce((total, trust) => total + trust, 0) / totalCount) : null;
    const lowCount = scoredStates.filter(score => score < 50).length;
    const highCount = scoredStates.filter(score => score >= 80).length;
    const modCount = scoredStates.filter(score => score >= 50 && score < 80).length;
    const nationalBadge = avgTrust === null || typeof WeatherTrustInsightsUI === 'undefined'
      ? { label: 'Unavailable', className: 'badge-neutral' }
      : WeatherTrustInsightsUI.badgeInfo(avgTrust);
    const currentDay = this.currentDay || 6;

    panel.innerHTML = `
      <div style="border-bottom: 1px solid var(--bg-card-border); padding-bottom: 12px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 2px;">INDIA OVERVIEW</h3>
            <span style="font-size: 0.775rem; color: #38bdf8; font-weight:600;">National NWP Reliability Index</span>
          </div>
          <span class="badge badge-neutral" style="color:#38bdf8; border-color: rgba(56,189,248,0.4);">Day ${currentDay} Horizon</span>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px; margin-top: 14px;">
        <!-- National Average Trust Card -->
        <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8)); border: 1px solid rgba(56, 189, 248, 0.2); padding: 14px; border-radius: 8px;">
          <div style="font-size:0.7rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">National Reliability Score</div>
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-top:4px;">
            <div style="font-size:1.8rem; font-weight:800; color:#38bdf8;">${avgTrust === null ? 'Unavailable' : `${avgTrust} <span style="font-size:0.9rem; color:#94a3b8;">/ 100</span>`}</div>
            <span class="badge ${nationalBadge.className}">${nationalBadge.label}</span>
          </div>
          <p style="font-size:0.75rem; color:#94a3b8; margin: 6px 0 0 0; line-height: 1.4;">
            Calculated across ${totalCount} States &amp; Union Territories for Lead Day ${currentDay}.
          </p>
        </div>

        <!-- Reliability Tier Distribution -->
        <div style="background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
          <div style="font-size:0.725rem; color:#cbd5e1; font-weight:600; margin-bottom:8px; text-transform:uppercase;">
            Monitored Regions Tier Breakdown
          </div>
          <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 8px; text-align: center;">
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 8px; border-radius: 6px;">
              <div style="font-size:1.2rem; font-weight:700; color:#10b981;">${highCount}</div>
              <div style="font-size:0.65rem; color:#94a3b8; margin-top:2px;">High Trust</div>
            </div>
            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); padding: 8px; border-radius: 6px;">
              <div style="font-size:1.2rem; font-weight:700; color:#f59e0b;">${modCount}</div>
              <div style="font-size:0.65rem; color:#94a3b8; margin-top:2px;">Moderate</div>
            </div>
            <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); padding: 8px; border-radius: 6px;">
              <div style="font-size:1.2rem; font-weight:700; color:#ef4444;">${lowCount}</div>
              <div style="font-size:0.65rem; color:#94a3b8; margin-top:2px;">High Bust Risk</div>
            </div>
          </div>
        </div>

        <!-- Guidance Card -->
        <div style="background: rgba(56, 189, 248, 0.06); border: 1px dashed rgba(56, 189, 248, 0.3); padding: 12px; border-radius: 8px; font-size: 0.8rem; color: #cbd5e1; line-height: 1.5;">
          <strong style="color: #38bdf8; display: block; margin-bottom: 4px;">💡 Geospatial Inspection</strong>
          Click any state boundary polygon on the map to review regional reliability, or use the search box above to track live weather and forecast drift at exact coordinates.
        </div>
      </div>
    `;
  },

  /**
   * Clears currently selected place/marker and switches right panel to India Overview
   */
  clearSelection() {
    this.selectedLocation = null;
    if (this.districtMarker) {
      this.map.removeLayer(this.districtMarker);
      this.districtMarker = null;
    }
    this.renderIndiaOverviewPanel();
    this.fitIndiaBounds(true);
  },

  /**
   * Renders the location-aware right-side details panel
   */
  renderLocationDetailsPanel(loc, weatherData, driftData, stateRelData) {
    const panel = document.getElementById('mapSelectedRegionPanel');
    if (!panel) return;

    const curr = (weatherData && weatherData.current) ? weatherData.current : null;
    const daily = (weatherData && weatherData.daily) ? weatherData.daily : [];
    const leadDay = this.currentDay || 6;
    const dayIdx = Math.max(0, Math.min(daily.length - 1, leadDay - 1));
    const targetDayForecast = daily.length > dayIdx ? daily[dayIdx] : null;

    // Regional (State) Reliability
    let stateTrust = null;
    let stateBust = null;
    let stateRiskLabel = "DATA UNAVAILABLE";
    let stateRiskColor = "#94a3b8";
    let stateBadgeClass = "badge-neutral";

    if (stateRelData) {
      stateBust = stateRelData.bust_probability ?? 50;
      stateTrust = stateRelData.trust_score ?? (100 - stateBust);
      if (typeof WeatherTrustCommon !== 'undefined') {
        const c = WeatherTrustCommon.classifyRisk(stateBust);
        stateRiskLabel = c.risk_label;
        stateRiskColor = c.color;
        stateBadgeClass = c.badge_class;
      }
    }

    const liveTrust = window.currentWeatherInsights?.weather_trust;
    const currentSelection = window.selectedLocation;
    const matchesSelection = currentSelection && currentSelection.place === loc.place
      && Math.abs(Number(currentSelection.latitude) - Number(loc.latitude)) < 0.01
      && Math.abs(Number(currentSelection.longitude) - Number(loc.longitude)) < 0.01;
    let districtRelHtml = "";
    if (matchesSelection && liveTrust?.available && typeof WeatherTrustInsightsUI !== 'undefined') {
      const districtBadge = WeatherTrustInsightsUI.badgeInfo(liveTrust.score);
      districtRelHtml = `
        <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px; border-radius: 6px;">
          <div>
            <span style="font-size:0.775rem; color:#cbd5e1; font-weight:700;">${loc.place} Weather Trust:</span>
            <div style="font-size:0.7rem; color:#94a3b8;">Live forecast feature score</div>
          </div>
          <div style="text-align:right;"><strong style="font-size:1.05rem; color:#f8fafc;">${liveTrust.score} / 100</strong><br><span class="badge reliability-badge ${districtBadge.className}">${districtBadge.label}</span></div>
        </div>
      `;
    } else {
      districtRelHtml = `
        <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.03); border: 1px dashed rgba(255,255,255,0.15); padding: 8px 12px; border-radius: 6px;">
          <div>
            <span style="font-size:0.775rem; color:#cbd5e1; font-weight:600;">${loc.place} Weather Trust:</span>
            <div style="font-size:0.7rem; color:#64748b;">Waiting for forecast inputs</div>
          </div>
          <span style="font-size:0.775rem; color:#94a3b8; font-style:italic;">Data unavailable</span>
        </div>
      `;
    }

    // Current Weather Parameters
    const tempC = curr ? `${Math.round(curr.temperature_c)}°C` : "--°C";
    const feelsLikeC = curr ? `${Math.round(curr.feels_like_c || curr.temperature_c)}°C` : "--°C";
    const condText = curr ? curr.condition : "Weather data unavailable";
    const condIcon = curr ? (curr.condition_icon || "🌤️") : "❓";
    const humPct = curr ? `${curr.humidity_pct}%` : "--%";
    const windSpeed = curr ? `${curr.wind_speed_kmh} km/h ${curr.wind_direction || ''}` : "-- km/h";
    const pressHpa = curr ? `${curr.pressure_hpa} hPa` : "-- hPa";
    const precipMm = curr ? `${curr.precipitation_mm} mm` : "-- mm";
    const updatedTime = curr ? curr.updated_at : "Data Unavailable";

    // Forecast Projection
    const fcDesc = targetDayForecast
      ? `Day ${leadDay} Outlook: ${targetDayForecast.precipitation_mm} mm rain (${targetDayForecast.rain_chance_pct}% probability, ${targetDayForecast.condition})`
      : `Day ${leadDay} Outlook: Forecast data unavailable for this location`;

    // Forecast Drift (strictly location-isolated)
    let driftDisplay = "Not enough forecast history yet";
    let driftColor = "#94a3b8";
    let driftStability = "INSUFFICIENT DATA";

    if (driftData && driftData.has_history) {
      driftDisplay = `${driftData.previous_forecast_mm} mm ➔ ${driftData.latest_forecast_mm} mm (${driftData.drift_str})`;
      driftStability = driftData.stability || "LOW";
      driftColor = driftData.forecast_drift_mm > 20 ? "#ef4444" : "#f59e0b";
    }

    panel.innerHTML = `
      <!-- Location Header -->
      <div style="border-bottom: 1px solid var(--bg-card-border); padding-bottom: 12px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 2px;">${loc.place.toUpperCase()}</h3>
            <span style="font-size: 0.775rem; color: #38bdf8; font-weight:600;">${loc.state}</span>
            <span style="font-size: 0.725rem; color: #94a3b8; display:block; margin-top:2px;">
              📍 Coordinates: ${Number(loc.latitude).toFixed(4)}° N, ${Number(loc.longitude).toFixed(4)}° E
            </span>
          </div>
          <span class="badge ${stateBadgeClass}">${stateRiskLabel}</span>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:10px; margin-top: 14px;">
        
        <!-- Live Current Weather Hero Box -->
        <div style="background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8)); border: 1px solid rgba(56, 189, 248, 0.2); padding: 12px; border-radius: 8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <div style="font-size:0.7rem; color:#94a3b8; text-transform:uppercase; letter-spacing:0.5px;">Live Weather at Coordinates</div>
              <div style="font-size:1.6rem; font-weight:800; color:#fff; line-height:1.2; margin-top:2px;">
                ${tempC} <span style="font-size:0.8rem; font-weight:400; color:#94a3b8;">(Feels ${feelsLikeC})</span>
              </div>
              <div style="font-size:0.85rem; color:#38bdf8; font-weight:600; margin-top:2px;">
                ${condIcon} ${condText}
              </div>
            </div>
            <div style="text-align:right; font-size:0.75rem; color:#cbd5e1; line-height:1.6;">
              <div>💧 Hum: <strong>${humPct}</strong></div>
              <div>💨 Wind: <strong>${windSpeed}</strong></div>
              <div>🌧️ Rain: <strong>${precipMm}</strong></div>
            </div>
          </div>
        </div>

        <!-- Location-Aware Weather Forecast -->
        <div style="background: rgba(0,0,0,0.25); padding: 10px 12px; border-radius: 6px; font-size: 0.8rem; border-left: 3px solid #38bdf8;">
          <div style="color: #94a3b8; font-size: 0.7rem; text-transform: uppercase;">Lead Day ${leadDay} Outlook (Open-Meteo)</div>
          <div style="color: #fff; font-weight: 600; margin-top: 3px;">${fcDesc}</div>
        </div>

        <!-- Location-Isolated Forecast Drift -->
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.825rem; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
          <span style="color:#94a3b8;">Forecast Drift (${loc.place}):</span>
          <strong style="color:${driftColor}; text-align:right;">
            ${driftDisplay}
          </strong>
        </div>

        <!-- Regional Reliability vs District Reliability Distinction -->
        <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:0.75rem; color:#94a3b8;">Regional Reliability (${loc.state}):</span>
            <strong style="font-size:0.95rem; color:${stateRiskColor};">${stateTrust === null ? "Unavailable" : `${stateTrust} / 100`} <span style="font-size:0.75rem;">(${stateRiskLabel})</span></strong>
          </div>
          ${districtRelHtml}
        </div>

        <!-- Freshness Metadata -->
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:#94a3b8; padding: 2px 4px;">
          <span>Last Updated: <strong style="color:#cbd5e1;">${updatedTime}</strong></span>
          <span style="color:#38bdf8;">● Live Satellite/NWP</span>
        </div>
      </div>

      <!-- Action Buttons synchronized with Dashboard & Live Tracking -->
      <div style="display:flex; flex-direction:column; gap:8px; margin-top:14px;">
        <button class="btn btn-primary" style="width:100%; font-size:0.8rem; padding:8px;" onclick="IndiaMapUI.viewInDashboard()">
          📊 View in Dashboard (${loc.place})
        </button>
        <button class="btn btn-secondary" style="width:100%; font-size:0.8rem; padding:8px;" onclick="IndiaMapUI.viewInLiveTracking()">
          📡 Open Live Tracking (${loc.place})
        </button>
        <button class="btn btn-secondary" style="width:100%; font-size:0.775rem; padding:6px; margin-top:2px;" onclick="IndiaMapUI.clearSelection()">
          🗺️ India National Overview
        </button>
      </div>
    `;
  },

  /**
   * Resets map view to show the complete India geometry
   */
  resetIndiaView() {
    if (this.map) {
      this.fitIndiaBounds(true);
      if (this.geoJsonLayer) {
        this.geoJsonLayer.eachLayer(layer => {
          this.geoJsonLayer.resetStyle(layer);
        });
      }
      if (this.selectedState && this.stateLayersMap[this.selectedState]) {
        this.stateLayersMap[this.selectedState].setStyle({
          weight: 2.8,
          color: '#facc15',
          fillOpacity: 0.88,
        });
      }
    }
  },

  /**
   * Filter states by risk tier (ALL, HIGH, MODERATE, LOW)
   */
  filterByRisk(riskLevel) {
    this.currentFilter = riskLevel;
    if (this.geoJsonLayer) {
      this.geoJsonLayer.setStyle((feature) => {
        const stateName = feature.properties.state_name || feature.properties.ST_NM;
        const data = this.statesData[stateName];
        
        let color = '#64748b';
        let relLevel = "LOW";
        if (data) {
          const bustProb = data.bust_probability ?? data.bust_risk_pct ?? 50;
          const riskInfo = typeof WeatherTrustCommon !== 'undefined'
            ? WeatherTrustCommon.classifyRisk(bustProb)
            : { color: data.color || '#f59e0b', reliability_level: data.reliability_level || 'MODERATE' };
          color = riskInfo.color;
          relLevel = riskInfo.reliability_level;
        }

        let opacity = 0.65;
        if (this.currentFilter !== "ALL") {
          if (!data || relLevel !== this.currentFilter) {
            opacity = 0.12;
          } else {
            opacity = 0.88;
          }
        }

        return {
          fillColor: color,
          weight: 1.2,
          opacity: 0.95,
          color: '#ffffff',
          fillOpacity: opacity,
        };
      });

      if (this.selectedState && this.stateLayersMap[this.selectedState]) {
        this.stateLayersMap[this.selectedState].setStyle({
          weight: 2.8,
          color: '#facc15',
          fillOpacity: 0.88,
        });
      }
    }
  },

  /**
   * Navigates to Dashboard using the EXACT selected district/place coordinates
   */
  viewInDashboard() {
    const loc = this.selectedLocation || { place: "Krishna District", latitude: 16.1875, longitude: 81.1389, state: "Andhra Pradesh" };
    if (typeof loadDashboard === 'function') {
      loadDashboard(loc.place, typeof currentSector !== 'undefined' ? currentSector : "General Public", loc.latitude, loc.longitude, loc.state);
    }
    if (typeof AppRouter !== 'undefined' && typeof AppRouter.navigateTo === 'function') {
      AppRouter.navigateTo('dashboard');
    }
    const dashElem = document.getElementById('dashboardTop');
    if (dashElem) dashElem.scrollIntoView({ behavior: 'smooth' });
  },

  /**
   * Navigates to Live Tracking using the EXACT selected district/place coordinates
   */
  viewInLiveTracking() {
    const loc = this.selectedLocation || { place: "Krishna District", state: "Andhra Pradesh" };
    if (typeof LiveTrackingUI !== 'undefined' && typeof LiveTrackingUI.selectLocation === 'function') {
      LiveTrackingUI.selectLocation(loc.state, loc.place, true);
    }
    if (typeof AppRouter !== 'undefined' && typeof AppRouter.navigateTo === 'function') {
      AppRouter.navigateTo('live-weather');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Sets up toolbar controls and live place/district search with typeahead dropdown
   */
  _controlsSetup: false,

  setupControls() {
    if (this._controlsSetup) return;
    this._controlsSetup = true;

    const resetBtn = document.getElementById('mapResetBtn');
    if (resetBtn) {
      resetBtn.onclick = () => this.resetIndiaView();
    }

    const refreshBtn = document.getElementById('mapRefreshBtn');
    if (refreshBtn) {
      refreshBtn.onclick = async () => {
        refreshBtn.innerHTML = '<span>⏳</span> Refreshing...';
        try {
          await this.fetchStatesReliability(this.currentDay);
          this.renderGeoJsonLayer();
          if (this.selectedLocation) {
            await this.selectLocation(this.selectedLocation, false);
          } else {
            this.renderIndiaOverviewPanel();
          }
        } catch (e) {
          console.error("Refresh map error:", e);
        } finally {
          refreshBtn.innerHTML = '<span>🔄</span> Refresh Map Data';
        }
      };
    }

    const locateBtn = document.getElementById('mapLocateBtn');
    if (locateBtn) {
      locateBtn.onclick = () => {
        if (this.selectedLocation && this.selectedLocation.latitude && this.selectedLocation.longitude) {
          this.map.flyTo([Number(this.selectedLocation.latitude), Number(this.selectedLocation.longitude)], 7.5, { duration: 1 });
          if (this.districtMarker) {
            setTimeout(() => this.districtMarker.openPopup(), 400);
          }
        } else {
          this.fitIndiaBounds(true);
        }
      };
    }

    const dayPills = document.querySelectorAll('.map-day-pill');
    dayPills.forEach(pill => {
      pill.onclick = async () => {
        const day = parseInt(pill.getAttribute('data-day'), 10) || 6;
        await this.setDayHorizon(day);
      };
    });

    const filterPills = document.querySelectorAll('.map-filter-pill');
    filterPills.forEach(pill => {
      pill.onclick = () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const filterVal = pill.getAttribute('data-filter');
        this.filterByRisk(filterVal);
      };
    });

    // MAP DISTRICT/PLACE SEARCH AUTOCOMPLETE
    const searchInput = document.getElementById('mapDistrictSearch');
    const dropdown = document.getElementById('mapSearchDropdown');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(this.searchDebounceTimer);

        if (!query || query.length < 2) {
          if (dropdown) dropdown.classList.remove('active');
          return;
        }

        this.searchDebounceTimer = setTimeout(async () => {
          try {
            const resp = await fetch(`/api/locations/search?q=${encodeURIComponent(query)}`);
            if (resp.ok) {
              const matches = await resp.json();
              this.renderSearchDropdown(matches, dropdown, searchInput);
            }
          } catch (err) {
            console.error("Map search error:", err);
          }
        }, 200);
      });

      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const firstItem = dropdown ? dropdown.querySelector('.search-dropdown-item') : null;
          if (firstItem && firstItem.dataset.loc) {
            try {
              const loc = JSON.parse(firstItem.dataset.loc);
              if (typeof loadDashboard === 'function') {
                loadDashboard(loc, typeof currentSector !== 'undefined' ? currentSector : 'General Public');
              } else {
                this.selectLocation(loc, true);
              }
              searchInput.value = `${loc.place}, ${loc.state}`;
              if (dropdown) dropdown.classList.remove('active');
            } catch (err) {
              console.warn('[IndiaMapUI] Could not select searched location:', err);
            }
          }
        }
      });

      document.addEventListener('click', (e) => {
        if (dropdown && !searchInput.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.remove('active');
        }
      });
    }

    window.addEventListener('resize', () => {
      if (this.map && document.getElementById('indiaMap') && document.getElementById('page-map')?.classList.contains('active')) {
        requestAnimationFrame(() => this.fitIndiaBounds(false));
      }
    });
  },

  /**
   * Renders search dropdown suggestions on the map toolbar
   */
  renderSearchDropdown(matches, dropdown, searchInput) {
    if (!dropdown) return;
    dropdown.innerHTML = '';

    if (!matches || matches.length === 0) {
      dropdown.classList.remove('active');
      return;
    }

    matches.slice(0, 8).forEach(loc => {
      const item = document.createElement('div');
      item.className = 'search-dropdown-item';
      item.dataset.loc = JSON.stringify(loc);
      item.style.padding = '8px 12px';
      item.style.cursor = 'pointer';
      item.style.borderBottom = '1px solid rgba(255,255,255,0.06)';

      const distText = loc.district ? ` (${loc.district})` : '';
      item.innerHTML = `
        <div style="font-weight: 700; color: #fff; font-size: 0.825rem;">${loc.place}</div>
        <div style="font-size: 0.725rem; color: #94a3b8;">${distText}, ${loc.state}, India • 📍 ${Number(loc.latitude).toFixed(3)}°, ${Number(loc.longitude).toFixed(3)}°</div>
      `;

      item.addEventListener('click', () => {
        if (typeof loadDashboard === 'function') {
          loadDashboard(loc, typeof currentSector !== 'undefined' ? currentSector : 'General Public');
        } else {
          this.selectLocation(loc, true);
        }
        searchInput.value = `${loc.place}, ${loc.state}`;
        dropdown.classList.remove('active');
      });

      dropdown.appendChild(item);
    });

    dropdown.classList.add('active');
  },

  showMapLoading(msg) {
    const overlay = document.getElementById('mapLoadingOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; gap:10px;">
          <div class="loading-spinner"></div>
          <span style="font-size:0.875rem; color:#f8fafc; font-weight:600;">${msg}</span>
        </div>
      `;
    }
  },

  hideMapLoading() {
    const overlay = document.getElementById('mapLoadingOverlay');
    if (overlay) overlay.style.display = 'none';
  },

  showMapError(msg, failedType = "general") {
    const overlay = document.getElementById('mapLoadingOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.innerHTML = `
        <div style="text-align: center; color: #ef4444; max-width: 280px; padding: 12px;">
          <div style="font-size: 1.8rem; margin-bottom: 8px;">⚠️</div>
          <div style="font-size: 0.925rem; font-weight: 700; margin-bottom: 12px; color: #f8fafc;">${msg}</div>
          <button class="btn btn-secondary" style="font-size: 0.8rem; padding: 6px 16px;" onclick="IndiaMapUI.retryLoad('${failedType}')">Retry</button>
        </div>
      `;
    }
  },

  async retryLoad(failedType) {
    if (failedType === "geojson") {
      this.rawGeoJson = null;
    }
    await this.initMap();
  }
};
