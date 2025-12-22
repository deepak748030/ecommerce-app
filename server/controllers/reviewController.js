const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create a review for a product
// @route   POST /api/reviews
// @access  Private
exports.createReview = async (req, res) => {
    try {
        const { productId, orderId, rating, comment, images } = req.body;

        // Validate required fields
        if (!productId || !orderId || !rating) {
            return res.status(400).json({
                success: false,
                message: 'Product ID, Order ID, and rating are required',
            });
        }

        // Check if order exists and belongs to user
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only review products from your own orders',
            });
        }

        // Check if order is delivered
        if (order.status !== 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'You can only review products after delivery',
            });
        }

        // Check if product exists in order
        const orderedProduct = order.items.find(
            item => item.product.toString() === productId
        );
        if (!orderedProduct) {
            return res.status(400).json({
                success: false,
                message: 'This product is not in the order',
            });
        }

        // Check if already reviewed
        const existingReview = await Review.findOne({
            user: req.user._id,
            product: productId,
            order: orderId,
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product for this order',
            });
        }

        // Create review
        const review = await Review.create({
            user: req.user._id,
            product: productId,
            order: orderId,
            rating,
            comment: comment || '',
            images: images || [],
            isVerifiedPurchase: true,
        });

        // Populate user data
        await review.populate('user', 'name avatar');

        res.status(201).json({
            success: true,
            message: 'Review submitted successfully',
            response: review,
        });
    } catch (error) {
        console.error('Create review error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already reviewed this product',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to submit review',
        });
    }
};

// @desc    Get reviews for a product
// @route   GET /api/reviews/product/:productId
// @access  Public
exports.getProductReviews = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const reviews = await Review.find({ product: productId })
            .populate('user', 'name avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Review.countDocuments({ product: productId });

        // Get rating distribution using aggregation
        const mongoose = require('mongoose');
        const productObjectId = new mongoose.Types.ObjectId(productId);

        const distributionResult = await Review.aggregate([
            { $match: { product: productObjectId } },
            {
                $group: {
                    _id: null,
                    rating5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                    rating4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                    rating3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                    rating2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                    rating1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
                }
            }
        ]);

        const stats = distributionResult[0] || {};
        const ratingDistribution = {
            5: stats.rating5 || 0,
            4: stats.rating4 || 0,
            3: stats.rating3 || 0,
            2: stats.rating2 || 0,
            1: stats.rating1 || 0
        };

        res.json({
            success: true,
            response: {
                reviews: reviews.map(review => ({
                    id: review._id,
                    userName: review.user?.name || 'Anonymous',
                    userAvatar: review.user?.avatar || '',
                    rating: review.rating,
                    comment: review.comment,
                    images: review.images,
                    date: review.createdAt,
                    isVerifiedPurchase: review.isVerifiedPurchase,
                })),
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                ratingDistribution,
            },
        });
    } catch (error) {
        console.error('Get product reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reviews',
        });
    }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
exports.getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ user: req.user._id })
            .populate('product', 'title image')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            response: {
                count: reviews.length,
                reviews: reviews.map(review => ({
                    id: review._id,
                    productId: review.product?._id,
                    productTitle: review.product?.title,
                    productImage: review.product?.image,
                    rating: review.rating,
                    comment: review.comment,
                    date: review.createdAt,
                })),
            },
        });
    } catch (error) {
        console.error('Get my reviews error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch your reviews',
        });
    }
};

// @desc    Check if user can review products in an order
// @route   GET /api/reviews/can-review/:orderId
// @access  Private
exports.canReviewOrder = async (req, res) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        // Check if order is delivered
        if (order.status !== 'delivered') {
            return res.json({
                success: true,
                response: {
                    canReview: false,
                    reason: 'Order not yet delivered',
                    reviewableProducts: [],
                },
            });
        }

        // Get already reviewed products
        const existingReviews = await Review.find({
            user: req.user._id,
            order: orderId,
        }).select('product');

        const reviewedProductIds = existingReviews.map(r => r.product.toString());

        // Filter products that can be reviewed
        const reviewableProducts = order.items
            .filter(item => !reviewedProductIds.includes(item.product.toString()))
            .map(item => ({
                productId: item.product,
                name: item.name,
                image: item.image,
            }));

        res.json({
            success: true,
            response: {
                canReview: reviewableProducts.length > 0,
                reviewableProducts,
                alreadyReviewed: reviewedProductIds.length,
            },
        });
    } catch (error) {
        console.error('Can review order error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check review status',
        });
    }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: 'Review not found',
            });
        }

        if (review.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete your own reviews',
            });
        }

        const productId = review.product;
        await review.remove();

        // Recalculate product rating
        await Review.calculateAverageRating(productId);

        res.json({
            success: true,
            message: 'Review deleted successfully',
        });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete review',
        });
    }
};
