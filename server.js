const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const fs = require('fs').promises;
const MEDIDAS_FILE_PATH = path.join(__dirname, 'assets', 'data', 'medidas.json');

app.use(cors());

app.use(express.static(__dirname));

app.use(express.json());

async function readMedidasFile() {
    try {
        const data = await fs.readFile(MEDIDAS_FILE_PATH, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log('medidas.json não encontrado. Retornando estrutura inicial.');
            return {
                version: "1.0.0",
                lastUpdate: new Date().toISOString(),
                medidas: [],
                conjuntos: []
            };
        }
        console.error('Erro ao ler medidas.json:', err);
        throw err;
    }
}

async function writeMedidasFile(data) {
    try {
        await fs.writeFile(MEDIDAS_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
        console.log('Dados salvos em medidas.json com sucesso.');
    } catch (err) {
        console.error('Erro ao escrever em medidas.json:', err);
        throw err;
    }
}

app.get('/api/medidas', async (req, res) => {
    try {
        const data = await readMedidasFile();
        res.json(data);
    } catch (error) {
        res.status(500).json({ success: false, error: 'Erro ao ler medidas.' });
    }
});

app.post('/api/medidas', async (req, res) => { 
    try {
        const { medidas, conjuntos } = req.body;

        if (!Array.isArray(medidas) || !Array.isArray(conjuntos)) {
            return res.status(400).json({ success: false, error: 'Dados inválidos: medidas ou conjuntos ausentes/não são arrays.' });
        }

        const newData = {
            version: "1.0.0",
            lastUpdate: new Date().toISOString(),
            medidas: medidas,
            conjuntos: conjuntos
        };

        await writeMedidasFile(newData);
        res.json({ success: true, data: newData });
    } catch (error) {
        console.error('Erro ao salvar medidas:', error);
        res.status(500).json({ success: false, error: 'Erro ao salvar medidas.' });
    }
});


// Rota para REMOVER uma medida específica (Opcional, mas útil para uma API RESTful)
// Se você for implementar edição e remoção no frontend, esta rota pode ser útil
/*
app.delete('/api/medidas/:id', async (req, res) => {
    try {
        const medidaId = req.params.id;
        let currentData = await readMedidasFile();
        
        const initialMedidasCount = currentData.medidas.length;
        currentData.medidas = currentData.medidas.filter(m => m.id !== medidaId);

        // Também remover do conjunto se existir
        currentData.conjuntos.forEach(conjunto => {
            conjunto.medidas = conjunto.medidas.filter(m => m.id !== medidaId);
        });
        // Opcional: remover conjuntos vazios
        currentData.conjuntos = currentData.conjuntos.filter(c => c.medidas && c.medidas.length > 0);


        if (currentData.medidas.length === initialMedidasCount) {
            return res.status(404).json({ success: false, error: 'Medida não encontrada.' });
        }

        currentData.lastUpdate = new Date().toISOString();
        await writeMedidasFile(currentData);
        res.json({ success: true, data: currentData });

    } catch (error) {
        console.error('Erro ao remover medida:', error);
        res.status(500).json({ success: false, error: 'Erro ao remover medida.' });
    }
});
*/

// Porta em que o servidor irá escutar
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse http://localhost:${PORT} para ver a aplicação`);
    console.log(`Dados serão salvos em: ${MEDIDAS_FILE_PATH}`);
});