const PREFERS_REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const HAS_GSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

if (HAS_GSAP) {
    gsap.registerPlugin(ScrollTrigger);
}

document.addEventListener('DOMContentLoaded', () => {
    // O loader vem primeiro: uma falha em outra inicialização nunca deve deixar a página bloqueada.
    initLoader();

    [
        initThemeToggle,
        initSmoothScroll,
        initMobileMenu,
        initHeaderState,
        initSplitText,
        initReveal,
        initParallax,
        initMarquee,
        initStackCarousel,
        initTilt,
        initFooterCopyright,
        initExperienceYears
    ].forEach(init => {
        try {
            init();
        } catch (error) {
            console.error(`Falha ao inicializar ${init.name}:`, error);
        }
    });
});

/* ---------- Loader ---------- */
function initLoader() {
    const loader = document.querySelector('.loader');
    const finish = () => {
        document.body.classList.remove('is-loading');
        document.dispatchEvent(new CustomEvent('loader:done'));
        if (HAS_GSAP) ScrollTrigger.refresh();
    };

    if (!loader) {
        finish();
        return;
    }

    const fill = loader.querySelector('.loader-fill');
    const count = loader.querySelector('.loader-count');
    const minDuration = PREFERS_REDUCED_MOTION ? 0 : 1100;
    const start = performance.now();
    let pageLoaded = document.readyState === 'complete';
    let done = false;

    window.addEventListener('load', () => { pageLoaded = true; });
    setTimeout(() => { pageLoaded = true; }, 3000);

    function tick(now) {
        const elapsed = now - start;
        let progress = minDuration ? Math.min(elapsed / minDuration, 1) : 1;
        if (!pageLoaded) progress = Math.min(progress, 0.9);

        fill.style.setProperty('--fill', progress.toFixed(3));
        count.textContent = `${Math.round(progress * 100)}%`;

        if (progress >= 1 && !done) {
            done = true;
            setTimeout(() => {
                loader.classList.add('is-done');
                finish();
            }, PREFERS_REDUCED_MOTION ? 0 : 200);
            return;
        }
        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
}

/* ---------- Tema (escuro por padrão) ---------- */
function initThemeToggle() {
    const themeToggle = document.querySelector('.theme-toggle');
    const metaTheme = document.querySelector('meta[name="theme-color"]');

    function readTheme() {
        try {
            return localStorage.getItem('theme') === 'light' ? 'light' : 'dark';
        } catch (e) {
            return 'dark';
        }
    }

    function applyTheme(theme) {
        document.body.classList.toggle('light-theme', theme === 'light');
        document.documentElement.classList.remove('pre-light');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        }
        if (metaTheme) metaTheme.setAttribute('content', theme === 'light' ? '#f6f5fb' : '#0a0a0f');
    }

    applyTheme(readTheme());

    if (!themeToggle) return;
    themeToggle.addEventListener('click', () => {
        const next = document.body.classList.contains('light-theme') ? 'dark' : 'light';
        try {
            localStorage.setItem('theme', next);
        } catch (e) { /* armazenamento indisponível */ }
        applyTheme(next);
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: next } }));
    });
}

/* ---------- Scroll suave (Lenis) ---------- */
function initSmoothScroll() {
    if (typeof window.Lenis !== 'undefined' && !PREFERS_REDUCED_MOTION) {
        const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
        window.lenis = lenis;

        if (HAS_GSAP) {
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => lenis.raf(time * 1000));
            gsap.ticker.lagSmoothing(0);
        } else {
            const raf = (time) => {
                lenis.raf(time);
                requestAnimationFrame(raf);
            };
            requestAnimationFrame(raf);
        }
    }

    document.addEventListener('click', (e) => {
        const anchor = e.target.closest('a[href^="#"]');
        if (!anchor) return;

        const targetId = anchor.getAttribute('href');
        if (targetId === '#') {
            e.preventDefault();
            return;
        }

        const target = targetId === '#top' ? 0 : document.querySelector(targetId);
        if (target === null) return;

        e.preventDefault();
        const headerOffset = document.querySelector('.navbar')?.offsetHeight || 70;

        if (window.lenis) {
            window.lenis.scrollTo(target, { offset: target === 0 ? 0 : -headerOffset + 1, duration: 1.4 });
        } else {
            const top = target === 0 ? 0 : target.getBoundingClientRect().top + window.scrollY - headerOffset;
            window.scrollTo({ top, behavior: PREFERS_REDUCED_MOTION ? 'auto' : 'smooth' });
        }

        if (targetId === '#main-content') {
            document.getElementById('main-content')?.focus?.();
        }
    });
}

/* ---------- Menu em tela cheia ---------- */
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (!menuToggle || !navLinks) return;

    function setOpen(open) {
        menuToggle.classList.toggle('active', open);
        navLinks.classList.toggle('active', open);
        document.body.classList.toggle('menu-open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        if (window.lenis) {
            open ? window.lenis.stop() : window.lenis.start();
        }
    }

    menuToggle.addEventListener('click', () => setOpen(!navLinks.classList.contains('active')));

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => setOpen(false));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            setOpen(false);
            menuToggle.focus();
        }
    });
}

function initHeaderState() {
    const header = document.querySelector('.header');
    if (!header) return;

    const update = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
    update();
    window.addEventListener('scroll', update, { passive: true });
}

/* ---------- Texto revelado palavra por palavra ---------- */
const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value) => value.replace(/[&<>"']/g, char => HTML_ESCAPES[char]);

function splitElement(element) {
    const text = element.textContent.trim().replace(/\s+/g, ' ');
    element.setAttribute('aria-label', text);
    element.innerHTML = text
        .split(' ')
        .map((word, i) => `<span class="split-w" aria-hidden="true"><span class="split-i" style="--i:${i}">${escapeHtml(word)}</span></span>`)
        .join(' ');
}

function initSplitText() {
    const elements = document.querySelectorAll('[data-split]');
    elements.forEach(splitElement);

    // A tradução troca o textContent; dividimos de novo mantendo o estado revelado.
    document.addEventListener('languageChanged', () => {
        elements.forEach(splitElement);
    });
}

function initReveal() {
    const targets = document.querySelectorAll('[data-reveal], [data-split]');

    document.querySelectorAll('[data-reveal]').forEach(element => {
        const siblings = Array.from(element.parentElement.children).filter(el => el.hasAttribute('data-reveal'));
        const index = siblings.indexOf(element);
        if (index > 0) element.style.setProperty('--d', `${Math.min(index * 0.08, 0.6)}s`);
    });

    if (!('IntersectionObserver' in window) || PREFERS_REDUCED_MOTION) {
        targets.forEach(el => el.classList.add('is-in'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    targets.forEach(el => observer.observe(el));
}

/* ---------- Parallax e efeitos ligados ao scroll ---------- */
function initParallax() {
    if (!HAS_GSAP || PREFERS_REDUCED_MOTION) {
        document.querySelectorAll('.timeline-fill').forEach(el => { el.style.transform = 'scaleY(1)'; });
        return;
    }

    gsap.utils.toArray('.ghost-word').forEach(word => {
        gsap.fromTo(word, { xPercent: 8 }, {
            xPercent: -28,
            ease: 'none',
            scrollTrigger: { trigger: word.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
        });
    });

    const aboutImg = document.querySelector('.arch img');
    if (aboutImg) {
        gsap.fromTo(aboutImg, { yPercent: -8 }, {
            yPercent: 0,
            ease: 'none',
            scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true }
        });
    }

    const timelineFill = document.querySelector('.timeline-fill');
    if (timelineFill) {
        gsap.to(timelineFill, {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: { trigger: '.education-container', start: 'top 70%', end: 'bottom 60%', scrub: true }
        });
    }

    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
}

/* ---------- Faixa de tecnologias em loop ---------- */
function initMarquee() {
    const track = document.querySelector('.marquee-track');
    const row = track?.querySelector('.marquee-row');
    if (!row) return;

    const clone = row.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
}

/* ---------- Carrossel de módulos (habilidades) ---------- */
function initStackCarousel() {
    const section = document.querySelector('.stack');
    if (!section) return;

    const cardsWrap = section.querySelector('.stack-cards');
    const cards = Array.from(section.querySelectorAll('.stack-card'));
    const dotsWrap = section.querySelector('.stack-dots');
    const prev = section.querySelector('.stack-prev');
    const next = section.querySelector('.stack-next');
    const total = cards.length;
    const isCompact = () => window.matchMedia('(max-width: 960px)').matches;
    let active = 0;
    let timer = null;

    const dots = cards.map((card, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', card.querySelector('.stack-cat')?.textContent || `${i + 1}`);
        dot.addEventListener('click', () => {
            goTo(i);
            restart();
        });
        dotsWrap.appendChild(dot);
        return dot;
    });

    // Abaixo de 1100px (e acima do modo carrossel por scroll) os cards 2 e 3 ficam invisíveis.
    const isHiddenSlot = (pos) => !isCompact() && window.matchMedia('(max-width: 1100px)').matches && pos >= 2;
    let sectionVisible = true;

    function render() {
        cards.forEach((card, i) => {
            const pos = (i - active + total) % total;
            card.dataset.pos = String(pos);
            card.toggleAttribute('inert', isHiddenSlot(pos));
        });
        dots.forEach((dot, i) => dot.setAttribute('aria-selected', String(i === active)));
    }

    function goTo(index) {
        active = (index + total) % total;
        render();
        if (isCompact()) {
            const card = cards[active];
            cardsWrap.scrollTo({ left: card.offsetLeft - (cardsWrap.clientWidth - card.offsetWidth) / 2, behavior: 'smooth' });
        }
    }

    function restart() {
        clearInterval(timer);
        if (PREFERS_REDUCED_MOTION) return;
        timer = setInterval(() => {
            if (sectionVisible && !isCompact()) goTo(active + 1);
        }, 4500);
    }

    prev?.addEventListener('click', () => { goTo(active - 1); restart(); });
    next?.addEventListener('click', () => { goTo(active + 1); restart(); });
    section.addEventListener('mouseenter', () => clearInterval(timer));
    section.addEventListener('mouseleave', restart);
    section.addEventListener('focusin', () => clearInterval(timer));

    // No mobile o carrossel é por scroll-snap; mantemos os pontos sincronizados.
    cardsWrap.addEventListener('scroll', () => {
        if (!isCompact()) return;
        const center = cardsWrap.scrollLeft + cardsWrap.clientWidth / 2;
        let closest = 0;
        cards.forEach((card, i) => {
            const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
            const best = Math.abs(cards[closest].offsetLeft + cards[closest].offsetWidth / 2 - center);
            if (d < best) closest = i;
        });
        if (closest !== active) {
            active = closest;
            dots.forEach((dot, i) => dot.setAttribute('aria-selected', String(i === active)));
        }
    }, { passive: true });

    document.addEventListener('languageChanged', () => {
        dots.forEach((dot, i) => dot.setAttribute('aria-label', cards[i].querySelector('.stack-cat')?.textContent || `${i + 1}`));
    });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => { sectionVisible = entry.isIntersecting; }).observe(section);
    }
    window.addEventListener('resize', render);

    render();
    restart();
}

/* ---------- Inclinação 3D nos cards em destaque ---------- */
function initTilt() {
    if (PREFERS_REDUCED_MOTION || !window.matchMedia('(hover: hover)').matches) return;

    document.querySelectorAll('[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            // Só inclina depois da animação de entrada, para não encurtar a transição dela.
            if (!card.classList.contains('is-in')) return;
            card.classList.add('is-tilting');
            const rect = card.getBoundingClientRect();
            const px = (e.clientX - rect.left) / rect.width;
            const py = (e.clientY - rect.top) / rect.height;
            card.style.setProperty('--ry', `${(px - 0.5) * 8}deg`);
            card.style.setProperty('--rx', `${(0.5 - py) * 8}deg`);
            card.style.setProperty('--mx', `${px * 100}%`);
            card.style.setProperty('--my', `${py * 100}%`);
        });
        card.addEventListener('mouseleave', () => {
            card.style.setProperty('--rx', '0deg');
            card.style.setProperty('--ry', '0deg');
        });
    });
}

/* ---------- Textos dinâmicos ---------- */
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
