/**
 * WeatherTrust AI — Forecast Trust Layer Client & Renderer (Phase 1)
 * Handles fetching reliability, bust probabilities, explainability factors,
 * and user recommendations from the FastAPI backend.
 */

const ReliabilityUI = {
  /**
   * Fetches reliability overview from FastAPI
   */
  async fetchOverview(locationName = "Krishna District") {
    try {
      const response = await fetch(`/api/reliability/overview?location=${encodeURIComponent(locationName)}`);
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
   * Renders the Forecast Trust Hero Card and Explainability Section
   */
  renderHero(data) {
    if (!data) return;

    // Demo badge text
    const badgeElem = document.getElementById('demoBadge');
    if (badgeElem && data.is_demo) {
      badgeElem.textContent = data.demo_badge_text || "DEMO / SAMPLE SIMULATION";
    }

    // Reliability Score & Confidence Label
    const scoreElem = document.getElementById('trustScoreValue');
    const labelElem = document.getElementById('confidenceLabel');
    if (scoreElem && labelElem) {
      scoreElem.textContent = `${data.reliability_score} / 100`;
      labelElem.textContent = data.confidence_label;

      scoreElem.className = 'score-display ' + (
        data.reliability_score < 40 ? 'score-low' :
        data.reliability_score < 70 ? 'score-mod' : 'score-high'
      );
    }

    // Bust Probability
    const bustElem = document.getElementById('bustProbabilityValue');
    const bustRiskLevelElem = document.getElementById('bustRiskLevelBadge');
    if (bustElem) {
      bustElem.textContent = `${data.bust_probability_pct}%`;
    }
    if (bustRiskLevelElem) {
      bustRiskLevelElem.textContent = `${data.risk_level} RISK`;
      bustRiskLevelElem.className = 'badge ' + (
        data.risk_level === 'LOW' ? 'badge-risk-low' :
        data.risk_level === 'MODERATE' ? 'badge-risk-mod' : 'badge-risk-high'
      );
    }

    // Stability
    const stabElem = document.getElementById('forecastStabilityValue');
    if (stabElem) {
      stabElem.textContent = data.forecast_stability;
      stabElem.style.color = (data.forecast_stability === 'HIGH' ? '#10b981' : data.forecast_stability === 'MODERATE' ? '#f59e0b' : '#ef4444');
    }

    // Drift Monitor Mini-Banner
    const driftWrap = document.getElementById('driftMonitorSnapshot');
    if (driftWrap && data.drift_monitor) {
      const dm = data.drift_monitor;
      driftWrap.innerHTML = `
        <div style="font-size: 0.775rem; color: #94a3b8; display: flex; align-items: center; justify-content: space-between; width: 100%;">
          <span><strong>Forecast Drift Monitor (Day ${dm.target_lead_day}):</strong> ${dm.variable_name}</span>
          <span style="color: #ef4444; font-weight: 700;">Previous: ${dm.previous_run_value} ${dm.unit} ➔ Latest: ${dm.latest_run_value} ${dm.unit} (+${dm.absolute_change} ${dm.unit})</span>
        </div>
      `;
    }

    // Explainable "Why?" list
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
