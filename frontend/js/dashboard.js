/**
 * WeatherTrust AI — Main Dashboard Coordinator (Phase 1)
 * Manages search interactions, city selection, map initialization,
 * and concurrent data retrieval from FastAPI backend.
 */

let mapInstance = null;
let currentLocation = "Krishna District, Andhra Pradesh";

/**
 * Initializes Leaflet Map with regional reliability markers
 */
function initRegionalReliabilityMap(lat = 16.5062, lon = 80.6480, locationName = "Krishna District") {
  const mapContainer = document.getElementById('map');
  if (!mapContainer || typeof L === 'undefined') return;

  if (mapInstance) {
    mapInstance.remove();
  }

  // Dark basemap from CartoDB
  mapInstance = L.map('map', {
    center: [lat, lon],
    zoom: 7,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(mapInstance);

  // Regional reliability demonstration markers
  const regions = [
    { name: "Krishna District", lat: 16.5062, lon: 80.6480, score: 24, bust: "76%", risk: "HIGH", color: "#ef4444" },
    { name: "Guntur", lat: 16.3067, lon: 80.4365, score: 32, bust: "68%", risk: "HIGH", color: "#ef4444" },
    { name: "West Godavari", lat: 16.7107, lon: 81.0952, score: 48, bust: "52%", risk: "MODERATE", color: "#f59e0b" },
    { name: "Hyderabad", lat: 17.3850, lon: 78.4867, score: 78, bust: "22%", risk: "LOW", color: "#10b981" },
  ];

  regions.forEach(reg => {
    const circle = L.circleMarker([reg.lat, reg.lon], {
      radius: 12,
      fillColor: reg.color,
      color: '#ffffff',
      weight: 2,
      opacity: 0.9,
      fillOpacity: 0.7
    }).addTo(mapInstance);

    circle.bindPopup(`
      <div style="font-family: Inter, sans-serif; color: #0f172a; padding: 4px;">
        <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 700;">${reg.name}</h4>
        <div style="font-size: 12px; margin-bottom: 2px;">Forecast Trust: <strong>${reg.score}/100</strong></div>
        <div style="font-size: 12px; margin-bottom: 2px;">Bust Risk: <strong>${reg.bust} (${reg.risk})</strong></div>
        <span style="font-size: 10px; color: #64748b;">(Demo Simulation Zone)</span>
      </div>
    `);

    if (reg.name === "Krishna District") {
      circle.openPopup();
    }
  });
}

/**
 * Loads and refreshes all dashboard modules for the requested location
 */
async function loadDashboard(locationQuery) {
  currentLocation = locationQuery;

  // Run weather and reliability queries concurrently
  const [weatherData, reliabilityData] = await Promise.all([
    WeatherUI.fetchForecast(locationQuery),
    ReliabilityUI.fetchOverview(locationQuery),
  ]);

  if (weatherData && weatherData.current) {
    WeatherUI.renderCurrentWeather(weatherData.current);
    WeatherUI.renderHourlyTimeline(weatherData.hourly);
    WeatherUI.renderDailyForecast(weatherData.daily, reliabilityData);
    WeatherUI.renderAlerts(weatherData.alerts);

    if (typeof renderHourlyTrendChart === 'function') {
      renderHourlyTrendChart(weatherData.hourly);
    }

    // Center map on location
    if (typeof initRegionalReliabilityMap === 'function') {
      initRegionalReliabilityMap(
        weatherData.current.latitude,
        weatherData.current.longitude,
        weatherData.current.location
      );
    }
  }

  if (reliabilityData) {
    ReliabilityUI.renderHero(reliabilityData);
    if (typeof renderBustRiskChart === 'function') {
      renderBustRiskChart(reliabilityData.lead_days);
    }
  }
}

/**
 * Setup UI Event Listeners
 */
function setupEventListeners() {
  // Quick location pill buttons
  const pills = document.querySelectorAll('.pill-btn');
  pills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const loc = pill.getAttribute('data-location');
      loadDashboard(loc);
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
                searchInput.value = item.name;
                searchDropdown.classList.remove('active');
                // Deactivate pills
                pills.forEach(p => p.classList.remove('active'));
                loadDashboard(item.name);
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

    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
        searchDropdown.classList.remove('active');
      }
    });

    // Enter key submits search
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          searchDropdown.classList.remove('active');
          pills.forEach(p => p.classList.remove('active'));
          loadDashboard(query);
        }
      }
    });
  }

  // Sidebar navigation links
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const targetId = item.getAttribute('data-target');
      if (targetId) {
        const targetElem = document.getElementById(targetId);
        if (targetElem) {
          targetElem.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
}

// Initial Boot
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadDashboard("Krishna District");
});
