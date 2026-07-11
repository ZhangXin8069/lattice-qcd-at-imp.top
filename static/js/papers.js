/**
 * papers.js — Publications module
 * Data source: 数据.csv (root-level CSV with paper detail rows)
 * Update: manual via /update-website papers skill
 *
 * Papers count rule (要求.json):
 *   - 发表论文: sum of advisor papers where advisor is first-author OR corresponding-author (any institution)
 *   - 累计引用: sum of citations for above papers
 *   - Display list: filtered to first-unit = Lanzhou, Inst. Modern Phys.
 */
const Papers = (function() {
  let allPapers = [];
  let displayPapers = [];  // filtered for display (first-unit IMP)
  let countPapers = [];    // papers for counting
  let students = [];
  let currentFilter = 'all';
  let currentYear = 'all';
  let displayCount = 10;

  // Student list per requirements (要求.json)
  const STUDENT_NAMES = [
    'Kuan Zhang',
    'Hanyang Xing',
    'Chen Chen',
    'Yiqi Geng',
    'Chunhua Zeng',
    'Zhi-Cheng Hu',
    'Hongxin Dong',
    'Zhicheng Yan'
  ];

  async function init() {
    await loadPapers();
    renderFilters();
    renderPapers();
    setupSearch();
    updateStats();
  }

  async function loadPapers() {
    const container = document.getElementById('publications-list');
    if (container) {
      container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-light);"><i class="fas fa-spinner fa-spin"></i> Loading papers...</p>';
    }

    try {
      const resp = await fetch('数据.csv');
      if (!resp.ok) throw new Error('CSV not found');
      const text = await resp.text();

      // Parse CSV: lines starting with "论文详情" are paper records
      // Format: "论文详情", "ID", "Title", "Year", "arXiv", "DOI", "Journal", "isFirstUnitIMP"
      const papers = [];
      const lines = text.split('\n');

      for (const line of lines) {
        if (!line.startsWith('"论文详情"')) continue;

        // Simple CSV parser for quoted fields
        const fields = [];
        let inQuote = false;
        let current = '';
        for (let i = 0; i < line.length; i++) {
          const c = line[i];
          if (c === '"') {
            if (inQuote && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuote = !inQuote;
            }
          } else if (c === ',' && !inQuote) {
            fields.push(current.trim());
            current = '';
          } else {
            current += c;
          }
        }
        fields.push(current.trim());

        // fields[0]="论文详情", [1]=id, [2]=title, [3]=year, [4]=arxiv, [5]=doi, [6]=journal, [7]=isFirstUnitIMP
        if (fields.length < 8) continue;

        const isIMP = fields[7] === 'true';

        papers.push({
          id: fields[1],
          title: fields[2],
          year: fields[3] ? parseInt(fields[3], 10) : null,
          arxiv_id: fields[4],
          doi: fields[5],
          journal: fields[6],
          authors: [],
          volume: '',
          pages: '',
          citation_count: 0,
          isFirstUnitIMP: isIMP
        });
      }

      if (papers.length === 0) {
        allPapers = [];
        displayPapers = [];
        countPapers = [];
        if (container) container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-light);">论文数据不可用，请运行 /update-website papers 更新数据。</p>';
        return;
      }

      allPapers = papers;
      allPapers.sort((a, b) => (b.year || 0) - (a.year || 0));
      displayPapers = allPapers.filter(p => p.isFirstUnitIMP);
      countPapers = allPapers;
      students = STUDENT_NAMES.map(name => ({ name, papers: 0 }));

      renderFilters();
      renderPapers();
      updateStats();

    } catch (e) {
      console.error('Failed to load papers from CSV:', e);
      allPapers = [];
      displayPapers = [];
      countPapers = [];
      if (container) container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-light);">论文数据加载失败：' + e.message + '</p>';
    }
  }

  function updateStats() {
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 1) {
      const papersEl = statCards[0].querySelector('.stat-number');
      if (papersEl) papersEl.setAttribute('data-target', countPapers.length);
    }
    if (statCards.length >= 2) {
      const citEl = statCards[1].querySelector('.stat-number');
      const totalCites = countPapers.reduce((sum, p) => sum + (p.citation_count || 0), 0);
      if (citEl) citEl.setAttribute('data-target', totalCites);
    }
  }

  function renderFilters() {
    const filterContainer = document.getElementById('pub-filters');
    if (!filterContainer) return;

    const years = [...new Set(displayPapers.map(p => p.year).filter(Boolean))].sort((a, b) => b - a);

    filterContainer.innerHTML = `
      <div class="pub-filter-buttons">
        <button class="pub-filter-btn is-active" data-filter="all">${I18N.t('publications.filter.all')}</button>
        <button class="pub-filter-btn" data-filter="sun">Peng Sun</button>
        <button class="pub-filter-btn" data-filter="liu">Liuming Liu</button>
      </div>
      <div class="pub-year-filter">
        <select id="pub-year-select" aria-label="${I18N.t('publications.filter.year')}">
          <option value="all">${I18N.t('publications.filter.year')}</option>
          ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
        </select>
      </div>
    `;

    filterContainer.querySelectorAll('.pub-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterContainer.querySelectorAll('.pub-filter-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        currentFilter = btn.getAttribute('data-filter');
        displayCount = 10;
        renderPapers();
      });
    });

    const yearSelect = document.getElementById('pub-year-select');
    if (yearSelect) {
      yearSelect.addEventListener('change', () => {
        currentYear = yearSelect.value;
        displayCount = 10;
        renderPapers();
      });
    }
  }

  function getFilteredPapers() {
    return displayPapers.filter(p => {
      if (currentFilter === 'sun') {
        // Papers already include both advisors; show all in display
        return true;
      }
      if (currentFilter === 'liu') {
        return true;
      }
      if (currentYear !== 'all' && p.year !== parseInt(currentYear, 10)) return false;
      return true;
    });
  }

  function renderPapers() {
    const container = document.getElementById('publications-list');
    const noResults = document.getElementById('pub-no-results');
    if (!container) return;

    const filtered = getFilteredPapers();
    const displayed = filtered.slice(0, displayCount);

    if (filtered.length === 0) {
      container.innerHTML = '';
      if (noResults) noResults.style.display = 'block';
      const loadMoreBtn = document.getElementById('pub-load-more');
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

    if (noResults) noResults.style.display = 'none';

    container.innerHTML = displayed.map((paper, index) => {
      const journalStr = paper.journal || '';
      const links = [];
      if (paper.arxiv_id) {
        links.push(`<a href="https://arxiv.org/abs/${paper.arxiv_id}" target="_blank" class="paper-link" title="arXiv"><i class="ai ai-arxiv"></i> arXiv:${paper.arxiv_id}</a>`);
      }
      if (paper.doi) {
        links.push(`<a href="https://doi.org/${paper.doi}" target="_blank" class="paper-link" title="DOI"><i class="fas fa-link"></i> DOI</a>`);
      }
      if (paper.id) {
        links.push(`<a href="https://inspirehep.net/literature/${paper.id}" target="_blank" class="paper-link" title="INSPIRE-HEP"><i class="fas fa-external-link-alt"></i> INSPIRE</a>`);
      }

      return `
        <div class="paper-card reveal-child" style="transition-delay: ${index * 0.05}s">
          <div class="paper-year-badge">${paper.year || '-'}</div>
          <h4 class="paper-title">${escapeHtml(paper.title)}</h4>
          ${journalStr ? `<p class="paper-journal">${escapeHtml(journalStr)}</p>` : ''}
          <div class="paper-meta">
            <div class="paper-links">${links.join(' ')}</div>
          </div>
        </div>
      `;
    }).join('');

    const loadMoreBtn = document.getElementById('pub-load-more');
    if (loadMoreBtn) {
      if (displayCount < filtered.length) {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.textContent = I18N.t('publications.loadMore');
      } else {
        loadMoreBtn.style.display = 'none';
      }
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function loadMore() {
    displayCount += 10;
    renderPapers();
    document.getElementById('publications').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function setupSearch() {
    const searchInput = document.getElementById('pub-search');
    const loadMoreBtn = document.getElementById('pub-load-more');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (!query) {
          displayCount = 10;
          renderPapers();
          return;
        }

        const filtered = getFilteredPapers().filter(p =>
          (p.title && p.title.toLowerCase().includes(query)) ||
          (p.journal && p.journal.toLowerCase().includes(query))
        );

        const container = document.getElementById('publications-list');
        const noResults = document.getElementById('pub-no-results');

        if (filtered.length === 0) {
          container.innerHTML = '';
          if (noResults) noResults.style.display = 'block';
          if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        } else {
          if (noResults) noResults.style.display = 'none';
          const displayed = filtered.slice(0, displayCount);
          container.innerHTML = displayed.map((paper) => {
            const links = [];
            if (paper.arxiv_id) links.push(`<a href="https://arxiv.org/abs/${paper.arxiv_id}" target="_blank" class="paper-link">arXiv</a>`);
            if (paper.doi) links.push(`<a href="https://doi.org/${paper.doi}" target="_blank" class="paper-link">DOI</a>`);

            return `
              <div class="paper-card">
                <div class="paper-year-badge">${paper.year || '-'}</div>
                <h4 class="paper-title">${escapeHtml(paper.title)}</h4>
                ${paper.journal ? `<p class="paper-journal">${escapeHtml(paper.journal)}</p>` : ''}
                <div class="paper-links">${links.join(' ')}</div>
              </div>
            `;
          }).join('');

          if (loadMoreBtn) {
            if (displayCount < filtered.length) {
              loadMoreBtn.style.display = 'block';
            } else {
              loadMoreBtn.style.display = 'none';
            }
          }
        }
      });
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', loadMore);
    }
  }

  document.addEventListener('langChanged', () => {
    renderFilters();
    renderPapers();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    loadMore,
    getStudents: () => students,
    getPaperCount: () => countPapers.length,
    getCitationCount: () => countPapers.reduce((sum, p) => sum + (p.citation_count || 0), 0)
  };
})();
