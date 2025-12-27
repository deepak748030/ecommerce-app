const DeliveryPartner = require('../models/DeliveryPartner');
const Otp = require('../models/Otp');
const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const { generateToken } = require('../middleware/auth');
const {
    sendPushNotificationByToken,
    sendDeliveryStatusNotification,
    sendOrderStatusNotification
} = require('../services/notificationService');
const { creditDeliveryPartnerWallet } = require('./walletController');
const otpConfig = require('../config/otpConfig');
const otpConfig = require('../config/otpConfig');
const {
    uploadProfileImage,
    uploadDocumentImage,
    isBase64Image,
    isCloudinaryConfigured
} = require('../services/cloudinaryService');

const getDeliveryAmount = (order) => {
    const payment = typeof order.deliveryPayment === 'number' ? order.deliveryPayment : 0;
    if (payment > 0) return payment;
    const fee = typeof order.deliveryFee === 'number' ? order.deliveryFee : null;
    return fee ?? 40;
};

const getEstimatedTimeText = (order) => {
    const minutes = typeof order.deliveryTimeMinutes === 'number' ? order.deliveryTimeMinutes : 0;
    if (minutes > 0) return `${minutes} min`;
    return order.estimatedDeliveryTime || '30-45 min';
};

// @desc    Send OTP to phone (Login/Signup)
// @route   POST /api/delivery-partner/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const otp = otpConfig.generateOtp();
        const expiresAt = otpConfig.getExpiryDate();

        await Otp.findOneAndUpdate(
            { phone },
            { phone, otp, expiresAt },
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

        if (!otpConfig.verifyOtp(otp, storedOtp?.otp, storedOtp?.expiresAt)) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        await Otp.deleteOne({ phone });

        let partner = await DeliveryPartner.findOne({ phone });
        const isNewUser = !partner;

        if (!partner) {
            partner = await DeliveryPartner.create({
                phone,
                expoPushToken: expoPushToken || '',
            });
        } else if (expoPushToken) {
            // Update push token at login
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

        const otp = otpConfig.generateOtp();
        const expiresAt = otpConfig.getExpiryDate();

        await Otp.findOneAndUpdate(
            { phone },
            { phone, otp, expiresAt },
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

// @desc    Complete profile with vehicle details and KYC documents
// @route   POST /api/delivery-partner/auth/complete-profile
// @access  Private
const completeProfile = async (req, res) => {
    try {
        const {
            partnerId,
            name,
            vehicleType,
            vehicleNumber,
            vehicleModel,
            vehicleColor,
            aadhaarImage,
            panImage,
            licenseImage,
            selfieImage
        } = req.body;

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

        // Upload KYC documents to Cloudinary
        const uploadDocument = async (image, docType) => {
            if (image && isBase64Image(image) && isCloudinaryConfigured()) {
                const result = await uploadDocumentImage(image, partnerId, docType);
                if (result.success) {
                    return result.url;
                }
                console.error(`Failed to upload ${docType}:`, result.error);
            }
            return image; // Return original if upload fails or not configured
        };

        if (aadhaarImage) {
            partner.documents.aadhaar = await uploadDocument(aadhaarImage, 'aadhaar');
        }
        if (panImage) {
            partner.documents.pan = await uploadDocument(panImage, 'pan');
        }
        if (licenseImage) {
            partner.documents.license = await uploadDocument(licenseImage, 'license');
        }
        if (selfieImage) {
            partner.documents.selfie = await uploadDocument(selfieImage, 'selfie');
        }

        // Check if all documents are provided
        const hasAllDocuments = partner.documents.aadhaar &&
            partner.documents.pan &&
            partner.documents.license &&
            partner.documents.selfie;

        if (hasAllDocuments) {
            partner.kycStatus = 'submitted';
        }

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
                    documents: {
                        aadhaar: !!partner.documents.aadhaar,
                        pan: !!partner.documents.pan,
                        license: !!partner.documents.license,
                        selfie: !!partner.documents.selfie,
                    },
                    kycStatus: partner.kycStatus,
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
                documents: {
                    aadhaar: !!partner.documents.aadhaar,
                    pan: !!partner.documents.pan,
                    license: !!partner.documents.license,
                    selfie: !!partner.documents.selfie,
                },
                kycStatus: partner.kycStatus,
                kycRejectionReason: partner.kycRejectionReason,
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

        // Upload avatar to Cloudinary
        if (avatar !== undefined) {
            if (isBase64Image(avatar) && isCloudinaryConfigured()) {
                const uploadResult = await uploadProfileImage(avatar, partnerId.toString(), 'delivery-partner');
                if (uploadResult.success) {
                    partner.avatar = uploadResult.url;
                } else {
                    console.error('Failed to upload avatar:', uploadResult.error);
                    // Fall back to storing small images
                    const base64Length = avatar.length * 0.75;
                    if (base64Length <= 500 * 1024) {
                        partner.avatar = avatar;
                    }
                }
            } else {
                partner.avatar = avatar;
            }
        }

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
                documents: {
                    aadhaar: !!partner.documents.aadhaar,
                    pan: !!partner.documents.pan,
                    license: !!partner.documents.license,
                    selfie: !!partner.documents.selfie,
                },
                kycStatus: partner.kycStatus,
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
        const { isOnline: requestedStatus } = req.body;

        const partner = await DeliveryPartner.findById(partnerId);

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        if (typeof requestedStatus === 'boolean') {
            partner.isOnline = requestedStatus;
        } else {
            partner.isOnline = !partner.isOnline;
        }

        await partner.save();

        console.log(`Partner ${partnerId} online status changed to: ${partner.isOnline}`);

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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const totalCount = await Order.countDocuments({
            status: 'shipped',
            deliveryPartner: null,
        });

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
            amount: getDeliveryAmount(order),
            tip: order.deliveryTip || 0,
            distance: '2.5 km',
            estimatedTime: getEstimatedTimeText(order),
            items: order.items.length,
            createdAt: order.createdAt,
            deliveryPayment: order.deliveryPayment,
            deliveryTimeMinutes: order.deliveryTimeMinutes,
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
            amount: getDeliveryAmount(order),
            tip: order.deliveryTip || 0,
            distance: '2.5 km',
            estimatedTime: getEstimatedTimeText(order),
            items: order.items.length,
            createdAt: order.createdAt,
            deliveryPayment: order.deliveryPayment,
            deliveryTimeMinutes: order.deliveryTimeMinutes,
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

        const partner = await DeliveryPartner.findById(partnerId);
        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        if (partner.kycStatus !== 'approved') {
            let message = 'Your KYC is not approved yet. Please complete your verification to accept orders.';
            if (partner.kycStatus === 'pending') {
                message = 'Please complete your KYC verification to start accepting orders.';
            } else if (partner.kycStatus === 'submitted') {
                message = 'Your KYC is under review. Please wait for admin approval.';
            } else if (partner.kycStatus === 'rejected') {
                message = `Your KYC was rejected: ${partner.kycRejectionReason || 'Please contact support.'}`;
            }
            return res.status(403).json({ success: false, message });
        }

        const order = await Order.findById(orderId).populate('user');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.deliveryPartner) {
            return res.status(400).json({ success: false, message: 'Order already accepted by another partner' });
        }

        if (order.status !== 'shipped') {
            return res.status(400).json({ success: false, message: 'Order cannot be accepted' });
        }

        order.deliveryPartner = partnerId;

        // Update timeline
        const timelineIndex = 2;
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
        partner.stats.totalDeliveries = (partner.stats.totalDeliveries || 0) + 1;
        await partner.save();

        // Send push notification to user about delivery partner assignment
        if (order.user) {
            await sendDeliveryStatusNotification(order.user, order, 'accepted', partner);

            // Create in-app notification
            await Notification.create({
                user: order.user._id,
                title: '🚴 Delivery Partner Assigned',
                message: `${partner.name || 'A delivery partner'} will deliver your order #${order.orderNumber}.`,
                type: 'order',
                data: {
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber,
                    status: 'accepted',
                    partnerName: partner.name,
                },
            });
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

        const isAcceptedByMe = order.deliveryPartner && order.deliveryPartner.toString() === partnerId.toString();

        const formattedItems = order.items.map(item => ({
            id: item._id,
            name: item.name || item.product?.title || 'Unknown Product',
            price: item.price,
            quantity: item.quantity,
            image: item.image || item.product?.image || '',
        }));

        const vendorAddress = order.items[0]?.product?.fullLocation || order.items[0]?.product?.location || 'Store Location, Main Market';

        const formattedOrder = {
            id: order._id,
            orderId: order.orderNumber,
            status: order.deliveryPartner ? (order.status === 'shipped' ? 'accepted' : order.status === 'out_for_delivery' ? 'picked_up' : order.status) : 'pending',
            pickupAddress: vendorAddress,
            deliveryAddress: `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
            customerName: order.shippingAddress.name,
            customerPhone: isAcceptedByMe ? order.shippingAddress.phone : null,
            vendorPhone: isAcceptedByMe ? '9876543210' : null,
            amount: getDeliveryAmount(order),
            tip: order.deliveryTip || 0,
            distance: '2.5 km',
            estimatedTime: getEstimatedTimeText(order),
            items: formattedItems,
            itemCount: order.items.length,
            paymentMethod: order.paymentMethod,
            subtotal: order.subtotal,
            total: order.total,
            createdAt: order.createdAt,
            deliveredAt: order.deliveredAt,
            isAcceptedByMe,
            deliveryPayment: order.deliveryPayment,
            deliveryTimeMinutes: order.deliveryTimeMinutes,
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

        // Generate OTP using config
        const pickupOtp = otpConfig.generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await Otp.findOneAndUpdate(
            { phone: `pickup_${orderId}` },
            { phone: `pickup_${orderId}`, otp: pickupOtp, expiresAt },
            { upsert: true, new: true }
        );

        // Create notification for vendor
        await Notification.create({
            user: order.user,
            title: '📦 Pickup OTP',
            message: `Your pickup OTP for order #${order.orderNumber} is: ${pickupOtp}. Share this with the delivery partner.`,
            type: 'order',
            data: {
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                otp: pickupOtp,
            },
        });

        // Send push notification
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
        }).populate('user');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const storedOtp = await Otp.findOne({ phone: `pickup_${orderId}` });

        if (!otpConfig.verifyOtp(otp, storedOtp?.otp, storedOtp?.expiresAt)) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        await Otp.deleteOne({ phone: `pickup_${orderId}` });

        order.status = 'out_for_delivery';

        // Update timeline
        const timelineIndex = 3;
        for (let i = 0; i <= timelineIndex; i++) {
            if (order.timeline[i]) {
                order.timeline[i].completed = true;
                if (!order.timeline[i].date) {
                    order.timeline[i].date = new Date();
                }
            }
        }

        await order.save();

        // Get partner for notification
        const partner = await DeliveryPartner.findById(partnerId);

        // Send push notification to customer
        if (order.user) {
            await sendDeliveryStatusNotification(order.user, order, 'picked_up', partner);

            // Create in-app notification
            await Notification.create({
                user: order.user._id,
                title: '📦 Order Picked Up',
                message: `Your order #${order.orderNumber} has been picked up and is on its way!`,
                type: 'order',
                data: {
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

        // Generate OTP using config
        const deliveryOtp = otpConfig.generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await Otp.findOneAndUpdate(
            { phone: `delivery_${orderId}` },
            { phone: `delivery_${orderId}`, otp: deliveryOtp, expiresAt },
            { upsert: true, new: true }
        );

        // Create notification for customer
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

        // Send push notification
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
        }).populate('user');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found or not ready for delivery' });
        }

        const storedOtp = await Otp.findOne({ phone: `delivery_${orderId}` });

        if (!otpConfig.verifyOtp(otp, storedOtp?.otp, storedOtp?.expiresAt)) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        await Otp.deleteOne({ phone: `delivery_${orderId}` });

        order.status = 'delivered';
        order.deliveredAt = new Date();

        // Update timeline
        const timelineIndex = 4;
        for (let i = 0; i <= timelineIndex; i++) {
            if (order.timeline[i]) {
                order.timeline[i].completed = true;
                if (!order.timeline[i].date) {
                    order.timeline[i].date = new Date();
                }
            }
        }

        await order.save();

        // Update partner earnings and wallet
        const partner = await DeliveryPartner.findById(partnerId);
        if (partner) {
            const earning = getDeliveryAmount(order) + (order.deliveryTip || 0);

            // Update earnings tracking
            partner.earnings.today = (partner.earnings.today || 0) + earning;
            partner.earnings.total = (partner.earnings.total || 0) + earning;

            // Credit wallet
            if (!partner.wallet) {
                partner.wallet = {
                    balance: 0,
                    pendingBalance: 0,
                    totalEarnings: 0,
                    totalWithdrawn: 0,
                };
            }
            partner.wallet.balance += earning;
            partner.wallet.totalEarnings += earning;

            await partner.save();
            console.log(`Delivery partner ${partnerId} earned ₹${earning} for order ${order.orderNumber}`);
        }

        // Send push notification to customer
        if (order.user) {
            await sendDeliveryStatusNotification(order.user, order, 'delivered', partner);

            // Create in-app notification
            await Notification.create({
                user: order.user._id,
                title: '🎉 Order Delivered',
                message: `Your order #${order.orderNumber} has been delivered successfully!`,
                type: 'order',
                data: {
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
            amount: getDeliveryAmount(order),
            tip: order.deliveryTip || 0,
            distance: '2.5 km',
            estimatedTime: getEstimatedTimeText(order),
            items: order.items.length,
            createdAt: order.createdAt,
            deliveredAt: order.deliveredAt,
            deliveryPayment: order.deliveryPayment,
            deliveryTimeMinutes: order.deliveryTimeMinutes,
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

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        weekStart.setHours(0, 0, 0, 0);

        const monthStart = new Date();
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const deliveryAmountExpr = {
            $cond: [
                { $gt: [{ $ifNull: ['$deliveryPayment', 0] }, 0] },
                { $ifNull: ['$deliveryPayment', 0] },
                { $ifNull: ['$deliveryFee', 40] },
            ],
        };

        const [todayEarnings, weekEarnings, monthEarnings, totalEarnings, todayDeliveries, totalDeliveries, totalTips] = await Promise.all([
            Order.aggregate([
                { $match: { deliveryPartner: partnerId, status: 'delivered', deliveredAt: { $gte: todayStart, $lte: todayEnd } } },
                { $group: { _id: null, total: { $sum: { $add: [deliveryAmountExpr, { $ifNull: ['$deliveryTip', 0] }] } } } }
            ]),
            Order.aggregate([
                { $match: { deliveryPartner: partnerId, status: 'delivered', deliveredAt: { $gte: weekStart } } },
                { $group: { _id: null, total: { $sum: { $add: [deliveryAmountExpr, { $ifNull: ['$deliveryTip', 0] }] } } } }
            ]),
            Order.aggregate([
                { $match: { deliveryPartner: partnerId, status: 'delivered', deliveredAt: { $gte: monthStart } } },
                { $group: { _id: null, total: { $sum: { $add: [deliveryAmountExpr, { $ifNull: ['$deliveryTip', 0] }] } } } }
            ]),
            Order.aggregate([
                { $match: { deliveryPartner: partnerId, status: 'delivered' } },
                { $group: { _id: null, total: { $sum: { $add: [deliveryAmountExpr, { $ifNull: ['$deliveryTip', 0] }] } } } }
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
                    amount: {
                        $sum: {
                            $cond: [
                                { $gt: [{ $ifNull: ['$deliveryPayment', 0] }, 0] },
                                { $ifNull: ['$deliveryPayment', 0] },
                                { $ifNull: ['$deliveryFee', 40] },
                            ],
                        },
                    },
                    tips: { $sum: { $ifNull: ['$deliveryTip', 0] } },
                    deliveries: { $sum: 1 },
                }
            },
            { $sort: { _id: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit },
        ]);

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

// @desc    Get wallet balance for delivery partner
// @route   GET /api/delivery-partner/wallet/balance
// @access  Private
const getWalletBalance = async (req, res) => {
    try {
        const partner = await DeliveryPartner.findById(req.user._id);

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        // Initialize wallet if not exists
        if (!partner.wallet) {
            partner.wallet = {
                balance: 0,
                pendingBalance: 0,
                totalEarnings: 0,
                totalWithdrawn: 0,
            };
            await partner.save();
        }

        res.json({
            success: true,
            response: {
                balance: partner.wallet.balance,
                pendingBalance: partner.wallet.pendingBalance,
                totalEarnings: partner.wallet.totalEarnings,
                totalWithdrawn: partner.wallet.totalWithdrawn,
                currency: 'INR',
                currencySymbol: '₹',
            },
        });
    } catch (error) {
        console.error('Get wallet balance error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Request withdrawal (Delivery Partner)
// @route   POST /api/delivery-partner/wallet/withdraw
// @access  Private
const requestWithdrawal = async (req, res) => {
    try {
        const { amount, paymentMethod, upiId, accountHolderName, accountNumber, ifscCode, bankName, mobileNumber } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid withdrawal amount' });
        }

        if (!paymentMethod) {
            return res.status(400).json({ success: false, message: 'Payment method is required' });
        }

        const partner = await DeliveryPartner.findById(req.user._id);

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        if (!partner.wallet || partner.wallet.balance < amount) {
            return res.status(400).json({ success: false, message: 'Insufficient balance' });
        }

        if (amount < 100) {
            return res.status(400).json({ success: false, message: 'Minimum withdrawal amount is ₹100' });
        }

        // Validate payment details based on method
        if (paymentMethod === 'upi' && !upiId) {
            return res.status(400).json({ success: false, message: 'UPI ID is required' });
        }
        if (paymentMethod === 'bank_transfer' && (!accountNumber || !ifscCode || !accountHolderName)) {
            return res.status(400).json({ success: false, message: 'Bank details are required' });
        }
        if (['paytm', 'phonepe', 'googlepay'].includes(paymentMethod) && !mobileNumber) {
            return res.status(400).json({ success: false, message: 'Mobile number is required' });
        }

        // Create withdrawal request
        const withdrawalRequest = await WithdrawalRequest.create({
            requesterType: 'delivery_partner',
            deliveryPartner: req.user._id,
            amount,
            paymentMethod,
            paymentDetails: {
                upiId: upiId || '',
                accountHolderName: accountHolderName || '',
                accountNumber: accountNumber || '',
                ifscCode: ifscCode || '',
                bankName: bankName || '',
                mobileNumber: mobileNumber || '',
            },
            balanceBefore: partner.wallet.balance,
        });

        // Deduct from balance
        await DeliveryPartner.findByIdAndUpdate(req.user._id, {
            $inc: { 'wallet.balance': -amount },
        });

        const updatedPartner = await DeliveryPartner.findById(req.user._id);

        res.json({
            success: true,
            message: 'Withdrawal request submitted successfully',
            response: {
                request: withdrawalRequest,
                wallet: {
                    balance: updatedPartner.wallet.balance,
                    pendingBalance: updatedPartner.wallet.pendingBalance,
                    totalEarnings: updatedPartner.wallet.totalEarnings,
                    totalWithdrawn: updatedPartner.wallet.totalWithdrawn,
                },
            },
        });
    } catch (error) {
        console.error('Request withdrawal error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get withdrawal history (Delivery Partner)
// @route   GET /api/delivery-partner/wallet/withdrawals
// @access  Private
const getWithdrawalHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const query = { deliveryPartner: req.user._id, requesterType: 'delivery_partner' };
        if (status) {
            query.status = status;
        }

        const withdrawals = await WithdrawalRequest.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await WithdrawalRequest.countDocuments(query);

        res.json({
            success: true,
            response: {
                count: withdrawals.length,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                data: withdrawals,
            },
        });
    } catch (error) {
        console.error('Get withdrawal history error:', error);
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
    getWalletBalance,
    requestWithdrawal,
    getWithdrawalHistory,
};

