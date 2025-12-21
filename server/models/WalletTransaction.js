const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
    },
    transactionId: {
        type: String,
        unique: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        enum: ['credit', 'debit', 'withdrawal', 'refund_debit'],
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed',
    },
    description: {
        type: String,
        default: '',
    },
    balanceAfter: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Generate transaction ID before saving
walletTransactionSchema.pre('save', async function (next) {
    if (!this.transactionId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.transactionId = `WLT-${timestamp}-${random}`;
    }
    next();
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
