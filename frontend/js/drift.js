/**
 * WeatherTrust AI — Forecast Drift Monitor Controller (Phase 11)
 * Manages run-to-run forecast comparison, stability calculations, and cycle visualization.
 */

const DriftUI = {
  driftChartInstance: null,
  activeDriftController: null,

  async fetchDriftHistory(locationName = "Krishna District", lat = null, lon = null) {
    if (this.activeDriftController) {
      this.activeDriftController.abort();
    }
    const controller = new AbortController();
    this.activeDriftController = controller;
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      let url = `/api/drift/history?location=${encodeURIComponent(locationName)}`;
      if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
        url += `&lat=${lat}&lon=${lon}`;
      }
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!resp.ok) throw new Error(`Drift API returned status ${resp.status}`);
      return await resp.json();
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') return null;
      console.warn("Failed to fetch drift history:", e);
      return null;
    } finally {
      if (this.activeDriftController === controller) {
        this.activeDriftController = null;
      }
    }
  },

  renderDriftSection(data) {
    const cycles = (data && Array.isArray(data.cycles)) ? data.cycles : [];
    const locationName = (data && data.location) || window.currentSelectedLocation || "Selected Location";
    const stabilityBadge = document.getElementById('driftStabilityBadge');
    const tableBody = document.getElementById('driftTableBody');
    const driftTargetDate = document.getElementById('driftTargetDate');
    const driftInitialRun = document.getElementById('driftInitialRun');
    const driftInitialSubtext = document.getElementById('driftInitialSubtext');
    const driftLatestRun = document.getElementById('driftLatestRun');
    const driftLatestSubtext = document.getElementById('driftLatestSubtext');
    const driftLatestCard = document.getElementById('driftLatestCard');
    const driftNetCard = document.getElementById('driftNetCard');
    const driftNetChange = document.getElementById('driftNetChange');
    const driftNetSubtext = document.getElementById('driftNetSubtext');

    if (driftTargetDate) {
      driftTargetDate.textContent = "Day 6 Outlook";
    }

    if (cycles.length >= 2) {
      const initialRun = cycles[0];
      const latestRun = cycles[cycles.length - 1];
      const initialRain = Number(initialRun.predicted_rain_mm) || 0;
      const latestRain = Number(latestRun.predicted_rain_mm) || 0;
      const netDelta = latestRain - initialRain;
      const absDelta = Math.abs(netDelta);

      let stabilityTier = "HIGH";
      let stabilityColor = "#10b981";
      let badgeText = `🟢 HIGH STABILITY (${netDelta >= 0 ? '+' : ''}${netDelta.toFixed(1)} mm)`;

      if (absDelta > 25.0) {
        stabilityTier = "LOW";
        stabilityColor = "#ef4444";
        badgeText = `🔴 LOW STABILITY (${netDelta >= 0 ? '+' : ''}${netDelta.toFixed(1)} mm)`;
      } else if (absDelta > 10.0) {
        stabilityTier = "MODERATE";
        stabilityColor = "#f59e0b";
        badgeText = `🟡 MODERATE STABILITY (${netDelta >= 0 ? '+' : ''}${netDelta.toFixed(1)} mm)`;
      }

      if (stabilityBadge) {
        stabilityBadge.textContent = badgeText;
        stabilityBadge.style.color = stabilityColor;
      }

      if (driftInitialRun) {
        driftInitialRun.textContent = `${initialRain.toFixed(1)} mm`;
        driftInitialRun.style.color = '#94a3b8';
      }
      if (driftInitialSubtext) {
        driftInitialSubtext.textContent = initialRun.run_name || 'Initial baseline (00Z)';
      }

      if (driftLatestRun) {
        driftLatestRun.textContent = `${latestRain.toFixed(1)} mm`;
        driftLatestRun.style.color = stabilityColor;
      }
      if (driftLatestSubtext) {
        driftLatestSubtext.textContent = latestRun.run_name || 'Latest update (18Z)';
        driftLatestSubtext.style.color = stabilityColor;
      }
      if (driftLatestCard) {
        driftLatestCard.style.borderColor = `${stabilityColor}66`;
      }

      if (driftNetChange) {
        driftNetChange.textContent = `${netDelta >= 0 ? '+' : ''}${netDelta.toFixed(1)} mm`;
        driftNetChange.style.color = stabilityColor;
      }
      if (driftNetSubtext) {
        driftNetSubtext.textContent = stabilityTier === "LOW"
          ? "High Volatility Escalation"
          : stabilityTier === "MODERATE"
          ? "Moderate Synoptic Shift"
          : "Consistent NWP Evolution";
        driftNetSubtext.style.color = stabilityColor;
      }
      if (driftNetCard) {
        driftNetCard.style.borderColor = `${stabilityColor}66`;
      }

      // Render Table Rows
      if (tableBody) {
        tableBody.innerHTML = cycles.map((cycle, idx) => {
          const prevRain = idx > 0 ? (Number(cycles[idx - 1].predicted_rain_mm) || 0) : (Number(cycle.predicted_rain_mm) || 0);
          const currentRain = Number(cycle.predicted_rain_mm) || 0;
          const delta = currentRain - prevRain;
          const shiftStr = idx === 0 ? "Baseline (00Z)" : `${delta >= 0 ? '+' : ''}${delta.toFixed(1)} mm`;
          const rowStability = Math.abs(delta) > 15 ? 'LOW' : Math.abs(delta) > 5 ? 'MODERATE' : 'HIGH';
          const rowColor = rowStability === 'LOW' ? '#ef4444' : rowStability === 'MODERATE' ? '#f59e0b' : '#10b981';

          return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.06);">
              <td style="padding: 12px 14px; color: #f8fafc; font-weight: 600;">${cycle.run_name || `Cycle ${idx + 1}`}</td>
              <td style="padding: 12px 14px; color: #94a3b8;">${cycle.cycle_time || '--'}</td>
              <td style="padding: 12px 14px; color: #f8fafc; font-weight: 700;">${currentRain.toFixed(1)} mm</td>
              <td style="padding: 12px 14px; color: ${idx === 0 ? '#94a3b8' : delta > 0 ? '#ef4444' : '#10b981'}; font-weight: 600;">${shiftStr}</td>
              <td style="padding: 12px 14px;">
                <span class="badge" style="background: ${rowColor}1a; color: ${rowColor}; border: 1px solid ${rowColor}40; font-weight: 700; font-size: 0.72rem; padding: 3px 8px; border-radius: 4px;">
                  ${rowStability}
                </span>
              </td>
            </tr>
          `;
        }).join('');
      }

      this.renderDriftChart(cycles, stabilityColor, locationName);

    } else {
      // Data unavailable or single cycle baseline
      if (stabilityBadge) {
        stabilityBadge.textContent = '⚠️ DATA UNAVAILABLE';
        stabilityBadge.style.color = '#f59e0b';
      }

      const baselineVal = cycles.length === 1 ? (Number(cycles[0].predicted_rain_mm) || 0) : null;

      if (driftInitialRun) {
        driftInitialRun.textContent = baselineVal !== null ? `${baselineVal.toFixed(1)} mm` : '--';
        driftInitialRun.style.color = '#94a3b8';
      }
      if (driftInitialSubtext) {
        driftInitialSubtext.textContent = 'Baseline Cycle';
      }

      if (driftLatestRun) {
        driftLatestRun.textContent = baselineVal !== null ? `${baselineVal.toFixed(1)} mm` : '--';
        driftLatestRun.style.color = '#94a3b8';
      }
      if (driftLatestSubtext) {
        driftLatestSubtext.textContent = 'Awaiting Next Run';
        driftLatestSubtext.style.color = '#94a3b8';
      }
      if (driftLatestCard) {
        driftLatestCard.style.borderColor = 'rgba(255,255,255,0.08)';
      }

      if (driftNetChange) {
        driftNetChange.textContent = '0.0 mm';
        driftNetChange.style.color = '#94a3b8';
      }
      if (driftNetSubtext) {
        driftNetSubtext.textContent = 'Collecting cycle progression';
        driftNetSubtext.style.color = '#94a3b8';
      }
      if (driftNetCard) {
        driftNetCard.style.borderColor = 'rgba(255,255,255,0.08)';
      }

      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 36px 16px; color: #94a3b8;">
              <div style="font-size: 1.6rem; margin-bottom: 8px;">⏱️</div>
              <div style="font-weight: 600; color: #f8fafc; font-size: 0.95rem; margin-bottom: 4px;">
                No consecutive forecast-run data is available for ${locationName} yet.
              </div>
              <div style="font-size: 0.8rem; color: #64748b; max-width: 480px; margin: 0 auto 12px auto;">
                Successive numerical weather prediction (NWP) model update cycles are required to compute run-to-run forecast shift and stability tiers.
              </div>
              <button onclick="DriftUI.reloadDrift('${locationName}')" class="btn btn-secondary" style="font-size: 0.78rem; padding: 6px 14px; background: rgba(56, 189, 248, 0.12); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 4px; cursor: pointer;">
                🔄 Refresh Model Cycles
              </button>
            </td>
          </tr>
        `;
      }

      this.renderDriftChart(cycles, "#94a3b8", locationName);
    }
  },

  async reloadDrift(locationName) {
    const loc = locationName || window.currentSelectedLocation || "Krishna District";
    const data = await this.fetchDriftHistory(loc);
    this.renderDriftSection(data);
  },

  renderDriftChart(cycles, accentColor = "#38bdf8", locationName = "Selected Location") {
    const ctx = document.getElementById('driftTrendChart');
    const emptyState = document.getElementById('driftEmptyState');
    const emptyTitle = document.getElementById('driftEmptyTitle');
    if (!ctx) return;

    if (this.driftChartInstance) {
      try {
        this.driftChartInstance.destroy();
      } catch (e) {
        console.warn("Chart destroy warning:", e);
      }
      this.driftChartInstance = null;
    }

    if (!cycles || cycles.length < 2) {
      ctx.style.display = 'none';
      if (emptyState) {
        emptyState.style.display = 'block';
        if (emptyTitle) {
          emptyTitle.textContent = `No consecutive forecast snapshots are available for ${locationName} yet.`;
        }
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    ctx.style.display = 'block';

    const labels = cycles.map(c => c.run_name || 'NWP Run');
    const rainData = cycles.map(c => Number(c.predicted_rain_mm) || 0);

    this.driftChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Day-6 Forecasted Rainfall (mm)',
          data: rainData,
          borderColor: accentColor,
          backgroundColor: `${accentColor}1f`,
          borderWidth: 3,
          fill: true,
          tension: 0.3,
          pointRadius: 6,
          pointBackgroundColor: accentColor,
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
            title: { display: true, text: 'Predicted Rain (mm)', color: accentColor },
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255,255,255,0.05)' }
          }
        }
      }
    });
  }
};
