/**
 * WeatherTrust AI — Multi-Agent Weather Intelligence Controller (SIH Differentiator 6)
 * Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
 */

const MultiAgentIntelligence = {
  async loadIntelligence(location = "Vijayawada", leadDay = 6) {
    const locName = location || window.currentSelectedLocation || "Vijayawada";
    const day = parseInt(leadDay, 10) || 6;

    try {
      const resp = await fetch(`/api/intelligence/multi-agent?location=${encodeURIComponent(locName)}&lead_day=${day}`);
      if (!resp.ok) throw new Error("Failed to load multi-agent data");
      const data = await resp.json();
      this.renderWarRoom(data);
    } catch (err) {
      console.error("[MultiAgentIntelligence] load error:", err);
    }
  },

  renderWarRoom(data) {
    const consensus = data.consensus || {};
    const agents = data.agents || [];

    // Consensus Metrics
    this.setText("agentConsensusScore", `${consensus.score_pct || 85}%`);
    this.setText("agentConsensusStatus", consensus.status || "ALIGNED");
    this.setText("agentJointDirective", consensus.joint_directive || "");

    const statusBadge = document.getElementById("agentConsensusStatus");
    if (statusBadge) {
      if ((consensus.score_pct || 85) >= 80) statusBadge.className = "badge badge-low";
      else if ((consensus.score_pct || 85) >= 55) statusBadge.className = "badge badge-moderate";
      else statusBadge.className = "badge badge-high";
    }

    // Render 5 Agent Cards
    const container = document.getElementById("agentCardsContainer");
    if (!container) return;

    container.innerHTML = "";
    agents.forEach((ag) => {
      const card = document.createElement("div");
      card.className = "agent-card";
      card.style.borderTop = `3px solid ${ag.color || "#38bdf8"}`;

      const riskClass = ag.risk_level === "CRITICAL" || ag.risk_level === "HIGH" ? "badge-high" : ag.risk_level === "MODERATE" ? "badge-moderate" : "badge-low";

      card.innerHTML = `
        <div>
          <div class="agent-card-header">
            <div class="agent-icon-badge" style="border-color: ${ag.color}; color: ${ag.color};">
              ${ag.icon}
            </div>
            <div class="agent-title-block">
              <h4>${ag.name}</h4>
              <span>${ag.role}</span>
            </div>
          </div>

          <div style="margin-bottom: 8px;">
            <span class="badge ${riskClass}">${ag.risk_level} RISK</span>
            <span style="font-size: 0.72rem; color: #94a3b8; margin-left: 6px;">${ag.key_metric || ""}</span>
          </div>

          <p class="agent-obs-text">
            ${ag.observation}
          </p>

          <div class="agent-rec-box" style="border-color: ${ag.color};">
            <strong style="color: ${ag.color}; font-size: 0.72rem; text-transform: uppercase;">Direct Action Mandate:</strong>
            <p style="margin-top: 2px;">${ag.recommendation}</p>
          </div>
        </div>

        <div class="agent-footer-metrics">
          <span style="color: #94a3b8;">Autonomous Confidence</span>
          <strong style="color: ${ag.color}; font-size: 0.9rem;">${ag.confidence_pct}%</strong>
        </div>
      `;

      container.appendChild(card);
    });
  },

  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },
};

window.MultiAgentIntelligence = MultiAgentIntelligence;
