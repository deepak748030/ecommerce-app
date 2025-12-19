const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        default: '',
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    mrp: {
        type: Number,
        required: true,
        min: 0,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    // Store main image as base64 string in database
    image: {
        type: String,
        default: '',
    },
    // Store additional images as base64 strings
    images: [{
        type: String,
    }],
    badge: {
        type: String,
        default: '',
    },
    location: {
        type: String,
        default: '',
    },
    fullLocation: {
        type: String,
        default: '',
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    reviews: {
        type: Number,
        default: 0,
    },
    date: {
        type: String,
        default: '',
    },
    time: {
        type: String,
        default: '',
    },
    services: [{
        type: String,
    }],
    isActive: {
        type: Boolean,
        default: true,
    },
    // Track who created the product (admin only)
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true,
});

// Index for faster queries
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
