/**
 * WeatherTrust AI — Forecast Drift Monitor Controller (Phase 11)
 * Manages run-to-run forecast comparison, stability calculations, and cycle visualization.
 */

const DriftUI = {
  driftChartInstance: null,

  async fetchDriftHistory(locationName = "Krishna District", lat = null, lon = null) {
    try {
      let url = `/api/drift/history?location=${encodeURIComponent(locationName)}`;
      if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
        url += `&lat=${lat}&lon=${lon}`;
      }
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("Drift API error");
      return await resp.json();
    } catch (e) {
      console.error("Failed to fetch drift history:", e);
      return null;
    }
  },

  renderDriftSection(data) {
    const cycles = data && Array.isArray(data.cycles) ? data.cycles : [];
    const stabilityBadge = document.getElementById('driftStabilityBadge');
    const tableBody = document.getElementById('driftTableBody');
    const driftNetChange = document.getElementById('driftNetChange');

    if (stabilityBadge) {
      stabilityBadge.textContent = cycles.length ? `🔴 LOW STABILITY (+${(cycles.at(-1)?.predicted_rain_mm || 0) - (cycles[0]?.predicted_rain_mm || 0)} mm)` : '⚠️ DATA UNAVAILABLE';
    }
    if (driftNetChange) {
      driftNetChange.textContent = cycles.length ? `+${((((cycles.at(-1)?.predicted_rain_mm || 0) - (cycles[0]?.predicted_rain_mm || 0)))).toFixed(1)} mm` : 'No data';
    }

    if (!cycles.length) {
      const section = document.getElementById('driftSection');
      if (section) {
        section.innerHTML = `
          <h4 style="margin-bottom: 12px; font-size: 0.95rem;">Model Run Cycle Log</h4>
          <div class="alert-box alert-warning">
            <strong>Forecast Drift</strong><br>
            No consecutive forecast-run data is available for this location yet.<br>
            Collecting the next forecast cycle...
          </div>
        `;
      }
      if (tableBody) tableBody.innerHTML = '';
      this.renderDriftChart([]);
      return;
    }

    const container = document.getElementById('driftCyclesContainer');
    if (container) {
      container.innerHTML = '';
      cycles.forEach((cycle, idx) => {
        const isLatest = (idx === cycles.length - 1);
        const prevRain = (idx > 0) ? cycles[idx - 1].predicted_rain_mm : cycle.predicted_rain_mm;
        const delta = cycle.predicted_rain_mm - prevRain;
        const deltaStr = idx > 0 ? (delta >= 0 ? `+${delta.toFixed(1)} mm` : `${delta.toFixed(1)} mm`) : "Baseline";

        const card = document.createElement('div');
        card.className = `glass-card drift-cycle-card ${isLatest ? 'cycle-latest' : ''}`;
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-weight:700; font-size:0.85rem; color:${isLatest ? '#38bdf8' : '#f8fafc'};">${cycle.run_name}</span>
            <span style="font-size:0.75rem; color:#94a3b8;">${cycle.cycle_time}</span>
          </div>
          <div style="font-size:1.8rem; font-weight:800; color:#fff; line-height:1;">
            ${cycle.predicted_rain_mm} <span style="font-size:1rem; font-weight:400; color:#38bdf8;">mm</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-top:8px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.08);">
            <span style="color:#94a3b8;">Run Delta:</span>
            <span style="font-weight:700; color:${delta > 15 ? '#ef4444' : delta > 5 ? '#f59e0b' : '#10b981'};">${deltaStr}</span>
          </div>
        `;
        container.appendChild(card);
      });
    }

    if (tableBody) {
      tableBody.innerHTML = cycles.map((cycle, idx) => {
        const prevRain = idx > 0 ? cycles[idx - 1].predicted_rain_mm : cycle.predicted_rain_mm;
        const delta = cycle.predicted_rain_mm - prevRain;
        const stability = delta > 15 ? 'LOW' : delta > 5 ? 'MODERATE' : 'HIGH';
        return `
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
            <td style="padding: 10px 14px; color: #f8fafc;">${cycle.run_name}</td>
            <td style="padding: 10px 14px; color: #94a3b8;">${cycle.cycle_time}</td>
            <td style="padding: 10px 14px; color: #f8fafc; font-weight: 700;">${cycle.predicted_rain_mm} mm</td>
            <td style="padding: 10px 14px; color: ${delta > 0 ? '#ef4444' : '#10b981'};">${delta >= 0 ? '+' : ''}${delta.toFixed(1)} mm</td>
            <td style="padding: 10px 14px; color: ${stability === 'LOW' ? '#ef4444' : stability === 'MODERATE' ? '#f59e0b' : '#10b981'}; font-weight: 700;">${stability}</td>
          </tr>
        `;
      }).join('');
    }

    this.renderDriftChart(cycles);
  },

  renderDriftChart(cycles) {
    const ctx = document.getElementById('driftTrendChart');
    if (!ctx) return;

    if (!cycles || cycles.length === 0) {
      if (this.driftChartInstance) this.driftChartInstance.destroy();
      const chartWrap = ctx.parentElement;
      if (chartWrap) {
        chartWrap.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:center; height:100%; color:#94a3b8; text-align:center; padding:24px;">
            Forecast drift chart unavailable. No consecutive model-run data is available yet.
          </div>
        `;
      }
      return;
    }

    const labels = cycles.map(c => c.run_name);
    const rainData = cycles.map(c => c.predicted_rain_mm);

    if (this.driftChartInstance) {
      this.driftChartInstance.destroy();
    }

    this.driftChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Day-6 Forecasted Rainfall (mm)',
          data: rainData,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          borderWidth: 3,
          fill: true,
          tension: 0.3,
          pointRadius: 6,
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }
          }
        },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
          y: {
            title: { display: true, text: 'Predicted Rain (mm)', color: '#ef4444' },
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        }
      }
    });
  }
};
