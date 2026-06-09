/* Global Initialisation & Utilities */
var submitted = false;
const PROFILE_CONFIG = {
    backendUrl: "https://shaban-ahmad-github-io.vercel.app/api/gemini",
    stats: {
        publications: "100+",
        citations: "1800+",
        hIndex: "28",
        peerReviews: "560+"
    },
    links: {
        webOfScience: "https://www.webofscience.com/wos/author/record/ABD-4112-2021"
    }
};

const syncProfileStats = () => {
    const statValues = document.querySelectorAll(".hero-stats .stat-value");
    const values = [PROFILE_CONFIG.stats.publications, PROFILE_CONFIG.stats.citations, PROFILE_CONFIG.stats.hIndex, PROFILE_CONFIG.stats.peerReviews];
    statValues.forEach((el, index) => { if (values[index]) el.textContent = values[index]; });

    const peerCount = document.querySelector("#peer-review-count-text .verified-badge");
    if (peerCount) peerCount.innerHTML = `<i class="fas fa-check-circle"></i> ${PROFILE_CONFIG.stats.peerReviews} Verified`;
};

document.addEventListener('DOMContentLoaded', () => {
    syncProfileStats();
    if (localStorage.getItem('theme') === 'dark') toggleTheme();
    updateJournalCount();
    initCitationButtons();
    assignReverseBadges();
    fixReversedListStart();
    reveal();
    startSFScroll();
    buildPubMarquee();
    document.querySelectorAll('.email-click').forEach(el => {
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); el.click(); }
        });
    });

    // Initialize progress ring
    const ptCircle = document.querySelector('.progress-ring__circle');
    if (ptCircle) {
        const radius = ptCircle.r.baseVal.value;
        window.ptCircumference = 2 * Math.PI * radius;
        ptCircle.style.strokeDasharray = `${window.ptCircumference} ${window.ptCircumference}`;
        ptCircle.style.strokeDashoffset = window.ptCircumference;
    }

    // Bridge tagline: now static HTML with CSS colour-fill animation (no JS needed)

    // Instantly set hero stats to 0, then wait 2.5 seconds before animating sequentially
    initCountersToZero('.stat-row > .stat-value');
    setTimeout(() => {
        runSequentialCounters('.stat-row > .stat-value', 3000);
    }, 2500);

    // Refresh and rerun sequence every 5 minutes (300,000 ms)
    setInterval(refreshHeroCounters, 300000);
});

const initCountersToZero = (selector) => {
    document.querySelectorAll(selector).forEach(el => {
        if (!el.hasAttribute('data-target-num')) {
            const text = el.innerText.trim();
            const numMatch = text.match(/\d+/);
            if (numMatch) {
                el.setAttribute('data-target-num', numMatch[0]);
                el.setAttribute('data-suffix', text.replace(/[0-9]/g, ''));
                el.innerText = '0' + text.replace(/[0-9]/g, '');
            }
        } else {
            el.innerText = '0' + (el.getAttribute('data-suffix') || '');
        }
    });
};

const animateCountUp = (el, duration) => {
    return new Promise(resolve => {
        const num = parseInt(el.getAttribute('data-target-num'));
        const suffix = el.getAttribute('data-suffix') || '';

        el.innerText = '0' + suffix;

        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 4);
            el.innerText = Math.floor(easeOut * num) + suffix;

            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                el.innerText = num + suffix;
                el.style.color = '#ffffff';
                el.style.textShadow = '0 0 14px rgba(255,255,255,0.9)';
                setTimeout(() => { el.style.color = ''; el.style.textShadow = ''; }, 420);
                resolve(); // Tell the sequence this animation has fully finished
            }
        };
        window.requestAnimationFrame(step);
    });
};

const runSequentialCounters = async (selector, duration = 3000) => {
    initCountersToZero(selector);
    const elements = Array.from(document.querySelectorAll(selector)).filter(el => el.hasAttribute('data-target-num'));
    for (let i = 0; i < elements.length; i++) {
        animateCountUp(elements[i], duration); // fire — don't await full completion
        if (i < elements.length - 1) {
            await new Promise(r => setTimeout(r, Math.round(duration * 0.72))); // next starts at ~72%
        }
    }
};

const refreshHeroCounters = async () => {
    await runSequentialCounters('.stat-row > .stat-value', 3000);
    const bd = document.getElementById('pub-breakdown');
    // Also refresh the sub-stats if the dropdown happens to be open during the 5-minute tick
    if (bd && bd.classList.contains('open')) {
        await runSequentialCounters('#pub-breakdown .pub-badge', 2500);
    }
};

const trapFocus = (e, container) => { if (e.key !== 'Tab') return; const focusable = container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable]'); if (!focusable.length) return; const first = focusable[0], last = focusable[focusable.length - 1]; if (e.shiftKey) { if (document.activeElement === first) { last.focus(); e.preventDefault(); } } else { if (document.activeElement === last) { first.focus(); e.preventDefault(); } } };

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeAIModal(); closeSearchModal(); }
    const aiModal = document.getElementById('ai-modal');
    if (aiModal && aiModal.classList.contains('show')) trapFocus(e, aiModal);
    const chatWindow = document.getElementById('ai-chat-window');
    if (chatWindow && chatWindow.style.display === 'flex') trapFocus(e, chatWindow);
});

const toggleTheme = () => { document.body.classList.toggle('dark-mode'); const isDark = document.body.classList.contains('dark-mode'); localStorage.setItem('theme', isDark ? 'dark' : 'light'); document.querySelectorAll('.theme-toggle').forEach(el => el.className = isDark ? 'fas fa-sun control-icon theme-toggle' : 'fas fa-moon control-icon theme-toggle'); };

const updateJournalCount = () => {
    const journals = document.querySelectorAll(".peer-review-container .pr-badge-item");
    const uniqueJournals = new Set(Array.from(journals).map(item => item.textContent.trim()));
    const countText = document.getElementById("peer-review-count-text");
    if (countText) {
        countText.innerHTML = `<a href="${PROFILE_CONFIG.links.webOfScience}" target="_blank" style="text-decoration:underline;" rel="noopener noreferrer"> <span class="verified-badge"><i class="fas fa-check-circle"></i> ${PROFILE_CONFIG.stats.peerReviews} Verified</span> Peer Reviews on Publons (WoS) for ${uniqueJournals.size} Journals </a>`;
    }
};
const copyEmail = (el, email, color = null) => {
    navigator.clipboard.writeText(email).then(() => {
        let fb = document.createElement("span");
        fb.className = "copy-feedback";
        fb.innerText = "Email copied!";
        fb.style.whiteSpace = "nowrap";
        if (color) fb.style.background = color;
        el.appendChild(fb);
        setTimeout(() => fb.classList.add("show"), 10);
        setTimeout(() => { fb.classList.remove("show"); setTimeout(() => fb.remove(), 300); }, 1500);
    });
};

/* Automated Citation & DOI Logic Engine */
const initCitationButtons = () => {
    document.querySelectorAll('.pub-item').forEach((pub, i) => {
        const doiBtn = pub.querySelector('.pub-doi'); if (!doiBtn) return;
        const controls = document.createElement('span'); controls.className = 'pub-controls';
        const dataBtns = Array.from(pub.querySelectorAll('.btn-data'));
        dataBtns.forEach(btn => { btn.style.margin = '0'; controls.appendChild(btn); });
        if (dataBtns.length > 0) { const sep1 = document.createElement('span'); sep1.style.cssText = 'color:#dc3545; font-weight:900; margin:0 6px;'; sep1.innerHTML = '|'; controls.appendChild(sep1); }
        let doiUrl = doiBtn.getAttribute('href'); doiBtn.style.margin = '0'; controls.appendChild(doiBtn);
        const citeBtn = document.createElement('button'); citeBtn.className = 'btn-cite'; citeBtn.innerHTML = 'Cite <i class="fas fa-caret-down"></i>'; citeBtn.onclick = (e) => toggleCiteMenu(e, citeBtn); controls.appendChild(citeBtn);
        const sep2 = document.createElement('span'); sep2.style.cssText = 'color:#dc3545; font-weight:900; margin:0 6px;'; sep2.innerHTML = '|'; controls.appendChild(sep2);

        const pubTitle = pub.querySelector('strong')?.innerText.trim() || "";
        const tldrBtn = document.createElement('button'); tldrBtn.className = 'btn-data'; tldrBtn.style.cssText = 'background-color:#dc3545; color:#fff; border:none; margin:0; cursor:pointer;'; tldrBtn.innerHTML = '✨'; tldrBtn.title = "Generate AI Report"; tldrBtn.onclick = () => handlePublicationAction('AI Report', pubTitle, doiUrl, tldrBtn); controls.appendChild(tldrBtn);
        const socialBtn = document.createElement('button'); socialBtn.className = 'btn-data'; socialBtn.style.cssText = 'background-color:#1DA1F2; color:#fff; border:none; margin:0 0 0 5px; cursor:pointer;'; socialBtn.innerHTML = '<i class="fab fa-twitter"></i>'; socialBtn.title = "Create Social Media Post"; socialBtn.onclick = () => handlePublicationAction('Social Post', pubTitle, doiUrl, socialBtn); controls.appendChild(socialBtn);

        const dd = document.createElement('div'); dd.className = 'cite-dropdown-menu'; dd.id = `cite-menu-${i}`;
        const optCopy = document.createElement('button'); optCopy.className = 'cite-option'; optCopy.innerHTML = '<i class="fas fa-copy"></i> Copy APA Format'; optCopy.onclick = () => handleCitationAction(pub, doiUrl, optCopy, 'copy');
        const optBib = document.createElement('button'); optBib.className = 'cite-option'; optBib.innerHTML = '<i class="fas fa-file-code"></i> Download BibTeX'; optBib.onclick = () => handleCitationAction(pub, doiUrl, optBib, 'bib');
        const optRis = document.createElement('button'); optRis.className = 'cite-option'; optRis.innerHTML = '<i class="fas fa-file-export"></i> Download EndNote'; optRis.onclick = () => handleCitationAction(pub, doiUrl, optRis, 'ris');
        dd.appendChild(optCopy); dd.appendChild(document.createElement('div')).className = 'cite-divider'; dd.appendChild(optBib); dd.appendChild(optRis); controls.appendChild(dd); pub.appendChild(controls);
    });
};
const toggleCiteMenu = (e, btn) => { e.stopPropagation(); const cm = btn.parentElement.querySelector('.cite-dropdown-menu'), pi = btn.closest('.pub-item'); document.querySelectorAll('.cite-dropdown-menu').forEach(m => { if (m !== cm) { m.classList.remove('show'); m.closest('.pub-item').classList.remove('z-active'); } }); if (cm.classList.contains('show')) { cm.classList.remove('show'); pi.classList.remove('z-active'); } else { cm.classList.add('show'); pi.classList.add('z-active'); setTimeout(() => pi.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); } };
const handleCitationAction = async (pub, doiUrl, btn, type) => { const orig = btn.innerHTML; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...'; let m = null; if (doiUrl && doiUrl.includes('doi.org')) { try { const res = await fetch(`https://api.crossref.org/works/${doiUrl.split('doi.org/')[1]}?mailto=shaban.ucph@gmail.com`); if (res.ok) m = parseCrossRefData((await res.json()).message, doiUrl); } catch (e) { console.warn("API fail", e); } } if (!m) m = scrapeHtmlData(pub); try { if (type === 'copy') { await navigator.clipboard.writeText(formatAPA(m)); btn.innerHTML = '<i class="fas fa-check"></i> Copied!'; btn.style.color = 'green'; } else if (type === 'bib') { downloadFile(formatBibTeX(m), `${m.id}.bib`, 'text/plain'); btn.innerHTML = '<i class="fas fa-check"></i> Downloaded!'; } else { downloadFile(formatRIS(m), `${m.id}.ris`, 'application/x-research-info-systems'); btn.innerHTML = '<i class="fas fa-check"></i> Downloaded!'; } } catch (err) { btn.innerHTML = '<i class="fas fa-times"></i> Error'; } setTimeout(() => { btn.innerHTML = orig; btn.style.color = ''; if (type === 'copy') { const mu = btn.closest('.cite-dropdown-menu'); mu.classList.remove('show'); mu.closest('.pub-item').classList.remove('z-active'); } }, 2000); };
const parseCrossRefData = (d, url) => { const a = d.author ? d.author.map(x => ({ last: x.family, initial: x.given ? x.given.split(/[\s\.\-]+/).map(n => n[0] + '.').join('') : '' })) : [{ last: "Ahmad", initial: "S." }]; let y = "n.d."; if (d['published-print']?.['date-parts']) y = d['published-print']['date-parts'][0][0]; else if (d.published?.['date-parts']) y = d.published['date-parts'][0][0]; else if (d.created) y = d.created['date-parts'][0][0]; return { id: (d.author?.[0]?.family || "unknown") + y, title: d.title ? d.title[0] : "Untitled", authors: a, journal: d['container-title'] ? d['container-title'][0] : "", year: y, volume: d.volume || "", issue: d.issue || "", pages: d.page || "", doi: url }; };
const scrapeHtmlData = (pub) => { const t = pub.querySelector('strong')?.innerText.trim() || "Publication", jt = pub.querySelector('em')?.innerText.trim() || "", db = pub.querySelector('.pub-doi'), ym = jt.match(/\((20\d{2})\)/); return { id: "Ahmad" + (ym ? ym[1] : new Date().getFullYear()), title: t, authors: [{ last: "Ahmad", initial: "S." }], journal: jt.replace(/\(20\d{2}\)/, '').trim(), year: (ym ? ym[1] : new Date().getFullYear()), volume: "", issue: "", pages: "", doi: db ? db.getAttribute('href') : "" }; };
const formatAPA = (m) => `${m.authors.length > 0 ? (m.authors.length > 1 ? m.authors.map(a => `${a.last}, ${a.initial}`).slice(0, -1).join(', ') + ", & " + m.authors[m.authors.length - 1].last + ", " + m.authors[m.authors.length - 1].initial : `${m.authors[0].last}, ${m.authors[0].initial}`) : "Ahmad, S."} (${m.year}). ${m.title}. ${m.journal}${m.volume ? `, ${m.volume}` : ''}${m.issue ? `(${m.issue})` : ''}${m.pages ? `, ${m.pages}` : ''}. ${m.doi}`;
const formatBibTeX = (m) => `@article{${m.id},\n  author = {${m.authors.map(a => `${a.last}, ${a.initial}`).join(' and ')}},\n  title = {${m.title}},\n  journal = {${m.journal}},\n  year = {${m.year}},\n  volume = {${m.volume}},\n  number = {${m.issue}},\n  pages = {${m.pages}},\n  doi = {${m.doi}}\n}`;
const formatRIS = (m) => { let r = `TY  - JOUR\nTI  - ${m.title}\n`; m.authors.forEach(a => r += `AU  - ${a.last}, ${a.initial}\n`); return r + `JO  - ${m.journal}\nPY  - ${m.year}\nVL  - ${m.volume}\nIS  - ${m.issue}\nSP  - ${m.pages}\nDO  - ${m.doi}\nER  -`; };
const downloadFile = (c, f, t) => { const b = new Blob([c], { type: t }), l = document.createElement("a"); l.href = URL.createObjectURL(b); l.download = f; document.body.appendChild(l); l.click(); document.body.removeChild(l); };

/* UI Interactions, Accordions & Search Engine */
window.addEventListener('click', (e) => { if (!e.target.closest('.btn-cite')) document.querySelectorAll('.cite-dropdown-menu').forEach(m => { m.classList.remove('show'); m.closest('.pub-item').classList.remove('z-active'); }); if (!e.target.closest('.lang-wrapper') && !e.target.closest('.search-container') && !e.target.closest('#srch-overlay') && !e.target.closest('.control-icon') && !e.target.closest('.mobile-dropdown-toggle') && !e.target.closest('.accordion-btn')) closeAllDropdowns(); if (!e.target.closest('.nav-list') && !e.target.closest('.nav-toggle')) { const nb = document.querySelector('.nav-list'), tb = document.querySelector('.nav-toggle'); if (nb && nb.classList.contains('active')) { nb.classList.remove('active'); tb.classList.remove('open'); } } if (!e.target.closest('#ai-chat-window') && !e.target.closest('#ai-widget-toggle')) { const cw = document.getElementById('ai-chat-window'); if (cw && cw.style.display === 'flex') cw.style.display = 'none'; } const pb = document.getElementById('pub-breakdown'), pc = pb ? pb.closest('.stat-row-link') : null; if (pb && pb.classList.contains('open') && pc && !pc.contains(e.target)) { pb.classList.remove('open'); pb.style.maxHeight = "0"; const ti = pc.querySelector('.stat-toggle i'); if (ti) { ti.classList.remove('fa-chevron-up'); ti.classList.add('fa-chevron-down'); } pc.classList.remove('active-box'); } });
const closeAllDropdowns = (x = null) => { const d = document.getElementById('global-lang-dd'), m = document.getElementById('global-lang-dd'); if (d && d !== x) d.classList.remove('show'); if (m && m !== x) m.classList.remove('show');['pub-dd', 'act-dd', 'exp-dd', 'strat-dd'].forEach(id => { const r = document.getElementById(id); if (r && r.classList.contains('show-mobile') && r !== x) { r.classList.remove('show-mobile'); const t = r.previousElementSibling; if (t && t.classList.contains('mobile-dropdown-toggle')) { t.classList.remove('active'); t.innerHTML = '<i class="fas fa-chevron-down"></i>'; } } }); };
const handleFormSubmit = () => { document.getElementById('contact-form').reset(); const fb = document.getElementById('msg-success-box'), sb = document.getElementById('submit-btn'), ab = document.getElementById('draft-email-btn'); if (sb) sb.style.display = 'none'; if (ab) ab.style.display = 'none'; fb.classList.add('anim-start'); setTimeout(() => fb.classList.add('anim-running'), 100); setTimeout(() => { fb.classList.remove('anim-running'); fb.classList.add('anim-reverse'); }, 3000); setTimeout(() => { fb.classList.remove('anim-start', 'anim-reverse'); fb.style.display = 'none'; if (sb) sb.style.display = 'block'; if (ab) ab.style.display = 'inline-flex'; submitted = false; }, 5000); };

let isScrolling = false;
window.addEventListener('scroll', () => {
    if (!isScrolling) {
        window.requestAnimationFrame(() => {
            const b = document.getElementById("back-to-top");
            if (window.innerWidth > 900) { const hn = document.querySelector('.header-name'), hr = document.querySelector('.hero'); if (window.scrollY > (hr ? hr.offsetHeight - 150 : 300)) hn.classList.add('visible'); else hn.classList.remove('visible'); }
            if (window.scrollY > 300) b.classList.add("visible"); else b.classList.remove("visible");

            // Circular progress logic
            const ptCircle = document.querySelector('.progress-ring__circle');
            if (ptCircle && window.ptCircumference) {
                const scrollTotal = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercentage = scrollTotal > 0 ? (window.scrollY / scrollTotal) : 0;
                ptCircle.style.strokeDashoffset = window.ptCircumference - (scrollPercentage * window.ptCircumference);
            }

            let c = ""; document.querySelectorAll("section").forEach(s => { if (window.scrollY >= (s.offsetTop - 150)) c = s.getAttribute("id"); });
            document.querySelectorAll(".nav-link").forEach(li => { li.classList.remove("active-section"); if (li.getAttribute("href") && li.getAttribute("href").includes(c)) li.classList.add("active-section"); });
            isScrolling = false;
        });
        isScrolling = true;
    }
}, { passive: true });

document.getElementById("back-to-top")?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: "smooth" }));

const revealObserver = new IntersectionObserver((entries) => { entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("active"); revealObserver.unobserve(e.target); } }); }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
const reveal = () => document.querySelectorAll(".reveal").forEach(r => revealObserver.observe(r));

/* ===== COMMAND PALETTE SEARCH ENGINE ===== */
(function () {
    const RECENT_KEY = 'srch_recent_v1';
    let idx = [], results = [], active = -1, debTimer = null, indexed = false;

    const ov = () => document.getElementById('srch-overlay');
    const inp = () => document.getElementById('srch-input');
    const body = () => document.getElementById('srch-body');

    /* Section map — matches section IDs in the actual HTML */
    const SECTIONS = [
        { id: 'research-vision', label: 'Research Vision', icon: 'fas fa-microscope', sels: ['#research-vision', '#roadmap-funding', '#lab-model'] },
        { id: 'experience', label: 'Research Experience', icon: 'fas fa-flask', sels: ['#profile-experience'] },
        { id: 'publications', label: 'Publications', icon: 'fas fa-book-open', sels: ['#publications'] },
        { id: 'awards', label: 'Awards', icon: 'fas fa-trophy', sels: ['#awards'] },
        { id: 'patents', label: 'Patents', icon: 'fas fa-certificate', sels: ['#patents'] },
        { id: 'technical', label: 'Skills & Tools', icon: 'fas fa-tools', sels: ['#technical'] },
        { id: 'professional', label: 'Professional Activities', icon: 'fas fa-briefcase', sels: ['#professional', '#conferences'] },
        { id: 'referees', label: 'Referees', icon: 'fas fa-users', sels: ['#referees'] },
        { id: 'contact', label: 'Contact', icon: 'fas fa-envelope', sels: ['#contact'] },
    ];

    /* ── Indexer ─────────────────────────────────────── */
    function buildIndex() {
        if (indexed) return;
        indexed = true;
        idx = [];
        const seen = new Set();

        SECTIONS.forEach(sec => {
            sec.sels.forEach(sel => {
                const root = document.querySelector(sel);
                if (!root) return;

                /* Headings as first-class results */
                root.querySelectorAll('h2, h3, h4, h5').forEach(h => {
                    const txt = h.textContent.trim();
                    if (!txt || txt.length < 3 || seen.has(h)) return;
                    seen.add(h);
                    idx.push({ title: txt, excerpt: siblingExcerpt(h), el: h, section: sec.label, icon: sec.icon, type: 'heading' });
                });

                /* Cards / items */
                const cardSel = '.pub-item,.exp-box,.edu-card,.award-card,.referee-card,.patent-card,.tcp-card,.act-card,.skill-category,.interest-item';
                root.querySelectorAll(cardSel).forEach(card => {
                    if (seen.has(card)) return;
                    seen.add(card);
                    const titleEl = card.querySelector('h3,h4,.pub-title,.exp-title,.exp-role,.card-title,.tcp-card-title,.tech-sub-title,.referee-name,.award-title,.patent-title,.course-title,.bento-title');
                    const title = (titleEl ? titleEl.textContent : card.textContent).trim().slice(0, 100);
                    if (!title || title.length < 3) return;
                    idx.push({ title, excerpt: cardExcerpt(card), el: card, section: sec.label, icon: sec.icon, type: 'card' });
                });
            });
        });
    }

    function siblingExcerpt(el) {
        const next = el.nextElementSibling;
        if (next) { const t = next.textContent.replace(/\s+/g, ' ').trim(); if (t.length > 8) return t.slice(0, 130); }
        return "";
    }

    function cardExcerpt(card) {
        const clone = card.cloneNode(true);
        clone.querySelectorAll('button,.cite-dropdown-menu,.badge,.year-badge,.badge-gold-inline,script,style').forEach(n => n.remove());
        return clone.textContent.replace(/\s+/g, ' ').trim().slice(0, 140);
    }

    /* ── Scorer ──────────────────────────────────────── */
    function scoreItem(item, ql) {
        const tl = item.title.toLowerCase();
        const el = (item.excerpt || '').toLowerCase();
        const words = ql.split(/\s+/).filter(w => w.length > 2);
        if (item.type === 'heading' && !tl.includes(ql) && !words.some(w => tl.includes(w))) return 0;
        if (words.length === 0) return ql.length > 2 && (tl.includes(ql) || el.includes(ql)) ? 10 : 0;

        let s = 0;
        // Exact matches
        if (tl === ql) s += 100;
        else if (tl.includes(ql)) s += 50;

        // Word-based scoring
        let matchCount = 0;
        words.forEach(w => {
            if (tl.includes(w)) { s += 20; matchCount++; }
            else if (el.includes(w)) { s += 5; matchCount++; }
        });

        // All words must match for multi-word queries to avoid noise
        if (words.length > 1 && matchCount < words.length) return 0;

        if (item.type === 'heading') s += 2;
        return s;
    }

    /* ── Highlight ───────────────────────────────────── */
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function mark(text, q) {
        if (!q) return esc(text);
        return esc(text).replace(new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi'), '<mark>$1</mark>');
    }

    /* ── Recent Searches ─────────────────────────────── */
    function getRecent() { try { return JSON.parse(sessionStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; } }
    function addRecent(q) {
        if (!q || q.length < 2) return;
        let r = getRecent().filter(x => x !== q);
        r.unshift(q); r = r.slice(0, 5);
        try { sessionStorage.setItem(RECENT_KEY, JSON.stringify(r)); } catch { }
    }

    /* ── Render ──────────────────────────────────────── */
    function renderBody(q) {
        const b = body(); if (!b) return;
        if (!q) {
            const recent = getRecent();
            if (recent.length) {
                b.innerHTML = '<div class="srch-section-hd">Recent Searches</div>' +
                    recent.map(r => `<div class="srch-item srch-recent" data-q="${esc(r)}"><div class="srch-item-icon"><i class="fas fa-clock"></i></div><div class="srch-item-body"><div class="srch-item-title">${esc(r)}</div></div></div>`).join('');
                b.querySelectorAll('.srch-recent').forEach(el => el.addEventListener('click', () => { inp().value = el.dataset.q; runSearch(el.dataset.q); }));
            } else {
                b.innerHTML = '<div class="srch-empty"><i class="fas fa-search"></i>Type to search publications, awards, skills&hellip;<br><small style="margin-top:6px;display:block">Or use Ctrl+K to toggle</small></div>';
            }
            return;
        }
        if (!results.length) { b.innerHTML = `<div class="srch-empty"><i class="fas fa-circle-xmark"></i>No results for "<strong>${esc(q)}</strong>"</div>`; return; }

        const groups = {};
        results.forEach(r => { (groups[r.section] = groups[r.section] || []).push(r); });
        let html = '', gi = 0;
        Object.entries(groups).forEach(([sec, items]) => {
            html += `<div class="srch-section-hd">${esc(sec)}<span class="srch-badge">${items.length}</span></div>`;
            items.forEach(item => {
                const i = gi++;
                html += `<div class="srch-item${i === active ? ' srch-active' : ''}" data-idx="${i}">
                    <div class="srch-item-icon"><i class="${item.icon}"></i></div>
                    <div class="srch-item-body">
                        <div class="srch-item-title">${mark(item.title.slice(0, 80), q)}</div>
                        ${item.excerpt ? `<div class="srch-item-excerpt">${mark(item.excerpt.slice(0, 120), q)}</div>` : ''}
                    </div>
                    <span class="srch-item-cat">${esc(sec)}</span>
                </div>`;
            });
        });
        b.innerHTML = html;
        b.querySelectorAll('.srch-item[data-idx]').forEach(el => el.addEventListener('click', () => navigateTo(parseInt(el.dataset.idx), q)));
    }

    /* ── Search ──────────────────────────────────────── */
    function runSearch(q) {
        buildIndex();
        active = -1;
        q = q.trim();
        if (!q) { results = []; renderBody(''); return; }
        const ql = q.toLowerCase();
        results = idx
            .map(item => ({ ...item, _s: scoreItem(item, ql) }))
            .filter(item => item._s > 0)
            .sort((a, b) => b._s - a._s)
            .slice(0, 40);
        renderBody(q);
    }

    /* ── Navigate to result ──────────────────────────── */
    function navigateTo(i, q) {
        if (i < 0 || i >= results.length) return;
        const item = results[i];
        addRecent(q || (inp() && inp().value.trim()));
        closeSearchModal();
        let target = item.el, panelOpened = false;
        let p = target.parentElement;
        while (p && p !== document.body) {
            if (p.classList.contains('panel')) {
                const btn = p.previousElementSibling;
                if (btn && btn.classList.contains('accordion-btn') && !btn.classList.contains('active')) { btn.click(); panelOpened = true; }
                break;
            }
            p = p.parentElement;
        }
        setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            target.classList.add('srch-flash');
            setTimeout(() => target.classList.remove('srch-flash'), 1800);
        }, panelOpened ? 650 : 200);
    }

    /* ── Keyboard nav ────────────────────────────────── */
    function moveActive(delta) {
        if (!results.length) return;
        active = Math.max(0, Math.min(results.length - 1, active + delta));
        const items = body() && body().querySelectorAll('.srch-item[data-idx]');
        if (!items) return;
        items.forEach((el, i) => el.classList.toggle('srch-active', i === active));
        if (items[active]) items[active].scrollIntoView({ block: 'nearest' });
    }

    /* ── Open / Close ────────────────────────────────── */
    window.openSearchModal = function () {
        buildIndex();
        const o = ov(); if (!o) return;
        o.classList.add('srch-open');
        setTimeout(() => { const i = inp(); if (i) { i.focus(); i.select(); } }, 80);
        runSearch(inp() ? inp().value : '');
    };
    window.closeSearchModal = function () {
        const o = ov(); if (!o) return;
        o.classList.remove('srch-open');
        setTimeout(() => { const i = inp(); if (i) i.value = ''; results = []; active = -1; }, 220);
    };

    /* ── Wire events after DOM ready ─────────────────── */
    function wireEvents() {
        const i = inp(), o = ov(); if (!i || !o) return;
        i.addEventListener('input', () => { clearTimeout(debTimer); debTimer = setTimeout(() => runSearch(i.value), 120); });
        i.addEventListener('keydown', e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
            else if (e.key === 'Enter') { e.preventDefault(); if (active >= 0) navigateTo(active, i.value.trim()); else if (results.length) navigateTo(0, i.value.trim()); }
            else if (e.key === 'Escape') closeSearchModal();
        });
        o.addEventListener('click', e => { if (e.target === o) closeSearchModal(); });
        document.querySelectorAll('.srch-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                closeSearchModal();
                const el = document.getElementById(pill.dataset.section);
                if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 220);
            });
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireEvents);
    else wireEvents();

    /* Ctrl+K / Cmd+K */
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const o = ov();
            if (o && o.classList.contains('srch-open')) closeSearchModal(); else openSearchModal();
        }
    });
})();

const languages = { 'en': { flag: 'gb', code: 'EN' }, 'da': { flag: 'dk', code: 'DA' }, 'es': { flag: 'es', code: 'ES' }, 'fr': { flag: 'fr', code: 'FR' }, 'de': { flag: 'de', code: 'DE' }, 'hi': { flag: 'in', code: 'HI' }, 'zh-CN': { flag: 'cn', code: 'ZH' }, 'ar': { flag: 'sa', code: 'AR' }, 'ur': { flag: 'pk', code: 'UR' }, 'ru': { flag: 'ru', code: 'RU' }, 'ja': { flag: 'jp', code: 'JA' } };

/* Builds both lang dropdowns from one source — add/remove a language here, not in HTML */
const LANGS = [{ code: 'en', flag: 'gb', title: 'English (UK)', label: 'English' }, { code: 'da', flag: 'dk', title: 'Danish (Denmark)', label: 'Dansk' }, { code: 'es', flag: 'es', title: 'Spanish (Spain)', label: 'Español' }, { code: 'fr', flag: 'fr', title: 'French (France)', label: 'Français' }, { code: 'de', flag: 'de', title: 'German (Germany)', label: 'Deutsch' }, { code: 'hi', flag: 'in', title: 'Hindi (India)', label: 'हिन्दी' }, { code: 'zh-CN', flag: 'cn', title: 'Chinese (China)', label: '中文' }, { code: 'ar', flag: 'sa', title: 'Arabic (Saudi Arabia)', label: 'العربية' }, { code: 'ur', flag: 'pk', title: 'Urdu (India/Pakistan)', label: 'اردو' }, { code: 'ru', flag: 'ru', title: 'Russian (Russia)', label: 'Русский' }, { code: 'ja', flag: 'jp', title: 'Japanese (Japan)', label: '日本語' }];
const buildLangOptions = () => { document.querySelectorAll('.custom-lang-dropdown').forEach(dd => { dd.innerHTML = LANGS.map(l => `<div class="lang-option" onclick="changeLanguage('${l.code}')" data-tip="${l.title}"><img src="https://flagcdn.com/w40/${l.flag}.png" class="flag-img" loading="lazy" alt="${l.flag.toUpperCase()}"> ${l.label}</div>`).join(''); }); }; buildLangOptions();

const toggleLangDropdown = (e) => { e.stopPropagation(); const wrapper = e.currentTarget; const dd = wrapper.querySelector('.custom-lang-dropdown'); if (!dd) return; const isShown = dd.classList.contains('show'); document.querySelectorAll('.custom-lang-dropdown').forEach(d => d.classList.remove('show')); if (!isShown) dd.classList.add('show'); };
const changeLanguage = (c) => { const s = document.querySelector('.goog-te-combo'); if (s) { s.value = c; s.dispatchEvent(new Event('change')); } const l = languages[c] || languages['en']; document.querySelectorAll('.lang-current-display').forEach(el => el.innerHTML = `<img src="https://flagcdn.com/w40/${l.flag}.png" class="flag-xs" alt="${l.code}"> ${l.code} <i class="fas fa-chevron-down"></i>`); document.querySelectorAll('.custom-lang-dropdown').forEach(d => d.classList.remove('show')); };
const toggleMenu = (e) => { if (e) e.stopPropagation(); const nb = document.querySelector('.nav-list'), tb = document.querySelector('.nav-toggle'), mDD = document.getElementById('global-lang-dd'); if (mDD && mDD.classList.contains('show')) mDD.classList.remove('show'); closeAllDropdowns(); nb.classList.toggle('active'); tb.classList.toggle('open'); }; const toggleMobileSubmenu = (e, tId) => { e.stopPropagation(); const dd = document.getElementById(tId), tb = e.currentTarget; closeAllDropdowns(dd); if (dd.classList.contains('show-mobile')) { dd.classList.remove('show-mobile'); tb.classList.remove('active'); tb.innerHTML = '<i class="fas fa-chevron-down"></i>'; } else { dd.classList.add('show-mobile'); tb.classList.add('active'); tb.innerHTML = '<i class="fas fa-chevron-up"></i>'; } }; document.querySelectorAll('.nav-link').forEach(l => { if (!l.closest('.nav-item-dropdown')) l.addEventListener('click', () => { const nb = document.querySelector('.nav-list'), tb = document.querySelector('.nav-toggle'); if (nb.classList.contains('active')) { nb.classList.remove('active'); tb.classList.remove('open'); } }); });
const assignReverseBadges = () => [document.querySelector('.exp-grid-vertical'), document.querySelector('.edu-grid'), document.querySelector('.referee-grid'), document.querySelector('.award-box-grid')].forEach(c => { if (!c) return; const cs = c.querySelectorAll('.exp-box, .edu-card, .referee-card, .award-card'); cs.forEach((cd, i) => cd.setAttribute('data-badge', cs.length - i)); });
const fixReversedListStart = () => {
    const attendedList = document.getElementById('attended-list');
    if (attendedList) attendedList.setAttribute('start', attendedList.querySelectorAll('li').length);
};

const scrollNextBatch = (btn) => {
    const panel = btn.closest('.panel');
    const scrollContainer = panel.querySelector('.scrollable-list, .scrollable-grid');
    if (!scrollContainer) return;
    const isGrid = scrollContainer.classList.contains('scrollable-grid');
    const scrollAmount = Math.max(220, Math.round(scrollContainer.clientHeight * (isGrid ? 0.9 : 0.85)));
    const nearBottom = scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 20;
    if (nearBottom) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        scrollContainer.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    }
};

const ensureScrollMoreButton = (panel) => {
    const container = panel.querySelector('.scrollable-list, .scrollable-grid');
    if (!container) return null;
    let btn = panel.querySelector('.scroll-more-btn');
    if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'scroll-more-btn';
        btn.setAttribute('data-tip', 'Scroll More');
        btn.setAttribute('aria-label', 'Scroll more');
        btn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        btn.addEventListener('click', () => scrollNextBatch(btn));
        panel.appendChild(btn);
    }
    return btn;
};

const refreshActivePanelHeight = (panel) => {
    const btn = panel.previousElementSibling;
    if (btn && btn.classList.contains('accordion-btn') && btn.classList.contains('active')) {
        panel.style.maxHeight = panel.scrollHeight + "px";
    }
};

const updateScrollMoreVisibility = (panel) => {
    const btn = ensureScrollMoreButton(panel);
    const container = panel.querySelector('.scrollable-list, .scrollable-grid');
    if (btn && container) {
        const hasOverflow = container.scrollHeight > container.clientHeight + 8;
        btn.style.display = hasOverflow ? 'flex' : 'none';
        refreshActivePanelHeight(panel);
    }
};

const updateAllScrollMoreButtons = () => {
    document.querySelectorAll('.panel').forEach(updateScrollMoreVisibility);
};

const acc = document.getElementsByClassName("accordion-btn"); 
for (let i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", function () { 
        for (let j = 0; j < acc.length; j++) {
            if (acc[j] !== this && acc[j].classList.contains("active")) { 
                acc[j].classList.remove("active"); 
                acc[j].nextElementSibling.style.maxHeight = null; 
            } 
        }
        this.classList.toggle("active"); 
        const p = this.nextElementSibling; 
        if (p.style.maxHeight) {
            p.style.maxHeight = null; 
        } else { 
            p.style.maxHeight = p.scrollHeight + "px"; 
            setTimeout(() => {
                this.scrollIntoView({ behavior: "smooth", block: "nearest" });
                updateScrollMoreVisibility(p);
            }, 450); /* Account for 0.4s CSS transition */
        } 
    }); 
}
window.triggerAccordion = (buttonId) => {
    const evt = window.event;
    if (evt && typeof evt.preventDefault === "function") evt.preventDefault();

    const btn = document.getElementById(buttonId);
    if (!btn) return false;

    const panel = btn.nextElementSibling;
    if (!panel) return false;

    for (let i = 0; i < acc.length; i++) {
        if (acc[i] !== btn && acc[i].classList.contains("active")) {
            acc[i].classList.remove("active");
            if (acc[i].nextElementSibling) acc[i].nextElementSibling.style.maxHeight = null;
        }
    }

    if (!btn.classList.contains("active")) btn.classList.add("active");
    panel.style.maxHeight = panel.scrollHeight + "px";
    updateScrollMoreVisibility(panel);

    const nav = document.querySelector(".nav-list");
    const toggle = document.querySelector(".nav-toggle");
    if (nav) nav.classList.remove("active");
    if (toggle) toggle.classList.remove("open");
    closeAllDropdowns();

    const scrollToButton = () => {
        const header = document.getElementById("main-header");
        const headerOffset = (header ? header.offsetHeight : 0) + 14;
        const top = btn.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top, behavior: "smooth" });
    };

    setTimeout(scrollToButton, 480);
    return false;
};

updateAllScrollMoreButtons();
window.addEventListener('resize', () => {
    clearTimeout(window.__scrollMoreResizeTimer);
    window.__scrollMoreResizeTimer = setTimeout(updateAllScrollMoreButtons, 150);
}, { passive: true });
window.addEventListener('load', updateAllScrollMoreButtons);
const togglePubStats = (e) => { if (e.target.closest('.stat-row')) { e.preventDefault(); e.stopPropagation(); const bd = document.getElementById('pub-breakdown'), ti = document.querySelector('.stat-toggle i'), pc = e.target.closest('.stat-row-link'); if (bd.classList.contains('open')) { bd.classList.remove('open'); bd.style.maxHeight = "0"; ti.classList.remove('fa-chevron-up'); ti.classList.add('fa-chevron-down'); if (pc) pc.classList.remove('active-box'); } else { bd.classList.add('open'); bd.style.maxHeight = bd.scrollHeight + "px"; ti.classList.remove('fa-chevron-down'); ti.classList.add('fa-chevron-up'); if (pc) pc.classList.add('active-box'); runSequentialCounters('#pub-breakdown .pub-badge', 2500); } } };
let sfAId, sfSpd = 0.8, isSfM = false; 
const startSFScroll = () => { 
    const t = document.getElementById('sf-track'); if (!t) return; 
    if (!t.dataset.cloned) { Array.from(t.querySelectorAll('.interest-card')).forEach(c => t.appendChild(c.cloneNode(true))); t.dataset.cloned = 'true'; } 
    cancelAnimationFrame(sfAId); 
    let accum = 0;
    const step = () => { 
        if (!t.matches(':hover') && !isSfM) { 
            accum += sfSpd;
            if (accum >= 1) {
                t.scrollLeft += Math.floor(accum); 
                accum -= Math.floor(accum);
                const cs = t.querySelectorAll('.interest-card'), jd = cs[cs.length / 2].offsetLeft - cs[0].offsetLeft; 
                if (t.scrollLeft >= jd) t.scrollLeft -= jd; 
            }
        } 
        sfAId = requestAnimationFrame(step); 
    }; 
    sfAId = requestAnimationFrame(step); 
}; 
const scrollSF = (dir) => { const t = document.getElementById('sf-track'); if (!t) return; isSfM = true; t.style.scrollBehavior = 'smooth'; const cw = t.querySelector('.interest-card').offsetWidth + 40; t.scrollLeft += dir * cw; setTimeout(() => { t.style.scrollBehavior = 'auto'; const cs = t.querySelectorAll('.interest-card'), jd = cs[cs.length / 2].offsetLeft - cs[0].offsetLeft; if (t.scrollLeft >= jd) t.scrollLeft -= jd; else if (t.scrollLeft <= 0) t.scrollLeft += jd; isSfM = false; }, 500); };

/* Artificial Intelligence Handlers (DOI Knowledgebase & Core Generators) */
const showAIModal = (content) => { document.getElementById('ai-modal-content').innerHTML = content; document.getElementById('ai-modal').classList.add('show'); };
const closeAIModal = (e) => { if (e && e.target && e.target.id !== 'ai-modal' && !e.target.classList.contains('ai-close-btn')) return; const m = document.getElementById('ai-modal'); if (m) m.classList.remove('show'); };

const shareToSocial = (platform, url) => {
    const text = document.getElementById('ai-gen-text').value;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent((url && url !== 'undefined' && url !== 'null') ? url : window.location.href);

    // Auto-copy text to clipboard (Crucial for LinkedIn, FB, and Instagram which block text pre-filling via URL)
    navigator.clipboard.writeText(text).catch(err => console.log('Copy failed', err));

    let shareLink = '';
    if (platform === 'twitter') shareLink = `https://twitter.com/intent/tweet?text=${encodedText}`;
    else if (platform === 'linkedin') shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    else if (platform === 'facebook') shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    else if (platform === 'whatsapp') shareLink = `https://api.whatsapp.com/send?text=${encodedText}`;
    else if (platform === 'instagram') shareLink = `https://www.instagram.com/`; // Opens IG (user pastes text)

    if (shareLink) window.open(shareLink, '_blank', 'width=600,height=600');
};

const summariseContributions = () => {
    const contributionsText = Array.from(document.querySelectorAll('.bento-card .bento-desc')).map(el => el.innerText).join(' ');
    triggerAIFeature(
        'summarise-contributions-btn',
        'contributions-summary',
        '✨',
        'AI Summary',
        'Summarising...',
        `Summarise these key scientific contributions in 3-4 concise bullet points. Use HTML for formatting, with <strong> for emphasis. Contributions: ${contributionsText}`,
        (res) => {
            const rb = document.getElementById('contributions-summary');
            rb.style.display = 'block';
            rb.innerHTML = `<i class="fas fa-times" style="float:right; cursor:pointer; color:#888;" onclick="this.parentElement.style.display='none'"></i><strong>✨ AI Summary of Contributions:</strong><br><br><ul>${res}</ul>`;
        }
    );
};

const fetchFromBackend = async (prompt, retries = 3, delay = 2000, signal = null) => {
    try {
        const res = await fetch(PROFILE_CONFIG.backendUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }), signal });
        const data = await res.json();
        if (!res.ok) { if (res.status === 429 && retries > 0) { await new Promise(r => setTimeout(r, delay)); return fetchFromBackend(prompt, retries - 1, delay * 2, signal); } throw new Error(data.error?.message || data.error || 'Backend request failed'); }
        if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) return data.candidates[0].content.parts[0].text; else if (data.text) return data.text; throw new Error("Unexpected response format.");
    } catch (err) { if (err.name === 'AbortError') throw err; if (err.message.includes('429') || err.message.includes('quota') || err.message.includes('Requests')) throw new Error("⏳ AI rate limit hit. Wait 30s."); throw err; }
};

const handlePublicationAction = async (type, title, doiUrl, btn) => {
    const orig = btn.innerHTML; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; btn.disabled = true;
    const hasDOI = doiUrl && doiUrl.includes('doi.org');
    const prompt = type === 'AI Report'
        ? (hasDOI ? `Using the valid DOI link (${doiUrl}) as a knowledgebase reference for the publication "${title}", provide a concise, academic 2-sentence summary of the likely findings. Do not use markdown.` : `Using internal synthesis for the publication "${title}", provide a concise, academic 2-sentence summary. Do not use markdown.`)
        : (hasDOI ? `Write a catchy social media post for the paper "${title}". Pull verified context using its DOI (${doiUrl}) knowledgebase. Include relevant emojis and 3 hashtags. Output plain text only.` : `Write a catchy social media post for the paper "${title}" using internal synthesis. Include relevant emojis and 3 hashtags. Output plain text only.`);

    try {
        let res = await fetchFromBackend(prompt);

        if (hasDOI) {
            if (type === 'AI Report') {
                res += `\n\nMore details are available here- ${doiUrl}`;
            } else if (type === 'Social Post') {
                res += `\n\nRead the full article here- ${doiUrl}`;
            }
        }

        let bottomControls = '';
        if (type === 'Social Post') {
            bottomControls = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; flex-wrap:wrap; gap:15px; border-top:1px solid #eee; padding-top:15px;">
                <div style="display:flex; gap:10px; align-items:center;">
                    <span style="font-size:0.9rem; color:#444; font-weight:800; margin-right:5px;">Share to:</span>
                    <button onclick="shareToSocial('linkedin', '${doiUrl}')" data-tip="Share on LinkedIn" style="background:linear-gradient(135deg, #0077b5, #005e93);
color:#fff; border:none; border-radius:10px; width:38px; height:38px; cursor:pointer; transition:all 0.3s cubic-bezier(0.175,0.885,0.32,1.275); font-size:1.15rem; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 8px rgba(0,119,181,0.3);" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'"><i class="fab fa-linkedin-in"></i></button>
                    <button onclick="shareToSocial('twitter', '${doiUrl}')" data-tip="Post to X" style="background:linear-gradient(135deg, #333333, #000000); color:#fff; border:none; border-radius:10px; width:38px; height:38px; cursor:pointer; transition:all 0.3s cubic-bezier(0.175,0.885,0.32,1.275); font-size:1.15rem; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 8px rgba(0,0,0,0.2);" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'"><i class="fab fa-x-twitter"></i></button>
                    <button onclick="shareToSocial('facebook', '${doiUrl}')" data-tip="Share on Facebook" style="background:linear-gradient(135deg, #1877f2, #115cbf); color:#fff; border:none; border-radius:10px; width:38px; height:38px; cursor:pointer; transition:all 0.3s cubic-bezier(0.175,0.885,0.32,1.275); font-size:1.15rem; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 8px rgba(24,119,242,0.3);" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'"><i class="fab fa-facebook-f"></i></button>
                    <button onclick="shareToSocial('whatsapp', '${doiUrl}')" data-tip="Share via WhatsApp" style="background:linear-gradient(135deg, #25d366, #128c7e); color:#fff; border:none; border-radius:10px; width:38px; height:38px; cursor:pointer; transition:all 0.3s cubic-bezier(0.175,0.885,0.32,1.275); font-size:1.2rem; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 8px rgba(37,211,102,0.3);" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'"><i class="fab fa-whatsapp"></i></button>
                    <button onclick="shareToSocial('instagram', '${doiUrl}')" data-tip="Open Instagram" style="background:linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color:#fff; border:none; border-radius:10px; width:38px; height:38px; cursor:pointer; transition:all 0.3s cubic-bezier(0.175,0.885,0.32,1.275); font-size:1.2rem; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 8px rgba(220,39,67,0.3);" onmouseover="this.style.transform='translateY(-4px)'" onmouseout="this.style.transform='translateY(0)'"><i class="fab fa-instagram"></i></button>
                </div>
                <button onclick="navigator.clipboard.writeText(document.getElementById('ai-gen-text').value); this.innerHTML='<i class=\\'fas fa-check\\'></i> Copied!';" class="btn-data" style="background-color:var(--accent); color:#fff; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; transition:all 0.3s ease; box-shadow:0 4px 10px rgba(245,158,11,0.3); font-size:0.9rem;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'"><i class="fas fa-copy"></i> Copy Text</button>
            </div>`;
        } else {
            bottomControls = `
            <div style="margin-top:20px; text-align:right; border-top:1px solid #eee; padding-top:15px;">
                <button onclick="navigator.clipboard.writeText(document.getElementById('ai-gen-text').value); this.innerHTML='<i class=\\'fas fa-check\\'></i> Copied!';" class="btn-data" style="background-color:var(--accent); color:#fff; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; transition:all 0.3s ease; box-shadow:0 4px 10px rgba(245,158,11,0.3); font-size:0.9rem;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'"><i class="fas fa-copy"></i> Copy Text</button>
            </div>`;
        }

        showAIModal(`<strong>${type === 'AI Report' ? '✨ DOI/AI Report:' : '🐦 Social Draft:'}</strong><br><br><textarea id="ai-gen-text" aria-label="Generated AI text" style="width:100%; min-height:120px; background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #1DA1F2; font-family:inherit; font-size:0.95rem; line-height:1.5; resize:vertical;">${res.trim()}</textarea>${bottomControls}`);
    } catch (e) { btn.innerHTML = '❌'; setTimeout(() => btn.innerHTML = orig, 3000); } finally { btn.disabled = false; btn.innerHTML = orig; }
};

let activeAbort = null;
const triggerAIFeature = async (btnId, resultId, icon, btnText, loadingText, prompt, formatCallback) => {
    const btn = document.getElementById(btnId), resBox = document.getElementById(resultId); if (!btn) return;
    if (activeAbort && activeAbort.id === btnId) { activeAbort.ctrl.abort(); activeAbort = null; btn.classList.remove('processing-gold'); btn.innerHTML = `<span class="btn-icon">${icon}</span><span class="btn-text">${btnText}</span>`; if (resBox) resBox.style.display = 'none'; return; }
    if (activeAbort) { activeAbort.ctrl.abort(); const oldBtn = document.getElementById(activeAbort.id); if (oldBtn) { oldBtn.classList.remove('processing-gold'); oldBtn.innerHTML = activeAbort.html; } }
    btn.innerHTML = `<span class="btn-icon"><i class="fas fa-spinner fa-spin"></i></span><span class="btn-text">${loadingText}</span>`; btn.classList.add('processing-gold'); if (resBox) resBox.style.display = 'none';
    const ctrl = new AbortController(); activeAbort = { id: btnId, ctrl, html: `<span class="btn-icon">${icon}</span><span class="btn-text">${btnText}</span>` };
    try { const res = await fetchFromBackend(prompt, 3, 2000, ctrl.signal); if (activeAbort && activeAbort.id === btnId) formatCallback(res); } catch (e) { if (e.name !== 'AbortError') { if (resBox) { resBox.innerHTML = `<strong>❌ Error:</strong> ${e.message}`; resBox.style.display = 'block'; } else { showAIModal(`<div style="color:#dc2626;font-weight:700;margin-bottom:8px;">❌ Error</div><p style="margin:0;">${e.message}</p>`); } } } finally { if (activeAbort && activeAbort.id === btnId) { btn.classList.remove('processing-gold'); btn.innerHTML = activeAbort.html; activeAbort = null; } }
};

/* --- Teaching Statement Generator */
const generateTeachingStatement = () => {
    triggerAIFeature(
        'gen-teaching-btn',
        'teaching-statement-result',
        '✨', 'Teaching Statement', 'Drafting...',
        `Write a formal 3-paragraph academic teaching statement for Dr Shaban Ahmad, a Postdoctoral Researcher in computational biology and AI-driven drug discovery at the University of Copenhagen. His philosophy: (1) fosters dual competency — students who are both conceptually strong and computationally confident; (2) transitions students from passive learning to active problem-solving using real biological data and real scientific uncertainty; (3) uses a structured-to-independent mentorship model — strong onboarding, shared tools, clear milestones, then gradual independence. He teaches computational drug discovery (AutoDock, GROMACS, SBDD), machine learning for biological data (deep learning, XAI/SHAP), bioinformatics and computational genomics (NGS, WGS, Snakemake), Big Data in Biotechnology (large-scale data management, pipelines in R/Python), and AI in precision medicine and environmental biotech. Write in first person, academic register. Use HTML formatting: wrap each paragraph in <p> tags, use <strong> for 2-3 key phrases per paragraph. No section headings needed. Each paragraph 70-90 words.`,
        (res) => {
            const rb = document.getElementById('teaching-statement-result');
            rb.style.display = 'block';
            rb.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.7rem;"><strong style="color:var(--primary); font-size:0.97rem;">✨ AI Teaching Statement Draft</strong><button onclick="this.closest('[id=teaching-statement-result]').style.display='none'" style="background:none; border:none; cursor:pointer; color:#aaa; font-size:1.3rem; line-height:1; padding:0; margin-left:1rem;" title="Dismiss">×</button></div><div style="border-top:1px solid rgba(0,0,0,0.08); padding-top:0.8rem;">${res}</div><p style="margin-top:0.8rem; font-size:0.75rem; color:#94a3b8; font-style:italic;">AI-generated draft — review and personalise before use.</p>`;
        }
    );
};

/* --- Course Syllabus Generator */
const COURSE_META = {
    'big-data-biotech': { title: 'Big Data in Biotechnology', icon: '📊', level: 'Graduate (UCPH - NPLK19000U)' },
    'bioinformatics': { title: 'Basics to Advanced Bioinformatics', icon: '🧬', level: 'UG / Graduate' },
    'drug-design': { title: 'Computational Drug Design', icon: '💊', level: 'UG / Graduate' },
    'ml-drug-design': { title: 'ML in Drug Design', icon: '🤖', level: 'Graduate' },
    'ml-genomics': { title: 'Machine Learning in Genomics', icon: '🧠', level: 'Graduate' },
    'precision-medicine': { title: 'AI in Precision Medicine', icon: '🏥', level: 'Advanced / Elective' },
    'bio-degradation': { title: 'AI in Biological Degradations & Biotech', icon: '🌿', level: 'Advanced / Elective' }
};
const generateSyllabus = (courseKey) => {
    const course = COURSE_META[courseKey];
    if (!course) return;
    triggerAIFeature(
        `syllabus-${courseKey}`,
        null,
        '✨', 'AI Syllabus', 'Generating...',
        `Generate a concise academic syllabus for "${course.title}" (${course.level}) taught by Dr Shaban Ahmad, computational biologist at UCPH. Output only HTML using these exact tags: <strong>Weekly Topics</strong> then <ol> with 8-10 items, <strong>Learning Outcomes</strong> then <ul> with 3 items, <strong>Assessment</strong> then <ul> with 2-3 methods. Each list item under 10 words. No paragraphs, no intro text.`,
        (res) => {
            showAIModal(`<div class="syllabus-modal-content"><div class="syllabus-header"><span class="syllabus-icon">${course.icon}</span><div><div class="syllabus-title">${course.title}</div><div class="syllabus-subtitle">${course.level} &nbsp;·&nbsp; AI-Generated Syllabus Outline</div></div></div><div class="syllabus-body">${res}</div><p class="syllabus-disclaimer">AI-generated outline — customise as needed before institutional submission.</p></div>`);
        }
    );
};

function toggleOlderAttended(btn) {
    var list = document.getElementById('attended-list');
    var showing = list.classList.toggle('show-older');
    btn.textContent = showing ? '▲ Hide older entries (2016–2021)' : '▼ Show older entries (2016–2021)';
}

// Cycles: Marquee → Grid → List → Marquee
function togglePubView() {
    var mq = document.getElementById('pub-marquee-wrapper');
    var cards = document.getElementById('contrib-pub-cards');
    var list = document.getElementById('contrib-pub-list');
    var btn = document.getElementById('pub-view-btn');
    var icon = btn.querySelector('.btn-icon i');
    var text = btn.querySelector('.btn-text');
    var mqVisible = mq && mq.style.display !== 'none';
    if (mqVisible) {                                  // Marquee → Grid
        if (mq) mq.style.display = 'none';
        cards.style.display = 'grid';
        list.style.display = 'none';
        icon.className = 'fas fa-list';
        text.textContent = 'View as List';
    } else if (cards.style.display === 'grid') {     // Grid → List
        cards.style.display = 'none';
        list.style.display = 'block';
        icon.className = 'fas fa-film';
        text.textContent = 'View as Marquee';
    } else {                                          // List → Marquee
        if (mq) mq.style.display = '';
        cards.style.display = 'none';
        list.style.display = 'none';
        icon.className = 'fas fa-th-large';
        text.textContent = 'View as Grid';
    }
}

/* ===== HIGHLIGHTED PUBLICATIONS — DATA-DRIVEN MARQUEE =====
 * Edit HIGHLIGHTED_PUB_TITLES below to change which papers appear.
 * Use a distinctive substring of the title (first 30–40 chars is enough).
 * Everything else (journal, year, DOI, code/data links, AI description)
 * is auto-fetched from the Publications section DOM and the AI backend. */
const HIGHLIGHTED_PUB_TITLES = [
    "DrLungker: A Deep Ensemble Learning Framework",
    "Molecular Dynamics Simulation and Docking Studies Reveal Inhibition of NF-kB",
    "In-silico and in-vitro studies reveal ziprasidone",
    "SARS-CoV-2 Variants Show a Gradual Declining Pathogenicity",
    "Machine Learning for Genomic Profiling and Drug Discovery"
];

function scrapePubData(keyword) {
    const kw = keyword.toLowerCase().substring(0, 40);
    for (const item of document.querySelectorAll('.pub-item')) {
        const titleEl = item.querySelector('strong');
        if (!titleEl) continue;
        const fullTitle = titleEl.textContent.trim();
        if (fullTitle.toLowerCase().includes(kw)) {
            const emEl = item.querySelector('em');
            const doiEl = item.querySelector('.pub-doi');
            const allData = Array.from(item.querySelectorAll('.btn-data'));
            const codeEl = allData.find(a => a.href && a.href.includes('github'));
            const dataEl = allData.find(a => a.href && !a.href.includes('github'));
            const emText = emEl ? emEl.textContent.trim() : '';
            const yrMatch = emText.match(/\((\d{4})\)/);
            const journal = emText.replace(/\s*\(\d{4}\)\s*$/, '').replace(/\s*\(\d{4}\)\s*/g, '').trim();
            // Shorten: take part after em-dash/hyphen if present (publisher — Journal → Journal)
            const jrnlShort = journal.includes('—') ? journal.split('—').pop().trim() : journal;
            const year = yrMatch ? yrMatch[1] : '';
            return { fullTitle, journal: jrnlShort, year, doi: doiEl ? doiEl.href : null, codeHref: codeEl ? codeEl.href : null, dataHref: dataEl ? dataEl.href : null };
        }
    }
    return null;
}

function getPubCacheKey(title) {
    return 'pmq_v2_' + title.replace(/[^a-zA-Z0-9]/g, '').substring(0, 44);
}

// Updates the .pub-mq-desc in EVERY card (original + clones) matching this title
function setPubDescInTrack(track, encodedTitle, html) {
    track.querySelectorAll(`.pub-mq-card[data-pub-key="${encodedTitle}"]`).forEach(card => {
        const el = card.querySelector('.pub-mq-desc');
        if (el) el.innerHTML = html;
    });
}

// Injects AI description into the matching <li> in the list view
function updateListDesc(fullTitle, descHtml) {
    const listEl = document.querySelector('#contrib-pub-list');
    if (!listEl) return;
    const kw = fullTitle.toLowerCase().substring(0, 35);
    for (const li of listEl.querySelectorAll('.pub-item')) {
        const strong = li.querySelector('strong');
        if (!strong || !strong.textContent.toLowerCase().includes(kw)) continue;
        let descDiv = li.querySelector('.pub-list-ai-desc');
        if (!descDiv) {
            descDiv = document.createElement('div');
            descDiv.className = 'pub-list-ai-desc';
            const br = li.querySelector('br');
            if (br) br.after(descDiv); else li.appendChild(descDiv);
        }
        descDiv.innerHTML = descHtml;
        return;
    }
}

let pmqAId, pmqSpd = 0.55, isPmqPaused = false;
const startPubMarquee = () => {
    const t = document.getElementById('pub-mq-track');
    if (!t || !t.children.length) return;
    if (!t.dataset.cloned) {
        Array.from(t.querySelectorAll('.pub-mq-card')).forEach(c => t.appendChild(c.cloneNode(true)));
        t.dataset.cloned = 'true';
    }
    cancelAnimationFrame(pmqAId);
    let accum = 0;
    const step = () => {
        if (!t.matches(':hover') && !isPmqPaused) {
            accum += pmqSpd;
            if (accum >= 1) {
                t.scrollLeft += Math.floor(accum);
                accum -= Math.floor(accum);
                const cs = t.querySelectorAll('.pub-mq-card');
                if (cs.length >= 2) {
                    const half = Math.floor(cs.length / 2);
                    const jump = cs[half].offsetLeft - cs[0].offsetLeft;
                    if (t.scrollLeft >= jump) t.scrollLeft -= jump;
                }
            }
        }
        pmqAId = requestAnimationFrame(step);
    };
    pmqAId = requestAnimationFrame(step);
};

// Extract the hardcoded impact text from the grid card matching keyword
function getGridCardDesc(keyword) {
    const kw = keyword.toLowerCase().substring(0, 40);
    for (const card of document.querySelectorAll('#contrib-pub-cards .sel-pub-card')) {
        const titleEl = card.querySelector('.sel-pub-title');
        if (!titleEl || !titleEl.textContent.toLowerCase().includes(kw)) continue;
        const impactEl = card.querySelector('.sel-pub-impact');
        if (!impactEl) continue;
        const clone = impactEl.cloneNode(true);
        const icon = clone.querySelector('i');
        if (icon) icon.remove();
        return clone.textContent.trim();
    }
    return null;
}

async function buildPubMarquee() {
    const track = document.getElementById('pub-mq-track');
    if (!track) return;

    // 1. Scrape all data and check cache/grid upfront
    const items = [];
    for (const keyword of HIGHLIGHTED_PUB_TITLES) {
        const d = scrapePubData(keyword);
        if (!d) continue;
        const cacheKey = getPubCacheKey(d.fullTitle);
        const gridDesc = getGridCardDesc(keyword);         // grid card text = priority source
        const cachedAI = localStorage.getItem(cacheKey);
        const cachedDesc = gridDesc || cachedAI || null;    // grid > AI cache > fetch
        items.push({ ...d, cacheKey, cachedDesc, gridDesc, encKey: encodeURIComponent(cacheKey) });
    }
    if (!items.length) return;

    // 2. Build HTML — use best available description; spinner only if nothing found
    let html = '';
    const mqColors = ['var(--primary)', 'var(--ref-2)', 'var(--ref-3)', 'var(--ref-4)', 'var(--accent)'];
    for (let i = 0; i < items.length; i++) {
        const d = items[i];
        const doi = d.doi ? `<a class="pub-doi" href="${d.doi}" target="_blank" rel="noopener">DOI</a>` : '';
        const code = d.codeHref ? `<a href="${d.codeHref}" target="_blank" class="btn-data" rel="noopener"><i class="fab fa-github"></i> Code</a>` : '';
        const dat = d.dataHref ? `<a href="${d.dataHref}" target="_blank" class="btn-data" rel="noopener"><i class="fas fa-database"></i> Data</a>` : '';
        const jrnl = d.journal ? (d.journal + (d.year ? ' · ' + d.year : '')) : (d.year || '');
        const desc = d.cachedDesc
            ? d.cachedDesc
            : '<i class="fas fa-spinner fa-spin" style="color:#aaa;font-size:0.78rem;"></i>';
        const borderColor = mqColors[i % mqColors.length];
        html += `<div class="pub-mq-card" data-pub-key="${d.encKey}" style="--card-border-color:${borderColor}">
            ${jrnl ? `<span class="pub-mq-journal">${jrnl}</span>` : ''}
            <div class="pub-mq-title">${d.fullTitle}</div>
            <div class="pub-mq-desc">${desc}</div>
            <div class="pub-mq-actions">${doi}${code}${dat}</div>
        </div>`;
    }
    track.innerHTML = html;

    // 3. Start marquee (clones cards — data-pub-key is preserved on clones)
    startPubMarquee();

    // 4a. Populate list view with any already-available descriptions immediately
    for (const d of items) {
        if (d.cachedDesc) updateListDesc(d.fullTitle, d.cachedDesc);
    }

    // 4b. Fetch AI only for items with no grid desc AND no cached AI
    for (const d of items) {
        if (d.cachedDesc) continue;   // grid desc or cached AI already covers this
        try {
            const res = await fetchFromBackend(`In one sentence (max 20 words), state the scientific significance of this paper for a faculty hiring committee: "${d.fullTitle}"`);
            const clean = res.replace(/<[^>]*>/g, '').trim().replace(/^["']|["']$/g, '');
            localStorage.setItem(d.cacheKey, clean);
            setPubDescInTrack(track, d.encKey, clean);
            updateListDesc(d.fullTitle, clean);
        } catch (e) {
            const fallback = '<em style="color:#aaa;">Description unavailable.</em>';
            setPubDescInTrack(track, d.encKey, fallback);
            updateListDesc(d.fullTitle, fallback);
        }
    }
}

const simplifyBio = () => triggerAIFeature('simplify-btn', 'eli5-result', '✨', "Lay Summary", 'Summarising...', "Write a concise lay summary (3 sentences) of Dr Shaban Ahmad's research in AI-driven drug discovery, computational genomics, and PFAS biodegradation. Use plain, accessible language suitable for a non-specialist reader.", (res) => { const rb = document.getElementById('eli5-result'); rb.style.display = 'block'; rb.innerHTML = `<i class="fas fa-times" style="float:right; cursor:pointer; color:#888;" onclick="this.parentElement.style.display='none'"></i><strong>📄 Lay Summary:</strong><br><br>${res}`; });
const summariseFrontiers = () => triggerAIFeature('sf-btn'
, 'sf-status', '✨', 'AI Summary', 'Synthesising...', "Summarise the 4 core research areas Dr Shaban Ahmad is currently pioneering: 1. AI in Drug Design, 2. Deep Learning in Genomics, 3. MD Simulations, and 4. PFAS Biodegradation. FORMAT: Use <b>bold titles</b> and 1-2 punchy sentences per area. HTML only.", (res) => { const st = document.getElementById('sf-status'); st.style.display = 'block'; st.innerHTML = `<i class="fas fa-times" style="float:right; cursor:pointer; color:#888;" onclick="this.parentElement.style.display='none'"></i><strong>🔬 Research Frontiers Summary:</strong><br><br>${res.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}`; });
const matchSkills = () => { const inp = document.getElementById('job-desc-input'); if (!inp.value.trim()) { inp.placeholder = "⚠️ Please describe the opportunity first."; inp.style.border = "2px solid red"; setTimeout(() => inp.style.border = "2px dashed #cbd5e1", 2000); return; } triggerAIFeature('match-btn', 'match-result', '✨', 'Research Fit', 'Analysing...', `Assess the research fit between this opportunity and Dr Shaban Ahmad's expertise in AI drug discovery, computational genomics, and PFAS biodegradation. Provide: 1. A brief fit summary. 2. Three specific areas of alignment. 3. One honest gap if any. HTML format only. Context: ${inp.value}`, (res) => { const rb = document.getElementById('match-result'); rb.style.display = 'block'; rb.innerHTML = `<i class="fas fa-times" style="float:right; cursor:pointer; color:#888;" onclick="this.parentElement.style.display='none'"></i><strong style="color:var(--primary);">Research Fit Analysis:</strong><br><br>${res.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')}`; }); };

const extractEmailParts = (text) => {
    let s = "", b = text;
    const m = text.match(/SUBJECT:\s*([^\n]*)\n+BODY:\s*([\s\S]*)/i);
    if (m) { s = m[1].replace(/^["']|["']$/g, '').trim(); b = m[2].trim(); }
    else {
        const parts = text.split('\n\n');
        if (parts[0].toLowerCase().includes('subject:')) {
            s = parts[0].replace(/Subject:\s*/i, '').replace(/^["']|["']$/g, '').trim();
            b = parts.slice(1).join('\n\n').trim();
        }
    }
    return { subject: s, body: b };
};

const findSynergy = () => { const mb = document.getElementById('contact-message'); if (!mb.value.trim()) { mb.placeholder = "⚠️ Describe your area first!"; return; } triggerAIFeature('synergy-btn', null, '🤝', 'Synergy', 'Finding...', `Propose ONE highly innovative joint research project for Dr Shaban Ahmad (AI/Bioinformatics) and a researcher with expertise in: "${mb.value.trim()}". Draft a formal email proposing this. CRITICAL: Format your response exactly like this:\nSUBJECT: [Your Subject Here]\nBODY: [Your Email Body Here]`, (res) => { const { subject, body } = extractEmailParts(res); showAIModal(`<strong>🤝 Collaborative Synergy Idea:</strong><br><br><label style="font-size:0.85rem;font-weight:bold;color:#555;">Subject:</label><input type="text" id="syn-gen-sub" aria-label="Generated email subject" style="width:100%; padding:10px; margin-bottom:10px; border-radius:8px; border:1px solid var(--accent); font-family:inherit;" value="${escapeHTML(subject)}"><label style="font-size:0.85rem;font-weight:bold;color:#555;">Body:</label><textarea id="syn-gen-body" aria-label="Generated email body" style="width:100%; min-height:200px; padding:10px; border-radius:8px; border:1px solid var(--accent); font-family:inherit; resize:vertical;">${escapeHTML(body)}</textarea><br><br><div style="display:flex; gap:10px; justify-content:flex-end;"><button onclick="document.getElementById('contact-subject').value = document.getElementById('syn-gen-sub').value; document.getElementById('contact-message').value = document.getElementById('syn-gen-body').value; closeAIModal();" class="cf-btn" style="border:none; padding:8px 15px;">Use as Email Draft</button></div>`); }); };
const draftEmail = () => { const mb = document.getElementById('contact-message'); if (!mb.value.trim()) { mb.placeholder = "⚠️ Type notes first!"; return; } triggerAIFeature('draft-email-btn', null, '✨', 'AI Draft', 'Drafting...', `Rewrite these notes into a polite academic email addressed to Dr Shaban Ahmad: "${mb.value.trim()}". CRITICAL: Format your response exactly like this:\nSUBJECT: [Your Subject Here]\nBODY: [Your Email Body Here]`, (res) => { const { subject, body } = extractEmailParts(res); if (subject) document.getElementById('contact-subject').value = subject; mb.value = body; }); };


/* Conversational Chatbot & Voice */
const toggleChatWindow = () => { const w = document.getElementById('ai-chat-window'); w.style.display = w.style.display === 'flex' ? 'none' : 'flex'; };
const handleChatKey = (e) => { if (e.key === 'Enter') sendUserMessage(); };
const addMessage = (t, type) => {
    const b = document.getElementById('chat-body'), d = document.createElement('div');
    d.className = `msg msg-${type}`;
    d.innerHTML = t.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    b.appendChild(d);
    b.scrollTop = b.scrollHeight;
    return d;
};
const removeMessage = (el) => { if (el && el.parentNode) el.parentNode.removeChild(el); };
const escapeHTML = (str) => str.replace(/[&<>'"]/g, tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag]));

const sendUserMessage = async () => {
    const inp = document.getElementById('chat-input'), msg = inp.value.trim();
    if (!msg) return;
    addMessage(escapeHTML(msg), 'user');
    inp.value = '';
    const loadMsg = addMessage('Thinking...', 'loading');
    const systemContext = "You are the AI assistant for Dr Shaban Ahmad. He is a Postdoc at UCPH specialising in AI-driven drug discovery, computational genomics, and PFAS biodegradation. Answer concisely in raw HTML.";
    try {
        const res = await fetchFromBackend(`${systemContext} User: ${msg}`);
        removeMessage(loadMsg);
        addMessage(res.replace(/```html|```/gi, '').trim(), 'bot');
    } catch (err) {
        removeMessage(loadMsg);
        addMessage(`❌ Error: ${err.message}`, 'bot');
    }
};

/* Performance-Optimised 3D & Network Effects */
const initHeavyFX = () => {
    // 3D Molecular Simulation Part
    const loadAndRun3D = () => {
        if (window.innerWidth < 1351) return;
        const runInit3D = () => {
            const containerL = document.getElementById('mol-canvas-left'), containerR = document.getElementById('mol-canvas-right');
            if (!containerL || !containerR) return;

            const vL = $3Dmol.createViewer(containerL, { alpha: true, antialias: true }), vR = $3Dmol.createViewer(containerR, { alpha: true, antialias: true });
            const viewers = [vL, vR]; viewers.forEach(v => v.setBackgroundColor(0x000000, 0.0));

            let proteinModels = [], isAnimating = false, protAtomsList = [];
            const PFAS_TEMPLATE = { atoms: [{ id: 0, e: 'C', r: 0.45, c: 'gray', x: 0, y: 0, z: 0 }, { id: 1, e: 'C', r: 0.45, c: 'gray', x: 1.5, y: 0.5, z: 0 }, { id: 2, e: 'O', r: 0.45, c: 'red', x: 2.2, y: 1.5, z: 0 }, { id: 3, e: 'O', r: 0.45, c: 'red', x: 2.2, y: -0.5, z: 0 }, { id: 4, e: 'F', r: 0.4, c: 'cyan', x: -0.8, y: 1.2, z: 0 }, { id: 5, e: 'F', r: 0.4, c: 'cyan', x: -0.8, y: -0.6, z: 1.0 }, { id: 6, e: 'F', r: 0.4, c: 'cyan', x: -0.8, y: -0.6, z: -1.0 }], bonds: [[0, 1], [1, 2], [1, 3], [0, 4], [0, 5], [0, 6]] };
            const DRUG_TEMPLATE = { atoms: [{ id: 0, e: 'C', r: 0.45, c: '#f59e0b', x: 0, y: 1.4, z: 0 }, { id: 1, e: 'C', r: 0.45, c: '#f59e0b', x: 1.2, y: 0.7, z: 0 }, { id: 2, e: 'C', r: 0.45, c: '#f59e0b', x: 1.2, y: -0.7, z: 0 }, { id: 3, e: 'C', r: 0.45, c: '#f59e0b', x: 0, y: -1.4, z: 0 }, { id: 4, e: 'C', r: 0.45, c: '#f59e0b', x: -1.2, y: -0.7, z: 0 }, { id: 5, e: 'C', r: 0.45, c: '#f59e0b', x: -1.2, y: 0.7, z: 0 }, { id: 6, e: 'N', r: 0.45, c: 'blue', x: 2.4, y: 1.4, z: 0 }, { id: 7, e: 'C', r: 0.45, c: '#f59e0b', x: 3.6, y: 0.7, z: 0 }, { id: 8, e: 'C', r: 0.45, c: '#f59e0b', x: 4.8, y: 1.4, z: 0 }, { id: 9, e: 'N', r: 0.45, c: 'blue', x: 4.8, y: 2.8, z: 0 }, { id: 10, e: 'C', r: 0.45, c: '#f59e0b', x: 3.6, y: 3.5, z: 0 }, { id: 11, e: 'C', r: 0.45, c: '#f59e0b', x: 2.4, y: 2.8, z: 0 }, { id: 12, e: 'O', r: 0.45, c: 'red', x: -2.4, y: -1.4, z: 0 }], bonds: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 6], [6, 7], [7, 8], [8, 9], [9, 10], [10, 11], [11, 7], [4, 12]] };
            const precalc = (t) => { let cx = 0, cy = 0, cz = 0; t.atoms.forEach(a => { cx += a.x; cy += a.y; cz += a.z; }); cx /= t.atoms.length; cy /= t.atoms.length; cz /= t.atoms.length; t.atoms.forEach(a => { let dx = a.x - cx, dy = a.y - cy, dz = a.z - cz, d = Math.hypot(dx, dy, dz) || 1; a.dx = dx / d; a.dy = dy / d; a.dz = dz / d; }); };
            precalc(PFAS_TEMPLATE); precalc(DRUG_TEMPLATE);

            $3Dmol.download("pdb:3R3V", vR, {}, function () {
                $3Dmol.download("pdb:3R3V", vL, {}, function () {
                    viewers.forEach(v => { const m = v.getModel(0); proteinModels.push(m); const at = m.selectedAtoms({ atom: 'CA' }); at.forEach(a => { a.vx = (Math.random() - 0.5) * 8; a.vy = (Math.random() - 0.5) * 8; a.vz = (Math.random() - 0.5) * 8; }); protAtomsList.push(at); v.setStyle({ chain: 'B' }, { cross: { hidden: true } }); v.setStyle({ hetflag: true, chain: 'A' }, { cross: { hidden: true } }); v.zoomTo({ chain: 'A' }); });

                    const setProteinStyle = (idx, st) => {
                        const m = proteinModels[idx];
                        let cf; if (st === 'active') cf = (a) => a.ss === 'h' ? '#10b981' : (a.ss === 's' ? '#f59e0b' : '#64748b'); else if (st === 'inhibited') cf = (a) => a.ss === 'h' ? '#ef4444' : (a.ss === 's' ? '#991b1b' : '#450a0a'); else if (st === 'catalyzing') cf = (a) => a.ss === 'h' ? '#06b6d4' : (a.ss === 's' ? '#fde047' : '#0891b2');
                        m.setStyle({}, { hidden: false }); m.setStyle({ chain: 'A' }, { cartoon: { colorfunc: cf, thickness: 0.4 } }); viewers[idx].render();
                    };
                    const setSurface = (idx, ty) => { 
                        viewers[idx].removeAllSurfaces(); 
                        if (ty === 'normal') viewers[idx].addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.12, color: '#ffffff' }, { chain: 'A', hetflag: false }); 
                        else if (ty === 'inhibited') viewers[idx].addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.75, color: '#ef4444' }, { chain: 'A', hetflag: false }); 
                        else if (ty === 'catalyzing') viewers[idx].addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.65, color: '#06b6d4' }, { chain: 'A', hetflag: false }); 
                    };

                    setProteinStyle(0, 'active'); setSurface(0, 'normal');
                    setProteinStyle(1, 'active'); setSurface(1, 'normal');

                    let tick = 0; const target = { x: -2, y: -5, z: 12 }, start = { x: 40, y: 20, z: -20 }, exit = { x: -40, y: -20, z: 30 };
                    const drawLigand = (idx, tmpl, pos, scP = 0) => {
                        let al = 1.0 - (scP * 1.5); if (al <= 0 && scP > 0) return; const c = Math.cos(tick * 0.06), s = Math.sin(tick * 0.06);
                        const tAt = tmpl.atoms.map(a => { let rx = a.x * c - a.z * s, ry = a.y, rz = a.x * s + a.z * c, isSc = false; if (scP > 0 && a.e === 'F') { rx += a.dx * 25 * scP; ry += a.dy * 25 * scP; rz += a.dz * 25 * scP; ry -= scP * 15; isSc = true; } return { id: a.id, x: rx + pos.x, y: ry + pos.y, z: rz + pos.z, r: a.r, c: a.c, scattered: isSc }; });
                        const v = viewers[idx];
                        tAt.forEach(a => v.addSphere({ center: { x: a.x, y: a.y, z: a.z }, radius: a.r, color: a.c, alpha: a.scattered ? al : 1.0 })); 
                        tmpl.bonds.forEach(b => { const p1 = tAt.find(at => at.id === b[0]), p2 = tAt.find(at => at.id === b[1]); if (p1 && p2 && !p1.scattered && !p2.scattered) v.addCylinder({ start: { x: p1.x, y: p1.y, z: p1.z }, end: { x: p2.x, y: p2.y, z: p2.z }, radius: 0.15, color: 'white' }); });
                    };

                    const termLeft = document.getElementById('ai-terminal-left');
                    const termRight = document.getElementById('ai-terminal-right');
                    let logsLeft = [], logsRight = [], queueLeft = [], queueRight = [], isTypingLeft = false, isTypingRight = false;

                    const toggleTerm = (sh) => { 
                        [termLeft, termRight].forEach(t => { if (t) { t.style.opacity = sh ? '1' : '0'; if (!sh) t.innerHTML = ''; } }); 
                        if (!sh) { logsLeft = []; logsRight = []; queueLeft = []; queueRight = []; isTypingLeft = false; isTypingRight = false; } 
                    };
                    const renderTerm = (t, logs) => { t.innerHTML = logs.map(l => `<div>${l}</div>`).reverse().join(''); };
                    const typeLog = (side) => {
                        const q = side === 'L' ? queueLeft : queueRight, l = side === 'L' ? logsLeft : logsRight, t = side === 'L' ? termLeft : termRight;
                        if (q.length === 0) { if(side==='L') isTypingLeft=false; else isTypingRight=false; return; }
                        if(side==='L') isTypingLeft=true; else isTypingRight=true;
                        const msg = q.shift(); l.push(""); if (l.length > 18) l.shift();
                        let i = 0;
                        const typeChar = () => {
                            l[l.length - 1] = msg.substring(0, i) + (Math.random() > 0.5 ? "█" : "");
                            renderTerm(t, l); i += 4;
                            if (i <= msg.length) requestAnimationFrame(typeChar);
                            else { l[l.length - 1] = msg; renderTerm(t, l); setTimeout(() => typeLog(side), 80); }
                        };
                        requestAnimationFrame(typeChar);
                    };
                    const addLog = (m, side = 'both') => {
                        let f = m;
                        if (m.startsWith('>')) f = `<span style="color:#10b981">${m}</span>`;
                        else if (m.includes('CRITICAL') || m.includes('ERROR') || m.includes('FAILURE')) f = `<span style="color:#ef4444">${m}</span>`;
                        else if (m.includes('SUCCESS') || m.includes('COMPLETE')) f = `<span style="color:#10b981">${m}</span>`;
                        else if (m.includes('WARNING') || m.includes('[CALC]') || m.includes('[INFO]')) f = `<span style="color:#f59e0b">${m}</span>`;
                        else if (m.includes('[RESULT]')) f = `<span style="color:#38bdf8">${m}</span>`;

                        if (side === 'L' || side === 'both') { queueLeft.push(f); if (!isTypingLeft) typeLog('L'); }
                        if (side === 'R' || side === 'both') { queueRight.push(f); if (!isTypingRight) typeLog('R'); }
                    };

                    let skipFrame = false;
                    const animateScene = () => {
                        if (!isAnimating) return; tick = (tick + 2) % 1800; 
                        skipFrame = !skipFrame;
                        if (skipFrame) { requestAnimationFrame(animateScene); return; }
                        viewers.forEach(v => v.removeAllShapes());

                        // --- LEFT SIDE (VIEWER 0): DRUG DISCOVERY -> PHARMACOGENOMICS ---
                        if (tick === 50) { toggleTerm(true); addLog("> init toxicity_scan --mode advanced", 'L'); }
                        if (tick === 120) addLog("> loading Lead_Compound_X42...", 'L');
                        if (tick === 180) addLog("> ligand_docking.start()", 'L');
                        if (tick === 260) { addLog("[CALC] Bind Energy: -14.2 kcal/mol", 'L'); setProteinStyle(0, 'inhibited'); setSurface(0, 'inhibited'); }
                        if (tick === 330) addLog("[CRITICAL] Ligand-induced denaturation!", 'L');
                        if (tick === 420) { addLog("[FAILURE] Lead discarded. Resetting...", 'L'); setSurface(0, 'none'); proteinModels[0].setStyle({}, { hidden: true }); }
                        if (tick === 550) { setProteinStyle(0, 'active'); setSurface(0, 'normal'); }

                        if (tick === 620) addLog("> import pharmacogenomics as pgx", 'L');
                        if (tick === 700) addLog("> patient_profile = pgx.load('PT-29')", 'L');
                        if (tick === 880) { addLog("[RESULT] Phenotype: Poor Metabolizer", 'L'); setProteinStyle(0, 'catalyzing'); setSurface(0, 'catalyzing'); }
                        if (tick === 1030) { addLog("[SUCCESS] Optimised regimen active", 'L'); setProteinStyle(0, 'active'); setSurface(0, 'normal'); }

                        // --- RIGHT SIDE (VIEWER 1): PFAS BIOREMEDIATION -> STRUCTURAL BIOLOGY ---
                        if (tick === 50) addLog("> system_status: monitoring node_01", 'R');
                        if (tick === 120) addLog("[INFO] Proximity alert: 20Å", 'R');
                        if (tick === 260) addLog("[WARNING] Active site distortion detected", 'R');
                        if (tick === 420) addLog("[CRITICAL] SYSTEM OVERLOAD: Rebooting", 'R');

                        if (tick === 620) { addLog("> environment: site_alpha_groundwater", 'R'); }
                        if (tick === 700) addLog("[INFO] Detecting fluorinated bonds", 'R');
                        if (tick === 780) addLog("> simulate defluorination transition", 'R');
                        if (tick === 880) { addLog("[INFO] SN2 attack angle: 178°", 'R'); setProteinStyle(1, 'catalyzing'); setSurface(1, 'catalyzing'); }
                        if (tick === 960) addLog("[SUCCESS] Fluorine ion release detected", 'R');
                        if (tick === 1030) { addLog("[COMPLETE] Degradation yield: 98.4%", 'R'); setProteinStyle(1, 'active'); setSurface(1, 'normal'); }

                        if (tick === 1220) addLog("> model_structure --method 'AlphaFold3'", 'R');
                        if (tick === 1480) addLog("[INFO] pLDDT score: 94.2 (HIGH)", 'R');
                        if (tick === 1680) addLog("[SUCCESS] Global report finalized", 'R');

                        // LEFT DRUG ANIMATION (VIEWER 0)
                        if (tick > 180 && tick <= 330) { let p = (tick - 180) / 150; p = 1 - Math.pow(1 - p, 3); drawLigand(0, DRUG_TEMPLATE, { x: start.x + (target.x - start.x) * p, y: start.y + (target.y - start.y) * p, z: start.z + (target.z - start.z) * p }); }
                        else if (tick > 330 && tick <= 420) drawLigand(0, DRUG_TEMPLATE, target);
                        else if (tick > 420 && tick <= 550) { let p = (tick - 420) / 130; p = Math.pow(p, 1.5); protAtomsList[0].forEach(a => { viewers[0].addSphere({ center: { x: a.x + a.vx * p * 12, y: a.y + a.vy * p * 12, z: a.z + a.vz * p * 12 }, radius: 1.2, color: '#ef4444', alpha: 1 - p }); }); drawLigand(0, DRUG_TEMPLATE, { x: target.x + (exit.x - target.x) * p, y: target.y + (exit.y - target.y) * p, z: target.z + (exit.z - target.z) * p }); }

                        // RIGHT PFAS ANIMATION (VIEWER 1)
                        if (tick > 780 && tick <= 930) { let p = (tick - 780) / 150; p = 1 - Math.pow(1 - p, 3); drawLigand(1, PFAS_TEMPLATE, { x: start.x + (target.x - start.x) * p, y: start.y + (target.y - start.y) * p, z: start.z + (target.z - start.z) * p }); }
                        else if (tick > 930 && tick <= 1030) drawLigand(1, PFAS_TEMPLATE, target);
                        else if (tick > 1030 && tick <= 1150) drawLigand(1, PFAS_TEMPLATE, target, Math.pow((tick - 1030) / 120, 2));

                        // GENOMIC SPHERES (VIEWER 0)
                        if (tick > 750 && tick <= 1000) { let p = (tick - 750) / 250; const orb = (angle, r) => ({ x: target.x + r * Math.cos(angle + tick * 0.04), y: target.y + r * Math.sin(angle + tick * 0.03), z: target.z }); [0, 2.1, 4.2].forEach((a, i) => { const o = orb(a, 20 * p); viewers[0].addSphere({ center: o, radius: 1.0 + i * 0.2, color: '#a78bfa', alpha: p < 0.8 ? p : (1 - p) * 5 }); }); }

                        if (tick === 1750) toggleTerm(false);
                        viewers.forEach(v => v.render()); requestAnimationFrame(animateScene);
                    };
                    const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { isAnimating = entry.isIntersecting; if (isAnimating) requestAnimationFrame(animateScene); }); }, { threshold: 0.1 });
                    observer.observe(document.getElementById('hero-section'));
                });
            });
        };

        if (typeof $3Dmol === 'undefined') {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.0.4/3Dmol-min.js";
            script.async = true;
            script.onload = runInit3D;
            document.head.appendChild(script);
        } else {
            runInit3D();
        }
    };

    // Floating Icons Mesh Layer
    const loadAndRunMesh = () => {
        if (window.innerWidth < 1351) return;
        const layer = document.getElementById('hi-layer'), hero = document.getElementById('hero-section');
        if (!layer || !hero) return;
        const ICONS = [['fa-brain', 'rgba(167,139,250,0.4)'], ['fa-dna', 'rgba(80,200,255,0.4)'], ['fa-atom', 'rgba(245,158,11,0.4)'], ['fa-pills', 'rgba(248,113,113,0.4)'], ['fa-robot', 'rgba(167,139,250,0.4)']];
        let W, H, nodes = [], hiRAF = null, netCanvas, netCtx, mouse = { x: -999, y: -999 };
        const resize = () => { W = layer.offsetWidth; H = layer.offsetHeight; if (netCanvas) { netCanvas.width = W; netCanvas.height = H; } };
        const init = () => {
            layer.innerHTML = ''; netCanvas = document.createElement('canvas');
            netCanvas.style.cssText = 'position:absolute;inset:0;z-index:-1;opacity:0.5;';
            layer.appendChild(netCanvas); netCtx = netCanvas.getContext('2d');
            resize(); nodes = [];
            ICONS.forEach(([cls, color]) => {
                for(let k=0; k<4; k++) {
                    const el = document.createElement('i'); el.className = `fas ${cls}`;
                    const x = Math.random()*W, y = Math.random()*H;
                    el.style.cssText = `position:absolute;color:${color};font-size:14px;will-change:transform;transform:translate(${x}px,${y}px);`;
                    layer.appendChild(el);
                    nodes.push({ el, x, y, vx: (Math.random()-0.5)*0.2, vy: (Math.random()-0.5)*0.2 });
                }
            });
        };
        const step = () => {
            netCtx.clearRect(0,0,W,H);
            nodes.forEach((n, i) => {
                n.x += n.vx; n.y += n.vy;
                if(n.x<0 || n.x>W) n.vx*=-1; if(n.y<0 || n.y>H) n.vy*=-1;
                n.el.style.transform = `translate(${n.x}px,${n.y}px)`;
                nodes.slice(i+1).forEach(nj => {
                    const d = Math.hypot(n.x-nj.x, n.y-nj.y);
                    if(d<120) {
                        netCtx.beginPath(); netCtx.moveTo(n.x+7, n.y+7); netCtx.lineTo(nj.x+7, nj.y+7);
                        netCtx.strokeStyle = `rgba(245,158,11,${(120-d)/400})`; netCtx.stroke();
                    }
                });
            });
            hiRAF = requestAnimationFrame(step);
        };
        hero.addEventListener('mousemove', e => { const r = hero.getBoundingClientRect(); mouse.x = e.clientX-r.left; mouse.y = e.clientY-r.top; }, { passive: true });
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resize, 200);
        }, { passive: true });
        init(); step();
        new IntersectionObserver(([e]) => { if (e.isIntersecting) { if(!hiRAF) step(); } else { cancelAnimationFrame(hiRAF); hiRAF = null; } }).observe(hero);
    };

    // Background Interactive Particles Layer (Magnetic Parallax Fluid Vortex)
    const loadAndRunBgParticles = () => {
        const canvas = document.getElementById('bg-dots-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let w, h, particles = [], rafId = null, time = 0;
        const mouse = { x: null, y: null, radius: 240 };

        const resize = () => {
            w = window.innerWidth;
            h = window.innerHeight;
            canvas.width = w;
            canvas.height = h;
        };

        const init = () => {
            resize();
            particles = [];
            const count = 130; // Dense enough to showcase flow, light enough to maintain 60+ FPS
            for (let i = 0; i < count; i++) {
                const x = Math.random() * w;
                const y = Math.random() * h;
                const vx = (Math.random() - 0.5) * 0.3;
                const vy = (Math.random() - 0.5) * 0.3;
                const depth = Math.random() * 0.8 + 0.4; // Parallax depth factor [0.4, 1.2]
                const radius = depth * 2.2; // Farther elements are smaller
                particles.push({
                    x, y,
                    vx, vy,
                    baseVx: vx,
                    baseVy: vy,
                    radius,
                    depth
                });
            }
        };

        const step = () => {
            if (window.innerWidth < 1150) {
                ctx.clearRect(0, 0, w, h);
                rafId = requestAnimationFrame(step);
                return;
            }

            const isDark = document.body.classList.contains('dark-mode');
            
            // Motion blur/trail effect via semi-transparent background sweep
            ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.12)' : 'rgba(250, 250, 249, 0.12)';
            ctx.fillRect(0, 0, w, h);

            time += 0.003;

            // Define central content area boundaries (1100px max-width + 40px safe buffer)
            const contentWidth = 1140;
            const leftLimit = (w - contentWidth) * 0.5;
            const rightLimit = (w + contentWidth) * 0.5;

            particles.forEach((p, i) => {
                // 1. Organic Flow Field Drift (background wind)
                p.vx += Math.sin(p.y * 0.006 + time) * 0.015 * p.depth;
                p.vy += Math.cos(p.x * 0.006 + time) * 0.015 * p.depth;

                // 2. Mouse gravity & vortex orbit physics
                if (mouse.x !== null && mouse.y !== null) {
                    const dx = mouse.x - p.x;
                    const dy = mouse.y - p.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < mouse.radius) {
                        const force = (mouse.radius - dist) / mouse.radius; // 0 to 1 scaling
                        
                        // Pull towards cursor
                        const pull = force * 0.45 * p.depth;
                        p.vx += (dx / dist) * pull;
                        p.vy += (dy / dist) * pull;

                        // Swirl/orbit around cursor (perpendicular vectors: -dy, dx)
                        const swirl = force * 0.75 * p.depth;
                        p.vx += (-dy / dist) * swirl;
                        p.vy += (dx / dist) * swirl;

                        // Repulsion buffer to prevent dot-clumping at the absolute center
                        if (dist < 45) {
                            const bounce = (45 - dist) / 45 * 1.5;
                            p.vx -= (dx / dist) * bounce;
                            p.vy -= (dy / dist) * bounce;
                        }

                        // Draw mouse-to-particle attraction filament (only if particle is in margins)
                        if (!(p.x >= leftLimit && p.x <= rightLimit)) {
                            ctx.beginPath();
                            ctx.moveTo(p.x, p.y);
                            ctx.lineTo(mouse.x, mouse.y);
                            const filamentAlpha = (1 - dist / mouse.radius) * 0.08 * p.depth;
                            ctx.strokeStyle = isDark ? `rgba(165, 180, 252, ${filamentAlpha})` : `rgba(99, 102, 241, ${filamentAlpha})`;
                            ctx.lineWidth = 0.6;
                            ctx.stroke();
                        }
                    }
                }

                // 3. Friction & damping towards baseline state
                p.vx *= 0.96;
                p.vy *= 0.96;
                p.vx += (p.baseVx - p.vx) * 0.02;
                p.vy += (p.baseVy - p.vy) * 0.02;

                // Speed limit capping
                const speed = Math.hypot(p.vx, p.vy);
                const maxSpeed = 4.2 * p.depth;
                if (speed > maxSpeed) {
                    p.vx = (p.vx / speed) * maxSpeed;
                    p.vy = (p.vy / speed) * maxSpeed;
                }

                // Apply position update
                p.x += p.vx;
                p.y += p.vy;

                // Screen wrapping boundaries
                if (p.x < -10) p.x = w + 10;
                else if (p.x > w + 10) p.x = -10;
                if (p.y < -10) p.y = h + 10;
                else if (p.y > h + 10) p.y = -10;

                // 4. Render particle (strictly outside the central content area)
                if (!(p.x >= leftLimit && p.x <= rightLimit)) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                    
                    const pAlpha = p.depth * 0.35;
                    if (i % 3 === 0) {
                        ctx.fillStyle = isDark ? `rgba(165, 180, 252, ${pAlpha})` : `rgba(99, 102, 241, ${pAlpha})`;
                    } else {
                        ctx.fillStyle = isDark ? `rgba(248, 250, 252, ${pAlpha * 0.6})` : `rgba(71, 85, 105, ${pAlpha * 0.6})`;
                    }
                    ctx.fill();
                }

                // 5. Constellation network lines (strictly outside the central content area)
                for (let j = i + 1; j < particles.length; j++) {
                    const pj = particles[j];
                    
                    if ((p.x >= leftLimit && p.x <= rightLimit) || (pj.x >= leftLimit && pj.x <= rightLimit)) continue;
                    
                    const dx = p.x - pj.x;
                    const dy = p.y - pj.y;
                    const dist = Math.hypot(dx, dy);

                    if (dist < 95) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(pj.x, pj.y);
                        const lineAlpha = (1 - dist / 95) * 0.055 * p.depth * pj.depth;
                        ctx.strokeStyle = isDark ? `rgba(165, 180, 252, ${lineAlpha})` : `rgba(99, 102, 241, ${lineAlpha})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            });

            rafId = requestAnimationFrame(step);
        };

        window.addEventListener('mousemove', e => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        }, { passive: true });

        window.addEventListener('mouseleave', () => {
            mouse.x = null;
            mouse.y = null;
        }, { passive: true });

        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                resize();
            }, 200);
        }, { passive: true });

        init();
        step();
    };

    loadAndRun3D();
    loadAndRunMesh();
    loadAndRunBgParticles();
};

// Robust immediately-invoked loading logic for visual elements (safer than idle-only callbacks)
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeavyFX);
} else {
    initHeavyFX();
}

window.googleTranslateElementInit = () => {
    new google.translate.TranslateElement({ pageLanguage: 'en', includedLanguages: 'en,da,es,fr,de,hi,zh-CN,ar,ur,ru,ja', autoDisplay: false }, 'google_translate_element');
};
