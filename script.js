document.addEventListener('DOMContentLoaded', () => {
    initGlobal(); // Inicia menu e rotas
    initView();   // Inicia a lógica da página atual (JSON, Filtros)
});

// ==========================================
// 1. O MOTOR SPA (MICRO-ROUTER)
// ==========================================
function initGlobal() {
    // Menu Mobile
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if(hamburger) {
        hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
    }

    // Interceptador de Cliques
    // Interceptador de Cliques
    document.body.addEventListener('click', async (e) => {
        const link = e.target.closest('a');
        
        // Se for um link interno, na mesma janela, e não for uma âncora de ID (#)
        if (link && link.href.startsWith(window.location.origin) && link.target !== '_blank' && !link.href.includes('#')) {
            
            // ==== A REGRA DE OURO ENTRA AQUI ====
            // Se o clique NÃO foi no menu de abas e NÃO foi no botão de voltar...
            if (!link.closest('.nav-links') && !link.classList.contains('back-btn')) {
                return; // Encerra a função aqui e deixa o navegador abrir o HTML puro normalmente!
            }
            // ====================================

            e.preventDefault(); // Mata o comportamento padrão (refresh da página)
            
            const url = link.href;
            window.history.pushState({}, '', url); // Altera a URL no navegador
            await loadView(url);
        }
    });

    // Garante que o botão "Voltar" do navegador também funcione instantaneamente
    window.addEventListener('popstate', async () => {
        await loadView(window.location.href);
    });
}

// ==========================================
// 2. FUNÇÃO DE INJEÇÃO DE MEMÓRIA (DOM)
// ==========================================
async function loadView(url) {
    try {
        // Baixa a página em background
        const response = await fetch(url);
        const html = await response.text();
        
        // Faz o parse do HTML na RAM
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Pega o recheio da nova página e injeta no container atual
        const novoConteudo = doc.querySelector('#app-root').innerHTML;
        document.querySelector('#app-root').innerHTML = novoConteudo;
        
        // Atualiza a cor do Menu para mostrar qual aba está ativa
        atualizarMenuAtivo(url);

        // Re-inicia os códigos de JSON e Filtro, pois o HTML é novo
        initView();
        
        // Sobe a tela para o topo suavemente
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        console.error("Falha ao injetar a View:", err);
    }
}

function atualizarMenuAtivo(url) {
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.style.color = 'var(--text-main)'; // Reseta todos
        if(url.includes(link.getAttribute('href'))) {
            link.style.color = 'var(--accent)'; // Acende o atual
        }
    });
}

// ==========================================
// 3. LÓGICA DAS VIEWS (JSON e FILTROS)
// ==========================================
function initView() {
    // --- Lógica de Filtros (Posts) ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');
            const postCards = document.querySelectorAll('.post-card');

            postCards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                    card.style.display = 'block';
                    card.style.animation = 'fadeIn 0.5s ease forwards';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // --- Carregar Posts do JSON ---
    const postsContainer = document.getElementById('posts-container');
    if (postsContainer) {
        fetch('posts.json')
            .then(response => response.json())
            .then(posts => {
                postsContainer.innerHTML = ''; // Limpa antes de injetar
                posts.forEach(post => {
                    const card = document.createElement('a');
                    card.href = post.url;
                    card.className = `card post-card`;
                    card.setAttribute('data-category', post.category);
                    card.style.cssText = 'text-decoration: none; color: inherit; display: block; cursor: pointer;';
                    
                    card.innerHTML = `
                        <span class="post-tag">${post.tag}</span>
                        <h3>${post.title}</h3>
                        <p>${post.description}</p>
                        <span class="read-more">Ler post completo <span>&rarr;</span></span>
                    `;
                    postsContainer.appendChild(card);
                });

                const activeFilterBtn = document.querySelector('.filter-btn.active');
                if (activeFilterBtn) activeFilterBtn.click();
            });
    }

    // --- Carregar Projetos do JSON ---
    const projetosContainer = document.getElementById('projetos-container');
    if (projetosContainer) {
        fetch('projetos.json')
            .then(response => response.json())
            .then(projetos => {
                projetosContainer.innerHTML = '';
                projetos.forEach(projeto => {
                    const card = document.createElement('a');
                    card.href = projeto.url; 
                    card.className = `card project-card`;
                    card.style.cssText = 'text-decoration: none; color: inherit; display: block; cursor: pointer;';
                    
                    card.innerHTML = `
                        <h3>${projeto.title}</h3>
                        <p>${projeto.description}</p>
                    `;
                    projetosContainer.appendChild(card);
                });
            });
    }
}