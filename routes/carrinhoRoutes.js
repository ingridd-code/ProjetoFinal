const express = require('express');
const router = express.Router();
const carrinhoController = require('../controllers/carrinhoController');

router.get('/:id_usuario', carrinhoController.verCarrinho);
router.post('/item', carrinhoController.adicionarItem);
router.put('/item/:id_item', carrinhoController.atualizarItem);
router.delete('/item/:id_item', carrinhoController.removerItem);

module.exports = router;