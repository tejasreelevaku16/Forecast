/**
 * WeatherTrust AI — Interactive India State-Level Reliability Map Controller
 * Visualizes ML-backed Forecast Trust, Bust Risk, and NWP Run Drift across
 * all 37 Indian States and Union Territories using official GeoJSON boundaries.
 *
 * Implements:
 * 1. Strictly India-focused map with bounds auto-fitting to the full country.
 * 2. Unwatermarked OpenStreetMap tiles with official attribution (removes "API KEY REQUIRED" error).
 * 3. Centralized risk categorization (consistent with Dashboard, Forecast, etc.).
 * 4. Interactive tooltips on hover (State, Trust Score, Bust Risk).
 * 5. Informative side panel on click (State Name, Trust, Bust Risk, Forecast, Drift, Confidence, Last Updated).
 * 6. Case-insensitive state search with auto-focus and highlight.
 * 7. Cached GeoJSON to prevent redundant downloads on refresh.
 * 8. Clear loading and error retry states.
 */

const IndiaMapUI = {
  map: null,
  geoJsonLayer: null,
  statesData: {},
  rawGeoJson: null,
  selectedState: "Andhra Pradesh",
  currentFilter: "ALL", // "ALL", "HIGH", "MODERATE", "LOW"
  stateLayersMap: {},

  // Clamped geographical bounding box for India (including Andaman & Nicobar, Lakshadweep, Kashmir)
  indiaBounds: [
    [6.0, 68.0],   // Southwest corner (Kanyakumari / Lakshadweep)
    [37.5, 97.5]   // Northeast corner (Kashmir / Arunachal Pradesh)
  ],

  /**
   * Initializes the Leaflet map and loads reliability & boundary data
   */
  async initMap() {
    const mapContainer = document.getElementById('indiaMap');
    if (!mapContainer || typeof L === 'undefined') return;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.showMapLoading("Loading India reliability map...");

    try {
      // Create Leaflet Map centered on India with clamped bounds
      this.map = L.map('indiaMap', {
        center: [22.5, 82.0],
        zoom: 5,
        minZoom: 4,
        maxZoom: 9,
        zoomControl: true,
        maxBounds: [
          [4.0, 65.0],
          [39.0, 100.0]
        ],
        maxBoundsViscosity: 1.0,
      });

      // Standard OpenStreetMap tiles - guaranteed no API key requirement, fully compliant attribution
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors | WeatherTrust AI',
        maxZoom: 18,
      }).addTo(this.map);

      this.setupControls();

      // Fetch state reliability data and GeoJSON concurrently
      let geoJsonErr = false;
      let relDataErr = false;

      await Promise.all([
        this.fetchStatesReliability().catch(e => {
          relDataErr = true;
          console.error("fetchStatesReliability failed:", e);
        }),
        this.fetchIndiaGeoJson().catch(e => {
          geoJsonErr = true;
          console.error("fetchIndiaGeoJson failed:", e);
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

      // Default select Andhra Pradesh
      this.selectState("Andhra Pradesh", false);
    } catch (err) {
      console.error("India Map Initialization Error:", err);
      this.showMapError("India map could not be loaded. Please retry.", "general");
    }
  },

  /**
   * Fetches state-level ML reliability metrics from backend
   */
  async fetchStatesReliability() {
    try {
      const resp = await fetch('/api/map/states');
      if (!resp.ok) {
        // Fallback to /api/map-data
        const fallbackResp = await fetch('/api/map-data');
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
   * Fetches and caches local India States GeoJSON (1.5 MB cached in memory)
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
        
        let color = '#64748b'; // default data unavailable color
        let relLevel = "LOW";
        if (data) {
          const bustProb = data.bust_probability ?? data.bust_risk_pct ?? 50;
          const riskInfo = typeof WeatherTrustCommon !== 'undefined'
            ? WeatherTrustCommon.classifyRisk(bustProb)
            : { color: data.color || '#f59e0b', reliability_level: data.reliability_level || 'MODERATE' };
          color = riskInfo.color;
          relLevel = riskInfo.reliability_level;
        }

        // Check if filtered out
        let opacity = 0.68;
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

        // State Tooltip on Hover
        let tooltipContent = `<strong style="color: #fff; font-size: 0.85rem;">${stateName}</strong>`;
        if (data) {
          const bustProb = data.bust_probability ?? data.bust_risk_pct ?? 50;
          const riskInfo = typeof WeatherTrustCommon !== 'undefined'
            ? WeatherTrustCommon.classifyRisk(bustProb)
            : {
                trust_score: data.trust_score ?? (100 - bustProb),
                bust_probability: bustProb,
                risk_display: data.bust_risk || "Risk",
                color: data.color || '#38bdf8'
              };

          tooltipContent = `
            <div style="font-family: Inter, sans-serif; font-size: 0.8rem; line-height: 1.45; padding: 2px;">
              <div style="color: #fff; font-size: 0.875rem; font-weight: 800; border-bottom: 1px solid rgba(255,255,255,0.15); padding-bottom: 3px; margin-bottom: 4px;">${stateName}</div>
              <div>Trust: <strong style="color: ${riskInfo.color};">${riskInfo.trust_score}/100</strong></div>
              <div>Bust Risk: <strong style="color: ${riskInfo.color};">${riskInfo.bust_probability}% (${riskInfo.risk_display || data.bust_risk || riskInfo.risk_label})</strong></div>
            </div>
          `;
        } else {
          tooltipContent += `<br><span style="font-size:0.75rem; color:#94a3b8;">Data unavailable</span>`;
        }

        layer.bindTooltip(tooltipContent, {
          sticky: true,
          className: 'leaflet-state-tooltip',
          direction: 'auto',
        });

        // Hover & Click events
        layer.on({
          mouseover: (e) => {
            const target = e.target;
            target.setStyle({
              weight: 2.5,
              color: '#38bdf8',
              fillOpacity: 0.88,
            });
            target.bringToFront();
          },
          mouseout: (e) => {
            this.geoJsonLayer.resetStyle(e.target);
            // Keep selected state highlighted
            if (this.selectedState === stateName) {
              e.target.setStyle({
                weight: 2.8,
                color: '#facc15',
                fillOpacity: 0.9,
              });
            }
          },
          click: () => {
            this.selectState(stateName, true);
          }
        });
      }
    }).addTo(this.map);

    // Automatically fit the map to the complete India GeoJSON bounds
    const bounds = this.geoJsonLayer.getBounds();
    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [15, 15] });
    }
  },

  /**
   * Selects an Indian state, zooms in smoothly, and populates the details panel
   */
  selectState(stateName, zoomTo = true) {
    this.selectedState = stateName;
    const data = this.statesData[stateName];

    // Highlight state on map
    if (this.geoJsonLayer) {
      this.geoJsonLayer.eachLayer(layer => {
        this.geoJsonLayer.resetStyle(layer);
      });
      const selectedLayer = this.stateLayersMap[stateName];
      if (selectedLayer) {
        selectedLayer.setStyle({
          weight: 2.8,
          color: '#facc15', // gold highlight boundary
          fillOpacity: 0.9,
        });
        selectedLayer.bringToFront();

        if (zoomTo && this.map) {
          this.map.fitBounds(selectedLayer.getBounds(), { padding: [40, 40], maxZoom: 7 });
        }
      }
    }

    // Update the Selected Region Side Panel
    this.renderSelectedRegionPanel(stateName, data);
  },

  /**
   * Renders details into the Selected Region Panel
   */
  renderSelectedRegionPanel(stateName, data) {
    const panel = document.getElementById('mapSelectedRegionPanel');
    if (!panel) return;

    if (!data) {
      panel.innerHTML = `
        <div style="border-bottom: 1px solid var(--bg-card-border); padding-bottom: 12px;">
          <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 2px;">${stateName.toUpperCase()}</h3>
          <span style="font-size: 0.75rem; color: #94a3b8;">Indian State / Union Territory</span>
        </div>
        <div style="padding: 28px 12px; text-align: center; color: #94a3b8; font-size: 0.9rem;">
          <div style="font-size: 1.8rem; margin-bottom: 8px;">📡</div>
          <div style="font-weight: 700; color: #cbd5e1; margin-bottom: 4px;">Data unavailable</div>
          <div style="font-size: 0.775rem; color: #64748b;">
            Forecast reliability observations for this territory are pending calibration.
          </div>
        </div>
      `;
      return;
    }

    const bustProb = data.bust_probability ?? data.bust_risk_pct ?? 50;
    const riskInfo = typeof WeatherTrustCommon !== 'undefined'
      ? WeatherTrustCommon.classifyRisk(bustProb)
      : {
          trust_score: data.trust_score ?? (100 - bustProb),
          bust_probability: bustProb,
          risk_level: data.reliability_level || "MODERATE",
          risk_label: `${data.reliability_level || 'MODERATE'} RISK`,
          confidence: data.confidence || "Moderate",
          color: data.color || '#f59e0b',
          badge_class: (data.reliability_level === 'HIGH' ? 'badge-risk-low' : data.reliability_level === 'MODERATE' ? 'badge-risk-mod' : 'badge-risk-high')
        };

    const driftVal = data.drift ?? data.forecast_drift_mm;
    const driftFormatted = typeof WeatherTrustCommon !== 'undefined'
      ? WeatherTrustCommon.formatDrift(driftVal)
      : (driftVal !== undefined && driftVal !== null && !isNaN(driftVal) ? `+${Math.round(driftVal)} mm Drift` : "Drift data unavailable");

    const stabRaw = data.stability || riskInfo.stability;
    const stabFormatted = typeof WeatherTrustCommon !== 'undefined'
      ? WeatherTrustCommon.formatStability(stabRaw)
      : `${stabRaw} Stability`;

    panel.innerHTML = `
      <div style="border-bottom: 1px solid var(--bg-card-border); padding-bottom: 12px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <h3 style="font-size: 1.25rem; font-weight: 800; color: #fff; margin-bottom: 2px;">${stateName.toUpperCase()}</h3>
            <span style="font-size: 0.75rem; color: #94a3b8;">Capital: ${data.capital || 'N/A'} • ${data.zone || 'Region'}</span>
          </div>
          <span class="badge ${riskInfo.badge_class}">${riskInfo.risk_label}</span>
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px; margin-top: 14px;">
        <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(0,0,0,0.25); padding: 10px 14px; border-radius: 8px;">
          <span style="font-size:0.8rem; color:#94a3b8;">Forecast Trust:</span>
          <strong style="font-size:1.25rem; color:${riskInfo.color};">${riskInfo.trust_score} / 100</strong>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(0,0,0,0.25); padding: 10px 14px; border-radius: 8px;">
          <span style="font-size:0.8rem; color:#94a3b8;">Bust Risk:</span>
          <strong style="font-size:1.1rem; color:${riskInfo.color};">${riskInfo.bust_probability}% (${riskInfo.risk_label})</strong>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.825rem; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
          <span style="color:#94a3b8;">Weather Forecast:</span>
          <strong style="color:#fff;">${data.forecast || 'Data unavailable'}</strong>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.825rem; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
          <span style="color:#94a3b8;">Forecast Drift:</span>
          <strong style="color:${(driftVal && driftVal > 20) ? '#ef4444' : '#f59e0b'};">${driftFormatted} (${stabFormatted})</strong>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.825rem; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
          <span style="color:#94a3b8;">Confidence:</span>
          <span style="color:${riskInfo.color}; font-weight:700;">${riskInfo.confidence}</span>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.825rem; border-bottom:1px solid rgba(255,255,255,0.06); padding-bottom:8px;">
          <span style="color:#94a3b8;">Last Updated:</span>
          <span style="color:#cbd5e1;">${data.last_updated || data.updated_at || 'Today, 6:30 PM'}</span>
        </div>

        <div style="font-size:0.75rem; color:#94a3b8; background:rgba(255,255,255,0.04); padding:10px; border-radius:6px; line-height:1.5;">
          <strong>Model Diagnostic Driver:</strong> ${data.primary_driver || 'Authentic ML forecast error prior'}
        </div>
      </div>

      <div style="display:flex; flex-direction:column; gap:8px; margin-top:12px;">
        <button class="btn btn-primary" style="width:100%; font-size:0.8rem; padding:8px;" onclick="IndiaMapUI.viewInDashboard('${stateName}')">
          📊 View in Dashboard
        </button>
        <button class="btn btn-secondary" style="width:100%; font-size:0.8rem; padding:8px;" onclick="IndiaMapUI.viewDetailedReliability()">
          🛡️ View Detailed Reliability
        </button>
      </div>
    `;
  },

  /**
   * Resets map view to show the complete India geometry without cropping
   */
  resetIndiaView() {
    if (this.map && this.geoJsonLayer) {
      this.map.invalidateSize();
      const bounds = this.geoJsonLayer.getBounds();
      if (bounds.isValid()) {
        this.map.fitBounds(bounds, { padding: [15, 15] });
      }
      this.geoJsonLayer.eachLayer(layer => {
        this.geoJsonLayer.resetStyle(layer);
      });
      if (this.selectedState && this.stateLayersMap[this.selectedState]) {
        this.stateLayersMap[this.selectedState].setStyle({
          weight: 2.8,
          color: '#facc15',
          fillOpacity: 0.9,
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

        let opacity = 0.68;
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

      // Keep selected state highlighted
      if (this.selectedState && this.stateLayersMap[this.selectedState]) {
        this.stateLayersMap[this.selectedState].setStyle({
          weight: 2.8,
          color: '#facc15',
          fillOpacity: 0.9,
        });
      }
    }
  },

  /**
   * Actions triggered from the Selected Region Panel
   */
  viewInDashboard(stateName) {
    if (typeof loadDashboard === 'function') {
      loadDashboard(stateName);
    }
    if (typeof AppRouter !== 'undefined' && typeof AppRouter.navigateTo === 'function') {
      AppRouter.navigateTo('dashboard');
    }
    const dashElem = document.getElementById('dashboardTop');
    if (dashElem) dashElem.scrollIntoView({ behavior: 'smooth' });
  },

  viewDetailedReliability() {
    if (typeof AppRouter !== 'undefined' && typeof AppRouter.navigateTo === 'function') {
      AppRouter.navigateTo('trust');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * Wire up map toolbar controls
   */
  setupControls() {
    // Reset India View Button
    const resetBtn = document.getElementById('mapResetBtn');
    if (resetBtn) {
      resetBtn.onclick = () => {
        this.resetIndiaView();
      };
    }

    // Refresh Map Data Button - re-fetches reliability metrics without reloading GeoJSON
    const refreshBtn = document.getElementById('mapRefreshBtn');
    if (refreshBtn) {
      refreshBtn.onclick = async () => {
        refreshBtn.innerHTML = '<span>⏳</span> Refreshing...';
        try {
          await this.fetchStatesReliability();
          this.renderGeoJsonLayer();
          this.selectState(this.selectedState, false);
        } catch (e) {
          console.error("Refresh map error:", e);
        } finally {
          refreshBtn.innerHTML = '<span>🔄</span> Refresh Map Data';
        }
      };
    }

    // Risk Filter Pills
    const filterPills = document.querySelectorAll('.map-filter-pill');
    filterPills.forEach(pill => {
      pill.onclick = () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const filterVal = pill.getAttribute('data-filter');
        this.filterByRisk(filterVal);
      };
    });

    // State Search Autocomplete (Case-Insensitive)
    const searchInput = document.getElementById('mapDistrictSearch');
    if (searchInput) {
      searchInput.oninput = (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
          this.resetIndiaView();
          return;
        }

        // Case-insensitive search across stateLayersMap and statesData
        const layerNames = Object.keys(this.stateLayersMap);
        const matchedName = layerNames.find(name => name.toLowerCase() === query)
          || layerNames.find(name => name.toLowerCase().startsWith(query))
          || layerNames.find(name => name.toLowerCase().includes(query))
          || Object.keys(this.statesData).find(name => name.toLowerCase().includes(query));

        if (matchedName) {
          this.selectState(matchedName, true);
        }
      };
    }
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
