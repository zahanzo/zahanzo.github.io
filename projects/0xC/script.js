/**
 * 0xC_ Deep Dive Lab — SPA Engine
 * Motor assíncrono com fetch, navegação por teclado e injeção de botão "Próximo Capítulo"
 */

document.addEventListener('DOMContentLoaded', () => {
    const menuItems  = Array.from(document.querySelectorAll('.book-menu-item'));
    const viewer     = document.getElementById('book-viewer');
    const BASE_PATH  = '0xC/';

    // Mapa de ordenação dos capítulos para navegação sequencial
    const CHAPTER_ORDER = menuItems.map(el => el.getAttribute('data-chapter'));

    /* ── Carregamento de Capítulo ─────────────────────────── */
    async function loadChapter(chapterName, clickedEl) {
        // 1. Atualiza menu lateral
        menuItems.forEach(i => i.classList.remove('active'));
        clickedEl.classList.add('active');

        // 2. Estado de loading estilo terminal
        viewer.innerHTML = `<p class="loading-state">[sys] Mapeando setor: ${chapterName}.html → 0x${Math.floor(Math.random()*0xFFFF).toString(16).padStart(4,'0').toUpperCase()}...</p>`;

        try {
            const res = await fetch(BASE_PATH + chapterName + '.html');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const html = await res.text();

            // 3. Injeta conteúdo com wrapper animado
            viewer.innerHTML = `<article class="chapter-section active">${html}${buildNavButton(chapterName)}</article>`;

            // 4. Scroll topo suave
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // 5. Bind no botão injetado
            const btnNext = viewer.querySelector('.btn-next');
            if (btnNext) {
                btnNext.addEventListener('click', () => {
                    const nextItem = getNextItem(chapterName);
                    if (nextItem) loadChapter(nextItem.getAttribute('data-chapter'), nextItem);
                });
            }

        } catch (err) {
            viewer.innerHTML = `
                <article class="chapter-section active">
                    <h2 style="color:var(--accent-red)">[ERRO] Falha de I/O — SegFault Detectado</h2>
                    <p>Não foi possível carregar o módulo <code>${chapterName}.html</code>.</p>
                    <p style="color:var(--text-muted);font-family:var(--font-mono);font-size:0.8rem;">→ ${err.message}</p>
                </article>`;
        }
    }

    /* ── Botão "Próximo Capítulo" ─────────────────────────── */
    function buildNavButton(currentChapter) {
        const idx  = CHAPTER_ORDER.indexOf(currentChapter);
        const next = CHAPTER_ORDER[idx + 1];
        if (!next) {
            return `<div class="chapter-nav">
                        <span style="font-family:var(--font-mono);font-size:0.78rem;color:var(--accent-green)">
                            ✓ Você completou o laboratório. // EOF reached
                        </span>
                    </div>`;
        }
        const nextEl    = menuItems.find(el => el.getAttribute('data-chapter') === next);
        const nextLabel = nextEl ? nextEl.textContent.trim() : next;
        return `<div class="chapter-nav">
                    <button class="btn-next">→ ${nextLabel}</button>
                </div>`;
    }

    function getNextItem(currentChapter) {
        const idx = CHAPTER_ORDER.indexOf(currentChapter);
        const nextChapter = CHAPTER_ORDER[idx + 1];
        return nextChapter ? menuItems.find(el => el.getAttribute('data-chapter') === nextChapter) : null;
    }

    /* ── Bind Eventos ─────────────────────────────────────── */
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const chapter = item.getAttribute('data-chapter');
            loadChapter(chapter, item);
        });
    });

    // Navegação por teclado: setas esquerda/direita
    document.addEventListener('keydown', e => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        const activeItem = menuItems.find(i => i.classList.contains('active'));
        if (!activeItem) return;
        const currentChapter = activeItem.getAttribute('data-chapter');
        const idx = CHAPTER_ORDER.indexOf(currentChapter);
        const targetIdx = e.key === 'ArrowRight' ? idx + 1 : idx - 1;
        if (targetIdx >= 0 && targetIdx < CHAPTER_ORDER.length) {
            const targetItem = menuItems[targetIdx];
            loadChapter(targetItem.getAttribute('data-chapter'), targetItem);
        }
    });

    /* ── Auto-load: Prefácio ─────────────────────────────── */
    if (menuItems.length > 0) {
        loadChapter(menuItems[0].getAttribute('data-chapter'), menuItems[0]);
    }
});
