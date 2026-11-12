const db = require('../config/database');

const compraModel = {
    criarCompra: async (idUsuario, valorTotal, connection) => {
        const [result] = await connection.query(
            'INSERT INTO compra (id_usuario, valor_total, status) VALUES (?, ?, "paga")',
            [idUsuario, valorTotal]
        );
        return result.insertId;
    },

    inserirItemCompra: async (idCompra, idProduto, quantidade, precoUnitario, connection) => {
        await connection.query(
            'INSERT INTO item_compra (id_compra, id_produto, quantidade, preco_unitario) VALUES (?, ?, ?, ?)',
            [idCompra, idProduto, quantidade, precoUnitario]
        );
    },

    gerarNotaFiscal: async (idCompra, numero, valorTotal, connection) => {
        await connection.query(
            'INSERT INTO nota_fiscal (id_compra, numero, valor_total) VALUES (?, ?, ?)',
            [idCompra, numero, valorTotal]
        );
    },

    listarPorUsuario: async (idUsuario) => {
        const [rows] = await db.query(
            `SELECT c.*, nf.numero AS nota_fiscal
             FROM compra c
             LEFT JOIN nota_fiscal nf ON c.id_compra = nf.id_compra
             WHERE c.id_usuario = ?
             ORDER BY c.data_compra DESC`,
            [idUsuario]
        );
        return rows;
    },

    buscarPorId: async (idCompra) => {
        const [compras] = await db.query(
            `SELECT c.*, nf.numero AS nota_fiscal, nf.data_emissao
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