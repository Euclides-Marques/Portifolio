function showToast(message, type = 'success', duration = 5000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = '';
    if (type === 'success') {
        icon = '<i class="fas fa-check-circle"></i>';
    } else if (type === 'error') {
        icon = '<i class="fas fa-exclamation-circle"></i>';
    } else {
        icon = '<i class="fas fa-info-circle"></i>';
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '&times;';
    closeBtn.onclick = () => removeToast(toast);

    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.alignItems = 'center';
    content.style.gap = '10px';
    content.innerHTML = `${icon}<span>${message}</span>`;

    toast.appendChild(content);
    toast.appendChild(closeBtn);

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    if (duration > 0) {
        setTimeout(() => {
            removeToast(toast);
        }, duration);
    }

    return toast;
}

function removeToast(toast) {
    if (toast) {
        toast.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => {
            toast.remove();
            const container = document.querySelector('.toast-container');
            if (container && container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }
}

(function () {
    if (typeof emailjs === 'undefined') {
        showToast('Erro ao carregar o serviço de e-mail', 'error');
        return;
    }

    emailjs.init('LeqVisNk5rl9UTxYb');

    async function enviarEmail(e) {
        e.preventDefault();

        const btnEnviar = e.target.querySelector('button[type="submit"]');
        if (!btnEnviar) {
            return;
        }

        btnEnviar.disabled = true;
        btnEnviar.classList.add('loading');

        try {
            const now = new Date();
            const timeString = now.toLocaleString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const templateParams = {
                name: e.target.name.value.trim(),
                email: e.target.email.value.trim(),
                subject: e.target.subject.value.trim(),
                message: e.target.message.value.trim(),
                time: timeString
            };

            if (!templateParams.email.includes('@') || !templateParams.email.includes('.')) {
                throw { message: 'Por favor, insira um email válido' };
            }

            await emailjs.send('service_f6iroa9', 'template_d7lny7m', templateParams);

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
            if (btnEnviar) {
                btnEnviar.disabled = false;
                btnEnviar.classList.remove('loading');
            }
        }
    }

    function initForm() {
        const form = document.getElementById('form-contato');
        if (form) {
            form.addEventListener('submit', enviarEmail);
        } else {
            setTimeout(initForm, 1000);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initForm);
    } else {
        initForm();
    }
})();