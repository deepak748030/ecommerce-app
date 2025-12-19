const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrders,
    getOrder,
    cancelOrder,
    getTransactions,
} = require('../controllers/orderController');
const { verifyToken } = require('../middleware/auth');

// All order routes are protected
router.use(verifyToken);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/transactions', getTransactions);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);

module.exports = router;
