/**
 * WeatherTrust AI — District Reliability Passport Controller (SIH Differentiator 4)
 * Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
 */

const DistrictPassport = {
  trendChartInstance: null,

  async loadPassport(district = "Vijayawada") {
    const distName = district || window.currentSelectedLocation || "Vijayawada";
    try {
      const resp = await fetch(`/api/reliability/passport?district=${encodeURIComponent(distName)}`);
      if (!resp.ok) throw new Error("Failed to load passport data");
      const data = await resp.json();
      this.renderPassport(data);
    } catch (err) {
      console.error("[DistrictPassport] load error:", err);
    }
  },

  renderPassport(data) {
    const pMeta = data.passport_metadata || {};
    const scores = data.scores || {};

    // Header & Seals
    this.setText("passportDistrictName", data.district || "District");
    this.setText("passportIdBadge", pMeta.passport_id || "IND-MET-VERIFIED");
    this.setText("passportTrustTier", pMeta.trust_tier || "GOLD / RELIABLE");
    this.setText("passportSealBadge", pMeta.seal_badge || "🥇 Verified");

    const tierEl = document.getElementById("passportTrustTier");
    if (tierEl && pMeta.tier_color) tierEl.style.color = pMeta.tier_color;

    // Scores Grid
    this.setText("passportOverallScore", `${scores.overall_reliability || 75} / 100`);
    this.setText("passportAccuracyPct", `${scores.historical_forecast_accuracy_pct || 80}%`);
    this.setText("passportMonsoonScore", `${scores.monsoon_reliability || 68}%`);
    this.setText("passportWorstMonth", scores.most_error_prone_month || "July");

    // Event Radar / Bars
    this.setText("passValCyclone", `${scores.cyclone_reliability || 55}%`);
    this.setText("passValHeatwave", `${scores.heatwave_reliability || 78}%`);
    this.setText("passValHeavyRain", `${scores.heavy_rainfall_reliability || 54}%`);

    // Seasonal Table
    const tbody = document.getElementById("passportSeasonalTbody");
    if (tbody && data.seasonal_performance) {
      tbody.innerHTML = "";
      data.seasonal_performance.forEach((s) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${s.season}</strong></td>
          <td style="color: ${s.reliability_score >= 65 ? "#10b981" : "#f59e0b"}; font-weight: 700;">${s.reliability_score}%</td>
          <td>${s.mae_rainfall_mm} mm</td>
          <td>${s.mae_temp_c} °C</td>
          <td><span class="badge ${s.status === "Optimal" ? "badge-low" : "badge-moderate"}">${s.status}</span></td>
        `;
        tbody.appendChild(tr);
      });
    }

    // AI Summary
    this.setText("passportAiSummary", data.ai_synoptic_summary || "");

    // Chart: Lead Day Trend
    this.renderTrendChart(data.lead_day_trend || []);
  },

  renderTrendChart(trendData) {
    const canvas = document.getElementById("passportLeadTrendChart");
    if (!canvas || !window.Chart) return;

    if (this.trendChartInstance) {
      this.trendChartInstance.destroy();
      this.trendChartInstance = null;
    }

    const labels = trendData.map((d) => `Day ${d.lead_day}`);
    const relScores = trendData.map((d) => d.reliability_score);
    const rainErrors = trendData.map((d) => d.mae_rainfall_mm);

    const ctx = canvas.getContext("2d");
    this.trendChartInstance = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Historical Reliability (%)",
            data: relScores,
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245, 158, 11, 0.15)",
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            yAxisID: "y",
          },
          {
            label: "Mean Rainfall Error (mm)",
            data: rainErrors,
            borderColor: "#38bdf8",
            borderWidth: 2,
            borderDash: [4, 4],
            tension: 0.3,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: "#94a3b8" } },
        },
        scales: {
          x: { grid: { color: "rgba(148, 163, 184, 0.1)" }, ticks: { color: "#94a3b8" } },
          y: {
            min: 0,
            max: 100,
            grid: { color: "rgba(148, 163, 184, 0.1)" },
            ticks: { color: "#f59e0b", callback: (v) => `${v}%` },
          },
          y1: {
            position: "right",
            grid: { drawOnChartArea: false },
            ticks: { color: "#38bdf8", callback: (v) => `${v} mm` },
          },
        },
      },
    });
  },

  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },
};

window.DistrictPassport = DistrictPassport;
