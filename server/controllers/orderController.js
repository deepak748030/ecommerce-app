const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    try {
        const { items, shippingAddress, paymentMethod, promoCode } = req.body;

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

        // Create timeline
        const timeline = [
            { status: 'Order Placed', date: new Date(), completed: true },
            { status: 'Order Confirmed', date: null, completed: false },
            { status: 'Shipped', date: null, completed: false },
            { status: 'Out for Delivery', date: null, completed: false },
            { status: 'Delivered', date: null, completed: false },
        ];

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
            status: 'confirmed',
        });

        // Update timeline for confirmed
        order.timeline[1] = { status: 'Order Confirmed', date: new Date(), completed: true };
        await order.save();

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            response: order,
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

// @desc    Get single order
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

        res.json({
            success: true,
            response: order,
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// @desc    Cancel order
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

        order.status = 'cancelled';
        await order.save();

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            response: order,
        });
    } catch (error) {
        console.error('Cancel order error:', error);
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
};
