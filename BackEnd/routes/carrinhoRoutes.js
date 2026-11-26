const express = require('express');
const carrinhoController = require('../controllers/carrinhoController');

const router = express.Router();

router.get('/:id_usuario', carrinhoController.obter);
router.post('/item', carrinhoController.adicionarItem);
router.put('/item/:id_item', carrinhoController.atualizarItem);
router.delete('/item/:id_item', carrinhoController.removerItem);

module.exports = router;
