const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        default: '',
    },
    email: {
        type: String,
        default: '',
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    avatar: {
        type: String,
        default: '',
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    // Admin role - only admin can upload products
    isAdmin: {
        type: Boolean,
        default: false,
    },
    expoPushToken: {
        type: String,
        default: '',
    },
    // Notification preferences
    notificationSettings: {
        pushEnabled: {
            type: Boolean,
            default: true,
        },
        orderUpdates: {
            type: Boolean,
            default: false,
        },
        promotions: {
            type: Boolean,
            default: false,
        },
    },
    // Vendor Wallet
    wallet: {
        balance: {
            type: Number,
            default: 0,
        },
        pendingBalance: {
            type: Number,
            default: 0,
        },
        totalEarnings: {
            type: Number,
            default: 0,
        },
        totalWithdrawn: {
            type: Number,
            default: 0,
        },
    },
    memberSince: {
        type: Date,
        default: Date.now,
    },
    // Soft delete fields
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
        default: null,
    },
    scheduledDeletionDate: {
        type: Date,
        default: null,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
