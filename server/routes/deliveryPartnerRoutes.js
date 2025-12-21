const express = require('express');
const router = express.Router();
const {
    login,
    verifyOtp,
    resendOtp,
    completeProfile,
    getMe,
    updateProfile,
    toggleOnline,
    logout,
    getAvailableOrders,
    getActiveOrders,
    acceptOrder,
    initiatePickup,
    verifyPickupOtp,
    updateDeliveryStatus,
    getOrderHistory,
    getOrderById,
    getEarnings,
    getEarningsHistory,
} = require('../controllers/deliveryPartnerController');
const { protectPartner } = require('../middleware/auth');

// Public routes
router.post('/auth/login', login);
router.post('/auth/verify-otp', verifyOtp);
router.post('/auth/resend-otp', resendOtp);
router.post('/auth/complete-profile', completeProfile);

// Protected routes (use protectPartner instead of protect)
router.get('/auth/me', protectPartner, getMe);
router.put('/auth/profile', protectPartner, updateProfile);
router.put('/auth/toggle-online', protectPartner, toggleOnline);
router.post('/auth/logout', protectPartner, logout);

// Order routes for delivery partners
router.get('/orders/available', protectPartner, getAvailableOrders);
router.get('/orders/active', protectPartner, getActiveOrders);
router.get('/orders/history', protectPartner, getOrderHistory);
router.get('/orders/:id', protectPartner, getOrderById);
router.post('/orders/:id/accept', protectPartner, acceptOrder);
router.post('/orders/:id/initiate-pickup', protectPartner, initiatePickup);
router.post('/orders/:id/verify-pickup', protectPartner, verifyPickupOtp);
router.put('/orders/:id/status', protectPartner, updateDeliveryStatus);

// Earnings routes
router.get('/earnings', protectPartner, getEarnings);
router.get('/earnings/history', protectPartner, getEarningsHistory);

module.exports = router;
