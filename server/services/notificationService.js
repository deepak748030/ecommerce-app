// Expo Push Notification Service
const { Expo } = require('expo-server-sdk');
const User = require('../models/User');
const DeliveryPartner = require('../models/DeliveryPartner');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Check if user has enabled specific notification type
 * @param {object} user - User object with notificationSettings
 * @param {string} notificationType - Type: 'order', 'promotion', 'system'
 * @returns {boolean}
 */
const isNotificationEnabled = (user, notificationType) => {
    // If no user, cannot send notification
    if (!user) {
        console.log('No user provided for notification check');
        return false;
    }

    const settings = user.notificationSettings || {};

    // Log current settings for debugging
    console.log(`Checking notification settings for user ${user._id}:`, {
        pushEnabled: settings.pushEnabled,
        orderUpdates: settings.orderUpdates,
        promotions: settings.promotions,
        notificationType
    });

    // Check if push notifications are enabled globally (default to true if not set)
    const isPushEnabled = settings.pushEnabled !== false;
    if (!isPushEnabled) {
        console.log(`Push notifications disabled for user ${user._id}`);
        return false;
    }

    // Check specific notification type
    switch (notificationType) {
        case 'order':
        case 'order_update':
            // Default to true - users should receive order updates unless explicitly disabled
            const orderEnabled = settings.orderUpdates !== false;
            console.log(`Order notifications ${orderEnabled ? 'enabled' : 'disabled'} for user ${user._id}`);
            return orderEnabled;
        case 'promotion':
        case 'promo':
        case 'deal':
            // Promotions default to false - opt-in only
            return settings.promotions === true;
        case 'vendor':
        case 'vendor_order':
            // Always send vendor notifications - critical for business
            return true;
        case 'delivery':
        case 'delivery_order':
            // Always send delivery partner notifications - critical for operations
            return true;
        case 'system':
        default:
            // System notifications follow global push setting
            return isPushEnabled;
    }
};

/**
 * Send push notification to a single recipient
 * @param {string} expoPushToken - Expo push token
 * @param {object} notification - Notification details
 * @returns {Promise<{success: boolean, tickets?: array, error?: string}>}
 */
const sendPushNotificationByToken = async (expoPushToken, notification) => {
    try {
        if (!expoPushToken || !Expo.isExpoPushToken(expoPushToken)) {
            console.log('Invalid Expo push token:', expoPushToken);
            return { success: false, error: 'Invalid push token' };
        }

        const message = {
            to: expoPushToken,
            sound: 'default',
            title: notification.title,
            body: notification.body,
            data: notification.data || {},
            priority: 'high',
            channelId: 'default',
        };

        const chunks = expo.chunkPushNotifications([message]);
        const tickets = [];

        for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }

        console.log('Push notification sent:', tickets);
        return { success: true, tickets };
    } catch (error) {
        console.error('Error sending push notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send push notification to a single user with preference check
 * @param {object} user - User object with expoPushToken and notificationSettings
 * @param {object} notification - Notification details
 * @param {string} notificationType - Type: 'order', 'promotion', 'system'
 */
const sendPushNotification = async (user, notification, notificationType = 'system') => {
    try {
        if (!user) {
            console.log('No user provided for push notification');
            return { success: false, error: 'No user provided', skipped: true };
        }

        if (!user.expoPushToken) {
            console.log(`No push token for user ${user._id || 'unknown'}`);
            return { success: false, error: 'No push token', skipped: true };
        }

        console.log(`Checking notification preferences for user ${user._id}, type: ${notificationType}`);
        if (!isNotificationEnabled(user, notificationType)) {
            console.log(`Notification type '${notificationType}' is disabled for user ${user._id}`);
            return { success: false, error: 'Notification disabled by user', skipped: true };
        }

        console.log(`Sending push notification to user ${user._id}, token: ${user.expoPushToken.substring(0, 30)}...`);
        return sendPushNotificationByToken(user.expoPushToken, notification);
    } catch (error) {
        console.error('Error sending push notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send push notifications to multiple users with preference check
 * @param {Array} users - Array of user objects with expoPushToken and notificationSettings
 * @param {object} notification - Notification details
 * @param {string} notificationType - Type: 'order', 'promotion', 'system'
 */
const sendBulkPushNotifications = async (users, notification, notificationType = 'system') => {
    try {
        const messages = [];
        let skippedCount = 0;

        for (const user of users) {
            if (!user.expoPushToken || !Expo.isExpoPushToken(user.expoPushToken)) {
                skippedCount++;
                continue;
            }

            if (!isNotificationEnabled(user, notificationType)) {
                console.log(`Skipping user ${user._id} - ${notificationType} notifications disabled`);
                skippedCount++;
                continue;
            }

            messages.push({
                to: user.expoPushToken,
                sound: 'default',
                title: notification.title,
                body: notification.body,
                data: notification.data || {},
                priority: 'high',
                channelId: 'default',
            });
        }

        if (messages.length === 0) {
            return { success: false, error: 'No valid tokens or all users disabled notifications', skippedCount };
        }

        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }

        console.log(`Bulk notifications sent to ${messages.length} users, skipped ${skippedCount}`);
        return { success: true, tickets, count: messages.length, skippedCount };
    } catch (error) {
        console.error('Error sending bulk notifications:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send order status notification to user
 * @param {object} user - User object with expoPushToken and notificationSettings
 * @param {object} order - Order details
 * @param {string} newStatus - New order status
 */
const sendOrderStatusNotification = async (user, order, newStatus) => {
    const statusMessages = {
        pending: {
            title: '📦 Order Received',
            body: `Your order #${order.orderNumber} has been received and is pending confirmation.`,
        },
        confirmed: {
            title: '✅ Order Confirmed',
            body: `Great news! Your order #${order.orderNumber} has been confirmed.`,
        },
        processing: {
            title: '🔄 Order Processing',
            body: `Your order #${order.orderNumber} is being processed.`,
        },
        shipped: {
            title: '🚚 Order Shipped',
            body: `Your order #${order.orderNumber} has been shipped and is on its way!`,
        },
        out_for_delivery: {
            title: '🏃 Out for Delivery',
            body: `Your order #${order.orderNumber} is out for delivery. Get ready!`,
        },
        delivered: {
            title: '🎉 Order Delivered',
            body: `Your order #${order.orderNumber} has been delivered successfully!`,
        },
        cancelled: {
            title: '❌ Order Cancelled',
            body: `Your order #${order.orderNumber} has been cancelled. Refund will be processed soon.`,
        },
    };

    const notification = statusMessages[newStatus] || {
        title: 'Order Update',
        body: `Your order #${order.orderNumber} status has been updated to ${newStatus}.`,
    };

    notification.data = {
        type: 'order_update',
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: newStatus,
    };

    return sendPushNotification(user, notification, 'order');
};

/**
 * Send new order notification to vendor
 * @param {object|string} vendorOrId - Vendor user object or ID
 * @param {object} order - Order details
 * @param {Array} products - Array of products ordered (optional)
 * @param {number} vendorSubtotal - Vendor's subtotal (optional)
 */
const sendVendorNewOrderNotification = async (vendorOrId, order, products = null, vendorSubtotal = null) => {
    try {
        let vendor = vendorOrId;

        // If vendorOrId is a string (ID), fetch the vendor
        if (typeof vendorOrId === 'string') {
            vendor = await User.findById(vendorOrId);
        }

        if (!vendor || !vendor.expoPushToken) {
            console.log('Vendor has no push token');
            return { success: false, error: 'No push token' };
        }

        const total = vendorSubtotal || order.total;
        const itemCount = products ? products.length : order.items?.length || 0;

        const notification = {
            title: '🛒 New Order Received!',
            body: `Order #${order.orderNumber} - ${itemCount} item(s) - ₹${total}. Tap to view details.`,
            data: {
                type: 'vendor_new_order',
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                total: total,
                itemCount: itemCount,
            },
        };

        console.log(`Sending new order notification to vendor ${vendor._id}`);
        return sendPushNotificationByToken(vendor.expoPushToken, notification);
    } catch (error) {
        console.error('Error sending vendor order notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send new delivery order notification to delivery partner
 * @param {string} partnerId - Delivery partner ID
 * @param {object} order - Order details
 */
const sendDeliveryPartnerNewOrderNotification = async (partnerId, order) => {
    try {
        const partner = await DeliveryPartner.findById(partnerId);
        if (!partner || !partner.expoPushToken) {
            console.log('Delivery partner has no push token:', partnerId);
            return { success: false, error: 'No push token' };
        }

        const notification = {
            title: '📦 New Delivery Available!',
            body: `Order #${order.orderNumber} ready for pickup. Earn ₹${order.deliveryPayment || order.deliveryFee || 40}`,
            data: {
                type: 'delivery_new_order',
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                deliveryPayment: order.deliveryPayment || order.deliveryFee || 40,
            },
        };

        console.log(`Sending new delivery notification to partner ${partnerId}`);
        return sendPushNotificationByToken(partner.expoPushToken, notification);
    } catch (error) {
        console.error('Error sending delivery partner notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Notify all online delivery partners about new order
 * @param {object} order - Order details
 */
const notifyAllDeliveryPartnersNewOrder = async (order) => {
    try {
        // Get all online, verified delivery partners with push tokens
        const partners = await DeliveryPartner.find({
            isOnline: true,
            isVerified: true,
            isBlocked: false,
            expoPushToken: { $ne: '', $exists: true },
        }).select('expoPushToken');

        if (partners.length === 0) {
            console.log('No online delivery partners to notify');
            return { success: false, error: 'No online partners' };
        }

        const notification = {
            title: '📦 New Delivery Available!',
            body: `Order #${order.orderNumber} ready for pickup. Earn ₹${order.deliveryPayment || order.deliveryFee || 40}`,
            data: {
                type: 'delivery_new_order',
                orderId: order._id.toString(),
                orderNumber: order.orderNumber,
                deliveryPayment: order.deliveryPayment || order.deliveryFee || 40,
            },
        };

        const messages = partners
            .filter(p => Expo.isExpoPushToken(p.expoPushToken))
            .map(p => ({
                to: p.expoPushToken,
                sound: 'default',
                title: notification.title,
                body: notification.body,
                data: notification.data,
                priority: 'high',
                channelId: 'default',
            }));

        if (messages.length === 0) {
            return { success: false, error: 'No valid tokens' };
        }

        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }

        console.log(`Notified ${messages.length} delivery partners about new order`);
        return { success: true, tickets, count: messages.length };
    } catch (error) {
        console.error('Error notifying delivery partners:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send delivery status update to user
 * @param {object} user - User object
 * @param {object} order - Order details
 * @param {string} deliveryStatus - Delivery status: 'accepted', 'picked_up', 'on_the_way', 'delivered'
 * @param {object} partner - Delivery partner details (optional)
 */
const sendDeliveryStatusNotification = async (user, order, deliveryStatus, partner = null) => {
    const statusMessages = {
        accepted: {
            title: '🚴 Delivery Partner Assigned',
            body: partner
                ? `${partner.name} will deliver your order #${order.orderNumber}.`
                : `A delivery partner has been assigned to your order #${order.orderNumber}.`,
        },
        picked_up: {
            title: '📦 Order Picked Up',
            body: `Your order #${order.orderNumber} has been picked up and is on the way!`,
        },
        on_the_way: {
            title: '🏃 Order On The Way',
            body: `Your order #${order.orderNumber} is on its way to you!`,
        },
        delivered: {
            title: '🎉 Order Delivered',
            body: `Your order #${order.orderNumber} has been delivered. Enjoy!`,
        },
    };

    const notification = statusMessages[deliveryStatus] || {
        title: 'Delivery Update',
        body: `Your order #${order.orderNumber} delivery status: ${deliveryStatus}`,
    };

    notification.data = {
        type: 'delivery_status_update',
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        deliveryStatus: deliveryStatus,
        partnerId: partner?._id?.toString() || null,
        partnerName: partner?.name || null,
    };

    return sendPushNotification(user, notification, 'order');
};

/**
 * Send promotional notification for new discounted products
 * @param {Array} users - Array of user objects (will filter by promotions preference)
 * @param {object} product - Product details
 */
const sendProductDealNotification = async (users, product) => {
    const discountPercent = product.mrp > 0
        ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
        : 0;

    const notification = {
        title: '🔥 New Deal Alert!',
        body: `${product.title} is now ${discountPercent}% off! Only ₹${product.price}`,
        data: {
            type: 'product_deal',
            productId: product._id.toString(),
            productTitle: product.title,
            discount: discountPercent,
        },
    };

    return sendBulkPushNotifications(users, notification, 'promotion');
};

/**
 * Get all users with promotions enabled for sending deals
 */
const getUsersWithPromotionsEnabled = async () => {
    try {
        const users = await User.find({
            'notificationSettings.pushEnabled': true,
            'notificationSettings.promotions': true,
            expoPushToken: { $ne: '' },
        }).select('expoPushToken notificationSettings');

        return users;
    } catch (error) {
        console.error('Error getting users with promotions enabled:', error);
        return [];
    }
};

/**
 * Update push token for user at login/signup
 * @param {string} userId - User ID
 * @param {string} expoPushToken - New Expo push token
 * @param {string} userType - 'user' or 'delivery_partner'
 */
const updatePushToken = async (userId, expoPushToken, userType = 'user') => {
    try {
        if (userType === 'delivery_partner') {
            await DeliveryPartner.findByIdAndUpdate(userId, { expoPushToken });
        } else {
            await User.findByIdAndUpdate(userId, { expoPushToken });
        }
        console.log(`Push token updated for ${userType} ${userId}`);
        return { success: true };
    } catch (error) {
        console.error('Error updating push token:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendPushNotification,
    sendPushNotificationByToken,
    sendBulkPushNotifications,
    sendOrderStatusNotification,
    sendVendorNewOrderNotification,
    sendDeliveryPartnerNewOrderNotification,
    notifyAllDeliveryPartnersNewOrder,
    sendDeliveryStatusNotification,
    sendProductDealNotification,
    getUsersWithPromotionsEnabled,
    isNotificationEnabled,
    updatePushToken,
};
