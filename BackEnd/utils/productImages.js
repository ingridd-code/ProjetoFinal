const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

const uploadDirectory = path.join(__dirname, '..', 'uploads', 'products');

function detectImageFormat(buffer) {
    if (buffer.length >= 8
        && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
        return { mimeType: 'image/png', extension: 'png' };
    }
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { mimeType: 'image/jpeg', extension: 'jpg' };
    }
    if (buffer.length >= 12
        && buffer.toString('ascii', 0, 4) === 'RIFF'
        && buffer.toString('ascii', 8, 12) === 'WEBP') {
        return { mimeType: 'image/webp', extension: 'webp' };
    }
    return null;
}

async function save(file) {
    const format = detectImageFormat(file.buffer);
    if (!format || format.mimeType !== file.mimetype) {
        const error = new Error('O conteúdo do arquivo não corresponde a uma imagem JPG, PNG ou WEBP.');
        error.statusCode = 400;
        throw error;
    }

    await fs.mkdir(uploadDirectory, { recursive: true });
    const filename = `${randomUUID()}.${format.extension}`;
    await fs.writeFile(path.join(uploadDirectory, filename), file.buffer, { flag: 'wx' });
    return `/uploads/products/${filename}`;
}

async function remove(imageUrl) {
    const prefix = '/uploads/products/';
    if (typeof imageUrl !== 'string' || !imageUrl.startsWith(prefix)) return;
    const filename = path.basename(imageUrl);
    if (!filename || filename === '.' || filename === '..') return;
    await fs.rm(path.join(uploadDirectory, filename), { force: true });
}

module.exports = { save, remove };
