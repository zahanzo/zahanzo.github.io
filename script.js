document.addEventListener('DOMContentLoaded', () => {
    initGlobal();
    initView();
    applyLang(currentLang);
});

// ==========================================
// 1. I18N ENGINE
// ==========================================
let currentLang = localStorage.getItem('lang') || 'pt';

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyLang(lang);
}

function applyLang(lang) {
    // 1. Swap inline text on [data-pt] / [data-en] elements (sync)
    document.querySelectorAll('[data-pt], [data-en]').forEach(el => {
        const val = el.getAttribute('data-' + lang);
        if (val !== null) el.textContent = val;
    });

    // 2. Show/hide block-level language sections (sync)
    document.querySelectorAll('.lang-pt').forEach(el => el.style.display = lang === 'pt' ? '' : 'none');
    document.querySelectorAll('.lang-en').forEach(el => el.style.display = lang === 'en' ? '' : 'none');

    // 3. Sync lang-toggle button state (sync)
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === 'btn-' + lang);
    });

    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';

    // 4. Re-render dynamic JSON content in the new language.
    //    Only runs if data is already cached — instant, no fetch needed.
    if (_posts)    renderPosts();
    if (_projetos) renderProjetos();
}

// ==========================================
// 2. MICRO-ROUTER (SPA)
// ==========================================
function initGlobal() {
    // Mobile menu
    const hamburger = document.querySelector('.hamburger');
    const navLinks  = document.querySelector('.nav-links');
    if (hamburger) {
        hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
    }

    // Lang toggle — single persistent listener via delegation
    document.body.addEventListener('click', (e) => {
        const btn = e.target.closest('.lang-btn');
        if (btn && btn.id) setLang(btn.id.replace('btn-', ''));
    });

    // Filter buttons — single persistent listener via delegation (no re-adding on each view)
    document.body.addEventListener('click', (e) => {
        const filterBtn = e.target.closest('.filter-btn');
        if (filterBtn) {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            filterBtn.classList.add('active');
            applyActiveFilter(); // direct call, no .click() tricks
        }
    });

    // SPA link interceptor
    document.body.addEventListener('click', async (e) => {
        const link = e.target.closest('a');
        if (
            link &&
            link.href.startsWith(window.location.origin) &&
            link.target !== '_blank' &&
            !link.href.includes('#')
        ) {
            if (!link.closest('.nav-links') && !link.classList.contains('back-btn')) return;
            e.preventDefault();
            window.history.pushState({}, '', link.href);
            await loadView(link.href);
        }
    });

    window.addEventListener('popstate', async () => loadView(window.location.href));
}

// ==========================================
// 3. VIEW LOADER
// ==========================================
async function loadView(url) {
    try {
        const response   = await fetch(url);
        const html       = await response.text();
        const doc        = new DOMParser().parseFromString(html, 'text/html');
        const newContent = doc.querySelector('#app-root');
        if (newContent) document.querySelector('#app-root').innerHTML = newContent.innerHTML;
        updateActiveNav(url);
        initView();
        applyLang(currentLang);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        console.error('Failed to load view:', err);
    }
}

function updateActiveNav(url) {
    document.querySelectorAll('.nav-links a').forEach(link => {
        const isActive = url.includes(link.getAttribute('href'));
        link.style.color = isActive ? 'var(--accent)' : '';
        link.classList.toggle('active', isActive);
    });
}

// ==========================================
// 4. VIEW INIT (runs on each page load)
// ==========================================
function initView() {
    // No more per-element addEventListener for filters — handled by delegation in initGlobal.
    // Just trigger the initial render.
    renderPosts();
    renderProjetos();
}

// ==========================================
// 5. JSON RENDERERS (with in-memory cache)
// ==========================================

let _posts    = null; // cached after first fetch
let _projetos = null;

function renderPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;

    const doRender = (posts) => {
        const readMore = currentLang === 'en' ? 'Read full post &rarr;' : 'Ler post completo &rarr;';
        container.innerHTML = '';
        posts.forEach(post => {
            const desc = (currentLang === 'en' && post.description_en)
                ? post.description_en : post.description;
            const card = document.createElement('a');
            card.href      = post.url;
            card.className = 'card post-card';
            card.setAttribute('data-category', post.category);
            card.style.cssText = 'text-decoration:none;color:inherit;display:block;cursor:pointer;';
            card.innerHTML = `
                <span class="post-tag">${post.tag}</span>
                <h3>${post.title}</h3>
                <p>${desc}</p>
                <span class="read-more">${readMore}</span>`;
            container.appendChild(card);
        });
        applyActiveFilter(); // apply current filter after cards are injected
    };

    if (_posts) { doRender(_posts); return; }
    fetch('posts.json').then(r => r.json()).then(posts => { _posts = posts; doRender(posts); }).catch(() => {});
}

function renderProjetos() {
    const container = document.getElementById('projetos-container');
    if (!container) return;

    const doRender = (projetos) => {
        container.innerHTML = '';
        projetos.forEach(p => {
            const desc = (currentLang === 'en' && p.description_en) ? p.description_en : p.description;
            const card = document.createElement('a');
            card.href      = p.url;
            card.className = 'card project-card';
            card.style.cssText = 'text-decoration:none;color:inherit;display:block;cursor:pointer;';
            card.innerHTML = `<h3>${p.title}</h3><p>${desc}</p>`;
            container.appendChild(card);
        });
    };

    if (_projetos) { doRender(_projetos); return; }
    fetch('projects.json').then(r => r.json()).then(p => { _projetos = p; doRender(p); }).catch(() => {});
}

// ==========================================
// 6. FILTER HELPER
// ==========================================
function applyActiveFilter() {
    const activeBtn = document.querySelector('.filter-btn.active');
    if (!activeBtn) return;
    const filter = activeBtn.getAttribute('data-filter');
    document.querySelectorAll('.post-card').forEach(card => {
        card.style.display =
            (filter === 'all' || card.getAttribute('data-category') === filter)
                ? 'block' : 'none';
    });
}