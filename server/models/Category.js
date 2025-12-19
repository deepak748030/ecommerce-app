const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    // Store category image as base64 string in database
    image: {
        type: String,
        default: '',
    },
    color: {
        type: String,
        default: '#DCFCE7',
    },
    itemsCount: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Category', categorySchema);
