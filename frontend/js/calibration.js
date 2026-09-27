/**
 * WeatherTrust AI — Model Reliability & Probability Calibration (SIH Feature 4)
 * Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
 * 
 * Scientific Evaluator Dashboard rendering:
 * 1. KPI Metric Cards (Accuracy, Precision, Recall, F1, ROC-AUC, Brier Score)
 * 2. Calibration / Reliability Curve (Predicted Prob vs Observed Frequency)
 * 3. ROC Curve (FPR vs TPR)
 * 4. Confusion Matrix Heatmap
 * 5. Automated Scientific Interpretation
 */

let calibrationChartInstance = null;
let rocChartInstance = null;

async function loadCalibrationView() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6500);

  try {
    const resp = await fetch("/api/judge/calibration", { signal: controller.signal });
    clearTimeout(timeoutId);
    if (!resp.ok) throw new Error("Failed to load calibration metrics");
    const data = await resp.json();

    // 1. Update KPI cards
    updateCalibrationKPIs(data);

    // 2. Render Calibration / Reliability Curve
    renderReliabilityCurveChart(data.reliability_curve);

    // 3. Render ROC Curve
    renderROCCurveChart(data.roc_curve, data.roc_auc);

    // 4. Render Confusion Matrix Heatmap
    renderConfusionMatrix(data.confusion_matrix);

    // 5. Automated scientific interpretation text
    const interpEl = document.getElementById("calibrationInterpretationText");
    if (interpEl) {
      interpEl.textContent = data.interpretation;
    }

    // Model & training tags
    const modelTag = document.getElementById("calModelNameTag");
    if (modelTag) modelTag.textContent = data.model_name || "Calibrated Random Forest";
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn("Error loading calibration dashboard:", err);
    const interpEl = document.getElementById("calibrationInterpretationText");
    if (interpEl) {
      interpEl.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
          <span>Model calibration metrics currently unavailable.</span>
          <button onclick="loadCalibrationView()" class="btn btn-secondary" style="font-size: 0.75rem; padding: 4px 12px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 4px; cursor: pointer;">
            🔄 Retry Calibration Metrics
          </button>
        </div>
      `;
    }
  }
}

function updateCalibrationKPIs(data) {
  const accEl = document.getElementById("calKpiAccuracy");
  const precEl = document.getElementById("calKpiPrecision");
  const recEl = document.getElementById("calKpiRecall");
  const f1El = document.getElementById("calKpiF1");
  const aucEl = document.getElementById("calKpiAuc");
  const brierEl = document.getElementById("calKpiBrier");

  if (accEl) accEl.textContent = `${(data.accuracy * 100).toFixed(1)}%`;
  if (precEl) precEl.textContent = `${(data.precision * 100).toFixed(1)}%`;
  if (recEl) recEl.textContent = `${(data.recall * 100).toFixed(1)}%`;
  if (f1El) f1El.textContent = `${data.f1.toFixed(3)}`;
  if (aucEl) aucEl.textContent = `${data.roc_auc.toFixed(3)}`;
  if (brierEl) brierEl.textContent = `${data.brier_score.toFixed(3)}`;
}

function renderReliabilityCurveChart(curveData) {
  const canvas = document.getElementById("calibrationCurveChart");
  if (!canvas || !curveData || !curveData.prob_pred) return;

  const ctx = canvas.getContext("2d");
  if (calibrationChartInstance) {
    calibrationChartInstance.destroy();
  }

  // Build scatter points
  const points = curveData.prob_pred.map((pred, i) => ({
    x: pred,
    y: curveData.prob_true[i] !== undefined ? curveData.prob_true[i] : pred,
  }));

  calibrationChartInstance = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Ideal 45° Calibration",
          data: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
          ],
          type: "line",
          borderColor: "rgba(148, 163, 184, 0.5)",
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        },
        {
          label: "Calibrated Model (5-Fold Sigmoid)",
          data: points,
          borderColor: "#38bdf8",
          backgroundColor: "#38bdf8",
          type: "line",
          borderWidth: 2.5,
          tension: 0.15,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: "#38bdf8",
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: { color: "#94a3b8", font: { size: 12 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `Predicted: ${(ctx.raw.x * 100).toFixed(1)}% | Observed: ${(ctx.raw.y * 100).toFixed(1)}%`,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: 1,
          title: { display: true, text: "Mean Predicted Bust Probability", color: "#94a3b8" },
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#94a3b8", callback: (v) => `${(v * 100).toFixed(0)}%` },
        },
        y: {
          type: "linear",
          min: 0,
          max: 1,
          title: { display: true, text: "Observed Bust Fraction", color: "#94a3b8" },
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#94a3b8", callback: (v) => `${(v * 100).toFixed(0)}%` },
        },
      },
    },
  });
}

function renderROCCurveChart(rocData, aucVal) {
  const canvas = document.getElementById("rocCurveChart");
  if (!canvas || !rocData || !rocData.fpr) return;

  const ctx = canvas.getContext("2d");
  if (rocChartInstance) {
    rocChartInstance.destroy();
  }

  const points = rocData.fpr.map((fpr, i) => ({
    x: fpr,
    y: rocData.tpr[i],
  }));

  rocChartInstance = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Random Chance (AUC = 0.50)",
          data: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
          ],
          type: "line",
          borderColor: "rgba(148, 163, 184, 0.4)",
          borderDash: [5, 5],
          borderWidth: 2,
          pointRadius: 0,
          fill: false,
        },
        {
          label: `Calibrated Ensemble (AUC = ${aucVal.toFixed(3)})`,
          data: points,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.12)",
          type: "line",
          borderWidth: 2.5,
          fill: true,
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "#10b981",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
          labels: { color: "#94a3b8", font: { size: 12 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `FPR: ${(ctx.raw.x * 100).toFixed(1)}% | TPR: ${(ctx.raw.y * 100).toFixed(1)}%`,
          },
        },
      },
      scales: {
        x: {
          type: "linear",
          min: 0,
          max: 1,
          title: { display: true, text: "False Positive Rate (1 - Specificity)", color: "#94a3b8" },
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#94a3b8", callback: (v) => `${(v * 100).toFixed(0)}%` },
        },
        y: {
          type: "linear",
          min: 0,
          max: 1,
          title: { display: true, text: "True Positive Rate (Sensitivity / Recall)", color: "#94a3b8" },
          grid: { color: "rgba(255, 255, 255, 0.05)" },
          ticks: { color: "#94a3b8", callback: (v) => `${(v * 100).toFixed(0)}%` },
        },
      },
    },
  });
}

function renderConfusionMatrix(matrix) {
  if (!matrix || matrix.length < 2) return;

  const tn = matrix[0][0];
  const fp = matrix[0][1];
  const fn = matrix[1][0];
  const tp = matrix[1][1];

  const tnEl = document.getElementById("cmValTN");
  const fpEl = document.getElementById("cmValFP");
  const fnEl = document.getElementById("cmValFN");
  const tpEl = document.getElementById("cmValTP");

  if (tnEl) tnEl.textContent = tn;
  if (fpEl) fpEl.textContent = fp;
  if (fnEl) fnEl.textContent = fn;
  if (tpEl) tpEl.textContent = tp;
}

// Global accessor
window.loadCalibrationView = loadCalibrationView;
