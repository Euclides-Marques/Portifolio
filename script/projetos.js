document.addEventListener('DOMContentLoaded', function () {
    const projectsContainer = document.querySelector('.projects-grid');
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination';

    if (!projectsContainer) return;

    const username = 'Euclides-Marques';
    const reposPerPage = 3; // Número de projetos por página
    let currentPage = 1;
    let allRepos = [];

    // Show loading state
    function showLoading() {
        projectsContainer.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Carregando projetos...</p>
            </div>
        `;
    }

    // Show initial loading
    showLoading();

    // Function to create project card
    function createProjectCard(repo) {
        if (!repo) return '';

        // Skip if it's a template repository
        if (repo.is_template) return '';

        // Map languages to icons
        const languageIcons = {
            'C#': 'fas fa-code',
            'JavaScript': 'fab fa-js',
            'HTML': 'fab fa-html5',
            'CSS': 'fab fa-css3-alt',
            'PHP': 'fab fa-php',
            'default': 'fas fa-code-branch'
        };

        const language = repo.language || 'Code';
        const iconClass = languageIcons[language] || languageIcons['default'];

        // Pega a descrição do repositório
        const description = (repo.description ?
            repo.description.replace(/[^\x00-\x7F]/g, '') :
            `Projeto ${repo.name} desenvolvido com ${language}`);

        // Limita o tamanho da descrição
        const truncatedDesc = description.substring(0, 117) + (description.length > 117 ? '...' : '');

        // Mapeia linguagens para suas logos oficiais (SVG)
        const languageImages = {
            'JavaScript': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
            'HTML': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original-wordmark.svg',
            'CSS': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original-wordmark.svg',
            'C#': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
            'PHP': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
            'default': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original-wordmark.svg'
        };

        // Mapeia linguagens para cores de fundo (opcional)
        const languageColors = {
            'JavaScript': '#f7df1e',
            'HTML': '#e34f26',
            'CSS': '#1572b6',
            'C#': '#239120',
            'PHP': '#777bb4',
            'default': '#f0f0f0'
        };

        // Usa a imagem e cor correspondentes à linguagem do projeto
        const imageUrl = languageImages[language] || languageImages['default'];
        const bgColor = languageColors[language] || languageColors['default'];

        return `
            <div class="project-card">
                <div class="project-image">
                    <div style="display: flex; justify-content: center; align-items: center; width: 100%; height: 200px; background-color: ${bgColor}22; padding: 20px;">
                        <img src="${imageUrl}" 
                             alt="${language} logo"
                             style="max-width: 80%; max-height: 80%; object-fit: contain;"
                             onerror="this.onerror=null; this.src='${languageImages['default']}'">
                    </div>
                </div>
                <div class="project-content">
                    <h3>${repo.name}</h3>
                    <p>${truncatedDesc}</p>
                    <div class="project-tech">
                        <span><i class="${iconClass}"></i> ${language}</span>
                    </div>
                    <a href="${repo.html_url}" class="btn btn-outline" target="_blank" rel="noopener noreferrer">
                        <i class="fab fa-github"></i> Ver no GitHub
                    </a>
                </div>
            </div>
        `;
    }

    // Function to show error message
    function showError(message) {
        projectsContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message || 'Ocorreu um erro ao carregar os projetos.'}</p>
            </div>
        `;
        paginationContainer.style.display = 'none';
    }

    // Function to render pagination controls
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

        // Add event listeners to pagination buttons
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

    // Function to display repositories for the current page
    function displayRepos() {
        const startIndex = (currentPage - 1) * reposPerPage;
        const endIndex = startIndex + reposPerPage;
        const paginatedRepos = allRepos.slice(startIndex, endIndex);

        const projectsHTML = paginatedRepos.map(repo => createProjectCard(repo)).join('');
        projectsContainer.innerHTML = projectsHTML;

        const totalPages = Math.ceil(allRepos.length / reposPerPage);
        renderPagination(totalPages);
    }

    // Fetch GitHub repositories sem autenticação
    fetch(apiUrl, fetchOptions)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(repos => {
            // Filter and sort repositories
            allRepos = repos
                .filter(repo => {
                    // Only exclude if it's a fork and has no description
                    const include = !repo.fork || (repo.description && repo.description.trim() !== '');
                    return include;
                })
                .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically by repository name

            if (allRepos.length === 0) {
                // Show all repositories even if they don't match all criteria
                allRepos = repos.map(repo => ({
                    ...repo,
                    description: repo.description || 'Sem descrição disponível'
                }));

                if (allRepos.length === 0) {
                    showError('Nenhum projeto encontrado no GitHub.');
                    return;
                }
            }

            // Insert pagination container after projects
            projectsContainer.insertAdjacentElement('afterend', paginationContainer);

            // Display first page of results
            displayRepos();
        })
        .catch(error => {
            console.error('Erro ao carregar projetos:', error);
            if (error.message.includes('rate limit')) {
                showError('Limite de requisições excedido. Por favor, tente novamente mais tarde.');
            } else if (error.message.includes('401') || error.message.includes('403')) {
                showError('Erro de autenticação. Verifique o token de acesso.');
            } else if (error.message.includes('404')) {
                showError('Usuário não encontrado. Verifique o nome de usuário do GitHub.');
            } else {
                showError('Não foi possível carregar os projetos. Verifique sua conexão e tente novamente.');
            }
        });
});