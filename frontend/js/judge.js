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
    const judgeSection = document.getElementById('judgeSection');
    if (!judgeSection) return;

    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    // Header info (safely set if present)
    setEl('judgeModelName', data.selected_model);
    setEl('judgeCalibration', data.calibration_technique);
    setEl('judgeSplitInfo', data.training_strategy);

    const m = data.evaluation_metrics;
    if (m) {
      if (m.accuracy !== undefined) {
        setEl('judgeAccuracy', `${(m.accuracy * 100).toFixed(2)}%`);
        setEl('metricAccuracy', `${(m.accuracy * 100).toFixed(2)}%`);
      }
      if (m.precision !== undefined) {
        setEl('judgePrecision', `${(m.precision * 100).toFixed(2)}%`);
        setEl('metricPrecision', `${(m.precision * 100).toFixed(2)}%`);
      }
      if (m.recall !== undefined) {
        setEl('judgeRecall', `${(m.recall * 100).toFixed(2)}%`);
        setEl('metricRecall', `${(m.recall * 100).toFixed(2)}%`);
      }
      if (m.f1_score !== undefined) {
        setEl('judgeF1', m.f1_score.toFixed(4));
        setEl('metricF1', m.f1_score.toFixed(4));
      }
      if (m.roc_auc !== undefined) {
        setEl('judgeRocAuc', m.roc_auc.toFixed(4));
        setEl('metricRocAuc', m.roc_auc.toFixed(4));
      }
      if (m.brier_score !== undefined) {
        setEl('judgeBrier', m.brier_score.toFixed(4));
        setEl('metricBrier', m.brier_score.toFixed(4));
      }

      // Confusion Matrix
      const cm = m.confusion_matrix;
      if (cm && cm.length >= 2) {
        setEl('cmTN', cm[0][0]);
        setEl('cmFP', cm[0][1]);
        setEl('cmFN', cm[1][0]);
        setEl('cmTP', cm[1][1]);
      }
    }

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
