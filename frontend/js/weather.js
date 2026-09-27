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
  async fetchForecast(locationName = "Krishna District", lat = null, lon = null, region = null) {
    try {
      let url = `/api/weather/forecast?location=${encodeURIComponent(locationName)}`;
      if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
        url += `&lat=${lat}&lon=${lon}`;
      }
      if (region) {
        url += `&region=${encodeURIComponent(region)}`;
      }
      const response = await fetch(url);
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
  renderCurrentWeather(current, fallbackLocation = "Selected Location") {
    // Header & Hero info
    const locTitle = document.getElementById('currentLocationTitle');
    const locSub = document.getElementById('currentLocationSubtitle');
    const updatedElem = document.getElementById('lastUpdatedTime');

    // Live Tracking specific State / Place tags
    const liveState = document.getElementById('liveStateDisplay');
    const livePlace = document.getElementById('livePlaceDisplay');
    const liveDist = document.getElementById('liveDistrictDisplay');
    const liveDistWrap = document.getElementById('liveDistrictWrap');

    const tempElem = document.getElementById('currentTemp');
    const condTextElem = document.getElementById('currentConditionText');
    const condIconElem = document.getElementById('currentConditionIcon');
    const feelsLikeElem = document.getElementById('currentFeelsLike');
    const tempRangeElem = document.getElementById('currentTempRange');

    const humidityElem = document.getElementById('metricHumidity');
    const dewPointElem = document.getElementById('metricDewPoint');
    const windElem = document.getElementById('metricWind');
    const windSubElem = document.getElementById('metricWindSub');
    const pressureElem = document.getElementById('metricPressure');
    const rainChanceElem = document.getElementById('metricRainChance');
    const precipElem = document.getElementById('metricPrecip');
    const uvElem = document.getElementById('metricUV');
    const visibilityElem = document.getElementById('metricVisibility');
    const sunElem = document.getElementById('metricSun');
    const cloudCoverElem = document.getElementById('metricCloudCover');

    if (!current) {
      if (locTitle) locTitle.textContent = fallbackLocation;
      if (locSub) locSub.textContent = "Weather data unavailable for this location";
      if (updatedElem) updatedElem.textContent = "Status: Data Unavailable";
      if (livePlace) livePlace.textContent = fallbackLocation;
      if (liveDistWrap) liveDistWrap.style.display = 'none';

      if (tempElem) tempElem.innerHTML = `--<sup>°C</sup>`;
      if (condTextElem) condTextElem.textContent = "Data Unavailable";
      if (condIconElem) condIconElem.textContent = "❓";
      if (feelsLikeElem) feelsLikeElem.textContent = "Feels like --°C";
      if (tempRangeElem) tempRangeElem.textContent = "H: --°C • L: --°C";

      if (humidityElem) humidityElem.textContent = "--%";
      if (dewPointElem) dewPointElem.textContent = "--°C";
      if (windElem) windElem.textContent = "-- km/h";
      if (windSubElem) windSubElem.textContent = "Dir: --";
      if (pressureElem) pressureElem.textContent = "-- hPa";
      if (rainChanceElem) rainChanceElem.textContent = "--%";
      if (precipElem) precipElem.textContent = "-- mm";
      if (uvElem) uvElem.textContent = "--";
      if (visibilityElem) visibilityElem.textContent = "-- km";
      if (sunElem) sunElem.textContent = "-- / --";
      if (cloudCoverElem) cloudCoverElem.textContent = "--%";
      return;
    }

    if (locTitle) locTitle.textContent = `${current.location}, ${current.region}`;
    if (locSub) locSub.textContent = `${current.country} • Lat: ${current.latitude.toFixed(2)}°, Lon: ${current.longitude.toFixed(2)}°`;
    if (updatedElem) updatedElem.textContent = `Updated: ${current.updated_at}`;

    if (liveState) liveState.textContent = current.region;
    if (livePlace) livePlace.textContent = current.location;
    if (current.district) {
      if (liveDist) liveDist.textContent = current.district;
      if (liveDistWrap) liveDistWrap.style.display = 'inline';
    } else if (liveDistWrap) {
      liveDistWrap.style.display = 'none';
    }

    // Temperature & Conditions
    if (tempElem) tempElem.innerHTML = `${Math.round(current.temperature_c)}<sup>°C</sup>`;
    if (condTextElem) condTextElem.textContent = current.condition;
    if (condIconElem) condIconElem.textContent = this.getIconMarkup(current.condition_icon);
    if (feelsLikeElem) feelsLikeElem.textContent = `Feels like ${Math.round(current.feels_like_c)}°C`;
    if (tempRangeElem) tempRangeElem.textContent = `H: ${Math.round(current.temp_max_c)}°C • L: ${Math.round(current.temp_min_c)}°C`;

    // 8-Metric Details Grid
    if (humidityElem) humidityElem.textContent = `${current.humidity_pct}%`;
    if (dewPointElem) {
      dewPointElem.textContent = current.dew_point_c != null ? `${Math.round(current.dew_point_c)}°C` : '--°C';
    }

    if (windElem) windElem.textContent = `${current.wind_speed_kmh} km/h`;
    if (windSubElem) {
      const gustText = current.wind_gusts_kmh != null ? ` • Gusts: ${Math.round(current.wind_gusts_kmh)} km/h` : '';
      windSubElem.textContent = `Dir: ${current.wind_direction}${gustText}`;
    }

    if (pressureElem) pressureElem.textContent = `${current.pressure_hpa} hPa`;
    if (rainChanceElem) rainChanceElem.textContent = `${current.rain_chance_pct}%`;
    if (precipElem) precipElem.textContent = `${current.precipitation_mm} mm`;
    if (uvElem) uvElem.textContent = `${current.uv_index} / 11`;
    if (visibilityElem) visibilityElem.textContent = `${current.visibility_km} km`;
    if (sunElem) sunElem.textContent = `${current.sunrise} / ${current.sunset}`;

    if (cloudCoverElem) {
      cloudCoverElem.textContent = current.cloud_cover_pct != null ? `${Math.round(current.cloud_cover_pct)}%` : '--%';
    }
  },

  /**
   * Renders the 24-hour horizontal forecast cards
   */
  renderHourlyTimeline(hourlyItems) {
    const container = document.getElementById('hourlyTimelineContainer');
    if (!container) return;

    if (!hourlyItems || hourlyItems.length === 0) {
      container.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: #94a3b8; width: 100%;">Hourly forecast data unavailable for this location.</div>';
      return;
    }

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
  renderDailyForecast(dailyItems, reliabilityData = null, insightsData = window.currentWeatherInsights) {
    const container = document.getElementById('dailyForecastContainer');
    if (!container) return;

    if (!dailyItems || dailyItems.length === 0) {
      container.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: #94a3b8; width: 100%;">10-day forecast outlook unavailable for this location.</div>';
      return;
    }

    const leadDayMap = {};
    if (reliabilityData && reliabilityData.lead_days) {
      reliabilityData.lead_days.forEach(ld => {
        leadDayMap[ld.lead_day] = ld;
      });
    }

    container.innerHTML = '';
    dailyItems.forEach(item => {
      const rel = leadDayMap[item.day_index];
      const bustProb = rel ? rel.bust_probability_pct : 50;
      const riskInfo = typeof WeatherTrustCommon !== 'undefined'
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
      const dayTrust = insightsData?.replay?.days?.find(day => day.day === item.day_index)?.trust;
      const trustBadge = dayTrust && dayTrust.available && typeof WeatherTrustInsightsUI !== 'undefined'
        ? WeatherTrustInsightsUI.badgeInfo(dayTrust.score)
        : null;

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
          ${trustBadge ? `<span class="badge reliability-badge ${trustBadge.className}">${trustBadge.label}</span>` : ''}
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
          <strong style="color: #fbbf24; text-transform: uppercase; font-size: 0.8rem;">WeatherTrust AI Diagnostic Alert: ${first.headline}</strong>
          <p style="font-size: 0.775rem; margin-top: 2px;">${first.description} (Issued: ${first.issued_at})</p>
        </div>
      `;
    } else {
      alertBox.style.display = 'none';
    }
  }
};
