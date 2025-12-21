const DeliveryPartner = require('../models/DeliveryPartner');
const Otp = require('../models/Otp');
const Order = require('../models/Order');
const { generateToken } = require('../middleware/auth');

// @desc    Send OTP to phone (Login/Signup)
// @route   POST /api/delivery-partner/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        // Store OTP (hardcoded 123456 for development)
        await Otp.findOneAndUpdate(
            { phone },
            { phone, otp: '123456', expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
            { upsert: true, new: true }
        );

        const existingPartner = await DeliveryPartner.findOne({ phone });

        res.json({
            success: true,
            message: 'OTP sent successfully',
            response: {
                phone,
                isNewUser: !existingPartner,
                isProfileComplete: existingPartner?.isProfileComplete || false,
                isBlocked: existingPartner?.isBlocked || false,
            },
        });
    } catch (error) {
        console.error('Delivery Partner Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Verify OTP and login/register
// @route   POST /api/delivery-partner/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
    try {
        const { phone, otp, expoPushToken } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
        }

        const storedOtp = await Otp.findOne({ phone });

        // Check OTP (always accept 123456 for development)
        if (otp !== '123456' && (!storedOtp || storedOtp.otp !== otp || new Date() > storedOtp.expiresAt)) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Clear OTP
        await Otp.deleteOne({ phone });

        // Find or create delivery partner
        let partner = await DeliveryPartner.findOne({ phone });
        const isNewUser = !partner;

        if (!partner) {
            partner = await DeliveryPartner.create({
                phone,
                expoPushToken: expoPushToken || '',
            });
        } else if (expoPushToken) {
            partner.expoPushToken = expoPushToken;
            await partner.save();
        }

        const token = generateToken(partner._id);

        res.json({
            success: true,
            message: isNewUser ? 'Partner registered successfully' : 'Login successful',
            response: {
                token,
                partner: {
                    id: partner._id,
                    name: partner.name,
                    phone: partner.phone,
                    avatar: partner.avatar,
                    vehicle: partner.vehicle,
                    isProfileComplete: partner.isProfileComplete,
                    isVerified: partner.isVerified,
                    isBlocked: partner.isBlocked,
                    stats: partner.stats,
                    earnings: partner.earnings,
                    memberSince: partner.memberSince,
                },
                isNewUser,
            },
        });
    } catch (error) {
        console.error('Delivery Partner Verify OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Resend OTP
// @route   POST /api/delivery-partner/auth/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        await Otp.findOneAndUpdate(
            { phone },
            { phone, otp: '123456', expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: 'OTP resent successfully',
            response: {
                phone,
                otpSent: true,
            },
        });
    } catch (error) {
        console.error('Delivery Partner Resend OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Complete profile with vehicle details
// @route   POST /api/delivery-partner/auth/complete-profile
// @access  Private
const completeProfile = async (req, res) => {
    try {
        const { partnerId, name, vehicleType, vehicleNumber, vehicleModel, vehicleColor } = req.body;

        if (!partnerId) {
            return res.status(400).json({ success: false, message: 'Partner ID is required' });
        }

        const partner = await DeliveryPartner.findById(partnerId);

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        partner.name = name || partner.name;
        partner.vehicle = {
            type: vehicleType || 'bike',
            number: vehicleNumber || '',
            model: vehicleModel || '',
            color: vehicleColor || '',
        };
        partner.isProfileComplete = true;

        await partner.save();

        res.json({
            success: true,
            message: 'Profile completed successfully',
            response: {
                partner: {
                    id: partner._id,
                    name: partner.name,
                    phone: partner.phone,
                    avatar: partner.avatar,
                    vehicle: partner.vehicle,
                    isProfileComplete: partner.isProfileComplete,
                    isVerified: partner.isVerified,
                    isBlocked: partner.isBlocked,
                    stats: partner.stats,
                    earnings: partner.earnings,
                    memberSince: partner.memberSince,
                },
            },
        });
    } catch (error) {
        console.error('Complete Profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get partner profile
// @route   GET /api/delivery-partner/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const partner = await DeliveryPartner.findById(partnerId);

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        res.json({
            success: true,
            response: {
                id: partner._id,
                name: partner.name,
                phone: partner.phone,
                avatar: partner.avatar,
                vehicle: partner.vehicle,
                isProfileComplete: partner.isProfileComplete,
                isVerified: partner.isVerified,
                isOnline: partner.isOnline,
                isBlocked: partner.isBlocked,
                stats: partner.stats,
                earnings: partner.earnings,
                memberSince: partner.memberSince,
            },
        });
    } catch (error) {
        console.error('Get Partner Profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update partner profile
// @route   PUT /api/delivery-partner/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const { name, avatar, vehicleType, vehicleNumber, vehicleModel, vehicleColor } = req.body;

        const partner = await DeliveryPartner.findById(partnerId);

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        if (name !== undefined) partner.name = name;
        if (avatar !== undefined) partner.avatar = avatar;
        if (vehicleType !== undefined) partner.vehicle.type = vehicleType;
        if (vehicleNumber !== undefined) partner.vehicle.number = vehicleNumber;
        if (vehicleModel !== undefined) partner.vehicle.model = vehicleModel;
        if (vehicleColor !== undefined) partner.vehicle.color = vehicleColor;

        await partner.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            response: {
                id: partner._id,
                name: partner.name,
                phone: partner.phone,
                avatar: partner.avatar,
                vehicle: partner.vehicle,
                isProfileComplete: partner.isProfileComplete,
                isVerified: partner.isVerified,
                isBlocked: partner.isBlocked,
                stats: partner.stats,
                earnings: partner.earnings,
                memberSince: partner.memberSince,
            },
        });
    } catch (error) {
        console.error('Update Partner Profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Toggle online status
// @route   PUT /api/delivery-partner/auth/toggle-online
// @access  Private
const toggleOnline = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const partner = await DeliveryPartner.findById(partnerId);

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        partner.isOnline = !partner.isOnline;
        await partner.save();

        res.json({
            success: true,
            message: partner.isOnline ? 'You are now online' : 'You are now offline',
            response: {
                isOnline: partner.isOnline,
            },
        });
    } catch (error) {
        console.error('Toggle Online error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Logout partner
// @route   POST /api/delivery-partner/auth/logout
// @access  Private
const logout = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const partner = await DeliveryPartner.findById(partnerId);

        if (partner) {
            partner.expoPushToken = '';
            partner.isOnline = false;
            await partner.save();
        }

        res.json({
            success: true,
            response: {
                loggedOut: true,
            },
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get available orders for delivery partner
// @route   GET /api/delivery-partner/orders/available
// @access  Private
const getAvailableOrders = async (req, res) => {
    try {
        // Get orders that are confirmed/processing but not yet assigned to a delivery partner
        const orders = await Order.find({
            status: { $in: ['confirmed', 'processing'] },
            deliveryPartner: null,
        })
            .populate('user', 'name phone')
            .sort({ createdAt: -1 })
            .limit(20);

        const formattedOrders = orders.map(order => ({
            id: order._id,
            orderId: order.orderNumber,
            status: 'pending',
            pickupAddress: 'Store Location, Main Market',
            deliveryAddress: `${order.shippingAddress.address}, ${order.shippingAddress.city}`,
            customerName: order.shippingAddress.name,
            customerPhone: order.shippingAddress.phone,
            amount: order.deliveryFee || 40,
            tip: order.deliveryTip || 0,
            distance: '2.5 km',
            estimatedTime: order.estimatedDeliveryTime || '30-45 min',
            items: order.items.length,
            createdAt: order.createdAt,
        }));

        res.json({
            success: true,
            response: {
                count: formattedOrders.length,
                data: formattedOrders,
            },
        });
    } catch (error) {
        console.error('Get available orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get active orders for delivery partner
// @route   GET /api/delivery-partner/orders/active
// @access  Private
const getActiveOrders = async (req, res) => {
    try {
        const partnerId = req.user._id;

        const orders = await Order.find({
            deliveryPartner: partnerId,
            status: { $in: ['shipped', 'out_for_delivery'] },
        })
            .populate('user', 'name phone')
            .sort({ createdAt: -1 });

        const formattedOrders = orders.map(order => ({
            id: order._id,
            orderId: order.orderNumber,
            status: order.status === 'shipped' ? 'accepted' : 'picked_up',
            pickupAddress: 'Store Location, Main Market',
            deliveryAddress: `${order.shippingAddress.address}, ${order.shippingAddress.city}`,
            customerName: order.shippingAddress.name,
            customerPhone: order.shippingAddress.phone,
            amount: order.deliveryFee || 40,
            tip: order.deliveryTip || 0,
            distance: '2.5 km',
            estimatedTime: order.estimatedDeliveryTime || '30-45 min',
            items: order.items.length,
            createdAt: order.createdAt,
        }));

        res.json({
            success: true,
            response: {
                count: formattedOrders.length,
                data: formattedOrders,
            },
        });
    } catch (error) {
        console.error('Get active orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Accept an order
// @route   POST /api/delivery-partner/orders/:id/accept
// @access  Private
const acceptOrder = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const orderId = req.params.id;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.deliveryPartner) {
            return res.status(400).json({ success: false, message: 'Order already accepted by another partner' });
        }

        if (!['confirmed', 'processing'].includes(order.status)) {
            return res.status(400).json({ success: false, message: 'Order cannot be accepted' });
        }

        order.deliveryPartner = partnerId;
        order.status = 'shipped';

        // Update timeline
        const timelineIndex = 2; // Shipped index
        for (let i = 0; i <= timelineIndex; i++) {
            if (order.timeline[i]) {
                order.timeline[i].completed = true;
                if (!order.timeline[i].date) {
                    order.timeline[i].date = new Date();
                }
            }
        }

        await order.save();

        // Update partner stats
        const partner = await DeliveryPartner.findById(partnerId);
        if (partner) {
            partner.stats.totalDeliveries = (partner.stats.totalDeliveries || 0) + 1;
            await partner.save();
        }

        res.json({
            success: true,
            message: 'Order accepted successfully',
            response: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: 'accepted',
            },
        });
    } catch (error) {
        console.error('Accept order error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update order delivery status
// @route   PUT /api/delivery-partner/orders/:id/status
// @access  Private
const updateDeliveryStatus = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const orderId = req.params.id;
        const { status } = req.body;

        const validStatuses = ['picked_up', 'out_for_delivery', 'delivered'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const order = await Order.findOne({
            _id: orderId,
            deliveryPartner: partnerId,
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Map status
        const statusMap = {
            'picked_up': 'out_for_delivery',
            'out_for_delivery': 'out_for_delivery',
            'delivered': 'delivered',
        };

        order.status = statusMap[status];

        // Update timeline
        const timelineMap = {
            'out_for_delivery': 3,
            'delivered': 4,
        };

        const timelineIndex = timelineMap[order.status];
        if (timelineIndex !== undefined) {
            for (let i = 0; i <= timelineIndex; i++) {
                if (order.timeline[i]) {
                    order.timeline[i].completed = true;
                    if (!order.timeline[i].date) {
                        order.timeline[i].date = new Date();
                    }
                }
            }
        }

        if (status === 'delivered') {
            order.deliveredAt = new Date();

            // Update partner earnings
            const partner = await DeliveryPartner.findById(partnerId);
            if (partner) {
                const earning = (order.deliveryFee || 40) + (order.deliveryTip || 0);
                partner.earnings.today = (partner.earnings.today || 0) + earning;
                partner.earnings.total = (partner.earnings.total || 0) + earning;
                await partner.save();
            }
        }

        await order.save();

        res.json({
            success: true,
            message: `Order ${status === 'delivered' ? 'delivered' : 'updated'} successfully`,
            response: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
            },
        });
    } catch (error) {
        console.error('Update delivery status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get order history for delivery partner
// @route   GET /api/delivery-partner/orders/history
// @access  Private
const getOrderHistory = async (req, res) => {
    try {
        const partnerId = req.user._id;

        const orders = await Order.find({
            deliveryPartner: partnerId,
            status: 'delivered',
        })
            .populate('user', 'name phone')
            .sort({ deliveredAt: -1 })
            .limit(50);

        const formattedOrders = orders.map(order => ({
            id: order._id,
            orderId: order.orderNumber,
            status: 'delivered',
            pickupAddress: 'Store Location, Main Market',
            deliveryAddress: `${order.shippingAddress.address}, ${order.shippingAddress.city}`,
            customerName: order.shippingAddress.name,
            amount: order.deliveryFee || 40,
            tip: order.deliveryTip || 0,
            deliveredAt: order.deliveredAt,
        }));

        res.json({
            success: true,
            response: {
                count: formattedOrders.length,
                data: formattedOrders,
            },
        });
    } catch (error) {
        console.error('Get order history error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    login,
    verifyOtp,
    resendOtp,
    completeProfile,
    getMe,
    updateProfile,
    toggleOnline,
    logout,
    getAvailableOrders,
    getActiveOrders,
    acceptOrder,
    updateDeliveryStatus,
    getOrderHistory,
};
