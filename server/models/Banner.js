const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    subtitle: {
        type: String,
        default: '',
    },
    image: {
        type: String,
        required: true,
    },
    badge: {
        type: String,
        default: '',
    },
    gradient: {
        type: [String],
        default: ['#22C55E', '#16A34A'],
    },
    linkType: {
        type: String,
        enum: ['category', 'product', 'search', 'external'],
        default: 'search',
    },
    linkValue: {
        type: String,
        default: '',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    order: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Banner', bannerSchema);
