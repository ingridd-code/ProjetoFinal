const db = require('../config/database');

const compraModel = {
    criarCompra: async (idUsuario, valorTotal, dataEntrega, localEntrega, metodoPagamento, connection) => {
        const [result] = await connection.query(
            'INSERT INTO compra (id_usuario, valor_total, status, data_entrega, local_entrega, metodo_pagamento) VALUES (?, ?, "pendente", ?, ?, ?)',
            [idUsuario, valorTotal, dataEntrega, localEntrega, metodoPagamento]
        );
        return result.insertId;
    },

    inserirItemCompra: async (idCompra, idProduto, tamanho, quantidade, precoUnitario, connection) => {
        await connection.query(
            'INSERT INTO item_compra (id_compra, id_produto, tamanho, quantidade, preco_unitario) VALUES (?, ?, ?, ?, ?)',
            [idCompra, idProduto, tamanho, quantidade, precoUnitario]
        );
    },

    gerarNotaFiscal: async (idCompra, numero, valorTotal, connection) => {
        await connection.query(
            'INSERT INTO nota_fiscal (id_compra, numero, valor_total) VALUES (?, ?, ?)',
            [idCompra, numero, valorTotal]
        );
    },

    listarPorUsuario: async (idUsuario) => {
        const [compras] = await db.query(
            `SELECT c.*, nf.numero AS nota_fiscal
                    , nf.data_emissao, nf.valor_total AS nota_fiscal_total
             FROM compra c
             LEFT JOIN nota_fiscal nf ON c.id_compra = nf.id_compra
             WHERE c.id_usuario = ?
             ORDER BY c.data_compra DESC`,
            [idUsuario]
        );
        if (!compras.length) return [];

        const ids = compras.map((compra) => compra.id_compra);
        const [itens] = await db.query(
            `SELECT ic.id_compra, ic.id_produto, ic.tamanho, ic.quantidade, ic.preco_unitario, p.nome AS produto_nome
             FROM item_compra ic
             JOIN produto p ON ic.id_produto = p.id_produto
             WHERE ic.id_compra IN (?)
             ORDER BY ic.id_compra, ic.id_item_compra`,
            [ids]
        );
        const itensPorCompra = new Map();
        itens.forEach((item) => {
            const idCompra = Number(item.id_compra);
            if (!itensPorCompra.has(idCompra)) itensPorCompra.set(idCompra, []);
            itensPorCompra.get(idCompra).push(item);
        });
        return compras.map((compra) => ({
            ...compra,
            itens: itensPorCompra.get(Number(compra.id_compra)) || []
        }));
    },

    buscarPorId: async (idCompra) => {
        const [compras] = await db.query(
            `SELECT c.*, nf.numero AS nota_fiscal, nf.data_emissao, nf.valor_total AS nota_fiscal_total
             FROM compra c
             LEFT JOIN nota_fiscal nf ON c.id_compra = nf.id_compra
             WHERE c.id_compra = ?`,
            [idCompra]
        );

        if (compras.length === 0) return null;

        const [itens] = await db.query(
            `SELECT ic.*, p.nome AS produto_nome
             FROM item_compra ic
             JOIN produto p ON ic.id_produto = p.id_produto
             WHERE ic.id_compra = ?`,
            [idCompra]
        );

        return { ...compras[0], itens };
    },

    atualizarStatus: async (idCompra, status) => {
        const [result] = await db.query(
            'UPDATE compra SET status = ? WHERE id_compra = ?',
            [status, idCompra]
        );
        return result.affectedRows;
    }
};

module.exports = compraModel;