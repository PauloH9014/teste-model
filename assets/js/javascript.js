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

    async init() {
        await this.loadFromPackageJson()
        this.renderMedidas()
        
        // Configurar listener do formulário
        const form = document.getElementById('medida-form')
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e))
        }
    }

    async loadFromPackageJson() {
        try {
            const response = await fetch('package.json')
            const data = await response.json()
            
            if (data.medidasCadastro) {
                // Restaurar conjuntos
                if (data.medidasCadastro.conjuntos) {
                    this.conjuntos = data.medidasCadastro.conjuntos.map(conjuntoData => {
                        const conjunto = new ConjuntoMedidas(conjuntoData.titulo)
                        conjunto.id = conjuntoData.id
                        conjunto.dataCriacao = new Date(conjuntoData.dataCriacao)
                        conjunto.ultimaAtualizacao = new Date(conjuntoData.ultimaAtualizacao)
                        return conjunto
                    })
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
                        )
                        medida.id = medidaData.id
                        medida.dataCadastro = new Date(medidaData.dataCadastro)
                        medida.conjuntoId = medidaData.conjuntoId
                        return medida
                    })
                }
            }
        } catch (error) {
            console.error('Erro ao carregar dados do package.json:', error)
            // Fallback para localStorage
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
                    console.error('Erro ao carregar dados do localStorage:', error)
                    this.medidas = []
                    this.conjuntos = []
                }
            }
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
        dataCadastro: medida.dataCadastro.toISOString()
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
  }

  importMedidasJSON(file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (data.medidas) {
          this.medidas = data.medidas.map(data => {
            const medida = new Medida(data.tipo, data.titulo, data.nome, data.valor, data.unidade)
            medida.id = data.id
            medida.dataCadastro = new Date(data.dataCadastro)
            return medida
          })
          this.saveToStorage()
          this.renderMedidas()
          this.showNotification('Medidas importadas com sucesso!')
        }
      } catch (error) {
        console.error('Erro ao importar medidas:', error)
        this.showNotification('Erro ao importar medidas!', 'error')
      }
    }
    reader.readAsText(file)
  }

  async saveMedidas() {
    try {
      const data = {
        medidas: this.medidas.map(medida => ({
          id: medida.id,
          tipo: medida.tipo,
          titulo: medida.titulo,
          nome: medida.nome,
          valor: medida.valor,
          unidade: medida.unidade,
          dataCadastro: medida.dataCadastro.toISOString()
        }))
      }

      const response = await fetch(this.arquivo, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data, null, 2)
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar medidas')
      }
    } catch (error) {
      console.error('Erro ao salvar medidas:', error)
      // Fallback para localStorage em caso de erro
      localStorage.setItem('medidas', JSON.stringify(this.medidas))
    }
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

  addObserver(observer) {
    this.observers.push(observer)
  }

  notifyObservers() {
    this.observers.forEach((observer) => observer(this.medidas))
    this.saveToStorage()
    this.renderMedidas()
  }

  salvarMedidas() {
    try {
      localStorage.setItem('medidas', JSON.stringify(this.medidas))
      
      // Gerar arquivo de backup
      const dados = {
        medidas: this.medidas,
        lastUpdate: new Date().toISOString(),
        config: {
          versao: "1.0"
        }
      }
      
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'medidas_backup.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      this.showNotification('Medidas salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar medidas:', error)
      this.showNotification('Erro ao salvar medidas', 'error')
    }
  }

  adicionarMedida(medida) {
    if (!medida.isValid()) {
      throw new Error("Dados da medida são inválidos")
    }

    this.medidas.push(medida)
    this.salvarMedidas()
    this.notifyObservers()
    this.renderMedidas()
  }

  async adicionarMedida(medida) {
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

    await this.saveMedidas()
    this.notifyObservers()
    this.renderMedidas()
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
          const novoConjunto = new ConjuntoMedidas(medida.titulo)
          novoConjunto.id = medida.conjuntoId
          conjuntos.set(medida.conjuntoId, novoConjunto)
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
    if (!tableBody) return

    // Limpar tabela atual
    tableBody.innerHTML = ''

    // Agrupar medidas por conjunto
    const conjuntos = this.agruparMedidasPorConjunto()

    // Ordenar conjuntos por data (mais recentes primeiro)
    const conjuntosOrdenados = [...conjuntos.values()].sort((a, b) => 
      b.dataCriacao.getTime() - a.dataCriacao.getTime()
    )

    conjuntosOrdenados.forEach(conjunto => {
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

      // Animação de entrada
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
  }

  removerMedida(id) {
    const index = this.medidas.findIndex(m => m.id === id)
    if (index === -1) return

    const row = document.querySelector(`tr[data-id="${id}"]`)
    if (row) {
      // Animar saída
      row.style.transition = 'all 0.3s ease-in'
      row.style.opacity = '0'
      row.style.transform = 'translateX(50px)'

      setTimeout(() => {
        this.medidas.splice(index, 1)
        this.salvarMedidas()
        this.notifyObservers()
        this.showNotification('Medida removida com sucesso!')
      }, 300)
    }
  }

  showNotification(message) {
    const notification = document.createElement('div')
    notification.className = 'notification'
    notification.innerHTML = `
      <i class="ph ph-check-circle"></i>
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
    }, 3000)
  }
}

class MedidasView {
  constructor() {
    this.form = document.getElementById("medida-form")
    this.tipoSelect = document.getElementById("tipo-conjunto")
    this.tituloInput = document.getElementById("titulo-conjunto")
    this.nomeInput = document.getElementById("nome-medida")
    this.valorInput = document.getElementById("valor-medida")
    this.unidadeSelect = document.getElementById("unidade-medida")
    this.tbody = document.getElementById("medidas-tbody")
    this.emptyState = document.getElementById("empty-state")
    this.table = document.getElementById("medidas-table")
    
    // Debug: Verificar se os elementos foram encontrados
    console.log('Elementos do DOM:', {
      form: this.form,
      tbody: this.tbody,
      table: this.table,
      emptyState: this.emptyState
    })

    // Adiciona placeholders dinâmicos
    this.setupDynamicPlaceholders()
    
    // Configura animações
    this.setupAnimations()
  }

  setupAnimations() {
    // Configurar animações com Framer Motion
    const { motion, animate } = window.Framer
    
    // Animar elementos da tabela quando adicionados
    this.animateElement = (element) => {
      animate(element, 
        { opacity: [0, 1], y: [20, 0] },
        { duration: 0.5, ease: "easeOut" }
      )
    }
  }

  setupDynamicPlaceholders() {
    this.tipoSelect.addEventListener('change', () => {
      const tipo = this.tipoSelect.value
      if (tipo === 'conjunto') {
        this.tituloInput.placeholder = "Ex: Conjunto Verão, Uniforme Escolar..."
      } else {
        this.tituloInput.placeholder = "Ex: Vestido Festa, Calça Social..."
      }
    })
  }

  setupFormValidation() {
    // Validação do valor em tempo real
    this.valorInput.addEventListener('input', (e) => {
      const valor = parseFloat(e.target.value)
      if (valor <= 0) {
        this.valorInput.setCustomValidity('O valor deve ser maior que zero')
      } else {
        this.valorInput.setCustomValidity('')
      }
    })

    // Validação do título em tempo real
    this.tituloInput.addEventListener('input', (e) => {
      if (e.target.value.trim().length < 3) {
        this.tituloInput.setCustomValidity('O título deve ter pelo menos 3 caracteres')
      } else {
        this.tituloInput.setCustomValidity('')
      }
    })

    // Validação antes do envio
    this.form.addEventListener('invalid', (e) => {
      e.preventDefault()
      this.showError('Por favor, preencha todos os campos corretamente')
    }, true)
  }

  bindEvents(onSubmit, onRemove) {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault()
      const formData = this.getFormData()
      console.log('Dados do formulário:', formData) // Debug: Mostra dados do formulário
      onSubmit(formData)
    })

    this.tbody.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-remover")) {
        const id = e.target.dataset.id
        console.log('Tentando remover item:', id) // Debug: Mostra ID do item a ser removido
        if (confirm("Tem certeza que deseja remover esta medida?")) {
          onRemove(id)
        }
      }
    })
  }

  getFormData() {
    return {
      tipo: document.getElementById('tipo-conjunto').value,
      titulo: document.getElementById('titulo-conjunto').value.trim(),
      nome: this.nomeInput.value,
      valor: this.valorInput.value,
      unidade: this.unidadeSelect.value,
    }
  }

  clearForm() {
    this.form.reset()
    this.nomeInput.focus()
  }

  renderMedidas(medidas) {
    console.log('Renderizando medidas:', medidas) // Debug
    
    // Limpa a tabela
    this.tbody.innerHTML = ""
    
    if (!medidas || medidas.length === 0) {
      console.log('Sem medidas para mostrar') // Debug
      this.emptyState.classList.remove("hidden")
      this.table.style.display = "none"
      return
    } else {
      console.log('Mostrando medidas na tabela') // Debug
      this.emptyState.classList.add("hidden")
      this.table.style.display = "table"
    }

    // Renderiza cada medida
    medidas.forEach((medida) => {
      console.log('Criando linha para medida:', medida) // Debug
      const row = this.createMedidaRow(medida)
      this.tbody.appendChild(row)
      // Aplica animação se disponível
      if (typeof this.animateElement === 'function') {
        this.animateElement(row)
      }
    })
  }

  agruparMedidas(medidas) {
    return medidas.reduce((grupos, medida) => {
      const titulo = medida.titulo
      if (!grupos[titulo]) {
        grupos[titulo] = []
      }
      grupos[titulo].push(medida)
      return grupos
    }, {})
  }

  createMedidaRow(medida) {
    const row = document.createElement("tr")
    const tipoClasse = medida.tipo === 'conjunto' ? 'conjunto-header' : 'peca-individual'
    row.classList.add(tipoClasse)
    row.innerHTML = `
            <td>
                <div class="medida-info">
                    <strong>${this.escapeHtml(medida.titulo)}</strong>
                    <span class="tipo-medida">${this.formatarNomeMedida(medida.nome)}</span>
                </div>
            </td>
            <td>${medida.valor.toFixed(1)}</td>
            <td>${this.escapeHtml(medida.unidade)}</td>
            <td>${medida.getDataFormatada()}</td>
            <td>
                <button class="btn-remover" data-id="${medida.id}">
                    <span class="material-icons">delete_outline</span>
                    Remover
                </button>
            </td>
        `
    return row
  }

  formatarNomeMedida(nome) {
    const nomes = {
      'cintura': 'Cintura',
      'quadril': 'Quadril',
      'busto': 'Busto',
      'ombro': 'Ombro',
      'manga': 'Comprimento Manga',
      'comprimento': 'Comprimento Total',
      'pescoco': 'Pescoço',
      'punho': 'Punho',
      'coxa': 'Coxa',
      'panturrilha': 'Panturrilha',
      'tornozelo': 'Tornozelo'
    }
    return this.escapeHtml(nomes[nome] || nome)
  }

  escapeHtml(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  showError(message) {
    const errorDiv = document.createElement('div')
    errorDiv.className = 'notification error'
    errorDiv.innerHTML = `
      <span class="material-icons">error_outline</span>
      <p>${message}</p>
    `
    document.body.appendChild(errorDiv)
    
    setTimeout(() => {
      errorDiv.classList.add('show')
      setTimeout(() => {
        errorDiv.classList.remove('show')
        setTimeout(() => errorDiv.remove(), 300)
      }, 3000)
    }, 100)
  }

  showSuccess(message) {
    const successDiv = document.createElement('div')
    successDiv.className = 'notification success'
    successDiv.innerHTML = `
      <span class="material-icons">check_circle_outline</span>
      <p>${message}</p>
    `
    document.body.appendChild(successDiv)
    
    setTimeout(() => {
      successDiv.classList.add('show')
      setTimeout(() => {
        successDiv.classList.remove('show')
        setTimeout(() => successDiv.remove(), 300)
      }, 3000)
    }, 100)
  }
}

class MedidasController {
  constructor(model, view) {
    this.model = model
    this.view = view
    this.init()
  }

  init() {
    // Renderiza as medidas iniciais do localStorage
    this.view.renderMedidas(this.model.getMedidas())
    
    // Configura os observers para atualização automática
    this.model.addObserver((medidas) => {
      this.view.renderMedidas(medidas)
    })

    // Vincula os eventos do formulário e botões
    this.view.bindEvents(
      (formData) => this.handleAddMedida(formData),
      (id) => this.handleRemoveMedida(id)
    )

    // Configura validação em tempo real do formulário
    this.view.setupFormValidation()
  }

  handleAddMedida(formData) {
    try {
      console.log('Tentando adicionar medida:', formData) // Debug
      this.model.adicionarMedida(
        formData.tipo,
        formData.titulo,
        formData.nome,
        formData.valor,
        formData.unidade
      )
      console.log('Medidas após adição:', this.model.getMedidas()) // Debug
      this.view.clearForm()
      this.view.showSuccess("Medida adicionada com sucesso!")
    } catch (error) {
      console.error('Erro ao adicionar medida:', error) // Debug
      this.view.showError(error.message)
    }
  }

  handleRemoveMedida(id) {
    try {
      this.model.removerMedida(id)
      this.view.showSuccess("Medida removida com sucesso!")
    } catch (error) {
      this.view.showError(error.message)
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const model = new MedidasModel()
  const view = new MedidasView()
  const controller = new MedidasController(model, view)
  console.log("Aplicação de Gerenciamento de Medidas inicializada.")}
)