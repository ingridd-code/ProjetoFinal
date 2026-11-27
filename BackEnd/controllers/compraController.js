const db = require('../config/database');
const produtoModel = require('../models/produtoModel');
const compraModel = require('../models/compraModel');
const carrinhoModel = require('../models/carrinhoModel');

function getLocalDate() {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 10);
}

function isValidDeliveryDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const compraController = {
    checkout: async (req, res) => {
        const { id_usuario, data_entrega, local_entrega, metodo_pagamento } = req.body;
        let { itens } = req.body;
        let idCarrinhoAtivo = null;
        const enderecoEntrega = typeof local_entrega === 'string' ? local_entrega.trim() : '';

        if (!id_usuario) {
            return res.status(400).json({ erro: 'Informe o id_usuario.' });
        }
        if (!['credito', 'debito', 'pix'].includes(metodo_pagamento)) {
            return res.status(400).json({ erro: 'Escolha uma forma de pagamento válida.' });
        }
        if (!isValidDeliveryDate(data_entrega) || data_entrega < getLocalDate()) {
            return res.status(400).json({ erro: 'Informe uma data de entrega válida a partir de hoje.' });
        }
        if (!enderecoEntrega || enderecoEntrega.length > 255) {
            return res.status(400).json({ erro: 'Informe um endereço de entrega com até 255 caracteres.' });
        }

        let connection;
        let transactionStarted = false;
        try {
            connection = await db.getConnection();
            // Se não vierem itens no body, busca direto do carrinho ativo do usuário
            if (!itens || itens.length === 0) {
                const carrinho = await carrinhoModel.obterOuCriarCarrinhoAtivo(id_usuario);
                const itensCarrinho = await carrinhoModel.listarItens(carrinho.id_carrinho);

                if (itensCarrinho.length === 0) {
                    return res.status(400).json({ erro: 'O carrinho está vazio.' });
                }

                itens = itensCarrinho;
                idCarrinhoAtivo = carrinho.id_carrinho;
            }

            await connection.beginTransaction();
            transactionStarted = true;

            let valorTotal = 0;
            const itensValidados = [];
            const quantidadePorProduto = new Map();

            // Validação de Estoque e Cálculo de Subtotais
            for (const item of itens) {
                const produto = await produtoModel.buscarPorId(item.id_produto, connection);

                if (!produto) {
                    throw new Error(`Produto ID ${item.id_produto} não encontrado.`);
                }

                const quantidadeAcumulada = (quantidadePorProduto.get(Number(item.id_produto)) || 0) + Number(item.quantidade);
                quantidadePorProduto.set(Number(item.id_produto), quantidadeAcumulada);
                if (produto.estoque < quantidadeAcumulada) {
                    throw new Error(`Estoque insuficiente para: ${produto.nome}. Disponível: ${produto.estoque}`);
                }

                const subtotal = produto.preco * item.quantidade;
                valorTotal += subtotal;

                itensValidados.push({
                    id_produto: produto.id_produto,
                    tamanho: item.tamanho || 'Único',
                    quantidade: item.quantidade,
                    preco_unitario: produto.preco
                });
            }

            // Registrar Compra
            const idCompra = await compraModel.criarCompra(
                id_usuario, valorTotal, data_entrega, enderecoEntrega, metodo_pagamento, connection
            );

            // Inserir Itens e Atualizar Estoque
            for (const item of itensValidados) {
                await compraModel.inserirItemCompra(
                    idCompra, item.id_produto, item.tamanho, item.quantidade, item.preco_unitario, connection
                );
            }

            // Se a compra veio do carrinho ativo, marca o carrinho como finalizado
            if (idCarrinhoAtivo) {
                await connection.query(
                    'UPDATE carrinho SET status = "finalizado" WHERE id_carrinho = ?',
                    [idCarrinhoAtivo]
                );
            }

            await connection.commit();
            transactionStarted = false;

            res.status(201).json({
                mensagem: 'Pedido registrado. A cobrança ainda não foi processada.',
                id_compra: idCompra,
                metodo_pagamento,
                total: valorTotal,
                data_entrega,
                local_entrega: enderecoEntrega
            });

        } catch (err) {
            if (connection && transactionStarted) {
                try {
                    await connection.rollback();
                } catch (rollbackError) {
                    console.error('Não foi possível cancelar a transação do checkout.', rollbackError);
                }
            }
            res.status(err.statusCode || 400).json({ erro: err.message });
        } finally {
            if (connection) connection.release();
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