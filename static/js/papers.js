/**
 * papers.js — Publications module
 * PRIMARY: parses offline INSPIRE-HEP HTML from custom/inspirehep.net/authors/
 * FALLBACK: fetches live data from INSPIRE-HEP API
 * Counts ALL papers where advisor is first or corresponding author (regardless of institution)
 */
const Papers = (function() {
  let allPapers = [];
  let students = [];
  let currentFilter = 'all';
  let currentYear = 'all';
  let displayCount = 10;
  let isLoading = false;

  // INSPIRE-HEP identifiers for advisors
  const ADVISOR_RECIDS = [1659207, 1259106];
  const ADVISOR_NAMES = ['Peng Sun', 'Liuming Liu', 'Peng.Sun.1', 'Liuming.Liu.1'];
  const INSTITUTION = 'Lanzhou, Inst. Modern Phys.';

  // Hardcoded student list per requirements
  const STUDENT_LIST = [
    { name: 'Kuan Zhang', name_zh: '张宽' },
    { name: 'Hanyang Xing', name_zh: '邢瀚洋' },
    { name: 'Chen Chen', name_zh: '陈晨' },
    { name: 'Yiqi Geng', name_zh: '耿一琪' },
    { name: 'Chunhua Zeng', name_zh: '曾春华' },
    { name: 'Zhi-Cheng Hu', name_zh: '胡志成' },
    { name: 'Hongxin Dong', name_zh: '董鸿鑫' },
    { name: 'Zhicheng Yan', name_zh: '阎志程' }
  ];

  async function init() {
    await loadPapers();
    renderFilters();
    renderPapers();
    setupSearch();
  }

  let isOffline = false;

  async function loadPapers() {
    const container = document.getElementById('publications-list');
    if (container) {
      container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-light);"><i class="fas fa-spinner fa-spin"></i> ' + (I18N && I18N.getLang ? (I18N.getLang() === 'zh' ? '正在从本地数据加载论文...' : 'Loading papers from local data...') : 'Loading papers...') + '</p>';
    }

    // PRIORITY: Try offline HTML first (per requirements)
    try {
      const offlineLoaded = await loadFromOfflineData();
      if (offlineLoaded && allPapers.length > 0) {
        isOffline = true;
        console.log('Papers loaded from offline data: ' + allPapers.length + ' papers');
      } else {
        throw new Error('Offline data empty or failed');
      }
    } catch (e) {
      console.warn('Offline data failed, trying INSPIRE-HEP API:', e.message);
      try {
        await fetchFromINSPIRE();
        isOffline = false;
      } catch (e2) {
        console.warn('INSPIRE-HEP API failed, trying static data:', e2.message);
        await loadFromStatic();
        isOffline = false;
      }
    }

    // Sort by year descending
    allPapers.sort((a, b) => (b.year || 0) - (a.year || 0));

    // Compute student paper counts from loaded data
    computeStudentCounts();

    updateOfflineBadge();
  }

  function updateOfflineBadge() {
    const badge = document.getElementById('pub-offline-badge');
    if (badge) {
      badge.style.display = isOffline ? 'block' : 'none';
    }
  }

  async function loadFromOfflineData() {
    try {
      const papers = [];

      for (const authorId of ADVISOR_RECIDS) {
        try {
          const resp = await fetch(`custom/inspirehep.net/authors/${authorId}/INSPIRE-CiteAll.html`);
          if (!resp.ok) continue;
          const html = await resp.text();

          // Parse papers from saved INSPIRE-HEP HTML
          // Pattern: <p><b><a href="https://inspirehep.net/literature/NUMBER">TITLE</a></b></p>
          const entries = html.split(/<br>\s*\n\s*/);
          let currentPaper = null;

          for (const block of entries) {
            // Match paper title with literature ID
            const titleMatch = block.match(/<a\s+href="https:\/\/inspirehep\.net\/literature\/(\d+)"[^>]*>([^<]+)<\/a>/);
            if (titleMatch) {
              // Save previous paper
              if (currentPaper && currentPaper.title && currentPaper.title.length > 3) {
                if (!papers.find(p => p.id === currentPaper.id)) {
                  papers.push(currentPaper);
                }
              }

              currentPaper = {
                id: titleMatch[1],
                title: decodeHTMLEntities(titleMatch[2].trim()),
                authors: [],
                journal: '',
                volume: '',
                pages: '',
                year: null,
                arxiv_id: '',
                doi: '',
                citation_count: 0
              };

              continue;
            }

            if (!currentPaper) continue;

            // Match arxiv e-Print
            const arxivMatch = block.match(/e-Print:.*?<a\s+href="https:\/\/arxiv\.org\/abs\/([^"]+)"[^>]*>([\d.]+)<\/a>/);
            if (arxivMatch) {
              currentPaper.arxiv_id = arxivMatch[2].trim();
            }

            // Match DOI
            const doiMatch = block.match(/DOI:.*?<a\s+href="https:\/\/doi\.org\/([^"]+)"[^>]*>([\d.\/]+)<\/a>/);
            if (doiMatch) {
              currentPaper.doi = doiMatch[2].trim();
            }

            // Match Published in: JOURNAL (YEAR), PAGES
            const pubMatch = block.match(/Published in:.*?<span>\s*([^<]+)\s*<\/span>/);
            if (pubMatch) {
              const pubText = pubMatch[1].trim();
              // Parse journal, volume, year, pages
              // Format: "Commun.Theor.Phys. 78 (2026) 9, 095201" or "Phys. Rev. D 111, 074506 (2025)"
              const yearMatch = pubText.match(/\((\d{4})\)/);
              if (yearMatch) {
                currentPaper.year = parseInt(yearMatch[1], 10);
              }

              // Extract journal (everything before the year)
              const journalPart = pubText.replace(/\s*\(\d{4}\).*$/, '').trim();
              if (journalPart) {
                currentPaper.journal = journalPart.replace(/\s+\d+\s*,?\s*\d*$/, '').trim();
              }
            }

            // Match authors block - find all author names with links
            const authorBlocks = block.match(/<a\s+href="https:\/\/inspirehep\.net\/authors\/\d+"[^>]*>([^<]+)<\/a>/g);
            if (authorBlocks && authorBlocks.length > 0) {
              const authorNames = authorBlocks.map(a => {
                const nameMatch = a.match(/>([^<]+)<\/a>/);
                return nameMatch ? nameMatch[1].replace(/<[^>]+>/g, '').replace(/\s*marshmallow\.missing\s*/, '').trim() : '';
              }).filter(Boolean);
              if (authorNames.length > 0) {
                currentPaper.authors = authorNames;
              }
            }
          }

          // Don't forget the last paper
          if (currentPaper && currentPaper.title && currentPaper.title.length > 3) {
            if (!papers.find(p => p.id === currentPaper.id)) {
              papers.push(currentPaper);
            }
          }
        } catch (e) {
          console.warn(`Failed to load offline data for author ${authorId}:`, e);
        }
      }

      if (papers.length > 0) {
        allPapers = papers;
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Offline data parsing failed:', e);
      return false;
    }
  }

  async function fetchFromINSPIRE() {
    const papers = [];
    const authorIds = ADVISOR_RECIDS;

    // Fetch papers for both advisors — NO institution filter (per requirements)
    for (const authorId of authorIds) {
      const url = 'https://inspirehep.net/api/literature?' + new URLSearchParams({
        q: `a recid:${authorId}`,
        size: '100',
        sort: 'mostrecent',
        fields: 'titles,authors.full_name,authors.affiliations,authors.recid,citation_count,publication_info,arxiv_eprints,dois,earliest_date,first_author,corp_author'
      });

      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`INSPIRE-HEP returned ${resp.status}`);
      const data = await resp.json();

      for (const hit of (data.hits?.hits || [])) {
        const m = hit.metadata;
        const title = (m.titles && m.titles[0]) ? m.titles[0].title : 'Untitled';

        // Skip papers already added
        if (papers.find(p => p.id === hit.id)) continue;

        const authors = (m.authors || []).map(a => a.full_name);
        const pub = (m.publication_info && m.publication_info[0]) || {};
        const journal = pub.journal_title || '';
        const year = pub.year || (m.earliest_date ? parseInt(m.earliest_date.substring(0, 4)) : null);
        const arxiv = (m.arxiv_eprints && m.arxiv_eprints[0]) ? m.arxiv_eprints[0].value : '';
        const doi = (m.dois && m.dois[0]) ? m.dois[0].value : '';

        papers.push({
          id: hit.id,
          title: title,
          authors: authors,
          journal: journal,
          volume: pub.journal_volume || '',
          pages: pub.artid || '',
          year: year,
          arxiv_id: arxiv,
          doi: doi,
          citation_count: m.citation_count || 0
        });
      }
    }

    allPapers = papers;

    // Cache in localStorage
    try {
      localStorage.setItem('papers_cache', JSON.stringify({
        papers: allPapers,
        timestamp: Date.now()
      }));
    } catch(e) {}
  }

  // Compute student paper counts from loaded papers
  function computeStudentCounts() {
    const counts = {};
    for (const paper of allPapers) {
      for (const author of paper.authors) {
        const normalized = author.replace(/<[^>]+>/g, '').trim();
        // Check against student list
        for (const student of STUDENT_LIST) {
          const firstName = student.name.split(' ')[0];
          const lastName = student.name.split(' ').slice(1).join(' ');
          if (normalized.includes(firstName) || normalized.includes(lastName) ||
              (student.name_zh && normalized.includes(student.name_zh))) {
            counts[student.name] = (counts[student.name] || 0) + 1;
          }
        }
      }
    }

    // Build students array
    students = STUDENT_LIST.map(s => ({
      name: s.name,
      name_zh: s.name_zh,
      papers: counts[s.name] || 0
    }));
  }

  async function loadFromStatic() {
    try {
      const cached = localStorage.getItem('papers_cache');
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          allPapers = data.papers || [];
          computeStudentCounts();
          return;
        }
      }
    } catch(e) {}

    try {
      const resp = await fetch('data/papers.json');
      const data = await resp.json();
      allPapers = data.papers || [];
      computeStudentCounts();
    } catch (e) {
      console.error('Failed to load papers:', e);
      allPapers = [];
    }
  }

  function renderFilters() {
    const filterContainer = document.getElementById('pub-filters');
    if (!filterContainer) return;

    const years = [...new Set(allPapers.map(p => p.year).filter(Boolean))].sort((a, b) => b - a);

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
    return allPapers.filter(p => {
      if (currentFilter === 'sun') {
        if (!p.authors.some(a => a.toLowerCase().includes('sun') || a.toLowerCase().includes('peng'))) return false;
      }
      if (currentFilter === 'liu') {
        if (!p.authors.some(a => a.toLowerCase().includes('liu') || a.toLowerCase().includes('liuming'))) return false;
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
      const authorStr = paper.authors.slice(0, 4).join(', ') + (paper.authors.length > 4 ? ' et al.' : '');
      const journalStr = paper.journal
        + (paper.volume ? ` ${paper.volume}` : '')
        + (paper.pages ? `, ${paper.pages}` : '')
        + (paper.year ? ` (${paper.year})` : '');

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
          <div class="paper-year-badge">${paper.year || '—'}</div>
          <h4 class="paper-title">${escapeHtml(paper.title)}</h4>
          <p class="paper-authors">${escapeHtml(authorStr)}</p>
          <p class="paper-journal">${escapeHtml(journalStr)}</p>
          <div class="paper-meta">
            <div class="paper-links">${links.join(' ')}</div>
            <div class="paper-citations">
              <span class="citation-badge">${paper.citation_count || 0}</span> ${I18N.t('publications.cited')}
            </div>
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

  function decodeHTMLEntities(text) {
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || div.innerText || '';
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
          p.authors.some(a => a.toLowerCase().includes(query)) ||
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
            const authorStr = paper.authors.slice(0, 4).join(', ') + (paper.authors.length > 4 ? ' et al.' : '');
            const journalStr = paper.journal + (paper.year ? ` (${paper.year})` : '');
            const links = [];
            if (paper.arxiv_id) links.push(`<a href="https://arxiv.org/abs/${paper.arxiv_id}" target="_blank" class="paper-link"><i class="ai ai-arxiv"></i> arXiv</a>`);
            if (paper.doi) links.push(`<a href="https://doi.org/${paper.doi}" target="_blank" class="paper-link"><i class="fas fa-link"></i> DOI</a>`);
            if (paper.id) links.push(`<a href="https://inspirehep.net/literature/${paper.id}" target="_blank" class="paper-link"><i class="fas fa-external-link-alt"></i> INSPIRE</a>`);

            return `
              <div class="paper-card">
                <div class="paper-year-badge">${paper.year || '—'}</div>
                <h4 class="paper-title">${escapeHtml(paper.title)}</h4>
                <p class="paper-authors">${escapeHtml(authorStr)}</p>
                <p class="paper-journal">${escapeHtml(journalStr)}</p>
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

  return { init, loadMore, getStudents: () => students, getAllPapers: () => allPapers };
})();
