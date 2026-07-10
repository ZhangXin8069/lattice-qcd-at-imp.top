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

  // Load conferences section — China + CAS institutes only (per requirements)
  async function loadConferences() {
    const container = document.getElementById('conferences-timeline');
    if (!container) return;

    try {
      const resp = await fetch('data/conferences.json');
      const conferences = await resp.json();

      // Sort by date descending
      conferences.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

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

      setTimeout(() => {
        container.querySelectorAll('.reveal-child').forEach(el => el.classList.add('revealed'));
      }, 100);
    } catch (e) {
      console.error('Failed to load conferences:', e);
    }
  }

  // Load summer schools — primary data from 夏令营补充.html (per requirements)
  async function loadSummerSchools() {
    const container = document.getElementById('summer-schools-grid');
    if (!container) return;

    try {
      const resp = await fetch('custom/夏令营补充.html');
      const html = await resp.text();

      // Parse links from the HTML
      const linkRegex = /<A\s+HREF="([^"]+)"[^>]*>([^<]+)<\/A>/gi;
      const schools = [];
      let match;
      while ((match = linkRegex.exec(html)) !== null) {
        const title = match[2].trim();
        const url = match[1];

        // Extract year and date info from title
        let year = null;
        let dateStr = '';

        // Try to extract date range patterns like "8-2022年10月10日" or "9-12 October 2025"
        const dateRangeZh = title.match(/\((\d{1,2})[\s-]*(\d{4})年(\d{1,2})月(\d{1,2})日/);
        const dateRangeEn = title.match(/\((\d{1,2})[\s-]*(\d{1,2})?\s*([A-Z][a-z]+)\s*(\d{4})/);
        const yearSimpleMatch = title.match(/(\d{4})/);
        if (yearSimpleMatch) year = parseInt(yearSimpleMatch[1], 10);

        if (dateRangeZh) {
          year = parseInt(dateRangeZh[2], 10);
          dateStr = `${dateRangeZh[2]}-${dateRangeZh[3].padStart(2, '0')}-${dateRangeZh[4].padStart(2, '0')}`;
        }

        // Determine status
        const status = (year && year >= 2026) ? 'upcoming' : 'past';

        // Extract location (always China/CAS for our data)
        let location = '中国科学院';
        if (title.includes('华中师范')) location = '华中师范大学，武汉';
        else if (title.includes('理论物理')) location = '中国科学院理论物理研究所，北京';
        else if (title.includes('IHEP')) location = '中国科学院高能物理研究所，北京';
        else if (title.includes('TDLI') || title.includes('李政道')) location = '李政道研究所，上海';

        schools.push({
          name_zh: title,
          name_en: title,
          date: dateStr || `${year || ''}-01-01`,
          location_zh: location,
          location_en: location,
          topic_zh: '',
          topic_en: '',
          url: url,
          status: status
        });
      }

      if (schools.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--text-light);">暂无数据</p>';
        return;
      }

      // Sort by date descending
      schools.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

      const lang = (I18N && I18N.getLang) ? I18N.getLang() : 'zh';

      container.innerHTML = schools.map(school => {
        const name = lang === 'zh' ? school.name_zh : school.name_en;
        const location = lang === 'zh' ? school.location_zh : school.location_en;

        return `
          <div class="school-card ${school.status === 'upcoming' ? 'upcoming' : ''} reveal-child">
            ${school.date ? `<div class="school-date">${school.date}</div>` : ''}
            <div class="school-title">${name}</div>
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
      container.innerHTML = '<p style="text-align:center;color:var(--text-light);">加载失败</p>';
    }
  }

  // Load students section — uses hardcoded list from Papers module (per requirements)
  async function loadStudents() {
    const container = document.getElementById('students-grid');
    if (!container) return;

    // Wait for Papers module to finish loading
    const maxWait = 8000;
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

    // If no students loaded, use hardcoded list directly
    if (students.length === 0) {
      students = [
        { name: 'Kuan Zhang', name_zh: '张宽', papers: 0 },
        { name: 'Hanyang Xing', name_zh: '邢瀚洋', papers: 0 },
        { name: 'Chen Chen', name_zh: '陈晨', papers: 0 },
        { name: 'Yiqi Geng', name_zh: '耿一琪', papers: 0 },
        { name: 'Chunhua Zeng', name_zh: '曾春华', papers: 0 },
        { name: 'Zhi-Cheng Hu', name_zh: '胡志成', papers: 0 },
        { name: 'Hongxin Dong', name_zh: '董鸿鑫', papers: 0 },
        { name: 'Zhicheng Yan', name_zh: '阎志程', papers: 0 }
      ];
    }

    // Color palette for avatar gradient backgrounds
    const gradients = [
      'linear-gradient(135deg, #667eea, #764ba2)',
      'linear-gradient(135deg, #f093fb, #f5576c)',
      'linear-gradient(135deg, #4facfe, #00f2fe)',
      'linear-gradient(135deg, #43e97b, #38f9d7)',
      'linear-gradient(135deg, #fa709a, #fee140)',
      'linear-gradient(135deg, #a18cd1, #fbc2eb)',
      'linear-gradient(135deg, #fccb90, #d57eeb)',
      'linear-gradient(135deg, #e0c3fc, #8ec5fc)'
    ];

    container.innerHTML = students.map((student, index) => {
      const initials = student.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const displayName = lang === 'zh' && student.name_zh ? student.name_zh : student.name;
      const gradient = gradients[index % gradients.length];

      return `
        <div class="student-card reveal-child">
          <div class="student-avatar-placeholder" style="background: ${gradient};">${initials}</div>
          <div class="student-name">${displayName}</div>
          <div class="student-info">${student.name}</div>
          <span class="student-paper-count">${student.papers} ${lang === 'zh' ? '篇论文' : 'papers'}</span>
        </div>
      `;
    }).join('');

    setTimeout(() => {
      container.querySelectorAll('.reveal-child').forEach(el => el.classList.add('revealed'));
    }, 100);
  }

  // ===== Global Search =====
  function initGlobalSearch() {
    const modal = document.getElementById('search-modal');
    const input = document.getElementById('search-input');
    const results = document.getElementById('search-results');
    const toggleBtn = document.getElementById('search-toggle');
    const closeBtn = document.getElementById('search-close');
    const backdrop = modal ? modal.querySelector('.search-backdrop') : null;

    if (!modal || !input || !results) return;

    let debounceTimer = null;

    function t(key, fallback) {
      try { return (typeof I18N !== 'undefined' && I18N.t) ? I18N.t(key) : fallback; }
      catch(e) { return fallback; }
    }

    function buildSearchIndex() {
      var index = [];
      var sections = document.querySelectorAll('section[id]');
      sections.forEach(function(section) {
        var id = section.id;
        var titleEl = section.querySelector('.section-title, h2, h3');
        var sectionName = titleEl ? titleEl.textContent.trim() : id;
        var navItem = document.querySelector('.navbar-item[href="#' + id + '"]');
        if (navItem) sectionName = navItem.textContent.trim();

        var textBlocks = [];
        var fullText = section.innerText || section.textContent || '';
        var lines = fullText.split('\n').filter(function(l) {
          return l.trim().length > 3;
        });
        textBlocks = lines;

        var cards = section.querySelectorAll('.paper-card, .advisor-card, .research-card, .software-card, .student-card, .timeline-item, .school-card');
        for (var c = 0; c < cards.length; c++) {
          var cardText = cards[c].textContent.trim();
          if (cardText.length > 5) textBlocks.push(cardText);
        }

        if (textBlocks.length > 0) {
          index.push({
            sectionId: id,
            sectionName: sectionName,
            texts: textBlocks
          });
        }
      });
      return index;
    }

    function escapeRegex(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function openSearch() {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      input.value = '';
      results.innerHTML = '<p class="search-hint">' + t('search.hint', '输入关键词搜索导师、论文、研究方向、会议等内容') + '</p>';
      setTimeout(function() { input.focus(); }, 100);
    }

    function closeSearch() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      input.value = '';
    }

    function performSearch() {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function() {
        var query = input.value.trim().toLowerCase();
        if (!query) {
          results.innerHTML = '<p class="search-hint">' + t('search.hint', '输入关键词搜索导师、论文、研究方向、会议等内容') + '</p>';
          return;
        }

        var searchIndex = buildSearchIndex();
        var matches = [];

        for (var i = 0; i < searchIndex.length; i++) {
          var sec = searchIndex[i];
          for (var j = 0; j < sec.texts.length; j++) {
            var text = sec.texts[j];
            var lowerText = text.toLowerCase();
            var idx = lowerText.indexOf(query);
            if (idx !== -1) {
              var start = Math.max(0, idx - 50);
              var end = Math.min(text.length, idx + query.length + 50);
              var context = text.substring(start, end);
              if (start > 0) context = '...' + context;
              if (end < text.length) context = context + '...';

              var div = document.createElement('div');
              div.textContent = context;
              var safeContext = div.innerHTML;
              var safeQuery = escapeRegex(query);
              var highlighted = safeContext.replace(
                new RegExp('(' + safeQuery + ')', 'gi'),
                '<mark>$1</mark>'
              );

              matches.push({
                sectionId: sec.sectionId,
                sectionName: sec.sectionName,
                context: highlighted
              });
              break;
            }
          }
        }

        if (matches.length === 0) {
          results.innerHTML = '<p class="search-no-results">🔍 ' + t('search.noResults', '未找到相关结果') + '</p>';
        } else {
          var html = '';
          for (var m = 0; m < Math.min(matches.length, 15); m++) {
            var match = matches[m];
            html += '<a class="search-result-item" href="#' + match.sectionId + '">';
            html += '<div class="search-result-section">' + match.sectionName + '</div>';
            html += '<div class="search-result-context">' + match.context + '</div>';
            html += '</a>';
          }
          results.innerHTML = html;
        }
      }, 150);
    }

    if (toggleBtn) toggleBtn.addEventListener('click', openSearch);
    if (closeBtn) closeBtn.addEventListener('click', closeSearch);
    if (backdrop) backdrop.addEventListener('click', closeSearch);
    input.addEventListener('input', performSearch);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeSearch();
        return;
      }
      var activeTag = document.activeElement ? document.activeElement.tagName : '';
      var isInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';
      if (!isInput && ((e.ctrlKey && e.key === 'k') || e.key === '/')) {
        e.preventDefault();
        openSearch();
      }
    });

    results.addEventListener('click', function(e) {
      var item = e.target.closest('.search-result-item');
      if (!item) return;
      e.preventDefault();
      var targetId = item.getAttribute('href');
      if (targetId && targetId.startsWith('#')) {
        closeSearch();
        var target = document.getElementById(targetId.substring(1));
        if (target) {
          setTimeout(function() {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
        }
      }
    });
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

  // Work reports slideshow
  function initSlideshow() {
    const wrapper = document.getElementById('slides-wrapper');
    const dotsContainer = document.getElementById('slide-dots');
    const prevBtn = document.getElementById('slide-prev');
    const nextBtn = document.getElementById('slide-next');

    if (!wrapper || !dotsContainer) return;

    const slides = wrapper.querySelectorAll('.slide');
    const totalSlides = slides.length;
    if (totalSlides === 0) return;

    let currentSlide = 0;
    let autoPlayInterval;

    for (let i = 0; i < totalSlides; i++) {
      const dot = document.createElement('button');
      dot.className = 'slide-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.addEventListener('click', () => goToSlide(i));
      dotsContainer.appendChild(dot);
    }

    function goToSlide(index) {
      currentSlide = ((index % totalSlides) + totalSlides) % totalSlides;
      wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
      dotsContainer.querySelectorAll('.slide-dot').forEach((d, i) => {
        d.classList.toggle('active', i === currentSlide);
      });
    }

    function nextSlide() { goToSlide(currentSlide + 1); }
    function prevSlide() { goToSlide(currentSlide - 1); }

    function startAutoPlay() {
      stopAutoPlay();
      autoPlayInterval = setInterval(nextSlide, 4000);
    }

    function stopAutoPlay() {
      if (autoPlayInterval) { clearInterval(autoPlayInterval); autoPlayInterval = null; }
    }

    if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); startAutoPlay(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); startAutoPlay(); });

    let touchStartX = 0;
    const slideshowContainer = document.getElementById('work-reports-slideshow');
    if (slideshowContainer) {
      slideshowContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        stopAutoPlay();
      }, { passive: true });
      slideshowContainer.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) nextSlide();
          else prevSlide();
        }
        startAutoPlay();
      });
    }

    startAutoPlay();

    if (slideshowContainer) {
      slideshowContainer.addEventListener('mouseenter', stopAutoPlay);
      slideshowContainer.addEventListener('mouseleave', startAutoPlay);
    }
  }

  // Clickable image fullscreen
  function initClickableImages() {
    document.addEventListener('click', (e) => {
      const img = e.target.closest('.clickable-img');
      if (!img) return;

      const overlay = document.createElement('div');
      overlay.className = 'image-fullscreen-overlay';
      const fullImg = document.createElement('img');
      fullImg.src = img.src;
      fullImg.alt = img.alt;
      overlay.appendChild(fullImg);
      overlay.addEventListener('click', () => overlay.remove());
      document.addEventListener('keydown', function closeOnEsc(ev) {
        if (ev.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', closeOnEsc); }
      });
      document.body.appendChild(overlay);
    });
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
    initGlobalSearch();
    initScrollToTop();
    initLightbox();
    initSlideshow();
    initClickableImages();
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
