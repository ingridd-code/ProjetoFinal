const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');

router.post('/checkout', compraController.checkout);

module.exports = router;