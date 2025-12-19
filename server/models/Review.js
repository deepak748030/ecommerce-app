const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
    },
    comment: {
        type: String,
        default: '',
        maxlength: 500,
    },
    images: [{
        type: String,
    }],
    isVerifiedPurchase: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

// Prevent duplicate reviews for same product in same order
reviewSchema.index({ user: 1, product: 1, order: 1 }, { unique: true });
reviewSchema.index({ product: 1, createdAt: -1 });

// Static method to calculate product rating
reviewSchema.statics.calculateAverageRating = async function (productId) {
    const Product = require('./Product');

    const result = await this.aggregate([
        { $match: { product: productId } },
        {
            $group: {
                _id: '$product',
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
                rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
            }
        }
    ]);

    if (result.length > 0) {
        await Product.findByIdAndUpdate(productId, {
            rating: Math.round(result[0].averageRating * 10) / 10,
            reviews: result[0].totalReviews,
        });
        return result[0];
    } else {
        await Product.findByIdAndUpdate(productId, {
            rating: 0,
            reviews: 0,
        });
        return null;
    }
};

// Update product rating after save
reviewSchema.post('save', async function () {
    await this.constructor.calculateAverageRating(this.product);
});

// Update product rating after remove
reviewSchema.post('remove', async function () {
    await this.constructor.calculateAverageRating(this.product);
});

module.exports = mongoose.model('Review', reviewSchema);
