const produtoModel = require('../models/produtoModel');
const productImages = require('../utils/productImages');

function withPublicImageUrl(req, product) {
    if (!product || !product.imagem_url) return product;
    return {
        ...product,
        imagem_url: `${req.protocol}://${req.get('host')}${product.imagem_url}`
    };
}

async function removeImageAfterError(imageUrl) {
    if (!imageUrl) return;
    try {
        await productImages.remove(imageUrl);
    } catch (error) {
        console.error('Não foi possível remover o arquivo de imagem temporário.', error);
    }
}

const produtoController = {
    listar: async (req, res) => {
        try {
            const produtos = await produtoModel.listarTodosAtivos();
            res.json(produtos.map((produto) => withPublicImageUrl(req, produto)));
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    cadastrar: async (req, res) => {
        let imagemUrl;
        try {
            if (req.file) imagemUrl = await productImages.save(req.file);
            const idProduto = await produtoModel.criar({ ...req.body, imagem_url: imagemUrl });
            res.status(201).json({
                id: idProduto,
                imagem_url: imagemUrl ? `${req.protocol}://${req.get('host')}${imagemUrl}` : null,
                mensagem: 'Produto cadastrado com sucesso!'
            });
        } catch (err) {
            await removeImageAfterError(imagemUrl);
            res.status(err.statusCode || 500).json({ erro: err.message });
        }
    },

    buscarPorId: async (req, res) => {
        try {
            const produto = await produtoModel.buscarPorId(req.params.id);
            if (!produto) {
                return res.status(404).json({ erro: "Produto não encontrado." });
            }
            res.json(withPublicImageUrl(req, produto));
        } catch (err) {
            res.status(500).json({ erro: "Erro ao procurar produto." });
        }
    },

    atualizar: async (req, res) => {
        let imagemNova;
        try {
            const produtoAtual = await produtoModel.buscarPorId(req.params.id);
            if (!produtoAtual) return res.status(404).json({ erro: "Produto não encontrado." });

            if (req.file) imagemNova = await productImages.save(req.file);
            const dados = imagemNova ? { ...req.body, imagem_url: imagemNova } : req.body;
            const produtoAtualizado = await produtoModel.atualizar(req.params.id, dados);
            const resultado = withPublicImageUrl(req, {
                ...produtoAtualizado,
                imagem_url: imagemNova || produtoAtual.imagem_url
            });

            if (imagemNova && produtoAtual.imagem_url) {
                try {
                    await productImages.remove(produtoAtual.imagem_url);
                } catch (error) {
                    console.error('Não foi possível remover a imagem substituída.', error);
                }
            }
            res.json({ mensagem: "Produto atualizado com sucesso!", produto: resultado });
        } catch (err) {
            await removeImageAfterError(imagemNova);
            res.status(err.statusCode || 500).json({ erro: err.statusCode ? err.message : "Erro ao atualizar produto." });
        }
    },

    deletar: async (req, res) => {
        try {
            const produto = await produtoModel.buscarPorId(req.params.id);
            if (!produto) return res.status(404).json({ erro: "Produto não encontrado." });
            await produtoModel.deletar(req.params.id);
            if (produto.imagem_url) {
                try {
                    await productImages.remove(produto.imagem_url);
                } catch (error) {
                    console.error('Não foi possível remover a imagem do produto excluído.', error);
                }
            }
            res.json({ mensagem: "Produto removido com sucesso!" });
        } catch (err) {
            res.status(500).json({ erro: "Erro ao apagar produto." });
        }
    }
};

module.exports = produtoController;