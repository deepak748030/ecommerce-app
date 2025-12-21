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

module.exports = router;
