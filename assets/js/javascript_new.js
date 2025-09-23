class ConjuntoMedidas {
    constructor(titulo) {
        this.id = Date.now().toString(36) + Math.random().toString(36).substr(2)
        this.titulo = titulo
        this.medidas = []
        this.dataCriacao = new Date()
        this.ultimaAtualizacao = new Date()
    }

    adicionarMedida(medida) {
        medida.conjuntoId = this.id
        this.medidas.push(medida)
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
        )
    }
}

class MedidasModel {
    constructor() {
        this.medidas = []
        this.conjuntos = []
        this.observers = []
        this.init()
    }

    init() {
        this.loadFromStorage()
        this.renderMedidas()
        
        // Configurar listener do formulário
        const form = document.getElementById('medida-form')
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e))
        }
    }

    loadFromStorage() {
        const dadosSalvos = localStorage.getItem('medidas')
        if (dadosSalvos) {
            try {
                const data = JSON.parse(dadosSalvos)
                
                // Restaurar conjuntos
                if (data.conjuntos) {
                    this.conjuntos = data.conjuntos.map(conjuntoData => {
                        const conjunto = new ConjuntoMedidas(conjuntoData.titulo)
                        conjunto.id = conjuntoData.id
                        conjunto.dataCriacao = new Date(conjuntoData.dataCriacao)
                        conjunto.ultimaAtualizacao = new Date(conjuntoData.ultimaAtualizacao)
                        return conjunto
                    })
                }

                // Restaurar medidas
                if (data.medidas) {
                    this.medidas = data.medidas.map(medidaData => {
                        const medida = new Medida(
                            medidaData.tipo,
                            medidaData.titulo,
                            medidaData.nome,
                            medidaData.valor,
                            medidaData.unidade
                        )
                        medida.id = medidaData.id
                        medida.dataCadastro = new Date(medidaData.dataCadastro)
                        medida.conjuntoId = medidaData.conjuntoId
                        return medida
                    })
                }
            } catch (error) {
                console.error('Erro ao carregar dados:', error)
                this.medidas = []
                this.conjuntos = []
            }
        }
    }

    async saveToStorage() {
        // Prepare data for localStorage
        const storageData = {
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
                ultimaAtualizacao: conjunto.ultimaAtualizacao.toISOString()
            }))
        }

        // Save to localStorage
        localStorage.setItem('medidas', JSON.stringify(storageData))

        // Prepare data for medidas.json
        const fileData = {
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
        }

        // Save to medidas.json file
        try {
            const response = await fetch('/assets/data/medidas.json', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(fileData, null, 2)
            });
            
            if (!response.ok) {
                console.error('Erro ao salvar no arquivo medidas.json');
            }
        } catch (error) {
            console.error('Erro ao salvar no arquivo medidas.json:', error);
        }
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
                ultimaAtualizacao: conjunto.ultimaAtualizacao.toISOString()
            }))
        }

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `medidas_backup_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        this.showNotification('Backup exportado com sucesso!')
    }

    importMedidasJSON(file) {
        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result)
                
                // Validar estrutura do arquivo
                if (!data.medidas || !Array.isArray(data.medidas)) {
                    throw new Error('Formato de arquivo inválido')
                }

                // Importar conjuntos
                if (data.conjuntos && Array.isArray(data.conjuntos)) {
                    this.conjuntos = data.conjuntos.map(conjuntoData => {
                        const conjunto = new ConjuntoMedidas(conjuntoData.titulo)
                        conjunto.id = conjuntoData.id
                        conjunto.dataCriacao = new Date(conjuntoData.dataCriacao)
                        conjunto.ultimaAtualizacao = new Date(conjuntoData.ultimaAtualizacao)
                        return conjunto
                    })
                }

                // Importar medidas
                this.medidas = data.medidas.map(medidaData => {
                    const medida = new Medida(
                        medidaData.tipo,
                        medidaData.titulo,
                        medidaData.nome,
                        medidaData.valor,
                        medidaData.unidade
                    )
                    medida.id = medidaData.id
                    medida.dataCadastro = new Date(medidaData.dataCadastro)
                    medida.conjuntoId = medidaData.conjuntoId
                    return medida
                })

                this.saveToStorage()
                this.renderMedidas()
                this.showNotification('Medidas importadas com sucesso!')
            } catch (error) {
                console.error('Erro ao importar medidas:', error)
                this.showNotification('Erro ao importar medidas! Verifique o formato do arquivo.', 'error')
            }
        }
        reader.readAsText(file)
    }

    handleFormSubmit(e) {
        e.preventDefault()
        const formData = new FormData(e.target)
        
        const medida = new Medida(
            formData.get('tipo'),
            formData.get('titulo'),
            formData.get('nome'),
            formData.get('valor'),
            formData.get('unidade')
        )

        if (medida.isValid()) {
            this.adicionarMedida(medida)
            e.target.reset()
            this.showNotification('Medida adicionada com sucesso!')
        }
    }

    adicionarMedida(medida) {
        if (!medida.isValid()) {
            throw new Error("Dados da medida são inválidos")
        }

        // Se for tipo "conjunto", criar novo conjunto
        if (medida.tipo === 'conjunto') {
            const novoConjunto = new ConjuntoMedidas(medida.titulo)
            novoConjunto.adicionarMedida(medida)
            this.conjuntos.push(novoConjunto)
        } else {
            this.medidas.push(medida)
        }

        this.saveToStorage()
        this.notifyObservers()
        this.renderMedidas()
    }

    removerMedida(id) {
        const index = this.medidas.findIndex(m => m.id === id)
        if (index === -1) {
            this.showNotification('Medida não encontrada!', 'error')
            return
        }

        const medida = this.medidas[index]
        const row = document.querySelector(`tr[data-id="${id}"]`)
        
        if (row) {
            // Animar saída
            row.style.transition = 'all 0.3s ease-in'
            row.style.opacity = '0'
            row.style.transform = 'translateX(50px)'

            setTimeout(() => {
                // Remover do conjunto se necessário
                if (medida.conjuntoId) {
                    const conjunto = this.conjuntos.find(c => c.id === medida.conjuntoId)
                    if (conjunto) {
                        const medidaIndex = conjunto.medidas.findIndex(m => m.id === id)
                        if (medidaIndex !== -1) {
                            conjunto.medidas.splice(medidaIndex, 1)
                        }
                    }
                }

                this.medidas.splice(index, 1)
                this.saveToStorage()
                this.notifyObservers()
                this.showNotification('Medida removida com sucesso!')
                this.renderMedidas()
            }, 300)
        }
    }

    agruparMedidasPorConjunto() {
        const conjuntos = new Map()

        // Primeiro, criar conjunto "Medidas Avulsas" para medidas sem conjunto
        const medidasAvulsas = new ConjuntoMedidas("Medidas Avulsas")
        medidasAvulsas.id = "avulsas"
        conjuntos.set(medidasAvulsas.id, medidasAvulsas)

        // Agrupar medidas em seus conjuntos
        this.medidas.forEach(medida => {
            if (medida.conjuntoId) {
                // Se a medida pertence a um conjunto
                if (!conjuntos.has(medida.conjuntoId)) {
                    const conjunto = this.conjuntos.find(c => c.id === medida.conjuntoId)
                    if (conjunto) {
                        conjuntos.set(medida.conjuntoId, conjunto)
                    } else {
                        const novoConjunto = new ConjuntoMedidas(medida.titulo)
                        novoConjunto.id = medida.conjuntoId
                        conjuntos.set(medida.conjuntoId, novoConjunto)
                    }
                }
                conjuntos.get(medida.conjuntoId).adicionarMedida(medida)
            } else {
                // Se a medida não tem conjunto, adicionar às medidas avulsas
                medidasAvulsas.adicionarMedida(medida)
            }
        })

        return conjuntos
    }

    renderMedidas() {
        const tableBody = document.querySelector('.medidas-table tbody')
        const table = document.querySelector('.medidas-table')
        const emptyState = document.getElementById('empty-state')
        
        if (!tableBody) return

        // Atualizar visibilidade da tabela/empty state
        if (this.medidas.length === 0) {
            table.style.display = 'none'
            emptyState.style.display = 'flex'
            return
        } else {
            table.style.display = 'table'
            emptyState.style.display = 'none'
        }

        // Limpar tabela atual
        tableBody.innerHTML = ''

        // Agrupar medidas por conjunto
        const conjuntos = this.agruparMedidasPorConjunto()

        // Ordenar conjuntos por data (mais recentes primeiro)
        const conjuntosOrdenados = [...conjuntos.values()].sort((a, b) => 
            b.dataCriacao.getTime() - a.dataCriacao.getTime()
        )

        conjuntosOrdenados.forEach(conjunto => {
            if (conjunto.medidas.length === 0) return

            // Criar cabeçalho do conjunto
            const headerRow = document.createElement('tr')
            headerRow.className = 'conjunto-header'
            headerRow.innerHTML = `
                <td colspan="6">
                    <div class="conjunto-info">
                        <h3>${conjunto.titulo}</h3>
                        <span class="conjunto-data">Criado em ${conjunto.getDataFormatada()}</span>
                    </div>
                </td>
            `
            tableBody.appendChild(headerRow)

            // Renderizar medidas do conjunto
            conjunto.medidas.forEach((medida, index) => {
                const row = document.createElement('tr')
                row.dataset.id = medida.id
                row.dataset.conjuntoId = conjunto.id

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
                `

                // Animar entrada
                row.style.opacity = '0'
                row.style.transform = 'translateY(20px)'
                
                tableBody.appendChild(row)

                // Aplicar animação
                requestAnimationFrame(() => {
                    row.style.transition = 'all 0.3s ease-out'
                    row.style.opacity = '1'
                    row.style.transform = 'translateY(0)'
                })
            })
        })
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div')
        notification.className = `notification ${type}`
        notification.innerHTML = `
            <i class="ph ph-${type === 'success' ? 'check-circle' : 'x-circle'}"></i>
            ${message}
        `

        document.body.appendChild(notification)

        // Animar entrada
        notification.style.opacity = '0'
        notification.style.transform = 'translateY(20px)'
        
        requestAnimationFrame(() => {
            notification.style.transition = 'all 0.3s ease-out'
            notification.style.opacity = '1'
            notification.style.transform = 'translateY(0)'
        })

        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.opacity = '0'
            notification.style.transform = 'translateY(-20px)'
            setTimeout(() => notification.remove(), 300)
        }, 3000)
    }

    addObserver(observer) {
        this.observers.push(observer)
    }

    notifyObservers() {
        this.observers.forEach(observer => observer(this.medidas))
    }
}

// Inicializar o modelo
const medidasModel = new MedidasModel()
