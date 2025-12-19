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
    memberSince: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
