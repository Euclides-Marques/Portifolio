// Sua chave da API do Google Cloud Translation
const API_KEY = 'AIzaSyDOH8Qog8X7FUIeoJa3fCCu8Y4tPFkimlo';
const TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

// Cache local para armazenar traduções
const TRANSLATION_CACHE_KEY = 'translation_cache_v2';

// Inicializa o cache se não existir
function initCache() {
    if (!localStorage.getItem(TRANSLATION_CACHE_KEY)) {
        localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify({}));
    }
    return JSON.parse(localStorage.getItem(TRANSLATION_CACHE_KEY));
}

// Salva uma tradução no cache
function saveToCache(originalText, translatedText, targetLang) {
    try {
        const cache = initCache();
        const cacheKey = `${targetLang}_${originalText}`;
        cache[cacheKey] = translatedText;
        localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
        return;
    }
}

// Busca uma tradução no cache
function getFromCache(originalText, targetLang) {
    try {
        const cache = initCache();
        const cacheKey = `${targetLang}_${originalText}`;
        return cache[cacheKey] || null;
    } catch (e) {
        return null;
    }
}

// Limpa o cache antigo para economizar espaço
function cleanupOldCache() {
    try {
        // Mantém apenas as traduções dos últimos 30 dias
        const CACHE_EXPIRY_DAYS = 30;
        const cache = initCache();
        const now = new Date().getTime();
        const expiryTime = now - (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        // Se o cache for muito grande (>5MB), limpa tudo
        const cacheSize = JSON.stringify(cache).length;
        if (cacheSize > 5 * 1024 * 1024) { // 5MB
            localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify({}));
            return;
        }
    } catch (e) {
        return;
    }
}

// Inicializa o cache quando o script carrega
initCache();
cleanupOldCache();

// Elementos que não devem ser traduzidos
const EXCLUDE_SELECTORS = [
    'script', 'style', 'meta', 'link', 'noscript', 'code', 'pre',
    '.no-translate', '.language-selector', '.theme-toggle', '.menu-toggle', '.logo'
].join(',');

// Função para verificar se um elemento deve ser ignorado
function shouldSkipElement(element) {
    if (!element || !element.nodeType) return true;

    // Ignora elementos de formulário, scripts, estilos, etc.
    const tagName = element.tagName?.toUpperCase();
    const ignoreTags = ['SCRIPT', 'STYLE', 'META', 'LINK', 'NOSCRIPT', 'CODE', 'PRE', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'BUTTON', 'FORM'];

    if (tagName && ignoreTags.includes(tagName)) {
        return true;
    }

    // Ignora elementos com classes específicas
    if (element.classList) {
        const ignoreClasses = ['no-translate', 'language-selector', 'theme-toggle', 'menu-toggle', 'logo'];
        for (const cls of ignoreClasses) {
            if (element.classList.contains(cls)) return true;
        }
    }

    // Verifica se o elemento está dentro de um elemento que deve ser ignorado
    for (const selector of EXCLUDE_SELECTORS) {
        if (element.closest && element.closest(selector)) {
            return true;
        }
    }

    return false;
}

// Função para decodificar entidades HTML
function decodeHtmlEntities(text) {
    if (!text) return text;

    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

// Função para traduzir múltiplos textos de uma vez usando a API do Google
async function translateTexts(texts, targetLang) {
    if (!texts || !texts.length) return new Map();

    try {
        // Remove textos vazios e duplicados
        const uniqueTexts = [...new Set(texts.filter(text => text && text.trim()))];
        if (uniqueTexts.length === 0) return new Map();

        // Verifica o cache primeiro
        const cachedResults = new Map();
        const textsToTranslate = [];

        for (const text of uniqueTexts) {
            const cached = getFromCache(text, targetLang);
            if (cached) {
                cachedResults.set(text, cached);
            } else {
                textsToTranslate.push(text);
            }
        }

        // Se todos os textos estiverem em cache, retorna imediatamente
        if (textsToTranslate.length === 0) {
            return cachedResults;
        }

        // Limita o número de caracteres por requisição (aumentado para 28K para menos chamadas)
        const MAX_CHARS = 28000;
        let currentBatch = [];
        let currentLength = 0;
        const batches = [];

        // Agrupa os textos em lotes menores que o limite de caracteres
        for (const text of uniqueTexts) {
            if (currentLength + text.length > MAX_CHARS && currentBatch.length > 0) {
                batches.push([...currentBatch]);
                currentBatch = [];
                currentLength = 0;
            }
            currentBatch.push(text);
            currentLength += text.length;
        }

        if (currentBatch.length > 0) {
            batches.push(currentBatch);
        }

        // Processa cada lote e coleta os resultados
        let allTranslatedTexts = [];

        for (const batch of batches) {
            try {
                const response = await fetch(`${TRANSLATE_API_URL}?key=${API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        q: batch,
                        target: targetLang,
                        format: 'html',
                        model: 'nmt' // Usa o modelo Neural Machine Translation
                    })
                });

                if (!response.ok) {
                    throw new Error(`Erro na API: ${response.status}`);
                }

                const data = await response.json();
                const translatedTexts = data.data?.translations?.map(t => decodeHtmlEntities(t.translatedText)) || [];

                // Salva as traduções no cache
                batch.forEach((text, index) => {
                    if (translatedTexts[index]) {
                        saveToCache(text, translatedTexts[index], targetLang);
                    }
                });

                allTranslatedTexts = allTranslatedTexts.concat(translatedTexts);
            } catch (error) {
                // Se falhar, adiciona os textos originais para evitar travar
                allTranslatedTexts = allTranslatedTexts.concat(batch);
            }
        }

        // Cria um mapa de texto original para texto traduzido
        const translationMap = new Map();
        uniqueTexts.forEach((text, index) => {
            if (allTranslatedTexts[index]) {
                translationMap.set(text, allTranslatedTexts[index]);
            }
        });

        return translationMap;
    } catch (error) {
        return new Map();
    }
}

// Função para verificar se um elemento deve ser ignorado na tradução
function shouldSkipElement(element) {
    try {
        // Se for um nó de texto, verifica se está vazio
        if (element.nodeType === Node.TEXT_NODE) {
            return !element.textContent || !element.textContent.trim();
        }

        // Se não for um elemento, ignora
        if (element.nodeType !== Node.ELEMENT_NODE) {
            return true;
        }

        // Verifica se o elemento ou algum de seus pais está na lista de exclusão
        try {
            if ((element.matches && element.matches(EXCLUDE_SELECTORS)) ||
                (element.closest && element.closest(EXCLUDE_SELECTORS))) {
                return true;
            }
        } catch (e) {
            return true;
        }

        // Ignora elementos de formulário e outros que não devem ser traduzidos
        const tagName = element.tagName?.toUpperCase();
        if (tagName && ['INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'SCRIPT', 'STYLE', 'TEMPLATE', 'CODE', 'PRE'].includes(tagName)) {
            return true;
        }

        // Verifica classes de exclusão
        if (element.classList && (
            element.classList.contains('no-translate') ||
            element.classList.contains('language-selector') ||
            element.classList.contains('theme-toggle') ||
            element.classList.contains('menu-toggle') ||
            element.classList.contains('logo')
        )) {
            return true;
        }

        return false;
    } catch (error) {
        return true; // Em caso de erro, melhor pular o elemento
    }
}

// Função para traduzir um elemento e seus filhos
async function translateElement(element, targetLang) {
    // Verificação de segurança
    if (!element || !element.nodeType) {
        return;
    }

    try {
        // Pula elementos que não devem ser traduzidos
        if (shouldSkipElement(element)) {
            return;
        }

        // Traduz atributos de texto
        const textAttributes = ['placeholder', 'title', 'alt', 'aria-label'];
        for (const attr of textAttributes) {
            try {
                if (element.hasAttribute && typeof element.hasAttribute === 'function') {
                    if (element.hasAttribute(attr)) {
                        const text = element.getAttribute(attr);
                        if (text && text.trim()) {
                            const translated = await translateText(text, targetLang);
                            if (translated) {
                                element.setAttribute(attr, translated);
                            }
                        }
                    }
                }
            } catch (attrError) {
                return;
            }
        }

        // Processa nós de texto
        if (element.nodeType === Node.TEXT_NODE) {
            try {
                const text = element.textContent?.trim();
                if (text && text.length > 1) { // Só traduz se tiver mais de 1 caractere
                    const translatedText = await translateText(text, targetLang);
                    if (translatedText && translatedText !== text) {
                        element.textContent = translatedText;
                    }
                }
                return; // Nós de texto não têm filhos
            } catch (textError) {
                return;
            }
        }

        // Processa elementos com filhos
        if (element.childNodes && element.childNodes.length > 0) {
            try {
                // Cria uma cópia estática da lista de filhos
                const children = Array.from(element.childNodes);

                // Processa cada filho sequencialmente
                for (const child of children) {
                    try {
                        await translateElement(child, targetLang);
                    } catch (childError) {
                        return;
                    }
                }
            } catch (childrenError) {
                return;
            }
        }
    } catch (error) {
        return;
    }
}

// Função para mostrar/esconder o modal de carregamento
function showLoadingModal(show = true) {
    const modal = document.getElementById('loadingModal');
    const body = document.body;

    if (show) {
        modal.style.display = 'flex';
        body.classList.add('modal-open');
    } else {
        modal.style.display = 'none';
        body.classList.remove('modal-open');
    }
}

// Função para mostrar o progresso da tradução
function updateProgress(progress, message = '') {
    const progressBar = document.getElementById('translation-progress');
    const progressText = document.getElementById('translation-progress-text');

    if (progressBar) {
        progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    if (progressText && message) {
        progressText.textContent = message;
    }
}

// Função para traduzir a página inteira
async function translatePage(targetLang) {
    // Mostra o modal de carregamento
    showLoadingModal(true);
    updateProgress(0, 'Preparando para traduzir...');

    try {
        const startTime = performance.now();
        // Seleciona todos os elementos de texto traduzíveis
        const translatableElements = [
            ...document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, li, td, th, label, figcaption, blockquote, cite, button, [data-translate]')
        ];

        // Remove duplicatas e filtra elementos que devem ser traduzidos
        const elementsToTranslate = [];
        const textsToTranslate = [];
        const elementTextMap = new Map();

        // Primeira passagem: coleta todos os textos únicos
        updateProgress(5, 'Analisando conteúdo da página...');
        let elementsProcessed = 0; // Renomeado para evitar conflito
        const totalElements = translatableElements.length;
        const updateInterval = Math.ceil(totalElements / 10); // Atualiza a cada 10%

        for (let i = 0; i < translatableElements.length; i++) {
            const element = translatableElements[i];
            if (shouldSkipElement(element)) continue;

            const text = element.textContent?.trim();
            if (!text || text.length <= 1) continue;

            // Evita adicionar o mesmo texto múltiplas vezes
            if (!elementTextMap.has(text)) {
                elementTextMap.set(text, []);
                textsToTranslate.push(text);
            }
            elementTextMap.get(text).push(element);

            // Atualiza o progresso a cada 10% dos elementos processados
            elementsProcessed++;
            if (elementsProcessed % updateInterval === 0 || i === totalElements - 1) {
                const progress = 5 + Math.floor((i / totalElements) * 15); // 5-20%
                updateProgress(progress, `Processando elementos: ${i + 1}/${totalElements}`);
            }
        }

        // Traduz todos os textos de uma vez
        updateProgress(20, 'Preparando para traduzir...');

        // Adiciona um atraso total de 5 segundos divididos em partes
        const totalDelayTime = 5000; // 5 segundos
        const delaySteps = 3; // Número de passos para dividir o atraso
        const delayTime = totalDelayTime / delaySteps;

        // Simula um carregamento progressivo
        for (let i = 0; i < delaySteps; i++) {
            const progress = 20 + (i * 10); // 20% a 60%
            updateProgress(progress, `Traduzindo... (${i + 1}/${delaySteps})`);
            await new Promise(resolve => setTimeout(resolve, delayTime));
        }

        // Realiza a tradução de fato
        updateProgress(70, 'Processando tradução...');
        const translationMap = await translateTexts(textsToTranslate, targetLang);

        // Pequeno atraso antes de aplicar as traduções
        await new Promise(resolve => setTimeout(resolve, 500));
        updateProgress(80, 'Aplicando traduções...');

        // Aplica as traduções aos elementos
        const totalToProcess = [...elementTextMap.entries()].reduce((sum, [_, elements]) => sum + elements.length, 0);
        let translationsApplied = 0; // Renomeado para evitar conflito
        const updateStep = Math.ceil(totalToProcess / 10); // Atualiza a cada 10%

        for (const [originalText, elements] of elementTextMap.entries()) {
            const translatedText = translationMap.get(originalText) || originalText;

            for (const element of elements) {
                try {
                    if (element.textContent.trim() === originalText) {
                        element.textContent = translatedText;
                    }

                    // Atualiza atributos que podem conter texto
                    const attributes = ['placeholder', 'title', 'alt', 'aria-label'];
                    for (const attr of attributes) {
                        const attrValue = element.getAttribute(attr);
                        if (attrValue && attrValue.trim() === originalText) {
                            element.setAttribute(attr, translatedText);
                        }
                    }
                } catch (e) {
                    return;
                }

                // Atualiza o progresso com um pequeno atraso para parecer mais real
                translationsApplied++;
                if (translationsApplied % updateStep === 0 || translationsApplied === totalToProcess) {
                    const progress = 80 + Math.floor((translationsApplied / totalToProcess) * 15); // 80-95%
                    updateProgress(progress, `Atualizando elementos: ${translationsApplied}/${totalToProcess}`);
                    // Pequeno atraso para parecer que está processando
                    if (translationsApplied < totalToProcess) {
                        await new Promise(resolve => setTimeout(resolve, 30));
                    }
                }
            }
        }

        // Atualiza o atributo lang do HTML
        document.documentElement.lang = targetLang;

        // Salva a preferência de idioma
        localStorage.setItem('preferredLanguage', targetLang);

        // Dispara evento para atualizar componentes que dependem do idioma
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { lang: targetLang }
        }));

        // Atualiza o seletor de idioma
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = targetLang;
        }

        // Mostra notificação de conclusão
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);
        showToast(`Tradução concluída!`, 'success');

    } catch (error) {
        showToast('Erro ao traduzir a página. Recarregando a página...', 'error');
        setTimeout(() => window.location.reload(), 2000);
    } finally {
        // Esconde o modal de carregamento com um pequeno atraso para garantir que tudo foi atualizado
        setTimeout(() => {
            updateProgress(100, 'Tradução concluída!');
            setTimeout(() => showLoadingModal(false), 500);
        }, 300);
    }
}

// Função para exibir notificações
function showToast(message, type = 'info', duration = 3000) {
    // Cria um novo elemento toast
    const toast = document.createElement('div');
    toast.className = `toast show ${type}`;
    toast.textContent = message;

    // Adiciona o toast ao body
    document.body.appendChild(toast);

    // Se a duração for maior que 0, remove após o tempo especificado
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            // Remove o elemento do DOM após a animação
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300); // Tempo da animação de saída
        }, duration);
    }

    // Retorna o elemento para controle externo
    return toast;
}

// Carrega a linguagem salva ou usa o padrão (pt)
function loadLanguage() {
    const savedLang = localStorage.getItem('preferredLanguage') || 'pt';
    document.getElementById('language-select').value = savedLang;
    updateTexts(savedLang);
    return savedLang;
}

// Cria o modal de carregamento se não existir
function createLoadingModal() {
    if (document.getElementById('loadingModal')) return;

    const modal = document.createElement('div');
    modal.id = 'loadingModal';
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.zIndex = '9999';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.flexDirection = 'column';
    modal.style.color = 'white';

    modal.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <h3>Traduzindo...</h3>
            <div class="progress-container">
                <div id="translation-progress" class="progress-bar"></div>
            </div>
            <div id="translation-progress-text" class="progress-text">Iniciando tradução...</div>
        </div>
    `;

    document.body.appendChild(modal);
}

// Adiciona estilos para o indicador de carregamento
const style = document.createElement('style');
style.textContent = `
    .loading {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 200px;
        font-size: 1.2rem;
        color: var(--text-color);
        padding: 20px;
        text-align: center;
    }
    
    .progress-container {
        width: 80%;
        max-width: 400px;
        height: 20px;
        background-color: #f0f0f0;
        border-radius: 10px;
        margin: 20px 0;
        overflow: hidden;
    }
    
    .progress-bar {
        height: 100%;
        background-color: #4CAF50;
        width: 0%;
        transition: width 0.3s ease;
    }
    
    .progress-text {
        margin-top: 10px;
        font-size: 0.9rem;
        color: #666;
    }
`;
document.head.appendChild(style);

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    // Cria o modal de carregamento
    createLoadingModal();
    const languageSelect = document.getElementById('language-select');

    // Carrega a linguagem salva ou usa 'pt' como padrão
    const savedLang = localStorage.getItem('preferredLanguage') || 'pt';
    if (languageSelect) {
        languageSelect.value = savedLang;

        // Se não for português, traduz a página
        if (savedLang !== 'pt') {
            await translatePage(savedLang);
        }
    }

    // Atualiza a linguagem quando o usuário selecionar uma nova
    if (languageSelect) {
        languageSelect.addEventListener('change', async (e) => {
            const newLang = e.target.value;
            if (newLang === 'pt') {
                // Se for português, recarrega a página original
                localStorage.removeItem('preferredLanguage');
                window.location.reload();
            } else {
                await translatePage(newLang);
            }
        });
    }
});
