/**
 * animations.js — Dynamic effects module
 * Canvas particles for all sections, scroll-triggered animations, counters, parallax
 *
 * Sections with canvas backgrounds (主页动效作为背景):
 *   hero, about, advisors, research, publications, students, conferences, summer-schools
 * Sections WITHOUT canvas (opacity 0.85):
 *   help (uses QCD涨落图.gif background)
 *
 * Updated per 要求.json:
 *   Dark mode: starfield (参考 web-animations demo)
 *   Light mode: white bg sakura rain falling diagonally (白底樱花雨,斜向下飘落)
 */
const Animations = (function() {

  // ===== Global Section Canvas (behind all content sections) =====
  function initGlobalCanvas() {
    const body = document.body;

    // Create a single global background canvas that covers all sections
    const globalCanvas = document.createElement('canvas');
    globalCanvas.id = 'global-bg-canvas';
    globalCanvas.className = 'global-bg-canvas';
    globalCanvas.setAttribute('aria-hidden', 'true');
    body.insertBefore(globalCanvas, body.firstChild);

    const ctx = globalCanvas.getContext('2d');
    let particles = [];
    let animId = null;
    let mouse = { x: -1000, y: -1000 };
    let currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    let shootingStars = [];
    let lastTimestamp = 0;

    function resize() {
      globalCanvas.width = window.innerWidth;
      globalCanvas.height = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight
      );
    }

    function createParticles() {
      particles = [];
      shootingStars = [];
      const area = globalCanvas.width * globalCanvas.height;

      if (currentTheme === 'dark') {
        // Starfield mode — rich starry sky with twinkling stars and occasional shooting stars
        const count = Math.min(Math.floor(area / 6000), 500);
        for (let i = 0; i < count; i++) {
          const size = Math.random();
          // Small, medium, large star distribution
          let radius, baseOpacity;
          if (size < 0.7) {
            radius = Math.random() * 1.2 + 0.2;
            baseOpacity = Math.random() * 0.35 + 0.1;
          } else if (size < 0.92) {
            radius = Math.random() * 1.8 + 0.8;
            baseOpacity = Math.random() * 0.45 + 0.25;
          } else {
            radius = Math.random() * 2.5 + 1.5;
            baseOpacity = Math.random() * 0.5 + 0.35;
          }

          particles.push({
            x: Math.random() * globalCanvas.width,
            y: Math.random() * globalCanvas.height,
            radius: radius,
            baseOpacity: baseOpacity,
            // Each star has its own twinkle personality
            twinkleSpeed: Math.random() * 0.025 + 0.004,
            twinklePhase: Math.random() * Math.PI * 2,
            twinkleAmp: Math.random() * 0.4 + 0.15,
            // Slow drift
            driftX: (Math.random() - 0.5) * 0.08,
            driftY: (Math.random() - 0.5) * 0.04,
            // Color: mostly cool blue/white, occasional warm yellow
            hue: Math.random() < 0.08 ? Math.random() * 50 + 35 : Math.random() * 35 + 205,
            saturation: Math.random() * 20,
            connections: []
          });
        }
        // Pre-compute connections for nearby stars
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 130 && Math.random() < 0.06) {
              particles[i].connections.push(j);
            }
          }
        }
      } else {
        // Sakura mode — cherry blossom petals falling diagonally on white background
        const count = Math.min(Math.floor(area / 7000), 300);
        for (let i = 0; i < count; i++) {
          const petalType = Math.random();
          particles.push({
            x: Math.random() * globalCanvas.width,
            y: Math.random() * globalCanvas.height,
            // Petal size variation
            size: petalType < 0.5
              ? Math.random() * 8 + 4    // small petals
              : Math.random() * 12 + 6,   // medium-large petals
            // Fall speed — diagonal downward-right
            fallSpeed: Math.random() * 0.7 + 0.2,
            // Horizontal drift component
            driftX: Math.random() * 0.35 + 0.1,
            // Sway oscillation
            swaySpeed: Math.random() * 0.02 + 0.006,
            swayAmp: Math.random() * 35 + 8,
            swayPhase: Math.random() * Math.PI * 2,
            // Visual properties
            opacity: Math.random() * 0.3 + 0.08,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.02,
            // Color: pink spectrum
            hue: Math.random() * 28 + 345,        // 345-13 degrees (pink-red)
            saturation: Math.random() * 30 + 20,   // 20-50%
            lightness: Math.random() * 14 + 83,     // 83-97% (light pink)
            // Petal shape type
            petalType: petalType < 0.5 ? 'small' : 'large'
          });
        }
      }
    }

    // Draw a single star with glow and twinkle
    function drawStar(timestamp, p) {
      const t = timestamp * 0.001;
      const twinkle = Math.sin(t * p.twinkleSpeed * 60 + p.twinklePhase) * p.twinkleAmp + (1 - p.twinkleAmp);
      const opacity = Math.max(0.02, p.baseOpacity * twinkle);

      // Gentle drift
      p.x += p.driftX;
      p.y += p.driftY;
      if (p.x < -30) p.x = globalCanvas.width + 30;
      if (p.x > globalCanvas.width + 30) p.x = -30;
      if (p.y < -30) p.y = globalCanvas.height + 30;
      if (p.y > globalCanvas.height + 30) p.y = -30;

      // Subtle mouse attraction
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 140 && dist > 0) {
        p.x += (dx / dist) * 0.04;
        p.y += (dy / dist) * 0.04;
      }

      const starColor = `hsla(${p.hue}, ${p.saturation}%, 75%, ${opacity})`;

      // Draw star core
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

      // Glow gradient
      const glowRadius = p.radius * 4;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
      const glowBase = `hsla(${p.hue}, ${p.saturation}%, 80%`;
      glow.addColorStop(0, `${glowBase}, ${opacity})`);
      glow.addColorStop(0.3, `${glowBase}, ${opacity * 0.6})`);
      glow.addColorStop(0.7, `${glowBase}, ${opacity * 0.15})`);
      glow.addColorStop(1, `${glowBase}, 0)`);
      ctx.fillStyle = glow;
      ctx.fill();

      // Bright core for larger stars
      if (p.radius > 1.2) {
        ctx.fillStyle = `rgba(220, 235, 255, ${Math.min(opacity + 0.3, 1)})`;
        ctx.fill();
      }
    }

    // Draw connections between stars (constellation lines)
    function drawConnections() {
      if (currentTheme !== 'dark') return;
      for (const p of particles) {
        for (const j of p.connections) {
          const q = particles[j];
          if (!q) continue;
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            const alpha = 0.04 * (1 - dist / 140);
            ctx.strokeStyle = `rgba(147, 197, 253, ${alpha})`;
            ctx.lineWidth = 0.35;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
    }

    // Spawn occasional shooting stars
    function spawnShootingStar() {
      if (currentTheme !== 'dark') return;
      if (Math.random() > 0.004) return; // ~0.4% chance per frame

      const startX = Math.random() * globalCanvas.width * 0.8;
      const startY = Math.random() * globalCanvas.height * 0.4;
      const angle = Math.random() * 0.5 + 0.15; // shallow diagonal
      const length = Math.random() * 120 + 60;
      const speed = Math.random() * 8 + 5;

      shootingStars.push({
        x: startX,
        y: startY,
        angle: angle,
        length: length,
        speed: speed,
        life: 1.0, // fade from 1 to 0
        decay: 0.015 + Math.random() * 0.02
      });
    }

    function drawShootingStars() {
      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const s = shootingStars[i];
        s.x += Math.cos(s.angle) * s.speed;
        s.y += Math.sin(s.angle) * s.speed;
        s.life -= s.decay;

        if (s.life <= 0) {
          shootingStars.splice(i, 1);
          continue;
        }

        const endX = s.x - Math.cos(s.angle) * s.length;
        const endY = s.y - Math.sin(s.angle) * s.length;

        const grad = ctx.createLinearGradient(s.x, s.y, endX, endY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${s.life * 0.9})`);
        grad.addColorStop(0.3, `rgba(200, 220, 255, ${s.life * 0.5})`);
        grad.addColorStop(1, `rgba(147, 197, 253, 0)`);

        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Bright head
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.life})`;
        ctx.fill();
      }
    }

    // Draw a cherry blossom petal with organic shape
    function drawPetal(p, timestamp) {
      const t = timestamp * 0.001;

      // Diagonal fall downward-right (斜向下飘落)
      p.y += p.fallSpeed;
      p.x += p.driftX + Math.sin(t * p.swaySpeed * 60 + p.swayPhase) * 0.3;
      p.rotation += p.rotSpeed;

      // Wrap around edges
      if (p.y > globalCanvas.height + 40) {
        p.y = -40;
        p.x = Math.random() * globalCanvas.width;
      }
      if (p.x > globalCanvas.width + 40) p.x = -40;
      if (p.x < -40) p.x = globalCanvas.width + 40;

      // Subtle mouse repulsion (petals pushed away from cursor)
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100 && dist > 0) {
        p.x += (dx / dist) * 0.5;
        p.y += (dy / dist) * 0.5;
      }

      const color = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${p.opacity})`;
      const shadowColor = `hsla(${p.hue}, ${Math.min(p.saturation + 10, 60)}%, ${Math.max(p.lightness - 20, 60)}%, ${p.opacity * 0.4})`;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      const s = p.size;

      if (p.petalType === 'large') {
        // Five-petal cherry blossom shape
        const petalCount = 5;
        const innerRadius = s * 0.15;

        ctx.beginPath();
        for (let i = 0; i < petalCount; i++) {
          const angle = (i / petalCount) * Math.PI * 2 - Math.PI / 2;
          const nextAngle = ((i + 1) / petalCount) * Math.PI * 2 - Math.PI / 2;
          const midAngle = angle + (nextAngle - angle) / 2;

          // Outer point
          const ox = Math.cos(angle) * s * 0.45;
          const oy = Math.sin(angle) * s * 0.45;

          // Control point for rounded petal
          const cx = Math.cos(midAngle) * s * 0.55;
          const cy = Math.sin(midAngle) * s * 0.55;

          // Notch between petals
          const nx = Math.cos(midAngle) * s * 0.18;
          const ny = Math.sin(midAngle) * s * 0.18;

          if (i === 0) {
            ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
          }

          // Rounded petal with notch
          ctx.quadraticCurveTo(cx, cy, ox, oy);
          ctx.quadraticCurveTo(nx, ny, Math.cos(nextAngle) * innerRadius, Math.sin(nextAngle) * innerRadius);
        }
        ctx.closePath();

        // Fill with gradient
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.5);
        grad.addColorStop(0, `hsla(${p.hue}, ${p.saturation + 5}%, ${p.lightness + 3}%, ${p.opacity * 1.3})`);
        grad.addColorStop(0.6, color);
        grad.addColorStop(1, shadowColor);
        ctx.fillStyle = grad;
        ctx.fill();

        // Subtle outline
        ctx.strokeStyle = `hsla(${p.hue}, 40%, 80%, ${p.opacity * 0.3})`;
        ctx.lineWidth = 0.4;
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.08, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 60%, 70%, ${p.opacity * 0.5})`;
        ctx.fill();
      } else {
        // Simple small petal (ellipse with vein)
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.25, s * 0.55, 0, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Vein
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.35);
        ctx.lineTo(0, s * 0.2);
        ctx.strokeStyle = `rgba(255, 180, 190, ${p.opacity * 0.25})`;
        ctx.lineWidth = 0.35;
        ctx.stroke();
      }

      ctx.restore();
    }

    function draw(timestamp) {
      const theme = document.documentElement.getAttribute('data-theme') || 'light';

      if (theme !== currentTheme) {
        currentTheme = theme;
        createParticles();
      }

      ctx.clearRect(0, 0, globalCanvas.width, globalCanvas.height);

      if (currentTheme === 'dark') {
        // Draw background starfield
        for (const p of particles) drawStar(timestamp, p);
        drawConnections();
        spawnShootingStar();
        drawShootingStars();
      } else {
        // Draw sakura petals
        for (const p of particles) drawPetal(p, timestamp);
      }

      lastTimestamp = timestamp;
      animId = requestAnimationFrame(draw);
    }

    function handleMouse(e) {
      const rect = globalCanvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left + window.pageXOffset;
      mouse.y = e.clientY - rect.top + window.pageYOffset;
    }

    resize();
    createParticles();
    document.addEventListener('mousemove', handleMouse, { passive: true });
    window.addEventListener('resize', () => { resize(); createParticles(); });

    // Watch for content changes that affect document height
    const heightObserver = new ResizeObserver(() => {
      resize();
    });
    heightObserver.observe(document.body);

    // Theme change listener
    const themeObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-theme') {
          currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
          createParticles();
        }
      }
    });
    themeObserver.observe(document.documentElement, { attributes: true });

    // Visibility API — pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (animId) { cancelAnimationFrame(animId); animId = null; }
      } else {
        if (!animId) animId = requestAnimationFrame(draw);
      }
    });

    // Start animation
    animId = requestAnimationFrame(draw);
  }

  // ===== Hero-specific background (higher quality, more particles) =====
  function initHeroBackground() {
    const hero = document.getElementById('hero');
    if (!hero) return;

    // The global canvas already covers hero — remove separate hero canvases
    const starfieldCanvas = document.getElementById('starfield-canvas');
    const sakuraCanvas = document.getElementById('sakura-canvas');
    if (starfieldCanvas) starfieldCanvas.style.display = 'none';
    if (sakuraCanvas) sakuraCanvas.style.display = 'none';
  }

  // ===== Scroll-Triggered Reveal Animations =====
  function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-up');

    if (revealElements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');

          const children = entry.target.querySelectorAll('.reveal-child');
          children.forEach((child, index) => {
            child.style.transitionDelay = `${index * 0.08}s`;
            child.classList.add('revealed');
          });

          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  }

  // ===== Counter Animations =====
  function initCounters() {
    const counters = document.querySelectorAll('.counter[data-target]');

    if (counters.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = parseInt(counter.getAttribute('data-target'), 10);
          const duration = 2000;
          const start = performance.now();

          function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(eased * target);
            counter.textContent = current.toLocaleString();

            if (progress < 1) {
              requestAnimationFrame(update);
            }
          }

          requestAnimationFrame(update);
          observer.unobserve(counter);
        }
      });
    }, { threshold: 0.5 });

    counters.forEach(el => observer.observe(el));
  }

  // ===== Navbar Scroll Effect =====
  function initNavbarScroll() {
    const navbar = document.getElementById('main-navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // ===== Scroll Spy =====
  function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.navbar-item[href^="#"]');

    if (sections.length === 0 || navLinks.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    }, { threshold: 0.25 });

    sections.forEach(section => observer.observe(section));
  }

  // ===== Smooth Scroll for Nav Links =====
  function initSmoothScroll() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;

      const targetId = link.getAttribute('href').slice(1);
      if (!targetId) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      e.preventDefault();

      const burger = document.getElementById('navbar-burger');
      const menu = document.getElementById('navbar-menu');
      if (burger && menu && burger.classList.contains('is-active')) {
        burger.classList.remove('is-active');
        menu.classList.remove('is-active');
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // ===== Tilt Effect for Advisor Cards =====
  function initTiltEffect() {
    const cards = document.querySelectorAll('.tilt-card');

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      });
    });
  }

  // ===== Mobile Menu Toggle =====
  function initMobileMenu() {
    const burger = document.getElementById('navbar-burger');
    const menu = document.getElementById('navbar-menu');

    if (!burger || !menu) return;

    burger.addEventListener('click', () => {
      burger.classList.toggle('is-active');
      menu.classList.toggle('is-active');
    });
  }

  // ===== Card hover glow =====
  function initCardParticles() {
    document.querySelectorAll('.advisor-card, .research-card, .software-card, .student-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        card.style.setProperty('--card-glow', '1');
      });
      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--card-glow', '0');
      });
    });
  }

  // Initialize all
  function init() {
    initGlobalCanvas();
    initHeroBackground();
    initScrollReveal();
    initCounters();
    initNavbarScroll();
    initScrollSpy();
    initSmoothScroll();
    initTiltEffect();
    initMobileMenu();
    initCardParticles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init };
})();
