const db = require('../config/database');

const newsletterController = {
    inscrever: async (req, res) => {
        const body = req.body || {};
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const consentimento = body.consentimento === true;

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 150) {
            return res.status(400).json({ erro: 'Informe um e-mail válido.' });
        }
        if (!consentimento) {
            return res.status(400).json({ erro: 'É necessário concordar com a Política de Privacidade.' });
        }

        try {
            await db.query('INSERT INTO newsletter_inscricao (email) VALUES (?)', [email]);
            res.status(201).json({ mensagem: 'Inscrição registrada com sucesso.' });
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.json({ mensagem: 'Este e-mail já está inscrito.' });
            }
            console.error('Falha ao registrar inscrição da newsletter.', error);
            res.status(500).json({ erro: 'Não foi possível concluir a inscrição. Tente novamente.' });
        }
    }
};

module.exports = newsletterController;
