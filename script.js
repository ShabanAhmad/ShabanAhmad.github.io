/*
    ========================================================================
    SECTION 1: CONFIGURATION & UTILITIES
    ========================================================================
*/

/* 1.1: GLOBAL API KEYS & VARIABLES */
var submitted = false;
// UPDATED: Functional API Key & Model Configuration
const GEMINI_API_KEY = "AIzaSyDJqOSppaGr83sNmXojAgYERyJu4oE-iVo"; 
const GEMINI_MODEL = "gemini-1.5-flash"; // More stable model for standard keys

/* 1.2: UTILITY FUNCTIONS */
function copyEmail(element, email) {
    navigator.clipboard.writeText(email).then(() => {
        let feedback = document.createElement("span");
        feedback.className = "copy-feedback";
        feedback.innerText = "Email copied!";
        feedback.style.whiteSpace = "nowrap";
        element.appendChild(feedback);
        setTimeout(() => feedback.classList.add("show"), 10);
        setTimeout(() => {
            feedback.classList.remove("show");
            setTimeout(() => feedback.remove(), 300);
        }, 1500);
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
}

// 1.3: DYNAMIC JOURNAL COUNT LOGIC
document.addEventListener('DOMContentLoaded', () => {
    updateJournalCount();
    initCitationButtons();
});

function updateJournalCount() {
    // Count unique entries in the Peer Review Container
    const journals = document.querySelectorAll('.peer-review-container .pr-badge-item');
    // Using a Set to ensure uniqueness based on text content
    const uniqueJournals = new Set(Array.from(journals).map(j => j.textContent.trim()));
    const count = uniqueJournals.size;

    const countTextEl = document.getElementById('peer-review-count-text');
    if(countTextEl) {
        // Preserving the bold styling and icon
        countTextEl.innerHTML = `<a href="https://www.webofscience.com/wos/author/record/ABD-4112-2021" target="_blank" style="text-decoration:underline;"> <span class="verified-badge"><i class="fas fa-check-circle"></i> 450+ Verified</span> Peer Reviews on Publons (WoS) for ${count} Journals</a>`;
    }
}

/*
    ========================================================================
    SECTION 2: CITATION SYSTEM (AUTOMATED)
    ========================================================================
*/

/* 2.1: INITIALISATION */
function initCitationButtons() {
    const pubs = document.querySelectorAll('.pub-item');

    pubs.forEach((pub, index) => {
        const controls = document.createElement('span');
        controls.className = 'pub-controls';

        const doiBtn = pub.querySelector('.pub-doi');
        
        if (doiBtn) {
            let doiUrl = doiBtn.getAttribute('href');
            controls.appendChild(doiBtn); 

            const citeBtn = document.createElement('button');
            citeBtn.className = 'btn-cite';
            citeBtn.innerHTML = 'Cite <i class="fas fa-caret-down"></i>';
            citeBtn.onclick = (e) => toggleCiteMenu(e, citeBtn);

            const dropdown = document.createElement('div');
            dropdown.className = 'cite-dropdown-menu';
            dropdown.id = `cite-menu-${index}`;

            const optCopy = document.createElement('button');
            optCopy.className = 'cite-option';
            optCopy.innerHTML = '<i class="fas fa-copy"></i> Copy APA Format';
            optCopy.onclick = () => handleCitationAction(pub, doiUrl, optCopy, 'copy');
            
            const optBib = document.createElement('button');
            optBib.className = 'cite-option';
            optBib.innerHTML = '<i class="fas fa-file-code"></i> Download BibTeX';
            optBib.onclick = () => handleCitationAction(pub, doiUrl, optBib, 'bib');

            const optRis = document.createElement('button');
            optRis.className = 'cite-option';
            optRis.innerHTML = '<i class="fas fa-file-export"></i> Download EndNote';
            optRis.onclick = () => handleCitationAction(pub, doiUrl, optRis, 'ris');

            dropdown.appendChild(optCopy);
            dropdown.appendChild(document.createElement('div')).className = 'cite-divider';
            dropdown.appendChild(optBib);
            dropdown.appendChild(optRis);

            controls.appendChild(citeBtn);
            controls.appendChild(dropdown);
            pub.appendChild(controls);
        }
    });
}

/* 2.2: MENU TOGGLING */
function toggleCiteMenu(event, btn) {
    event.stopPropagation();
    const currentMenu = btn.nextElementSibling;
    const parentItem = btn.closest('.pub-item');

    document.querySelectorAll('.cite-dropdown-menu').forEach(m => {
        if (m !== currentMenu) {
            m.classList.remove('show');
            m.closest('.pub-item').classList.remove('z-active');
        }
    });

    if (currentMenu.classList.contains('show')) {
        currentMenu.classList.remove('show');
        parentItem.classList.remove('z-active');
    } else {
        currentMenu.classList.add('show');
        parentItem.classList.add('z-active'); 
        
        setTimeout(() => {
            parentItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
}

/* 2.3: CITATION DATA HANDLING */
async function handleCitationAction(pubItem, doiUrl, btn, actionType) {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';
    btn.style.cursor = 'wait';

    let meta = null;

    if (doiUrl && doiUrl.includes('doi.org')) {
        const doi = doiUrl.split('doi.org/')[1];
        try {
            const response = await fetch(`https://api.crossref.org/works/${doi}`);
            if (response.ok) {
                const data = await response.json();
                meta = parseCrossRefData(data.message, doiUrl);
            }
        } catch (e) {
            console.warn("API Fetch failed, using fallback", e);
        }
    }

    if (!meta) {
        meta = scrapeHtmlData(pubItem);
    }

    try {
        if (actionType === 'copy') {
            const apaText = formatAPA(meta);
            await navigator.clipboard.writeText(apaText);
            btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            btn.style.color = 'green';
        } else if (actionType === 'bib') {
            downloadFile(formatBibTeX(meta), `${meta.id}.bib`, 'text/plain');
            btn.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
        } else if (actionType === 'ris') {
            downloadFile(formatRIS(meta), `${meta.id}.ris`, 'application/x-research-info-systems');
            btn.innerHTML = '<i class="fas fa-check"></i> Downloaded!';
        }
    } catch (err) {
        btn.innerHTML = '<i class="fas fa-times"></i> Error';
        console.error(err);
    }

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.color = '';
        btn.style.cursor = 'pointer';
        if(actionType === 'copy') {
            const menu = btn.closest('.cite-dropdown-menu');
            menu.classList.remove('show');
            menu.closest('.pub-item').classList.remove('z-active');
        }
    }, 2000);
}

function parseCrossRefData(data, doiUrl) {
    const authors = data.author ? data.author.map(a => {
        return {
            last: a.family,
            initial: a.given ? a.given.split(/[\s\.\-]+/).map(n => n[0] + '.').join('') : ''
        };
    }) : [{ last: "Ahmad", initial: "S." }];

    let year = "n.d.";
    if (data['published-print'] && data['published-print']['date-parts']) {
        year = data['published-print']['date-parts'][0][0];
    } else if (data.published && data.published['date-parts']) {
        year = data.published['date-parts'][0][0];
    } else if (data.created) {
        year = data.created['date-parts'][0][0];
    }

    return {
        id: (data.author?.[0]?.family || "unknown") + year,
        title: data.title ? data.title[0] : "Untitled",
        authors: authors,
        journal: data['container-title'] ? data['container-title'][0] : "",
        year: year,
        volume: data.volume || "",
        issue: data.issue || "",
        pages: data.page || "",
        doi: doiUrl
    };
}

function scrapeHtmlData(pubItem) {
    const title = pubItem.querySelector('strong')?.innerText.trim() || "Publication";
    const journalText = pubItem.querySelector('em')?.innerText.trim() || "";
    const doiBtn = pubItem.querySelector('.pub-doi');
    
    const yearMatch = journalText.match(/\((20\d{2})\)/);
    const year = yearMatch ? yearMatch[1] : new Date().getFullYear();
    
    const journal = journalText.replace(/\(20\d{2}\)/, '').trim();

    return {
        id: "Ahmad" + year,
        title: title,
        authors: [{ last: "Ahmad", initial: "S." }], 
        journal: journal,
        year: year,
        volume: "",
        issue: "",
        pages: "",
        doi: doiBtn ? doiBtn.getAttribute('href') : ""
    };
}

function formatAPA(m) {
    let authorStr = "";
    if (m.authors.length > 0) {
        const formatted = m.authors.map(a => `${a.last}, ${a.initial}`);
        if (formatted.length > 1) {
            const last = formatted.pop();
            authorStr = formatted.join(', ') + ", & " + last;
        } else {
            authorStr = formatted[0];
        }
    } else {
        authorStr = "Ahmad, S.";
    }
    
    let journalDetails = m.journal;
    if (m.volume) journalDetails += `, ${m.volume}`;
    if (m.issue) journalDetails += `(${m.issue})`;
    if (m.pages) journalDetails += `, ${m.pages}`;

    return `${authorStr} (${m.year}). ${m.title}. ${journalDetails}. ${m.doi}`;
}

function formatBibTeX(m) {
    const authorStr = m.authors.map(a => `${a.last}, ${a.initial}`).join(' and ');
    return `@article{${m.id},
author = {${authorStr}},
title = {${m.title}},
journal = {${m.journal}},
year = {${m.year}},
volume = {${m.volume}},
number = {${m.issue}},
pages = {${m.pages}},
doi = {${m.doi}}
}`;
}

function formatRIS(m) {
    let ris = `TY  - JOUR\nTI  - ${m.title}\n`;
    m.authors.forEach(a => {
        ris += `AU  - ${a.last}, ${a.initial}\n`;
    });
    ris += `JO  - ${m.journal}\nPY  - ${m.year}\nVL  - ${m.volume}\nIS  - ${m.issue}\nSP  - ${m.pages}\nDO  - ${m.doi}\nER  -`;
    return ris;
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/*
    ========================================================================
    SECTION 3: GLOBAL EVENT LISTENERS
    ========================================================================
*/

// 3.1: Global Click Listener for Dropdowns
window.addEventListener('click', (e) => {
        if(!e.target.closest('.btn-cite')) {
            document.querySelectorAll('.cite-dropdown-menu').forEach(m => {
                m.classList.remove('show');
                m.closest('.pub-item').classList.remove('z-active');
            });
        }
        
        if (!e.target.closest('.lang-wrapper') && 
            !e.target.closest('.search-container') && 
            !e.target.closest('.control-icon') &&
            !e.target.closest('.mobile-dropdown-toggle')) {
            closeAllDropdowns();
        }

        if (!e.target.closest('.nav-list') && !e.target.closest('.nav-toggle')) {
            const navBar = document.querySelector('.nav-list');
            const toggleBtn = document.querySelector('.nav-toggle');
            if (navBar && navBar.classList.contains('active')) {
                navBar.classList.remove('active');
                toggleBtn.classList.remove('open');
            }
        }
        
        if (!e.target.closest('#ai-chat-window') && !e.target.closest('#ai-widget-toggle')) {
            const chatWindow = document.getElementById('ai-chat-window');
            if (chatWindow && chatWindow.style.display === 'flex') {
                chatWindow.style.display = 'none';
            }
        }

        const pubBreakdown = document.getElementById('pub-breakdown');
        const pubContainer = pubBreakdown ? pubBreakdown.closest('.stat-row-link') : null;
        
        if (pubBreakdown && pubBreakdown.classList.contains('open') && pubContainer && !pubContainer.contains(e.target)) {
            pubBreakdown.classList.remove('open');
            pubBreakdown.style.maxHeight = "0";
            const toggleIcon = pubContainer.querySelector('.stat-toggle i');
            if (toggleIcon) {
                toggleIcon.classList.remove('fa-chevron-up');
                toggleIcon.classList.add('fa-chevron-down');
            }
            pubContainer.classList.remove('active-box');
        }
});

// 3.2: Smart Dropdown System
function closeAllDropdowns(except = null) {
    const desktopDD = document.getElementById('desktop-lang-dd');
    if(desktopDD && desktopDD !== except) desktopDD.classList.remove('show');

    const mobileDD = document.getElementById('mobile-lang-dd');
    if(mobileDD && mobileDD !== except) mobileDD.classList.remove('show');

    const searchBar = document.getElementById('search-dropdown');
    if(searchBar && searchBar !== except) {
        searchBar.style.display = 'none';
    }

    const researchDD = document.getElementById('research-dropdown');
    const researchToggle = document.querySelector('.mobile-dropdown-toggle');
    if(researchDD && researchDD.classList.contains('show-mobile') && researchDD !== except) {
        researchDD.classList.remove('show-mobile');
        if(researchToggle) {
            researchToggle.classList.remove('active');
            researchToggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
        }
    }
}

/*
    ========================================================================
    SECTION 4: UI & INTERACTION LOGIC
    ========================================================================
*/

// 4.1: Form Handling with Complex Animation
function handleFormSubmit() {
    document.getElementById('contact-form').reset();
    const feedbackBox = document.getElementById('msg-success-box');
    
    // Step 1: Show box (Fade In)
    feedbackBox.classList.add('anim-start');
    
    // Step 2: Start Running Border (after slight delay or immediate)
    setTimeout(() => {
        feedbackBox.classList.add('anim-running');
    }, 100);

    // Step 3: Wait (2s after border completes ~1.5s = 3.5s total), then Reverse
    setTimeout(() => {
        feedbackBox.classList.remove('anim-running');
        feedbackBox.classList.add('anim-reverse');
    }, 3000); 

    // Step 4: Disappear (after reverse completes ~1.5s = 4.5s total)
    setTimeout(() => {
        feedbackBox.classList.remove('anim-start', 'anim-reverse');
        feedbackBox.style.display = 'none'; // Ensure hidden
        submitted = false;
    }, 5000);
}

// 4.2: Scroll Detection
const backToTopBtn = document.getElementById("back-to-top");

window.addEventListener('scroll', function() {
    if (window.innerWidth > 900) {
        const headerName = document.querySelector('.header-name');
        const hero = document.querySelector('.hero');
        const triggerHeight = hero ? hero.offsetHeight - 150 : 300; 
        if (window.scrollY > triggerHeight) {
            headerName.classList.add('visible');
        } else {
            headerName.classList.remove('visible');
        }
    }

    if (window.scrollY > 300) {
        backToTopBtn.classList.add("visible");
    } else {
        backToTopBtn.classList.remove("visible");
    }
    
    let current = "";
    const sections = document.querySelectorAll("section");
    const navLi = document.querySelectorAll(".nav-link");

    sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        if (window.scrollY >= (sectionTop - 150)) {
            current = section.getAttribute("id");
        }
    });

    navLi.forEach((li) => {
        li.classList.remove("active-section");
        if (li.getAttribute("href") && li.getAttribute("href").includes(current)) {
            li.classList.add("active-section");
        }
    });
});

if(backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

/* ========================================================================
    SECTION 5: ADVANCED SEARCH ENGINE
    ========================================================================
*/
let searchMatches = [];
let currentMatchIndex = -1;
let lastQuery = "";

// 5.1: Toggle Dropdown
function toggleSearchDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('search-dropdown');
    const input = document.getElementById('search-input');
    
    const langDD = document.getElementById('desktop-lang-dd');
    if(langDD) langDD.classList.remove('show');

    if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
        clearHighlights(); 
    } else {
        dropdown.style.display = 'block';
        setTimeout(() => input.focus(), 100);
    }
}

// 5.2: Search Logic & Controls
function closeSearch(e) {
    if(e) e.stopPropagation();
    document.getElementById('search-dropdown').style.display = 'none'; 
    clearHighlights();
    document.getElementById('search-input').value = '';
    if(document.getElementById('search-count')) document.getElementById('search-count').innerText = '';
    lastQuery = "";
}

function clearSearch(e) {
    if(e) e.stopPropagation();
    document.getElementById('search-input').value = '';
    document.getElementById('search-input').focus();
    clearHighlights();
}

function handleSearchKey(event) {
    if (event.key === 'Enter') {
        const currentVal = document.getElementById('search-input').value.trim();
        if (currentVal !== lastQuery || searchMatches.length === 0) {
            performCustomSearch();
        } else {
            nextMatch();
        }
    } else if (event.key === 'Escape') {
        closeSearch(event);
    }
}

function performCustomSearch() {
    clearHighlights();
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;
    
    lastQuery = query;

    const walker = document.createTreeWalker(
        document.body, 
        NodeFilter.SHOW_TEXT, 
        { acceptNode: (node) => {
            if (node.parentElement.tagName === 'SCRIPT' || 
                node.parentElement.tagName === 'STYLE' ||
                node.parentElement.closest('#main-header')) {
                return NodeFilter.FILTER_REJECT;
            }
            if (node.nodeValue.trim() === '') return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }}
    );

    const nodesToReplace = [];
    while(walker.nextNode()) {
        if (walker.currentNode.nodeValue.toLowerCase().includes(query.toLowerCase())) {
            nodesToReplace.push(walker.currentNode);
        }
    }

    searchMatches = [];
    nodesToReplace.forEach(node => {
        const span = document.createElement('span');
        const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${safeQuery})`, 'gi');
        span.innerHTML = node.nodeValue.replace(regex, '<span class="highlight-match">$1</span>');
        
        const fragment = document.createRange().createContextualFragment(span.innerHTML);
        node.replaceWith(fragment);
    });

    searchMatches = Array.from(document.querySelectorAll('.highlight-match'));
    
    const countSpan = document.getElementById('search-count');
    if (searchMatches.length > 0) {
        currentMatchIndex = 0;
        updateMatchView();
    } else {
        if(countSpan) countSpan.innerText = "0/0";
    }
}

function updateMatchView() {
    searchMatches.forEach(m => m.classList.remove('active'));
    if (currentMatchIndex >= 0 && currentMatchIndex < searchMatches.length) {
        const currentEl = searchMatches[currentMatchIndex];
        currentEl.classList.add('active');
        
        const parentPanel = currentEl.closest('.panel');
        if (parentPanel) {
            const toggleBtn = parentPanel.previousElementSibling;
            if (toggleBtn && toggleBtn.classList.contains('accordion-btn') && !toggleBtn.classList.contains('active')) {
                toggleBtn.click();
            }
        }

        setTimeout(() => {
            currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);

        const countSpan = document.getElementById('search-count');
        if(countSpan) countSpan.innerText = `${currentMatchIndex + 1}/${searchMatches.length}`;
    }
}

function nextMatch() {
    if (searchMatches.length === 0) {
        performCustomSearch();
        return;
    }
    currentMatchIndex++;
    if (currentMatchIndex >= searchMatches.length) currentMatchIndex = 0;
    updateMatchView();
}

function prevMatch() {
    if (searchMatches.length === 0) {
        performCustomSearch();
        return;
    }
    currentMatchIndex--;
    if (currentMatchIndex < 0) currentMatchIndex = searchMatches.length - 1;
    updateMatchView();
}

function clearHighlights() {
    const highlights = document.querySelectorAll('.highlight-match');
    highlights.forEach(h => {
        const parent = h.parentNode;
        parent.replaceChild(document.createTextNode(h.textContent), h);
        parent.normalize(); 
    });
    searchMatches = [];
    currentMatchIndex = -1;
    const countSpan = document.getElementById('search-count');
    if(countSpan) countSpan.innerText = "";
}

/*
    ========================================================================
    SECTION 6: NAVIGATION & MENU LOGIC
    ========================================================================
*/

/* 6.1: LANGUAGE SWITCHER */
const languages = {
    'en': { code: 'EN', flag: 'gb' },
    'da': { code: 'DK', flag: 'dk' },
    'es': { code: 'ES', flag: 'es' },
    'fr': { code: 'FR', flag: 'fr' },
    'de': { code: 'DE', flag: 'de' },
    'hi': { code: 'IN', flag: 'in' },
    'zh-CN': { code: 'CN', flag: 'cn' },
    'ar': { code: 'SA', flag: 'sa' },
    'ur': { code: 'PK', flag: 'pk' },
    'ru': { code: 'RU', flag: 'ru' },
    'ja': { code: 'JP', flag: 'jp' }
};

function toggleLangDropdown(e) {
    e.stopPropagation();
    const desktopDD = document.getElementById('desktop-lang-dd');
    const mobileDD = document.getElementById('mobile-lang-dd');
    const navList = document.querySelector('.nav-list');
    const navToggle = document.querySelector('.nav-toggle');

    if(window.innerWidth > 900) {
        closeAllDropdowns(desktopDD);
        if(desktopDD) desktopDD.classList.toggle('show');
    } else {
        closeAllDropdowns(mobileDD);
        if(mobileDD) mobileDD.classList.toggle('show');
    }

    if (navList.classList.contains('active')) {
        navList.classList.remove('active');
        navToggle.classList.remove('open');
    }
}

function changeLanguage(langCode) {
    var select = document.querySelector('.goog-te-combo');
    if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change'));
    }

    const langData = languages[langCode] || languages['en'];
    const displayHTML = `<img src="https://flagcdn.com/w40/${langData.flag}.png" class="flag-xs" alt="${langData.code}"> ${langData.code} <i class="fas fa-chevron-down"></i>`;
    
    document.querySelectorAll('.lang-current-display').forEach(el => {
        el.innerHTML = displayHTML;
    });

    document.querySelectorAll('.custom-lang-dropdown').forEach(d => d.classList.remove('show'));
}

/* 6.2: MOBILE MENU TOGGLE */
function toggleMenu(e) {
    if(e) e.stopPropagation();
    const navBar = document.querySelector('.nav-list');
    const toggleBtn = document.querySelector('.nav-toggle');
    const mobileDD = document.getElementById('mobile-lang-dd');

    if (mobileDD && mobileDD.classList.contains('show')) {
        mobileDD.classList.remove('show');
    }
    closeAllDropdowns();

    navBar.classList.toggle('active');
    toggleBtn.classList.toggle('open');
}

// 6.3: Mobile Submenu Toggle
function toggleMobileSubmenu(e) {
    e.stopPropagation(); 
    const dropdown = document.getElementById('research-dropdown');
    const toggleBtn = e.currentTarget;
    
    closeAllDropdowns(dropdown);
    
    if (dropdown.classList.contains('show-mobile')) {
        dropdown.classList.remove('show-mobile');
        toggleBtn.classList.remove('active');
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
    } else {
        dropdown.classList.add('show-mobile');
        toggleBtn.classList.add('active');
        toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    }
}

// Toggle Nested Sub-menus on Mobile
function toggleNestedMobile(e, link) {
    if (window.innerWidth <= 900) {
        e.preventDefault(); 
        e.stopPropagation();
        
        const wrapper = link.closest('.dropdown-item-wrapper');
        const subMenu = wrapper.querySelector('.sub-dropdown-content');
        const arrow = link.querySelector('.nested-arrow');
        
        if (subMenu.classList.contains('show-nested')) {
            subMenu.classList.remove('show-nested');
            if(arrow) {
                arrow.classList.remove('rotated');
            }
            link.classList.remove('active-parent');
        } else {
            const allOpen = document.querySelectorAll('.sub-dropdown-content.show-nested');
            allOpen.forEach(el => {
                el.classList.remove('show-nested');
                const pWrapper = el.closest('.dropdown-item-wrapper');
                const pArrow = pWrapper.querySelector('.nested-arrow');
                if(pArrow) pArrow.classList.remove('rotated');
                const pLink = pWrapper.querySelector('a');
                if(pLink) pLink.classList.remove('active-parent');
            });

            subMenu.classList.add('show-nested');
            if(arrow) {
                arrow.classList.add('rotated');
            }
            link.classList.add('active-parent');
        }
    }
}

/*
    ========================================================================
    SECTION 7: ANIMATIONS & LAYOUT SCRIPTS
    ========================================================================
*/

// 7.1: Scroll Reveal
function reveal() {
    var reveals = document.querySelectorAll(".reveal");
    for (var i = 0; i < reveals.length; i++) {
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 100;
        if (elementTop < windowHeight - elementVisible) {
            reveals[i].classList.add("active");
        }
    }
}
window.addEventListener("scroll", reveal);
reveal();

// 7.2: Reverse Numbering Logic
function assignReverseBadges() {
    const containers = [
        document.querySelector('.exp-grid'),
        document.querySelector('.edu-grid'),
        document.querySelector('.referee-grid'),
        document.querySelector('.award-box-grid')
    ];

    containers.forEach(container => {
        if (!container) return;
        
        const cards = container.querySelectorAll('.exp-box, .edu-card, .referee-card, .award-card');
        const total = cards.length;
        
        cards.forEach((card, index) => {
            const number = total - index;
            card.setAttribute('data-badge', number);
        });
    });
}

document.addEventListener('DOMContentLoaded', assignReverseBadges);

// 7.3: Accordion Logic
const acc = document.getElementsByClassName("accordion-btn");
for (let i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", function() {
        for (let j = 0; j < acc.length; j++) {
            if (acc[j] !== this && acc[j].classList.contains("active")) {
                acc[j].classList.remove("active");
                acc[j].nextElementSibling.style.maxHeight = null;
            }
        }
        this.classList.toggle("active");
        const panel = this.nextElementSibling;
        if (panel.style.maxHeight) {
            panel.style.maxHeight = null;
        } else {
            panel.style.maxHeight = panel.scrollHeight + "px"; 
            setTimeout(() => {
                this.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }, 300);
        } 
    });
}

function triggerAccordion(id) {
    const btn = document.getElementById(id);
    if (btn) {
        if (!btn.classList.contains('active')) {
            btn.click();
        }
        setTimeout(() => {
            btn.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
    }
}

// 7.4: Hero Stats Toggle
function togglePubStats(e) {
    if(e.target.closest('.stat-row')) {
        e.preventDefault();
        e.stopPropagation();
        
        const breakdown = document.getElementById('pub-breakdown');
        const toggleIcon = document.querySelector('.stat-toggle i');
        
        const parentContainer = e.target.closest('.stat-row-link');
        
        if (breakdown.classList.contains('open')) {
            breakdown.classList.remove('open');
            breakdown.style.maxHeight = "0";
            toggleIcon.classList.remove('fa-chevron-up');
            toggleIcon.classList.add('fa-chevron-down');
            
            if(parentContainer) parentContainer.classList.remove('active-box');
            
        } else {
            breakdown.classList.add('open');
            breakdown.style.maxHeight = breakdown.scrollHeight + "px";
            toggleIcon.classList.remove('fa-chevron-down');
            toggleIcon.classList.add('fa-chevron-up');
            
            if(parentContainer) parentContainer.classList.add('active-box');
        }
    }
}

// 7.5: Google Translate
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,da,es,fr,de,hi,zh-CN,ar,ur,ru,ja',
        autoDisplay: false
    }, 'google_translate_element');
}

// 7.6: Scroll Progress Bar
window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (scrollTop / scrollHeight) * 100;
    
    const progressBar = document.getElementById('scroll-progress');
    if(progressBar) {
        progressBar.style.width = scrolled + "%";
    }
});

/*
    ========================================================================
    SECTION 8: AI CHAT WIDGET
    ========================================================================
*/

// 8.1: Window Toggle
function toggleChatWindow() {
    const window = document.getElementById('ai-chat-window');
    window.style.display = (window.style.display === 'flex') ? 'none' : 'flex';
}

// 8.2: Messaging Logic
function handleChatKey(e) {
    if (e.key === 'Enter') sendUserMessage();
}

async function sendUserMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';

    const loadingMsg = addMessage('Thinking...', 'loading');

    try {
        const response = await callGeminiAPI(message);
        removeMessage(loadingMsg);
        addMessage(response, 'bot');
    } catch (error) {
        removeMessage(loadingMsg);
        addMessage("Sorry, I encountered an error. Please try again.", 'bot');
    }
}

function sendQuickMessage(text) {
    const input = document.getElementById('chat-input');
    input.value = text;
    sendUserMessage();
}

function addMessage(text, type) {
    const body = document.getElementById('chat-body');
    const div = document.createElement('div');
    div.className = `msg msg-${type}`;
    div.innerHTML = text; // Allow HTML for formatting
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    return div;
}

function removeMessage(element) {
    if (element && element.parentNode) {
        element.parentNode.removeChild(element);
    }
}

// 8.3: API Integration (UPDATED WITH KEY)
async function callGeminiAPI(query) {
    // UPDATED: Using correct model for typical key usage
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    // Scrape page content for context
    const pageContent = document.body.innerText.replace(/\s+/g, ' ').substring(0, 10000); 

    const prompt = `
    You are a helpful AI assistant for Dr. Shaban Ahmad's academic portfolio website. 
    Use the following context from his website to answer the user's question.
    If the answer is not in the context, politely say you don't have that information.
    Keep answers concise and professional.
    
    Context: ${pageContent}
    
    User Question: ${query}
    `;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
    };

    // Retry logic
    const delays = [1000, 2000, 4000];
    for (let i = 0; i <= delays.length; i++) {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            if (i === delays.length) throw error;
            await new Promise(resolve => setTimeout(resolve, delays[i]));
        }
    }
}