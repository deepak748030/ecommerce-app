const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    transactionId: {
        type: String,
        unique: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentMethod: {
        type: String,
        enum: ['upi', 'card', 'wallet', 'cod'],
        required: true,
    },
    paymentDetails: {
        upiId: String,
        cardLast4: String,
        walletName: String,
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
        default: 'pending',
    },
    type: {
        type: String,
        enum: ['payment', 'refund'],
        default: 'payment',
    },
    description: String,
    refundReason: String,
    refundedAt: Date,
}, {
    timestamps: true,
});

// Generate transaction ID before saving
transactionSchema.pre('save', async function (next) {
    if (!this.transactionId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.transactionId = `TXN-${timestamp}-${random}`;
    }
    next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
