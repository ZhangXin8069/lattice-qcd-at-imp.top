/**
 * papers.js — Publications module
 * Data source: data/papers.json (auto-generated from 数据.csv)
 */
const Papers = (function() {
  let allPapers = [];
  let students = [];

  function t(key) {
    try { return (typeof I18N !== 'undefined' && I18N.t) ? I18N.t(key) : key; }
    catch(e) { return key; }
  }

  function init() {
    loadPapers();
  }

  function loadPapers() {
    const container = document.getElementById('publications-list');
    if (container) container.innerHTML = '<p style="text-align:center;padding:2rem;"><i class="fas fa-spinner fa-spin"></i> Loading...</p>';

    fetch('data/papers.json')
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(data => {
        allPapers = (data.papers || []).sort((a, b) => (b.year || 0) - (a.year || 0));
        students = data.students || [];
        if (!allPapers.length) { if (container) container.innerHTML = '<p style="text-align:center;padding:2rem;">无数据</p>'; return; }
        renderPapers();
        updateStats();
      })
      .catch(e => {
        console.error('papers.js:', e);
        if (container) container.innerHTML = '<p style="text-align:center;padding:2rem;">加载失败: ' + e.message + '</p>';
      });
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
          <div class="paper-citations"><span class="citation-badge">${p.citation_count||0}</span> ${t('publications.cited')}</div>
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
              <div class="paper-citations"><span class="citation-badge">${p.citation_count||0}</span> ${t('publications.cited')}</div>
            </div>
          </div>`;
        }).join('');
      }
    });
  }

  document.addEventListener('langChanged', () => renderPapers());
  init();

  return {
    init,
    getStudents: () => students,
    getPaperCount: () => allPapers.length,
    getCitationCount: () => allPapers.reduce((s, p) => s + (p.citation_count || 0), 0)
  };
})();
