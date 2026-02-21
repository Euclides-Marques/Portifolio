document.addEventListener('DOMContentLoaded', function () {
    const themeToggle = document.querySelector('.theme-toggle');
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const backToTop = document.querySelector('.back-to-top');

    const typingText = document.getElementById('typing-text');
    let text = "Olá, eu sou Euclides Marques";
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    let typeWriterTimeout;

    const welcomeTexts = {
        'pt': 'Olá, eu sou Euclides Marques',
        'en': 'Hello, I am Euclides Marques',
        'es': 'Hola, soy Euclides Marques',
        'fr': 'Bonjour, je suis Euclides Marques'
    };

    function updateWelcomeText(lang = 'pt') {
        if (typeWriterTimeout) {
            clearTimeout(typeWriterTimeout);
            typeWriterTimeout = null;
        }

        text = welcomeTexts[lang] || welcomeTexts['pt'];

        charIndex = 0;
        isDeleting = false;

        if (typingText) {
            typeWriter();
        }
    }

    function typeWriter() {
        const currentText = text.substring(0, charIndex);
        typingText.innerHTML = currentText;

        if (!isDeleting && charIndex < text.length) {
            charIndex++;
            typeWriterTimeout = setTimeout(typeWriter, typingSpeed);
        } else if (isDeleting && charIndex > 0) {
            charIndex--;
            setTimeout(typeWriter, typingSpeed / 2);
        } else {
            isDeleting = !isDeleting;
            typeWriterTimeout = setTimeout(typeWriter, isDeleting ? 2000 : 500);
        }
    }

    typeWriterTimeout = setTimeout(typeWriter, 1000);

    document.addEventListener('languageChanged', (event) => {
        if (event.detail && event.detail.lang) {
            updateWelcomeText(event.detail.lang);
        }
    });

    const savedLang = localStorage.getItem('preferredLanguage') || 'pt';
    if (savedLang !== 'pt') {
        updateWelcomeText(savedLang);
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeIcon(isDark ? 'dark' : 'light');
    });

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    function scrollToTop(duration) {
        const start = window.pageYOffset;
        const startTime = performance.now();

        function scrollStep(timestamp) {
            const currentTime = timestamp - startTime;
            const progress = Math.min(currentTime / duration, 1);

            window.scrollTo(0, start * (1 - easeInOutCubic(progress)));

            if (currentTime < duration) {
                window.requestAnimationFrame(scrollStep);
            }
        }

        function easeInOutCubic(t) {
            return t < 0.5
                ? 4 * t * t * t
                : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        }

        window.requestAnimationFrame(scrollStep);
    }

    window.addEventListener('scroll', () => {
        const scrollPosition = window.scrollY + window.innerHeight;
        const pageHeight = document.documentElement.scrollHeight - 100;

        if (scrollPosition >= pageHeight) {
            backToTop.classList.add('active');
        } else {
            backToTop.classList.remove('active');
        }
    });

    backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const scrollDuration = isMobile ? 100 : 5000;
        scrollToTop(scrollDuration);
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    document.querySelectorAll('section').forEach(section => {
        const elements = section.querySelectorAll('h2, .about-content, .skills-grid, .project-card, .education-item, .course-card, .contact-container');
        elements.forEach((element, index) => {
            element.classList.add('fadeInUp');
            element.style.transition = `opacity 0.4s ease-out ${index * 0.08}s, transform 0.4s ease-out ${index * 0.08}s`;
        });
    });

    const fadeElements = document.querySelectorAll('.fadeInUp');

    if ('IntersectionObserver' in window) {
        const fadeObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.2
        });

        fadeElements.forEach(el => fadeObserver.observe(el));
    } else {
        const animateOnScrollFallback = () => {
            fadeElements.forEach(element => {
                const elementTop = element.getBoundingClientRect().top;
                const windowHeight = window.innerHeight;

                if (elementTop < windowHeight - 100) {
                    element.classList.add('is-visible');
                }
            });
        };

        window.addEventListener('load', animateOnScrollFallback);
        window.addEventListener('scroll', animateOnScrollFallback);
    }

    const filterButtons = document.querySelectorAll('.filter-btn');
    const skillLinks = document.querySelectorAll('.skill-link');

    function filterSkills(category) {
        skillLinks.forEach(skillLink => {
            const skillCategory = skillLink.getAttribute('data-category');

            if (category === 'all' || skillCategory === category) {
                skillLink.classList.add('visible');
                skillLink.classList.remove('hidden');
            } else {
                skillLink.classList.remove('visible');
                skillLink.classList.add('hidden');
            }
        });
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));

            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');
            filterSkills(filterValue);
        });
    });

    filterSkills('all');

    function calcularAnosExperiencia() {
        const anoInicio = 2019;
        const anoFim = 2025;
        const anoAtual = new Date().getFullYear();

        let anos = anoAtual - anoInicio + 1;

        if (anoAtual > anoFim) {
            anos = anoFim - anoInicio + 1;
        }

        return anos;
    }

    function contarCertificacoes() {
        const courseCards = document.querySelectorAll('.course-card');
        return courseCards.length;
    }

    function contarProjetos() {
        if (Array.isArray(window.allRepos)) {
            return window.allRepos.length;
        }
        return 0;
    }

    function aguardarProjetosCarregados(timeoutMs = 5000, intervalMs = 200) {
        return new Promise(resolve => {
            const start = performance.now();

            function check() {
                if (Array.isArray(window.allRepos) && window.allRepos.length > 0) {
                    resolve(window.allRepos.length);
                    return;
                }

                if (performance.now() - start >= timeoutMs) {
                    resolve(0);
                    return;
                }

                setTimeout(check, intervalMs);
            }

            check();
        });
    }

    async function atualizarContadorProjetos() {
        const totalProjetos = await aguardarProjetosCarregados();
        if (totalProjetos > 0) {
            animateCounter('total-projetos', totalProjetos);
        }
    }

    function animateCounter(elementId, targetValue, duration = 2500) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startValue = 0;
        const startTime = performance.now();

        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);

            element.textContent = currentValue;

            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = targetValue;
            }
        }

        requestAnimationFrame(updateCounter);
    }

    const anosExperiencia = calcularAnosExperiencia();
    const totalCertificacoes = contarCertificacoes();

    function resetarEstatisticas() {
        const anosElement = document.getElementById('total-anos');
        const certsElement = document.getElementById('total-certificados');
        const projElement = document.getElementById('total-projetos');

        if (anosElement) anosElement.textContent = '0';
        if (certsElement) certsElement.textContent = '0';
        if (projElement) projElement.textContent = '0';
    }

    async function iniciarAnimacaoEstatisticas() {
        const totalProjetos = await aguardarProjetosCarregados();

        animateCounter('total-anos', anosExperiencia);
        animateCounter('total-certificados', totalCertificacoes);

        if (totalProjetos > 0) {
            animateCounter('total-projetos', totalProjetos);
        }
    }

    let statsJaAnimadas = false;
    const statsSection = document.getElementById('estatisticas');

    if (statsSection && 'IntersectionObserver' in window) {
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !statsJaAnimadas) {
                    resetarEstatisticas();
                    iniciarAnimacaoEstatisticas();
                    statsJaAnimadas = true;
                    statsObserver.unobserve(statsSection);
                }
            });
        }, {
            threshold: 0.3
        });

        statsObserver.observe(statsSection);
    } else {
        resetarEstatisticas();
        iniciarAnimacaoEstatisticas();
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const year = new Date().getFullYear();
    const yearElement = document.querySelector('.footer-bottom p');
    if (yearElement) {
        yearElement.textContent = `© ${year} Euclides Marques. Todos os direitos reservados.`;
    }
});
