/**
 * animations.js — Dynamic effects module
 * Canvas particles (starfield/sakura) as persistent full-page background,
 * scroll-triggered animations, counter animations, parallax, tilt effects
 */
const Animations = (function() {

  // ===== Hero/Page Background: Starfield (Dark) + Sakura (Light) =====
  // These canvases are position:fixed and cover the entire page as a persistent background
  function initPageBackground() {
    const starfieldCanvas = document.getElementById('starfield-canvas');
    const sakuraCanvas = document.getElementById('sakura-canvas');
    if (!starfieldCanvas && !sakuraCanvas) return;

    let starfieldId, sakuraId;

    // ---- Starfield (Dark Mode) ----
    if (starfieldCanvas) {
      const ctx = starfieldCanvas.getContext('2d');
      let stars = [];
      let mouse = { x: -1000, y: -1000 };

      function resizeStarfield() {
        starfieldCanvas.width = window.innerWidth;
        starfieldCanvas.height = window.innerHeight;
      }

      function createStars() {
        const count = Math.min(Math.floor(window.innerWidth * window.innerHeight / 2500), 400);
        stars = [];
        for (let i = 0; i < count; i++) {
          stars.push({
            x: Math.random() * (starfieldCanvas.width || window.innerWidth),
            y: Math.random() * (starfieldCanvas.height || window.innerHeight),
            radius: Math.random() * 2.5 + 0.5,
            baseOpacity: Math.random() * 0.55 + 0.2,
            twinkleSpeed: Math.random() * 0.025 + 0.005,
            twinklePhase: Math.random() * Math.PI * 2,
            driftX: (Math.random() - 0.5) * 0.12,
            driftY: (Math.random() - 0.5) * 0.06,
            hue: Math.random() < 0.08 ? Math.random() * 60 + 30 : Math.random() * 40 + 200
          });
        }
      }

      function drawStarfield(timestamp) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        // Keep canvas visible but adjust opacity
        starfieldCanvas.style.opacity = isDark ? '1' : '0';

        if (!isDark) {
          starfieldId = requestAnimationFrame(drawStarfield);
          return;
        }

        ctx.clearRect(0, 0, starfieldCanvas.width, starfieldCanvas.height);
        const t = timestamp * 0.001;

        for (const s of stars) {
          const twinkle = Math.sin(t * s.twinkleSpeed * 60 + s.twinklePhase) * 0.35 + 0.65;
          const opacity = s.baseOpacity * twinkle;

          s.x += s.driftX;
          s.y += s.driftY;
          if (s.x < -10) s.x = starfieldCanvas.width + 10;
          if (s.x > starfieldCanvas.width + 10) s.x = -10;
          if (s.y < -10) s.y = starfieldCanvas.height + 10;
          if (s.y > starfieldCanvas.height + 10) s.y = -10;

          // Mouse interaction (gentle attraction)
          const dx = mouse.x - s.x;
          const dy = mouse.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150 && dist > 0) {
            s.x += dx / dist * 0.1;
            s.y += dy / dist * 0.1;
          }

          // Draw star with glow
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
          const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius * 3.5);
          glow.addColorStop(0, `rgba(147, 197, 253, ${opacity})`);
          glow.addColorStop(0.5, `rgba(147, 197, 253, ${opacity * 0.3})`);
          glow.addColorStop(1, 'rgba(147, 197, 253, 0)');
          ctx.fillStyle = glow;
          ctx.fill();
          ctx.fillStyle = `rgba(191, 219, 254, ${Math.min(opacity + 0.15, 1)})`;
          ctx.fill();
        }

        // Draw constellation-like lines between nearest bright stars
        const brightStars = stars.filter(s => s.radius > 1.3);
        ctx.strokeStyle = 'rgba(147, 197, 253, 0.03)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < brightStars.length; i++) {
          for (let j = i + 1; j < brightStars.length; j++) {
            const dx = brightStars[i].x - brightStars[j].x;
            const dy = brightStars[i].y - brightStars[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 140) {
              ctx.beginPath();
              ctx.moveTo(brightStars[i].x, brightStars[i].y);
              ctx.lineTo(brightStars[j].x, brightStars[j].y);
              ctx.stroke();
            }
          }
        }

        starfieldId = requestAnimationFrame(drawStarfield);
      }

      function handleStarMouse(e) {
        const rect = starfieldCanvas.getBoundingClientRect();
        mouse.x = e.clientX - rect.left;
        mouse.y = e.clientY - rect.top;
      }

      resizeStarfield();
      createStars();
      starfieldCanvas.addEventListener('mousemove', handleStarMouse);
      window.addEventListener('resize', function() {
        resizeStarfield();
        createStars();
      });

      // Throttle: only pause animation if page is hidden
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (starfieldId) { cancelAnimationFrame(starfieldId); starfieldId = null; }
        } else {
          if (!starfieldId) starfieldId = requestAnimationFrame(drawStarfield);
        }
      });

      starfieldId = requestAnimationFrame(drawStarfield);
    }

    // ---- Cherry Blossom / Sakura (Light Mode) ----
    if (sakuraCanvas) {
      const ctx = sakuraCanvas.getContext('2d');
      let petals = [];

      function resizeSakura() {
        sakuraCanvas.width = window.innerWidth;
        sakuraCanvas.height = window.innerHeight;
      }

      function createPetals() {
        const count = Math.min(Math.floor((sakuraCanvas.width || window.innerWidth) * (sakuraCanvas.height || window.innerHeight) / 4500), 180);
        petals = [];
        for (let i = 0; i < count; i++) {
          petals.push({
            x: Math.random() * (sakuraCanvas.width || window.innerWidth),
            y: Math.random() * (sakuraCanvas.height || window.innerHeight),
            size: Math.random() * 9 + 4,
            fallSpeed: Math.random() * 0.9 + 0.3,
            swaySpeed: Math.random() * 0.025 + 0.008,
            swayAmp: Math.random() * 35 + 15,
            swayPhase: Math.random() * Math.PI * 2,
            opacity: Math.random() * 0.35 + 0.12,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.025,
            hue: Math.random() * 25 + 345,
            saturation: Math.random() * 35 + 35
          });
        }
      }

      function drawPetal(ctx, x, y, size, rotation, color) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.35, size * 0.7, 0, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        // Subtle vein line
        ctx.beginPath();
        ctx.moveTo(0, -size * 0.5);
        ctx.lineTo(0, size * 0.3);
        ctx.strokeStyle = 'rgba(255, 200, 200, 0.25)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
      }

      function drawSakura(timestamp) {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        sakuraCanvas.style.opacity = isLight ? '1' : '0';

        if (!isLight) {
          sakuraId = requestAnimationFrame(drawSakura);
          return;
        }

        ctx.clearRect(0, 0, sakuraCanvas.width, sakuraCanvas.height);
        const t = timestamp * 0.001;

        for (const p of petals) {
          // Diagonal fall (bottom-right with sinusoidal sway)
          p.y += p.fallSpeed;
          p.x += p.fallSpeed * 0.55 + Math.sin(t * p.swaySpeed * 60 + p.swayPhase) * 0.25;

          p.rotation += p.rotSpeed;

          // Wrap around
          if (p.y > sakuraCanvas.height + 30) {
            p.y = -30;
            p.x = Math.random() * sakuraCanvas.width;
          }
          if (p.x > sakuraCanvas.width + 30) p.x = -30;
          if (p.x < -30) p.x = sakuraCanvas.width + 30;

          const color = `hsla(${p.hue}, ${p.saturation}%, 80%, ${p.opacity})`;
          drawPetal(ctx, p.x, p.y, p.size, p.rotation, color);
        }

        sakuraId = requestAnimationFrame(drawSakura);
      }

      resizeSakura();
      createPetals();
      window.addEventListener('resize', () => { resizeSakura(); createPetals(); });

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (sakuraId) { cancelAnimationFrame(sakuraId); sakuraId = null; }
        } else {
          if (!sakuraId) sakuraId = requestAnimationFrame(drawSakura);
        }
      });

      sakuraId = requestAnimationFrame(drawSakura);
    }
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

  // ===== Parallax Effect on Scroll =====
  function initParallax() {
    const parallaxElements = document.querySelectorAll('.parallax');

    if (parallaxElements.length === 0) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          parallaxElements.forEach(el => {
            const speed = parseFloat(el.getAttribute('data-parallax-speed') || '0.15');
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            if (rect.top < windowHeight && rect.bottom > 0) {
              const offset = (windowHeight - rect.top) * speed;
              el.style.transform = `translateY(${offset * 0.3}px)`;
            }
          });
          ticking = false;
        });
        ticking = true;
      }
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

  // ===== Scroll Spy (active nav link) =====
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
    }, { threshold: 0.3 });

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

  // ===== Tilt Effect for Cards =====
  function initTiltEffect() {
    const cards = document.querySelectorAll('.tilt-card');

    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

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
      const expanded = burger.classList.contains('is-active');
      burger.setAttribute('aria-expanded', expanded);
    });
  }

  // ===== Floating Particles (decorative) =====
  function initFloatingParticles() {
    // Add subtle floating dots in sections with the .floating-particles class
    document.querySelectorAll('.floating-particles').forEach(container => {
      const count = 8;
      for (let i = 0; i < count; i++) {
        const dot = document.createElement('div');
        dot.className = 'floating-dot';
        dot.style.cssText = `
          position: absolute;
          width: ${Math.random() * 6 + 3}px;
          height: ${Math.random() * 6 + 3}px;
          background: var(--primary-color);
          border-radius: 50%;
          opacity: ${Math.random() * 0.15 + 0.05};
          top: ${Math.random() * 100}%;
          left: ${Math.random() * 100}%;
          animation: float-particle ${Math.random() * 6 + 8}s ease-in-out infinite;
          animation-delay: ${Math.random() * 5}s;
        `;
        container.appendChild(dot);
      }
    });
  }

  // ===== About Horizontal Scroll Gallery auto-scroll =====
  function initAboutScroll() {
    const container = document.getElementById('about-scroll');
    if (!container) return;

    let scrollInterval;
    let scrollPos = 0;
    const speed = 0.4; // pixels per frame

    function autoScroll() {
      if (container.matches(':hover')) {
        scrollInterval = requestAnimationFrame(autoScroll);
        return;
      }
      scrollPos += speed;
      if (scrollPos >= container.scrollWidth - container.clientWidth) {
        scrollPos = 0;
      }
      container.scrollLeft = scrollPos;
      scrollInterval = requestAnimationFrame(autoScroll);
    }

    container.addEventListener('mouseenter', () => {
      if (scrollInterval) cancelAnimationFrame(scrollInterval);
    });
    container.addEventListener('mouseleave', () => {
      scrollPos = container.scrollLeft;
      scrollInterval = requestAnimationFrame(autoScroll);
    });
    container.addEventListener('touchstart', () => {
      if (scrollInterval) cancelAnimationFrame(scrollInterval);
    });

    // Start after delay
    setTimeout(() => {
      scrollInterval = requestAnimationFrame(autoScroll);
    }, 3000);
  }

  // Initialize all
  function init() {
    initPageBackground();
    initScrollReveal();
    initCounters();
    initParallax();
    initNavbarScroll();
    initScrollSpy();
    initSmoothScroll();
    initTiltEffect();
    initMobileMenu();
    initFloatingParticles();
    initAboutScroll();
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { init };
})();
