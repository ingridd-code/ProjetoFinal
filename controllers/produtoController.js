const produtoModel = require('../models/produtoModel');

const produtoController = {
    listar: async (req, res) => {
        try {
            const produtos = await produtoModel.listarTodosAtivos();
            res.json(produtos);
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    cadastrar: async (req, res) => {
        try {
            const idProduto = await produtoModel.criar(req.body);
            res.status(201).json({ id: idProduto, mensagem: 'Produto cadastrado com sucesso!' });
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    }
};

module.exports = produtoController;