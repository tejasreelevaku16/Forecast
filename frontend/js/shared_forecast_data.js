/**
 * WeatherTrust AI — Shared Forecast & Risk Consistency Controller
 * Central single source of truth for:
 * 1. Bust Risk & Reliability Classification (strictly standardized thresholds: 0-29% Low, 30-59% Moderate, 60-100% High).
 * 2. Forecast Drift formatting (guarantees no 'undefined mm' or 'NaN' is ever shown).
 * 3. Shared synchronized forecast data state across all pages.
 */

const WeatherTrustCommon = {
  // Common Data Store
  current: {
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
