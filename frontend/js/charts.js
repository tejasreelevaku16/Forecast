/**
 * WeatherTrust AI — Charts Controller (Phase 1)
 * Manages responsive Chart.js visualizations for hourly trends and Day 1-10 Bust Risk progression.
 */

let hourlyChartInstance = null;
let bustRiskChartInstance = null;

/**
 * Initializes or updates the 24-Hour Temperature and Rainfall Chance chart.
 */
function renderHourlyTrendChart(hourlyItems) {
  const ctx = document.getElementById('hourlyTrendChart');
  if (!ctx) return;

  const labels = hourlyItems.map(item => item.time);
  const temps = hourlyItems.map(item => item.temperature_c);
  const rainChances = hourlyItems.map(item => item.rain_chance_pct);

  if (hourlyChartInstance) {
    hourlyChartInstance.destroy();
  }

  hourlyChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: temps,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          borderWidth: 2.5,
          tension: 0.35,
          fill: true,
          yAxisID: 'yTemp',
          pointRadius: 2,
          pointHoverRadius: 5,
        },
        {
          label: 'Rain Chance (%)',
          data: rainChances,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.35)',
          borderWidth: 1.5,
          type: 'bar',
          yAxisID: 'yRain',
          borderRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          labels: {
            color: '#94a3b8',
            font: { family: 'Inter', size: 11, weight: '600' }
          }
        },
        tooltip: {
          backgroundColor: '#0a0f1d',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 10,
        }
      },
      scales: {
        x: {
          ticks: { color: '#64748b', maxRotation: 0, font: { size: 10 } },
          grid: { color: 'rgba(255, 255, 255, 0.04)' }
        },
        yTemp: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: '°C', color: '#38bdf8', font: { size: 11 } },
          ticks: { color: '#94a3b8' },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        },
        yRain: {
          type: 'linear',
          position: 'right',
          min: 0,
          max: 100,
          title: { display: true, text: '% Rain', color: '#6366f1', font: { size: 11 } },
          ticks: { color: '#94a3b8' },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

/**
 * Initializes or updates the Day 1 to Day 10 Bust Probability progression chart.
 */
function renderBustRiskChart(leadDays) {
  const ctx = document.getElementById('bustRiskChart');
  if (!ctx) return;

  const labels = leadDays.map(item => `Day ${item.lead_day}`);
  const bustProbs = leadDays.map(item => item.bust_probability_pct);
  
  // Color codes based on risk thresholds: Low (<26%), Moderate (26-50%), High (>50%)
  const barColors = bustProbs.map(prob => {
    if (prob <= 25) return '#10b981'; // LOW
    if (prob <= 50) return '#f59e0b'; // MODERATE
    return '#ef4444'; // HIGH
  });

  if (bustRiskChartInstance) {
    bustRiskChartInstance.destroy();
  }

  bustRiskChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Bust Probability (%)',
          data: bustProbs,
          backgroundColor: barColors,
          borderRadius: 6,
          borderWidth: 0,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0a0f1d',
          titleColor: '#f8fafc',
          bodyColor: '#cbd5e1',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 10,
          callbacks: {
            afterLabel: function(context) {
              const item = leadDays[context.dataIndex];
              return `Risk: ${item.risk_level}\nStability: ${item.stability}\nDriver: ${item.primary_risk_driver}`;
            }
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#94a3b8', font: { size: 11, weight: '600' } },
          grid: { color: 'rgba(255, 255, 255, 0.04)' }
        },
        y: {
          min: 0,
          max: 100,
          ticks: { color: '#64748b', stepSize: 20 },
          title: { display: true, text: 'Bust Risk (%)', color: '#94a3b8', font: { size: 11 } },
          grid: { color: 'rgba(255, 255, 255, 0.05)' }
        }
      }
    }
  });
}
