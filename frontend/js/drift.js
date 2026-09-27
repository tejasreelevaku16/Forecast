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
    if (!data || !data.cycles) return;

    const container = document.getElementById('driftCyclesContainer');
    if (!container) return;

    container.innerHTML = '';
    const cycles = data.cycles;

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

    // Render Drift Timeline Chart
    this.renderDriftChart(cycles);
  },

  renderDriftChart(cycles) {
    const ctx = document.getElementById('driftTrendChart');
    if (!ctx) return;

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
