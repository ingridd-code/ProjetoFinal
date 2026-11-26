const db = require('../config/database');

const usuarioModel = {
    criar: async ({ nome, email, senhaHash }) => {
        const [result] = await db.query(
            'INSERT INTO usuario (nome, email, senha_hash) VALUES (?, ?, ?)',
            [nome, email, senhaHash]
        );
        return result.insertId;
    },

    buscarPorEmail: async (email) => {
        const [usuarios] = await db.query(
            'SELECT id_usuario, nome, email, senha_hash FROM usuario WHERE email = ? LIMIT 1',
            [email]
        );
        return usuarios[0] || null;
    }
};

module.exports = usuarioModel;
