// Função para exibir toast
function showToast(message, type = 'success', duration = 5000) {
    // Cria o container de toasts se não existir
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Cria o toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Adiciona o ícone baseado no tipo
    let icon = '';
    if (type === 'success') {
        icon = '<i class="fas fa-check-circle"></i>';
    } else if (type === 'error') {
        icon = '<i class="fas fa-exclamation-circle"></i>';
    } else {
        icon = '<i class="fas fa-info-circle"></i>';
    }

    // Cria o botão de fechar
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => removeToast(toast);

    // Adiciona o conteúdo ao toast
    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.alignItems = 'center';
    content.style.gap = '10px';
    content.innerHTML = `${icon}<span>${message}</span>`;

    toast.appendChild(content);
    toast.appendChild(closeBtn);

    // Adiciona o toast ao container
    container.appendChild(toast);

    // Força o navegador a reconhecer a mudança de estilo
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Remove o toast após a duração especificada
    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }

    return toast;
}

// Função para remover toast
function removeToast(toast) {
    if (toast) {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            toast.remove();
            // Remove o container se não houver mais toasts
            const container = document.querySelector('.toast-container');
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }
}

// Inicialização do EmailJS
(function () {
    // Verifica se o EmailJS foi carregado corretamente
    if (typeof emailjs === 'undefined') {
        showToast('Erro ao carregar o serviço de e-mail', 'error');
        return;
    }

    // Inicializa o EmailJS
    emailjs.init('LeqVisNk5rl9UTxYb');

    // Função para enviar o email
    async function enviarEmail(e) {
        e.preventDefault();

        const btnEnviar = e.target.querySelector('button[type="submit"]');
        if (!btnEnviar) {
            return;
        }

        // Mostra o indicador de carregamento
        const btnText = btnEnviar.innerHTML;
        btnEnviar.disabled = true;
        btnEnviar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

        // Cria a mensagem de carregamento
        const loadingMessage = document.createElement('div');
        loadingMessage.id = 'loading-message';
        loadingMessage.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 16px;
        `;
        loadingMessage.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando mensagem...';
        document.body.appendChild(loadingMessage);

        try {
            // Adiciona a data e hora atual
            const now = new Date();
            const timeString = now.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Cria um objeto com os dados do formulário
            const templateParams = {
                name: e.target.name.value.trim(),
                email: e.target.email.value.trim(),
                subject: e.target.subject.value.trim(),
                message: e.target.message.value.trim(),
                time: timeString
            };

            // Validação básica
            if (!templateParams.email.includes('@') || !templateParams.email.includes('.')) {
                throw { message: 'Por favor, insira um email válido' };
            }

            // Envia o email usando EmailJS
            await emailjs.send('service_f6iroa9', 'template_d7lny7m', templateParams);

            // Sucesso
            showToast('Mensagem enviada com sucesso! Em breve entrarei em contato.', 'success');
            e.target.reset();
        } catch (error) {
            let errorMessage = 'Ocorreu um erro ao enviar a mensagem. ';

            if (error.status === 0) {
                errorMessage += 'Verifique sua conexão com a internet e tente novamente.';
            } else if (error.message) {
                errorMessage = error.message;
            } else {
                errorMessage += 'Por favor, tente novamente mais tarde.';
            }

            showToast(errorMessage, 'error');
        } finally {
            // Remove a mensagem de carregamento
            const loadingMsg = document.getElementById('loading-message');
            if (loadingMsg) loadingMsg.remove();

            // Restaura o botão
            if (btnEnviar) {
                btnEnviar.disabled = false;
                btnEnviar.innerHTML = btnText;
            }
        }
    }

    // Inicializa o formulário quando o DOM estiver pronto
    function initForm() {
        const form = document.getElementById('form-contato');
        if (form) {
            form.addEventListener('submit', enviarEmail);
        } else {
            setTimeout(initForm, 1000);
        }
    }

    // Inicializa quando o DOM estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initForm);
    } else {
        initForm();
    }
})();