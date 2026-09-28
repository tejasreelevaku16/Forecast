/**
 * WeatherTrust AI — Resource Optimization AI Controller (SIH Differentiator 5)
 * Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
 */

const ResourceOptimization = {
  async loadResourcePlan(location = "Vijayawada", leadDay = 6) {
    const locName = location || window.currentSelectedLocation || "Vijayawada";
    const day = parseInt(leadDay, 10) || 6;

    try {
      const resp = await fetch(`/api/stakeholder/resource-optimization?location=${encodeURIComponent(locName)}&lead_day=${day}`);
      if (!resp.ok) throw new Error("Failed to load resource optimization data");
      const data = await resp.json();
      this.renderPlan(data);
    } catch (err) {
      console.error("[ResourceOptimization] load error:", err);
    }
  },

  renderPlan(data) {
    const ndrf = data.ndrf_deployment || {};
    const relief = data.relief_camps || {};
    const reservoir = data.reservoir_monitoring || {};
    const pumps = data.pump_allocation || {};
    const medical = data.medical_readiness || {};
    const ranking = data.district_resource_ranking || [];

    // NDRF Card
    this.setText("resNdrfTier", ndrf.tier || "TIER 2 (REGIONAL STANDBY)");
    this.setText("resNdrfBattalions", `${ndrf.battalions || 2} Battalions`);
    this.setText("resNdrfBoats", `${ndrf.inflatable_rescue_boats || 8} Boats`);
    this.setText("resNdrfGuidance", ndrf.guidance || "");

    const ndrfTierEl = document.getElementById("resNdrfTier");
    if (ndrfTierEl && ndrf.status_color) ndrfTierEl.style.color = ndrf.status_color;

    // Relief Camps
    this.setText("resReliefShelters", `${relief.recommended_shelters_count || 3} Centers`);
    this.setText("resReliefCapacity", `${(relief.estimated_evacuees_capacity || 1500).toLocaleString()} Persons`);
    this.setText("resReliefRations", `${relief.emergency_food_ration_buffer_days || 5} Days Buffer`);
    this.setText("resReliefWater", `${relief.clean_potable_water_tankers || 8} Tankers`);
    this.setText("resReliefGuidance", relief.guidance || "");

    // Reservoir Monitoring
    this.setText("resReservoirStatus", reservoir.status || "REGULATED OUTFLOW");
    this.setText("resReservoirCushion", `${reservoir.required_flood_cushion_pct || 15}% Cushion Buffer`);
    this.setText("resReservoirAdvisory", reservoir.spillway_advisory || "");

    const resStatusEl = document.getElementById("resReservoirStatus");
    if (resStatusEl && reservoir.color) resStatusEl.style.color = reservoir.color;

    // Heavy Pumps
    this.setText("resPumpsAllocated", `${pumps.total_pumps_allocated || 6} Units`);
    this.setText("resPumpsHighCap", `${pumps.high_capacity_1000gpm_pumps || 2} (1000 GPM)`);
    this.setText("resPumpsZones", (pumps.target_inundation_zones || []).slice(0, 2).join(" • "));

    // Medical Readiness
    this.setText("resMedUnits", `${medical.mobile_medical_units_standby || 2} Mobile Teams`);
    this.setText("resMedAntivenom", `${medical.anti_snake_venom_vials || 50} Vials Stockpile`);

    // Multi-District Ranking Table
    const tbody = document.getElementById("resRankingTableBody");
    if (tbody && ranking.length) {
      tbody.innerHTML = "";
      ranking.forEach((d) => {
        const tr = document.createElement("tr");
        const rankColor = d.priority_rank === 1 ? "#ef4444" : d.priority_rank <= 3 ? "#f59e0b" : "#38bdf8";
        tr.innerHTML = `
          <td><strong style="color: ${rankColor}; font-size: 1rem;">#${d.priority_rank}</strong></td>
          <td><strong>${d.district}</strong> <span style="font-size: 0.72rem; color: #94a3b8;">(${d.river_basin})</span></td>
          <td style="color: #f8fafc; font-weight: 700;">${d.predicted_rainfall_mm} mm</td>
          <td><span class="badge ${d.flood_risk_score > 60 ? "badge-high" : "badge-moderate"}">${d.flood_risk_score}</span></td>
          <td style="color: #ef4444; font-weight: 600;">${d.bust_probability_pct}%</td>
          <td><strong style="color: ${rankColor}; font-size: 0.95rem;">${d.urgency_score}</strong></td>
          <td><span class="badge ${d.recommended_ndrf_teams > 0 ? "badge-high" : "badge-low"}">${d.recommended_ndrf_teams} Teams</span></td>
        `;
        tbody.appendChild(tr);
      });
    }
  },

  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },
};

window.ResourceOptimization = ResourceOptimization;
