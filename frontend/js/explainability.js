/**
 * WeatherTrust AI — Explainable Forecast Bust Analysis / SHAP Engine (SIH Feature 5)
 * Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
 * 
 * Renders:
 * A. Circular Confidence Gauge (0–100)
 * B. Bust Probability Indicator with animated percentage
 * C. SHAP Contribution Chart (Horizontal Bars: Green positive, Red negative)
 * D. Meteorological Natural Language Explanation
 * E. NCMRWF Operational Decision Recommendations
 */

let shapChartInstance = null;
let currentExplainLeadDay = 6;

async function loadExplainabilityData(location = "Vijayawada", leadDay = 6) {
  currentExplainLeadDay = leadDay;
  const locHeader = document.getElementById("explainLocationHeader");
  if (locHeader) locHeader.textContent = `${location} (Lead Day ${leadDay})`;

  try {
    const resp = await fetch(`/api/explain/bust?location=${encodeURIComponent(location)}&lead_day=${leadDay}`);
    if (!resp.ok) throw new Error("Failed to load explainability data");
    const data = await resp.json();

    if (!data || !data.top_features) {
      throw new Error("No explanation payload returned");
    }

    renderGaugeAndBustIndicators(data.confidence ?? null, data.bust_probability ?? null, data.risk ?? "unknown");
    renderShapChart(Array.isArray(data.top_features) ? data.top_features : []);

    const summaryEl = document.getElementById("explainSummaryText");
    if (summaryEl) summaryEl.textContent = data.summary || "Explanation unavailable because the reliability model has not produced an explanation for this location.";

    const recEl = document.getElementById("explainRecText");
    const riskBadge = document.getElementById("explainRiskLevelBadge");
    if (recEl) recEl.textContent = data.recommendation || "Risk-aware guidance is unavailable for this forecast window.";
    if (riskBadge) {
      const riskText = (data.risk || "Unknown").toString();
      riskBadge.textContent = `${riskText} Bust Risk`;
      riskBadge.className = `badge ${
        riskText.toLowerCase() === "low"
          ? "badge-low"
          : riskText.toLowerCase() === "moderate"
          ? "badge-moderate"
          : "badge-high"
      }`;
    }

    const pills = document.querySelectorAll(".explain-day-pill");
    pills.forEach((p) => {
      const d = parseInt(p.getAttribute("data-day") || "6", 10);
      p.classList.toggle("active", d === leadDay);
    });
  } catch (err) {
    console.error("Error loading explainability diagnostics:", err);
    const summaryEl = document.getElementById("explainSummaryText");
    const recEl = document.getElementById("explainRecText");
    const confValEl = document.getElementById("explainGaugeValue");
    const bustValEl = document.getElementById("explainBustVal");
    if (summaryEl) summaryEl.textContent = "Explanation unavailable because the reliability model has not produced an explanation for this location.";
    if (recEl) recEl.textContent = "Risk-aware guidance is unavailable for this forecast window.";
    if (confValEl) confValEl.textContent = "Data unavailable";
    if (bustValEl) bustValEl.textContent = "Data unavailable";
    renderShapChart([]);
    const riskBadge = document.getElementById("explainRiskLevelBadge");
    if (riskBadge) {
      riskBadge.textContent = 'DATA UNAVAILABLE';
      riskBadge.className = 'badge badge-neutral';
    }
  }
}

function renderGaugeAndBustIndicators(confidence, bustProb, risk) {
  const confValEl = document.getElementById("explainGaugeValue");
  const bustValEl = document.getElementById("explainBustVal");
  const gaugeSvgPath = document.getElementById("explainGaugePath");

  const safeConfidence = Number.isFinite(Number(confidence)) ? Number(confidence) : 0;
  const safeBust = Number.isFinite(Number(bustProb)) ? Number(bustProb) : 0;

  if (confValEl) confValEl.textContent = Number.isFinite(Number(confidence)) ? `${safeConfidence}%` : "Data unavailable";
  if (bustValEl) bustValEl.textContent = Number.isFinite(Number(bustProb)) ? `${safeBust}%` : "Data unavailable";

  if (gaugeSvgPath) {
    const perimeter = 282.7;
    const normalized = Number.isFinite(Number(confidence)) ? Math.max(0, Math.min(100, safeConfidence)) : 0;
    const offset = perimeter - (normalized / 100) * perimeter;
    gaugeSvgPath.style.strokeDashoffset = offset;

    const strokeColor =
      normalized >= 75 ? "#10b981" : normalized >= 55 ? "#f59e0b" : "#ef4444";
    gaugeSvgPath.style.stroke = strokeColor;
  }
}

function renderShapChart(features) {
  const canvas = document.getElementById("shapHorizontalBarChart");
  if (!canvas) return;

  if (!Array.isArray(features) || features.length === 0) {
    const ctx = canvas.getContext("2d");
    if (shapChartInstance) shapChartInstance.destroy();
    shapChartInstance = new Chart(ctx, {
      type: "bar",
      data: { labels: ["Unavailable"], datasets: [{ data: [0], backgroundColor: ["rgba(148, 163, 184, 0.35)"] }] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } }
      }
    });
    return;
  }

  const ctx = canvas.getContext("2d");
  if (shapChartInstance) {
    shapChartInstance.destroy();
  }

  const labels = features.map((f) => f.feature);
  const impacts = features.map((f) => (f.direction === "Negative" ? -f.impact : f.impact));
  const colors = features.map((f) =>
    f.direction === "Negative" ? "rgba(239, 68, 68, 0.85)" : "rgba(16, 185, 129, 0.85)"
  );
  const borderColors = features.map((f) =>
    f.direction === "Negative" ? "#ef4444" : "#10b981"
  );

  shapChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "SHAP Uncertainty Weight",
          data: impacts,
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: 1.5,
          borderRadius: 6,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = Math.abs(ctx.raw);
              const dir = ctx.raw < 0 ? "Negative Influence (Increases Bust Risk)" : "Positive Influence (Increases Confidence)";
              return `${dir}: ${(val * 100).toFixed(0)}% weight`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255, 255, 255, 0.08)" },
          ticks: {
            color: "#94a3b8",
            callback: (v) => `${Math.abs(v * 100).toFixed(0)}%`,
          },
        },
        y: {
          grid: { display: false },
          ticks: { color: "#f8fafc", font: { family: "'Inter', sans-serif", size: 12, weight: 600 } },
        },
      },
    },
  });
}

function setupExplainabilityControls() {
  const pills = document.querySelectorAll(".explain-day-pill");
  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const d = parseInt(pill.getAttribute("data-day") || "6", 10);
      const loc = window.currentSelectedLocation || "Vijayawada";
      loadExplainabilityData(loc, d);
    });
  });
}

document.addEventListener("DOMContentLoaded", setupExplainabilityControls);

// Global accessor
window.loadExplainabilityData = loadExplainabilityData;
