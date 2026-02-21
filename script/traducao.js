const API_KEY = 'AIzaSyDOH8Qog8X7FUIeoJa3fCCu8Y4tPFkimlo';
const TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';

const TRANSLATION_CACHE_KEY = 'translation_cache_v2';

function initCache() {
    if (!localStorage.getItem(TRANSLATION_CACHE_KEY)) {
        localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify({}));
    }
    return JSON.parse(localStorage.getItem(TRANSLATION_CACHE_KEY));
}

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

function getFromCache(originalText, targetLang) {
    try {
        const cache = initCache();
        const cacheKey = `${targetLang}_${originalText}`;
        return cache[cacheKey] || null;
    } catch (e) {
        return null;
    }
}

function cleanupOldCache() {
    try {
        const CACHE_EXPIRY_DAYS = 30;
        const cache = initCache();
        const now = new Date().getTime();
        const expiryTime = now - (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

        const cacheSize = JSON.stringify(cache).length;
        if (cacheSize > 5 * 1024 * 1024) { // 5MB
            localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify({}));
            return;
        }
    } catch (e) {
        return;
    }
}

initCache();
cleanupOldCache();

const EXCLUDE_SELECTORS = [
    'script', 'style', 'meta', 'link', 'noscript', 'code', 'pre',
    '.no-translate', '.language-selector', '.theme-toggle', '.menu-toggle', '.logo'
].join(',');

function shouldSkipElement(element) {
    if (!element || !element.nodeType) return true;

    const tagName = element.tagName?.toUpperCase();
    const ignoreTags = ['SCRIPT', 'STYLE', 'META', 'LINK', 'NOSCRIPT', 'CODE', 'PRE', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'BUTTON', 'FORM'];

    if (tagName && ignoreTags.includes(tagName)) {
        return true;
    }

    if (element.classList) {
        const ignoreClasses = ['no-translate', 'language-selector', 'theme-toggle', 'menu-toggle', 'logo'];
        for (const cls of ignoreClasses) {
            if (element.classList.contains(cls)) return true;
        }
    }

    for (const selector of EXCLUDE_SELECTORS) {
        if (element.closest && element.closest(selector)) {
            return true;
        }
    }

    return false;
}

function decodeHtmlEntities(text) {
    if (!text) return text;

    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
}

async function translateTexts(texts, targetLang) {
    if (!texts || !texts.length) return new Map();

    try {
        const uniqueTexts = [...new Set(texts.filter(text => text && text.trim()))];
        if (uniqueTexts.length === 0) return new Map();

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

        if (textsToTranslate.length === 0) {
            return cachedResults;
        }

        const MAX_CHARS = 28000;
        let currentBatch = [];
        let currentLength = 0;
        const batches = [];

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
                        model: 'nmt'
                    })
                });

                if (!response.ok) {
                    throw new Error(`Erro na API: ${response.status}`);
                }

                const data = await response.json();
                const translatedTexts = data.data?.translations?.map(t => decodeHtmlEntities(t.translatedText)) || [];

                batch.forEach((text, index) => {
                    if (translatedTexts[index]) {
                        saveToCache(text, translatedTexts[index], targetLang);
                    }
                });

                allTranslatedTexts = allTranslatedTexts.concat(translatedTexts);
            } catch (error) {
                allTranslatedTexts = allTranslatedTexts.concat(batch);
            }
        }

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

function shouldSkipElement(element) {
    try {
        if (element.nodeType === Node.TEXT_NODE) {
            return !element.textContent || !element.textContent.trim();
        }

        if (element.nodeType !== Node.ELEMENT_NODE) {
            return true;
        }

        try {
            if ((element.matches && element.matches(EXCLUDE_SELECTORS)) ||
                (element.closest && element.closest(EXCLUDE_SELECTORS))) {
                return true;
            }
        } catch (e) {
            return true;
        }

        const tagName = element.tagName?.toUpperCase();
        if (tagName && ['INPUT', 'TEXTAREA', 'SELECT', 'OPTION', 'SCRIPT', 'STYLE', 'TEMPLATE', 'CODE', 'PRE'].includes(tagName)) {
            return true;
        }

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
        return true;
    }
}

async function translateElement(element, targetLang) {
    if (!element || !element.nodeType) {
        return;
    }

    try {
        if (shouldSkipElement(element)) {
            return;
        }

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

        if (element.nodeType === Node.TEXT_NODE) {
            try {
                const text = element.textContent?.trim();
                if (text && text.length > 1) {
                    const translatedText = await translateText(text, targetLang);
                    if (translatedText && translatedText !== text) {
                        element.textContent = translatedText;
                    }
                }
                return;
            } catch (textError) {
                return;
            }
        }

        if (element.childNodes && element.childNodes.length > 0) {
            try {
                const children = Array.from(element.childNodes);

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

async function translatePage(targetLang) {
    showLoadingModal(true);
    updateProgress(0, 'Preparando para traduzir...');

    try {
        const startTime = performance.now();
        const translatableElements = [
            ...document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, a, li, td, th, label, figcaption, blockquote, cite, button, [data-translate]')
        ];

        const textsToTranslate = [];
        const elementTextMap = new Map();

        updateProgress(5, 'Analisando conteúdo da página...');
        let elementsProcessed = 0;
        const totalElements = translatableElements.length;
        const updateInterval = Math.ceil(totalElements / 10);

        for (let i = 0; i < translatableElements.length; i++) {
            const element = translatableElements[i];
            if (shouldSkipElement(element)) continue;

            const text = element.textContent?.trim();
            if (!text || text.length <= 1) continue;

            if (!elementTextMap.has(text)) {
                elementTextMap.set(text, []);
                textsToTranslate.push(text);
            }
            elementTextMap.get(text).push(element);

            elementsProcessed++;
            if (elementsProcessed % updateInterval === 0 || i === totalElements - 1) {
                const progress = 5 + Math.floor((i / totalElements) * 15);
                updateProgress(progress, `Processando elementos: ${i + 1}/${totalElements}`);
            }
        }

        updateProgress(20, 'Preparando para traduzir...');

        const totalDelayTime = 5000;
        const delaySteps = 3;
        const delayTime = totalDelayTime / delaySteps;

        for (let i = 0; i < delaySteps; i++) {
            const progress = 20 + (i * 10);
            updateProgress(progress, `Traduzindo... (${i + 1}/${delaySteps})`);
            await new Promise(resolve => setTimeout(resolve, delayTime));
        }

        updateProgress(70, 'Processando tradução...');
        const translationMap = await translateTexts(textsToTranslate, targetLang);

        await new Promise(resolve => setTimeout(resolve, 500));
        updateProgress(80, 'Aplicando traduções...');

        const totalToProcess = [...elementTextMap.entries()].reduce((sum, [_, elements]) => sum + elements.length, 0);
        let translationsApplied = 0;
        const updateStep = Math.ceil(totalToProcess / 10);

        for (const [originalText, elements] of elementTextMap.entries()) {
            const translatedText = translationMap.get(originalText) || originalText;

            for (const element of elements) {
                try {
                    if (element.textContent.trim() === originalText) {
                        element.textContent = translatedText;
                    }

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

                translationsApplied++;
                if (translationsApplied % updateStep === 0 || translationsApplied === totalToProcess) {
                    const progress = 80 + Math.floor((translationsApplied / totalToProcess) * 15);
                    updateProgress(progress, `Atualizando elementos: ${translationsApplied}/${totalToProcess}`);
                    if (translationsApplied < totalToProcess) {
                        await new Promise(resolve => setTimeout(resolve, 30));
                    }
                }
            }
        }

        document.documentElement.lang = targetLang;
        localStorage.setItem('preferredLanguage', targetLang);

        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { lang: targetLang }
        }));

        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.value = targetLang;
        }

        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);
        showToast(`Tradução concluída!`, 'success');

    } catch (error) {
        showToast('Erro ao traduzir a página. Recarregando a página...', 'error');
        setTimeout(() => window.location.reload(), 2000);
    } finally {
        setTimeout(() => {
            updateProgress(100, 'Tradução concluída!');
            setTimeout(() => showLoadingModal(false), 500);
        }, 300);
    }
}

function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast show ${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);

    if (duration > 0) {
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    return toast;
}

function loadLanguage() {
    const savedLang = localStorage.getItem('preferredLanguage') || 'pt';
    document.getElementById('language-select').value = savedLang;
    updateTexts(savedLang);
    return savedLang;
}

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

document.addEventListener('DOMContentLoaded', async () => {
    createLoadingModal();
    const languageSelect = document.getElementById('language-select');

    const savedLang = localStorage.getItem('preferredLanguage') || 'pt';
    if (languageSelect) {
        languageSelect.value = savedLang;

        if (savedLang !== 'pt') {
            await translatePage(savedLang);
        }
    }

    if (languageSelect) {
        languageSelect.addEventListener('change', async (e) => {
            const newLang = e.target.value;
            if (newLang === 'pt') {
                localStorage.removeItem('preferredLanguage');
                window.location.reload();
            } else {
                await translatePage(newLang);
            }
        });
    }
});
