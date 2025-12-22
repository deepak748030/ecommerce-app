const express = require('express');
const router = express.Router();
const {
    adminLogin,
    getAdminProfile,
    setupDefaultAdmin,
    getUsers,
    getUserById,
    toggleUserBlock,
    getDashboardStats,
    getDashboardAnalytics,
} = require('../controllers/adminController');
const { verifyAdminToken } = require('../middleware/adminAuth');

// Public routes
router.post('/login', adminLogin);
router.post('/setup', setupDefaultAdmin);

// Protected routes
router.get('/me', verifyAdminToken, getAdminProfile);
router.get('/users', verifyAdminToken, getUsers);
router.get('/users/:id', verifyAdminToken, getUserById);
router.put('/users/:id/block', verifyAdminToken, toggleUserBlock);
router.get('/stats', verifyAdminToken, getDashboardStats);
router.get('/analytics', verifyAdminToken, getDashboardAnalytics);

module.exports = router;
