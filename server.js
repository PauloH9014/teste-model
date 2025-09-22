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

// Rota para obter medidas do package.json
app.get('/api/medidas', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'package.json'), 'utf8');
        const packageData = JSON.parse(data);
        res.json(packageData.medidasCadastro || { conjuntos: [], medidas: [] });
    } catch (error) {
        console.error('Erro ao ler package.json:', error);
        res.status(500).json({ error: 'Erro ao ler medidas' });
    }
});

// Rota para salvar medidas no package.json
app.post('/api/medidas', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'package.json'), 'utf8');
        const packageData = JSON.parse(data);
        
        // Atualizar apenas a seção medidasCadastro
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
        console.error('Erro ao salvar no package.json:', error);
        res.status(500).json({ error: 'Erro ao salvar medidas' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
