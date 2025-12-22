const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    name: String,
    price: Number,
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    image: String,
});

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    deliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner',
        default: null,
    },
    orderNumber: {
        type: String,
        unique: true,
    },
    items: [orderItemSchema],
    shippingAddress: {
        name: String,
        phone: String,
        address: String,
        city: String,
        state: String,
        pincode: String,
    },
    paymentMethod: {
        type: String,
        enum: ['upi', 'card', 'wallet', 'cod'],
        default: 'upi',
    },
    subtotal: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        default: 0,
    },
    shipping: {
        type: Number,
        default: 0,
    },
    tax: {
        type: Number,
        default: 0,
    },
    total: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending',
    },
    timeline: [{
        status: String,
        date: Date,
        completed: {
            type: Boolean,
            default: false,
        },
    }],
    promoCode: String,
    deliveredAt: Date,
    deliveryTip: {
        type: Number,
        default: 0,
    },
    deliveryFee: {
        type: Number,
        default: 40,
    },
    estimatedDeliveryTime: {
        type: String,
        default: '30-45 min',
    },
    // Vendor-set delivery details when shipping
    deliveryPayment: {
        type: Number,
        default: 0,
    },
    deliveryTimeMinutes: {
        type: Number,
        default: 30,
    },
}, {
    timestamps: true,
});

// Generate order number before saving
orderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const year = new Date().getFullYear();
        const count = await mongoose.model('Order').countDocuments();
        this.orderNumber = `ORD-${year}-${String(count + 1).padStart(3, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
