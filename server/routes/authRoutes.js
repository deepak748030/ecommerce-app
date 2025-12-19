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
    logout,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/register', register);

// Protected routes
router.get('/me', verifyToken, getMe);
router.put('/profile', verifyToken, updateProfile);
router.put('/push-token', verifyToken, updatePushToken);
router.post('/logout', verifyToken, logout);

module.exports = router;
