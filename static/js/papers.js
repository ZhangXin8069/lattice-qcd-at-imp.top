/**
 * papers.js — Publications module
 * Data source: data/papers.json (auto-generated from 数据.csv)
 */
const Papers = (function() {
  let allPapers = [];
  let students = [];

  async function init() {
    await loadPapers();
    setupSearch();
  }

  async function loadPapers() {
    const container = document.getElementById('publications-list');
    if (container) {
      container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-light);"><i class="fas fa-spinner fa-spin"></i> Loading papers...</p>';
    }

    try {
      const resp = await fetch('data/papers.json');
      if (!resp.ok) throw new Error('papers.json not found');
      const data = await resp.json();

      allPapers = (data.papers || []).sort((a, b) => (b.year || 0) - (a.year || 0));
      students = data.students || [];

      if (allPapers.length === 0) {
        if (container) container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-light);">论文数据不可用</p>';
        return;
      }

      renderPapers();
      updateStats();
    } catch (e) {
      console.error('Failed to load papers:', e);
      if (container) container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-light);">论文数据加载失败</p>';
    }
  }

  function updateStats() {
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 1) {
      const el = statCards[0].querySelector('.stat-number');
      if (el) el.setAttribute('data-target', allPapers.length);
    }
    if (statCards.length >= 2) {
      const el = statCards[1].querySelector('.stat-number');
      const cites = allPapers.reduce((s, p) => s + (p.citation_count || 0), 0);
      if (el) el.setAttribute('data-target', cites);
    }
  }

  function renderPapers() {
    const container = document.getElementById('publications-list');
    const noResults = document.getElementById('pub-no-results');
    if (!container) return;

    if (allPapers.length === 0) {
      if (noResults) noResults.style.display = 'block';
      return;
    }
    if (noResults) noResults.style.display = 'none';

    container.innerHTML = allPapers.map((p, i) => {
      const authors = p.authors
        ? p.authors.split('; ').slice(0, 3).join('; ') + (p.authors.split('; ').length > 3 ? ' et al.' : '')
        : '';
      const links = [];
      if (p.arxiv_id) links.push(`<a href="https://arxiv.org/abs/${p.arxiv_id}" target="_blank" class="paper-link"><i class="ai ai-arxiv"></i> arXiv:${p.arxiv_id}</a>`);
      if (p.doi) links.push(`<a href="https://doi.org/${p.doi}" target="_blank" class="paper-link"><i class="fas fa-link"></i> DOI</a>`);
      if (p.id) links.push(`<a href="https://inspirehep.net/literature/${p.id}" target="_blank" class="paper-link"><i class="fas fa-external-link-alt"></i> INSPIRE</a>`);

      return `<div class="paper-card reveal-child" style="transition-delay:${i*0.02}s">
        <div class="paper-year-badge">${p.year||'-'}</div>
        <h4 class="paper-title">${esc(p.title)}</h4>
        ${authors?`<p class="paper-authors">${esc(authors)}</p>`:''}
        ${p.journal?`<p class="paper-journal">${esc(p.journal)}</p>`:''}
        <div class="paper-meta">
          <div class="paper-links">${links.join(' ')}</div>
          <div class="paper-citations"><span class="citation-badge">${p.citation_count||0}</span> ${I18N.t('publications.cited')}</div>
        </div>
      </div>`;
    }).join('');
  }

  function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

  function setupSearch() {
    const input = document.getElementById('pub-search');
    if (!input) return;
    input.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      if (!q) { renderPapers(); return; }
      const filtered = allPapers.filter(p =>
        (p.title&&p.title.toLowerCase().includes(q)) || (p.journal&&p.journal.toLowerCase().includes(q))
      );
      const container = document.getElementById('publications-list');
      const noResults = document.getElementById('pub-no-results');
      if (!filtered.length) {
        container.innerHTML = '';
        if (noResults) noResults.style.display = 'block';
      } else {
        if (noResults) noResults.style.display = 'none';
        container.innerHTML = filtered.map((p, i) => {
          const authors = p.authors
            ? p.authors.split('; ').slice(0, 3).join('; ') + (p.authors.split('; ').length > 3 ? ' et al.' : '')
            : '';
          const links = [];
          if (p.arxiv_id) links.push(`<a href="https://arxiv.org/abs/${p.arxiv_id}" target="_blank" class="paper-link"><i class="ai ai-arxiv"></i> arXiv:${p.arxiv_id}</a>`);
          if (p.doi) links.push(`<a href="https://doi.org/${p.doi}" target="_blank" class="paper-link"><i class="fas fa-link"></i> DOI</a>`);
          if (p.id) links.push(`<a href="https://inspirehep.net/literature/${p.id}" target="_blank" class="paper-link"><i class="fas fa-external-link-alt"></i> INSPIRE</a>`);
          return `<div class="paper-card reveal-child" style="transition-delay:${i*0.02}s">
            <div class="paper-year-badge">${p.year||'-'}</div>
            <h4 class="paper-title">${esc(p.title)}</h4>
            ${authors?`<p class="paper-authors">${esc(authors)}</p>`:''}
            ${p.journal?`<p class="paper-journal">${esc(p.journal)}</p>`:''}
            <div class="paper-meta">
              <div class="paper-links">${links.join(' ')}</div>
              <div class="paper-citations"><span class="citation-badge">${p.citation_count||0}</span> ${I18N.t('publications.cited')}</div>
            </div>
          </div>`;
        }).join('');
      }
    });
  }

  document.addEventListener('langChanged', () => renderPapers());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    getStudents: () => students,
    getPaperCount: () => allPapers.length,
    getCitationCount: () => allPapers.reduce((s, p) => s + (p.citation_count || 0), 0)
  };
})();
