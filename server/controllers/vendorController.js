const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');

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

module.exports = {
    getVendorProducts,
    createVendorProduct,
    updateVendorProduct,
    deleteVendorProduct,
    getVendorOrders,
};
