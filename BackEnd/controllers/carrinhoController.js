const carrinhoModel = require('../models/carrinhoModel');
const produtoModel = require('../models/produtoModel');

function isPositiveInteger(value) {
    return Number.isInteger(Number(value)) && Number(value) > 0;
}

const carrinhoController = {
    obter: async (req, res) => {
        if (!isPositiveInteger(req.params.id_usuario)) {
            return res.status(400).json({ erro: 'Usuário inválido.' });
        }
        try {
            const carrinho = await carrinhoModel.obterPorUsuario(Number(req.params.id_usuario));
            res.json(carrinho);
        } catch (error) {
            console.error('Falha ao consultar carrinho.', error);
            res.status(500).json({ erro: 'Não foi possível carregar a sacola.' });
        }
    },

    adicionarItem: async (req, res) => {
        const { id_usuario, id_produto, quantidade } = req.body;
        if (![id_usuario, id_produto, quantidade].every(isPositiveInteger)) {
            return res.status(400).json({ erro: 'Informe usuário, produto e quantidade válidos.' });
        }
        try {
            const produto = await produtoModel.buscarPorId(Number(id_produto));
            if (!produto || !produto.ativo) return res.status(404).json({ erro: 'Produto não encontrado.' });

            const carrinho = await carrinhoModel.obterPorUsuario(Number(id_usuario));
            const itemExistente = carrinho.itens.find((item) => Number(item.id_produto) === Number(id_produto));
            const quantidadeFinal = Number(quantidade) + Number(itemExistente ? itemExistente.quantidade : 0);
            if (quantidadeFinal > Number(produto.estoque)) {
                return res.status(400).json({ erro: `Estoque insuficiente para ${produto.nome}.` });
            }

            await carrinhoModel.adicionarItem(Number(id_usuario), Number(id_produto), Number(quantidade));
            res.status(201).json({ mensagem: 'Peça adicionada à sacola.' });
        } catch (error) {
            console.error('Falha ao adicionar item ao carrinho.', error);
            res.status(500).json({ erro: 'Não foi possível adicionar a peça à sacola.' });
        }
    },

    atualizarItem: async (req, res) => {
        const { quantidade } = req.body;
        if (!isPositiveInteger(req.params.id_item) || !isPositiveInteger(quantidade)) {
            return res.status(400).json({ erro: 'Informe um item e uma quantidade válidos.' });
        }
        try {
            const atualizado = await carrinhoModel.atualizarItem(Number(req.params.id_item), Number(quantidade));
            if (!atualizado) return res.status(404).json({ erro: 'Item não encontrado.' });
            res.json({ mensagem: 'Quantidade atualizada.' });
        } catch (error) {
            console.error('Falha ao atualizar item do carrinho.', error);
            res.status(500).json({ erro: 'Não foi possível atualizar a quantidade.' });
        }
    },

    removerItem: async (req, res) => {
        if (!isPositiveInteger(req.params.id_item)) {
            return res.status(400).json({ erro: 'Item inválido.' });
        }
        try {
            const removido = await carrinhoModel.removerItem(Number(req.params.id_item));
            if (!removido) return res.status(404).json({ erro: 'Item não encontrado.' });
            res.json({ mensagem: 'Item removido da sacola.' });
        } catch (error) {
            console.error('Falha ao remover item do carrinho.', error);
            res.status(500).json({ erro: 'Não foi possível remover o item da sacola.' });
        }
    }
};

module.exports = carrinhoController;
