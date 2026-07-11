/**
 * papers.js — Publications module
 * Primary: loads from custom/inspirehep.net/authors/* /INSPIRE-CiteAll.html (offline)
 * Supplement: fetches live citation counts from INSPIRE-HEP API on each refresh
 *
 * Papers count rule (要求.json):
 *   - 发表论文: sum of advisor papers where advisor is first-author OR corresponding-author (any institution)
 *   - 累计引用: sum of citations for above papers
 *   - Display list: filtered to first-unit = Lanzhou, Inst. Modern Phys.
 */
const Papers = (function() {
  let allPapers = [];
  let displayPapers = [];  // filtered for display (first-unit IMP)
  let countPapers = [];    // papers for counting (first/corresponding author)
  let students = [];
  let currentFilter = 'all';
  let currentYear = 'all';
  let displayCount = 10;
  let isLoading = false;

  // INSPIRE-HEP identifiers
  const ADVISOR_BAI = ['Peng.Sun.1', 'Liuming.Liu.1'];
  const ADVISOR_RECIDS = [1659207, 1259106];
  const INSTITUTION = 'Lanzhou, Inst. Modern Phys.';

  // Student list per requirements (要求.json) — hard-coded names
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

  let isOffline = true;  // default to offline until API succeeds

  async function loadPapers() {
    const container = document.getElementById('publications-list');
    if (container) {
      container.innerHTML = '<p style="text-align:center;padding:2rem;color:var(--text-light);"><i class="fas fa-spinner fa-spin"></i> Loading papers...</p>';
    }

    // 1) Always load offline HTML first (primary data source)
    const offlineLoaded = await loadFromOfflineData();

    if (!offlineLoaded) {
      // Offline files missing — try localStorage cache
      const cacheLoaded = loadFromCache();
      if (!cacheLoaded) {
        await loadFromStatic();
      }
    }

    // Sort by year descending
    allPapers.sort((a, b) => (b.year || 0) - (a.year || 0));

    // Separate display papers (first-unit IMP) vs count papers
    displayPapers = allPapers.filter(p => p.isFirstUnitIMP);
    countPapers = allPapers;

    updateOfflineBadge();
    renderFilters();
    renderPapers();
    updateStats();

    // 2) Try INSPIRE-HEP API in background to supplement citation counts and newer papers
    fetchFromINSPIREBackground();
  }

  // Background API fetch — supplements offline data with citation counts
  async function fetchFromINSPIREBackground() {
    try {
      const freshPapers = [];
      const studentCount = {};

      for (const bai of ADVISOR_BAI) {
        const query = `a ${bai} and af:"${INSTITUTION}"`;
        const url = 'https://inspirehep.net/api/literature?' + new URLSearchParams({
          q: query,
          size: '100',
          sort: 'mostrecent',
          fields: 'titles,authors.full_name,authors.affiliations,authors.recid,citation_count,publication_info,arxiv_eprints,dois,earliest_date,first_author'
        });

        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`INSPIRE-HEP returned ${resp.status}`);
        const data = await resp.json();

        for (const hit of (data.hits?.hits || [])) {
          const m = hit.metadata;
          const title = (m.titles && m.titles[0]) ? m.titles[0].title : 'Untitled';

          if (freshPapers.find(p => p.id === hit.id)) continue;

          const authors = (m.authors || []).map(a => a.full_name);
          const pub = (m.publication_info && m.publication_info[0]) || {};
          const journal = pub.journal_title || '';
          const year = pub.year || (m.earliest_date ? parseInt(m.earliest_date.substring(0, 4)) : null);
          const arxiv = (m.arxiv_eprints && m.arxiv_eprints[0]) ? m.arxiv_eprints[0].value : '';
          const doi = (m.dois && m.dois[0]) ? m.dois[0].value : '';

          const isFirstUnitIMP = (m.authors || []).some(a =>
            a.affiliations && a.affiliations[0] && a.affiliations[0].value === INSTITUTION
          );

          freshPapers.push({
            id: hit.id,
            title: title,
            authors: authors,
            journal: journal,
            volume: pub.journal_volume || '',
            pages: pub.artid || '',
            year: year,
            arxiv_id: arxiv,
            doi: doi,
            citation_count: m.citation_count || 0,
            isFirstUnitIMP: isFirstUnitIMP
          });

          // Track student co-authors
          for (const author of (m.authors || [])) {
            if (ADVISOR_RECIDS.includes(author.recid)) continue;
            const hasIMP = (author.affiliations || []).some(a => a.value === INSTITUTION);
            if (hasIMP) {
              studentCount[author.full_name] = (studentCount[author.full_name] || 0) + 1;
            }
          }
        }
      }

      if (freshPapers.length > 0) {
        // Merge: keep offline papers, update citation counts from API, add new papers
        const offlineMap = {};
        for (const p of allPapers) {
          offlineMap[p.id] = p;
        }

        for (const fp of freshPapers) {
          if (offlineMap[fp.id]) {
            // Update citation count from API
            offlineMap[fp.id].citation_count = fp.citation_count;
            // Also update fields that offline parsing may have missed
            if (!offlineMap[fp.id].journal && fp.journal) offlineMap[fp.id].journal = fp.journal;
            if (!offlineMap[fp.id].year && fp.year) offlineMap[fp.id].year = fp.year;
            if (!offlineMap[fp.id].arxiv_id && fp.arxiv_id) offlineMap[fp.id].arxiv_id = fp.arxiv_id;
            if (!offlineMap[fp.id].doi && fp.doi) offlineMap[fp.id].doi = fp.doi;
            if (offlineMap[fp.id].authors.length === 0 && fp.authors.length > 0) {
              offlineMap[fp.id].authors = fp.authors;
            }
          } else {
            // New paper from API not in offline data
            offlineMap[fp.id] = fp;
          }
        }

        allPapers = Object.values(offlineMap);
        allPapers.sort((a, b) => (b.year || 0) - (a.year || 0));
        displayPapers = allPapers.filter(p => p.isFirstUnitIMP);
        countPapers = allPapers;
        students = buildStudentList(studentCount);
        isOffline = false;

        // Save to cache
        try {
          localStorage.setItem('papers_cache', JSON.stringify({
            papers: allPapers,
            students: students,
            timestamp: Date.now()
          }));
        } catch(e) {}

        // Re-render with updated data
        renderFilters();
        renderPapers();
        updateStats();
        updateOfflineBadge();
      }
    } catch (e) {
      console.warn('Background INSPIRE-HEP fetch failed (offline data still shown):', e.message);
    }
  }

  function updateOfflineBadge() {
    const badge = document.getElementById('pub-offline-badge');
    if (badge) {
      badge.style.display = isOffline ? 'block' : 'none';
    }
  }

  // ===== Primary data source: offline INSPIRE-CiteAll.html files =====
  async function loadFromOfflineData() {
    try {
      const authorIds = ['1659207', '1259106'];
      const papers = [];
      const studentCount = {};
      const seen = new Set();

      for (const authorId of authorIds) {
        try {
          const resp = await fetch(`custom/inspirehep.net/authors/${authorId}/INSPIRE-CiteAll.html`);
          if (!resp.ok) continue;
          const html = await resp.text();

          // Parse each paper entry from the HTML
          // Pattern: <p><b><a href="/literature/ID">TITLE</a></b></p>
          //          <p>AUTHORS with affiliations</p>
          //          <p>e-Print: <a>ARXIV</a></p>
          //          <p>DOI: <a>DOI</a></p>
          //          <p>Published in: <span>JOURNAL INFO</span></p>
          //          <br>

          // Split by <br> tags to get individual paper blocks
          const blocks = html.split(/<br\s*\/?>/i);
          let currentPaper = null;
          const tempPapers = [];

          for (const block of blocks) {
            // Title line: <a href="/literature/NNNNNNN">TITLE</a>
            const titleMatch = block.match(/<a\s+href="https:\/\/inspirehep\.net\/literature\/(\d+)"[^>]*>([\s\S]*?)<\/a>/i);
            if (titleMatch) {
              // Save previous paper
              if (currentPaper) tempPapers.push(currentPaper);

              const id = titleMatch[1];
              const title = titleMatch[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").trim();

              if (!title || title.length < 3) { currentPaper = null; continue; }

              currentPaper = {
                id: id,
                title: title,
                authors: [],
                journal: '',
                volume: '',
                pages: '',
                year: null,
                arxiv_id: '',
                doi: '',
                citation_count: 0,
                isFirstUnitIMP: false
              };
              continue;
            }

            if (!currentPaper) continue;

            // Author line: check for IMP affiliation
            if (currentPaper.authors.length === 0) {
              // Check if any author has Lanzhou, Inst. Modern Phys. affiliation
              if (block.includes('Lanzhou, Inst. Modern Phys.')) {
                currentPaper.isFirstUnitIMP = true;
              }

              // Extract author names from <a> tags that contain /authors/
              const authorMatches = block.match(/<a\s+href="https:\/\/inspirehep\.net\/authors\/\d+"[^>]*>([^<]+)<\/a>/gi);
              if (authorMatches) {
                const names = authorMatches.map(a => {
                  const m = a.match(/>([^<]+)</);
                  return m ? m[1].trim() : '';
                }).filter(n => n && !n.includes('Lanzhou') && !n.includes('Inst.') && !n.includes('UCAS') && n.length < 60);

                // Track student co-authors
                for (const name of names) {
                  if (!ADVISOR_RECIDS.some(() => false)) {
                    // Simple student tracking (names not matching advisor names)
                    const isAdvisor = ['Peng Sun', 'Liuming Liu', '孙鹏', '刘柳明'].some(a =>
                      name.toLowerCase().includes(a.toLowerCase())
                    );
                    if (!isAdvisor) {
                      // Check if IMP-related (the block containing this name has IMP)
                      const nameIdx = block.indexOf(name);
                      const context = block.substring(Math.max(0, nameIdx - 200), Math.min(block.length, nameIdx + 300));
                      if (context.includes('Lanzhou, Inst. Modern Phys.')) {
                        studentCount[name] = (studentCount[name] || 0) + 1;
                      }
                    }
                  }
                }

                currentPaper.authors = names;
              }
            }

            // e-Print (arXiv)
            const arxivMatch = block.match(/e-Print:\s*<a[^>]*href="https:\/\/arxiv\.org\/abs\/([^"]+)"[^>]*>([^<]+)<\/a>/i)
                            || block.match(/e-Print:\s*<a[^>]*>([\d.]+)<\/a>/i);
            if (arxivMatch && !currentPaper.arxiv_id) {
              currentPaper.arxiv_id = arxivMatch[1].trim();
            }

            // DOI
            const doiMatch = block.match(/DOI:\s*<a[^>]*href="https:\/\/doi\.org\/([^"]+)"[^>]*>/i);
            if (doiMatch && !currentPaper.doi) {
              currentPaper.doi = doiMatch[1].trim();
            }

            // Published in (journal info)
            const pubMatch = block.match(/Published\s+in:\s*<span>([\s\S]*?)<\/span>/i);
            if (pubMatch && !currentPaper.journal) {
              const pubText = pubMatch[1].replace(/<[^>]+>/g, '').trim();
              // Parse journal, volume, year, pages
              // Format: "Journal Name Volume (Year) Issue, Pages" or "Journal Name (Year) Pages"
              const pubYearMatch = pubText.match(/\((\d{4})\)/);
              if (pubYearMatch) currentPaper.year = parseInt(pubYearMatch[1], 10);

              // Extract journal name (everything before the volume or year)
              const journalParts = pubText.split(/\s+\d+/);
              if (journalParts.length > 0) {
                currentPaper.journal = journalParts[0].trim();
              }

              // Extract volume/pages
              const volPageMatch = pubText.match(/(\d+)\s*\(?\d{4}\)?\s*,?\s*(\d+)/);
              if (volPageMatch) {
                if (!currentPaper.volume) currentPaper.volume = volPageMatch[1];
                currentPaper.pages = volPageMatch[2];
              }
            }
          }

          // Don't forget the last paper
          if (currentPaper) tempPapers.push(currentPaper);

          // Merge into papers list (deduplicate by id)
          for (const p of tempPapers) {
            if (!seen.has(p.id)) {
              seen.add(p.id);
              papers.push(p);
            }
          }
        } catch (e) {
          console.warn(`Failed to load offline data for author ${authorId}:`, e);
        }
      }

      if (papers.length > 0) {
        allPapers = papers;
        students = buildStudentList(studentCount);
        isOffline = true;
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Offline data parsing failed:', e);
      return false;
    }
  }

  function loadFromCache() {
    try {
      const cached = localStorage.getItem('papers_cache');
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          allPapers = data.papers || [];
          students = data.students || [];
          displayPapers = allPapers.filter(p => p.isFirstUnitIMP !== false);
          countPapers = allPapers;
          isOffline = false;
          return true;
        }
      }
    } catch(e) {}
    return false;
  }

  async function loadFromStatic() {
    try {
      const resp = await fetch('data/papers.json');
      const data = await resp.json();
      allPapers = data.papers || [];
      students = data.students || [];
      displayPapers = allPapers;
      countPapers = allPapers;
      isOffline = true;
    } catch (e) {
      console.error('Failed to load papers:', e);
      allPapers = [];
    }
  }

  function buildStudentList(studentCount) {
    // Match hard-coded student names against parsed student counts
    const result = [];
    for (const name of STUDENT_NAMES) {
      const key = Object.keys(studentCount).find(k =>
        k.toLowerCase().includes(name.toLowerCase().split(' ').pop()) ||
        name.toLowerCase().includes(k.toLowerCase().split(' ').pop())
      );
      result.push({
        name: name,
        papers: key ? studentCount[key] : 0
      });
    }
    if (result.every(s => s.papers === 0)) {
      return STUDENT_NAMES.map(name => ({ name, papers: 0 }));
    }
    return result.sort((a, b) => b.papers - a.papers);
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
            const links = [];
            if (paper.arxiv_id) links.push(`<a href="https://arxiv.org/abs/${paper.arxiv_id}" target="_blank" class="paper-link">arXiv</a>`);
            if (paper.doi) links.push(`<a href="https://doi.org/${paper.doi}" target="_blank" class="paper-link">DOI</a>`);

            return `
              <div class="paper-card">
                <div class="paper-year-badge">${paper.year || '—'}</div>
                <h4 class="paper-title">${escapeHtml(paper.title)}</h4>
                <p class="paper-authors">${escapeHtml(authorStr)}</p>
                <p class="paper-journal">${escapeHtml(paper.journal)} (${paper.year})</p>
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
