const express = require('express');
const router = express.Router();
const {
    getWalletBalance,
    getWalletTransactions,
    getWalletSummary,
    requestWithdrawal,
    getWithdrawalHistory,
} = require('../controllers/walletController');
const { verifyToken } = require('../middleware/auth');

// All wallet routes are protected
router.use(verifyToken);

// Wallet routes
router.get('/balance', getWalletBalance);
router.get('/transactions', getWalletTransactions);
router.get('/summary', getWalletSummary);
router.post('/withdraw', requestWithdrawal);
router.get('/withdrawals', getWithdrawalHistory);

module.exports = router;
