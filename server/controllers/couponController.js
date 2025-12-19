const Coupon = require('../models/Coupon');

// Validate and apply coupon
exports.validateCoupon = async (req, res) => {
    try {
        const { code, orderTotal } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code is required',
            });
        }

        const coupon = await Coupon.findOne({
            code: code.toUpperCase().trim(),
            isActive: true,
        });

        if (!coupon) {
            return res.status(404).json({
                success: false,
                message: 'Invalid coupon code',
            });
        }

        const now = new Date();

        // Check if coupon has started
        if (coupon.validFrom > now) {
            return res.status(400).json({
                success: false,
                message: 'This coupon is not yet active',
            });
        }

        // Check if coupon has expired
        if (coupon.validUntil < now) {
            return res.status(400).json({
                success: false,
                message: 'This coupon has expired',
            });
        }

        // Check usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({
                success: false,
                message: 'This coupon has reached its usage limit',
            });
        }

        // Check minimum order value
        if (orderTotal && coupon.minOrderValue > orderTotal) {
            return res.status(400).json({
                success: false,
                message: `Minimum order value of ₹${coupon.minOrderValue} required`,
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discountType === 'percentage') {
            discountAmount = Math.round((orderTotal || 0) * (coupon.discountValue / 100));
            if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        } else {
            discountAmount = coupon.discountValue;
        }

        res.json({
            success: true,
            message: 'Coupon applied successfully',
            response: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount,
                maxDiscount: coupon.maxDiscount,
                minOrderValue: coupon.minOrderValue,
                description: coupon.description,
            },
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to validate coupon',
        });
    }
};

// Get all active coupons (for display)
exports.getActiveCoupons = async (req, res) => {
    try {
        const now = new Date();
        const coupons = await Coupon.find({
            isActive: true,
            validFrom: { $lte: now },
            validUntil: { $gte: now },
            $or: [
                { usageLimit: null },
                { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
            ],
        }).select('code discountType discountValue maxDiscount minOrderValue description');

        res.json({
            success: true,
            response: {
                count: coupons.length,
                data: coupons,
            },
        });
    } catch (error) {
        console.error('Get coupons error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch coupons',
        });
    }
};

// Create coupon (Admin)
exports.createCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            response: coupon,
        });
    } catch (error) {
        console.error('Create coupon error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Coupon code already exists',
            });
        }
        res.status(500).json({
            success: false,
            message: 'Failed to create coupon',
        });
    }
};

// Increment coupon usage (called when order is placed)
exports.useCoupon = async (code) => {
    try {
        await Coupon.findOneAndUpdate(
            { code: code.toUpperCase().trim() },
            { $inc: { usedCount: 1 } }
        );
    } catch (error) {
        console.error('Use coupon error:', error);
    }
};
