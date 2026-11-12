const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/usuarios', authController.listarUsuarios);

router.get('/usuarios/:id', authController.buscarUsuarioPorId);
router.put('/usuarios/:id', authController.atualizarUsuario);
router.delete('/usuarios/:id', authController.deletarUsuario);

module.exports = router;