const express = require('express');
const router = express.Router();
const {
    login,
    verifyOtp,
    resendOtp,
    register,
    getMe,
    updateProfile,
    updatePushToken,
    getNotificationSettings,
    updateNotificationSettings,
    logout,
    sendDeleteOtp,
    verifyDeleteOtp,
    confirmDeleteAccount,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/register', register);

// Delete account routes (public - no auth required for Google Play compliance)
router.post('/delete-account/send-otp', sendDeleteOtp);
router.post('/delete-account/verify-otp', verifyDeleteOtp);
router.post('/delete-account/confirm', confirmDeleteAccount);

// Protected routes
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);
router.put('/push-token', verifyToken, updatePushToken);
router.get('/notification-settings', verifyToken, getNotificationSettings);
router.put('/notification-settings', verifyToken, updateNotificationSettings);
router.post('/logout', verifyToken, logout);

module.exports = router;
