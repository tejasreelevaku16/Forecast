/**
 * WeatherTrust AI — Forecast Uncertainty Engine (SIH Feature 3)
 * Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
 * 
 * Chart.js dual-axis graph with Confidence (Green), Uncertainty (Red), and Drift (Blue dashed),
 * KPI cards, and dynamic meteorological insight synthesis.
 */

let uncertaintyChartInstance = null;
let activeUncertaintyController = null;

async function loadUncertaintyView(location = "Vijayawada") {
  const locName = location || window.currentSelectedLocation || "Selected Location";
  const locHeader = document.getElementById("uncLocationHeader");
  if (locHeader) locHeader.textContent = locName;

  if (activeUncertaintyController) {
    activeUncertaintyController.abort();
  }
  const controller = new AbortController();
  activeUncertaintyController = controller;

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {
    let url = `/api/reliability/uncertainty?location=${encodeURIComponent(locName)}`;
    if (window.currentSelectedLat && window.currentSelectedLon) {
      url += `&lat=${window.currentSelectedLat}&lon=${window.currentSelectedLon}`;
    }
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();

    // 1. Update KPI cards
    updateUncertaintyKPIs(data.kpis);

    // 2. Render dual-axis graph
    renderUncertaintyChart(data);

    // 3. Update automated insight
    const insightEl = document.getElementById("uncInsightBannerText");
    if (insightEl) {
      insightEl.textContent = data.insight;
    }
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return;
    }
    console.warn("Error loading uncertainty data:", err);
    const insightEl = document.getElementById("uncInsightBannerText");
    if (insightEl) {
      insightEl.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <span>Uncertainty profile data is currently unavailable for ${locName}.</span>
          <button onclick="loadUncertaintyView('${locName}')" class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 12px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 4px; cursor: pointer;">
            🔄 Retry
          </button>
        </div>
      `;
    }
  } finally {
    if (activeUncertaintyController === controller) {
      activeUncertaintyController = null;
    }
  }
}

function updateUncertaintyKPIs(kpis) {
  if (!kpis) return;

  const highestConfEl = document.getElementById("uncKpiHighestConf");
  const lowestConfEl = document.getElementById("uncKpiLowestConf");
  const maxUncEl = document.getElementById("uncKpiMaxUnc");
  const avgConfEl = document.getElementById("uncKpiAvgConf");
  const avgDriftEl = document.getElementById("uncKpiAvgDrift");

  if (highestConfEl) highestConfEl.textContent = `Day ${kpis.highest_confidence_day}`;
  if (lowestConfEl) lowestConfEl.textContent = `Day ${kpis.lowest_confidence_day}`;
  if (maxUncEl) maxUncEl.textContent = `Day ${kpis.max_uncertainty_day}`;
  if (avgConfEl) avgConfEl.textContent = `${kpis.avg_confidence}%`;
  if (avgDriftEl) avgDriftEl.textContent = `+${kpis.avg_drift} mm`;
}

function renderUncertaintyChart(data) {
  const canvas = document.getElementById("uncertaintyDualAxisChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  if (uncertaintyChartInstance) {
    uncertaintyChartInstance.destroy();
  }

  const labels = data.days.map((d) => `Day ${d}`);

  uncertaintyChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Forecast Confidence (%)",
          data: data.confidence,
          borderColor: "#10b981", // Green Line
          backgroundColor: "rgba(16, 185, 129, 0.12)",
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: "#10b981",
          pointRadius: 5,
          pointHoverRadius: 7,
          yAxisID: "yPct",
        },
        {
          label: "Forecast Uncertainty (%)",
          data: data.uncertainty,
          borderColor: "#ef4444", // Red Line
          backgroundColor: "rgba(239, 68, 68, 0.08)",
          borderWidth: 3,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: "#ef4444",
          pointRadius: 5,
          pointHoverRadius: 7,
          yAxisID: "yPct",
        },
        {
          label: "Forecast Drift (mm)",
          data: data.drift,
          borderColor: "#38bdf8", // Blue Dashed Line
          borderWidth: 2.5,
          borderDash: [6, 6],
          fill: false,
          tension: 0.3,
          pointBackgroundColor: "#38bdf8",
          pointRadius: 4,
          pointHoverRadius: 6,
          yAxisID: "yDrift",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: {
            color: "#94a3b8",
            font: { family: "'Inter', sans-serif", size: 12, weight: 600 },
            usePointStyle: true,
            padding: 15,
          },
        },
        tooltip: {
          backgroundColor: "#18233c",
          titleColor: "#f8fafc",
          bodyColor: "#94a3b8",
          borderColor: "rgba(255, 255, 255, 0.1)",
          borderWidth: 1,
          padding: 12,
          boxPadding: 6,
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#94a3b8", font: { family: "'Inter', sans-serif", size: 12 } },
        },
        yPct: {
          type: "linear",
          position: "left",
          min: 0,
          max: 100,
          title: {
            display: true,
            text: "Probability / Confidence Scale (%)",
            color: "#94a3b8",
            font: { size: 12, weight: 600 },
          },
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: {
            color: "#94a3b8",
            callback: (v) => `${v}%`,
          },
        },
        yDrift: {
          type: "linear",
          position: "right",
          min: 0,
          title: {
            display: true,
            text: "Model Run Drift (mm)",
            color: "#38bdf8",
            font: { size: 12, weight: 600 },
          },
          grid: { drawOnChartArea: false },
          ticks: {
            color: "#38bdf8",
            callback: (v) => `${v} mm`,
          },
        },
      },
    },
  });
}

// Global accessor
window.loadUncertaintyView = loadUncertaintyView;
