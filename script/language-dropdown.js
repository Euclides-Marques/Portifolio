(function () {
    const FLAGS = {
        pt: { src: 'https://flagcdn.com/24x18/br.png', srcset: 'https://flagcdn.com/48x36/br.png 2x' },
        en: { src: 'https://flagcdn.com/24x18/us.png', srcset: 'https://flagcdn.com/48x36/us.png 2x' },
        es: { src: 'https://flagcdn.com/24x18/es.png', srcset: 'https://flagcdn.com/48x36/es.png 2x' }
    };

    function init() {
        const toggle = document.getElementById('language-toggle');
        const dropdown = document.getElementById('language-dropdown');
        const select = document.getElementById('language-select');
        if (!toggle || !dropdown || !select) return;

        const flagImg = toggle.querySelector('[data-lang-flag]');
        const label = toggle.querySelector('[data-lang-label]');
        const options = Array.from(dropdown.querySelectorAll('li[role="option"]'));

        function syncToggle(lang) {
            const option = options.find(o => o.dataset.value === lang);
            if (!option) return;
            const flag = FLAGS[lang];
            if (flag) {
                flagImg.src = flag.src;
                flagImg.srcset = flag.srcset;
            }
            label.textContent = option.querySelector('span').textContent;
            options.forEach(o => o.setAttribute('aria-selected', o === option ? 'true' : 'false'));
        }

        function openDropdown() {
            dropdown.hidden = false;
            toggle.setAttribute('aria-expanded', 'true');
        }

        function closeDropdown() {
            dropdown.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
        }

        function selectLanguage(lang) {
            syncToggle(lang);
            if (select.value !== lang) {
                select.value = lang;
                select.dispatchEvent(new Event('change'));
            }
            closeDropdown();
            toggle.focus();
        }

        toggle.addEventListener('click', () => {
            if (dropdown.hidden) {
                openDropdown();
            } else {
                closeDropdown();
            }
        });

        options.forEach(option => {
            option.addEventListener('click', () => selectLanguage(option.dataset.value));
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.hidden && !toggle.contains(e.target) && !dropdown.contains(e.target)) {
                closeDropdown();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !dropdown.hidden) {
                closeDropdown();
                toggle.focus();
            }
        });

        document.addEventListener('languageChanged', (e) => {
            syncToggle(e.detail.lang);
        });

        syncToggle(select.value || 'pt');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
