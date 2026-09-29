/**
 * WeatherTrust AI — Weather Scene Engine (Live Weather Scene Engine)
 * Manages scene transitions, coordinates with weather animator, and handles
 * live weather data integration with Open-Meteo API.
 */

const WeatherSceneEngine = {
  currentScene: null,
  previousScene: null,
  isTransitioning: false,
  animator: null,
  canvas: null,
  ctx: null,
  reducedMotion: false,
  isVisible: true,

  // Scene transition timing (ms)
  FADE_OUT_DURATION: 300,
  FADE_IN_DURATION: 500,

  pendingLocation: null,

  /**
   * Initialize the scene engine
   */
  init() {
    this.canvas = document.getElementById('weatherSceneCanvas');
    if (!this.canvas) {
      console.warn('Weather scene canvas not found');
      return;
    }

    this.ctx = this.canvas.getContext('2d');
    this.setupCanvas();
    this.checkReducedMotion();
    this.setupVisibilityListeners();

    // Initialize animator if available
    if (typeof WeatherAnimator !== 'undefined') {
      this.animator = WeatherAnimator;
      this.animator.init(this.canvas, this.ctx);
    }
  },

  /**
   * Setup canvas with proper sizing
   */
  setupCanvas() {
    const resizeCanvas = () => {
      const container = this.canvas.parentElement;
      if (container) {
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  },

  /**
   * Check for reduced motion preference
   */
  checkReducedMotion() {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Listen for changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
      if (this.animator) {
        this.animator.setReducedMotion(this.reducedMotion);
      }
    });
  },

  /**
   * Setup visibility listeners to pause animations when tab is inactive
   */
  setupVisibilityListeners() {
    document.addEventListener('visibilitychange', () => {
      this.isVisible = document.visibilityState === 'visible';
      if (this.animator) {
        this.animator.setPaused(!this.isVisible);
      }
    });
  },

  /**
   * Load scene for a specific location
   */
  async loadSceneForLocation(location, lat = null, lon = null, score = null) {
    if (this.isTransitioning) {
      this.pendingLocation = { location, lat, lon, score };
      return;
    }

    try {
      let url = `/api/weather/scene?location=${encodeURIComponent(location)}`;
      if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
        url += `&lat=${lat}&lon=${lon}`;
      }
      const response = await fetch(url);
      const data = await response.json();

      if (data.success && data.scene) {
        await this.transitionToScene(data.scene, data.weather);
        
        // Update overlay weather cards
        this.updateWeatherCards(data.weather);
        
        // Update location title in scene hero
        this.updateLocationTitle(location);
        
        // Update confidence score from existing reliability data
        this.updateConfidenceScore(location, lat, lon, score);
      } else {
        console.warn('Failed to load scene data, using fallback');
        await this.transitionToScene(data.scene || this.getFallbackScene(), null);
        this.showFallbackNotice();
      }
    } catch (error) {
      console.error('Error loading weather scene:', error);
      // Use fallback scene
      await this.transitionToScene(this.getFallbackScene(), null);
      this.showFallbackNotice();
    } finally {
      this.isTransitioning = false;
      if (this.pendingLocation) {
        const next = this.pendingLocation;
        this.pendingLocation = null;
        this.loadSceneForLocation(next.location, next.lat, next.lon);
      }
    }
  },

  /**
   * Transition to a new scene with fade effects
   */
  async transitionToScene(sceneData, weatherData) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const newScene = sceneData.scene_type;
    
    // Skip transition if same scene
    if (this.currentScene === newScene && !this.hasSignificantChange(sceneData)) {
      this.isTransitioning = false;
      return;
    }

    // Fade out current scene
    await this.fadeOut();

    // Update scene
    this.previousScene = this.currentScene;
    this.currentScene = newScene;

    // Apply new scene to animator
    if (this.animator) {
      this.animator.setScene(sceneData);
    }

    // Fade in new scene
    await this.fadeIn();

    this.isTransitioning = false;
  },

  /**
   * Check if scene parameters have significant changes
   */
  hasSignificantChange(sceneData) {
    if (!this.animator || !this.animator.currentSceneData) return true;
    
    const current = this.animator.currentSceneData;
    const significant = Math.abs(current.wind_speed_kmh - sceneData.wind_speed_kmh) > 5 ||
                      Math.abs(current.cloud_cover - sceneData.cloud_cover) > 20 ||
                      current.apply_wind_overlay !== sceneData.apply_wind_overlay;
    
    return significant;
  },

  /**
   * Fade out animation
   */
  fadeOut() {
    return new Promise((resolve) => {
      if (!this.canvas) {
        resolve();
        return;
      }

      this.canvas.style.transition = `opacity ${this.FADE_OUT_DURATION}ms ease-out`;
      this.canvas.style.opacity = '0';

      setTimeout(resolve, this.FADE_OUT_DURATION);
    });
  },

  /**
   * Fade in animation
   */
  fadeIn() {
    return new Promise((resolve) => {
      if (!this.canvas) {
        resolve();
        return;
      }

      this.canvas.style.transition = `opacity ${this.FADE_IN_DURATION}ms ease-in`;
      this.canvas.style.opacity = '1';

      setTimeout(resolve, this.FADE_IN_DURATION);
    });
  },

  /**
   * Update location title in scene hero
   */
  updateLocationTitle(location) {
    const titleElem = document.getElementById('sceneLocationTitle');
    if (titleElem) {
      titleElem.textContent = location;
    }
  },

  /**
   * Update weather overlay cards with animation
   */
  updateWeatherCards(weather) {
    if (!weather) return;

    // Temperature with count-up animation
    this.animateValue('sceneTemperature', weather.temperature_c, 0, '°C');
    
    // Condition
    const subElem = document.getElementById('sceneConditionSubtitle');
    if (subElem) {
      subElem.textContent = weather.condition;
    }
    const condElem = document.getElementById('sceneConditionCard') || document.getElementById('sceneCondition');
    if (condElem) {
      condElem.textContent = weather.condition;
      this.pulseCard(condElem.closest('.weather-card'));
    }

    // Humidity
    this.animateValue('sceneHumidity', weather.humidity_pct, 0, '%');
    
    // Wind
    this.animateValue('sceneWind', weather.wind_speed_kmh, 1, ' km/h');
    
    // Pressure
    this.animateValue('scenePressure', weather.pressure_hpa, 0, ' hPa');
  },

  async updateConfidenceScore(location, lat = null, lon = null, score = null) {
    const confElem = document.getElementById('sceneConfidence');
    if (!confElem) return;

    if (score !== null && score !== undefined && !isNaN(score)) {
      this.animateValue('sceneConfidence', Number(score), 0, '/100');
      this.pulseCard(confElem.closest('.weather-card'));
      return;
    }

    if (typeof WeatherTrustCommon !== 'undefined' && WeatherTrustCommon.current && WeatherTrustCommon.current.trust_score !== undefined) {
      this.animateValue('sceneConfidence', Number(WeatherTrustCommon.current.trust_score), 0, '/100');
      this.pulseCard(confElem.closest('.weather-card'));
      return;
    }

    try {
      let url = `/api/reliability?location=${encodeURIComponent(location)}&lead_day=1`;
      if (lat !== null && lon !== null && !isNaN(lat) && !isNaN(lon)) {
        url += `&lat=${lat}&lon=${lon}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      
      if (confElem) {
        if (data && data.available !== false && data.reliability_score !== undefined) {
          this.animateValue('sceneConfidence', data.reliability_score, 0, '/100');
          this.pulseCard(confElem.closest('.weather-card'));
        } else {
          confElem.textContent = '--/100';
        }
      }
    } catch (error) {
      console.error('Error fetching confidence score:', error);
      if (confElem) confElem.textContent = '--/100';
    }
  },

  /**
   * Animate numeric value with count-up effect
   */
  animateValue(elementId, targetValue, decimals = 0, suffix = '') {
    const elem = document.getElementById(elementId);
    if (!elem) return;

    const startValue = parseFloat(elem.textContent) || 0;
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (targetValue - startValue) * easeOut;
      
      elem.textContent = currentValue.toFixed(decimals) + suffix;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Pulse animation on completion
        this.pulseCard(elem.closest('.weather-card'));
      }
    };

    requestAnimationFrame(animate);
  },

  /**
   * Pulse card border on value update
   */
  pulseCard(card) {
    if (!card) return;
    
    card.style.transition = 'border-color 0.3s ease, box-shadow 0.3s ease';
    card.style.borderColor = 'rgba(56, 189, 248, 0.8)';
    card.style.boxShadow = '0 0 15px rgba(56, 189, 248, 0.3)';
    
    setTimeout(() => {
      card.style.borderColor = '';
      card.style.boxShadow = '';
    }, 300);
  },

  /**
   * Show fallback notice when API fails
   */
  showFallbackNotice() {
    const notice = document.getElementById('sceneFallbackNotice');
    if (notice) {
      notice.style.display = 'block';
      setTimeout(() => {
        notice.style.display = 'none';
      }, 5000);
    }
  },

  /**
   * Get fallback scene data
   */
  getFallbackScene() {
    return {
      scene_type: 'partly_cloudy',
      apply_wind_overlay: false,
      wind_speed_kmh: 15,
      wind_direction_deg: 0,
      wind_vector_x: -0.3,
      wind_vector_y: 0,
      cloud_cover: 50,
      temperature_c: 25,
      humidity_pct: 70,
      sky_brightness: 0.85,
      sun_rotation_speed: 0.008,
      cloud_density: 0.6,
      parallax_layers: 3,
    };
  },

  /**
   * Refresh current scene
   */
  async refreshScene() {
    if (currentLocation) {
      await this.loadSceneForLocation(currentLocation);
    }
  },

  /**
   * Cleanup and stop animations
   */
  destroy() {
    if (this.animator) {
      this.animator.destroy();
    }
    
    if (this.canvas) {
      this.ctx = null;
    }
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    WeatherSceneEngine.init();
  });
} else {
  WeatherSceneEngine.init();
}