const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const fs = require('fs').promises;

// Configura��o do CORS
app.use(cors());
app.use(express.static(__dirname));
app.use(express.json());

// Rota para salvar medidas
app.post('/assets/data/medidas.json', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'assets', 'data', 'medidas.json');
        // Lê o arquivo atual primeiro
        let currentData = { version: "1.0.0", medidas: [] };
        try {
            const fileContent = await fs.readFile(filePath, 'utf8');
            currentData = JSON.parse(fileContent);
        } catch (err) {
            console.log('Arquivo não existe, será criado');
        }

        // Atualiza com os novos dados
        const newData = {
            ...currentData,
            lastUpdate: new Date().toISOString(),
            medidas: req.body.medidas || []
        };

        // Salva o arquivo
        await fs.writeFile(filePath, JSON.stringify(newData, null, 2), 'utf8');
        res.json({ success: true, data: newData });
    } catch (error) {
        console.error('Erro ao salvar medidas:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao salvar medidas' 
        });
    }
});

// Rota para ler medidas
app.get('/assets/data/medidas.json', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'assets', 'data', 'medidas.json');
        try {
            const data = await fs.readFile(filePath, 'utf8');
            res.json(JSON.parse(data));
        } catch (err) {
            // Se o arquivo não existir, retorna um objeto vazio
            res.json({
                version: "1.0.0",
                lastUpdate: new Date().toISOString(),
                medidas: []
            });
        }
    } catch (error) {
        console.error('Erro ao ler medidas:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Erro ao ler medidas' 
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse http://localhost:${PORT} para ver a aplica��o`);
});
