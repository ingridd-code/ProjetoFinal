const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const db = require('../config/database'); // <-- Adicionado aqui!

router.get('/', produtoController.listar);
router.post('/', produtoController.cadastrar);

router.post('/categorias', async (req, res) => {
    const { nome, descricao } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO categoria (nome, descricao) VALUES (?, ?)',
            [nome, descricao]
        );
        res.status(201).json({ id: result.insertId, mensagem: 'Categoria criada com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

module.exports = router;