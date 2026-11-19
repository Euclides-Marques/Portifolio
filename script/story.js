/*
 * Story do hero: CODE → BUILD → DEPLOY → RUN
 * As janelas de código começam em leque, abrem-se em camadas de arquitetura,
 * compactam-se num pacote que é publicado num servidor e terminam no painel RUN.
 */
document.addEventListener('DOMContentLoaded', () => {
    const story = document.querySelector('.story');
    if (!story) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

    if (!hasGsap || reduceMotion) {
        story.classList.add('story--static');
        return;
    }

    const stage = story.querySelector('.story-stage');
    const object = story.querySelector('.story-object');
    const layers = story.querySelector('.layers');
    const wins = gsap.utils.toArray('.story .win'); // presentation, api, domain, data
    const tags = gsap.utils.toArray('.story .win-tag');
    const pkg = story.querySelector('.package');
    const server = story.querySelector('.story-server');
    const flood = story.querySelector('.story-flood');
    const logItems = gsap.utils.toArray('.deploy-log li');
    const progressItems = Array.from(story.querySelectorAll('.story-progress li'));
    const canvas = story.querySelector('.story-stream');
    const ctx = canvas.getContext('2d');
    const dustLayer = story.querySelector('.story-dust');
    const runLog = story.querySelector('.run-log');

    const state = { stream: 0, dust: 1, onFlood: false, visible: true };

    // Pausa os laços de animação quando o hero sai da tela (economia de CPU/bateria).
    new IntersectionObserver(([entry]) => { state.visible = entry.isIntersecting; }).observe(story);
    const scale = () => Math.min(object.offsetWidth / 500, 1);
    const isNarrow = () => window.innerWidth < 760;

    /* Poses de cada etapa (valores em função da largura para funcionar no mobile) */
    const fan = [
        { x: 70, y: -46, z: -140 },  // presentation
        { x: 0, y: 0, z: 0 },        // api (na frente)
        { x: 140, y: -92, z: -280 }, // domain
        { x: 210, y: -138, z: -420 } // data
    ];

    wins.forEach((win, i) => {
        gsap.set(win, {
            x: () => fan[i].x * scale(),
            y: () => fan[i].y * scale(),
            z: () => fan[i].z * scale(),
            rotationY: -22,
            rotationX: 6,
            transformOrigin: '50% 50%'
        });
    });
    // Os valores explícitos de x/y evitam que o GSAP herde o translate do CSS (fallback estático).
    gsap.set(['.sw-build', '.sw-deploy'], { x: 0, y: 0, xPercent: -50, yPercent: -50 });
    gsap.set(pkg, { x: 0, y: 0, xPercent: -50, yPercent: -50, scale: 0.6 });
    gsap.set(server, { autoAlpha: 0, y: () => window.innerHeight * 0.5 });
    gsap.set(flood, { y: 0, yPercent: 101 });

    /* ---------- Timeline principal (scrub) ---------- */
    const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: {
            trigger: story,
            start: 'top top',
            end: () => `+=${window.innerHeight * 4.2}`,
            pin: true,
            scrub: 1,
            refreshPriority: 1, // o pin precisa ser calculado antes dos gatilhos das seções abaixo
            invalidateOnRefresh: true,
            onUpdate: (self) => updateProgress(self.progress)
        }
    });

    // 1 → 2: BUILD — o leque vira camadas isométricas
    tl.addLabel('build', 0.4)
        .to('.scroll-cue', { autoAlpha: 0, duration: 0.3 }, 0)
        .to('.sw-code', { xPercent: -130, duration: 1.4 }, 'build')
        .to('.sw-net', { xPercent: 130, duration: 1.4 }, 'build')
        .to('.frame-1', { autoAlpha: 0, y: -40, duration: 0.8 }, 'build')
        .to(state, { dust: 0, duration: 0.6 }, 'build')
        .fromTo('.sw-build', { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 1.2 }, 'build+=0.3');

    wins.forEach((win, i) => {
        tl.to(win, {
            x: 0,
            y: () => (i - 1.5) * 92 * scale() + (isNarrow() ? 70 : 0),
            z: () => (3 - i) * 40 * scale(),
            rotationX: 58,
            rotationY: 0,
            rotationZ: -38,
            scale: 0.92,
            duration: 1.6
        }, `build+=${0.1 * i}`);
    });

    tl.to(tags, { autoAlpha: 1, duration: 0.5, stagger: 0.1 }, 'build+=1.2')
        .fromTo('.frame-2', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 'build+=1');

    // 2 → 3: DEPLOY — camadas viram pacote, sobem e publicam no servidor
    tl.addLabel('deploy', '+=0.8')
        .to('.frame-2', { autoAlpha: 0, y: -40, duration: 0.6 }, 'deploy')
        .to('.sw-build', { autoAlpha: 0, scale: 1.1, duration: 0.8 }, 'deploy')
        .to(tags, { autoAlpha: 0, duration: 0.3 }, 'deploy')
        .to(wins, { y: 0, z: 0, scale: 0.5, duration: 1 }, 'deploy')
        .to(wins, { autoAlpha: 0, duration: 0.5 }, 'deploy+=0.7')
        .to(pkg, { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(2)' }, 'deploy+=0.8')
        .to(object, { y: () => -window.innerHeight * (isNarrow() ? 0.04 : 0.26), duration: 1.2 }, 'deploy+=0.9')
        .to(server, { autoAlpha: 1, y: 0, duration: 1.2, ease: 'power3.out' }, 'deploy+=0.9')
        .fromTo('.sw-deploy', { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 1 }, 'deploy+=0.9')
        .fromTo('.frame-3', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.8 }, 'deploy+=1.1')
        .to(state, { stream: 1, duration: 0.6 }, 'deploy+=1.6')
        .fromTo(logItems, { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, stagger: 0.35, duration: 0.4 }, 'deploy+=1.6');

    // 3 → 4: RUN — painel de produção cobre a tela
    tl.addLabel('run', '+=0.9')
        .to(flood, { yPercent: 0, duration: 1.6, ease: 'power3.inOut' }, 'run')
        .to(state, { stream: 0, duration: 0.6 }, 'run+=0.6')
        .fromTo('.frame-4 > *', { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, stagger: 0.15, duration: 0.8 }, 'run+=1')
        .to({}, { duration: 0.8 });

    // Os parallax de main.js foram criados antes deste pin; reordenamos para que considerem o espaço que ele adiciona.
    ScrollTrigger.sort();
    ScrollTrigger.refresh();

    function updateProgress(p) {
        const total = tl.duration();
        const t = p * total;
        const step = t < tl.labels.build + 1 ? 0 : t < tl.labels.deploy + 0.9 ? 1 : t < tl.labels.run + 0.8 ? 2 : 3;
        progressItems.forEach((item, i) => item.classList.toggle('is-active', i === step));

        const onFlood = step === 3;
        if (onFlood !== state.onFlood) {
            state.onFlood = onFlood;
            story.classList.toggle('on-flood', onFlood);
        }
    }

    /* ---------- Entrada após o loader ---------- */
    const intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
        .from('.story-words', { yPercent: 8, autoAlpha: 0, duration: 1.2 })
        .from(layers, { y: 120, autoAlpha: 0, scale: 0.9, duration: 1.4 }, 0.15)
        .from('.frame-1 > *', { y: 30, autoAlpha: 0, stagger: 0.08, duration: 0.9 }, 0.4)
        .from(['.story-progress', '.scroll-cue'], { autoAlpha: 0, duration: 0.8 }, 0.8);

    if (document.body.classList.contains('is-loading')) {
        document.addEventListener('loader:done', () => intro.play(), { once: true });
    } else {
        intro.play();
    }

    /* ---------- Vida própria: flutuação + mouse ---------- */
    gsap.to(object, { yPercent: -5, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1 });

    if (window.matchMedia('(hover: hover)').matches) {
        const rotX = gsap.quickTo(layers, 'rotationX', { duration: 0.8, ease: 'power3' });
        const rotY = gsap.quickTo(layers, 'rotationY', { duration: 0.8, ease: 'power3' });
        stage.addEventListener('mousemove', (e) => {
            const px = e.clientX / window.innerWidth - 0.5;
            const py = e.clientY / window.innerHeight - 0.5;
            rotY(px * 10);
            rotX(-py * 8);
        });
        stage.addEventListener('mouseleave', () => { rotX(0); rotY(0); });
    }

    /* ---------- Tokens de código flutuando (frame 1) ---------- */
    const TOKENS = ['{ }', '=>', ';', '</>', 'async', 'await', 'var', 'C#', '.NET', 'SQL', '[ ]', '( )', 'public', 'Task<T>', 'LINQ', '200 OK', 'class', '=='];

    function spawnDust() {
        if (state.visible && state.dust > 0.05 && !document.hidden) {
            const rect = object.getBoundingClientRect();
            const stageRect = stage.getBoundingClientRect();
            const el = document.createElement('span');
            el.className = 'dust';
            el.textContent = TOKENS[Math.floor(Math.random() * TOKENS.length)];
            el.style.fontSize = `${10 + Math.random() * 8}px`;
            dustLayer.appendChild(el);

            const x = rect.left - stageRect.left + rect.width * (-0.25 + Math.random() * 1.5);
            const y = rect.top - stageRect.top + rect.height * (0.2 + Math.random() * 0.9);
            const drift = 60 + Math.random() * 90;
            const anim = el.animate([
                { transform: `translate(${x}px, ${y}px)`, opacity: 0 },
                { opacity: 0.55 * state.dust, offset: 0.3 },
                { transform: `translate(${x + (Math.random() - 0.5) * 40}px, ${y - drift}px)`, opacity: 0 }
            ], { duration: 3200 + Math.random() * 1800, easing: 'ease-out' });
            anim.onfinish = () => el.remove();
        }
        setTimeout(spawnDust, 260);
    }
    spawnDust();

    /* ---------- Fluxo de bits: pacote → servidor ---------- */
    const particles = [];
    const BITS = ['0', '1', '0', '1', '{', '}', ';'];
    let accent = '#8b6cff';
    let dpr = 1;

    function readAccent() {
        accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#8b6cff';
    }
    readAccent();
    document.addEventListener('themeChanged', () => setTimeout(readAccent, 50));

    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = stage.clientWidth * dpr;
        canvas.height = stage.clientHeight * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    function draw() {
        if (!state.visible) {
            requestAnimationFrame(draw);
            return;
        }
        const w = stage.clientWidth;
        const h = stage.clientHeight;
        ctx.clearRect(0, 0, w, h);

        if (state.stream > 0.02) {
            const stageRect = stage.getBoundingClientRect();
            const p = pkg.getBoundingClientRect();
            const s = server.getBoundingClientRect();
            const ox = p.left + p.width / 2 - stageRect.left;
            const oy = p.bottom - stageRect.top;
            const targetY = s.top - stageRect.top + 6;

            const spawn = Math.round(3 * state.stream);
            for (let i = 0; i < spawn; i++) {
                particles.push({
                    x: ox + (Math.random() - 0.5) * 26,
                    y: oy,
                    vy: 1.5 + Math.random() * 2,
                    sway: Math.random() * Math.PI * 2,
                    ch: BITS[Math.floor(Math.random() * BITS.length)],
                    size: 10 + Math.random() * 5,
                    targetY
                });
            }
        }

        ctx.textAlign = 'center';
        ctx.fillStyle = accent;
        for (let i = particles.length - 1; i >= 0; i--) {
            const pt = particles[i];
            pt.vy += 0.12;
            pt.y += pt.vy;
            pt.sway += 0.08;
            pt.x += Math.sin(pt.sway) * 0.4;

            const life = 1 - Math.max(0, (pt.y - (pt.targetY - 40)) / 40);
            if (pt.y >= pt.targetY || life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            ctx.globalAlpha = Math.max(0.15, Math.min(1, life)) * (0.5 + state.stream * 0.5);
            ctx.font = `600 ${pt.size}px JetBrains Mono, monospace`;
            ctx.fillText(pt.ch, pt.x, pt.y);
        }
        ctx.globalAlpha = 1;

        requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);

    /* ---------- Log de produção ao vivo (frame 4) ---------- */
    const ROUTES = [
        ['GET', '/api/pedidos', 200], ['POST', '/api/pedidos', 201], ['GET', '/api/clientes', 200],
        ['PUT', '/api/produtos/42', 204], ['GET', '/health', 200], ['POST', '/api/auth/login', 200]
    ];

    function pushLog() {
        if (state.visible && state.onFlood && runLog && !document.hidden) {
            const [method, path, status] = ROUTES[Math.floor(Math.random() * ROUTES.length)];
            const ms = 12 + Math.floor(Math.random() * 80);
            const time = new Date().toLocaleTimeString('pt-BR', { hour12: false });
            const li = document.createElement('li');
            li.innerHTML = `<span class="ms">${time}</span> <span class="m">${method}</span> ${path} <span class="c2">${status}</span> <span class="ms">${ms}ms</span>`;
            runLog.appendChild(li);
            while (runLog.children.length > 12) runLog.firstElementChild.remove();
        }
        setTimeout(pushLog, 650 + Math.random() * 500);
    }
    pushLog();
});
