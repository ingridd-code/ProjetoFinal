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
    }
};

module.exports = compraModel;