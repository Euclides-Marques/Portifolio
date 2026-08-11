const SUPPORTED_LANGUAGES = ['pt', 'en', 'es'];
const DEFAULT_LANGUAGE = 'pt';

const LOCALE_FILES = {
    pt: 'locales/pt-BR.json',
    en: 'locales/en-US.json',
    es: 'locales/es-ES.json'
};

const HTML_LANG_TAGS = {
    pt: 'pt-BR',
    en: 'en-US',
    es: 'es-ES'
};

const translationsCache = {};

async function loadTranslations(lang) {
    if (translationsCache[lang]) {
        return translationsCache[lang];
    }

    const response = await fetch(LOCALE_FILES[lang]);
    if (!response.ok) {
        throw new Error(`Não foi possível carregar as traduções para "${lang}" (${response.status})`);
    }

    const translations = await response.json();
    translationsCache[lang] = translations;
    return translations;
}

function getTranslation(translations, key) {
    return key.split('.').reduce((value, part) => {
        return (value && typeof value === 'object') ? value[part] : undefined;
    }, translations);
}

window.t = function (key, fallback = '') {
    const value = getTranslation(window.i18n || {}, key);
    return typeof value === 'string' ? value : fallback;
};

function applyTranslations(translations) {
    document.querySelectorAll('[data-translate]').forEach(element => {
        const value = getTranslation(translations, element.getAttribute('data-translate'));
        if (typeof value === 'string') {
            element.textContent = value;
        }
    });

    document.querySelectorAll('[data-translate-placeholder]').forEach(element => {
        const value = getTranslation(translations, element.getAttribute('data-translate-placeholder'));
        if (typeof value === 'string') {
            element.setAttribute('placeholder', value);
        }
    });
}

async function setLanguage(lang) {
    const targetLang = SUPPORTED_LANGUAGES.includes(lang) ? lang : DEFAULT_LANGUAGE;

    let translations;
    try {
        translations = await loadTranslations(targetLang);
    } catch (error) {
        if (targetLang !== DEFAULT_LANGUAGE) {
            return setLanguage(DEFAULT_LANGUAGE);
        }
        return;
    }

    applyTranslations(translations);
    window.i18n = translations;

    document.documentElement.lang = HTML_LANG_TAGS[targetLang];
    localStorage.setItem('preferredLanguage', targetLang);

    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = targetLang;
    }

    document.dispatchEvent(new CustomEvent('languageChanged', {
        detail: { lang: targetLang, translations }
    }));
}

document.addEventListener('DOMContentLoaded', () => {
    const languageSelect = document.getElementById('language-select');
    const savedLang = localStorage.getItem('preferredLanguage') || DEFAULT_LANGUAGE;

    setLanguage(savedLang);

    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
});
