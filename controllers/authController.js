const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuarioModel');

const authController = {
    register: async (req, res) => {
        const { nome, email, senha } = req.body;
        try {
            const usuarioExistente = await usuarioModel.buscarPorEmail(email);
            if (usuarioExistente) {
                return res.status(400).json({ erro: 'E-mail já cadastrado.' });
            }

            const hash = await bcrypt.hash(senha, 10);
            const idUsuario = await usuarioModel.criar(nome, email, hash);

            res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!', id: idUsuario });
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    login: async (req, res) => {
        const { email, senha } = req.body;
        try {
            const usuario = await usuarioModel.buscarPorEmail(email);
            if (!usuario) {
                return res.status(401).json({ erro: 'Credenciais inválidas.' });
            }

            const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
            if (!senhaValida) {
                return res.status(401).json({ erro: 'Credenciais inválidas.' });
            }

            res.json({
                mensagem: 'Login realizado com sucesso!',
                usuario: { id: usuario.id_usuario, nome: usuario.nome, email: usuario.email }
            });
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    listarUsuarios: async (req, res) => {
        try {
            const usuarios = await usuarioModel.listarTodos();
            res.json(usuarios);
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    buscarUsuarioPorId: async (req, res) => {
        try {
            const usuario = await usuarioModel.buscarPorId(req.params.id);
            if (!usuario) {
                return res.status(404).json({ erro: 'Usuário não encontrado.' });
            }
            res.json(usuario);
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    atualizarUsuario: async (req, res) => {
        const { nome, email } = req.body;
        try {
            const atualizado = await usuarioModel.atualizar(req.params.id, nome, email);
            if (!atualizado) {
                return res.status(404).json({ erro: 'Usuário não encontrado.' });
            }
            res.json({ mensagem: 'Usuário atualizado com sucesso!' });
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    },

    deletarUsuario: async (req, res) => {
        try {
            const deletado = await usuarioModel.deletar(req.params.id);
            if (!deletado) {
                return res.status(404).json({ erro: 'Usuário não encontrado.' });
            }
            res.json({ mensagem: 'Usuário removido com sucesso!' });
        } catch (err) {
            res.status(500).json({ erro: err.message });
        }
    }
};

module.exports = authController;