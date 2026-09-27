/**
 * WeatherTrust AI — SIH Technical / Judge Dashboard Controller (Phase 15)
 * Fetches and renders machine learning validation metrics, confusion matrices,
 * feature weights, and baseline comparisons for evaluators.
 */

const JudgeUI = {
  async fetchMetrics() {
    try {
      const resp = await fetch('/api/judge/metrics');
      if (!resp.ok) throw new Error("Judge metrics API error");
      return await resp.json();
    } catch (e) {
      console.error("Failed to load judge metrics:", e);
      return null;
    }
  },

  renderJudgeDashboard(data) {
    if (!data || data.status !== "trained_model_active") return;

    // Header info
    document.getElementById('judgeModelName').textContent = data.selected_model;
    document.getElementById('judgeCalibration').textContent = data.calibration_technique;
    document.getElementById('judgeSplitInfo').textContent = data.training_strategy;

    const m = data.evaluation_metrics;
    document.getElementById('metricRocAuc').textContent = m.roc_auc.toFixed(4);
    document.getElementById('metricAccuracy').textContent = `${(m.accuracy * 100).toFixed(2)}%`;
    document.getElementById('metricPrecision').textContent = `${(m.precision * 100).toFixed(2)}%`;
    document.getElementById('metricRecall').textContent = `${(m.recall * 100).toFixed(2)}%`;
    document.getElementById('metricF1').textContent = m.f1_score.toFixed(4);
    document.getElementById('metricBrier').textContent = m.brier_score.toFixed(4);

    // Confusion Matrix
    const cm = m.confusion_matrix;
    document.getElementById('cmTN').textContent = cm[0][0];
    document.getElementById('cmFP').textContent = cm[0][1];
    document.getElementById('cmFN').textContent = cm[1][0];
    document.getElementById('cmTP').textContent = cm[1][1];

    // Feature Importances
    const featContainer = document.getElementById('judgeFeatureWeights');
    if (featContainer && data.feature_importances) {
      featContainer.innerHTML = '';
      const entries = Object.entries(data.feature_importances).sort((a, b) => b[1] - a[1]);
      entries.forEach(([feat, weight]) => {
        const row = document.createElement('div');
        row.style.marginBottom = '8px';
        row.innerHTML = `
          <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:2px;">
            <span><code>${feat}</code></span>
            <strong>${weight.toFixed(4)}</strong>
          </div>
          <div style="height:6px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
            <div style="height:100%; width:${Math.min(100, weight * 100 * 2.5)}%; background:#38bdf8;"></div>
          </div>
        `;
        featContainer.appendChild(row);
      });
    }

    // Model Comparison Table
    const compTableBody = document.getElementById('judgeComparisonBody');
    if (compTableBody && data.all_model_comparisons) {
      compTableBody.innerHTML = '';
      Object.entries(data.all_model_comparisons).forEach(([mName, met]) => {
        const tr = document.createElement('tr');
        const isBest = (mName === data.selected_model);
        tr.style.backgroundColor = isBest ? 'rgba(56, 189, 248, 0.08)' : 'transparent';
        tr.innerHTML = `
          <td style="padding:8px 12px; font-weight:600; color:${isBest ? '#38bdf8' : '#f8fafc'};">${mName} ${isBest ? '⭐' : ''}</td>
          <td style="padding:8px 12px;">${(met.accuracy * 100).toFixed(1)}%</td>
          <td style="padding:8px 12px;">${(met.precision * 100).toFixed(1)}%</td>
          <td style="padding:8px 12px;">${(met.recall * 100).toFixed(1)}%</td>
          <td style="padding:8px 12px;">${met.f1_score.toFixed(4)}</td>
          <td style="padding:8px 12px; font-weight:700; color:#38bdf8;">${met.roc_auc.toFixed(4)}</td>
          <td style="padding:8px 12px;">${met.brier_score.toFixed(4)}</td>
        `;
        compTableBody.appendChild(tr);
      });
    }
  }
};
