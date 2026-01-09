document.addEventListener('DOMContentLoaded', function () {
    // Elementos do DOM
    const themeToggle = document.querySelector('.theme-toggle');
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const backToTop = document.querySelector('.back-to-top');
    const form = document.getElementById('contactForm');

    // Efeito de digitação
    const typingText = document.getElementById('typing-text');
    let text = "Olá, eu sou Euclides Marques"; // Texto padrão em português
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100; // Velocidade de digitação em milissegundos
    let typeWriterTimeout; // Para controlar o timeout do typeWriter

    // Traduções do texto de boas-vindas
    const welcomeTexts = {
        'pt': 'Olá, eu sou Euclides Marques',
        'en': 'Hello, I am Euclides Marques',
        'es': 'Hola, soy Euclides Marques',
        'fr': 'Bonjour, je suis Euclides Marques'
    };

    // Atualiza o texto de boas-vindas com base no idioma
    function updateWelcomeText(lang = 'pt') {
        // Para o efeito de digitação atual, se houver
        if (typeWriterTimeout) {
            clearTimeout(typeWriterTimeout);
            typeWriterTimeout = null;
        }

        // Define o novo texto
        text = welcomeTexts[lang] || welcomeTexts['pt'];

        // Reseta as variáveis do efeito de digitação
        charIndex = 0;
        isDeleting = false;

        // Reinicia o efeito de digitação
        if (typingText) {
            typeWriter();
        }
    }

    function typeWriter() {
        const currentText = text.substring(0, charIndex);
        typingText.innerHTML = currentText;

        if (!isDeleting && charIndex < text.length) {
            // Digitando
            charIndex++;
            typeWriterTimeout = setTimeout(typeWriter, typingSpeed);
        } else if (isDeleting && charIndex > 0) {
            // Apagando
            charIndex--;
            setTimeout(typeWriter, typingSpeed / 2);
        } else {
            // Inverte a direção (digitar/apagar)
            isDeleting = !isDeleting;
            // Aumenta o tempo de pausa quando terminar de digitar
            typeWriterTimeout = setTimeout(typeWriter, isDeleting ? 2000 : 500);
        }
    }

    // Inicia o efeito de digitação
    typeWriterTimeout = setTimeout(typeWriter, 1000); // Inicia após 1 segundo

    // Atualiza o texto quando o idioma for alterado
    document.addEventListener('languageChanged', (event) => {
        if (event.detail && event.detail.lang) {
            updateWelcomeText(event.detail.lang);
        }
    });

    // Verifica se já existe um idioma salvo
    const savedLang = localStorage.getItem('preferredLanguage') || 'pt';
    if (savedLang !== 'pt') {
        updateWelcomeText(savedLang);
    }

    // Verificar tema salvo no localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    updateThemeIcon(savedTheme);

    // Alternar tema
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeIcon(isDark ? 'dark' : 'light');
    });

    // Atualizar ícone do tema
    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Menu móvel
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Fechar menu ao clicar em um link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // Função para rolar suavemente para o topo
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

        // Função de easing para suavizar a animação
        function easeInOutCubic(t) {
            return t < 0.5
                ? 4 * t * t * t
                : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        }

        window.requestAnimationFrame(scrollStep);
    }

    // Botão voltar ao topo - aparece apenas quando chegar no final da página
    window.addEventListener('scroll', () => {
        // Verifica se o usuário chegou no final da página
        const scrollPosition = window.scrollY + window.innerHeight;
        const pageHeight = document.documentElement.scrollHeight - 100; // -100 para dar uma margem

        // Mostra o botão quando estiver perto do final da página
        if (scrollPosition >= pageHeight) {
            backToTop.classList.add('active');
        } else {
            backToTop.classList.remove('active');
        }
    });

    // Adiciona o evento de clique no botão de voltar ao topo
    backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        // Verifica se é um dispositivo móvel
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        // Define o tempo de rolagem: 1000ms para mobile, 1500ms para desktop
        const scrollDuration = isMobile ? 100 : 5000;
        scrollToTop(scrollDuration);
    });

    // Rolar suave para as seções
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

    // Envio do formulário de contato
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            // Aqui você pode adicionar a lógica para enviar o formulário
            // Por exemplo, usando Fetch API para enviar para um servidor

            // Exemplo de feedback visual
            const submitButton = form.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;

            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';

            // Simulação de envio
            setTimeout(() => {
                alert('Mensagem enviada com sucesso! Entrarei em contato em breve.');
                form.reset();
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }, 1500);
        });
    }

    // Animações ao rolar a página
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

    // Adicionar classe de animação aos elementos
    document.querySelectorAll('section').forEach(section => {
        const elements = section.querySelectorAll('h2, .about-content, .skills-grid, .project-card, .education-item, .course-card, .contact-container');
        elements.forEach((element, index) => {
            element.classList.add('fadeInUp');
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`;
        });
    });

    // Disparar animação ao carregar a página e ao rolar
    window.addEventListener('load', animateOnScroll);
    window.addEventListener('scroll', animateOnScroll);
});

// Atualizar ano atual no rodapé
document.addEventListener('DOMContentLoaded', function () {
    const year = new Date().getFullYear();
    const yearElement = document.querySelector('.footer-bottom p');
    if (yearElement) {
        yearElement.textContent = `© ${year} Euclides Marques. Todos os direitos reservados.`;
    }
});
