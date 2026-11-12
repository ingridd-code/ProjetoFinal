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
    },

    buscarPorId: async (req, res) => {
        try {
            const produto = await produtoModel.buscarPorId(req.params.id);
            if (!produto) {
                return res.status(404).json({ erro: "Produto não encontrado." });
            }
            res.json(produto);
        } catch (err) {
            res.status(500).json({ erro: "Erro ao procurar produto." });
        }
    },

    atualizar: async (req, res) => {
        try {
            const produtoAtualizado = await produtoModel.atualizar(req.params.id, req.body);
            res.json({ mensagem: "Produto atualizado com sucesso!", produto: produtoAtualizado });
        } catch (err) {
            res.status(500).json({ erro: "Erro ao atualizar produto." });
        }
    },

    deletar: async (req, res) => {
        try {
            await produtoModel.deletar(req.params.id);
            res.json({ mensagem: "Produto removido com sucesso!" });
        } catch (err) {
            res.status(500).json({ erro: "Erro ao apagar produto." });
        }
    }
};

module.exports = produtoController;