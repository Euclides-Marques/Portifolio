document.addEventListener('DOMContentLoaded', function () {
    const projectsContainer = document.querySelector('.projects-grid');
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination';

    if (!projectsContainer) return;

    const reposPerPage = 8;
    let currentPage = 1;
    let allRepos = [];
    
    window.allRepos = allRepos;

    function showLoading() {
        const skeletonRows = Array(5).fill('').map(() => `
            <div class="skeleton-row">
                <div class="skeleton-visual"></div>
                <div class="skeleton-lines">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text" style="width: 40%;"></div>
                </div>
            </div>
        `).join('');

        projectsContainer.innerHTML = skeletonRows;
    }

    showLoading();

    const LANGUAGE_META = {
        'C#': { icon: 'fas fa-code', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg', color: '#239120' },
        'JavaScript': { icon: 'fab fa-js', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg', color: '#f7df1e' },
        'HTML': { icon: 'fab fa-html5', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original-wordmark.svg', color: '#e34f26' },
        'CSS': { icon: 'fab fa-css3-alt', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original-wordmark.svg', color: '#1572b6' },
        'PHP': { icon: 'fab fa-php', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg', color: '#777bb4' },
        'default': { icon: 'fas fa-code-branch', image: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original-wordmark.svg', color: '#f0f0f0' }
    };

    function createProjectCard(repo, position) {
        if (!repo) return '';

        if (repo.is_template) return '';

        const language = repo.language || 'Code';
        const { icon: iconClass, image: imageUrl, color: bgColor } = LANGUAGE_META[language] || LANGUAGE_META['default'];

        const description = (repo.description ?
            repo.description.replace(/[^\x00-\x7F]/g, '') :
            window.t('projects.defaultDescription', 'Projeto {name} desenvolvido com {language}')
                .replace('{name}', repo.name)
                .replace('{language}', language));

        const truncatedDesc = description.substring(0, 117) + (description.length > 117 ? '...' : '');

        return `
            <a href="${repo.html_url}" class="project-row" target="_blank" rel="noopener noreferrer">
                <span class="project-index">${String(position).padStart(2, '0')}</span>
                <div class="project-visual" style="background-color: ${bgColor}22;">
                    <img src="${imageUrl}"
                         alt="${language} logo"
                         loading="lazy"
                         onerror="this.onerror=null; this.src='${LANGUAGE_META.default.image}'">
                </div>
                <div class="project-body">
                    <h3 class="project-name">${repo.name}</h3>
                    <p class="project-desc">${truncatedDesc}</p>
                    <span class="project-tech"><i class="${iconClass}" aria-hidden="true"></i> ${language}</span>
                </div>
                <span class="project-cta">
                    ${window.t('projects.viewOnGithub', 'Ver no GitHub')}
                    <i class="fas fa-arrow-right" aria-hidden="true"></i>
                </span>
            </a>
        `;
    }

    function showError(message) {
        projectsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message || window.t('projects.errorGeneric', 'Ocorreu um erro ao carregar os projetos.')}</p>
            </div>
        `;
        paginationContainer.style.display = 'none';
    }

    function renderPagination(totalPages) {
        if (totalPages <= 1) {
            paginationContainer.style.display = 'none';
            return;
        }

        let paginationHTML = `
            <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `;
        }

        paginationHTML += `
            <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;
        paginationContainer.style.display = 'flex';

        document.querySelectorAll('.pagination-btn').forEach(button => {
            button.addEventListener('click', () => {
                const page = parseInt(button.dataset.page);
                if (page !== currentPage) {
                    currentPage = page;
                    displayRepos();
                }
            });
        });
    }

    function displayRepos() {
        const startIndex = (currentPage - 1) * reposPerPage;
        const endIndex = startIndex + reposPerPage;
        const paginatedRepos = allRepos.slice(startIndex, endIndex);

        const projectsHTML = paginatedRepos
            .map((repo, i) => createProjectCard(repo, startIndex + i + 1))
            .join('');
        projectsContainer.innerHTML = projectsHTML;

        const totalPages = Math.ceil(allRepos.length / reposPerPage);
        renderPagination(totalPages);
    }

    fetch(apiUrl, fetchOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(repos => {
            allRepos = repos
                .filter(repo => {
                    const include = !repo.fork || (repo.description && repo.description.trim() !== '');
                    return include;
                })
                .sort((a, b) => a.name.localeCompare(b.name));

            if (allRepos.length === 0) {
                allRepos = repos.map(repo => ({
                    ...repo,
                    description: repo.description || window.t('projects.noDescription', 'Sem descrição disponível')
                }));

                if (allRepos.length === 0) {
                    showError(window.t('projects.errorNone', 'Nenhum projeto encontrado no GitHub.'));
                    return;
                }
            }

            window.allRepos = allRepos;

            projectsContainer.insertAdjacentElement('afterend', paginationContainer);

            displayRepos();
        })
        .catch(error => {
            console.error('Erro ao carregar projetos:', error);
            if (error.message.includes('rate limit')) {
                showError(window.t('projects.errorRateLimit', 'Limite de requisições excedido. Por favor, tente novamente mais tarde.'));
            } else if (error.message.includes('401') || error.message.includes('403')) {
                showError(window.t('projects.errorAuth', 'Erro de autenticação. Verifique o token de acesso.'));
            } else if (error.message.includes('404')) {
                showError(window.t('projects.errorNotFound', 'Usuário não encontrado. Verifique o nome de usuário do GitHub.'));
            } else {
                showError(window.t('projects.errorGeneric', 'Não foi possível carregar os projetos. Verifique sua conexão e tente novamente.'));
            }
        });

    document.addEventListener('languageChanged', () => {
        if (allRepos.length > 0) {
            displayRepos();
        }
    });
});