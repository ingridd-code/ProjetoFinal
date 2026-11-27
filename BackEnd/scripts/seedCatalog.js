const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = require('../config/database');
const catalog = require('../data/product-catalog.json');

const categories = ['Tênis', 'Camisetas', 'Jaquetas', 'Acessórios'];

async function seedCatalog() {
    if (catalog.length !== 32) throw new Error('O catálogo precisa conter exatamente 32 produtos.');
    const ids = new Set(catalog.map((product) => product.id));
    if (ids.size !== 32 || [...ids].some((id) => !Number.isInteger(id) || id < 1 || id > 32)) {
        throw new Error('Os IDs do catálogo devem ser únicos e estar entre 1 e 32.');
    }

    const counts = categories.map((category) =>
        catalog.filter((product) => product.category === category).length
    );
    if (counts.some((count) => count !== 8)) {
        throw new Error('O catálogo precisa ter oito produtos em cada categoria.');
    }

    const imageUrls = new Set(catalog.map((product) => product.image));
    if (imageUrls.size !== 32 || catalog.some((product) => !product.image.startsWith('https://images.unsplash.com/'))) {
        throw new Error('Cada produto precisa ter uma URL única do Unsplash.');
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [existingCategories] = await connection.query('SELECT id_categoria, nome FROM categoria');
        const categoryIds = new Map();

        for (const name of categories) {
            const existing = existingCategories.find(
                (category) => category.nome.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR')
            );
            if (existing) {
                if (existing.nome !== name) {
                    await connection.query('UPDATE categoria SET nome = ? WHERE id_categoria = ?', [name, existing.id_categoria]);
                }
                categoryIds.set(name, existing.id_categoria);
                continue;
            }

            const [result] = await connection.query(
                'INSERT INTO categoria (nome, descricao) VALUES (?, ?)',
                [name, `Produtos sustentáveis da categoria ${name}.`]
            );
            categoryIds.set(name, result.insertId);
        }

        const [existingProducts] = await connection.query('SELECT id_produto FROM produto');
        const catalogIds = new Set(catalog.map((product) => product.id));
        const legacyIds = existingProducts
            .map((product) => Number(product.id_produto))
            .filter((id) => !catalogIds.has(id));
        if (legacyIds.length) {
            await connection.query('UPDATE produto SET ativo = FALSE WHERE id_produto IN (?)', [legacyIds]);
        }

        for (const product of catalog) {
            await connection.query(
                `INSERT INTO produto
                    (id_produto, id_categoria, nome, descricao, preco, estoque, material, imagem_url, ativo)
                 VALUES (?, ?, ?, ?, ?, 20, ?, ?, TRUE)
                 ON DUPLICATE KEY UPDATE
                    id_categoria = VALUES(id_categoria),
                    nome = VALUES(nome),
                    descricao = VALUES(descricao),
                    preco = VALUES(preco),
                    material = VALUES(material),
                    imagem_url = VALUES(imagem_url),
                    ativo = TRUE`,
                [
                    product.id,
                    categoryIds.get(product.category),
                    product.name,
                    product.impactText,
                    product.price,
                    'Plástico reciclado retirado do oceano',
                    product.image
                ]
            );
        }

        await connection.commit();
        console.log('Catálogo sincronizado: 32 produtos, 8 por categoria.');
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
        await db.end();
    }
}

seedCatalog().catch((error) => {
    console.error('Não foi possível sincronizar o catálogo.', error);
    process.exitCode = 1;
});
