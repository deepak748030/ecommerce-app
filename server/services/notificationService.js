// Expo Push Notification Service
const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification to a single user
 * @param {string} expoPushToken - The Expo push token
 * @param {object} notification - Notification details
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {object} notification.data - Additional data
 */
const sendPushNotification = async (expoPushToken, notification) => {
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
 * Send push notifications to multiple users
 * @param {Array} tokens - Array of Expo push tokens
 * @param {object} notification - Notification details
 */
const sendBulkPushNotifications = async (tokens, notification) => {
    try {
        const messages = [];

        for (const token of tokens) {
            if (Expo.isExpoPushToken(token)) {
                messages.push({
                    to: token,
                    sound: 'default',
                    title: notification.title,
                    body: notification.body,
                    data: notification.data || {},
                    priority: 'high',
                    channelId: 'default',
                });
            }
        }

        if (messages.length === 0) {
            return { success: false, error: 'No valid tokens' };
        }

        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (const chunk of chunks) {
            const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }

        console.log(`Bulk notifications sent to ${messages.length} users`);
        return { success: true, tickets, count: messages.length };
    } catch (error) {
        console.error('Error sending bulk notifications:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Send order status notification
 * @param {string} expoPushToken - User's push token
 * @param {object} order - Order details
 * @param {string} newStatus - New order status
 */
const sendOrderStatusNotification = async (expoPushToken, order, newStatus) => {
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

    return sendPushNotification(expoPushToken, notification);
};

/**
 * Send promotional notification for new discounted products
 * @param {Array} tokens - Array of user push tokens
 * @param {object} product - Product details
 */
const sendProductDealNotification = async (tokens, product) => {
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

    return sendBulkPushNotifications(tokens, notification);
};

module.exports = {
    sendPushNotification,
    sendBulkPushNotifications,
    sendOrderStatusNotification,
    sendProductDealNotification,
};
