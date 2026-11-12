const db = require('../config/database');
const produtoModel = require('../models/produtoModel');
const compraModel = require('../models/compraModel');
const carrinhoModel = require('../models/carrinhoModel');

const compraController = {
    checkout: async (req, res) => {
        const { id_usuario } = req.body;
        let { itens } = req.body;
        let idCarrinhoAtivo = null;

        if (!id_usuario) {
            return res.status(400).json({ erro: 'Informe o id_usuario.' });
        }

        const connection = await db.getConnection();

        try {
            // Se não vierem itens no body, busca direto do carrinho ativo do usuário
            if (!itens || itens.length === 0) {
                const carrinho = await carrinhoModel.obterOuCriarCarrinhoAtivo(id_usuario);
                const itensCarrinho = await carrinhoModel.listarItens(carrinho.id_carrinho);

                if (itensCarrinho.length === 0) {
                    connection.release();
                    return res.status(400).json({ erro: 'O carrinho está vazio.' });
                }

                itens = itensCarrinho;
                idCarrinhoAtivo = carrinho.id_carrinho;
            }

            await connection.beginTransaction();

            let valorTotal = 0;
            const itensValidados = [];

            // Validação de Estoque e Cálculo de Subtotais
            for (const item of itens) {
                const produto = await produtoModel.buscarPorId(item.id_produto, connection);

                if (!produto) {
                    throw new Error(`Produto ID ${item.id_produto} não encontrado.`);
                }

                if (produto.estoque < item.quantidade) {
                    throw new Error(`Estoque insuficiente para: ${produto.nome}. Disponível: ${produto.estoque}`);
                }

                const subtotal = produto.preco * item.quantidade;
                valorTotal += subtotal;

                itensValidados.push({
                    id_produto: produto.id_produto,
                    quantidade: item.quantidade,
                    preco_unitario: produto.preco
                });
            }

            // Registrar Compra
            const idCompra = await compraModel.criarCompra(id_usuario, valorTotal, connection);

            // Inserir Itens e Atualizar Estoque
            for (const item of itensValidados) {
                await compraModel.inserirItemCompra(
                    idCompra, item.id_produto, item.quantidade, item.preco_unitario, connection
                );
                await produtoModel.atualizarEstoque(item.id_produto, item.quantidade, connection);
            }

            // Emitir Nota Fiscal
            const numeroNF = `NF-${Date.now()}`;
            await compraModel.gerarNotaFiscal(idCompra, numeroNF, valorTotal, connection);

            // Se a compra veio do carrinho ativo, marca o carrinho como finalizado
            if (idCarrinhoAtivo) {
                await connection.query(
                    'UPDATE carrinho SET status = "finalizado" WHERE id_carrinho = ?',
                    [idCarrinhoAtivo]
                );
            }

            await connection.commit();

            res.status(201).json({
                mensagem: 'Compra finalizada com sucesso!',
                id_compra: idCompra,
                nota_fiscal: numeroNF,
                total: valorTotal
            });

        } catch (err) {
            await connection.rollback();
            res.status(400).json({ erro: err.message });
        } finally {
            connection.release();
        }
    },

    listarPorUsuario: async (req, res) => {
        try {
            const compras = await compraModel.listarPorUsuario(req.params.id_usuario);
            res.json(compras);
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    buscarPorId: async (req, res) => {
        try {
            const compra = await compraModel.buscarPorId(req.params.id);
            if (!compra) {
                return res.status(404).json({ erro: 'Compra não encontrada.' });
            }
            res.json(compra);
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    atualizarStatus: async (req, res) => {
        const { status } = req.body;
        const statusPermitidos = ['pendente', 'paga', 'enviada', 'entregue', 'cancelada'];

        if (!statusPermitidos.includes(status)) {
            return res.status(400).json({
                erro: `Status inválido. Use um destes: ${statusPermitidos.join(', ')}`
            });
        }

        try {
            const atualizado = await compraModel.atualizarStatus(req.params.id, status);
            if (!atualizado) {
                return res.status(404).json({ erro: 'Compra não encontrada.' });
            }
            res.json({ mensagem: `Status da compra atualizado para "${status}"!` });
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    }
};

module.exports = compraController;