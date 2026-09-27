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
    "forecast",
    "trust",
    "drift",
    "map",
    "alerts",
    "decision-support",
    "technical",
    "about",
  ],
  currentPage: "dashboard",

  init() {
    this.setupLinkInterception();
    this.setupHamburgerMenu();
    this.setupPopStateListener();

    // Determine initial route from URL path or hash
    const initialRoute = this.getRouteFromUrl();
    this.navigateTo(initialRoute, false);
  },

  getRouteFromUrl() {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
    if (this.routes.includes(path)) {
      return path;
    }

    const hash = window.location.hash.replace(/^#\/?/, "");
    if (this.routes.includes(hash)) {
      return hash;
    }

    return "dashboard";
  },

  navigateTo(pageSlug, pushHistory = true) {
    if (!this.routes.includes(pageSlug)) {
      pageSlug = "dashboard";
    }

    this.currentPage = pageSlug;

    // Update active nav item in sidebar
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      const targetPage = item.getAttribute("data-page");
      if (targetPage === pageSlug) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Toggle active page view
    const pageViews = document.querySelectorAll(".page-view");
    pageViews.forEach((view) => {
      if (view.id === `page-${pageSlug}`) {
        view.classList.add("active");
      } else {
        view.classList.remove("active");
      }
    });

    // Close mobile sidebar if open
    this.closeMobileSidebar();

    // Update browser URL & history
    if (pushHistory) {
      window.history.pushState({ page: pageSlug }, "", `/${pageSlug}`);
    }

    // Scroll to top of main content
    const mainWrapper = document.querySelector(".main-wrapper");
    if (mainWrapper) {
      mainWrapper.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Handle view-specific lifecycle events
    this.onPageActivated(pageSlug);
  },

  onPageActivated(pageSlug) {
    const loc = window.currentSelectedLocation || "Vijayawada";

    // Initialize GIS confidence map
    if (pageSlug === "confidence-map" || pageSlug === "map") {
      setTimeout(() => {
        if (typeof initConfidenceMap === "function") {
          initConfidenceMap();
        }
        if (typeof IndiaMapUI !== "undefined" && IndiaMapUI.map) {
          IndiaMapUI.map.invalidateSize();
        }
      }, 150);
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
