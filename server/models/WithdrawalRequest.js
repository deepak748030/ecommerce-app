const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema({
    // Requester info - can be either User (vendor) or DeliveryPartner
    requesterType: {
        type: String,
        enum: ['vendor', 'delivery_partner'],
        required: true,
    },
    // Reference to User (for vendors)
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    // Reference to DeliveryPartner
    deliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner',
    },
    // Request ID for tracking
    requestId: {
        type: String,
        unique: true,
    },
    // Amount requested
    amount: {
        type: Number,
        required: true,
        min: 100, // Minimum withdrawal amount
    },
    // Payment method
    paymentMethod: {
        type: String,
        enum: ['upi', 'bank_transfer', 'paytm', 'phonepe', 'googlepay'],
        required: true,
    },
    // Payment details
    paymentDetails: {
        // UPI
        upiId: {
            type: String,
            default: '',
        },
        // Bank transfer
        accountHolderName: {
            type: String,
            default: '',
        },
        accountNumber: {
            type: String,
            default: '',
        },
        ifscCode: {
            type: String,
            default: '',
        },
        bankName: {
            type: String,
            default: '',
        },
        // Mobile wallet
        mobileNumber: {
            type: String,
            default: '',
        },
    },
    // Status
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'rejected'],
        default: 'pending',
    },
    // Admin notes
    adminNotes: {
        type: String,
        default: '',
    },
    // Rejection reason
    rejectionReason: {
        type: String,
        default: '',
    },
    // Transaction reference (for completed)
    transactionReference: {
        type: String,
        default: '',
    },
    // Processed by admin
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
    },
    processedAt: {
        type: Date,
    },
    // Balance before withdrawal
    balanceBefore: {
        type: Number,
        default: 0,
    },
    // Balance after withdrawal (when completed)
    balanceAfter: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Generate request ID before saving
withdrawalRequestSchema.pre('save', async function (next) {
    if (!this.requestId) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const prefix = this.requesterType === 'vendor' ? 'WV' : 'WD';
        this.requestId = `${prefix}-${timestamp}-${random}`;
    }
    next();
});

// Index for efficient queries
withdrawalRequestSchema.index({ status: 1, createdAt: -1 });
withdrawalRequestSchema.index({ requesterType: 1, status: 1 });
withdrawalRequestSchema.index({ user: 1, status: 1 });
withdrawalRequestSchema.index({ deliveryPartner: 1, status: 1 });

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);
