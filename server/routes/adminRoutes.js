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

// Banner routes
router.get('/banners', verifyAdminToken, adminController.getBanners);
router.get('/banners/:id', verifyAdminToken, adminController.getBannerById);
router.post('/banners', verifyAdminToken, adminController.createBanner);
router.put('/banners/reorder', verifyAdminToken, adminController.reorderBanners);
router.put('/banners/:id', verifyAdminToken, adminController.updateBanner);
router.delete('/banners/:id', verifyAdminToken, adminController.deleteBanner);
router.put('/banners/:id/toggle', verifyAdminToken, adminController.toggleBannerStatus);

// Delivery Partner routes
router.get('/delivery-partners/stats', verifyAdminToken, adminController.getDeliveryPartnerStats);
router.get('/delivery-partners', verifyAdminToken, adminController.getDeliveryPartners);
router.get('/delivery-partners/:id', verifyAdminToken, adminController.getDeliveryPartnerById);
router.put('/delivery-partners/:id/block', verifyAdminToken, adminController.toggleDeliveryPartnerBlock);
router.put('/delivery-partners/:id/kyc', verifyAdminToken, adminController.updateDeliveryPartnerKYC);
router.put('/delivery-partners/:id/toggle-active', verifyAdminToken, adminController.toggleDeliveryPartnerActive);
router.put('/delivery-partners/:id/earnings', verifyAdminToken, adminController.updateDeliveryPartnerEarnings);

// Order routes
router.get('/orders/stats', verifyAdminToken, adminController.getOrderStats);
router.get('/orders', verifyAdminToken, adminController.getOrders);
router.get('/orders/:id', verifyAdminToken, adminController.getOrderById);
router.put('/orders/:id/status', verifyAdminToken, adminController.updateOrderStatus);
router.put('/orders/:id/assign', verifyAdminToken, adminController.assignDeliveryPartner);

module.exports = router;
