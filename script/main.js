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

    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.fadeInUp');

        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (elementTop < windowHeight - 100) {
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }
        });
    };

    document.querySelectorAll('section').forEach(section => {
        const elements = section.querySelectorAll('h2, .about-content, .skills-grid, .project-card, .education-item, .course-card, .contact-container');
        elements.forEach((element, index) => {
            element.classList.add('fadeInUp');
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`;
        });
    });

    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);

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

    class StatisticsManager {
        constructor() {
            this.startDate = new Date('2019-01-01');
            this.workHoursPerDay = {
                weekday: 8,
                saturday: 5
            };
            this.init();
        }

        init() {
            this.updateAllStatistics();
            this.setupAutoUpdate();
            this.setupIntersectionObserver();
            this.setupProjectsLoadedListener();
        }

        countProjects() {
            const projectsGrid = document.querySelector('.projects-grid');
            if (!projectsGrid) return 0;

            const projectCards = projectsGrid.querySelectorAll('.project-card');
            if (projectCards.length === 0) {
                const hasError = projectsGrid.querySelector('.error-message');
                const hasLoading = projectsGrid.querySelector('.loading-spinner');

                if (hasError || hasLoading) {
                    return 0;
                }
            }

            if (window.totalGitHubProjects !== undefined) {
                return window.totalGitHubProjects;
            }

            return projectCards.length;
        }

        countCertifications() {
            const coursesGrid = document.querySelector('.courses-grid');
            if (!coursesGrid) return 0;

            const courseCards = coursesGrid.querySelectorAll('.course-card');
            return courseCards.length;
        }

        calculateYearsOfExperience() {
            const now = new Date();
            const yearsDiff = now.getFullYear() - this.startDate.getFullYear();
            const monthDiff = now.getMonth() - this.startDate.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < this.startDate.getDate())) {
                return yearsDiff - 1;
            }
            return yearsDiff;
        }

        calculateCodingHours() {
            const now = new Date();
            const startDate = new Date(this.startDate);

            let totalHours = 0;
            let currentDate = new Date(startDate);

            while (currentDate <= now) {
                const dayOfWeek = currentDate.getDay();

                if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                    totalHours += this.workHoursPerDay.weekday;
                } else if (dayOfWeek === 6) {
                    totalHours += this.workHoursPerDay.saturday;
                }

                currentDate.setDate(currentDate.getDate() + 1);
            }

            return totalHours;
        }

        animateCounter(element, targetValue, duration = 2000) {
            const startValue = 0;
            const startTime = performance.now();
            const isLargeNumber = targetValue > 10000;

            const updateCounter = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                const currentValue = Math.floor(startValue + (targetValue - startValue) * easeOutQuart);

                if (isLargeNumber) {
                    element.textContent = currentValue.toLocaleString('pt-BR');
                } else {
                    element.textContent = currentValue.toString();
                }

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    element.textContent = targetValue.toLocaleString('pt-BR');
                }
            };

            element.classList.add('counting');
            requestAnimationFrame(updateCounter);

            setTimeout(() => {
                element.classList.remove('counting');
            }, duration);
        }

        updateAllStatistics() {
            const projectsElement = document.getElementById('total-projetos');
            const certificationsElement = document.getElementById('total-certificados');
            const hoursElement = document.getElementById('total-horas');
            const yearsElement = document.getElementById('total-anos');

            if (projectsElement) {
                const projectCount = this.countProjects();
                this.animateCounter(projectsElement, projectCount, 1500);
            }

            if (certificationsElement) {
                const certificationCount = this.countCertifications();
                this.animateCounter(certificationsElement, certificationCount, 1800);
            }

            if (hoursElement) {
                const codingHours = this.calculateCodingHours();
                this.animateCounter(hoursElement, codingHours, 2500);
            }

            if (yearsElement) {
                const yearsExperience = this.calculateYearsOfExperience();
                this.animateCounter(yearsElement, yearsExperience, 1200);
            }
        }

        setupAutoUpdate() {
            const projectsGrid = document.querySelector('.projects-grid');
            if (projectsGrid) {
                const projectObserver = new MutationObserver(() => {
                    const projectsElement = document.getElementById('total-projetos');
                    if (projectsElement) {
                        const newCount = this.countProjects();
                        this.animateCounter(projectsElement, newCount, 800);
                    }
                });

                projectObserver.observe(projectsGrid, {
                    childList: true,
                    subtree: true
                });
            }

            const coursesGrid = document.querySelector('.courses-grid');
            if (coursesGrid) {
                const courseObserver = new MutationObserver(() => {
                    const certificationsElement = document.getElementById('total-certificados');
                    if (certificationsElement) {
                        const newCount = this.countCertifications();
                        this.animateCounter(certificationsElement, newCount, 800);
                    }
                });

                courseObserver.observe(coursesGrid, {
                    childList: true,
                    subtree: true
                });
            }
        }

        setupIntersectionObserver() {
            const statisticsSection = document.getElementById('estatisticas');
            if (!statisticsSection) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.updateAllStatistics();
                        observer.unobserve(entry.target);
                    }
                });
            }, {
                threshold: 0.3
            });

            observer.observe(statisticsSection);
        }

        setupProjectsLoadedListener() {
            window.addEventListener('projectsLoaded', (event) => {
                const projectsElement = document.getElementById('total-projetos');
                if (projectsElement && event.detail && event.detail.totalProjects !== undefined) {
                    this.animateCounter(projectsElement, event.detail.totalProjects, 1500);
                }
            });
        }

        refresh() {
            this.updateAllStatistics();
        }
    }

    const statsManager = new StatisticsManager();
    window.updateStatistics = () => {
        statsManager.refresh();
    };

    window.addEventListener('load', () => {
        setTimeout(() => {
            statsManager.refresh();
        }, 500);
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const year = new Date().getFullYear();
    const yearElement = document.querySelector('.footer-bottom p');
    if (yearElement) {
        yearElement.textContent = `© ${year} Euclides Marques. Todos os direitos reservados.`;
    }
});
