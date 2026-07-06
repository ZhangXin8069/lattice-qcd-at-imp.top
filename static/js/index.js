/**
 * index.js — Main controller for Lattice QCD Group Website
 * Ties together all modules and handles global interactions
 */
(function() {
  'use strict';

  // Scroll to top
  window.scrollToTop = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Initialize scroll-to-top button
  function initScrollToTop() {
    const btn = document.querySelector('.scroll-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });
  }

  // Gallery lightbox
  function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    if (!lightbox || !lightboxImg) return;

    document.querySelectorAll('.gallery-item[data-src]').forEach(item => {
      item.addEventListener('click', () => {
        lightboxImg.src = item.getAttribute('data-src');
        lightbox.classList.add('active');
      });
    });

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
        lightbox.classList.remove('active');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        lightbox.classList.remove('active');
      }
    });
  }

  // Load conferences section
  async function loadConferences() {
    const container = document.getElementById('conferences-timeline');
    if (!container) return;

    try {
      const resp = await fetch('data/conferences.json');
      const conferences = await resp.json();

      const lang = (I18N && I18N.getLang) ? I18N.getLang() : 'zh';
      const upcomingHTML = [];
      const pastHTML = [];

      conferences.forEach(conf => {
        const name = lang === 'zh' ? conf.name_zh : conf.name_en;
        const location = lang === 'zh' ? conf.location_zh : conf.location_en;
        const tags = (lang === 'zh' ? conf.tags_zh : conf.tags_en) || [];
        const dateStr = conf.endDate
          ? `${conf.date} – ${conf.endDate}`
          : conf.date;

        const itemHTML = `
          <div class="timeline-item ${conf.status === 'upcoming' ? 'upcoming' : ''} reveal-child">
            <div class="timeline-date">${dateStr}</div>
            <div class="timeline-title">${name}</div>
            <div class="timeline-location"><i class="fas fa-map-marker-alt"></i> ${location}</div>
            <div class="timeline-tags">${tags.map(t => `<span class="timeline-tag">${t}</span>`).join('')}</div>
            ${conf.url ? `<a href="${conf.url}" target="_blank" class="timeline-link">${lang === 'zh' ? '查看详情' : 'Details'} <i class="fas fa-external-link-alt"></i></a>` : ''}
          </div>
        `;

        if (conf.status === 'upcoming') {
          upcomingHTML.push(itemHTML);
        } else {
          pastHTML.push(itemHTML);
        }
      });

      const upcomingTitle = lang === 'zh' ? '即将举行' : 'Upcoming';
      const pastTitle = lang === 'zh' ? '已举办' : 'Past';

      container.innerHTML = `
        ${upcomingHTML.length > 0 ? `<h4 class="timeline-section-title">🟢 ${upcomingTitle}</h4>${upcomingHTML.join('')}` : ''}
        ${upcomingHTML.length > 0 && pastHTML.length > 0 ? '<hr style="margin: 2rem 0; border-color: var(--border-color);">' : ''}
        ${pastHTML.length > 0 ? `<h4 class="timeline-section-title">📅 ${pastTitle}</h4>${pastHTML.join('')}` : ''}
      `;

      // Trigger reveal animations for new elements
      setTimeout(() => {
        container.querySelectorAll('.reveal-child').forEach(el => el.classList.add('revealed'));
      }, 100);
    } catch (e) {
      console.error('Failed to load conferences:', e);
    }
  }

  // Load summer schools section
  async function loadSummerSchools() {
    const container = document.getElementById('summer-schools-grid');
    if (!container) return;

    try {
      const resp = await fetch('data/summer-schools.json');
      const schools = await resp.json();

      const lang = (I18N && I18N.getLang) ? I18N.getLang() : 'zh';

      container.innerHTML = schools.map(school => {
        const name = lang === 'zh' ? school.name_zh : school.name_en;
        const location = lang === 'zh' ? school.location_zh : school.location_en;
        const topic = lang === 'zh' ? school.topic_zh : school.topic_en;
        const dateStr = school.endDate
          ? `${school.date} – ${school.endDate}`
          : school.date;

        return `
          <div class="school-card ${school.status === 'upcoming' ? 'upcoming' : ''} reveal-child">
            <div class="school-date">${dateStr}</div>
            <div class="school-title">${name}</div>
            <div class="school-topic">📚 ${topic}</div>
            <div class="school-location"><i class="fas fa-map-marker-alt"></i> ${location}</div>
            ${school.url ? `<a href="${school.url}" target="_blank" class="school-link">${lang === 'zh' ? '了解更多' : 'Learn More'} <i class="fas fa-external-link-alt"></i></a>` : ''}
          </div>
        `;
      }).join('');

      setTimeout(() => {
        container.querySelectorAll('.reveal-child').forEach(el => el.classList.add('revealed'));
      }, 100);
    } catch (e) {
      console.error('Failed to load summer schools:', e);
    }
  }

  // Load students section - waits for Papers module to load data
  async function loadStudents() {
    const container = document.getElementById('students-grid');
    if (!container) return;

    // Wait a bit for Papers module to finish loading from INSPIRE-HEP
    const maxWait = 10000;
    const start = Date.now();
    let students = [];
    while (Date.now() - start < maxWait) {
      if (typeof Papers !== 'undefined' && Papers.getStudents) {
        students = Papers.getStudents();
        if (students.length > 0) break;
      }
      await new Promise(r => setTimeout(r, 500));
    }

    const lang = (I18N && I18N.getLang) ? I18N.getLang() : 'zh';

    if (students.length === 0) {
      container.innerHTML = `<p class="student-placeholder">${lang === 'zh' ? '研究生数据加载中...' : 'Student data loading...'}</p>`;
      return;
    }

    container.innerHTML = students.map(student => {
      const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      return `
        <div class="student-card reveal-child">
          <div class="student-avatar-placeholder">${initials}</div>
          <div class="student-name">${student.name}</div>
          <span class="student-paper-count">${student.papers} ${lang === 'zh' ? '篇论文' : 'papers'}</span>
        </div>
      `;
    }).join('');

    setTimeout(() => {
      container.querySelectorAll('.reveal-child').forEach(el => el.classList.add('revealed'));
    }, 100);
  }

  // Theme toggle handler
  function setupThemeToggle() {
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        if (typeof Theme !== 'undefined') Theme.toggle();
      });
    }
  }

  // Language toggle handler
  function setupLangToggle() {
    const btn = document.getElementById('lang-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        if (typeof I18N !== 'undefined') I18N.toggle();
      });
    }
  }

  // Re-render dynamic sections on language change
  document.addEventListener('langChanged', () => {
    loadConferences();
    loadSummerSchools();
    loadStudents();
  });

  // Initialize everything on DOM ready
  function init() {
    setupThemeToggle();
    setupLangToggle();
    initScrollToTop();
    initLightbox();
    loadConferences();
    loadSummerSchools();
    loadStudents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
