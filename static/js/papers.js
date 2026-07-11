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

  async function init() {
    await loadPapers();
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
      if (!resp.ok) throw new Error('CSV not found: ' + resp.status);
      const text = await resp.text();

      // Parse CSV: match lines starting with "论文详情"
      // Format: "论文详情", id, title, authors, year, arxiv, doi, journal, citation_count, isFirstUnitIMP
      const papers = [];
      const re = /^"论文详情",\s*"(\d+)",\s*"((?:[^"]|"")*)",\s*"((?:[^"]|"")*)",\s*"(\d*)",\s*"((?:[^"]|"")*)",\s*"((?:[^"]|"")*)",\s*"((?:[^"]|"")*)",\s*"(\d*)",\s*"(true|false)"\s*$/;
      const lines = text.split(/\r?\n/);

      for (const line of lines) {
        const m = line.match(re);
        if (!m) continue;

        const authorStr = m[3].replace(/""/g, '"');
        papers.push({
          id: m[1],
          title: m[2].replace(/""/g, '"'),
          authorStr: authorStr,
          year: m[4] ? parseInt(m[4], 10) : null,
          arxiv_id: m[5].replace(/""/g, '"'),
          doi: m[6].replace(/""/g, '"'),
          journal: m[7].replace(/""/g, '"'),
          citation_count: m[8] ? parseInt(m[8], 10) : 0,
          isFirstUnitIMP: m[9] === 'true'
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
      displayPapers = allPapers;
      countPapers = allPapers;

      // Parse student data from CSV (captures Chinese + English names)
      students = [];
      const stuRe = /^"研究生",\s*"学生\d+",\s*"([^"]+)",\s*"([^"]+)",\s*"(\d+)篇论文"/;
      for (const line of lines) {
        const sm = line.match(stuRe);
        if (sm) students.push({ name_zh: sm[1], name_en: sm[2], name: sm[2], papers: parseInt(sm[3], 10) });
      }

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

  function renderPapers() {
    const container = document.getElementById('publications-list');
    const noResults = document.getElementById('pub-no-results');
    if (!container) return;

    if (displayPapers.length === 0) {
      container.innerHTML = '';
      if (noResults) noResults.style.display = 'block';
      return;
    }

    if (noResults) noResults.style.display = 'none';

    container.innerHTML = displayPapers.map((paper, index) => {
      const authorDisplay = paper.authorStr
        ? paper.authorStr.split('; ').slice(0, 3).join('; ') + (paper.authorStr.split('; ').length > 3 ? ' et al.' : '')
        : '';
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
          ${authorDisplay ? `<p class="paper-authors">${escapeHtml(authorDisplay)}</p>` : ''}
          ${journalStr ? `<p class="paper-journal">${escapeHtml(journalStr)}</p>` : ''}
          <div class="paper-meta">
            <div class="paper-links">${links.join(' ')}</div>
            <div class="paper-citations">
              <span class="citation-badge">${paper.citation_count || 0}</span> ${I18N.t('publications.cited')}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function setupSearch() {
    const searchInput = document.getElementById('pub-search');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      if (!query) { renderPapers(); return; }

      const filtered = displayPapers.filter(p =>
        (p.title && p.title.toLowerCase().includes(query)) ||
        (p.journal && p.journal.toLowerCase().includes(query))
      );

      const container = document.getElementById('publications-list');
      const noResults = document.getElementById('pub-no-results');

      if (filtered.length === 0) {
        container.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
      } else {
        if (noResults) noResults.style.display = 'none';
        container.innerHTML = filtered.map((paper, index) => {
          const authorDisplay = paper.authorStr
            ? paper.authorStr.split('; ').slice(0, 3).join('; ') + (paper.authorStr.split('; ').length > 3 ? ' et al.' : '')
            : '';
          const links = [];
          if (paper.arxiv_id) links.push(`<a href="https://arxiv.org/abs/${paper.arxiv_id}" target="_blank" class="paper-link"><i class="ai ai-arxiv"></i> arXiv:${paper.arxiv_id}</a>`);
          if (paper.doi) links.push(`<a href="https://doi.org/${paper.doi}" target="_blank" class="paper-link"><i class="fas fa-link"></i> DOI</a>`);
          if (paper.id) links.push(`<a href="https://inspirehep.net/literature/${paper.id}" target="_blank" class="paper-link"><i class="fas fa-external-link-alt"></i> INSPIRE</a>`);

          return `
            <div class="paper-card reveal-child" style="transition-delay: ${index * 0.02}s">
              <div class="paper-year-badge">${paper.year || '-'}</div>
              <h4 class="paper-title">${escapeHtml(paper.title)}</h4>
              ${authorDisplay ? `<p class="paper-authors">${escapeHtml(authorDisplay)}</p>` : ''}
              ${paper.journal ? `<p class="paper-journal">${escapeHtml(paper.journal)}</p>` : ''}
              <div class="paper-meta">
                <div class="paper-links">${links.join(' ')}</div>
                <div class="paper-citations"><span class="citation-badge">${paper.citation_count || 0}</span> ${I18N.t('publications.cited')}</div>
              </div>
            </div>
          `;
        }).join('');
      }
    });
  }

  document.addEventListener('langChanged', () => {
    renderPapers();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    getStudents: () => students,
    getPaperCount: () => countPapers.length,
    getCitationCount: () => countPapers.reduce((sum, p) => sum + (p.citation_count || 0), 0)
  };
})();
