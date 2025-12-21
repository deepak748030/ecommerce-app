const express = require('express');
const router = express.Router();
const {
    getVendorProducts,
    createVendorProduct,
    updateVendorProduct,
    deleteVendorProduct,
    getVendorOrders,
} = require('../controllers/vendorController');
const { verifyToken } = require('../middleware/auth');

// All vendor routes are protected
router.use(verifyToken);

// Product routes for vendor
router.get('/products', getVendorProducts);
router.post('/products', createVendorProduct);
router.put('/products/:id', updateVendorProduct);
router.delete('/products/:id', deleteVendorProduct);

// Orders for vendor's products
router.get('/orders', getVendorOrders);

module.exports = router;
