/**
 * WeatherTrust AI — Complete Single-Page Application (SPA) Router & Navigation
 * Manages persistent sidebar navigation, mobile drawer, page routing,
 * history state, and cross-component view synchronization.
 */

const AppRouter = {
  routes: [
    "dashboard",
    "live-weather",
    "live-tracking",
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
    // Check path first
    const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
    if (this.routes.includes(path)) {
      return path;
    }

    // Check hash fallback (e.g., #/live-weather or #live-weather)
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
    const viewSlug = pageSlug === "live-tracking" ? "live-weather" : pageSlug;

    // Update active nav item in sidebar
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
      const targetPage = item.getAttribute("data-page");
      if (targetPage === pageSlug || (targetPage === "live-weather" && pageSlug === "live-tracking")) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Toggle active page view
    const pageViews = document.querySelectorAll(".page-view");
    pageViews.forEach((view) => {
      if (view.id === `page-${viewSlug}`) {
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
    // Invalidate Leaflet Map dimensions when Map page becomes visible
    if (pageSlug === "map" && typeof IndiaMapUI !== "undefined" && IndiaMapUI.map) {
      setTimeout(() => {
        IndiaMapUI.map.invalidateSize();
      }, 200);
    }

    // Redraw charts when Drift or Forecast or Live Weather or Technical pages open
    if (typeof Chart !== "undefined") {
      setTimeout(() => {
        Chart.instances && Object.values(Chart.instances).forEach((chart) => chart.resize());
      }, 200);
    }
  },

  setupLinkInterception() {
    document.addEventListener("click", (e) => {
      // Find closest anchor or button with data-page attribute
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

// Initialize Router when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  AppRouter.init();
});
