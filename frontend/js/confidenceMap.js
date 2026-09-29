/**
 * WeatherTrust AI — Dynamic Forecast Confidence Map (SIH Feature 1)
 * Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
 * 
 * Interactive GIS mapping with GeoJSON state boundaries, district overlays, Day 1-10 selector,
 * MoES-standard confidence color transitions, tooltips, and explainability popups.
 */

function buildCartoTileLayer(style = "voyager") {
  return L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    maxZoom: 19,
  });
}

let confidenceMapInstance = null;
let geojsonLayer = null;
let districtMarkersLayer = null;
let currentConfidenceLeadDay = 1;
let currentConfidenceFilter = "ALL";
let statesGeojsonData = null;

function getConfidenceColor(conf) {
  if (conf >= 90) return "#059669"; // Dark Green (90–100)
  if (conf >= 75) return "#10b981"; // Green (75–89)
  if (conf >= 60) return "#f59e0b"; // Yellow (60–74)
  if (conf >= 40) return "#f97316"; // Orange (40–59)
  return "#ef4444";                 // Red (0–39)
}

function getConfidenceRiskLabel(conf) {
  if (conf >= 75) return "Low Bust Risk";
  if (conf >= 55) return "Moderate Bust Risk";
  return "High Bust Risk";
}

async function initConfidenceMap() {
  const mapContainer = document.getElementById("confidenceMapContainer");
  if (!mapContainer) return;

  if (confidenceMapInstance) {
    confidenceMapInstance.invalidateSize();
    return;
  }

  // Center on India (22.5 N, 79.5 E, zoom 5)
  confidenceMapInstance = L.map("confidenceMapContainer", {
    center: [22.5937, 79.9629],
    zoom: 5,
    minZoom: 4,
    maxZoom: 10,
    zoomControl: true,
  });

  buildCartoTileLayer('voyager').addTo(confidenceMapInstance);

  districtMarkersLayer = L.layerGroup().addTo(confidenceMapInstance);

  // Load GeoJSON if not cached
  try {
    if (!statesGeojsonData) {
      if (typeof IndiaMapUI !== 'undefined' && IndiaMapUI.rawGeoJson) {
        statesGeojsonData = IndiaMapUI.rawGeoJson;
      } else {
        const geoResp = await fetch("/data/india_states.geojson");
        if (geoResp.ok) {
          statesGeojsonData = await geoResp.json();
        }
      }
    }
  } catch (err) {
    console.warn("Could not load local states geojson:", err);
  }

  setupConfidenceMapControls();
  await loadConfidenceMapData(currentConfidenceLeadDay);
}

function setupConfidenceMapControls() {
  // Day 1–10 pill selectors
  const dayPills = document.querySelectorAll(".conf-day-pill");
  dayPills.forEach((pill) => {
    pill.addEventListener("click", async (e) => {
      dayPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentConfidenceLeadDay = parseInt(pill.getAttribute("data-day") || "1", 10);
      const leadLabel = document.getElementById("confSelectedDayLabel");
      if (leadLabel) leadLabel.textContent = `Day ${currentConfidenceLeadDay} Outlook`;
      await loadConfidenceMapData(currentConfidenceLeadDay);
    });
  });

  // State / Search selector
  const stateSelect = document.getElementById("confStateFilterSelect");
  if (stateSelect) {
    stateSelect.addEventListener("change", (e) => {
      const stateName = e.target.value;
      if (stateName === "ALL") {
        if (geojsonLayer && geojsonLayer.getBounds().isValid()) {
          confidenceMapInstance.fitBounds(geojsonLayer.getBounds(), { padding: [15, 15] });
        } else {
          confidenceMapInstance.fitBounds([[6.5, 68.0], [37.5, 97.5]], { padding: [15, 15] });
        }
      } else {
        highlightStateOnMap(stateName);
      }
    });
  }

  // Refresh button
  const refreshBtn = document.getElementById("confMapRefreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => loadConfidenceMapData(currentConfidenceLeadDay));
  }
}

async function loadConfidenceMapData(leadDay = 1) {
  try {
    const [statesResp, districtsResp] = await Promise.all([
      fetch(`/api/map/states?day=${leadDay}`),
      fetch(`/api/map/india-reliability?day=${leadDay}`),
    ]);

    const statesData = statesResp.ok ? await statesResp.json() : {};
    const districtsData = districtsResp.ok ? await districtsResp.json() : [];

    // Render state boundaries choropleth
    renderStatesChoropleth(statesData, leadDay);

    // Render district point markers
    renderDistrictMarkers(districtsData, leadDay);

    // Update timestamp
    const tsEl = document.getElementById("confMapTimestamp");
    if (tsEl) {
      tsEl.textContent = `NCMRWF Operational Run: ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST`;
    }

    // Update summary counts
    updateConfidenceSummaryStats(districtsData);
  } catch (err) {
    console.error("Error loading confidence map data:", err);
  }
}

function renderStatesChoropleth(statesData, leadDay) {
  if (!confidenceMapInstance || !statesGeojsonData) return;

  if (geojsonLayer) {
    confidenceMapInstance.removeLayer(geojsonLayer);
  }

  geojsonLayer = L.geoJSON(statesGeojsonData, {
    style: function (feature) {
      const stateName = feature.properties.NAME_1 || feature.properties.name || feature.properties.ST_NM || "";
      const matched = statesData && statesData[stateName];
      const hasData = matched && typeof matched.confidence === 'number';
      const conf = hasData ? matched.confidence : null;
      const color = hasData ? getConfidenceColor(conf) : "#475569";

      return {
        fillColor: color,
        weight: 1.5,
        opacity: 0.85,
        color: "#ffffff",
        dashArray: "2",
        fillOpacity: hasData ? 0.55 : 0.25,
      };
    },
    onEachFeature: function (feature, layer) {
      const stateName = feature.properties.NAME_1 || feature.properties.name || feature.properties.ST_NM || "State";
      const matched = statesData && statesData[stateName];
      const hasData = matched && typeof matched.confidence === 'number';

      let tooltipContent = "";
      if (hasData) {
        const confColor = getConfidenceColor(matched.confidence);
        tooltipContent = `
          <div class="map-tooltip-card">
            <div class="map-tooltip-header">
              <strong>${stateName}</strong>
              <span class="conf-pill-tag" style="background:${confColor}22; color:${confColor}">
                Day ${leadDay}
              </span>
            </div>
            <div class="map-tooltip-grid">
              <div><span class="lbl">Confidence:</span> <strong style="color:${confColor}">${matched.confidence}%</strong></div>
              <div><span class="lbl">Bust Risk:</span> <strong>${matched.bust_probability}%</strong></div>
              <div><span class="lbl">Forecast Rain:</span> <strong>${Number(matched.forecast_rainfall_mm || 0).toFixed(1)} mm</strong></div>
              <div><span class="lbl">Temperature:</span> <strong>${Number(matched.forecast_temp_c || 0).toFixed(1)}°C</strong></div>
              <div><span class="lbl">Pressure:</span> <strong>${matched.pressure_hpa || '--'} hPa</strong></div>
              <div><span class="lbl">Risk:</span> <strong>${matched.risk_level || 'MODERATE'}</strong></div>
            </div>
          </div>
        `;
      } else {
        tooltipContent = `
          <div class="map-tooltip-card">
            <div class="map-tooltip-header">
              <strong>${stateName}</strong>
              <span class="conf-pill-tag" style="background: rgba(148,163,184,0.15); color: #94a3b8;">
                Day ${leadDay}
              </span>
            </div>
            <div style="padding: 8px 0; color: #94a3b8; font-size: 0.78rem;">
              Data unavailable for this region.
            </div>
          </div>
        `;
      }

      layer.bindTooltip(tooltipContent, { sticky: true, className: "custom-leaflet-tooltip" });

      layer.on({
        mouseover: function (e) {
          const l = e.target;
          l.setStyle({ weight: 3, color: "#38bdf8", fillOpacity: 0.8 });
          l.bringToFront();
        },
        mouseout: function (e) {
          geojsonLayer.resetStyle(e.target);
        },
        click: function () {
          if (hasData) {
            openExplainabilityModal(stateName, leadDay);
          }
        },
      });
    },
  }).addTo(confidenceMapInstance);

  const bounds = geojsonLayer.getBounds();
  if (bounds.isValid()) {
    confidenceMapInstance.fitBounds(bounds, { padding: [15, 15] });
  }
}

function renderDistrictMarkers(districts, leadDay) {
  if (!districtMarkersLayer) return;
  districtMarkersLayer.clearLayers();

  districts.forEach((d) => {
    const conf = d.reliability.confidence;
    const color = getConfidenceColor(conf);

    const markerIcon = L.divIcon({
      className: "conf-station-marker",
      html: `
        <div class="marker-pulse-ring" style="border-color:${color};"></div>
        <div class="marker-core-circle" style="background:${color};">
          <span>${conf}%</span>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    const marker = L.marker([d.lat, d.lon], { icon: markerIcon });

    const popupHtml = `
      <div class="conf-station-popup">
        <div class="popup-title">
          <h4>${d.city || d.name}</h4>
          <span class="popup-state">${d.state} (${d.zone || "District"})</span>
        </div>
        <div class="popup-kpis">
          <div class="kpi-box" style="border-left: 3px solid ${color}">
            <span class="kpi-label">Forecast Confidence</span>
            <span class="kpi-val" style="color:${color}">${conf}%</span>
          </div>
          <div class="kpi-box" style="border-left: 3px solid #ef4444">
            <span class="kpi-label">Bust Probability</span>
            <span class="kpi-val" style="color:#ef4444">${d.reliability.bust_probability_pct}%</span>
          </div>
        </div>
        <div class="popup-weather-list">
          <div><span>Temperature:</span> <strong>${d.weather.temperature}°C</strong></div>
          <div><span>Rainfall:</span> <strong>${d.weather.rainfall} mm</strong></div>
          <div><span>Humidity:</span> <strong>${d.weather.humidity}%</strong></div>
          <div><span>Pressure:</span> <strong>${d.weather.pressure} hPa</strong></div>
          <div><span>Wind Speed:</span> <strong>${d.weather.wind_speed} km/h</strong></div>
          <div><span>Forecast Drift:</span> <strong>+${d.reliability.drift_mm} mm</strong></div>
          <div><span>Lead Horizon:</span> <strong>Day ${leadDay}</strong></div>
        </div>
        <button class="btn btn-sm btn-primary mt-2" onclick="openExplainabilityModal('${d.city || d.name}', ${leadDay})" style="width:100%;">
          🔍 View Explainable AI Diagnostic
        </button>
        <button class="btn btn-sm btn-outline-primary mt-1" onclick="if(typeof loadDashboard==='function'){loadDashboard('${d.city || d.name}'); if(typeof window.navigateToPage==='function'){window.navigateToPage('dashboard');}}" style="width:100%;">
          📍 Load Live Weather & Dashboard
        </button>
      </div>
    `;

    marker.bindPopup(popupHtml, { maxWidth: 280 });
    districtMarkersLayer.addLayer(marker);
  });
}

function updateConfidenceSummaryStats(districts) {
  if (!districts || districts.length === 0) return;

  const total = districts.length;
  const highConf = districts.filter((d) => d.reliability.confidence >= 75).length;
  const modConf = districts.filter((d) => d.reliability.confidence >= 55 && d.reliability.confidence < 75).length;
  const lowConf = districts.filter((d) => d.reliability.confidence < 55).length;

  const elHigh = document.getElementById("confHighCount");
  const elMod = document.getElementById("confModCount");
  const elLow = document.getElementById("confLowCount");

  if (elHigh) elHigh.textContent = `${highConf} Districts`;
  if (elMod) elMod.textContent = `${modConf} Districts`;
  if (elLow) elLow.textContent = `${lowConf} Districts`;
}

function highlightStateOnMap(stateName) {
  if (!geojsonLayer) return;
  geojsonLayer.eachLayer((layer) => {
    const name = layer.feature.properties.NAME_1 || layer.feature.properties.name || layer.feature.properties.ST_NM || "";
    if (name.toLowerCase() === stateName.toLowerCase()) {
      confidenceMapInstance.fitBounds(layer.getBounds(), { padding: [20, 20] });
      layer.openTooltip();
    }
  });
}

// Global hook for explainability modal trigger
// Global hook for explainability modal trigger
window.openExplainabilityModal = async function (location, leadDay = 6) {
  const modal = document.getElementById("explainabilityModal");
  if (!modal) {
    // If on another page or no modal, navigate to Explainable AI page
    if (window.navigateToPage) {
      window.navigateToPage("explain");
      if (window.loadExplainabilityData) {
        window.loadExplainabilityData(location, leadDay);
      }
    }
    return;
  }

  modal.style.display = "flex";
  modal.classList.add("active");
  const locTitle = document.getElementById("modalLocTitle");
  if (locTitle) locTitle.textContent = `${location} — Day ${leadDay} Diagnostic`;

  const gaugeVal = document.getElementById("modalConfGaugeVal");
  const bustVal = document.getElementById("modalBustVal");
  const summaryText = document.getElementById("modalSummaryText");
  const recText = document.getElementById("modalRecText");
  const featList = document.getElementById("modalFeaturesList");

  if (gaugeVal) gaugeVal.textContent = "Analyzing...";
  if (bustVal) bustVal.textContent = "Analyzing...";
  if (summaryText) summaryText.textContent = "Decomposing atmospheric stability and NWP run consistency...";
  if (recText) recText.textContent = "Synthesizing risk-aware guidance for Day " + leadDay + "...";
  if (featList) {
    featList.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #94a3b8;">
        <div style="font-size: 0.85rem; margin-bottom: 6px;">Computing SHAP feature attribution weights...</div>
        <small style="color: #64748b;">Evaluating atmospheric convective parameters and lead decay</small>
      </div>
    `;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const resp = await fetch(`/api/explain/bust?location=${encodeURIComponent(location)}&lead_day=${leadDay}`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (resp.ok) {
      const data = await resp.json();
      renderExplainabilityModalContent(data, location, leadDay);
    } else {
      renderExplainabilityModalContent(null, location, leadDay);
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') return;
    console.warn("Modal explainability error:", err);
    renderExplainabilityModalContent(null, location, leadDay);
  }
};

window.closeExplainabilityModal = function () {
  const modal = document.getElementById("explainabilityModal");
  if (modal) {
    modal.classList.remove("active");
    modal.style.display = "none";
  }
};

function renderExplainabilityModalContent(data, location = "Selected Location", leadDay = 6) {
  const gaugeVal = document.getElementById("modalConfGaugeVal");
  const bustVal = document.getElementById("modalBustVal");
  const summaryText = document.getElementById("modalSummaryText");
  const recText = document.getElementById("modalRecText");
  const featList = document.getElementById("modalFeaturesList");

  const hasData = data && typeof data === 'object' && data.confidence !== undefined;

  if (hasData) {
    const conf = Number(data.confidence) || 0;
    const bust = Number(data.bust_probability) || 0;
    const badgeColor = conf >= 70 ? "#10b981" : conf >= 45 ? "#f59e0b" : "#ef4444";

    if (gaugeVal) {
      gaugeVal.textContent = `${conf}%`;
      gaugeVal.style.color = badgeColor;
    }
    if (bustVal) {
      bustVal.textContent = `${bust}%`;
      bustVal.style.color = bust >= 50 ? "#ef4444" : "#10b981";
    }
    if (summaryText) {
      summaryText.textContent = data.summary || "Atmospheric profile shows typical synoptic evolution with consistent numerical ensemble trajectories.";
    }
    if (recText) {
      recText.textContent = data.recommendation || "Risk-aware guidance: Standard operational monitoring is adequate. Check the next cycle.";
    }

    if (featList) {
      if (Array.isArray(data.top_features) && data.top_features.length) {
        featList.innerHTML = data.top_features
          .map(
            (f) => `
            <div class="modal-feature-item">
              <div class="feat-name-row">
                <span>${f.feature}</span>
                <span class="feat-impact-tag ${f.direction === "Negative" ? "tag-negative" : "tag-positive"}">
                  ${f.direction === "Negative" ? "▼ Reduced Trust" : "▲ Enhanced Trust"} (${Math.round((f.impact || 0) * 100)}%)
                </span>
              </div>
              <div class="feat-bar-track">
                <div class="feat-bar-fill ${f.direction === "Negative" ? "fill-negative" : "fill-positive"}" style="width: ${Math.min(100, Math.max(8, (f.impact || 0) * 100))}%"></div>
              </div>
            </div>
          `
          )
          .join("");
      } else {
        featList.innerHTML = '<div style="color: #94a3b8; font-size: 0.8rem; padding: 8px;">Feature contributions computed within baseline uncertainty bounds.</div>';
      }
    }
  } else {
    // Clean Data Unavailable state without --% or blank text
    if (gaugeVal) {
      gaugeVal.textContent = "Data unavailable";
      gaugeVal.style.color = "#f59e0b";
      gaugeVal.style.fontSize = "1.1rem";
    }
    if (bustVal) {
      bustVal.textContent = "Data unavailable";
      bustVal.style.color = "#f59e0b";
      bustVal.style.fontSize = "1.1rem";
    }
    if (summaryText) {
      summaryText.textContent = `Explanation unavailable because the reliability model did not produce an explanation for ${location} (Day ${leadDay}).`;
    }
    if (recText) {
      recText.textContent = "Risk-aware guidance: Medium-range numerical guidance exhibits higher uncertainty. Monitor subsequent NWP updates before committing operational resources.";
    }
    if (featList) {
      featList.innerHTML = `
        <div style="text-align: center; padding: 16px; background: rgba(255,255,255,0.02); border-radius: 6px; border: 1px dashed rgba(255,255,255,0.1);">
          <div style="color: #94a3b8; font-size: 0.8rem; margin-bottom: 10px;">Feature contributions unavailable for this lead horizon.</div>
          <button onclick="openExplainabilityModal('${location}', ${leadDay})" class="btn btn-secondary" style="font-size: 0.78rem; padding: 5px 12px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 4px; cursor: pointer;">
            🔄 Retry SHAP Inference
          </button>
        </div>
      `;
    }
  }
}

// Close modal hook & click-outside dismiss
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("closeExplainModalBtn");
  const modal = document.getElementById("explainabilityModal");
  if (closeBtn) {
    closeBtn.addEventListener("click", window.closeExplainabilityModal);
  }
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        window.closeExplainabilityModal();
      }
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      window.closeExplainabilityModal();
    }
  });
});

