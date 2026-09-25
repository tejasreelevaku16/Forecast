/**
 * WeatherTrust AI — Weather Service Client & UI Renderer (Phase 1)
 * Handles fetching weather data from FastAPI backend and populating dashboard elements.
 */

const WeatherUI = {
  /**
   * Maps weather condition icons to SVG / Unicode / visual markers
   */
  getIconMarkup(iconKey) {
    const iconMap = {
      'sun': '☀️',
      'cloud-sun': '⛅',
      'cloud': '☁️',
      'cloud-rain': '🌧️',
      'cloud-rain-heavy': '⛈️',
      'cloud-lightning': '🌩️',
      'wind': '💨'
    };
    return iconMap[iconKey] || '⛅';
  },

  /**
   * Fetches full forecast payload from FastAPI backend
   */
  async fetchForecast(locationName = "Krishna District") {
    try {
      const response = await fetch(`/api/weather/forecast?location=${encodeURIComponent(locationName)}`);
      if (!response.ok) {
        throw new Error(`Weather API Error: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      console.error("Failed to fetch weather forecast:", err);
      return null;
    }
  },

  /**
   * Updates Current Weather hero card and 8-grid details
   */
  renderCurrentWeather(current) {
    if (!current) return;

    // Header & Hero info
    document.getElementById('currentLocationTitle').textContent = `${current.location}, ${current.region}`;
    document.getElementById('currentLocationSubtitle').textContent = `${current.country} • Lat: ${current.latitude.toFixed(2)}°, Lon: ${current.longitude.toFixed(2)}°`;
    document.getElementById('lastUpdatedTime').textContent = `Updated: ${current.updated_at}`;

    // Temperature & Conditions
    document.getElementById('currentTemp').innerHTML = `${Math.round(current.temperature_c)}<sup>°C</sup>`;
    document.getElementById('currentConditionText').textContent = current.condition;
    document.getElementById('currentConditionIcon').textContent = this.getIconMarkup(current.condition_icon);
    document.getElementById('currentFeelsLike').textContent = `Feels like ${Math.round(current.feels_like_c)}°C`;
    document.getElementById('currentTempRange').textContent = `H: ${Math.round(current.temp_max_c)}°C • L: ${Math.round(current.temp_min_c)}°C`;

    // 8-Metric Details Grid
    document.getElementById('metricHumidity').textContent = `${current.humidity_pct}%`;
    document.getElementById('metricWind').textContent = `${current.wind_speed_kmh} km/h`;
    document.getElementById('metricWindSub').textContent = `Direction: ${current.wind_direction}`;
    document.getElementById('metricPressure').textContent = `${current.pressure_hpa} hPa`;
    document.getElementById('metricRainChance').textContent = `${current.rain_chance_pct}%`;
    document.getElementById('metricPrecip').textContent = `${current.precipitation_mm} mm`;
    document.getElementById('metricUV').textContent = `${current.uv_index} / 11`;
    document.getElementById('metricVisibility').textContent = `${current.visibility_km} km`;
    document.getElementById('metricSun').textContent = `${current.sunrise} / ${current.sunset}`;
  },

  /**
   * Renders the 24-hour horizontal forecast cards
   */
  renderHourlyTimeline(hourlyItems) {
    const container = document.getElementById('hourlyTimelineContainer');
    if (!container || !hourlyItems) return;

    container.innerHTML = '';
    hourlyItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'hourly-card';
      card.innerHTML = `
        <span class="hourly-time">${item.time}</span>
        <span class="hourly-icon">${this.getIconMarkup(item.condition_icon)}</span>
        <span class="hourly-temp">${Math.round(item.temperature_c)}°</span>
        <span class="hourly-rain">💧 ${item.rain_chance_pct}%</span>
      `;
      container.appendChild(card);
    });
  },

  /**
   * Renders the Day 1 to Day 10 forecast rows, integrating lead-day reliability indicators
   */
  renderDailyForecast(dailyItems, reliabilityData = null) {
    const container = document.getElementById('dailyForecastContainer');
    if (!container || !dailyItems) return;

    const leadDayMap = {};
    if (reliabilityData && reliabilityData.lead_days) {
      reliabilityData.lead_days.forEach(ld => {
        leadDayMap[ld.lead_day] = ld;
      });
    }

    container.innerHTML = '';
    dailyItems.forEach(item => {
      const rel = leadDayMap[item.day_index];
      const trustScore = rel ? rel.reliability_score : 50;
      const bustProb = rel ? rel.bust_probability_pct : 50;
      const riskLevel = rel ? rel.risk_level : "MODERATE";

      // Pick badge style
      let badgeClass = 'badge-risk-mod';
      let barFillColor = '#f59e0b';
      if (riskLevel === 'LOW') {
        badgeClass = 'badge-risk-low';
        barFillColor = '#10b981';
      } else if (riskLevel === 'HIGH') {
        badgeClass = 'badge-risk-high';
        barFillColor = '#ef4444';
      }

      const row = document.createElement('div');
      row.className = `daily-row ${item.day_index === 6 ? 'highlight-day6' : ''}`;
      row.innerHTML = `
        <div class="daily-day-col">
          <span class="daily-day-name">${item.day_name}</span>
          <span class="daily-day-date">${item.date}</span>
        </div>
        <div class="daily-cond-col">
          <span class="daily-cond-icon">${this.getIconMarkup(item.condition_icon)}</span>
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
   * Renders meteorological advisory banner if alerts exist
   */
  renderAlerts(alerts) {
    const alertBox = document.getElementById('weatherAlertBox');
    if (!alertBox) return;

    if (alerts && alerts.length > 0) {
      const first = alerts[0];
      alertBox.style.display = 'flex';
      alertBox.innerHTML = `
        <div style="font-size: 1.25rem;">⚠️</div>
        <div style="flex: 1;">
          <strong style="color: #fbbf24; text-transform: uppercase; font-size: 0.8rem;">Official Advisory: ${first.headline}</strong>
          <p style="font-size: 0.775rem; margin-top: 2px;">${first.description} (Issued: ${first.issued_at})</p>
        </div>
      `;
    } else {
      alertBox.style.display = 'none';
    }
  }
};
