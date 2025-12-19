// Expo Push Notification Service
const { Expo } = require('expo-server-sdk');
const User = require('../models/User');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Check if user has enabled specific notification type
 * @param {object} user - User object with notificationSettings
 * @param {string} notificationType - Type: 'order', 'promotion', 'system'
 * @returns {boolean}
 */
const isNotificationEnabled = (user, notificationType) => {
    // If no user or settings, default to false
    if (!user || !user.notificationSettings) {
        return false;
    }

    const settings = user.notificationSettings;

    // Check if push notifications are enabled globally
    if (!settings.pushEnabled) {
        return false;
    }

    // Check specific notification type
    switch (notificationType) {
        case 'order':
        case 'order_update':
            return settings.orderUpdates !== false; // Default true if not set
        case 'promotion':
        case 'promo':
        case 'deal':
            return settings.promotions === true; // Default false if not set
        case 'system':
        default:
            return settings.pushEnabled !== false; // System notifications if push enabled
    }
};

/**
 * Send push notification to a single user with preference check
 * @param {object} user - User object with expoPushToken and notificationSettings
 * @param {object} notification - Notification details
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {object} notification.data - Additional data
 * @param {string} notificationType - Type: 'order', 'promotion', 'system'
 */
const sendPushNotification = async (user, notification, notificationType = 'system') => {
    try {
        // Check if user exists and has push token
        if (!user || !user.expoPushToken) {
            console.log('No push token for user');
            return { success: false, error: 'No push token', skipped: true };
        }

        // Check if notification type is enabled for this user
        if (!isNotificationEnabled(user, notificationType)) {
            console.log(`Notification type '${notificationType}' is disabled for user ${user._id}`);
            return { success: false, error: 'Notification disabled by user', skipped: true };
        }

        const expoPushToken = user.expoPushToken;

        if (!Expo.isExpoPushToken(expoPushToken)) {
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
 * Send push notification using just token (legacy support)
 * @param {string} expoPushToken - The Expo push token
 * @param {object} notification - Notification details
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
            // Skip if no token
            if (!user.expoPushToken || !Expo.isExpoPushToken(user.expoPushToken)) {
                skippedCount++;
                continue;
            }

            // Check if notification type is enabled for this user
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
 * Send order status notification with user preference check
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

    // Use 'order' type to check orderUpdates preference
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

    // Use 'promotion' type to check promotions preference
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

module.exports = {
    sendPushNotification,
    sendPushNotificationByToken,
    sendBulkPushNotifications,
    sendOrderStatusNotification,
    sendProductDealNotification,
    getUsersWithPromotionsEnabled,
    isNotificationEnabled,
};
