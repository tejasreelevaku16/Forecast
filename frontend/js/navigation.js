/**
 * WeatherTrust AI — Complete Single-Page Application (SPA) Router & Navigation
 * Ministry of Earth Sciences (MoES) — National Centre for Medium Range Weather Forecasting (NCMRWF)
 * SIH Problem ID: 26079
 */

const AppRouter = {
  routes: [
    "dashboard",
    "confidence-map",
    "daywise",
    "uncertainty",
    "calibration",
    "explain",
    "live-weather",
    "live-tracking",
    "forecast",
    "forecast-replay",
    "trust",
    "drift",
    "map",
    "alerts",
    "decision-support",
    "technical",
    "about",
    "stakeholder",
  ],

  aliases: {
    "forecast-confidence": "confidence-map",
    "forecast-confidence-map": "confidence-map",
    "confidence": "confidence-map",
    "day-wise": "daywise",
    "day-wise-confidence": "daywise",
    "daywise-confidence": "daywise",
    "forecast-uncertainty": "uncertainty",
    "model-reliability": "calibration",
    "model-reliability-calibration": "calibration",
    "reliability": "calibration",
    "explainable-ai": "explain",
    "explainable-ai-shap": "explain",
    "shap": "explain",
    "live-tracking": "live-weather",
    "live": "live-weather",
    "10-day-forecast": "forecast",
    "ten-day-forecast": "forecast",
    "trust-diagnostics": "trust",
    "forecast-drift": "drift",
    "india-map": "map",
    "india-reliability-map": "map",
    "early-alerts": "alerts",
    "technical-evaluator": "technical",
    "technical-evaluation": "technical",
    "stakeholder-workspace": "stakeholder",
    "workspace": "stakeholder",
    "forecaster": "stakeholder",
    "disaster": "stakeholder",
    "agriculture": "stakeholder",
    "public": "stakeholder",
    "admin": "stakeholder",
  },

  currentPage: "dashboard",

  normalizeRoute(slug) {
    if (!slug) return "dashboard";
    const clean = String(slug).toLowerCase().replace(/^\/+|\/+$/g, "").trim();
    if (this.aliases[clean]) {
      return this.aliases[clean];
    }
    if (this.routes.includes(clean)) {
      return clean === "live-tracking" ? "live-weather" : clean;
    }
    return "dashboard";
  },

  init() {
    this.setupLinkInterception();
    this.setupHamburgerMenu();
    this.setupPopStateListener();

    const storedLocation = localStorage.getItem('weathertrust-selected-location');
    if (storedLocation) {
      try {
        const parsed = JSON.parse(storedLocation);
        if (parsed && parsed.name) {
          window.currentSelectedLocation = parsed.name;
        }
      } catch (err) {
        console.warn('[nav] invalid stored location', err);
      }
    }

    const initialRoute = this.getRouteFromUrl();
    this.navigateTo(initialRoute, false);
  },

  getRouteFromUrl() {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
    if (path) {
      return this.normalizeRoute(path);
    }

    const hash = window.location.hash.replace(/^#\/?/, "");
    if (hash) {
      return this.normalizeRoute(hash);
    }

    return "dashboard";
  },

  navigateTo(pageSlug, pushHistory = true) {
    const target = this.normalizeRoute(pageSlug);
    const previousPage = this.currentPage;

    // Page deactivation cleanup
    if (previousPage && previousPage !== target) {
      this.onPageDeactivated(previousPage);
    }

    this.currentPage = target;
    const selectedLocation = window.currentSelectedLocation || (typeof currentLocation !== "undefined" ? currentLocation : "Krishna District");
    if (selectedLocation) {
      localStorage.setItem('weathertrust-selected-location', JSON.stringify({ name: selectedLocation }));
    }

    // Update active nav item in sidebar
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      const itemPage = this.normalizeRoute(item.getAttribute("data-page"));
      if (itemPage === target) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Toggle active page view
    const pageViews = document.querySelectorAll(".page-view");
    pageViews.forEach((view) => {
      if (view.id === `page-${target}`) {
        view.classList.add("active");
      } else {
        view.classList.remove("active");
      }
    });

    // Close mobile sidebar if open
    this.closeMobileSidebar();

    // Update browser URL & history
    if (pushHistory) {
      window.history.pushState({ page: target, original: pageSlug }, "", `/${pageSlug}`);
    }

    // Scroll to top of main content
    const mainWrapper = document.querySelector(".main-wrapper");
    if (mainWrapper) {
      mainWrapper.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Handle view-specific lifecycle events
    this.onPageActivated(target, pageSlug);
  },

  onPageDeactivated(pageSlug) {
    // Stop animator loop when leaving dashboard
    if (pageSlug === "dashboard") {
      if (typeof WeatherSceneEngine !== "undefined" && WeatherSceneEngine.animator) {
        WeatherSceneEngine.animator.setPaused(true);
      }
    }

    // Pause replay playback when leaving forecast-replay
    if (pageSlug === "forecast-replay") {
      if (typeof window.DigitalTwin !== "undefined" && typeof window.DigitalTwin.pause === "function") {
        window.DigitalTwin.pause();
      }
    }
  },

  onPageActivated(pageSlug, rawSlug) {
    const loc = window.currentSelectedLocation || (typeof currentLocation !== "undefined" ? currentLocation : "Krishna District");

    // Weather Scene Animator Lifecycle (Active only on Dashboard)
    if (typeof WeatherSceneEngine !== "undefined" && WeatherSceneEngine.animator) {
      if (pageSlug === "dashboard") {
        WeatherSceneEngine.animator.setPaused(false);
      } else {
        WeatherSceneEngine.animator.setPaused(true);
      }
    }

    // Dashboard View Activation
    if (pageSlug === "dashboard") {
      if (typeof loadDashboard === "function") {
        loadDashboard(loc);
      }
      if (typeof window.MultiAgentIntelligence !== "undefined") {
        window.MultiAgentIntelligence.loadIntelligence(loc, 6);
      }
    }

    // Initialize GIS confidence map
    if (pageSlug === "confidence-map") {
      setTimeout(() => {
        if (typeof initConfidenceMap === "function") {
          initConfidenceMap();
        }
      }, 150);
    }

    // Initialize India Reliability Map
    if (pageSlug === "map") {
      setTimeout(() => {
        if (typeof IndiaMapUI !== "undefined") {
          if (!IndiaMapUI.map) {
            IndiaMapUI.initMap();
          } else {
            IndiaMapUI.map.invalidateSize(true);
            IndiaMapUI.fitIndiaBounds(false);
          }
        }
        if (typeof window.DistrictPassport !== "undefined") {
          window.DistrictPassport.loadPassport(loc);
        }
      }, 100);
      setTimeout(() => {
        if (typeof IndiaMapUI !== "undefined" && IndiaMapUI.map) {
          IndiaMapUI.map.invalidateSize(true);
          IndiaMapUI.fitIndiaBounds(false);
        }
      }, 300);
    }

    // Trigger Day-wise ML Predictions
    if (pageSlug === "daywise" && typeof loadDaywiseForecast === "function") {
      loadDaywiseForecast(loc);
    }

    // Trigger Forecast Uncertainty Engine
    if (pageSlug === "uncertainty" && typeof loadUncertaintyView === "function") {
      loadUncertaintyView(loc);
    }

    // Trigger Model Calibration & Reliability
    if (pageSlug === "calibration" && typeof loadCalibrationView === "function") {
      loadCalibrationView();
    }

    // Trigger Explainable AI (SHAP)
    if (pageSlug === "explain" && typeof loadExplainabilityData === "function") {
      loadExplainabilityData(loc, 6);
    }

    // Synchronize Live Tracking page location hierarchy
    if (pageSlug === "live-weather" && typeof LiveTrackingUI !== "undefined" && typeof LiveTrackingUI.findAndSelectLocation === "function") {
      LiveTrackingUI.findAndSelectLocation(loc);
    }

    // Trigger Forecast Drift Monitor
    if (pageSlug === "drift" && typeof DriftUI !== "undefined" && typeof DriftUI.fetchDriftHistory === "function") {
      DriftUI.fetchDriftHistory(loc).then((data) => {
        DriftUI.renderDriftSection(data);
      });
    }

    if (pageSlug === "forecast-replay") {
      if (typeof window.DigitalTwin !== "undefined") {
        window.DigitalTwin.init(loc);
      }
      if (typeof WeatherTrustInsightsUI !== "undefined") {
        WeatherTrustInsightsUI.renderReplay(window.currentWeatherInsights);
      }
    }

    if (pageSlug === "decision-support") {
      if (typeof window.DecisionSimulator !== "undefined") {
        window.DecisionSimulator.init();
      }
      if (typeof WeatherTrustInsightsUI !== "undefined") {
        WeatherTrustInsightsUI.renderAdvisories(window.currentWeatherInsights);
      }
    }

    // Trigger Technical Evaluation (Judge) metrics
    if (pageSlug === "technical" && typeof JudgeUI !== "undefined" && typeof JudgeUI.fetchMetrics === "function") {
      JudgeUI.fetchMetrics().then((data) => {
        JudgeUI.renderJudgeDashboard(data);
      });
    }

    // Trigger Stakeholder Workspace & Resource Optimization AI
    if (pageSlug === "stakeholder") {
      const explicitRole = (rawSlug && ["agriculture", "disaster", "forecaster", "public", "admin"].includes(rawSlug.toLowerCase()))
        ? rawSlug.toLowerCase()
        : null;

      setTimeout(() => {
        if (typeof StakeholderUI !== "undefined") {
          if (explicitRole) {
            StakeholderUI.switchRole(explicitRole, true);
          } else {
            StakeholderUI.init();
          }
          // Multiple invalidation passes to guarantee maps render crisply across page navigations
          setTimeout(() => {
            if (StakeholderUI.activeRole === "agriculture" && StakeholderUI.agricultureMap) {
              StakeholderUI.agricultureMap.invalidateSize();
            } else if (StakeholderUI.activeRole === "disaster" && StakeholderUI.disasterMap) {
              StakeholderUI.disasterMap.invalidateSize();
            } else if (StakeholderUI.activeRole === "forecaster" && StakeholderUI.forecasterMap) {
              StakeholderUI.forecasterMap.invalidateSize();
            }
          }, 100);
          setTimeout(() => {
            if (StakeholderUI.activeRole === "agriculture" && StakeholderUI.agricultureMap) {
              StakeholderUI.agricultureMap.invalidateSize();
            } else if (StakeholderUI.activeRole === "disaster" && StakeholderUI.disasterMap) {
              StakeholderUI.disasterMap.invalidateSize();
            } else if (StakeholderUI.activeRole === "forecaster" && StakeholderUI.forecasterMap) {
              StakeholderUI.forecasterMap.invalidateSize();
            }
          }, 300);
        } else if (typeof window.initStakeholderWorkspace === "function") {
          window.initStakeholderWorkspace();
        }
        if (typeof window.ResourceOptimization !== "undefined") {
          window.ResourceOptimization.loadResourcePlan(loc, 6);
        }
      }, 50);
    }

    // Redraw charts when view changes
    if (typeof Chart !== "undefined") {
      setTimeout(() => {
        Chart.instances && Object.values(Chart.instances).forEach((chart) => chart.resize());
      }, 200);
    }
  },

  setupLinkInterception() {
    document.addEventListener("click", (e) => {
      const targetEl = e.target.closest("[data-page]");
      if (targetEl) {
        const pageSlug = targetEl.getAttribute("data-page");
        if (pageSlug) {
          e.preventDefault();
          this.navigateTo(pageSlug);
        }
      }
    });
  },

  setupHamburgerMenu() {
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");

    if (hamburgerBtn && sidebar) {
      hamburgerBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        if (overlay) overlay.classList.toggle("active");
      });
    }

    if (overlay && sidebar) {
      overlay.addEventListener("click", () => {
        this.closeMobileSidebar();
      });
    }
  },

  closeMobileSidebar() {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    if (sidebar) sidebar.classList.remove("open");
    if (overlay) overlay.classList.remove("active");
  },

  setupPopStateListener() {
    window.addEventListener("popstate", (e) => {
      const pageSlug = e.state && e.state.page ? e.state.page : this.getRouteFromUrl();
      this.navigateTo(pageSlug, false);
    });
  },
};

// Global routing helper
window.navigateToPage = function(page) {
  AppRouter.navigateTo(page);
};

document.addEventListener("DOMContentLoaded", () => {
  AppRouter.init();
});
