/**
 * animations.js — Dynamic effects module
 * Canvas particles for all sections, scroll-triggered animations, counters, parallax
 *
 * Sections with canvas backgrounds (主页动效作为背景):
 *   hero, about, advisors, research, publications, students, conferences, summer-schools
 * Sections WITHOUT canvas (opacity 0.85):
 *   help (uses QCD涨落图.gif background)
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

    function resize() {
      // Cover full document height
      globalCanvas.width = window.innerWidth;
      globalCanvas.height = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        window.innerHeight
      );
    }

    function createParticles() {
      particles = [];
      const area = globalCanvas.width * globalCanvas.height;
      const density = currentTheme === 'dark' ? 8000 : 10000;

      if (currentTheme === 'dark') {
        // Starfield mode
        const count = Math.min(Math.floor(area / density), 400);
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * globalCanvas.width,
            y: Math.random() * globalCanvas.height,
            radius: Math.random() * 2.5 + 0.3,
            baseOpacity: Math.random() * 0.5 + 0.15,
            twinkleSpeed: Math.random() * 0.03 + 0.005,
            twinklePhase: Math.random() * Math.PI * 2,
            driftX: (Math.random() - 0.5) * 0.12,
            driftY: (Math.random() - 0.5) * 0.06,
            hue: Math.random() < 0.12 ? Math.random() * 60 + 30 : Math.random() * 40 + 200,
            connections: []
          });
        }
        // Pre-compute connections
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150 && Math.random() < 0.08) {
              particles[i].connections.push(j);
            }
          }
        }
      } else {
        // Sakura mode — white/pink petals falling diagonally
        const count = Math.min(Math.floor(area / density), 200);
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * globalCanvas.width,
            y: Math.random() * globalCanvas.height,
            size: Math.random() * 10 + 4,
            fallSpeed: Math.random() * 0.9 + 0.25,
            swaySpeed: Math.random() * 0.025 + 0.008,
            swayAmp: Math.random() * 40 + 12,
            swayPhase: Math.random() * Math.PI * 2,
            opacity: Math.random() * 0.35 + 0.1,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.025,
            hue: Math.random() * 30 + 345,
            saturation: Math.random() * 35 + 25,
            lightness: Math.random() * 15 + 80
          });
        }
      }
    }

    function drawStar(timestamp, p) {
      const t = timestamp * 0.001;
      const twinkle = Math.sin(t * p.twinkleSpeed * 60 + p.twinklePhase) * 0.35 + 0.65;
      const opacity = p.baseOpacity * twinkle;

      p.x += p.driftX;
      p.y += p.driftY;
      if (p.x < -20) p.x = globalCanvas.width + 20;
      if (p.x > globalCanvas.width + 20) p.x = -20;
      if (p.y < -20) p.y = globalCanvas.height + 20;
      if (p.y > globalCanvas.height + 20) p.y = -20;

      // Mouse attraction (gentle)
      const dx = mouse.x - p.x;
      const dy = mouse.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 150 && dist > 0) {
        p.x += dx / dist * 0.06;
        p.y += dy / dist * 0.06;
      }

      // Draw star with glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 3.5);
      glow.addColorStop(0, `rgba(147, 197, 253, ${opacity})`);
      glow.addColorStop(0.5, `rgba(147, 197, 253, ${opacity * 0.5})`);
      glow.addColorStop(1, 'rgba(147, 197, 253, 0)');
      ctx.fillStyle = glow;
      ctx.fill();
      ctx.fillStyle = `rgba(191, 219, 254, ${Math.min(opacity + 0.25, 1)})`;
      ctx.fill();
    }

    function drawConnections() {
      if (currentTheme !== 'dark') return;
      ctx.strokeStyle = 'rgba(147, 197, 253, 0.03)';
      ctx.lineWidth = 0.4;
      for (const p of particles) {
        for (const j of p.connections) {
          const q = particles[j];
          if (!q) continue;
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
    }

    function drawPetal(p, timestamp) {
      const t = timestamp * 0.001;

      // Diagonal fall (右下方向)
      p.y += p.fallSpeed;
      p.x += p.fallSpeed * 0.6 + Math.sin(t * p.swaySpeed * 60 + p.swayPhase) * 0.25;
      p.rotation += p.rotSpeed;

      if (p.y > globalCanvas.height + 30) {
        p.y = -30;
        p.x = Math.random() * globalCanvas.width;
      }
      if (p.x > globalCanvas.width + 30) p.x = -30;
      if (p.x < -30) p.x = globalCanvas.width + 30;

      const color = `hsla(${p.hue}, ${p.saturation}%, ${p.lightness}%, ${p.opacity})`;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      // Draw petal shape
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.3, p.size * 0.65, 0, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      // Middle vein
      ctx.beginPath();
      ctx.moveTo(0, -p.size * 0.45);
      ctx.lineTo(0, p.size * 0.25);
      ctx.strokeStyle = 'rgba(255, 200, 200, 0.25)';
      ctx.lineWidth = 0.4;
      ctx.stroke();

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
        for (const p of particles) drawStar(timestamp, p);
        drawConnections();
      } else {
        for (const p of particles) drawPetal(p, timestamp);
      }

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

  // ===== Parallax Effect =====
  function initParallax() {
    const parallaxElements = document.querySelectorAll('.parallax');

    if (parallaxElements.length === 0) return;

    window.addEventListener('scroll', () => {
      parallaxElements.forEach(el => {
        const speed = parseFloat(el.getAttribute('data-parallax-speed') || '0.3');
        const rect = el.getBoundingClientRect();
        const scrolled = window.pageYOffset;
        const offset = (scrolled - rect.top) * speed;
        el.style.transform = `translateY(${offset}px)`;
      });
    }, { passive: true });
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

  // ===== Floating particles near interactive cards =====
  function initCardParticles() {
    // Small sparkle effect on hover for cards
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
    initParallax();
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
