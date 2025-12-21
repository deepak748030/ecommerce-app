const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get vendor wallet balance
// @route   GET /api/wallet/balance
// @access  Private
const getWalletBalance = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Initialize wallet if not exists
        if (!user.wallet) {
            user.wallet = {
                balance: 0,
                pendingBalance: 0,
                totalEarnings: 0,
                totalWithdrawn: 0,
            };
            await user.save();
        }

        res.json({
            success: true,
            message: 'Wallet balance fetched successfully',
            response: {
                balance: user.wallet.balance,
                pendingBalance: user.wallet.pendingBalance,
                totalEarnings: user.wallet.totalEarnings,
                totalWithdrawn: user.wallet.totalWithdrawn,
                currency: 'INR',
                currencySymbol: '₹',
            },
        });
    } catch (error) {
        console.error('Get wallet balance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get vendor wallet transactions
// @route   GET /api/wallet/transactions
// @access  Private
const getWalletTransactions = async (req, res) => {
    try {
        const { page = 1, limit = 20, type } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { vendor: req.user._id };
        if (type) {
            query.type = type;
        }

        const transactions = await WalletTransaction.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate({
                path: 'order',
                select: 'orderNumber total status',
            });

        const total = await WalletTransaction.countDocuments(query);

        res.json({
            success: true,
            message: 'Wallet transactions fetched successfully',
            response: {
                count: transactions.length,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                data: transactions,
            },
        });
    } catch (error) {
        console.error('Get wallet transactions error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Credit vendor wallet (internal use)
// @param   vendorId - Vendor user ID
// @param   amount - Amount to credit
// @param   orderId - Related order ID
// @param   description - Transaction description
const creditVendorWallet = async (vendorId, amount, orderId, description) => {
    try {
        const vendor = await User.findById(vendorId);
        if (!vendor) {
            console.error('Vendor not found for wallet credit:', vendorId);
            return null;
        }

        // Initialize wallet if not exists
        if (!vendor.wallet) {
            vendor.wallet = {
                balance: 0,
                pendingBalance: 0,
                totalEarnings: 0,
                totalWithdrawn: 0,
            };
        }

        // Add to pending balance first (will be released when order is delivered)
        vendor.wallet.pendingBalance += amount;
        await vendor.save();

        // Create wallet transaction
        const transaction = await WalletTransaction.create({
            vendor: vendorId,
            order: orderId,
            amount: amount,
            type: 'credit',
            status: 'pending',
            description: description || 'Order payment received',
            balanceAfter: vendor.wallet.balance,
        });

        console.log(`Wallet credited: Vendor ${vendorId}, Amount ₹${amount}, Order ${orderId}`);
        return transaction;
    } catch (error) {
        console.error('Credit vendor wallet error:', error);
        return null;
    }
};

// @desc    Release pending balance to available (when order is delivered)
// @param   vendorId - Vendor user ID
// @param   amount - Amount to release
// @param   orderId - Related order ID
const releasePendingBalance = async (vendorId, amount, orderId) => {
    try {
        // Use findOneAndUpdate for atomic operation
        const vendor = await User.findById(vendorId);
        if (!vendor) {
            console.error('Vendor not found:', vendorId);
            return null;
        }

        // Initialize wallet if not exists
        if (!vendor.wallet) {
            vendor.wallet = {
                balance: 0,
                pendingBalance: 0,
                totalEarnings: 0,
                totalWithdrawn: 0,
            };
        }

        // Calculate amount to release
        const amountToRelease = Math.min(amount, vendor.wallet.pendingBalance);

        // Update wallet balances atomically
        const updatedVendor = await User.findByIdAndUpdate(
            vendorId,
            {
                $inc: {
                    'wallet.balance': amountToRelease,
                    'wallet.pendingBalance': -amountToRelease,
                    'wallet.totalEarnings': amountToRelease,
                },
            },
            { new: true }
        );

        // Update the transaction status for this order
        await WalletTransaction.findOneAndUpdate(
            { vendor: vendorId, order: orderId, type: 'credit' },
            {
                status: 'completed',
                balanceAfter: updatedVendor.wallet.balance,
                description: 'Order delivered - payment released',
            },
            { new: true }
        );

        console.log(`Pending balance released: Vendor ${vendorId}, Amount ₹${amountToRelease}, New Balance: ₹${updatedVendor.wallet.balance}`);
        return updatedVendor.wallet;
    } catch (error) {
        console.error('Release pending balance error:', error);
        return null;
    }
};

// @desc    Debit vendor wallet on order cancellation
// @param   vendorId - Vendor user ID
// @param   amount - Amount to debit
// @param   orderId - Related order ID
// @param   description - Transaction description
const debitVendorWallet = async (vendorId, amount, orderId, description) => {
    try {
        const vendor = await User.findById(vendorId);
        if (!vendor || !vendor.wallet) {
            console.error('Vendor or wallet not found:', vendorId);
            return null;
        }

        // First try to debit from pending balance
        if (vendor.wallet.pendingBalance >= amount) {
            vendor.wallet.pendingBalance -= amount;
        } else {
            // If pending is not enough, debit from available balance
            const remainingAmount = amount - vendor.wallet.pendingBalance;
            vendor.wallet.pendingBalance = 0;
            vendor.wallet.balance = Math.max(0, vendor.wallet.balance - remainingAmount);
        }
        await vendor.save();

        // Create debit transaction
        const transaction = await WalletTransaction.create({
            vendor: vendorId,
            order: orderId,
            amount: amount,
            type: 'refund_debit',
            status: 'completed',
            description: description || 'Order cancelled - refund processed',
            balanceAfter: vendor.wallet.balance,
        });

        console.log(`Wallet debited: Vendor ${vendorId}, Amount ₹${amount}, Order ${orderId}`);
        return transaction;
    } catch (error) {
        console.error('Debit vendor wallet error:', error);
        return null;
    }
};

// @desc    Get wallet summary for analytics
// @route   GET /api/wallet/summary
// @access  Private
const getWalletSummary = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Get recent transactions
        const recentTransactions = await WalletTransaction.find({ vendor: req.user._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate({
                path: 'order',
                select: 'orderNumber',
            });

        // Get transaction stats
        const creditStats = await WalletTransaction.aggregate([
            { $match: { vendor: req.user._id, type: 'credit', status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        const debitStats = await WalletTransaction.aggregate([
            { $match: { vendor: req.user._id, type: { $in: ['debit', 'refund_debit', 'withdrawal'] } } },
            { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
        ]);

        res.json({
            success: true,
            message: 'Wallet summary fetched successfully',
            response: {
                wallet: user.wallet || { balance: 0, pendingBalance: 0, totalEarnings: 0, totalWithdrawn: 0 },
                recentTransactions,
                stats: {
                    totalCredits: creditStats[0]?.total || 0,
                    totalDebits: debitStats[0]?.total || 0,
                    creditCount: creditStats[0]?.count || 0,
                    debitCount: debitStats[0]?.count || 0,
                },
                currency: 'INR',
                currencySymbol: '₹',
            },
        });
    } catch (error) {
        console.error('Get wallet summary error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Request withdrawal
// @route   POST /api/wallet/withdraw
// @access  Private
const requestWithdrawal = async (req, res) => {
    try {
        const { amount, upiId, accountDetails } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid withdrawal amount',
            });
        }

        const user = await User.findById(req.user._id);

        if (!user || !user.wallet) {
            return res.status(404).json({
                success: false,
                message: 'Wallet not found',
            });
        }

        if (user.wallet.balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance',
            });
        }

        // Minimum withdrawal amount
        if (amount < 100) {
            return res.status(400).json({
                success: false,
                message: 'Minimum withdrawal amount is ₹100',
            });
        }

        // Deduct from balance and add to withdrawn
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $inc: {
                    'wallet.balance': -amount,
                    'wallet.totalWithdrawn': amount,
                },
            }
        );

        // Create withdrawal transaction
        const transaction = await WalletTransaction.create({
            vendor: req.user._id,
            amount: amount,
            type: 'withdrawal',
            status: 'pending',
            description: `Withdrawal request - ${upiId || 'Bank Transfer'}`,
            balanceAfter: user.wallet.balance - amount,
        });

        const updatedUser = await User.findById(req.user._id);

        res.json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            response: {
                transaction,
                wallet: {
                    balance: updatedUser.wallet.balance,
                    pendingBalance: updatedUser.wallet.pendingBalance,
                    totalEarnings: updatedUser.wallet.totalEarnings,
                    totalWithdrawn: updatedUser.wallet.totalWithdrawn,
                },
            },
        });
    } catch (error) {
        console.error('Request withdrawal error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getWalletBalance,
    getWalletTransactions,
    getWalletSummary,
    creditVendorWallet,
    releasePendingBalance,
    debitVendorWallet,
    requestWithdrawal,
};
