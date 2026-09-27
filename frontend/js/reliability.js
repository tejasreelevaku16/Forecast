/**
 * WeatherTrust AI — Forecast Trust Layer Client & Renderer (Phases 4, 8, 10, 13, 14)
 * Handles fetching ML-backed reliability, bust probabilities, explainability factors,
 * proactive alerts, and sector-based decision recommendations from FastAPI backend.
 */

const ReliabilityUI = {
  currentSector: "General Public",
  currentLeadDay: 6,

  /**
   * Fetches reliability overview from FastAPI
   */
  async fetchOverview(locationName = "Krishna District", leadDay = 6, sector = "General Public") {
    this.currentSector = sector;
    this.currentLeadDay = leadDay;
    try {
      const url = `/api/reliability/overview?location=${encodeURIComponent(locationName)}&lead_day=${leadDay}&sector=${encodeURIComponent(sector)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Reliability API Error: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      console.error("Failed to fetch reliability overview:", err);
      return null;
    }
  },

  /**
   * Fetches active reliability alerts
   */
  async fetchAlerts(locationName = "Krishna District") {
    try {
      const res = await fetch(`/api/alerts/reliability?location=${encodeURIComponent(locationName)}`);
      if (res.ok) {
        const payload = await res.json();
        this.renderAlerts(payload.alerts);
      }
    } catch (e) {
      console.error("Failed to fetch alerts:", e);
    }
  },

  /**
   * Renders proactive reliability alert banner
   */
  renderAlerts(alerts) {
    const alertBox = document.getElementById('reliabilityAlertBanner');
    if (!alertBox) return;

    if (alerts && alerts.length > 0) {
      const a = alerts[0];
      alertBox.style.display = 'flex';
      alertBox.innerHTML = `
        <div style="font-size: 1.4rem;">🚨</div>
        <div style="flex: 1;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color: #ef4444; font-size: 0.85rem; text-transform:uppercase;">${a.headline}</strong>
            <span class="badge badge-risk-high">${a.metric}</span>
          </div>
          <p style="font-size: 0.8rem; color: #f8fafc; margin-top: 3px;">${a.message}</p>
        </div>
      `;
    } else {
      alertBox.style.display = 'none';
    }
  },

  /**
   * Renders the Forecast Trust Hero Card and Explainability Section
   */
  renderHero(data) {
    if (!data) return;

    // ML Badge / Notice
    const badgeElem = document.getElementById('demoBadge');
    if (badgeElem) {
      badgeElem.textContent = data.demo_badge_text || "CALIBRATED ML MODEL";
      badgeElem.className = data.is_demo ? 'badge badge-demo' : 'badge badge-neutral';
      if (!data.is_demo) {
        badgeElem.style.background = 'rgba(56, 189, 248, 0.15)';
        badgeElem.style.borderColor = '#38bdf8';
        badgeElem.style.color = '#38bdf8';
      }
    }

    const bustProb = data.bust_probability_pct !== undefined ? data.bust_probability_pct : 76;
    const riskInfo = typeof WeatherTrustCommon !== 'undefined'
      ? WeatherTrustCommon.classifyRisk(bustProb)
      : {
          bust_probability: bustProb,
          trust_score: 100 - bustProb,
          risk_level: bustProb < 30 ? "LOW" : bustProb < 60 ? "MODERATE" : "HIGH",
          risk_label: bustProb < 30 ? "LOW RISK" : bustProb < 60 ? "MODERATE RISK" : "HIGH RISK",
          confidence_label: bustProb < 30 ? "HIGH CONFIDENCE" : bustProb < 60 ? "MODERATE CONFIDENCE" : "LOW CONFIDENCE",
          color: bustProb < 30 ? "#10b981" : bustProb < 60 ? "#f59e0b" : "#ef4444",
          badge_class: bustProb < 30 ? "badge-risk-low" : bustProb < 60 ? "badge-risk-mod" : "badge-risk-high"
        };

    // Reliability Score & Confidence Label
    const scoreElem = document.getElementById('trustScoreValue');
    const labelElem = document.getElementById('confidenceLabel');
    if (scoreElem && labelElem) {
      scoreElem.textContent = `${riskInfo.trust_score} / 100`;
      labelElem.textContent = riskInfo.confidence_label;

      scoreElem.className = 'score-display ' + (
        riskInfo.reliability_level === 'LOW' ? 'score-low' :
        riskInfo.reliability_level === 'MODERATE' ? 'score-mod' : 'score-high'
      );
      labelElem.style.color = riskInfo.color;
    }

    // Bust Probability
    const bustElem = document.getElementById('bustProbabilityValue');
    const bustRiskLevelElem = document.getElementById('bustRiskLevelBadge');
    if (bustElem) {
      bustElem.textContent = `${riskInfo.bust_probability}%`;
    }
    if (bustRiskLevelElem) {
      bustRiskLevelElem.textContent = `${riskInfo.risk_label}`;
      bustRiskLevelElem.className = `badge ${riskInfo.badge_class}`;
    }

    // Stability
    const stabElem = document.getElementById('forecastStabilityValue');
    if (stabElem) {
      const stab = data.forecast_stability || riskInfo.stability;
      stabElem.textContent = stab;
      stabElem.style.color = (stab === 'HIGH' ? '#10b981' : stab === 'MODERATE' ? '#f59e0b' : '#ef4444');
    }

    // Drift Monitor Mini-Banner
    const driftWrap = document.getElementById('driftMonitorSnapshot');
    if (driftWrap) {
      const dm = data.drift_monitor;
      if (dm && dm.absolute_change !== undefined && dm.absolute_change !== null) {
        driftWrap.innerHTML = `
          <div style="font-size: 0.775rem; color: #94a3b8; display: flex; align-items: center; justify-content: space-between; width: 100%; flex-wrap: wrap; gap: 6px;">
            <span><strong>Forecast Drift Monitor (Day ${dm.target_lead_day || 6}):</strong> ${dm.variable_name || "24h Cumulative Rainfall"}</span>
            <span style="color: ${dm.absolute_change > 20 ? '#ef4444' : '#f59e0b'}; font-weight: 700;">
              Previous: ${dm.previous_run_value} ${dm.unit || 'mm'} ➔ Latest: ${dm.latest_run_value} ${dm.unit || 'mm'} (+${dm.absolute_change} ${dm.unit || 'mm'} Shift)
            </span>
          </div>
        `;
      } else {
        driftWrap.innerHTML = `
          <div style="font-size: 0.775rem; color: #94a3b8;">
            <strong>Forecast Drift Monitor:</strong> Drift data unavailable
          </div>
        `;
      }
    }

    // Explainable "Why?" list (Model-derived)
    const whyList = document.getElementById('whyFactorsContainer');
    if (whyList && data.reasons) {
      whyList.innerHTML = '';
      data.reasons.forEach(factor => {
        let iconMarkup = '🔴';
        if (factor.icon_type === 'drift') iconMarkup = '🔄';
        if (factor.icon_type === 'variability') iconMarkup = '📊';

        const item = document.createElement('div');
        item.className = `why-factor-item ${factor.severity === 'moderate' ? 'mod' : ''}`;
        item.innerHTML = `
          <span class="why-icon">${iconMarkup}</span>
          <div class="why-content">
            <h4>${factor.title}</h4>
            <p>${factor.description}</p>
          </div>
        `;
        whyList.appendChild(item);
      });
    }

    // User Recommendation Box
    const recTextElem = document.getElementById('recommendationText');
    if (recTextElem) {
      recTextElem.textContent = data.recommendation;
    }
  }
};
