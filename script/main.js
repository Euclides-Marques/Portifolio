document.addEventListener('DOMContentLoaded', () => {
    initHeroTyping();
    initThemeToggle();
    initMobileMenu();
    initSmoothScroll();
    initScrollRevealAnimation();
    initSkillsFilter();
    initFooterCopyright();
    initExperienceYears();
});

function initExperienceYears() {
    const yearsLede = document.getElementById('experience-years-lede');
    if (!yearsLede) return;

    const experienceStart = new Date(2024, 6, 1);

    function calcularAnosDesenvolvimento() {
        const hoje = new Date();
        let anos = hoje.getFullYear() - experienceStart.getFullYear();
        const diffMeses = hoje.getMonth() - experienceStart.getMonth();
        if (diffMeses < 0 || (diffMeses === 0 && hoje.getDate() < experienceStart.getDate())) {
            anos--;
        }
        return Math.max(anos, 0);
    }

    function updateYearsLede(translations) {
        const template = translations?.experience?.yearsLede || '{years}+ anos de experiência em desenvolvimento .NET';
        yearsLede.textContent = template.replace('{years}', calcularAnosDesenvolvimento());
    }

    document.addEventListener('languageChanged', (event) => {
        if (event.detail?.translations) {
            updateYearsLede(event.detail.translations);
        }
    });
}

function initHeroTyping() {
    const typingText = document.getElementById('typing-text');
    if (!typingText) return;

    let text = "Olá, eu sou Euclides Marques";
    let charIndex = 0;
    let isDeleting = false;
    const typingSpeed = 100;
    let typeWriterTimeout;

    function typeWriter() {
        typingText.innerHTML = text.substring(0, charIndex);

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

    function updateWelcomeText(translations) {
        clearTimeout(typeWriterTimeout);
        text = translations?.hero?.greeting || text;
        charIndex = 0;
        isDeleting = false;
        typeWriter();
    }

    typeWriterTimeout = setTimeout(typeWriter, 1000);

    document.addEventListener('languageChanged', (event) => {
        if (event.detail?.translations) {
            updateWelcomeText(event.detail.translations);
        }
    });
}

function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    if (!themeToggle) return;

    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
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
}

function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (!menuToggle || !navLinks) return;

    menuToggle.addEventListener('click', () => {
        const isActive = menuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
        menuToggle.setAttribute('aria-expanded', isActive);
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
            menuToggle.setAttribute('aria-expanded', 'false');
        });
    });
}

function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (!targetElement) return;

            const headerOffset = 80;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        });
    });
}

function initScrollRevealAnimation() {
    document.querySelectorAll('section').forEach(section => {
        const elements = section.querySelectorAll('h2, .about-content, .experience-card, .featured-project-card, .skills-grid, .project-row, .education-item, .course-card, .contact-container');
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
        }, { threshold: 0.2 });

        fadeElements.forEach(el => fadeObserver.observe(el));
    } else {
        const revealVisibleElements = () => {
            fadeElements.forEach(element => {
                const elementTop = element.getBoundingClientRect().top;
                if (elementTop < window.innerHeight - 100) {
                    element.classList.add('is-visible');
                }
            });
        };

        window.addEventListener('load', revealVisibleElements);
        window.addEventListener('scroll', revealVisibleElements);
    }
}

function initSkillsFilter() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const skillLinks = document.querySelectorAll('.skill-link');
    if (!filterButtons.length) return;

    function filterSkills(category) {
        skillLinks.forEach(skillLink => {
            const matches = category === 'all' || skillLink.getAttribute('data-category') === category;
            skillLink.classList.toggle('visible', matches);
            skillLink.classList.toggle('hidden', !matches);
        });
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterSkills(button.getAttribute('data-filter'));
        });
    });

    filterSkills('all');
}

function initFooterCopyright() {
    const year = new Date().getFullYear();
    const yearElement = document.querySelector('.footer-bottom p');
    if (!yearElement) return;

    function updateCopyright(translations) {
        const copyrightText = translations?.footer?.copyright || 'Todos os direitos reservados.';
        yearElement.textContent = `© ${year} Euclides Marques. ${copyrightText}`;
    }

    document.addEventListener('languageChanged', (event) => {
        if (event.detail?.translations) {
            updateCopyright(event.detail.translations);
        }
    });
}
