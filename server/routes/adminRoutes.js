const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdminToken } = require('../middleware/adminAuth');

// Public routes
router.post('/login', adminController.adminLogin);
router.post('/setup', adminController.setupDefaultAdmin);

// Protected routes
router.get('/me', verifyAdminToken, adminController.getAdminProfile);
router.get('/users', verifyAdminToken, adminController.getUsers);
router.get('/users/:id', verifyAdminToken, adminController.getUserById);
router.put('/users/:id/block', verifyAdminToken, adminController.toggleUserBlock);
router.get('/stats', verifyAdminToken, adminController.getDashboardStats);
router.get('/analytics', verifyAdminToken, adminController.getDashboardAnalytics);

// Category routes
router.get('/categories', verifyAdminToken, adminController.getCategories);
router.get('/categories/:id', verifyAdminToken, adminController.getCategoryById);
router.post('/categories', verifyAdminToken, adminController.createCategory);
router.put('/categories/:id', verifyAdminToken, adminController.updateCategory);
router.delete('/categories/:id', verifyAdminToken, adminController.deleteCategory);
router.put('/categories/:id/toggle', verifyAdminToken, adminController.toggleCategoryStatus);

module.exports = router;
