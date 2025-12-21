const express = require('express');
const router = express.Router();
const {
    getWalletBalance,
    getWalletTransactions,
    getWalletSummary,
} = require('../controllers/walletController');
const { verifyToken } = require('../middleware/auth');

// All wallet routes are protected
router.use(verifyToken);

// Wallet routes
router.get('/balance', getWalletBalance);
router.get('/transactions', getWalletTransactions);
router.get('/summary', getWalletSummary);

module.exports = router;
