const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    createReview,
    getProductReviews,
    getMyReviews,
    canReviewOrder,
    deleteReview,
} = require('../controllers/reviewController');

// Public routes
router.get('/product/:productId', getProductReviews);

// Protected routes
router.post('/', protect, createReview);
router.get('/my-reviews', protect, getMyReviews);
router.get('/can-review/:orderId', protect, canReviewOrder);
router.delete('/:id', protect, deleteReview);

module.exports = router;
