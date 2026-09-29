/**
 * WeatherTrust AI — Forecast Confidence Digital Twin Controller (SIH Differentiator 1)
 * Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
 */

const DigitalTwin = {
  currentData: null,
  currentDayIndex: 0, // 0 = Day 10, 9 = Day 1
  isPlaying: false,
  playbackSpeed: 1200, // ms per step
  timerId: null,
  evolutionChart: null,
  _listenersInitialized: false,

  async init(location = "Vijayawada") {
    await this.fetchReplayData(location);
    if (!this._listenersInitialized) {
      this.setupListeners();
      this._listenersInitialized = true;
    }
  },

  async fetchReplayData(location = "Vijayawada") {
    const locName = location || window.currentSelectedLocation || "Vijayawada";
    try {
      const resp = await fetch(`/api/weather/digital-twin?location=${encodeURIComponent(locName)}`);
      if (!resp.ok) throw new Error("Failed to load digital twin data");
      const data = await resp.json();
      this.currentData = data;
      this.currentDayIndex = 0;
      this.renderDay(0);
      this.renderEvolutionChart();
      const locLabel = document.getElementById("dtCurrentLocationLabel");
      if (locLabel) locLabel.textContent = data.district || locName;
    } catch (err) {
      console.error("[DigitalTwin] fetch error:", err);
    }
  },

  setupListeners() {
    const slider = document.getElementById("dtTimelineSlider");
    if (slider) {
      slider.addEventListener("input", (e) => {
        this.pause();
        const idx = parseInt(e.target.value, 10);
        this.renderDay(idx);
      });
    }

    const playBtn = document.getElementById("dtPlayBtn");
    if (playBtn) {
      playBtn.addEventListener("click", () => this.togglePlay());
    }

    const rewindBtn = document.getElementById("dtRewindBtn");
    if (rewindBtn) {
      rewindBtn.addEventListener("click", () => {
        this.pause();
        this.renderDay(0);
      });
    }

    const stepBackBtn = document.getElementById("dtStepBackBtn");
    if (stepBackBtn) {
      stepBackBtn.addEventListener("click", () => {
        this.pause();
        if (this.currentDayIndex > 0) this.renderDay(this.currentDayIndex - 1);
      });
    }

    const stepFwdBtn = document.getElementById("dtStepFwdBtn");
    if (stepFwdBtn) {
      stepFwdBtn.addEventListener("click", () => {
        this.pause();
        if (this.currentData?.days && this.currentDayIndex < this.currentData.days.length - 1) {
          this.renderDay(this.currentDayIndex + 1);
        }
      });
    }

    // Speed buttons
    const speedBtns = document.querySelectorAll(".dt-speed-btn");
    speedBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        speedBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const speed = parseFloat(btn.getAttribute("data-speed") || "1");
        this.playbackSpeed = 1200 / speed;
        if (this.isPlaying) {
          this.pause();
          this.play();
        }
      });
    });
  },

  togglePlay() {
    if (this.isPlaying) this.pause();
    else this.play();
  },

  play() {
    if (!this.currentData?.days?.length) return;
    this.isPlaying = true;
    const playBtn = document.getElementById("dtPlayBtn");
    if (playBtn) playBtn.innerHTML = "<span>⏸</span> Pause";

    this.timerId = setInterval(() => {
      if (this.currentDayIndex >= this.currentData.days.length - 1) {
        // loop back or pause
        this.currentDayIndex = 0;
      } else {
        this.currentDayIndex++;
      }
      this.renderDay(this.currentDayIndex);
    }, this.playbackSpeed);
  },

  pause() {
    this.isPlaying = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    const playBtn = document.getElementById("dtPlayBtn");
    if (playBtn) playBtn.innerHTML = "<span>▶</span> Play";
  },

  renderDay(index) {
    if (!this.currentData?.days || !this.currentData.days[index]) return;
    this.currentDayIndex = index;
    const day = this.currentData.days[index];

    // Update Slider
    const slider = document.getElementById("dtTimelineSlider");
    if (slider) slider.value = index;

    // Update Header Badges
    const badgeDay = document.getElementById("dtSelectedDayBadge");
    if (badgeDay) badgeDay.textContent = `Lead Day ${day.lead_day} (${day.target_date})`;

    const badgeStatus = document.getElementById("dtConfidenceStatusBadge");
    if (badgeStatus) {
      badgeStatus.textContent = `${day.ai_confidence_pct}% AI CONFIDENCE`;
      badgeStatus.className = `badge ${
        day.ai_confidence_pct >= 70 ? "badge-low" : day.ai_confidence_pct >= 45 ? "badge-moderate" : "badge-high"
      }`;
    }

    // Comparison Table
    this.setText("dtFcRain", `${day.forecast.rainfall_mm} mm`);
    this.setText("dtActRain", `${day.actual_simulated.rainfall_mm} mm`);
    this.setDeltaBadge("dtDeltaRain", `${day.error_delta.rainfall_error_mm} mm`, day.error_delta.severity);

    this.setText("dtFcTemp", `${day.forecast.temp_avg_c} °C`);
    this.setText("dtActTemp", `${day.actual_simulated.temp_avg_c} °C`);
    this.setDeltaBadge("dtDeltaTemp", `${day.error_delta.temp_error_c} °C`, day.error_delta.temp_error_c > 2.0 ? "MODERATE" : "LOW");

    this.setText("dtFcWind", `${day.forecast.wind_speed_kmh} km/h`);
    this.setText("dtActWind", `${day.actual_simulated.wind_speed_kmh} km/h`);
    this.setDeltaBadge("dtDeltaWind", `${day.error_delta.wind_error_kmh} km/h`, day.error_delta.wind_error_kmh > 8.0 ? "MODERATE" : "LOW");

    this.setText("dtFcPres", `${day.forecast.pressure_hpa} hPa`);
    this.setText("dtActPres", `${day.actual_simulated.pressure_hpa} hPa`);
    this.setDeltaBadge("dtDeltaPres", `${day.error_delta.pressure_error_hpa} hPa`, "LOW");

    // Gauges
    this.setText("dtGaugeRainVal", `${day.forecast.rainfall_mm} mm`);
    this.setText("dtGaugeRainSub", `${day.animation_cues.rain_intensity.toUpperCase()} INTENSITY`);

    this.setText("dtGaugeTempVal", `${day.forecast.temp_avg_c} °C`);
    this.setText("dtGaugeTempSub", `${day.forecast.temp_min_c}° / ${day.forecast.temp_max_c}°`);

    this.setText("dtGaugeWindVal", `${day.forecast.wind_speed_kmh} km/h`);
    this.setText("dtGaugeWindSub", `${day.animation_cues.wind_bearing_deg}° ${day.animation_cues.wind_level.toUpperCase()}`);

    this.setText("dtGaugePresVal", `${day.forecast.pressure_hpa} hPa`);
    this.setText("dtGaugePresSub", `TREND: ${day.animation_cues.pressure_trend.toUpperCase()}`);

    // Narrative
    this.setText("dtSynopticNarrative", day.synoptic_narrative || "");
  },

  renderEvolutionChart() {
    const canvas = document.getElementById("dtEvolutionChart");
    if (!canvas || !window.Chart || !this.currentData?.chart_series) return;

    if (this.evolutionChart) {
      this.evolutionChart.destroy();
      this.evolutionChart = null;
    }

    const series = this.currentData.chart_series;
    const ctx = canvas.getContext("2d");

    this.evolutionChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: series.labels,
        datasets: [
          {
            label: "AI Confidence (%)",
            data: series.confidence,
            borderColor: "#38bdf8",
            backgroundColor: "rgba(56, 189, 248, 0.15)",
            borderWidth: 2,
            tension: 0.3,
            fill: true,
            yAxisID: "y",
          },
          {
            label: "Bust Probability (%)",
            data: series.bust_probability,
            borderColor: "#ef4444",
            backgroundColor: "transparent",
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.3,
            yAxisID: "y",
          },
          {
            label: "Verification Error (mm)",
            data: series.rainfall_error,
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            borderWidth: 2,
            tension: 0.3,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            labels: { color: "#94a3b8", font: { size: 11 } },
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(148, 163, 184, 0.1)" },
            ticks: { color: "#94a3b8" },
          },
          y: {
            type: "linear",
            display: true,
            position: "left",
            min: 0,
            max: 100,
            grid: { color: "rgba(148, 163, 184, 0.1)" },
            ticks: { color: "#38bdf8", callback: (v) => `${v}%` },
          },
          y1: {
            type: "linear",
            display: true,
            position: "right",
            min: 0,
            grid: { drawOnChartArea: false },
            ticks: { color: "#f59e0b", callback: (v) => `${v} mm` },
          },
        },
      },
    });
  },

  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },

  setDeltaBadge(id, text, severity) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.className = "dt-delta-badge";
    if (severity === "CRITICAL") el.classList.add("dt-delta-bad");
    else if (severity === "MODERATE") el.classList.add("dt-delta-warn");
    else el.classList.add("dt-delta-good");
  },
};

window.DigitalTwin = DigitalTwin;
