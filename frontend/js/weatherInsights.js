const WeatherTrustInsightsUI = {
  currentData: null,
  selectedReplayDay: 10,
  initialized: false,

  badgeInfo(score) {
    const value = Number(score);
    if (!Number.isFinite(value)) return { label: "Unavailable", className: "badge-neutral" };
    if (value >= 80) return { label: "Reliable", className: "badge-risk-low" };
    if (value >= 50) return { label: "Watch", className: "badge-risk-mod" };
    return { label: "Unreliable", className: "badge-risk-high" };
  },

  makeBadge(score, extraClass = "") {
    const info = this.badgeInfo(score);
    const badge = document.createElement("span");
    badge.className = `badge reliability-badge ${info.className} ${extraClass}`.trim();
    badge.textContent = info.label;
    return badge;
  },

  async fetchInsights(forecast, reliability, focusLeadDay = 6) {
    if (!forecast || forecast.available === false || !Array.isArray(forecast.daily) || !forecast.daily.length) return null;
    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forecast, reliability, focus_lead_day: focusLeadDay }),
      });
      if (!response.ok) throw new Error(`Insights API returned HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.warn("Weather insight calculation unavailable:", error);
      return null;
    }
  },

  async fetchLocationBadge(location) {
    const params = new URLSearchParams({
      location: location.place || location.name,
      lead_day: "1",
    });
    if (location.latitude !== null && location.latitude !== undefined) params.set("lat", location.latitude);
    if (location.longitude !== null && location.longitude !== undefined) params.set("lon", location.longitude);
    if (location.state) params.set("region", location.state);
    const response = await fetch(`/api/insights/badge?${params}`);
    if (!response.ok) throw new Error(`Location score returned HTTP ${response.status}`);
    return response.json();
  },

  setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  },

  renderDashboardBadge(data) {
    const target = document.getElementById("dashWeatherTrustBadge");
    if (!target) return;
    target.replaceChildren();
    if (data?.weather_trust?.available) target.appendChild(this.makeBadge(data.weather_trust.score));
  },

  renderTrust(data) {
    const score = data?.weather_trust;
    const gauge = document.getElementById("weatherTrustGauge");
    const scoreText = document.getElementById("weatherTrustScore");
    const label = document.getElementById("weatherTrustLabel");
    const reason = document.getElementById("weatherTrustReason");
    const contributionList = document.getElementById("weatherTrustContributions");
    if (!gauge || !scoreText || !label || !reason || !contributionList) return;

    contributionList.replaceChildren();
    if (!score?.available) {
      gauge.classList.add("is-unavailable");
      gauge.style.removeProperty("--trust-score");
      scoreText.textContent = "Unavailable";
      label.replaceChildren(this.makeBadge(null));
      reason.textContent = score?.error || "Forecast feature inputs are unavailable for this location.";
      return;
    }

    const color = score.score >= 80 ? "#10b981" : score.score >= 50 ? "#f59e0b" : "#ef4444";
    gauge.classList.remove("is-unavailable");
    gauge.style.setProperty("--trust-score", `${score.score}%`);
    gauge.style.setProperty("--trust-color", color);
    scoreText.textContent = `${score.score}`;
    label.replaceChildren(this.makeBadge(score.score));
    reason.textContent = score.reason;

    score.contributions.forEach(feature => {
      const row = document.createElement("div");
      row.className = "trust-contribution-row";
      const heading = document.createElement("div");
      heading.className = "trust-contribution-heading";
      const name = document.createElement("span");
      name.textContent = feature.name;
      const amount = document.createElement("span");
      amount.textContent = `${feature.contribution_pct}% of current risk`;
      heading.append(name, amount);
      const track = document.createElement("div");
      track.className = "trust-contribution-track";
      const fill = document.createElement("div");
      fill.className = "trust-contribution-fill";
      fill.style.width = `${Math.max(0, Math.min(100, feature.contribution_pct))}%`;
      fill.style.backgroundColor = color;
      track.appendChild(fill);
      row.append(heading, track);
      contributionList.appendChild(row);
    });
  },

  renderDisagreement(data) {
    const view = data?.disagreement;
    const container = document.getElementById("disagreementCard");
    if (!container) return;
    const set = (id, value) => this.setText(id, value);
    if (!view?.available) {
      set("nwpConfidenceValue", "Unavailable");
      set("aiConfidenceValue", "Unavailable");
      set("disagreementDifference", "Unavailable");
      set("disagreementIndex", "Unavailable");
      set("disagreementBustRisk", "Unavailable");
      set("disagreementExplanation", view?.explanation || "Comparison inputs are unavailable.");
      const badge = document.getElementById("disagreementRiskBadge");
      if (badge) {
        badge.textContent = "Unavailable";
        badge.className = "badge badge-neutral";
      }
      return;
    }
    set("nwpConfidenceValue", `${view.nwp_confidence_pct}%`);
    set("aiConfidenceValue", `${view.ai_reliability_confidence_pct}%`);
    set("disagreementDifference", `${view.difference_pct} percentage points`);
    set("disagreementIndex", `${view.disagreement_index}`);
    set("disagreementBustRisk", view.bust_probability_pct === null ? "Unavailable" : `${view.bust_probability_pct}%`);
    set("disagreementExplanation", view.explanation);
    const badge = document.getElementById("disagreementRiskBadge");
    if (badge) {
      const className = view.risk_level === "LOW" ? "badge-risk-low" : view.risk_level === "MEDIUM" ? "badge-risk-mod" : "badge-risk-high";
      badge.textContent = `${view.risk_level} DISAGREEMENT`;
      badge.className = `badge ${className}`;
    }
    set("nwpConfidenceBasis", view.nwp_confidence_basis);
  },

  renderReplay(data) {
    const replay = data?.replay;
    const slider = document.getElementById("forecastReplaySlider");
    const empty = document.getElementById("forecastReplayEmpty");
    const content = document.getElementById("forecastReplayContent");
    if (!slider || !empty || !content) return;
    if (!replay?.days?.length) {
      empty.hidden = false;
      content.hidden = true;
      return;
    }

    empty.hidden = true;
    content.hidden = false;
    slider.min = "0";
    slider.max = String(replay.days.length - 1);
    if (this.selectedReplayDay > replay.days.length) this.selectedReplayDay = replay.days.length;
    slider.value = String(replay.days.length - this.selectedReplayDay);
    this.renderReplayDay(this.selectedReplayDay);
    this.renderReplaySummary(replay);
  },

  renderReplayDay(dayNumber) {
    const days = this.currentData?.replay?.days;
    const slider = document.getElementById("forecastReplaySlider");
    if (!Array.isArray(days) || !days.length || !slider) return;
    const selected = Math.max(1, Math.min(days.length, Number(dayNumber) || 1));
    this.selectedReplayDay = selected;
    slider.value = String(days.length - selected);
    const day = days[selected - 1];
    this.setText("forecastReplayDayLabel", `Day ${day.day}: ${day.date}`);

    const values = {
      replayRainfall: day.rainfall_mm === null ? "Unavailable" : `${day.rainfall_mm} mm`,
      replayTemperature: day.temperature_min_c === null || day.temperature_max_c === null ? "Unavailable" : `${day.temperature_min_c}–${day.temperature_max_c} °C`,
      replayWind: day.wind_speed_kmh === null ? "Unavailable" : `${day.wind_speed_kmh} km/h`,
      replayHumidity: day.humidity_pct === null ? "Unavailable" : `${day.humidity_pct}%`,
      replayPressure: day.pressure_hpa === null ? "Unavailable" : `${day.pressure_hpa} hPa`,
      replayBustProbability: day.bust_probability_pct === null ? "Unavailable" : `${day.bust_probability_pct}%`,
    };
    Object.entries(values).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (!element) return;
      element.classList.remove("replay-value-changed");
      element.textContent = value;
      requestAnimationFrame(() => element.classList.add("replay-value-changed"));
    });

    const trust = day.trust;
    const trustElement = document.getElementById("replayTrustScore");
    const badge = document.getElementById("replayTrustBadge");
    if (trustElement) trustElement.textContent = trust?.available ? `${trust.score} / 100` : "Unavailable";
    if (badge) {
      badge.replaceChildren();
      if (trust?.available) badge.appendChild(this.makeBadge(trust.score));
      else badge.appendChild(this.makeBadge(null));
    }
  },

  renderReplaySummary(replay) {
    const first = replay.earliest;
    const last = replay.latest;
    this.setText("replayEarliestLabel", first ? `Day ${first.day} · ${first.date}` : "Unavailable");
    this.setText("replayLatestLabel", last ? `Day ${last.day} · ${last.date}` : "Unavailable");
    const rainfallDrift = replay.drift?.rainfall_mm;
    this.setText("replayDriftSummary", rainfallDrift === null || rainfallDrift === undefined
      ? "Forecast drift unavailable"
      : `Rainfall changed ${rainfallDrift > 0 ? "+" : ""}${rainfallDrift.toFixed(1)} mm from Day 1 to Day 10.`);
  },

  renderAdvisories(data) {
    const container = document.getElementById("impactAdvisoriesGrid");
    if (!container) return;
    container.replaceChildren();
    if (!data?.advisories?.length) {
      const empty = document.createElement("p");
      empty.className = "insight-empty-state";
      empty.textContent = "Impact advisories are unavailable until forecast data is available.";
      container.appendChild(empty);
      return;
    }
    data.advisories.forEach(advisory => {
      const card = document.createElement("article");
      card.className = "impact-advisory-item";
      const heading = document.createElement("div");
      heading.className = "impact-advisory-heading";
      const title = document.createElement("h4");
      title.textContent = advisory.sector;
      const level = document.createElement("span");
      const riskClass = advisory.risk_level === "LOW" ? "badge-risk-low" : advisory.risk_level === "MODERATE" ? "badge-risk-mod" : "badge-risk-high";
      level.className = `badge ${riskClass}`;
      level.textContent = advisory.risk_level;
      heading.append(title, level);
      const impact = document.createElement("p");
      impact.className = "impact-advisory-impact";
      impact.textContent = advisory.expected_impact;
      const action = document.createElement("p");
      action.className = "impact-advisory-action";
      action.textContent = advisory.recommended_action;
      card.append(heading, impact, action);
      container.appendChild(card);
    });

    const first = data.advisories[0];
    const summary = document.getElementById("decisionSupportActionText");
    const badge = document.getElementById("decisionSupportTierBadge");
    const title = document.getElementById("decisionSupportSectorTitle");
    if (summary) summary.textContent = first.recommended_action;
    if (title) title.textContent = `${first.sector} Advisory · ${data.location}`;
    if (badge) {
      const riskClass = first.risk_level === "LOW" ? "badge-risk-low" : first.risk_level === "MODERATE" ? "badge-risk-mod" : "badge-risk-high";
      badge.textContent = `${first.risk_level} RISK`;
      badge.className = `badge ${riskClass}`;
    }
    this.setText("decisionSupportForecastValue", data.weather_trust?.features?.rainfall_mm === undefined ? "Unavailable" : `${data.weather_trust.features.rainfall_mm} mm`);
    this.setText("decisionSupportTrustValue", data.weather_trust?.available ? `${data.weather_trust.score} / 100` : "Unavailable");
    this.setText("decisionSupportBustValue", data.disagreement?.bust_probability_pct === null || data.disagreement?.bust_probability_pct === undefined ? "Unavailable" : `${data.disagreement.bust_probability_pct}%`);
    this.setText("decisionSupportRecommendedAction", first.recommended_action);
  },

  renderAll(data) {
    this.currentData = data || null;
    this.renderDashboardBadge(this.currentData);
    this.renderTrust(this.currentData);
    this.renderDisagreement(this.currentData);
    this.renderReplay(this.currentData);
    this.renderAdvisories(this.currentData);
  },

  init() {
    if (this.initialized) return;
    this.initialized = true;
    const slider = document.getElementById("forecastReplaySlider");
    if (slider) slider.addEventListener("input", event => {
      const dayCount = this.currentData?.replay?.days?.length || 10;
      this.renderReplayDay(dayCount - Number(event.target.value));
    });
  },
};
