// Classe para gerenciar o formulário
class FormHandler {
    constructor() {
        this.form = document.getElementById('medida-form');
        this.formGroups = document.querySelectorAll('.form-group');
        this.addButton = document.querySelector('.btn-adicionar');
        this.tableBody = document.querySelector('.medidas-table tbody');
        this.medidasData = JSON.parse(localStorage.getItem('medidas')) || [];
        
        this.initializeFormHandlers();
        this.loadMedidas();
        this.setupFormAnimation();
    }

    initializeFormHandlers() {
        this.setupFieldValidation();
        this.setupRippleEffect();
        this.setupFormSubmission();
    }

    setupFieldValidation() {
        this.formGroups.forEach(group => {
            const input = group.querySelector('input, select');
            if (input) {
                const checkIcon = group.querySelector('.ph-check-circle');
                
                // Verificar estado inicial
                if (input.value) {
                    group.classList.add('filled');
                    if (checkIcon) checkIcon.style.opacity = '1';
                }

                // Monitorar mudanças
                input.addEventListener('input', () => {
                    if (input.value) {
                        group.classList.add('filled');
                        if (checkIcon) {
                            checkIcon.style.opacity = '1';
                            checkIcon.style.transform = 'scale(1.2)';
                            setTimeout(() => {
                                checkIcon.style.transform = 'scale(1)';
                            }, 200);
                        }
                    } else {
                        group.classList.remove('filled');
                        if (checkIcon) checkIcon.style.opacity = '0';
                    }
                });

                // Adicionar animação ao focar
                input.addEventListener('focus', () => {
                    group.classList.add('focused');
                });

                input.addEventListener('blur', () => {
                    group.classList.remove('focused');
                });
            }
        });
    }

    setupRippleEffect() {
        this.addButton.addEventListener('click', (e) => {
            const rect = this.addButton.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('div');
            ripple.className = 'ripple';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';

            this.addButton.appendChild(ripple);
            setTimeout(() => ripple.remove(), 1000);
        });
    }

    setupFormAnimation() {
        // Adicionar classe para animação inicial do formulário
        this.form.classList.add('form-entrance');
        
        // Animar todos os campos simultaneamente
        this.formGroups.forEach((group, index) => {
            group.style.opacity = '0';
            group.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                group.style.opacity = '1';
                group.style.transform = 'translateY(0)';
            }, 100 * index); // Pequeno delay entre cada campo para efeito cascata
        });
    }

    setupFormSubmission() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(this.form);
            const medidaData = {
                id: Date.now(),
                tipo: formData.get('tipo'),
                titulo: formData.get('titulo'),
                nome: formData.get('nome'),
                valor: parseFloat(formData.get('valor')),
                unidade: formData.get('unidade'),
                dataCadastro: new Date().toISOString()
            };

            this.medidasData.push(medidaData);
            localStorage.setItem('medidas', JSON.stringify(this.medidasData));
            
            this.addMedidaToTable(medidaData);
            this.form.reset();
            
            // Remover classes filled de todos os campos
            this.formGroups.forEach(group => {
                group.classList.remove('filled');
                const checkIcon = group.querySelector('.ph-check-circle');
                if (checkIcon) checkIcon.style.opacity = '0';
            });
            
            // Mostrar notificação
            this.showNotification('Medida adicionada com sucesso!');
        });
    }

    addMedidaToTable(medida) {
        const row = document.createElement('tr');
        row.dataset.id = medida.id;
        
        const date = new Date(medida.dataCadastro);
        const formattedDate = date.toLocaleDateString('pt-BR');
        
        row.innerHTML = `
            <td>
                <div class="medida-info">
                    <strong>${medida.titulo}</strong>
                    <span class="tipo-medida">${medida.tipo}</span>
                </div>
            </td>
            <td>${medida.nome}</td>
            <td>${medida.valor} ${medida.unidade}</td>
            <td>${formattedDate}</td>
            <td>
                <button class="btn-remover" onclick="formHandler.removeMedida(${medida.id})">
                    <i class="ph ph-trash"></i>
                </button>
            </td>
        `;

        // Animar entrada da nova linha
        row.style.opacity = '0';
        row.style.transform = 'translateY(20px)';
        this.tableBody.insertBefore(row, this.tableBody.firstChild);

        // Aplicar animação
        row.animate([
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ], {
            duration: 500,
            easing: 'ease-out',
            fill: 'forwards'
        });
    }

    removeMedida(id) {
        const row = this.tableBody.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            // Animar saída
            row.animate([
                { opacity: 1, transform: 'translateX(0)' },
                { opacity: 0, transform: 'translateX(50px)' }
            ], {
                duration: 300,
                easing: 'ease-in'
            }).onfinish = () => {
                row.remove();
                this.medidasData = this.medidasData.filter(m => m.id !== id);
                localStorage.setItem('medidas', JSON.stringify(this.medidasData));
                this.showNotification('Medida removida com sucesso!');
            };
        }
    }

    loadMedidas() {
        this.medidasData.forEach(medida => {
            this.addMedidaToTable(medida);
        });
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <i class="ph ph-check-circle"></i>
            ${message}
        `;

        document.body.appendChild(notification);

        // Animar entrada
        notification.animate([
            { opacity: 0, transform: 'translateY(20px)' },
            { opacity: 1, transform: 'translateY(0)' }
        ], {
            duration: 300,
            easing: 'ease-out',
            fill: 'forwards'
        });

        // Remover após 3 segundos
        setTimeout(() => {
            notification.animate([
                { opacity: 1, transform: 'translateY(0)' },
                { opacity: 0, transform: 'translateY(-20px)' }
            ], {
                duration: 300,
                easing: 'ease-in'
            }).onfinish = () => notification.remove();
        }, 3000);
    }
}

// Inicializar quando o DOM estiver pronto
let formHandler;
document.addEventListener('DOMContentLoaded', () => {
    formHandler = new FormHandler();
});
