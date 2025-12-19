const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const { sendProductDealNotification } = require('../services/notificationService');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
    try {
        const {
            category,
            search,
            limit = 50,
            page = 1,
            minPrice,
            maxPrice,
            minRating,
            sort
        } = req.query;

        const query = { isActive: true };

        // Filter by category
        if (category) {
            const cat = await Category.findOne({ name: { $regex: new RegExp(category, 'i') } });
            if (cat) {
                query.category = cat._id;
            }
        }

        // Search by title or description
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }

        // Filter by price range
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Filter by minimum rating
        if (minRating) {
            query.rating = { $gte: parseFloat(minRating) };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        let sortObj = { createdAt: -1 };
        if (sort === 'price_low_to_high') {
            sortObj = { price: 1 };
        } else if (sort === 'price_high_to_low') {
            sortObj = { price: -1 };
        } else if (sort === 'rating') {
            sortObj = { rating: -1 };
        }

        const products = await Product.find(query)
            .populate('category', 'name color')
            .sort(sortObj)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            message: 'Products fetched successfully',
            response: {
                count: products.length,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                data: products,
            },
        });
    } catch (error) {
        console.error('Get products error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name color');

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({
            success: true,
            message: 'Product fetched successfully',
            response: product,
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create product (Admin only)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Only admin can create products' });
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
            createdBy: req.userId,
        });

        // Update category items count
        await Category.findByIdAndUpdate(categoryDoc._id, {
            $inc: { itemsCount: 1 }
        });

        // Populate category before returning
        await product.populate('category', 'name color');

        // Send push notification for discounted products
        const discountPercent = product.mrp > product.price
            ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
            : 0;

        if (discountPercent >= 10) {
            // Get all users with push tokens who have promotions enabled
            const usersWithTokens = await User.find({
                expoPushToken: { $ne: '', $exists: true }
            }).select('expoPushToken');

            const tokens = usersWithTokens.map(u => u.expoPushToken).filter(Boolean);

            if (tokens.length > 0) {
                // Send notification asynchronously (don't wait)
                sendProductDealNotification(tokens, product).catch(err => {
                    console.error('Failed to send deal notification:', err);
                });
            }
        }

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            response: product,
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update product (Admin only)
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Only admin can update products' });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
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
        console.error('Update product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete product (Admin only)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
    try {
        // Check if user is admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ success: false, message: 'Only admin can delete products' });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
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
        console.error('Delete product error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get products by category
// @route   GET /api/products/category/:categoryId
// @access  Public
const getProductsByCategory = async (req, res) => {
    try {
        const { limit = 50, page = 1 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const products = await Product.find({
            category: req.params.categoryId,
            isActive: true
        })
            .populate('category', 'name color')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Product.countDocuments({
            category: req.params.categoryId,
            isActive: true
        });

        res.json({
            success: true,
            message: 'Products fetched successfully',
            response: {
                count: products.length,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                data: products,
            },
        });
    } catch (error) {
        console.error('Get products by category error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductsByCategory,
};
