
class ConjuntoMedidas {
    constructor(titulo) {
        this.id = Date.now().toString(36) + Math.random().toString(36).substr(2)
        this.titulo = titulo
        this.medidas = []
        this.dataCriacao = new Date()
        this.ultimaAtualizacao = new Date()
    }

    adicionarMedida(medida) {
        if (!this.medidas.find(m => m.id === medida.id)) {
            medida.conjuntoId = this.id
            this.medidas.push(medida)
        }
        this.ultimaAtualizacao = new Date()
    }

    getDataFormatada() {
        return this.dataCriacao.toLocaleDateString("pt-BR")
    }

    getUltimaAtualizacaoFormatada() {
        return this.ultimaAtualizacao.toLocaleDateString("pt-BR")
    }
}

class Medida {
    constructor(tipo, titulo, nome, valor, unidade) {
        this.id = Date.now().toString(36) + Math.random().toString(36).substr(2)
        this.tipo = tipo
        this.titulo = titulo
        this.nome = nome
        this.valor = Number.parseFloat(valor)
        this.unidade = unidade
        this.dataCadastro = new Date()
        this.conjuntoId = null
    }

    getDataFormatada() {
        return this.dataCadastro.toLocaleDateString("pt-BR")
    }

    isValid() {
        return (
            this.tipo && this.tipo.trim().length > 0 &&
            this.titulo && this.titulo.trim().length > 0 &&
            this.nome && this.nome.trim().length > 0 &&
            !isNaN(this.valor) && this.valor > 0 &&
            this.unidade && this.unidade.trim().length > 0
        )
    }
}
class MedidasModel {
    constructor() {
        this.medidas = [];
        this.conjuntos = [];
        this.observers = [];
        this.init();
    }

    async init() {
        console.log("Inicializando MedidasModel...");
        const storedData = localStorage.getItem('medidas_app_data');

        if (storedData) {
            console.log("Tentando carregar dados do localStorage.");
            this._loadDataFromParsedJson(JSON.parse(storedData));
            this.renderMedidas();
        } else {
            console.log("LocalStorage vazio, buscando dados do servidor...");
        }
        
        await this.loadFromServer();
        this.notifyObservers();
    }

    _loadDataFromParsedJson(data) {
        this.medidas = [];
        this.conjuntos = [];

        if (data.conjuntos && Array.isArray(data.conjuntos)) {
            this.conjuntos = data.conjuntos.map(conjuntoData => {
                const conjunto = new ConjuntoMedidas(conjuntoData.titulo);
                conjunto.id = conjuntoData.id;
                conjunto.dataCriacao = new Date(conjuntoData.dataCriacao);
                conjunto.ultimaAtualizacao = new Date(conjuntoData.ultimaAtualizacao);
                conjunto.medidas = (conjuntoData.medidas || []).map(medidaData => {
                    const medida = new Medida(
                        medidaData.tipo, medidaData.titulo, medidaData.nome,
                        medidaData.valor, medidaData.unidade
                    );
                    medida.id = medidaData.id;
                    medida.dataCadastro = new Date(medidaData.dataCadastro);
                    medida.conjuntoId = medidaData.conjuntoId;
                    return medida;
                });
                return conjunto;
            });
        }

        if (data.medidas && Array.isArray(data.medidas)) {
            this.medidas = data.medidas.map(medidaData => {
                const medida = new Medida(
                    medidaData.tipo, medidaData.titulo, medidaData.nome,
                    medidaData.valor, medidaData.unidade
                );
                medida.id = medidaData.id;
                medida.dataCadastro = new Date(medidaData.dataCadastro);
                medida.conjuntoId = medidaData.conjuntoId;
                return medida;
            });
        }
    }

    async loadFromServer() {
        try {
            const response = await fetch('/api/medidas');
            if (response.ok) {
                const data = await response.json();
                this._loadDataFromParsedJson(data);
                localStorage.setItem('medidas_app_data', JSON.stringify(data));
                console.log("Dados carregados do servidor e localStorage atualizado.");
            } else {
                console.error('Erro ao carregar medidas do servidor:', response.statusText);
                this.showNotification('Erro ao carregar medidas do servidor!', 'error');
            }
        } catch (error) {
            console.error('Erro de rede ao carregar medidas:', error);
            this.showNotification('Erro de rede ao carregar medidas!', 'error');
        } finally {
            this.renderMedidas();
        }
    }

    async saveToServer() {
        const dataToSave = {
            medidas: this.medidas.map(medida => ({
                id: medida.id,
                tipo: medida.tipo,
                titulo: medida.titulo,
                nome: medida.nome,
                valor: medida.valor,
                unidade: medida.unidade,
                dataCadastro: medida.dataCadastro.toISOString(),
                conjuntoId: medida.conjuntoId
            })),
            conjuntos: this.conjuntos.map(conjunto => ({
                id: conjunto.id,
                titulo: conjunto.titulo,
                dataCriacao: conjunto.dataCriacao.toISOString(),
                ultimaAtualizacao: conjunto.ultimaAtualizacao.toISOString(),
                medidas: conjunto.medidas.map(m => ({
                    id: m.id, tipo: m.tipo, titulo: m.titulo,
                    nome: m.nome, valor: m.valor, unidade: m.unidade,
                    dataCadastro: m.dataCadastro.toISOString(), conjuntoId: m.conjuntoId
                }))
            }))
        };

        localStorage.setItem('medidas_app_data', JSON.stringify(dataToSave));

        try {
            const response = await fetch('/api/medidas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataToSave)
            });

            if (!response.ok) {
                console.error('Erro ao salvar dados no servidor:', response.statusText);
                this.showNotification('Erro ao salvar dados no servidor!', 'error');
            } else {
                console.log('Dados salvos no servidor com sucesso.');
            }
        } catch (error) {
            console.error('Erro de rede ao salvar dados no servidor:', error);
            this.showNotification('Erro de rede ao salvar dados no servidor!', 'error');
        }
    }

    async adicionarMedida(medida) {
        if (!medida.isValid()) {
            throw new Error("Dados da medida são inválidos.");
        }

        if (medida.tipo === 'conjunto') {
            let conjuntoExistente = this.conjuntos.find(c => c.titulo === medida.titulo);
            if (!conjuntoExistente) {
                conjuntoExistente = new ConjuntoMedidas(medida.titulo);
                conjuntoExistente.id = medida.id;
                this.conjuntos.push(conjuntoExistente);
            }
            conjuntoExistente.adicionarMedida(medida);
            if (!this.medidas.find(m => m.id === medida.id)) {
                this.medidas.push(medida);
            }
        } else {
            this.medidas.push(medida);
        }

        await this.saveToServer();
        this.notifyObservers();
        this.renderMedidas();
    }

    async removerMedida(id) {
        const index = this.medidas.findIndex(m => m.id === id);
        if (index === -1) {
            this.showNotification('Medida não encontrada!', 'error');
            return;
        }

        const medidaParaRemover = this.medidas[index];

        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
            row.style.transition = 'all 0.3s ease-in';
            row.style.opacity = '0';
            row.style.transform = 'translateX(50px)';
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        if (medidaParaRemover.conjuntoId) {
            const conjunto = this.conjuntos.find(c => c.id === medidaParaRemover.conjuntoId);
            if (conjunto) {
                conjunto.medidas = conjunto.medidas.filter(m => m.id !== id);
                if (conjunto.medidas.length === 0 && conjunto.id !== "avulsas") {
                    this.conjuntos = this.conjuntos.filter(c => c.id !== conjunto.id);
                }
            }
        } else if (medidaParaRemover.tipo === 'conjunto') {
            this.conjuntos = this.conjuntos.filter(c => c.id !== medidaParaRemover.id);
            this.medidas = this.medidas.filter(m => m.conjuntoId !== medidaParaRemover.id && m.id !== medidaParaRemover.id);
        }

        this.medidas.splice(index, 1);

        await this.saveToServer();
        this.notifyObservers();
        this.showNotification('Medida removida com sucesso!');
        this.renderMedidas();
    }

    agruparMedidasPorConjunto() {
        const conjuntosMap = new Map();
        let medidasAvulsas = this.conjuntos.find(c => c.id === "avulsas");
        if (!medidasAvulsas) {
            medidasAvulsas = new ConjuntoMedidas("Medidas Avulsas");
            medidasAvulsas.id = "avulsas";
            this.conjuntos.push(medidasAvulsas);
        }
        medidasAvulsas.medidas = [];

        this.conjuntos.forEach(c => conjuntosMap.set(c.id, c));
        
        this.medidas.forEach(medida => {
            if (medida.tipo === 'conjunto') {
                let conjunto = conjuntosMap.get(medida.id);
                if (!conjunto) {
                    conjunto = new ConjuntoMedidas(medida.titulo);
                    conjunto.id = medida.id;
                    conjuntosMap.set(medida.id, conjunto);
                    this.conjuntos.push(conjunto);
                }
                if (!conjunto.medidas.find(m => m.id === medida.id)) {
                    conjunto.adicionarMedida(medida);
                }
            } else if (medida.conjuntoId) {
                let conjunto = conjuntosMap.get(medida.conjuntoId);
                if (conjunto) {
                    conjunto.adicionarMedida(medida);
                } else {
                    medidasAvulsas.adicionarMedida(medida);
                }
            } else {
                medidasAvulsas.adicionarMedida(medida);
            }
        });

        return conjuntosMap;
    }

    renderMedidas() {
        const tableBody = document.querySelector('.medidas-table tbody');
        const table = document.querySelector('.medidas-table');
        const emptyState = document.getElementById('empty-state');
        
        if (!tableBody) return;

        if (this.medidas.length === 0) {
            table.style.display = 'none';
            emptyState.style.display = 'flex';
            tableBody.innerHTML = '';
            return;
        } else {
            table.style.display = 'table';
            emptyState.style.display = 'none';
        }

        tableBody.innerHTML = '';

        const conjuntosAgrupados = this.agruparMedidasPorConjunto();
        
        const conjuntosOrdenados = [...conjuntosAgrupados.values()].sort((a, b) => {
            if (a.id === "avulsas") return 1;
            if (b.id === "avulsas") return -1;
            return b.dataCriacao.getTime() - a.dataCriacao.getTime();
        });

        conjuntosOrdenados.forEach(conjunto => {
            if (conjunto.medidas.length === 0 && conjunto.id !== "avulsas") return;

            const headerRow = document.createElement('tr');
            headerRow.className = 'conjunto-header';
            headerRow.innerHTML = `
                <td colspan="6">
                    <div class="conjunto-info">
                        <h3>${conjunto.titulo}</h3>
                        <span class="conjunto-data">
                            ${conjunto.id === "avulsas" ? '' : `Criado em ${conjunto.getDataFormatada()}`}
                            ${conjunto.id === "avulsas" ? '' : ` Última Atualização: ${conjunto.getUltimaAtualizacaoFormatada()}`}
                        </span>
                    </div>
                </td>
            `;
            tableBody.appendChild(headerRow);

            conjunto.medidas.forEach((medida, index) => {
                const row = document.createElement('tr');
                row.dataset.id = medida.id;
                row.dataset.conjuntoId = medida.conjuntoId || 'none';

                row.innerHTML = `
                    <td class="id">${index + 1}</td>
                    <td>${medida.nome}</td>
                    <td>${medida.valor}</td>
                    <td>${medida.unidade}</td>
                    <td>${medida.getDataFormatada()}</td>
                    <td>
                        <button type="button" class="button red" title="Remover" onclick="medidasModel.removerMedida('${medida.id}')">
                            <i class="ph-bold ph-trash"></i>
                        </button>
                        <button type="button" class="button green" title="Editar">
                            <i class="ph-bold ph-pencil"></i>
                        </button>
                    </td>
                `;
                row.style.opacity = '0';
                row.style.transform = 'translateY(20px)';
                tableBody.appendChild(row);
                requestAnimationFrame(() => {
                    row.style.transition = 'all 0.3s ease-out';
                    row.style.opacity = '1';
                    row.style.transform = 'translateY(0)';
                });
            });
        });
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div')
        notification.className = `notification ${type}`
        notification.innerHTML = `
            <i class="ph ph-${type === 'success' ? 'check-circle' : 'x-circle'}"></i>
            ${message}
        `

        document.body.appendChild(notification)
        notification.style.opacity = '0'
        notification.style.transform = 'translateY(20px)'
        
        requestAnimationFrame(() => {
            notification.style.transition = 'all 0.3s ease-out'
            notification.style.opacity = '1'
            notification.style.transform = 'translateY(0)'
        })

        setTimeout(() => {
            notification.style.opacity = '0'
            notification.style.transform = 'translateY(-20px)'
            setTimeout(() => notification.remove(), 300)
        }, 3000)
    }

    addObserver(observer) {
        this.observers.push(observer);
        observer(this.medidas);
    }

    notifyObservers() {
        this.observers.forEach(observer => observer(this.medidas));
    }

    downloadMedidasJSON() {
        const data = {
            version: "1.0.0",
            lastUpdate: new Date().toISOString(),
            medidas: this.medidas.map(medida => ({
                id: medida.id,
                tipo: medida.tipo,
                titulo: medida.titulo,
                nome: medida.nome,
                valor: medida.valor,
                unidade: medida.unidade,
                dataCadastro: medida.dataCadastro.toISOString(),
                conjuntoId: medida.conjuntoId
            })),
            conjuntos: this.conjuntos.map(conjunto => ({
                id: conjunto.id,
                titulo: conjunto.titulo,
                dataCriacao: conjunto.dataCriacao.toISOString(),
                ultimaAtualizacao: conjunto.ultimaAtualizacao.toISOString(),
                medidas: conjunto.medidas.map(m => ({ // Incluir medidas aninhadas para exportação
                    id: m.id, tipo: m.tipo, titulo: m.titulo,
                    nome: m.nome, valor: m.valor, unidade: m.unidade,
                    dataCadastro: m.dataCadastro.toISOString(), conjuntoId: m.conjuntoId
                }))
            }))
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medidas_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showNotification('Backup exportado com sucesso!');
    }

    importMedidasJSON(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.medidas || !Array.isArray(data.medidas)) {
                    throw new Error('Formato de arquivo inválido: Propriedade "medidas" ausente ou não é um array.');
                }
                
                this._loadDataFromParsedJson(data);
                await this.saveToServer();
                this.notifyObservers();
                this.showNotification('Medidas importadas com sucesso!');
            } catch (error) {
                console.error('Erro ao importar medidas:', error);
                this.showNotification('Erro ao importar medidas! Verifique o formato do arquivo.', 'error');
            }
        };
        reader.readAsText(file);
    }
}
const medidasModel = new MedidasModel();

class FormHandler {
    constructor() {
        this.form = document.getElementById('medida-form');
        this.formGroups = document.querySelectorAll('.form-group');
        this.addButton = document.querySelector('.btn-adicionar');
        this.tableBody = document.querySelector('.medidas-table tbody');
        
        this.initializeFormHandlers();
        this.setupFormAnimation();

        medidasModel.addObserver(() => {
            medidasModel.renderMedidas();
            console.log("FormHandler observou mudança, re-renderizando medidas.");
        });
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
                
                if (input.value) { group.classList.add('filled'); if (checkIcon) checkIcon.style.opacity = '1'; }
                input.addEventListener('input', () => {
                    if (input.value) {
                        group.classList.add('filled');
                        if (checkIcon) {
                            checkIcon.style.opacity = '1';
                            checkIcon.style.transform = 'scale(1.2)';
                            setTimeout(() => { checkIcon.style.transform = 'scale(1)'; }, 200);
                        }
                    } else {
                        group.classList.remove('filled');
                        if (checkIcon) checkIcon.style.opacity = '0';
                    }
                });
                input.addEventListener('focus', () => { group.classList.add('focused'); });
                input.addEventListener('blur', () => { group.classList.remove('focused'); });
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
        this.form.classList.add('form-entrance');
        this.formGroups.forEach((group, index) => {
            group.style.opacity = '0';
            group.style.transform = 'translateY(20px)';
            setTimeout(() => {
                group.style.opacity = '1';
                group.style.transform = 'translateY(0)';
            }, 100 * index);
        });
    }

    async setupFormSubmission() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(this.form);
            const medida = new Medida(
                formData.get('tipo'),
                formData.get('titulo'),
                formData.get('nome'),
                parseFloat(formData.get('valor')),
                formData.get('unidade')
            );

            if (medida.isValid()) {
                try {
                    await medidasModel.adicionarMedida(medida);
                    this.form.reset();
                    this.formGroups.forEach(group => {
                        group.classList.remove('filled');
                        const checkIcon = group.querySelector('.ph-check-circle');
                        if (checkIcon) checkIcon.style.opacity = '0';
                    });
                    medidasModel.showNotification('Medida adicionada com sucesso!');
                } catch (error) {
                    console.error('Erro ao adicionar medida via modelo:', error);
                    medidasModel.showNotification('Erro ao adicionar medida!', 'error');
                }
            } else {
                medidasModel.showNotification('Por favor, preencha todos os campos corretamente.', 'error');
            }
        });
    }
}

let formHandler;
document.addEventListener('DOMContentLoaded', () => {
    formHandler = new FormHandler();
});