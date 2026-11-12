const db = require('../config/database');

const produtoModel = {
    listarTodosAtivos: async () => {
        const [produtos] = await db.query(`
            SELECT p.*, c.nome AS categoria 
            FROM produto p 
            JOIN categoria c ON p.id_categoria = c.id_categoria 
            WHERE p.ativo = TRUE
        `);
        return produtos;
    },

    buscarPorId: async (idProduto, connection = db) => {
        const [produtos] = await connection.query(
            'SELECT * FROM produto WHERE id_produto = ?',
            [idProduto]
        );
        return produtos[0];
    },

    atualizarEstoque: async (idProduto, novaQuantidade, connection = db) => {
        await connection.query(
            'UPDATE produto SET estoque = estoque - ? WHERE id_produto = ?',
            [novaQuantidade, idProduto]
        );
    },

    criar: async (produto) => {
        const { id_categoria, nome, descricao, preco, estoque, material } = produto;
        const [result] = await db.query(
            `INSERT INTO produto (id_categoria, nome, descricao, preco, estoque, material) VALUES (?, ?, ?, ?, ?, ?)`,
            [id_categoria, nome, descricao, preco, estoque, material || 'Plástico reciclado retirado do oceano']
        );
        return result.insertId;
    },

    atualizar: async (id, dados) => {
        const { id_categoria, nome, descricao, preco, estoque, material, ativo } = dados;
        await db.query(
            `UPDATE produto 
             SET id_categoria = ?, nome = ?, descricao = ?, preco = ?, estoque = ?, material = ?, ativo = ? 
             WHERE id_produto = ?`,
            [id_categoria, nome, descricao, preco, estoque, material, ativo !== undefined ? ativo : true, id]
        );
        return { id_produto: Number(id), ...dados };
    },

    deletar: async (id) => {
        const [result] = await db.query(
            'DELETE FROM produto WHERE id_produto = ?',
            [id]
        );
        return result.affectedRows;
    }
};

module.exports = produtoModel;