const express = require('express');
const router = express.Router();
const { validateCoupon, getActiveCoupons, createCoupon } = require('../controllers/couponController');
const { protect } = require('../middleware/auth');

// POST /coupons/validate - Validate and get discount for a coupon
router.post('/validate', validateCoupon);

// GET /coupons - Get all active coupons
router.get('/', getActiveCoupons);

// POST /coupons - Create new coupon (Admin)
router.post('/', protect, createCoupon);

module.exports = router;
