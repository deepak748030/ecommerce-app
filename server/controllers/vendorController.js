const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const User = require('../models/User');
const { sendOrderStatusNotification } = require('../services/notificationService');
const { createNotification } = require('./notificationController');
const { releasePendingBalance } = require('./walletController');

// @desc    Get vendor's own products
// @route   GET /api/vendor/products
// @access  Private
const getVendorProducts = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const products = await Product.find({ createdBy: req.user._id })
            .populate('category', 'name color')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments({ createdBy: req.user._id });

        res.json({
            success: true,
            message: 'Vendor products fetched successfully',
            response: {
                count: products.length,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                data: products,
            },
        });
    } catch (error) {
        console.error('Get vendor products error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create product as vendor
// @route   POST /api/vendor/products
// @access  Private
const createVendorProduct = async (req, res) => {
    try {
        const {
            title,
            description,
            price,
            mrp,
            category,
            image,
            images,
            badge,
            location,
            fullLocation,
            date,
            time,
            services,
        } = req.body;

        if (!title || !price || !category) {
            return res.status(400).json({
                success: false,
                message: 'Title, price, and category are required'
            });
        }

        // Find category by name or ID
        let categoryDoc;
        if (category.match(/^[0-9a-fA-F]{24}$/)) {
            categoryDoc = await Category.findById(category);
        } else {
            categoryDoc = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
        }

        if (!categoryDoc) {
            return res.status(400).json({ success: false, message: 'Category not found' });
        }

        const product = await Product.create({
            title,
            description: description || '',
            price: parseFloat(price),
            mrp: parseFloat(mrp) || parseFloat(price),
            category: categoryDoc._id,
            image: image || '',
            images: images || [],
            badge: badge || '',
            location: location || '',
            fullLocation: fullLocation || '',
            date: date || '',
            time: time || '',
            services: services || [],
            createdBy: req.user._id,
        });

        // Update category items count
        await Category.findByIdAndUpdate(categoryDoc._id, {
            $inc: { itemsCount: 1 }
        });

        // Populate category before returning
        await product.populate('category', 'name color');

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            response: product,
        });
    } catch (error) {
        console.error('Create vendor product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update vendor's own product
// @route   PUT /api/vendor/products/:id
// @access  Private
const updateVendorProduct = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or you do not have permission to update it'
            });
        }

        const {
            title,
            description,
            price,
            mrp,
            category,
            image,
            images,
            badge,
            location,
            fullLocation,
            rating,
            reviews,
            date,
            time,
            services,
            isActive,
        } = req.body;

        // Handle category change
        if (category) {
            let categoryDoc;
            if (category.match(/^[0-9a-fA-F]{24}$/)) {
                categoryDoc = await Category.findById(category);
            } else {
                categoryDoc = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
            }

            if (!categoryDoc) {
                return res.status(400).json({ success: false, message: 'Category not found' });
            }

            // Update counts if category changed
            if (product.category.toString() !== categoryDoc._id.toString()) {
                await Category.findByIdAndUpdate(product.category, { $inc: { itemsCount: -1 } });
                await Category.findByIdAndUpdate(categoryDoc._id, { $inc: { itemsCount: 1 } });
            }

            product.category = categoryDoc._id;
        }

        if (title) product.title = title;
        if (description !== undefined) product.description = description;
        if (price) product.price = parseFloat(price);
        if (mrp) product.mrp = parseFloat(mrp);
        if (image !== undefined) product.image = image;
        if (images !== undefined) product.images = images;
        if (badge !== undefined) product.badge = badge;
        if (location !== undefined) product.location = location;
        if (fullLocation !== undefined) product.fullLocation = fullLocation;
        if (rating !== undefined) product.rating = parseFloat(rating);
        if (reviews !== undefined) product.reviews = parseInt(reviews);
        if (date !== undefined) product.date = date;
        if (time !== undefined) product.time = time;
        if (services !== undefined) product.services = services;
        if (typeof isActive === 'boolean') product.isActive = isActive;

        await product.save();
        await product.populate('category', 'name color');

        res.json({
            success: true,
            message: 'Product updated successfully',
            response: product,
        });
    } catch (error) {
        console.error('Update vendor product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete vendor's own product
// @route   DELETE /api/vendor/products/:id
// @access  Private
const deleteVendorProduct = async (req, res) => {
    try {
        const product = await Product.findOne({
            _id: req.params.id,
            createdBy: req.user._id,
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or you do not have permission to delete it'
            });
        }

        // Update category items count
        await Category.findByIdAndUpdate(product.category, {
            $inc: { itemsCount: -1 }
        });

        await product.deleteOne();

        res.json({
            success: true,
            message: 'Product deleted successfully',
            response: { id: req.params.id },
        });
    } catch (error) {
        console.error('Delete vendor product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get orders containing vendor's products
// @route   GET /api/vendor/orders
// @access  Private
const getVendorOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // First, get all product IDs created by this vendor
        const vendorProducts = await Product.find({ createdBy: req.user._id }).select('_id');
        const vendorProductIds = vendorProducts.map(p => p._id);

        if (vendorProductIds.length === 0) {
            return res.json({
                success: true,
                message: 'No vendor orders found',
                response: {
                    count: 0,
                    total: 0,
                    page: parseInt(page),
                    pages: 0,
                    data: [],
                },
            });
        }

        // Build query for orders that contain vendor's products
        const query = {
            'items.product': { $in: vendorProductIds }
        };

        if (status) {
            query.status = status;
        }

        // Get orders containing vendor's products
        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('user', 'name phone email')
            .populate('items.product', 'title image createdBy');

        // Filter order items to only include vendor's products and calculate vendor-specific totals
        const vendorOrders = orders.map(order => {
            const orderObj = order.toObject();

            // Filter items to only show vendor's products
            const vendorItems = orderObj.items.filter(item => {
                if (item.product && item.product.createdBy) {
                    return item.product.createdBy.toString() === req.user._id.toString();
                }
                return vendorProductIds.some(pid => pid.toString() === (item.product?._id || item.product)?.toString());
            });

            // Calculate vendor-specific totals
            const vendorSubtotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            return {
                ...orderObj,
                items: vendorItems,
                vendorSubtotal,
                vendorItemsCount: vendorItems.length,
            };
        }).filter(order => order.items.length > 0); // Only include orders with vendor items

        const total = await Order.countDocuments(query);

        res.json({
            success: true,
            message: 'Vendor orders fetched successfully',
            response: {
                count: vendorOrders.length,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                data: vendorOrders,
            },
        });
    } catch (error) {
        console.error('Get vendor orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update order status for vendor's products
// @route   PUT /api/vendor/orders/:id/status
// @access  Private
const updateVendorOrderStatus = async (req, res) => {
    try {
        const { status, deliveryPayment, deliveryTimeMinutes } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required',
            });
        }

        // Vendors cannot set delivered status - only delivery partners can
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: status === 'delivered' ? 'Vendors cannot mark orders as delivered' : 'Invalid status',
            });
        }

        // When shipping, require delivery payment and time
        if (status === 'shipped') {
            if (deliveryPayment === undefined || deliveryPayment === null) {
                return res.status(400).json({
                    success: false,
                    message: 'Delivery payment amount is required when shipping',
                });
            }
            if (deliveryTimeMinutes === undefined || deliveryTimeMinutes === null) {
                return res.status(400).json({
                    success: false,
                    message: 'Delivery time is required when shipping',
                });
            }
        }

        // Get vendor's product IDs
        const vendorProducts = await Product.find({ createdBy: req.user._id }).select('_id');
        const vendorProductIds = vendorProducts.map(p => p._id.toString());

        if (vendorProductIds.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'You have no products',
            });
        }

        // Find the order and check if it contains vendor's products
        const order = await Order.findById(req.params.id)
            .populate('user', 'expoPushToken name')
            .populate('items.product', 'createdBy price');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found',
            });
        }

        // Check if order contains any of vendor's products
        const hasVendorProduct = order.items.some(item => {
            // item.product may be populated doc or ObjectId
            const productId = item.product?._id ? item.product._id.toString() : item.product.toString();
            return vendorProductIds.includes(productId);
        });

        if (!hasVendorProduct) {
            return res.status(403).json({
                success: false,
                message: 'You can only update orders containing your products',
            });
        }

        const oldStatus = order.status;
        order.status = status;

        // Save delivery payment and time when shipping
        if (status === 'shipped') {
            const parsedPayment = parseFloat(deliveryPayment) || 0;
            const parsedMinutes = parseInt(deliveryTimeMinutes) || 30;
            order.deliveryPayment = parsedPayment;
            order.deliveryTimeMinutes = parsedMinutes;

            // Keep existing fields in sync so delivery partner app (and earnings) show correct values everywhere
            order.deliveryFee = parsedPayment || order.deliveryFee;
            order.estimatedDeliveryTime = `${parsedMinutes} min`;
        }

        // Update timeline based on status
        const timelineMap = {
            'pending': 0,
            'confirmed': 1,
            'processing': 1,
            'shipped': 2,
            'out_for_delivery': 3,
            'delivered': 4,
        };

        if (status !== 'cancelled' && timelineMap[status] !== undefined) {
            const timelineIndex = timelineMap[status];
            for (let i = 0; i <= timelineIndex; i++) {
                if (order.timeline[i]) {
                    order.timeline[i].completed = true;
                    if (!order.timeline[i].date) {
                        order.timeline[i].date = new Date();
                    }
                }
            }

            if (status === 'processing') {
                order.timeline[1].status = 'Processing';
            } else if (status === 'confirmed') {
                order.timeline[1].status = 'Order Confirmed';
            }
        }

        if (status === 'delivered') {
            order.deliveredAt = new Date();

            // Release ONLY this vendor's pending amount for this order (online payments)
            if (order.paymentMethod !== 'cod') {
                let vendorReleaseAmount = 0;

                for (const item of order.items) {
                    const createdBy = item.product?.createdBy?.toString();
                    if (createdBy === req.user._id.toString()) {
                        const price = item.product?.price ?? item.price;
                        const itemTotal = price * item.quantity;
                        vendorReleaseAmount += Math.round(itemTotal * 0.9);
                    }
                }

                if (vendorReleaseAmount > 0) {
                    await releasePendingBalance(req.user._id, vendorReleaseAmount, order._id);
                }
            }
        }

        await order.save();

        // Get user for notification
        const user = await User.findById(order.user._id || order.user);

        // Create in-app notification
        const statusMessages = {
            pending: { title: '📦 Order Received', message: `Your order #${order.orderNumber} has been received.` },
            confirmed: { title: '✅ Order Confirmed', message: `Your order #${order.orderNumber} has been confirmed.` },
            processing: { title: '🔄 Order Processing', message: `Your order #${order.orderNumber} is being processed.` },
            shipped: { title: '🚚 Order Shipped', message: `Your order #${order.orderNumber} has been shipped!` },
            out_for_delivery: { title: '🏃 Out for Delivery', message: `Your order #${order.orderNumber} is out for delivery.` },
            delivered: { title: '🎉 Order Delivered', message: `Your order #${order.orderNumber} has been delivered!` },
            cancelled: { title: '❌ Order Cancelled', message: `Your order #${order.orderNumber} has been cancelled.` },
        };

        const notifData = statusMessages[status] || { title: 'Order Update', message: `Order #${order.orderNumber} status: ${status}` };

        if (user) {
            await createNotification(user._id, {
                title: notifData.title,
                message: notifData.message,
                type: 'order',
                data: {
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber,
                    status: status,
                },
            });

            await sendOrderStatusNotification(user, order, status);
        }

        res.json({
            success: true,
            message: `Order status updated to ${status}`,
            response: order,
        });
    } catch (error) {
        console.error('Update vendor order status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get vendor analytics
// @route   GET /api/vendor/analytics
// @access  Private
const getVendorAnalytics = async (req, res) => {
    try {
        // Get vendor user with wallet
        const vendorUser = await User.findById(req.user._id);

        // Get vendor's products
        const vendorProducts = await Product.find({ createdBy: req.user._id });
        const vendorProductIds = vendorProducts.map(p => p._id);

        // Initialize wallet data
        const walletData = vendorUser?.wallet || {
            balance: 0,
            pendingBalance: 0,
            totalEarnings: 0,
            totalWithdrawn: 0,
        };

        if (vendorProductIds.length === 0) {
            return res.json({
                success: true,
                message: 'No analytics data',
                response: {
                    totalProducts: 0,
                    totalOrders: 0,
                    totalRevenue: 0,
                    totalItemsSold: 0,
                    pendingOrders: 0,
                    deliveredOrders: 0,
                    cancelledOrders: 0,
                    topProducts: [],
                    recentOrders: [],
                    revenueByStatus: {},
                    ordersByMonth: [],
                    wallet: {
                        balance: walletData.balance,
                        pendingBalance: walletData.pendingBalance,
                        totalEarnings: walletData.totalEarnings,
                        totalWithdrawn: walletData.totalWithdrawn,
                        currency: 'INR',
                        currencySymbol: '₹',
                    },
                },
            });
        }

        // Get all orders containing vendor's products
        const orders = await Order.find({
            'items.product': { $in: vendorProductIds }
        }).populate('items.product', 'title image createdBy');

        // Calculate analytics
        let totalRevenue = 0;
        let totalItemsSold = 0;
        let pendingOrders = 0;
        let deliveredOrders = 0;
        let cancelledOrders = 0;
        const productSales = {};
        const revenueByStatus = {};
        const ordersByMonth = {};

        orders.forEach(order => {
            const vendorItems = order.items.filter(item =>
                item.product && vendorProductIds.some(pid =>
                    pid.toString() === (item.product._id || item.product).toString()
                )
            );

            const vendorSubtotal = vendorItems.reduce((sum, item) => {
                const itemTotal = item.price * item.quantity;

                // Track product sales
                const productId = (item.product._id || item.product).toString();
                if (!productSales[productId]) {
                    productSales[productId] = {
                        productId,
                        name: item.name || (item.product.title || 'Unknown'),
                        image: item.image || (item.product.image || ''),
                        totalSold: 0,
                        revenue: 0,
                    };
                }
                productSales[productId].totalSold += item.quantity;
                productSales[productId].revenue += itemTotal;

                return sum + itemTotal;
            }, 0);

            if (vendorItems.length > 0) {
                totalRevenue += vendorSubtotal;
                totalItemsSold += vendorItems.reduce((sum, item) => sum + item.quantity, 0);

                // Track by status
                if (!revenueByStatus[order.status]) {
                    revenueByStatus[order.status] = { count: 0, revenue: 0 };
                }
                revenueByStatus[order.status].count++;
                revenueByStatus[order.status].revenue += vendorSubtotal;

                // Track by month
                const monthKey = new Date(order.createdAt).toISOString().slice(0, 7);
                if (!ordersByMonth[monthKey]) {
                    ordersByMonth[monthKey] = { month: monthKey, orders: 0, revenue: 0 };
                }
                ordersByMonth[monthKey].orders++;
                ordersByMonth[monthKey].revenue += vendorSubtotal;

                // Count by status
                if (order.status === 'pending' || order.status === 'confirmed' || order.status === 'processing') {
                    pendingOrders++;
                } else if (order.status === 'delivered') {
                    deliveredOrders++;
                } else if (order.status === 'cancelled') {
                    cancelledOrders++;
                }
            }
        });

        // Get top products by revenue
        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Get recent orders
        const recentOrders = await Order.find({
            'items.product': { $in: vendorProductIds }
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name')
            .populate('items.product', 'title image createdBy');

        const formattedRecentOrders = recentOrders.map(order => {
            const vendorItems = order.items.filter(item =>
                item.product && vendorProductIds.some(pid =>
                    pid.toString() === (item.product._id || item.product).toString()
                )
            );
            const vendorSubtotal = vendorItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            return {
                _id: order._id,
                orderNumber: order.orderNumber,
                customerName: order.user?.name || 'Customer',
                status: order.status,
                itemsCount: vendorItems.length,
                total: vendorSubtotal,
                createdAt: order.createdAt,
            };
        });

        // Convert ordersByMonth to array and sort
        const ordersByMonthArray = Object.values(ordersByMonth).sort((a, b) => a.month.localeCompare(b.month));

        res.json({
            success: true,
            message: 'Analytics fetched successfully',
            response: {
                totalProducts: vendorProducts.length,
                totalOrders: orders.length,
                totalRevenue: Math.round(totalRevenue),
                totalItemsSold,
                pendingOrders,
                deliveredOrders,
                cancelledOrders,
                topProducts,
                recentOrders: formattedRecentOrders,
                revenueByStatus,
                ordersByMonth: ordersByMonthArray,
                wallet: {
                    balance: walletData.balance,
                    pendingBalance: walletData.pendingBalance,
                    totalEarnings: walletData.totalEarnings,
                    totalWithdrawn: walletData.totalWithdrawn,
                    currency: 'INR',
                    currencySymbol: '₹',
                },
            },
        });
    } catch (error) {
        console.error('Get vendor analytics error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getVendorProducts,
    createVendorProduct,
    updateVendorProduct,
    deleteVendorProduct,
    getVendorOrders,
    updateVendorOrderStatus,
    getVendorAnalytics,
};
