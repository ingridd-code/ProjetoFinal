const db = require('../config/database');

const carrinhoModel = {
    // Busca o carrinho ativo do usuário; se não existir, cria um novo
    obterOuCriarCarrinhoAtivo: async (id_usuario) => {
        const [carrinhos] = await db.query(
            'SELECT * FROM carrinho WHERE id_usuario = ? AND status = "ativo"',
            [id_usuario]
        );

        if (carrinhos.length > 0) {
            return carrinhos[0];
        }

        const [result] = await db.query(
            'INSERT INTO carrinho (id_usuario, status) VALUES (?, "ativo")',
            [id_usuario]
        );

        return { id_carrinho: result.insertId, id_usuario, status: 'ativo' };
    },

    // Lista todos os itens de um carrinho trazendo nome, preço e subtotal do produto
    listarItens: async (id_carrinho) => {
        const [rows] = await db.query(
            `SELECT 
                ic.id_item,
                ic.id_produto,
                p.nome,
                p.preco,
                ic.quantidade,
                (p.preco * ic.quantidade) AS subtotal
             FROM item_carrinho ic
             JOIN produto p ON ic.id_produto = p.id_produto
             WHERE ic.id_carrinho = ?`,
            [id_carrinho]
        );
        return rows;
    },

    // Adiciona um produto ou soma a quantidade se ele já estiver no carrinho
    adicionarItem: async (id_carrinho, id_produto, quantidade) => {
        const [existente] = await db.query(
            'SELECT * FROM item_carrinho WHERE id_carrinho = ? AND id_produto = ?',
            [id_carrinho, id_produto]
        );

        if (existente.length > 0) {
            const novaQuantidade = existente[0].quantidade + quantidade;
            await db.query(
                'UPDATE item_carrinho SET quantidade = ? WHERE id_item = ?',
                [novaQuantidade, existente[0].id_item]
            );
            return existente[0].id_item;
        }

        const [result] = await db.query(
            'INSERT INTO item_carrinho (id_carrinho, id_produto, quantidade) VALUES (?, ?, ?)',
            [id_carrinho, id_produto, quantidade]
        );
        return result.insertId;
    },

    // Atualiza a quantidade exata de um item
    atualizarQuantidade: async (id_item, quantidade) => {
        const [result] = await db.query(
            'UPDATE item_carrinho SET quantidade = ? WHERE id_item = ?',
            [quantidade, id_item]
        );
        return result.affectedRows;
    },

    // Remove um item do carrinho
    removerItem: async (id_item) => {
        const [result] = await db.query(
            'DELETE FROM item_carrinho WHERE id_item = ?',
            [id_item]
        );
        return result.affectedRows;
    }
};

module.exports = carrinhoModel;