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
} = require('../controllers/deliveryPartnerController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/auth/login', login);
router.post('/auth/verify-otp', verifyOtp);
router.post('/auth/resend-otp', resendOtp);
router.post('/auth/complete-profile', completeProfile);

// Protected routes
router.get('/auth/me', protect, getMe);
router.put('/auth/profile', protect, updateProfile);
router.put('/auth/toggle-online', protect, toggleOnline);
router.post('/auth/logout', protect, logout);

module.exports = router;
