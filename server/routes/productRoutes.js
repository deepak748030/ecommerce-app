const express = require('express');
const router = express.Router();
const {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
    getTrendingProducts,
    getFashionPicksProducts,
} = require('../controllers/productController');
const { verifyToken } = require('../middleware/auth');

// Public routes - Home screen endpoints (must be before /:id)
router.get('/home/trending', getTrendingProducts);
router.get('/home/fashion-picks', getFashionPicksProducts);

// Public routes
router.get('/', getProducts);
router.get('/category/:categoryId', getProductsByCategory);
router.get('/:id', getProduct);

// Protected routes (Admin only)
router.post('/', verifyToken, createProduct);
router.put('/:id', verifyToken, updateProduct);
router.delete('/:id', verifyToken, deleteProduct);

module.exports = router;