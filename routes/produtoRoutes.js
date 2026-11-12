const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const db = require('../config/database');

// --- ROTAS DE PRODUTOS ---
router.get('/', produtoController.listar);
router.post('/', produtoController.cadastrar);


// --- ROTAS DE CATEGORIAS ---
// Listar categorias existentes
router.get('/categorias', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM categoria');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Cadastrar nova categoria (que já tinhas feita)
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

// Atualizar categoria
router.put('/categorias/:id', async (req, res) => {
    const { nome, descricao } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE categoria SET nome = ?, descricao = ? WHERE id_categoria = ?',
            [nome, descricao, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Categoria não encontrada.' });
        }
        res.json({ mensagem: 'Categoria atualizada com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Deletar categoria
router.delete('/categorias/:id', async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM categoria WHERE id_categoria = ?',
            [req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Categoria não encontrada.' });
        }
        res.json({ mensagem: 'Categoria removida com sucesso!' });
    } catch (err) {
        res.status(500).json({ erro: err.message });
    }
});

// Novas rotas por ID (GET, PUT, DELETE)
router.get('/:id', produtoController.buscarPorId);
router.put('/:id', produtoController.atualizar);
router.delete('/:id', produtoController.deletar);


module.exports = router;