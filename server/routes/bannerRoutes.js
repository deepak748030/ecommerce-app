const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
    getBanners,
    getBanner,
    createBanner,
    updateBanner,
    deleteBanner,
} = require('../controllers/bannerController');

// Public routes
router.get('/', getBanners);
router.get('/:id', getBanner);

// Protected routes (Admin)
router.post('/', protect, createBanner);
router.put('/:id', protect, updateBanner);
router.delete('/:id', protect, deleteBanner);

module.exports = router;
