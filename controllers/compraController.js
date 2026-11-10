const db = require('../config/database');
const produtoModel = require('../models/produtoModel');
const compraModel = require('../models/compraModel');

const compraController = {
    checkout: async (req, res) => {
        const { id_usuario, itens } = req.body;

        if (!itens || itens.length === 0) {
            return res.status(400).json({ erro: 'O carrinho está vazio.' });
        }

        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            let valorTotal = 0;
            const itensValidados = [];

            // 1. Validação de Estoque e Cálculo de Subtotais
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

            // 2. Registrar Compra
            const idCompra = await compraModel.criarCompra(id_usuario, valorTotal, connection);

            // 3. Inserir Itens e Atualizar Estoque
            for (const item of itensValidados) {
                await compraModel.inserirItemCompra(
                    idCompra, item.id_produto, item.quantidade, item.preco_unitario, connection
                );
                await produtoModel.atualizarEstoque(item.id_produto, item.quantidade, connection);
            }

            // 4. Emitir Nota Fiscal
            const numeroNF = `NF-${Date.now()}`;
            await compraModel.gerarNotaFiscal(idCompra, numeroNF, valorTotal, connection);

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
    }
};

module.exports = compraController;