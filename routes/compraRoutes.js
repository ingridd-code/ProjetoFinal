const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');

router.post('/checkout', compraController.checkout);
router.get('/usuario/:id_usuario', compraController.listarPorUsuario);
router.get('/:id', compraController.buscarPorId);
router.patch('/:id/status', compraController.atualizarStatus);

module.exports = router;