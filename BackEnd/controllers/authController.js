const bcrypt = require('bcryptjs');
const usuarioModel = require('../models/usuarioModel');

const authController = {
    register: async (req, res) => {
        const nome = typeof req.body.nome === 'string' ? req.body.nome.trim() : '';
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        const senha = typeof req.body.senha === 'string' ? req.body.senha : '';

        if (nome.length < 2 || nome.length > 100) {
            return res.status(400).json({ erro: 'O nome deve ter entre 2 e 100 caracteres.' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
            return res.status(400).json({ erro: 'Informe um e-mail válido.' });
        }
        if (senha.length < 6) {
            return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
        }

        try {
            const existingUser = await usuarioModel.buscarPorEmail(email);
            if (existingUser) return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });

            const senhaHash = await bcrypt.hash(senha, 12);
            const id = await usuarioModel.criar({ nome, email, senhaHash });
            res.status(201).json({ id, mensagem: 'Conta criada com sucesso.' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
            }
            console.error('Falha ao criar conta.', error);
            res.status(500).json({ erro: 'Não foi possível criar a conta.' });
        }
    },

    login: async (req, res) => {
        const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        const senha = typeof req.body.senha === 'string' ? req.body.senha : '';
        if (!email || !senha) return res.status(400).json({ erro: 'Informe seu e-mail e senha.' });

        try {
            const usuario = await usuarioModel.buscarPorEmail(email);
            const senhaValida = usuario && await bcrypt.compare(senha, usuario.senha_hash);
            if (!senhaValida) return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });

            res.json({
                usuario: {
                    id: usuario.id_usuario,
                    nome: usuario.nome,
                    email: usuario.email
                }
            });
        } catch (error) {
            console.error('Falha ao autenticar usuário.', error);
            res.status(500).json({ erro: 'Não foi possível entrar na conta.' });
        }
    }
};

module.exports = authController;
