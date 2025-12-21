const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema({
    name: {
        type: String,
        default: '',
    },
    phone: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        default: '',
    },
    avatar: {
        type: String,
        default: '',
    },
    // Vehicle details
    vehicle: {
        type: {
            type: String,
            enum: ['bike', 'scooter', 'car', 'bicycle'],
            default: 'bike',
        },
        number: {
            type: String,
            default: '',
        },
        model: {
            type: String,
            default: '',
        },
        color: {
            type: String,
            default: '',
        },
    },
    // Documents
    documents: {
        license: {
            type: String,
            default: '',
        },
        vehicleRC: {
            type: String,
            default: '',
        },
        insurance: {
            type: String,
            default: '',
        },
    },
    // Status
    isActive: {
        type: Boolean,
        default: false,
    },
    isOnline: {
        type: Boolean,
        default: false,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
    // Profile completion
    isProfileComplete: {
        type: Boolean,
        default: false,
    },
    // Stats
    stats: {
        totalDeliveries: {
            type: Number,
            default: 0,
        },
        rating: {
            type: Number,
            default: 5.0,
        },
        totalRatings: {
            type: Number,
            default: 0,
        },
    },
    // Earnings
    earnings: {
        today: {
            type: Number,
            default: 0,
        },
        week: {
            type: Number,
            default: 0,
        },
        month: {
            type: Number,
            default: 0,
        },
        total: {
            type: Number,
            default: 0,
        },
    },
    // Push notifications
    expoPushToken: {
        type: String,
        default: '',
    },
    // Location
    currentLocation: {
        latitude: Number,
        longitude: Number,
        updatedAt: Date,
    },
    memberSince: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
