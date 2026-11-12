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
    },

    listarTodos: async () => {
        const [rows] = await db.query('SELECT id_usuario, nome, email, verificado FROM usuario');
        return rows;
    },
    buscarPorId: async (id) => {
        const [rows] = await db.query(
            'SELECT id_usuario, nome, email, verificado, data_cadastro FROM usuario WHERE id_usuario = ?',
            [id]
        );
        return rows[0];
    },

    atualizar: async (id, nome, email) => {
        const [result] = await db.query(
            'UPDATE usuario SET nome = ?, email = ? WHERE id_usuario = ?',
            [nome, email, id]
        );
        return result.affectedRows;
    },

    deletar: async (id) => {
        const [result] = await db.query(
            'DELETE FROM usuario WHERE id_usuario = ?',
            [id]
        );
        return result.affectedRows;
    }

};

module.exports = usuarioModel;