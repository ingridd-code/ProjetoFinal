const db = require('../config/database');

const usuarioModel = {
    buscarPorEmail: async (email) => {
        const [rows] = await db.query('SELECT * FROM usuario WHERE email = ?', [email]);
        return rows[0];
    },

    criar: async (nome, email, senhaHash) => {
        const [result] = await db.query(
            'INSERT INTO usuario (nome, email, senha_hash, verificado) VALUES (?, ?, ?, true)',
            [nome, email, senhaHash]
        );
        return result.insertId;
    }
};

module.exports = usuarioModel;