const multer = require('multer');

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 4 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
        if (!allowedTypes.has(file.mimetype)) {
            return callback(new Error('Envie uma imagem JPG, PNG ou WEBP.'));
        }
        callback(null, true);
    }
}).single('imagem');

module.exports = (req, res, next) => {
    upload(req, res, (error) => {
        if (!error) return next();
        if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
            return res.status(413).json({ erro: 'A imagem deve ter no máximo 4 MB.' });
        }
        res.status(400).json({ erro: error.message || 'Não foi possível receber a imagem.' });
    });
};
