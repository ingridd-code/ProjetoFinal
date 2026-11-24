const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { index: false }));

// Importação das rotas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/produtos', require('./routes/produtoRoutes'));
app.use('/api/compras', require('./routes/compraRoutes'));
app.use('/api/carrinho', require('./routes/carrinhoRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor RecycleWear MVC rodando na porta ${PORT}`);
});