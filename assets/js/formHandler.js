class ConjuntoMedidas {
    constructor(titulo) {
        this.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        this.titulo = titulo;
        this.medidas = [];
        this.dataCriacao = new Date();
        this.ultimaAtualizacao = new Date();
    }

    adicionarMedida(medida) {
        if (!this.medidas.find(m => m.id === medida.id)) {
            medida.conjuntoId = this.id;
            this.medidas.push(medida);
        }
        this.ultimaAtualizacao = new Date();
    }

    getDataFormatada() {
        return this.dataCriacao.toLocaleDateString("pt-BR");
    }

    getUltimaAtualizacaoFormatada() {
        return this.ultimaAtualizacao.toLocaleDateString("pt-BR");
    }
}

class Medida {
    constructor(titulo, nome, valor, unidade) {
        this.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        this.titulo = titulo;
        this.nome = nome;
        this.valor = Number.parseFloat(valor);
        this.unidade = unidade;
        this.dataCadastro = new Date();
        this.conjuntoId = null;
    }

    getDataFormatada() {
        return this.dataCadastro.toLocaleDateString("pt-BR");
    }

    isValid() {
        return (
            this.titulo && this.titulo.trim().length > 0 &&
            this.nome && this.nome.trim().length > 0 &&
            !isNaN(this.valor) && this.valor > 0 &&
            this.unidade && this.unidade.trim().length > 0
        );
    }
}

class MedidasModel {
    constructor() {
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
        }
    }

    _loadDataFromParsedJson(data) {
        this.conjuntos = [];

        if (data.conjuntos && Array.isArray(data.conjuntos)) {
            this.conjuntos = data.conjuntos.map(conjuntoData => {
                const conjunto = new ConjuntoMedidas(conjuntoData.titulo);
                conjunto.id = conjuntoData.id;
                conjunto.dataCriacao = new Date(conjuntoData.dataCriacao);
                conjunto.ultimaAtualizacao = new Date(conjuntoData.ultimaAtualizacao);
                conjunto.medidas = (conjuntoData.medidas || []).map(medidaData => {
                    const medida = new Medida(
                        medidaData.titulo, medidaData.nome,
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
    }

    async saveToServer() {
        const dataToSave = {
            conjuntos: this.conjuntos
        };
        localStorage.setItem('medidas_app_data', JSON.stringify(dataToSave));
    }

    async adicionarMedida(medida) {
        if (!medida.isValid()) {
            throw new Error("Dados da medida são inválidos.");
        }

        let conjuntoExistente = this.conjuntos.find(c => c.titulo === medida.titulo);
        if (!conjuntoExistente) {
            conjuntoExistente = new ConjuntoMedidas(medida.titulo);
            this.conjuntos.push(conjuntoExistente);
        }
        conjuntoExistente.adicionarMedida(medida);

        await this.saveToServer();
        this.notifyObservers();
    }

    async removerMedida(id) {
        this.conjuntos.forEach(conjunto => {
            conjunto.medidas = conjunto.medidas.filter(m => m.id !== id);
        });

        this.conjuntos = this.conjuntos.filter(c => c.medidas.length > 0);

        await this.saveToServer();
        this.notifyObservers();
    }
    
    downloadMedidasJSON() {
        const dataStr = JSON.stringify({ conjuntos: this.conjuntos }, null, 4);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'medidas_export.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    importMedidasJSON(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                this._loadDataFromParsedJson(json);
                this.saveToServer();
                this.notifyObservers();
                 alert('Medidas importadas com sucesso!');
            } catch (error) {
                console.error("Erro ao importar o arquivo JSON:", error);
                alert('Erro ao importar o arquivo. Verifique o formato do JSON.');
            }
        };
        reader.readAsText(file);
    }


    renderMedidas() {
        const tableBody = document.querySelector('.medidas-table tbody');
        const table = document.querySelector('.medidas-table');
        const emptyState = document.getElementById('empty-state');
        
        if (!tableBody) return;

        if (this.conjuntos.length === 0) {
            table.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            tableBody.innerHTML = '';
            return;
        } else {
            table.style.display = 'table';
            if (emptyState) emptyState.style.display = 'none';
        }

        tableBody.innerHTML = '';

        this.conjuntos.forEach(conjunto => {
            if (conjunto.medidas.length === 0) return;

            const headerRow = document.createElement('tr');
            headerRow.className = 'conjunto-header';
            headerRow.innerHTML = `
                <td colspan="6">
                    <div class="conjunto-info">
                        <h3>${conjunto.titulo}</h3>
                    </div>
                </td>
            `;
            tableBody.appendChild(headerRow);

            conjunto.medidas.forEach((medida, index) => {
                const row = document.createElement('tr');
                row.dataset.id = medida.id;

                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${medida.nome}</td>
                    <td>${medida.valor}</td>
                    <td>${medida.unidade}</td>
                    <td>${medida.getDataFormatada()}</td>
                    <td>
                        <button type="button" class="button red" title="Remover" onclick="medidasModel.removerMedida('${medida.id}')">
                            <i class="ph-bold ph-trash"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        });
    }

    addObserver(observer) {
        this.observers.push(observer);
        observer();
    }

    notifyObservers() {
        this.observers.forEach(observer => observer());
    }
}

const medidasModel = new MedidasModel();

class FormHandler {
    constructor() {
        this.form = document.getElementById('medida-form');
        this.formGroups = document.querySelectorAll('.form-group');
        this.addButton = document.querySelector('.btn-adicionar');
        
        this.initializeFormHandlers();

        medidasModel.addObserver(() => {
            medidasModel.renderMedidas();
        });
    }

    initializeFormHandlers() {
        this.setupFormSubmission();
    }

    async setupFormSubmission() {
        this.form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(this.form);
            const medida = new Medida(
                formData.get('titulo'),
                formData.get('nome'),
                parseFloat(formData.get('valor')),
                formData.get('unidade')
            );

            if (medida.isValid()) {
                await medidasModel.adicionarMedida(medida);
                this.form.reset();
            }
        });
    }
}

let formHandler;
document.addEventListener('DOMContentLoaded', () => {
    formHandler = new FormHandler();
});

