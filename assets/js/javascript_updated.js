class ConjuntoMedidas {
    constructor(titulo) {
        this.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        this.titulo = titulo;
        this.medidas = [];
        this.dataCriacao = new Date();
        this.ultimaAtualizacao = new Date();
    }

    adicionarMedida(medida) {
        medida.conjuntoId = this.id;
        this.medidas.push(medida);
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
    constructor(tipo, titulo, nome, valor, unidade) {
        this.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        this.tipo = tipo;
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
            this.tipo &&
            this.tipo.trim().length > 0 &&
            this.titulo &&
            this.titulo.trim().length > 0 &&
            this.nome &&
            this.nome.trim().length > 0 &&
            !isNaN(this.valor) &&
            this.valor > 0 &&
            this.unidade &&
            this.unidade.trim().length > 0
        );
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
        await this.loadFromPackageJson();
        await this.loadFromMedidasJson();
        this.renderMedidas();
        
        // Configurar listener do formulário
        const form = document.getElementById('medida-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }
    }

    async loadFromPackageJson() {
        try {
            const response = await fetch('package.json');
            const data = await response.json();
            
            if (data.medidasCadastro) {
                // Restaurar conjuntos
                if (data.medidasCadastro.conjuntos) {
                    this.conjuntos = data.medidasCadastro.conjuntos.map(conjuntoData => {
                        const conjunto = new ConjuntoMedidas(conjuntoData.titulo);
                        conjunto.id = conjuntoData.id;
                        conjunto.dataCriacao = new Date(conjuntoData.dataCriacao);
                        conjunto.ultimaAtualizacao = new Date(conjuntoData.ultimaAtualizacao);
                        return conjunto;
                    });
                }

                // Restaurar medidas
                if (data.medidasCadastro.medidas) {
                    this.medidas = data.medidasCadastro.medidas.map(medidaData => {
                        const medida = new Medida(
                            medidaData.tipo,
                            medidaData.titulo,
                            medidaData.nome,
                            medidaData.valor,
                            medidaData.unidade
                        );
                        medida.id = medidaData.id;
                        medida.dataCadastro = new Date(medidaData.dataCadastro);
                        medida.conjuntoId = medidaData.conjuntoId;
                        return medida;
                    });
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados do package.json:', error);
        }
    }
    
    async loadFromMedidasJson() {
        try {
            const response = await fetch('/assets/data/medidas.json');
            const data = await response.json();
            
            if (data.medidas && Array.isArray(data.medidas)) {
                const newMedidas = data.medidas.map(medidaData => {
                    const medida = new Medida(
                        medidaData.tipo,
                        medidaData.titulo,
                        medidaData.nome,
                        medidaData.valor,
                        medidaData.unidade
                    );
                    medida.id = medidaData.id;
                    medida.dataCadastro = new Date(medidaData.dataCadastro);
                    medida.conjuntoId = medidaData.conjuntoId;
                    return medida;
                });
                
                // Merge com as medidas existentes, evitando duplicatas
                this.medidas = [...new Map([...this.medidas, ...newMedidas].map(item => [item.id, item])).values()];
            }
        } catch (error) {
            console.error('Erro ao carregar dados do medidas.json:', error);
        }
    }

    async saveToStorage() {
        try {
            // Preparar dados para medidas.json
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
                }))
            };

            // Salvar no localStorage como backup
            localStorage.setItem('medidas', JSON.stringify({
                medidas: this.medidas,
                conjuntos: this.conjuntos
            }));
            
            // Salvar no arquivo medidas.json usando o servidor
            const response = await fetch('/assets/data/medidas.json', {
                method: 'POST', // Mudado para POST pois é mais comum em servidores
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data, null, 2)
            });
            
            if (!response.ok) {
                throw new Error('Falha ao salvar no arquivo medidas.json');
            }

            const responseData = await response.json();
            if (responseData.success) {
                this.showNotification('Medidas salvas com sucesso!', 'success');
            }

            // Notificar observadores
            this.notifyObservers();
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            this.showNotification('Erro ao salvar dados: ' + error.message, 'error');
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const medida = new Medida(
            formData.get('tipo'),
            formData.get('titulo'),
            formData.get('nome'),
            formData.get('valor'),
            formData.get('unidade')
        );
        
        if (!medida.isValid()) {
            this.showNotification('Por favor, preencha todos os campos corretamente.', 'error');
            return;
        }

        if (formData.get('tipo') === 'conjunto') {
            // Criar ou recuperar conjunto
            let conjunto = this.conjuntos.find(c => c.titulo === formData.get('titulo'));
            if (!conjunto) {
                conjunto = new ConjuntoMedidas(formData.get('titulo'));
                this.conjuntos.push(conjunto);
            }
            conjunto.adicionarMedida(medida);
        }

        this.medidas.push(medida);
        await this.saveToStorage(); // Aguardar o salvamento ser concluído
        this.renderMedidas();
        e.target.reset();
        
        this.showNotification('Medida adicionada com sucesso!');

        // Animar campos do formulário
        document.querySelectorAll('.form-group').forEach(group => {
            group.classList.remove('filled');
        });
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
    }

    importMedidasJSON(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.medidas) {
                    this.medidas = data.medidas.map(medidaData => {
                        const medida = new Medida(
                            medidaData.tipo,
                            medidaData.titulo,
                            medidaData.nome,
                            medidaData.valor,
                            medidaData.unidade
                        );
                        medida.id = medidaData.id;
                        medida.dataCadastro = new Date(medidaData.dataCadastro);
                        medida.conjuntoId = medidaData.conjuntoId;
                        return medida;
                    });
                    await this.saveToStorage();
                    this.renderMedidas();
                    this.showNotification('Medidas importadas com sucesso!');
                }
            } catch (error) {
                console.error('Erro ao importar medidas:', error);
                this.showNotification('Erro ao importar medidas!', 'error');
            }
        };
        reader.readAsText(file);
    }

    renderMedidas() {
        const tableBody = document.querySelector('.medidas-table tbody');
        const table = document.querySelector('.medidas-table');
        const emptyState = document.getElementById('empty-state');
        
        if (!tableBody) return;

        // Limpar tabela atual
        tableBody.innerHTML = '';

        // Mostrar estado vazio se não houver medidas
        if (this.medidas.length === 0) {
            if (table) table.style.display = 'none';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }

        // Mostrar tabela e esconder estado vazio
        if (table) table.style.display = 'table';
        if (emptyState) emptyState.style.display = 'none';

        // Agrupar medidas por conjunto
        const conjuntos = this.agruparMedidasPorConjunto();

        // Ordenar conjuntos por data (mais recentes primeiro)
        const conjuntosOrdenados = [...conjuntos.values()].sort((a, b) => 
            b.dataCriacao.getTime() - a.dataCriacao.getTime()
        );

        // Renderizar cada conjunto e suas medidas
        conjuntosOrdenados.forEach(conjunto => {
            if (conjunto.medidas.length > 0) {
                this.renderConjunto(conjunto, tableBody);
            }
        });
    }

    renderConjunto(conjunto, tableBody) {
        // Criar cabeçalho do conjunto
        const headerRow = document.createElement('tr');
        headerRow.className = 'conjunto-header';
        headerRow.innerHTML = `
            <td colspan="6">
                <div class="conjunto-info">
                    <h3>${conjunto.titulo}</h3>
                    <span class="conjunto-data">Criado em ${conjunto.getDataFormatada()}</span>
                </div>
            </td>
        `;
        tableBody.appendChild(headerRow);

        // Renderizar medidas do conjunto
        conjunto.medidas.forEach((medida, index) => {
            const row = document.createElement('tr');
            row.dataset.id = medida.id;
            row.dataset.conjuntoId = conjunto.id;
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${medida.nome}</td>
                <td>${medida.valor}</td>
                <td>${medida.unidade}</td>
                <td>${medida.getDataFormatada()}</td>
                <td>
                    <button type="button" class="btn-remover" onclick="medidasModel.removerMedida('${medida.id}')">
                        <i class="ph ph-trash"></i>
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    agruparMedidasPorConjunto() {
        const conjuntos = new Map();

        // Primeiro, criar conjunto "Medidas Avulsas" para medidas sem conjunto
        const medidasAvulsas = new ConjuntoMedidas("Medidas Avulsas");
        medidasAvulsas.id = "avulsas";
        conjuntos.set(medidasAvulsas.id, medidasAvulsas);

        // Adicionar todos os conjuntos existentes
        this.conjuntos.forEach(conjunto => {
            conjuntos.set(conjunto.id, conjunto);
        });

        // Distribuir medidas nos conjuntos
        this.medidas.forEach(medida => {
            if (medida.conjuntoId && conjuntos.has(medida.conjuntoId)) {
                conjuntos.get(medida.conjuntoId).medidas.push(medida);
            } else {
                medidasAvulsas.medidas.push(medida);
            }
        });

        return conjuntos;
    }

    removerMedida(id) {
        const index = this.medidas.findIndex(m => m.id === id);
        if (index === -1) return;

        const medida = this.medidas[index];
        this.medidas.splice(index, 1);

        // Se a medida pertencia a um conjunto, atualizar o conjunto
        if (medida.conjuntoId) {
            const conjunto = this.conjuntos.find(c => c.id === medida.conjuntoId);
            if (conjunto) {
                const medidaIndex = conjunto.medidas.findIndex(m => m.id === id);
                if (medidaIndex !== -1) {
                    conjunto.medidas.splice(medidaIndex, 1);
                }
            }
        }

        this.saveToStorage();
        this.renderMedidas();
        this.showNotification('Medida removida com sucesso!');
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="ph ph-${type === 'success' ? 'check-circle' : 'x-circle'}"></i>
            ${message}
        `;

        document.body.appendChild(notification);

        // Animar entrada
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(20px)';
        
        requestAnimationFrame(() => {
            notification.style.transition = 'all 0.3s ease-out';
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });

        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    notifyObservers() {
        this.observers.forEach(observer => observer(this.medidas));
    }
}

// Inicializar a aplicação
const medidasModel = new MedidasModel();
app.put('/api/medidas', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'package.json'), 'utf8');
        const packageData = JSON.parse(data);
        packageData.medidasCadastro = {
            version: "1.0.0",
            lastUpdate: new Date().toISOString(),
            ...req.body
        };
        await fs.writeFile(
            path.join(__dirname, 'package.json'),
            JSON.stringify(packageData, null, 2),
            'utf8'
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao salvar medidas:', error);
        res.status(500).json({ error: 'Erro ao salvar medidas' });
    };
});