/**
 * WeatherTrust AI — AI Why-Chain Meteorological Reasoning Flow Controller (SIH Differentiator 2)
 * Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
 */

const WhyChainEngine = {
  async loadWhyChain(location = "Vijayawada", leadDay = 6) {
    const locName = location || window.currentSelectedLocation || "Vijayawada";
    const day = parseInt(leadDay, 10) || 6;

    try {
      const resp = await fetch(`/api/explain/why-chain?location=${encodeURIComponent(locName)}&lead_day=${day}`);
      if (!resp.ok) throw new Error("Failed to load why-chain data");
      const data = await resp.json();
      this.renderFlowDiagram(data);
    } catch (err) {
      console.error("[WhyChainEngine] error:", err);
    }
  },

  renderFlowDiagram(data) {
    const container = document.getElementById("whyChainFlowContainer");
    const summaryText = document.getElementById("whyChainSummaryText");
    if (!container) return;

    if (summaryText && data.reasoning_summary) {
      summaryText.textContent = data.reasoning_summary;
    }

    container.innerHTML = "";
    const nodes = data.nodes || [];

    nodes.forEach((node, idx) => {
      const nodeEl = document.createElement("div");
      nodeEl.className = "why-chain-node";

      const impactSign = node.confidence_impact_pct > 0 ? "+" : "";
      const impactClass = node.confidence_impact_pct < -15 ? "badge-high" : "badge-moderate";

      nodeEl.innerHTML = `
        <div class="why-node-step">${node.step}</div>
        <div class="why-node-body">
          <div class="why-node-header">
            <div class="why-node-title">
              <span style="margin-right: 6px;">${node.icon}</span>
              <span>${node.factor_name}</span>
              <span style="font-size: 0.72rem; color: #94a3b8; font-weight: normal; margin-left: 8px;">(${node.hierarchy_level})</span>
            </div>
            <span class="why-node-impact">${impactSign}${node.confidence_impact_pct}% Impact</span>
          </div>
          <div class="why-node-obs">▸ ${node.observation}</div>
          <div class="why-node-desc">${node.explanation}</div>
          <div style="margin-top: 6px; font-size: 0.75rem; color: #a855f7; font-weight: 600;">
            Cumulative AI Confidence: ${node.cumulative_confidence_pct}%
          </div>
        </div>
      `;

      container.appendChild(nodeEl);

      // Downward arrow between nodes
      if (idx < nodes.length - 1) {
        const arrowEl = document.createElement("div");
        arrowEl.className = "why-chain-arrow";
        arrowEl.innerHTML = "↓";
        container.appendChild(arrowEl);
      }
    });
  },
};

window.WhyChainEngine = WhyChainEngine;
