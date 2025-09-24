# 📏 Gerenciador de Medidas Corporais

Um aplicativo web para gerenciar medidas corporais, desenvolvido com Node.js e Express no backend e HTML/JavaScript no frontend.

## 🚀 Configuração Inicial

### Pré-requisitos

- Node.js (versão recomendada: 14.x ou superior)
- npm (gerenciador de pacotes do Node.js)

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/teste-model.git
   ```
2. selecione a Pasta:
   ```bash
   cd teste-model
   ```

3. Instale as dependências:
   ```bash
   npm install
   ```

4. Inicie o servidor:
   ```bash
   node server.js
   ```

5. Acesse: http://localhost:3000

## 📁 Estrutura do Projeto

```
teste-model/
├── assets/
│   ├── css/
│   │   └── style.css
│   ├── data/
│   │   └── medidas.json
│   ├── img/
│   │   ├── fediverse-logo.svg
│   │   └── ruler.svg
│   └── js/
│       ├── formHandler.js
│       
├── index.html
├── package.json
├── server.js
└── README.md
```

## � Tecnologias Utilizadas

- Backend:
  - Node.js
  - Express.js
  - CORS middleware
  - File System para persistência

- Frontend:
  - HTML5
  - CSS3
  - JavaScript (Vanilla)
  - Fetch API para requisições

## �📱 Como Usar

### 1. Adicionando uma Nova Medida

#### Passo a Passo:

1. **Escolha o Tipo**
   - 👕 **Peça Individual**: Para uma única peça (ex: vestido, calça)
   - 👔 **Conjunto de Peças**: Para múltiplas peças relacionadas (ex: uniforme)

2. **Digite o Nome/Título**
   - Para peça individual: "Vestido de Festa", "Calça Social"
   - Para conjunto: "Uniforme Escolar", "Conjunto Verão"

3. **Selecione o Tipo da Medida**
   - Escolha entre:
     - Cintura
     - Quadril
     - Busto
     - Ombro
     - Comprimento Manga
     - Comprimento Total
     - Pescoço
     - Punho
     - Coxa
     - Panturrilha
     - Tornozelo

4. **Insira o Valor**
   - Digite o número da medida
   - Use ponto (.) para decimais
   - Exemplo: 75.5

5. **Escolha a Unidade**
   - Centímetros (cm)
   - Milímetros (mm)
   - Polegadas (pol)
   - Metros (m)

6. **Salve a Medida**
   - Clique no botão roxo "Adicionar Medida"
   - Uma mensagem verde confirmará o sucesso

### 2. Visualizando as Medidas

- Todas as medidas aparecem na tabela "Medidas Cadastradas"
- Organizadas por peça/conjunto
- Informações mostradas:
  - Nome da Peça/Conjunto
  - Tipo da Medida
  - Valor
  - Unidade
  - Data de Cadastro

### 3. Removendo Medidas

1. Localize a medida na tabela
2. Clique no botão "Remover"
3. Confirme a remoção quando solicitado

## 💡 Dicas Úteis

- **Salvamento Automático**: Suas medidas são salvas automaticamente
- **Organização**: Use nomes descritivos para encontrar facilmente depois
- **Conjuntos**: Agrupe medidas relacionadas usando a opção "Conjunto de Peças"
- **Validação**: O sistema impede valores inválidos ou campos vazios

## 🎯 Recursos

- ✨ Interface moderna e fácil de usar
- 📱 Funciona em computadores e celulares
- 💾 Salvamento automático
- 🗂️ Organização por peças e conjuntos
- 🔄 Atualização em tempo real
- 🎨 Design intuitivo

## 🔄 API Endpoints

### GET `/assets/data/medidas.json`
- Retorna todas as medidas salvas
- Formato de resposta: JSON
- Status code:
  - 200: Sucesso
  - 500: Erro ao ler arquivo

### POST `/assets/data/medidas.json`
- Salva novas medidas
- Corpo da requisição: JSON com medidas
- Status code:
  - 200: Sucesso
  - 500: Erro ao salvar

## ❓ Perguntas Frequentes

### As medidas são salvas automaticamente?
Sim! Todas as medidas são salvas no arquivo medidas.json através da API.

### Posso editar uma medida já cadastrada?
No momento, não é possível editar. Você precisa remover e adicionar novamente.

### Onde ficam armazenadas as medidas?
As medidas são armazenadas no servidor em `/assets/data/medidas.json`.

### Tem limite de medidas que posso cadastrar?
Não há limite! O limite depende apenas do espaço em disco do servidor.

## 🛠️ Suporte

Se encontrar algum problema:
1. Verifique se o servidor está rodando
2. Confirme que a porta 3000 está disponível
3. Verifique os logs do servidor
4. Verifique as permissões do arquivo medidas.json
2. Tente recarregar a página
3. Se o problema persistir, limpe o histórico do navegador e tente novamente

---

💜 Desenvolvido para facilitar seu trabalho com medidas
