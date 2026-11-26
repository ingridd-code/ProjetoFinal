const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const frontendDirectory = path.join(__dirname, '..', 'FrontEnd');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { index: false }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/produtos', require('./routes/produtoRoutes'));
app.use('/api/compras', require('./routes/compraRoutes'));
app.use('/api/carrinho', require('./routes/carrinhoRoutes'));
app.get('/api/health', async (req, res) => {
    try {
        await require('./config/database').query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (error) {
        console.error('Health check: conexão com o banco indisponível.', error);
        res.status(503).json({ status: 'error', database: 'unavailable' });
    }
});
app.use('/api', (req, res) => {
    res.status(404).json({ erro: 'Rota da API não encontrada.' });
});
app.use(express.static(frontendDirectory));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`RecycleWear disponível em http://localhost:${PORT}`);
});