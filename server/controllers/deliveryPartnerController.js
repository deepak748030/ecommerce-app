const DeliveryPartner = require('../models/DeliveryPartner');
const Otp = require('../models/Otp');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const { generateToken } = require('../middleware/auth');
const { sendPushNotificationByToken } = require('../services/notificationService');

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

// @desc    Get available orders for delivery partner (only shipped status without assigned partner)
// @route   GET /api/delivery-partner/orders/available
// @access  Private
const getAvailableOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count
        const totalCount = await Order.countDocuments({
            status: 'shipped',
            deliveryPartner: null,
        });

        // Get orders that are shipped but not yet assigned to a delivery partner
        const orders = await Order.find({
            status: 'shipped',
            deliveryPartner: null,
        })
            .populate('user', 'name phone')
            .populate('items.product', 'title image location fullLocation')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const formattedOrders = orders.map(order => ({
            id: order._id,
            orderId: order.orderNumber,
            status: 'pending',
            pickupAddress: order.items[0]?.product?.fullLocation || order.items[0]?.product?.location || 'Store Location, Main Market',
            deliveryAddress: `${order.shippingAddress.address}, ${order.shippingAddress.city}`,
            customerName: order.shippingAddress.name,
            // Don't show phone number for unaccepted orders
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
                total: totalCount,
                page,
                totalPages: Math.ceil(totalCount / limit),
                hasMore: page < Math.ceil(totalCount / limit),
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count
        const totalCount = await Order.countDocuments({
            deliveryPartner: partnerId,
            status: { $in: ['shipped', 'out_for_delivery'] },
        });

        const orders = await Order.find({
            deliveryPartner: partnerId,
            status: { $in: ['shipped', 'out_for_delivery'] },
        })
            .populate('user', 'name phone')
            .populate('items.product', 'title image location fullLocation')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const formattedOrders = orders.map(order => ({
            id: order._id,
            orderId: order.orderNumber,
            status: order.status === 'shipped' ? 'accepted' : 'picked_up',
            pickupAddress: order.items[0]?.product?.fullLocation || order.items[0]?.product?.location || 'Store Location, Main Market',
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
                total: totalCount,
                page,
                totalPages: Math.ceil(totalCount / limit),
                hasMore: page < Math.ceil(totalCount / limit),
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

        // Only allow accepting shipped orders that don't have a delivery partner
        if (order.status !== 'shipped') {
            return res.status(400).json({ success: false, message: 'Order cannot be accepted' });
        }

        order.deliveryPartner = partnerId;

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

// @desc    Get single order details for delivery partner
// @route   GET /api/delivery-partner/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const orderId = req.params.id;

        const order = await Order.findById(orderId)
            .populate('user', 'name phone')
            .populate('items.product', 'title image location fullLocation');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if this partner has accepted this order
        const isAcceptedByMe = order.deliveryPartner && order.deliveryPartner.toString() === partnerId.toString();

        // Format items with product details
        const formattedItems = order.items.map(item => ({
            id: item._id,
            name: item.name || item.product?.title || 'Unknown Product',
            price: item.price,
            quantity: item.quantity,
            image: item.image || item.product?.image || '',
        }));

        // Get vendor info from first product
        const vendorAddress = order.items[0]?.product?.fullLocation || order.items[0]?.product?.location || 'Store Location, Main Market';

        const formattedOrder = {
            id: order._id,
            orderId: order.orderNumber,
            status: order.deliveryPartner ? (order.status === 'shipped' ? 'accepted' : order.status === 'out_for_delivery' ? 'picked_up' : order.status) : 'pending',
            pickupAddress: vendorAddress,
            deliveryAddress: `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
            customerName: order.shippingAddress.name,
            // Only show phone numbers if order is accepted by this delivery partner
            customerPhone: isAcceptedByMe ? order.shippingAddress.phone : null,
            vendorPhone: isAcceptedByMe ? '9876543210' : null, // Vendor phone (can be dynamic if you have vendor model)
            amount: order.deliveryFee || 40,
            tip: order.deliveryTip || 0,
            distance: '2.5 km',
            estimatedTime: order.estimatedDeliveryTime || '30-45 min',
            items: formattedItems,
            itemCount: order.items.length,
            paymentMethod: order.paymentMethod,
            subtotal: order.subtotal,
            total: order.total,
            createdAt: order.createdAt,
            deliveredAt: order.deliveredAt,
            isAcceptedByMe,
        };

        res.json({
            success: true,
            response: formattedOrder,
        });
    } catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Initiate pickup - generates OTP and sends to vendor
// @route   POST /api/delivery-partner/orders/:id/initiate-pickup
// @access  Private
const initiatePickup = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const orderId = req.params.id;

        const order = await Order.findOne({
            _id: orderId,
            deliveryPartner: partnerId,
            status: 'shipped',
        }).populate('items.product', 'vendorId');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found or not accepted by you' });
        }

        // Generate OTP (for development, using fixed 123456)
        const pickupOtp = '123456';

        // Store OTP with order reference
        await Otp.findOneAndUpdate(
            { phone: `pickup_${orderId}` },
            {
                phone: `pickup_${orderId}`,
                otp: pickupOtp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            },
            { upsert: true, new: true }
        );

        // Create notification for vendor (store in DB)
        await Notification.create({
            user: order.user, // For now sending to order user, can be changed to vendor
            title: '📦 Pickup OTP',
            message: `Your pickup OTP for order #${order.orderNumber} is: ${pickupOtp}. Share this with the delivery partner.`,
            type: 'order',
            data: {
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                otp: pickupOtp,
            },
        });

        // Get vendor/user push token to send notification
        const User = require('../models/User');
        const user = await User.findById(order.user);

        if (user && user.expoPushToken) {
            await sendPushNotificationByToken(user.expoPushToken, {
                title: '📦 Pickup OTP',
                body: `OTP for order #${order.orderNumber}: ${pickupOtp}`,
                data: {
                    type: 'pickup_otp',
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber,
                },
            });
        }

        res.json({
            success: true,
            message: 'OTP sent to vendor successfully',
            response: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                otpSent: true,
            },
        });
    } catch (error) {
        console.error('Initiate pickup error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Verify pickup OTP and update status
// @route   POST /api/delivery-partner/orders/:id/verify-pickup
// @access  Private
const verifyPickupOtp = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const orderId = req.params.id;
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({ success: false, message: 'OTP is required' });
        }

        const order = await Order.findOne({
            _id: orderId,
            deliveryPartner: partnerId,
            status: 'shipped',
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check OTP
        const storedOtp = await Otp.findOne({ phone: `pickup_${orderId}` });

        // Accept 123456 for development or check stored OTP
        if (otp !== '123456' && (!storedOtp || storedOtp.otp !== otp || new Date() > storedOtp.expiresAt)) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Clear OTP
        await Otp.deleteOne({ phone: `pickup_${orderId}` });

        // Update order status to out_for_delivery
        order.status = 'out_for_delivery';

        // Update timeline
        const timelineIndex = 3; // Out for delivery index
        for (let i = 0; i <= timelineIndex; i++) {
            if (order.timeline[i]) {
                order.timeline[i].completed = true;
                if (!order.timeline[i].date) {
                    order.timeline[i].date = new Date();
                }
            }
        }

        await order.save();

        // Send notification to customer
        const User = require('../models/User');
        const user = await User.findById(order.user);

        if (user && user.expoPushToken) {
            await sendPushNotificationByToken(user.expoPushToken, {
                title: '🚚 Order Picked Up',
                body: `Your order #${order.orderNumber} has been picked up and is on its way!`,
                data: {
                    type: 'order_update',
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber,
                    status: 'out_for_delivery',
                },
            });
        }

        res.json({
            success: true,
            message: 'Order picked up successfully',
            response: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: 'out_for_delivery',
            },
        });
    } catch (error) {
        console.error('Verify pickup OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Initiate delivery - generates OTP and sends to customer
// @route   POST /api/delivery-partner/orders/:id/initiate-delivery
// @access  Private
const initiateDelivery = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const orderId = req.params.id;

        const order = await Order.findOne({
            _id: orderId,
            deliveryPartner: partnerId,
            status: 'out_for_delivery',
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found or not ready for delivery' });
        }

        // Generate OTP (for development, using fixed 123456)
        const deliveryOtp = '123456';

        // Store OTP with order reference
        await Otp.findOneAndUpdate(
            { phone: `delivery_${orderId}` },
            {
                phone: `delivery_${orderId}`,
                otp: deliveryOtp,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            },
            { upsert: true, new: true }
        );

        // Create notification for customer (store in DB)
        await Notification.create({
            user: order.user,
            title: '📦 Delivery OTP',
            message: `Your delivery OTP for order #${order.orderNumber} is: ${deliveryOtp}. Share this with the delivery partner to confirm delivery.`,
            type: 'order',
            data: {
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                otp: deliveryOtp,
            },
        });

        // Get customer push token to send notification
        const User = require('../models/User');
        const user = await User.findById(order.user);

        if (user && user.expoPushToken) {
            await sendPushNotificationByToken(user.expoPushToken, {
                title: '📦 Delivery OTP',
                body: `OTP for order #${order.orderNumber}: ${deliveryOtp}`,
                data: {
                    type: 'delivery_otp',
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber,
                },
            });
        }

        res.json({
            success: true,
            message: 'OTP sent to customer successfully',
            response: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                otpSent: true,
            },
        });
    } catch (error) {
        console.error('Initiate delivery error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Verify delivery OTP and mark as delivered
// @route   POST /api/delivery-partner/orders/:id/verify-delivery
// @access  Private
const verifyDeliveryOtp = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const orderId = req.params.id;
        const { otp } = req.body;

        if (!otp) {
            return res.status(400).json({ success: false, message: 'OTP is required' });
        }

        const order = await Order.findOne({
            _id: orderId,
            deliveryPartner: partnerId,
            status: 'out_for_delivery',
        });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found or not ready for delivery' });
        }

        // Check OTP
        const storedOtp = await Otp.findOne({ phone: `delivery_${orderId}` });

        // Accept 123456 for development or check stored OTP
        if (otp !== '123456' && (!storedOtp || storedOtp.otp !== otp || new Date() > storedOtp.expiresAt)) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Clear OTP
        await Otp.deleteOne({ phone: `delivery_${orderId}` });

        // Update order status to delivered
        order.status = 'delivered';
        order.deliveredAt = new Date();

        // Update timeline
        const timelineIndex = 4; // Delivered index
        for (let i = 0; i <= timelineIndex; i++) {
            if (order.timeline[i]) {
                order.timeline[i].completed = true;
                if (!order.timeline[i].date) {
                    order.timeline[i].date = new Date();
                }
            }
        }

        await order.save();

        // Update partner earnings
        const partner = await DeliveryPartner.findById(partnerId);
        if (partner) {
            const earning = (order.deliveryFee || 40) + (order.deliveryTip || 0);
            partner.earnings.today = (partner.earnings.today || 0) + earning;
            partner.earnings.total = (partner.earnings.total || 0) + earning;
            await partner.save();
        }

        // Send notification to customer
        const User = require('../models/User');
        const user = await User.findById(order.user);

        if (user && user.expoPushToken) {
            await sendPushNotificationByToken(user.expoPushToken, {
                title: '🎉 Order Delivered',
                body: `Your order #${order.orderNumber} has been delivered successfully!`,
                data: {
                    type: 'order_update',
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber,
                    status: 'delivered',
                },
            });
        }

        res.json({
            success: true,
            message: 'Order delivered successfully',
            response: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                status: 'delivered',
            },
        });
    } catch (error) {
        console.error('Verify delivery OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get order history for delivery partner
// @route   GET /api/delivery-partner/orders/history
// @access  Private
const getOrderHistory = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count
        const totalCount = await Order.countDocuments({
            deliveryPartner: partnerId,
            status: 'delivered',
        });

        const orders = await Order.find({
            deliveryPartner: partnerId,
            status: 'delivered',
        })
            .populate('user', 'name phone')
            .populate('items.product', 'title image location fullLocation')
            .sort({ deliveredAt: -1 })
            .skip(skip)
            .limit(limit);

        const formattedOrders = orders.map(order => ({
            id: order._id,
            orderId: order.orderNumber,
            status: 'delivered',
            pickupAddress: order.items[0]?.product?.fullLocation || order.items[0]?.product?.location || 'Store Location, Main Market',
            deliveryAddress: `${order.shippingAddress.address}, ${order.shippingAddress.city}`,
            customerName: order.shippingAddress.name,
            amount: order.deliveryFee || 40,
            tip: order.deliveryTip || 0,
            distance: '2.5 km',
            estimatedTime: order.estimatedDeliveryTime || '30-45 min',
            items: order.items.length,
            createdAt: order.createdAt,
            deliveredAt: order.deliveredAt,
        }));

        res.json({
            success: true,
            response: {
                count: formattedOrders.length,
                total: totalCount,
                page,
                totalPages: Math.ceil(totalCount / limit),
                hasMore: page < Math.ceil(totalCount / limit),
                data: formattedOrders,
            },
        });
    } catch (error) {
        console.error('Get order history error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get earnings summary for delivery partner
// @route   GET /api/delivery-partner/earnings
// @access  Private
const getEarnings = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const partner = await DeliveryPartner.findById(partnerId);

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        // Get today's start and end
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Get this week's start (Monday)
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        weekStart.setHours(0, 0, 0, 0);

        // Get this month's start
        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        // Aggregate earnings from delivered orders
        const [todayEarnings, weekEarnings, monthEarnings, totalEarnings, todayDeliveries, totalDeliveries, totalTips] = await Promise.all([
            Order.aggregate([
                { $match: { deliveryPartner: partnerId, status: 'delivered', deliveredAt: { $gte: todayStart, $lte: todayEnd } } },
                { $group: { _id: null, total: { $sum: { $add: [{ $ifNull: ['$deliveryFee', 40] }, { $ifNull: ['$deliveryTip', 0] }] } } } }
            ]),
            Order.aggregate([
                { $match: { deliveryPartner: partnerId, status: 'delivered', deliveredAt: { $gte: weekStart } } },
                { $group: { _id: null, total: { $sum: { $add: [{ $ifNull: ['$deliveryFee', 40] }, { $ifNull: ['$deliveryTip', 0] }] } } } }
            ]),
            Order.aggregate([
                { $match: { deliveryPartner: partnerId, status: 'delivered', deliveredAt: { $gte: monthStart } } },
                { $group: { _id: null, total: { $sum: { $add: [{ $ifNull: ['$deliveryFee', 40] }, { $ifNull: ['$deliveryTip', 0] }] } } } }
            ]),
            Order.aggregate([
                { $match: { deliveryPartner: partnerId, status: 'delivered' } },
                { $group: { _id: null, total: { $sum: { $add: [{ $ifNull: ['$deliveryFee', 40] }, { $ifNull: ['$deliveryTip', 0] }] } } } }
            ]),
            Order.countDocuments({ deliveryPartner: partnerId, status: 'delivered', deliveredAt: { $gte: todayStart, $lte: todayEnd } }),
            Order.countDocuments({ deliveryPartner: partnerId, status: 'delivered' }),
            Order.aggregate([
                { $match: { deliveryPartner: partnerId, status: 'delivered' } },
                { $group: { _id: null, total: { $sum: { $ifNull: ['$deliveryTip', 0] } } } }
            ]),
        ]);

        res.json({
            success: true,
            response: {
                today: todayEarnings[0]?.total || 0,
                thisWeek: weekEarnings[0]?.total || 0,
                thisMonth: monthEarnings[0]?.total || 0,
                total: totalEarnings[0]?.total || 0,
                todayDeliveries,
                totalDeliveries,
                totalTips: totalTips[0]?.total || 0,
                avgRating: partner.stats?.rating || 5.0,
            },
        });
    } catch (error) {
        console.error('Get earnings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get earnings history (daily breakdown)
// @route   GET /api/delivery-partner/earnings/history
// @access  Private
const getEarningsHistory = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Get daily earnings for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const dailyEarnings = await Order.aggregate([
            {
                $match: {
                    deliveryPartner: partnerId,
                    status: 'delivered',
                    deliveredAt: { $gte: thirtyDaysAgo },
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$deliveredAt' } },
                    amount: { $sum: { $ifNull: ['$deliveryFee', 40] } },
                    tips: { $sum: { $ifNull: ['$deliveryTip', 0] } },
                    deliveries: { $sum: 1 },
                }
            },
            { $sort: { _id: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
        ]);

        // Get total count of unique days
        const totalDays = await Order.aggregate([
            {
                $match: {
                    deliveryPartner: partnerId,
                    status: 'delivered',
                    deliveredAt: { $gte: thirtyDaysAgo },
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$deliveredAt' } },
                }
            },
            { $count: 'total' },
        ]);

        const formattedHistory = dailyEarnings.map(day => ({
            date: new Date(day._id).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
            rawDate: day._id,
            amount: day.amount,
            tips: day.tips,
            deliveries: day.deliveries,
        }));

        const total = totalDays[0]?.total || 0;

        res.json({
            success: true,
            response: {
                count: formattedHistory.length,
                total,
                page,
                totalPages: Math.ceil(total / limit),
                hasMore: page < Math.ceil(total / limit),
                data: formattedHistory,
            },
        });
    } catch (error) {
        console.error('Get earnings history error:', error);
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
    initiatePickup,
    verifyPickupOtp,
    initiateDelivery,
    verifyDeliveryOtp,
    getOrderHistory,
    getOrderById,
    getEarnings,
    getEarningsHistory,
};
