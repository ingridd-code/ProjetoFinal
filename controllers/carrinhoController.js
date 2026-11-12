const carrinhoModel = require('../models/carrinhoModel');
const produtoModel = require('../models/produtoModel');

const carrinhoController = {
    verCarrinho: async (req, res) => {
        const { id_usuario } = req.params;
        try {
            const carrinho = await carrinhoModel.obterOuCriarCarrinhoAtivo(id_usuario);
            const itens = await carrinhoModel.listarItens(carrinho.id_carrinho);

            const total = itens.reduce((acc, item) => acc + Number(item.subtotal), 0);

            res.json({
                id_carrinho: carrinho.id_carrinho,
                id_usuario: carrinho.id_usuario,
                status: carrinho.status,
                itens,
                total
            });
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    adicionarItem: async (req, res) => {
        const { id_usuario, id_produto, quantidade = 1 } = req.body;

        if (!id_usuario || !id_produto || quantidade <= 0) {
            return res.status(400).json({ erro: 'Informe id_usuario, id_produto e uma quantidade maior que 0.' });
        }

        try {
            const produto = await produtoModel.buscarPorId(id_produto);
            if (!produto) {
                return res.status(404).json({ erro: 'Produto não encontrado.' });
            }

            if (produto.estoque < quantidade) {
                return res.status(400).json({ erro: `Estoque insuficiente. Disponível: ${produto.estoque}` });
            }

            const carrinho = await carrinhoModel.obterOuCriarCarrinhoAtivo(id_usuario);
            const idItem = await carrinhoModel.adicionarItem(carrinho.id_carrinho, id_produto, quantidade);

            res.status(201).json({
                mensagem: 'Item adicionado ao carrinho!',
                id_carrinho: carrinho.id_carrinho,
                id_item: idItem
            });
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    atualizarItem: async (req, res) => {
        const { id_item } = req.params;
        const { quantidade } = req.body;

        if (!quantidade || quantidade <= 0) {
            return res.status(400).json({ erro: 'A quantidade deve ser maior que 0.' });
        }

        try {
            const atualizado = await carrinhoModel.atualizarQuantidade(id_item, quantidade);
            if (!atualizado) {
                return res.status(404).json({ erro: 'Item do carrinho não encontrado.' });
            }

            res.json({ mensagem: 'Quantidade atualizada com sucesso!' });
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    removerItem: async (req, res) => {
        const { id_item } = req.params;
        try {
            const removido = await carrinhoModel.removerItem(id_item);
            if (!removido) {
                return res.status(404).json({ erro: 'Item do carrinho não encontrado.' });
            }

            res.json({ mensagem: 'Item removido do carrinho!' });
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    }
};

module.exports = carrinhoController;