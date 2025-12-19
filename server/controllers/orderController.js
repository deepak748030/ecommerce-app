const Order = require('../models/Order');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { sendOrderStatusNotification } = require('../services/notificationService');

// @desc    Create new order with payment
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod, paymentDetails, promoCode } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No order items provided',
            });
        }

        // Fetch product details and calculate totals
        let subtotal = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.productId}`,
                });
            }

            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;

            orderItems.push({
                product: product._id,
                name: product.title,
                price: product.price,
                quantity: item.quantity,
                image: product.image,
            });
        }

        // Calculate discount (10% for now)
        const discount = Math.round(subtotal * 0.1);

        // Calculate shipping (free above 500)
        const shipping = subtotal > 500 ? 0 : 40;

        // Calculate tax (5%)
        const tax = Math.round(subtotal * 0.05);

        // Total
        const total = subtotal - discount + shipping + tax;

        // Create timeline with pending as default
        const timeline = [
            { status: 'Order Placed', date: new Date(), completed: true },
            { status: 'Order Confirmed', date: null, completed: false },
            { status: 'Shipped', date: null, completed: false },
            { status: 'Out for Delivery', date: null, completed: false },
            { status: 'Delivered', date: null, completed: false },
        ];

        // Create the order with pending status as default
        const order = await Order.create({
            user: req.user._id,
            items: orderItems,
            shippingAddress,
            paymentMethod,
            subtotal,
            discount,
            shipping,
            tax,
            total,
            promoCode,
            timeline,
            status: 'pending', // Default status is pending
        });

        // Create transaction record for the payment
        const transaction = await Transaction.create({
            user: req.user._id,
            order: order._id,
            amount: total,
            paymentMethod: paymentMethod,
            paymentDetails: paymentDetails || {},
            status: 'completed',
            type: 'payment',
            description: `Payment for order ${order.orderNumber}`,
        });

        // Send push notification for order placed
        if (req.user.expoPushToken) {
            await sendOrderStatusNotification(req.user.expoPushToken, order, 'pending');
        }

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            response: {
                order,
                transaction,
            },
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Get user orders
// @route   GET /api/orders
// @access  Private
const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('items.product', 'title image');

        res.json({
            success: true,
            response: {
                count: orders.length,
                data: orders,
            },
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Get single order with transaction
// @route   GET /api/orders/:id
// @access  Private
const getOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id,
        }).populate('items.product', 'title image price');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Get associated transactions
        const transactions = await Transaction.find({ order: order._id }).sort({ createdAt: -1 });

        res.json({
            success: true,
            response: {
                ...order.toObject(),
                transactions,
            },
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Cancel order and create refund transaction
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        if (['shipped', 'out_for_delivery', 'delivered'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel order at this stage',
            });
        }

        if (order.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                message: 'Order is already cancelled',
            });
        }

        order.status = 'cancelled';
        await order.save();

        // Create refund transaction
        const refundTransaction = await Transaction.create({
            user: req.user._id,
            order: order._id,
            amount: order.total,
            paymentMethod: order.paymentMethod,
            status: 'completed',
            type: 'refund',
            description: `Refund for cancelled order ${order.orderNumber}`,
            refundReason: req.body.reason || 'Order cancelled by user',
            refundedAt: new Date(),
        });

        res.json({
            success: true,
            message: 'Order cancelled and refund initiated',
            response: {
                order,
                refundTransaction,
            },
        });
    } catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Get user transactions (from orders)
// @route   GET /api/orders/transactions
// @access  Private
const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate({
                path: 'order',
                select: 'orderNumber items total status',
            });

        res.json({
            success: true,
            response: {
                count: transactions.length,
                data: transactions,
            },
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required',
            });
        }

        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status',
            });
        }

        const order = await Order.findById(req.params.id).populate('user', 'expoPushToken');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Only admin can update order status
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update order status',
            });
        }

        const oldStatus = order.status;
        order.status = status;

        // Update timeline based on status
        const timelineMap = {
            'pending': 0,
            'confirmed': 1,
            'processing': 1,
            'shipped': 2,
            'out_for_delivery': 3,
            'delivered': 4,
        };

        // Update timeline
        if (status !== 'cancelled' && timelineMap[status] !== undefined) {
            const timelineIndex = timelineMap[status];

            // Mark all previous steps as completed
            for (let i = 0; i <= timelineIndex; i++) {
                if (order.timeline[i]) {
                    order.timeline[i].completed = true;
                    if (!order.timeline[i].date) {
                        order.timeline[i].date = new Date();
                    }
                }
            }

            // Update current step status name if needed
            if (status === 'processing') {
                order.timeline[1].status = 'Processing';
            } else if (status === 'confirmed') {
                order.timeline[1].status = 'Order Confirmed';
            }
        }

        // Set delivered date
        if (status === 'delivered') {
            order.deliveredAt = new Date();
        }

        await order.save();

        // Send push notification to user
        if (order.user && order.user.expoPushToken) {
            await sendOrderStatusNotification(order.user.expoPushToken, order, status);
        }

        res.json({
            success: true,
            message: `Order status updated to ${status}`,
            response: order,
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders/admin/all
// @access  Private (Admin)
const getAllOrdersAdmin = async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        const { status, page = 1, limit = 20 } = req.query;
        const query = {};

        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('user', 'name phone email')
            .populate('items.product', 'title image');

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            response: {
                count: orders.length,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                data: orders,
            },
        });
    } catch (error) {
        console.error('Get all orders admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrder,
    cancelOrder,
    getTransactions,
    updateOrderStatus,
    getAllOrdersAdmin,
};
