const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve arquivos estáticos do diretório atual

// Rota para obter medidas
app.get('/assets/data/medidas.json', async (req, res) => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'assets', 'data', 'medidas.json'), 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Erro ao ler medidas:', error);
    res.status(500).json({ error: 'Erro ao ler medidas' });
  }
});

// Rota para salvar medidas
app.post('/assets/data/medidas.json', async (req, res) => {
  try {
    await fs.writeFile(
      path.join(__dirname, 'assets', 'data', 'medidas.json'),
      JSON.stringify(req.body, null, 2),
      'utf8'
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar medidas:', error);
    res.status(500).json({ error: 'Erro ao salvar medidas' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
