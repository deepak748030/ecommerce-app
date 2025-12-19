const express = require('express');
const router = express.Router();
const {
    createOrder,
    getOrders,
    getOrder,
    cancelOrder,
    getTransactions,
    updateOrderStatus,
    getAllOrdersAdmin,
} = require('../controllers/orderController');
const { verifyToken } = require('../middleware/auth');

// All order routes are protected
router.use(verifyToken);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/transactions', getTransactions);
router.get('/admin/all', getAllOrdersAdmin);
router.get('/:id', getOrder);
router.put('/:id/cancel', cancelOrder);
router.put('/:id/status', updateOrderStatus);

module.exports = router;
