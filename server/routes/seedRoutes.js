const express = require('express');
const router = express.Router();
const { seedUsers, seedCategories, seedProducts, seedAll } = require('../controllers/seedController');

// Public seed routes (no auth required) - GET requests
router.get('/users', seedUsers);
router.get('/categories', seedCategories);
router.get('/products', seedProducts);
router.get('/all', seedAll);

module.exports = router;
