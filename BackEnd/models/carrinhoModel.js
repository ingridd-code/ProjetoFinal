const db = require('../config/database');

const carrinhoModel = {
    obterOuCriarCarrinhoAtivo: async (idUsuario) => {
        const [carrinhos] = await db.query(
            `SELECT id_carrinho FROM carrinho
             WHERE id_usuario = ? AND status = 'ativo'
             ORDER BY id_carrinho DESC LIMIT 1`,
            [idUsuario]
        );
        if (carrinhos.length) return carrinhos[0];

        const [result] = await db.query(
            'INSERT INTO carrinho (id_usuario, status) VALUES (?, "ativo")',
            [idUsuario]
        );
        return { id_carrinho: result.insertId };
    },

    listarItens: async (idCarrinho) => {
        const [itens] = await db.query(
            `SELECT ic.id_item, ic.id_produto, ic.tamanho, ic.quantidade, p.nome, p.preco,
                    p.estoque, p.material, p.imagem_url,
                    (p.preco * ic.quantidade) AS subtotal
             FROM item_carrinho ic
             JOIN produto p ON p.id_produto = ic.id_produto
             WHERE ic.id_carrinho = ?
             ORDER BY ic.id_item`,
            [idCarrinho]
        );
        return itens;
    },

    obterPorUsuario: async (idUsuario) => {
        const carrinho = await carrinhoModel.obterOuCriarCarrinhoAtivo(idUsuario);
        const itens = await carrinhoModel.listarItens(carrinho.id_carrinho);
        return { id_carrinho: carrinho.id_carrinho, itens };
    },

    adicionarItem: async (idUsuario, idProduto, quantidade, tamanho = 'Único') => {
        const carrinho = await carrinhoModel.obterOuCriarCarrinhoAtivo(idUsuario);
        await db.query(
            `INSERT INTO item_carrinho (id_carrinho, id_produto, tamanho, quantidade)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE quantidade = quantidade + VALUES(quantidade)`,
            [carrinho.id_carrinho, idProduto, tamanho, quantidade]
        );
        return carrinho.id_carrinho;
    },

    atualizarItem: async (idItem, quantidade) => {
        const [result] = await db.query(
            'UPDATE item_carrinho SET quantidade = ? WHERE id_item = ?',
            [quantidade, idItem]
        );
        return result.affectedRows > 0;
    },

    removerItem: async (idItem) => {
        const [result] = await db.query(
            'DELETE FROM item_carrinho WHERE id_item = ?',
            [idItem]
        );
        return result.affectedRows > 0;
    }
};

module.exports = carrinhoModel;
