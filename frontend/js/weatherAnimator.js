/**
 * WeatherTrust AI — Weather Animator (Live Weather Scene Canvas Renderer)
 * Procedural canvas-based weather animations using requestAnimationFrame.
 * Implements all scene types with performance optimization and accessibility.
 */

const WeatherAnimator = {
  canvas: null,
  ctx: null,
  currentSceneData: null,
  isPaused: false,
  reducedMotion: false,
  animationFrameId: null,
  lastFrameTime: 0,
  frameCount: 0,
  fps: 60,

  // Particle systems
  particles: [],
  clouds: [],
  ripples: [],
  lightningTimer: 0,
  lightningActive: false,
  lightningOpacity: 0,

  // Scene-specific parameters
  scene: {
    type: 'partly_cloudy',
    windOverlay: false,
    params: {}
  },

  /**
   * Initialize the animator
   */
  init(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Initialize default scene
    this.initializeParticles();
    this.startAnimationLoop();
  },

  /**
   * Set scene data
   */
  setScene(sceneData) {
    this.currentSceneData = sceneData;
    this.scene.type = sceneData.scene_type;
    this.scene.windOverlay = sceneData.apply_wind_overlay;
    this.scene.params = sceneData;
    
    // Reinitialize particles for new scene
    this.initializeParticles();
  },

  /**
   * Set reduced motion mode
   */
  setReducedMotion(enabled) {
    this.reducedMotion = enabled;
    if (enabled) {
      this.renderStaticFrame();
    }
  },

  /**
   * Set paused state
   */
  setPaused(paused) {
    this.isPaused = paused;
    if (!paused && !this.reducedMotion) {
      this.lastFrameTime = performance.now();
      this.startAnimationLoop();
    }
  },

  /**
   * Initialize particles based on scene type
   */
  initializeParticles() {
    this.particles = [];
    this.clouds = [];
    this.ripples = [];
    
    const sceneType = this.scene.type;
    const params = this.scene.params;

    switch (sceneType) {
      case 'clear_sky':
        this.initClearSkyParticles(params);
        break;
      case 'partly_cloudy':
        this.initPartlyCloudyParticles(params);
        break;
      case 'rain':
        this.initRainParticles(params);
        break;
      case 'thunderstorm':
        this.initThunderstormParticles(params);
        break;
      case 'snow':
        this.initSnowParticles(params);
        break;
      case 'fog':
        this.initFogParticles(params);
        break;
      default:
        this.initPartlyCloudyParticles(params);
    }

    // Add wind overlay particles if enabled
    if (this.scene.windOverlay) {
      this.initWindOverlayParticles(params);
    }
  },

  /**
   * Initialize clear sky particles
   */
  initClearSkyParticles(params) {
    // Light particles (max 40)
    for (let i = 0; i < 40; i++) {
      this.particles.push({
        type: 'light',
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 2 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    // Background clouds (max 5)
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * (this.canvas.height * 0.4),
        width: Math.random() * 150 + 100,
        height: Math.random() * 60 + 40,
        speed: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }
  },

  /**
   * Initialize partly cloudy particles
   */
  initPartlyCloudyParticles(params) {
    const layers = params.parallax_layers || 3;
    
    for (let layer = 0; layer < layers; layer++) {
      const layerSpeed = (layer + 1) * 0.2;
      const layerCount = 4 - layer;
      
      for (let i = 0; i < layerCount; i++) {
        this.clouds.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * (this.canvas.height * 0.5),
          width: Math.random() * 200 + 100,
          height: Math.random() * 80 + 50,
          speed: layerSpeed,
          opacity: Math.random() * 0.4 + 0.2,
          layer: layer,
        });
      }
    }
  },

  /**
   * Initialize rain particles
   */
  initRainParticles(params) {
    const rainCount = Math.min(params.rain_density || 150, 150);
    
    for (let i = 0; i < rainCount; i++) {
      this.particles.push({
        type: 'rain',
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        length: Math.random() * 15 + 10,
        speed: params.rain_speed || 8,
        opacity: Math.random() * 0.4 + 0.3,
      });
    }

    // Ripples
    for (let i = 0; i < 8; i++) {
      this.ripples.push({
        x: Math.random() * this.canvas.width,
        y: this.canvas.height - Math.random() * 50,
        radius: 0,
        maxRadius: Math.random() * 30 + 20,
        opacity: 0.5,
        speed: 0.5,
      });
    }

    // Background clouds (darker)
    for (let i = 0; i < 4; i++) {
      this.clouds.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * (this.canvas.height * 0.3),
        width: Math.random() * 200 + 150,
        height: Math.random() * 80 + 60,
        speed: Math.random() * 0.2 + 0.1,
        opacity: Math.random() * 0.2 + 0.1,
      });
    }
  },

  /**
   * Initialize thunderstorm particles
   */
  initThunderstormParticles(params) {
    const rainCount = Math.min(params.rain_density || 200, 200);
    
    for (let i = 0; i < rainCount; i++) {
      this.particles.push({
        type: 'rain',
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        length: Math.random() * 20 + 15,
        speed: params.rain_speed || 12,
        opacity: Math.random() * 0.5 + 0.4,
      });
    }

    // Dark storm clouds
    for (let i = 0; i < 6; i++) {
      this.clouds.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * (this.canvas.height * 0.4),
        width: Math.random() * 250 + 200,
        height: Math.random() * 100 + 80,
        speed: Math.random() * 0.3 + 0.2,
        opacity: Math.random() * 0.3 + 0.2,
      });
    }

    // Initialize lightning timer
    this.lightningTimer = this.getRandomLightningInterval(params);
  },

  /**
   * Initialize snow particles
   */
  initSnowParticles(params) {
    const snowCount = Math.min(params.snow_density || 80, 80);
    
    for (let i = 0; i < snowCount; i++) {
      this.particles.push({
        type: 'snow',
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 4 + 2,
        speed: params.snow_speed || 2,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
        opacity: Math.random() * 0.6 + 0.4,
      });
    }
  },

  /**
   * Initialize fog particles
   */
  initFogParticles(params) {
    const layers = params.fog_layers || 3;
    
    for (let layer = 0; layer < layers; layer++) {
      for (let i = 0; i < 5; i++) {
        this.particles.push({
          type: 'fog',
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          width: Math.random() * 300 + 200,
          height: Math.random() * 150 + 100,
          speed: Math.random() * 0.5 + 0.2,
          opacity: Math.random() * 0.3 + 0.1,
          layer: layer,
        });
      }
    }
  },

  /**
   * Initialize wind overlay particles
   */
  initWindOverlayParticles(params) {
    const streakCount = params.wind_streak_density || 30;
    
    for (let i = 0; i < streakCount; i++) {
      this.particles.push({
        type: 'wind_streak',
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        length: Math.random() * 100 + 50,
        speed: params.wind_streak_speed || 15,
        opacity: Math.random() * 0.3 + 0.1,
      });
    }

    // Leaf particles
    const leafCount = params.leaf_particle_count || 40;
    for (let i = 0; i < leafCount; i++) {
      this.particles.push({
        type: 'leaf',
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        size: Math.random() * 6 + 3,
        speedX: (params.wind_vector_x || -0.3) * 10,
        speedY: (Math.random() - 0.5) * 2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        opacity: Math.random() * 0.7 + 0.3,
      });
    }
  },

  /**
   * Get random lightning interval
   */
  getRandomLightningInterval(params) {
    const min = params.lightning_interval_min || 4000;
    const max = params.lightning_interval_max || 10000;
    return Math.random() * (max - min) + min;
  },

  /**
   * Start animation loop
   */
  startAnimationLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    const animate = (currentTime) => {
      if (this.isPaused || this.reducedMotion) {
        return;
      }

      // Calculate delta time
      const deltaTime = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;

      // Calculate FPS
      this.frameCount++;
      if (this.frameCount % 30 === 0) {
        this.fps = Math.round(1000 / deltaTime);
      }

      // Update and render
      this.update(deltaTime);
      this.render();

      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(animate);
  },

  /**
   * Update animation state
   */
  update(deltaTime) {
    const sceneType = this.scene.type;
    const params = this.scene.params;

    // Update particles
    this.particles.forEach(p => {
      switch (p.type) {
        case 'light':
          p.x += p.speedX;
          p.y += p.speedY;
          this.wrapParticle(p);
          break;
        case 'rain':
          p.y += p.speed;
          if (p.y > this.canvas.height) {
            p.y = -p.length;
            p.x = Math.random() * this.canvas.width;
          }
          break;
        case 'snow':
          p.y += p.speed;
          p.wobble += p.wobbleSpeed;
          p.x += Math.sin(p.wobble) * 0.5;
          if (p.y > this.canvas.height) {
            p.y = -p.size;
            p.x = Math.random() * this.canvas.width;
          }
          break;
        case 'fog':
          p.x += p.speed;
          this.wrapParticle(p);
          // Slow opacity shift
          p.opacity += (Math.random() - 0.5) * 0.01;
          p.opacity = Math.max(0.1, Math.min(0.4, p.opacity));
          break;
        case 'wind_streak':
          p.x += p.speed;
          if (p.x > this.canvas.width + p.length) {
            p.x = -p.length;
            p.y = Math.random() * this.canvas.height;
          }
          break;
        case 'leaf':
          p.x += p.speedX;
          p.y += p.speedY;
          p.rotation += p.rotationSpeed;
          if (p.x > this.canvas.width + p.size) {
            p.x = -p.size;
            p.y = Math.random() * this.canvas.height;
          }
          if (p.y > this.canvas.height + p.size) {
            p.y = -p.size;
          }
          break;
      }
    });

    // Update clouds
    this.clouds.forEach(c => {
      c.x += c.speed;
      if (c.x > this.canvas.width + c.width) {
        c.x = -c.width;
      }
    });

    // Update ripples
    this.ripples.forEach(r => {
      r.radius += r.speed;
      r.opacity -= 0.01;
      if (r.opacity <= 0) {
        r.radius = 0;
        r.opacity = 0.5;
        r.x = Math.random() * this.canvas.width;
        r.y = this.canvas.height - Math.random() * 50;
      }
    });

    // Update lightning for thunderstorm
    if (sceneType === 'thunderstorm') {
      this.lightningTimer -= deltaTime;
      if (this.lightningTimer <= 0 && !this.lightningActive) {
        this.triggerLightning();
        this.lightningTimer = this.getRandomLightningInterval(params);
      }
      
      if (this.lightningActive) {
        this.lightningOpacity -= 0.05;
        if (this.lightningOpacity <= 0) {
          this.lightningActive = false;
          this.lightningOpacity = 0;
        }
      }
    }
  },

  /**
   * Wrap particle around screen
   */
  wrapParticle(p) {
    if (p.x > this.canvas.width) p.x = 0;
    if (p.x < 0) p.x = this.canvas.width;
    if (p.y > this.canvas.height) p.y = 0;
    if (p.y < 0) p.y = this.canvas.height;
  },

  /**
   * Trigger lightning flash
   */
  triggerLightning() {
    this.lightningActive = true;
    this.lightningOpacity = 0.8;
  },

  /**
   * Render current frame
   */
  render() {
    if (!this.ctx) return;

    const sceneType = this.scene.type;
    const params = this.scene.params;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background
    this.drawBackground(sceneType, params);

    // Draw scene elements
    switch (sceneType) {
      case 'clear_sky':
        this.drawClearSky(params);
        break;
      case 'partly_cloudy':
        this.drawPartlyCloudy(params);
        break;
      case 'rain':
        this.drawRain(params);
        break;
      case 'thunderstorm':
        this.drawThunderstorm(params);
        break;
      case 'snow':
        this.drawSnow(params);
        break;
      case 'fog':
        this.drawFog(params);
        break;
    }

    // Draw wind overlay
    if (this.scene.windOverlay) {
      this.drawWindOverlay(params);
    }

    // Draw lightning flash
    if (this.lightningActive) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningOpacity})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  },

  /**
   * Draw background gradient
   */
  drawBackground(sceneType, params) {
    const brightness = params.sky_brightness || 0.85;
    
    let gradient;
    switch (sceneType) {
      case 'clear_sky':
        gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, `rgba(135, 206, 235, ${brightness})`);
        gradient.addColorStop(1, `rgba(176, 224, 230, ${brightness})`);
        break;
      case 'partly_cloudy':
        gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, `rgba(135, 206, 235, ${brightness})`);
        gradient.addColorStop(1, `rgba(200, 220, 230, ${brightness})`);
        break;
      case 'rain':
        gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, `rgba(70, 90, 110, ${brightness})`);
        gradient.addColorStop(1, `rgba(90, 110, 130, ${brightness})`);
        break;
      case 'thunderstorm':
        gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, `rgba(40, 50, 60, ${brightness})`);
        gradient.addColorStop(1, `rgba(50, 60, 70, ${brightness})`);
        break;
      case 'snow':
        gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, `rgba(176, 196, 222, ${brightness})`);
        gradient.addColorStop(1, `rgba(200, 210, 230, ${brightness})`);
        break;
      case 'fog':
        gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, `rgba(150, 160, 170, ${brightness})`);
        gradient.addColorStop(1, `rgba(170, 180, 190, ${brightness})`);
        break;
      default:
        gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, `rgba(135, 206, 235, ${brightness})`);
        gradient.addColorStop(1, `rgba(176, 224, 230, ${brightness})`);
    }

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  },

  /**
   * Draw clear sky elements
   */
  drawClearSky(params) {
    // Draw sun
    const sunX = this.canvas.width * 0.8;
    const sunY = this.canvas.height * 0.2;
    const sunRadius = 50;

    // Sun glow
    const glowGradient = this.ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2);
    glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
    glowGradient.addColorStop(0.5, 'rgba(255, 255, 150, 0.3)');
    glowGradient.addColorStop(1, 'rgba(255, 255, 100, 0)');
    this.ctx.fillStyle = glowGradient;
    this.ctx.fillRect(sunX - sunRadius * 2, sunY - sunRadius * 2, sunRadius * 4, sunRadius * 4);

    // Sun body
    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fill();

    // Sun rays (rotating)
    const time = performance.now() * 0.001;
    const rayLength = 30;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + time * params.sun_rotation_speed;
      const startX = sunX + Math.cos(angle) * sunRadius;
      const startY = sunY + Math.sin(angle) * sunRadius;
      const endX = sunX + Math.cos(angle) * (sunRadius + rayLength);
      const endY = sunY + Math.sin(angle) * (sunRadius + rayLength);
      
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(endX, endY);
      this.ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();
    }

    // Draw light particles
    this.particles.forEach(p => {
      if (p.type === 'light') {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 200, ${p.opacity})`;
        this.ctx.fill();
      }
    });

    // Draw background clouds
    this.clouds.forEach(c => {
      this.drawCloud(c);
    });
  },

  /**
   * Draw partly cloudy elements
   */
  drawPartlyCloudy(params) {
    // Draw partial sun
    const sunX = this.canvas.width * 0.75;
    const sunY = this.canvas.height * 0.15;
    const sunRadius = 40;

    this.ctx.beginPath();
    this.ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    this.ctx.fillStyle = 'rgba(255, 215, 0, 0.8)';
    this.ctx.fill();

    // Draw cloud layers (sorted by layer for parallax)
    const sortedClouds = [...this.clouds].sort((a, b) => a.layer - b.layer);
    sortedClouds.forEach(c => {
      this.drawCloud(c);
    });
  },

  /**
   * Draw rain elements
   */
  drawRain(params) {
    // Draw background clouds
    this.clouds.forEach(c => {
      this.drawCloud(c, true);
    });

    // Draw raindrops
    this.particles.forEach(p => {
      if (p.type === 'rain') {
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x, p.y + p.length);
        this.ctx.strokeStyle = `rgba(174, 194, 224, ${p.opacity})`;
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
      }
    });

    // Draw ripples
    this.ripples.forEach(r => {
      if (r.opacity > 0) {
        this.ctx.beginPath();
        this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        this.ctx.strokeStyle = `rgba(174, 194, 224, ${r.opacity})`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    });
  },

  /**
   * Draw thunderstorm elements
   */
  drawThunderstorm(params) {
    // Draw dark clouds
    this.clouds.forEach(c => {
      this.drawCloud(c, true);
    });

    // Draw heavy rain
    this.particles.forEach(p => {
      if (p.type === 'rain') {
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x, p.y + p.length);
        this.ctx.strokeStyle = `rgba(150, 170, 200, ${p.opacity})`;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
    });
  },

  /**
   * Draw snow elements
   */
  drawSnow(params) {
    // Draw snowflakes
    this.particles.forEach(p => {
      if (p.type === 'snow') {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        this.ctx.fill();
      }
    });

    // Draw soft haze overlay
    if (params.snow_haze) {
      this.ctx.fillStyle = `rgba(200, 210, 230, ${params.snow_haze})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  },

  /**
   * Draw fog elements
   */
  drawFog(params) {
    // Draw fog layers
    this.particles.forEach(p => {
      if (p.type === 'fog') {
        this.ctx.beginPath();
        this.ctx.ellipse(p.x, p.y, p.width, p.height, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(200, 210, 220, ${p.opacity})`;
        this.ctx.fill();
      }
    });
  },

  /**
   * Draw wind overlay
   */
  drawWindOverlay(params) {
    // Draw wind streaks
    this.particles.forEach(p => {
      if (p.type === 'wind_streak') {
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x + p.length, p.y);
        this.ctx.strokeStyle = `rgba(200, 210, 220, ${p.opacity})`;
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
      }
    });

    // Draw leaves
    this.particles.forEach(p => {
      if (p.type === 'leaf') {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, p.size, p.size / 2, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(100, 150, 100, ${p.opacity})`;
        this.ctx.fill();
        
        this.ctx.restore();
      }
    });
  },

  /**
   * Draw a cloud
   */
  drawCloud(cloud, dark = false) {
    this.ctx.beginPath();
    this.ctx.ellipse(cloud.x, cloud.y, cloud.width, cloud.height, 0, 0, Math.PI * 2);
    
    if (dark) {
      this.ctx.fillStyle = `rgba(80, 90, 100, ${cloud.opacity})`;
    } else {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
    }
    
    this.ctx.fill();
  },

  /**
   * Render static frame for reduced motion
   */
  renderStaticFrame() {
    if (!this.ctx) return;
    
    // Render current scene without animation
    this.render();
  },

  /**
   * Destroy animator and cleanup
   */
  destroy() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.particles = [];
    this.clouds = [];
    this.ripples = [];
    this.ctx = null;
    this.canvas = null;
  }
};