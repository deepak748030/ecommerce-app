const Banner = require('../models/Banner');
const { uploadBannerImage, isBase64Image } = require('../services/cloudinaryService');

// @desc    Get all active banners
// @route   GET /api/banners
// @access  Public
exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ order: 1 });

        res.json({
            success: true,
            response: {
                count: banners.length,
                data: banners,
            },
        });
    } catch (error) {
        console.error('Get banners error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch banners',
        });
    }
};

// @desc    Get single banner
// @route   GET /api/banners/:id
// @access  Public
exports.getBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found',
            });
        }

        res.json({
            success: true,
            response: banner,
        });
    } catch (error) {
        console.error('Get banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch banner',
        });
    }
};

// @desc    Create banner
// @route   POST /api/banners
// @access  Private (Admin)
exports.createBanner = async (req, res) => {
    try {
        const { title, subtitle, image, badge, gradient, linkType, linkValue, order } = req.body;

        // Upload image to Cloudinary if base64 provided
        let imageUrl = '';
        if (image && isBase64Image(image)) {
            const tempId = Date.now().toString();
            const uploadResult = await uploadBannerImage(image, tempId);
            if (uploadResult.success) {
                imageUrl = uploadResult.url;
            } else {
                console.error('Failed to upload banner image:', uploadResult.error);
                return res.status(400).json({ success: false, message: 'Failed to upload image to Cloudinary' });
            }
        } else if (image) {
            imageUrl = image;
        }

        const banner = await Banner.create({
            title,
            subtitle,
            image: imageUrl,
            badge,
            gradient,
            linkType,
            linkValue,
            order: order || 0,
        });

        res.status(201).json({
            success: true,
            response: banner,
        });
    } catch (error) {
        console.error('Create banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create banner',
        });
    }
};

// @desc    Update banner
// @route   PUT /api/banners/:id
// @access  Private (Admin)
exports.updateBanner = async (req, res) => {
    try {
        const { image, ...otherFields } = req.body;

        // If image is base64, upload to Cloudinary
        let updateData = { ...otherFields };
        if (image) {
            if (isBase64Image(image)) {
                const uploadResult = await uploadBannerImage(image, req.params.id);
                if (uploadResult.success) {
                    updateData.image = uploadResult.url;
                } else {
                    console.error('Failed to upload banner image:', uploadResult.error);
                    return res.status(400).json({ success: false, message: 'Failed to upload image to Cloudinary' });
                }
            } else {
                updateData.image = image;
            }
        }

        const banner = await Banner.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found',
            });
        }

        res.json({
            success: true,
            response: banner,
        });
    } catch (error) {
        console.error('Update banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update banner',
        });
    }
};

// @desc    Delete banner
// @route   DELETE /api/banners/:id
// @access  Private (Admin)
exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findByIdAndDelete(req.params.id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found',
            });
        }

        res.json({
            success: true,
            response: { id: req.params.id },
        });
    } catch (error) {
        console.error('Delete banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete banner',
        });
    }
};
