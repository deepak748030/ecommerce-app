const Admin = require('../models/Admin');
const User = require('../models/User');
const Category = require('../models/Category');
const Banner = require('../models/Banner');
const DeliveryPartner = require('../models/DeliveryPartner');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const { generateAdminToken } = require('../middleware/adminAuth');

// @desc    Admin login
// @route   POST /api/admin/login
// @access  Public
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const admin = await Admin.findOne({ email: email.toLowerCase() });

        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await admin.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!admin.isActive) {
            return res.status(401).json({ success: false, message: 'Account is deactivated' });
        }

        const token = generateAdminToken(admin._id);

        res.json({
            success: true,
            message: 'Login successful',
            response: {
                token,
                admin: {
                    _id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    avatar: admin.avatar,
                    role: admin.role,
                },
            },
        });
    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get admin profile
// @route   GET /api/admin/me
// @access  Private (Admin)
const getAdminProfile = async (req, res) => {
    try {
        res.json({
            success: true,
            response: {
                _id: req.admin._id,
                name: req.admin.name,
                email: req.admin.email,
                avatar: req.admin.avatar,
                role: req.admin.role,
            },
        });
    } catch (error) {
        console.error('Get admin profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Setup default admin (first time only)
// @route   POST /api/admin/setup
// @access  Public
const setupDefaultAdmin = async (req, res) => {
    try {
        const existingAdmin = await Admin.findOne();

        if (existingAdmin) {
            return res.status(400).json({ success: false, message: 'Admin already exists' });
        }

        const admin = await Admin.create({
            name: 'Super Admin',
            email: 'admin@plenify.com',
            password: 'Admin@123',
            role: 'super_admin',
        });

        res.json({
            success: true,
            message: 'Default admin created',
            response: {
                email: admin.email,
            },
        });
    } catch (error) {
        console.error('Setup admin error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all users with pagination
// @route   GET /api/admin/users
// @access  Private (Admin)
const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || 'all';

        const skip = (page - 1) * limit;

        // Build query
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }

        if (status === 'active') {
            query.isBlocked = false;
        } else if (status === 'blocked') {
            query.isBlocked = true;
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .select('name email phone avatar isBlocked memberSince wallet createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query),
        ]);

        res.json({
            success: true,
            response: {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('name email phone avatar isBlocked memberSince wallet createdAt updatedAt').lean();

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            response: { user },
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Toggle user block status
// @route   PUT /api/admin/users/:id/block
// @access  Private (Admin)
const toggleUserBlock = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({
            success: true,
            message: user.isBlocked ? 'User blocked' : 'User unblocked',
            response: {
                isBlocked: user.isBlocked,
            },
        });
    } catch (error) {
        console.error('Toggle user block error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, blockedUsers] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isBlocked: true }),
        ]);

        // Get recent users (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUsers = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

        res.json({
            success: true,
            response: {
                totalUsers,
                activeUsers: totalUsers - blockedUsers,
                blockedUsers,
                recentUsers,
            },
        });
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get dashboard analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
const getDashboardAnalytics = async (req, res) => {
    try {
        const filter = req.query.filter || 'monthly';

        // Calculate date range based on filter
        let startDate = new Date();
        if (filter === 'today') {
            startDate.setHours(0, 0, 0, 0);
        } else if (filter === 'weekly') {
            startDate.setDate(startDate.getDate() - 7);
        } else if (filter === 'monthly') {
            startDate.setMonth(startDate.getMonth() - 1);
        } else if (filter === 'yearly') {
            startDate.setFullYear(startDate.getFullYear() - 1);
        }

        // Parallel fetch all stats for optimal performance - O(1) with Promise.all
        const [
            totalUsers,
            blockedUsers,
            totalOrders,
            pendingOrders,
            confirmedOrders,
            deliveredOrders,
            cancelledOrders,
            totalCoupons,
            activeCoupons,
            expiredCoupons,
            totalCategories,
            activeCategories,
            totalBanners,
            activeBanners,
            totalDeliveryPartners,
            activeDeliveryPartners,
            blockedDeliveryPartners,
            onlineDeliveryPartners,
            pendingKycPartners,
            approvedKycPartners,
            periodUsers,
            periodOrders,
            periodDeliveryPartners,
            revenueAggregation,
            periodRevenueAggregation,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isBlocked: true }),
            Order.countDocuments(),
            Order.countDocuments({ status: 'pending' }),
            Order.countDocuments({ status: 'confirmed' }),
            Order.countDocuments({ status: 'delivered' }),
            Order.countDocuments({ status: 'cancelled' }),
            Coupon.countDocuments(),
            Coupon.countDocuments({ isActive: true, validTo: { $gte: new Date() } }),
            Coupon.countDocuments({ $or: [{ isActive: false }, { validTo: { $lt: new Date() } }] }),
            Category.countDocuments(),
            Category.countDocuments({ isActive: true }),
            Banner.countDocuments(),
            Banner.countDocuments({ isActive: true }),
            DeliveryPartner.countDocuments(),
            DeliveryPartner.countDocuments({ isActive: true }),
            DeliveryPartner.countDocuments({ isBlocked: true }),
            DeliveryPartner.countDocuments({ isOnline: true }),
            DeliveryPartner.countDocuments({ kycStatus: 'pending' }),
            DeliveryPartner.countDocuments({ kycStatus: 'approved' }),
            User.countDocuments({ createdAt: { $gte: startDate } }),
            Order.countDocuments({ createdAt: { $gte: startDate } }),
            DeliveryPartner.countDocuments({ createdAt: { $gte: startDate } }),
            Order.aggregate([
                { $match: { status: 'delivered' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            Order.aggregate([
                { $match: { status: 'delivered', createdAt: { $gte: startDate } } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
        ]);

        const totalRevenue = revenueAggregation[0]?.total || 0;
        const periodRevenue = periodRevenueAggregation[0]?.total || 0;

        // Generate chart data - last 6 months
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chartPromises = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            chartPromises.push(
                Promise.all([
                    User.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
                    Order.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
                    DeliveryPartner.countDocuments({ createdAt: { $gte: monthStart, $lte: monthEnd } }),
                    Order.aggregate([
                        { $match: { status: 'delivered', createdAt: { $gte: monthStart, $lte: monthEnd } } },
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                    ]),
                ]).then(([users, orders, partners, revenue]) => ({
                    name: monthNames[date.getMonth()],
                    users,
                    orders,
                    partners,
                    revenue: revenue[0]?.total || 0,
                }))
            );
        }

        const chartData = await Promise.all(chartPromises);

        // Daily data for last 7 days
        const dailyChartPromises = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

            dailyChartPromises.push(
                Promise.all([
                    Order.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
                    Order.aggregate([
                        { $match: { status: 'delivered', createdAt: { $gte: dayStart, $lte: dayEnd } } },
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                    ]),
                ]).then(([orders, revenue]) => ({
                    name: dayNames[date.getDay()],
                    orders,
                    revenue: revenue[0]?.total || 0,
                }))
            );
        }

        const dailyData = await Promise.all(dailyChartPromises);

        // Payment method distribution
        const paymentMethodAgg = await Order.aggregate([
            { $group: { _id: '$paymentMethod', count: { $sum: 1 } } }
        ]);

        const paymentColors = { cod: '#f59e0b', online: '#3b82f6', wallet: '#22c55e', upi: '#8b5cf6' };
        const paymentMethodDistribution = paymentMethodAgg.map(p => ({
            name: (p._id || 'COD').toUpperCase(),
            value: p.count,
            color: paymentColors[p._id] || '#64748b',
        }));

        // Top categories by orders (if category field exists)
        const topCategoriesAgg = await Order.aggregate([
            { $unwind: '$items' },
            { $group: { _id: '$items.category', count: { $sum: 1 }, revenue: { $sum: '$items.price' } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]).catch(() => []);

        const categoryColors = ['#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];
        const topCategories = topCategoriesAgg.map((c, i) => ({
            name: c._id || 'Other',
            value: c.count,
            revenue: c.revenue || 0,
            color: categoryColors[i] || '#64748b',
        }));

        res.json({
            success: true,
            response: {
                overview: {
                    totalUsers,
                    activeUsers: totalUsers - blockedUsers,
                    blockedUsers,
                    totalOrders,
                    pendingOrders,
                    confirmedOrders,
                    deliveredOrders,
                    cancelledOrders,
                    totalRevenue,
                    totalCoupons,
                    activeCoupons,
                    expiredCoupons,
                    totalCategories,
                    activeCategories,
                    totalBanners,
                    activeBanners,
                    totalDeliveryPartners,
                    activeDeliveryPartners,
                    blockedDeliveryPartners,
                    onlineDeliveryPartners,
                    pendingKycPartners,
                    approvedKycPartners,
                },
                periodStats: {
                    users: periodUsers,
                    orders: periodOrders,
                    deliveryPartners: periodDeliveryPartners,
                    revenue: periodRevenue,
                    filter,
                },
                charts: {
                    monthlyGrowth: chartData,
                    dailyOrders: dailyData,
                    orderStatusDistribution: [
                        { name: 'Pending', value: pendingOrders, color: '#f59e0b' },
                        { name: 'Confirmed', value: confirmedOrders, color: '#3b82f6' },
                        { name: 'Delivered', value: deliveredOrders, color: '#22c55e' },
                        { name: 'Cancelled', value: cancelledOrders, color: '#ef4444' },
                    ],
                    deliveryPartnerStatus: [
                        { name: 'Active', value: activeDeliveryPartners, color: '#22c55e' },
                        { name: 'Online', value: onlineDeliveryPartners, color: '#3b82f6' },
                        { name: 'Blocked', value: blockedDeliveryPartners, color: '#ef4444' },
                        { name: 'Pending KYC', value: pendingKycPartners, color: '#f59e0b' },
                    ],
                    paymentMethodDistribution: paymentMethodDistribution.length ? paymentMethodDistribution : [
                        { name: 'COD', value: 0, color: '#f59e0b' },
                        { name: 'Online', value: 0, color: '#3b82f6' },
                    ],
                    topCategories: topCategories.length ? topCategories : [],
                    couponStatus: [
                        { name: 'Active', value: activeCoupons, color: '#22c55e' },
                        { name: 'Expired', value: expiredCoupons, color: '#ef4444' },
                    ],
                },
            },
        });
    } catch (error) {
        console.error('Get dashboard analytics error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all categories with pagination
// @route   GET /api/admin/categories
// @access  Private (Admin)
const getCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || 'all';

        const skip = (page - 1) * limit;

        // Build query - optimized with indexed fields
        const query = {};

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        // Use Promise.all for parallel execution - O(1) for both operations
        // Use .lean() for faster read and .select() for minimal data transfer
        const [categories, total] = await Promise.all([
            Category.find(query)
                .select('name image color itemsCount isActive createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Category.countDocuments(query),
        ]);

        res.json({
            success: true,
            response: {
                categories,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get category by ID
// @route   GET /api/admin/categories/:id
// @access  Private (Admin)
const getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id).lean();

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        res.json({
            success: true,
            response: { category },
        });
    } catch (error) {
        console.error('Get category by ID error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create category
// @route   POST /api/admin/categories
// @access  Private (Admin)
const createCategory = async (req, res) => {
    try {
        const { name, image, color } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Category name is required' });
        }

        const existingCategory = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existingCategory) {
            return res.status(400).json({ success: false, message: 'Category already exists' });
        }

        const category = await Category.create({
            name,
            image: image || '',
            color: color || '#DCFCE7',
        });

        res.status(201).json({
            success: true,
            message: 'Category created successfully',
            response: { category },
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update category
// @route   PUT /api/admin/categories/:id
// @access  Private (Admin)
const updateCategory = async (req, res) => {
    try {
        const { name, image, color, isActive } = req.body;

        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        if (name) category.name = name;
        if (image !== undefined) category.image = image;
        if (color) category.color = color;
        if (typeof isActive === 'boolean') category.isActive = isActive;

        await category.save();

        res.json({
            success: true,
            message: 'Category updated successfully',
            response: { category },
        });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete category
// @route   DELETE /api/admin/categories/:id
// @access  Private (Admin)
const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        await category.deleteOne();

        res.json({
            success: true,
            message: 'Category deleted successfully',
            response: { id: req.params.id },
        });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Toggle category status
// @route   PUT /api/admin/categories/:id/toggle
// @access  Private (Admin)
const toggleCategoryStatus = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        category.isActive = !category.isActive;
        await category.save();

        res.json({
            success: true,
            message: category.isActive ? 'Category activated' : 'Category deactivated',
            response: { category },
        });
    } catch (error) {
        console.error('Toggle category status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all banners with pagination
// @route   GET /api/admin/banners
// @access  Private (Admin)
const getBanners = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        const linkType = req.query.linkType || 'all';

        const skip = (page - 1) * limit;

        const query = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { subtitle: { $regex: search, $options: 'i' } },
                { badge: { $regex: search, $options: 'i' } },
            ];
        }

        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        if (linkType !== 'all') {
            query.linkType = linkType;
        }

        const [banners, total] = await Promise.all([
            Banner.find(query)
                .sort({ order: 1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Banner.countDocuments(query),
        ]);

        res.json({
            success: true,
            response: {
                banners,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Get banners error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get banner by ID
// @route   GET /api/admin/banners/:id
// @access  Private (Admin)
const getBannerById = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id).lean();

        if (!banner) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        res.json({
            success: true,
            response: { banner },
        });
    } catch (error) {
        console.error('Get banner by ID error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create banner
// @route   POST /api/admin/banners
// @access  Private (Admin)
const createBanner = async (req, res) => {
    try {
        const { title, subtitle, image, badge, gradient, linkType, linkValue, order } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: 'Banner title is required' });
        }

        if (!image) {
            return res.status(400).json({ success: false, message: 'Banner image is required' });
        }

        const banner = await Banner.create({
            title,
            subtitle: subtitle || '',
            image,
            badge: badge || '',
            gradient: gradient || ['#22C55E', '#16A34A'],
            linkType: linkType || 'search',
            linkValue: linkValue || '',
            order: order || 0,
        });

        res.status(201).json({
            success: true,
            message: 'Banner created successfully',
            response: { banner },
        });
    } catch (error) {
        console.error('Create banner error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update banner
// @route   PUT /api/admin/banners/:id
// @access  Private (Admin)
const updateBanner = async (req, res) => {
    try {
        const { title, subtitle, image, badge, gradient, linkType, linkValue, order, isActive } = req.body;

        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        if (title) banner.title = title;
        if (subtitle !== undefined) banner.subtitle = subtitle;
        if (image) banner.image = image;
        if (badge !== undefined) banner.badge = badge;
        if (gradient) banner.gradient = gradient;
        if (linkType) banner.linkType = linkType;
        if (linkValue !== undefined) banner.linkValue = linkValue;
        if (order !== undefined) banner.order = order;
        if (typeof isActive === 'boolean') banner.isActive = isActive;

        await banner.save();

        res.json({
            success: true,
            message: 'Banner updated successfully',
            response: { banner },
        });
    } catch (error) {
        console.error('Update banner error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete banner
// @route   DELETE /api/admin/banners/:id
// @access  Private (Admin)
const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        await banner.deleteOne();

        res.json({
            success: true,
            message: 'Banner deleted successfully',
            response: { id: req.params.id },
        });
    } catch (error) {
        console.error('Delete banner error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Toggle banner status
// @route   PUT /api/admin/banners/:id/toggle
// @access  Private (Admin)
const toggleBannerStatus = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        banner.isActive = !banner.isActive;
        await banner.save();

        res.json({
            success: true,
            message: banner.isActive ? 'Banner activated' : 'Banner deactivated',
            response: { banner },
        });
    } catch (error) {
        console.error('Toggle banner status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Reorder banners
// @route   PUT /api/admin/banners/reorder
// @access  Private (Admin)
const reorderBanners = async (req, res) => {
    try {
        const { bannerOrders } = req.body;

        if (!bannerOrders || !Array.isArray(bannerOrders)) {
            return res.status(400).json({ success: false, message: 'Banner orders array is required' });
        }

        const updatePromises = bannerOrders.map(({ id, order }) =>
            Banner.findByIdAndUpdate(id, { order }, { new: true })
        );

        await Promise.all(updatePromises);

        res.json({
            success: true,
            message: 'Banners reordered successfully',
        });
    } catch (error) {
        console.error('Reorder banners error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all delivery partners with pagination (optimized with lean & select)
// @route   GET /api/admin/delivery-partners
// @access  Private (Admin)
const getDeliveryPartners = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        const kycStatus = req.query.kycStatus || 'all';
        const isOnline = req.query.isOnline;

        const skip = (page - 1) * limit;

        // Build query with indexed fields first
        const query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { 'vehicle.number': { $regex: search, $options: 'i' } },
            ];
        }

        if (status === 'active') {
            query.isBlocked = false;
            query.isActive = true;
        } else if (status === 'blocked') {
            query.isBlocked = true;
        } else if (status === 'inactive') {
            query.isActive = false;
            query.isBlocked = false;
        }

        if (kycStatus !== 'all') {
            query.kycStatus = kycStatus;
        }

        if (isOnline === 'true') {
            query.isOnline = true;
        } else if (isOnline === 'false') {
            query.isOnline = false;
        }

        // Use Promise.all for parallel execution - O(1) for both queries
        const [partners, total] = await Promise.all([
            DeliveryPartner.find(query)
                .select('-documents -expoPushToken -currentLocation') // Exclude heavy fields
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(), // Use lean for better performance
            DeliveryPartner.countDocuments(query),
        ]);

        res.json({
            success: true,
            response: {
                partners,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Get delivery partners error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get delivery partner by ID with full details
// @route   GET /api/admin/delivery-partners/:id
// @access  Private (Admin)
const getDeliveryPartnerById = async (req, res) => {
    try {
        const partner = await DeliveryPartner.findById(req.params.id)
            .select('-expoPushToken')
            .lean();

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Delivery partner not found' });
        }

        res.json({
            success: true,
            response: { partner },
        });
    } catch (error) {
        console.error('Get delivery partner by ID error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Toggle delivery partner block status
// @route   PUT /api/admin/delivery-partners/:id/block
// @access  Private (Admin)
const toggleDeliveryPartnerBlock = async (req, res) => {
    try {
        const { reason } = req.body;
        const partner = await DeliveryPartner.findById(req.params.id);

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Delivery partner not found' });
        }

        partner.isBlocked = !partner.isBlocked;
        if (partner.isBlocked) {
            partner.isOnline = false; // Force offline when blocked
        }
        await partner.save();

        res.json({
            success: true,
            message: partner.isBlocked ? 'Delivery partner blocked' : 'Delivery partner unblocked',
            response: {
                isBlocked: partner.isBlocked,
            },
        });
    } catch (error) {
        console.error('Toggle delivery partner block error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update delivery partner KYC status
// @route   PUT /api/admin/delivery-partners/:id/kyc
// @access  Private (Admin)
const updateDeliveryPartnerKYC = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;

        if (!['pending', 'submitted', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid KYC status' });
        }

        const partner = await DeliveryPartner.findById(req.params.id);

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Delivery partner not found' });
        }

        partner.kycStatus = status;

        if (status === 'approved') {
            partner.isVerified = true;
            partner.isActive = true;
            partner.kycRejectionReason = '';
        } else if (status === 'rejected') {
            partner.isVerified = false;
            partner.kycRejectionReason = rejectionReason || 'Documents rejected';
        } else {
            partner.isVerified = false;
        }

        await partner.save();

        res.json({
            success: true,
            message: `KYC status updated to ${status}`,
            response: {
                kycStatus: partner.kycStatus,
                isVerified: partner.isVerified,
                kycRejectionReason: partner.kycRejectionReason,
            },
        });
    } catch (error) {
        console.error('Update delivery partner KYC error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Toggle delivery partner active status
// @route   PUT /api/admin/delivery-partners/:id/toggle-active
// @access  Private (Admin)
const toggleDeliveryPartnerActive = async (req, res) => {
    try {
        const partner = await DeliveryPartner.findById(req.params.id);

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Delivery partner not found' });
        }

        partner.isActive = !partner.isActive;
        if (!partner.isActive) {
            partner.isOnline = false;
        }
        await partner.save();

        res.json({
            success: true,
            message: partner.isActive ? 'Delivery partner activated' : 'Delivery partner deactivated',
            response: {
                isActive: partner.isActive,
            },
        });
    } catch (error) {
        console.error('Toggle delivery partner active error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get delivery partner stats summary
// @route   GET /api/admin/delivery-partners/stats
// @access  Private (Admin)
const getDeliveryPartnerStats = async (req, res) => {
    try {
        // Use aggregation for O(n) single pass instead of multiple queries
        const stats = await DeliveryPartner.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    active: { $sum: { $cond: [{ $and: [{ $eq: ['$isActive', true] }, { $eq: ['$isBlocked', false] }] }, 1, 0] } },
                    online: { $sum: { $cond: ['$isOnline', 1, 0] } },
                    blocked: { $sum: { $cond: ['$isBlocked', 1, 0] } },
                    verified: { $sum: { $cond: ['$isVerified', 1, 0] } },
                    pendingKyc: { $sum: { $cond: [{ $eq: ['$kycStatus', 'pending'] }, 1, 0] } },
                    submittedKyc: { $sum: { $cond: [{ $eq: ['$kycStatus', 'submitted'] }, 1, 0] } },
                    approvedKyc: { $sum: { $cond: [{ $eq: ['$kycStatus', 'approved'] }, 1, 0] } },
                    rejectedKyc: { $sum: { $cond: [{ $eq: ['$kycStatus', 'rejected'] }, 1, 0] } },
                    totalEarnings: { $sum: '$earnings.total' },
                    totalDeliveries: { $sum: '$stats.totalDeliveries' },
                },
            },
        ]);

        const result = stats[0] || {
            total: 0,
            active: 0,
            online: 0,
            blocked: 0,
            verified: 0,
            pendingKyc: 0,
            submittedKyc: 0,
            approvedKyc: 0,
            rejectedKyc: 0,
            totalEarnings: 0,
            totalDeliveries: 0,
        };

        res.json({
            success: true,
            response: result,
        });
    } catch (error) {
        console.error('Get delivery partner stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update delivery partner earnings (admin adjustment)
// @route   PUT /api/admin/delivery-partners/:id/earnings
// @access  Private (Admin)
const updateDeliveryPartnerEarnings = async (req, res) => {
    try {
        const { amount, type, reason } = req.body;

        if (!amount || !type) {
            return res.status(400).json({ success: false, message: 'Amount and type are required' });
        }

        const partner = await DeliveryPartner.findById(req.params.id);

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Delivery partner not found' });
        }

        if (type === 'add') {
            partner.earnings.total += amount;
        } else if (type === 'deduct') {
            partner.earnings.total = Math.max(0, partner.earnings.total - amount);
        } else if (type === 'set') {
            partner.earnings.total = Math.max(0, amount);
        }

        await partner.save();

        res.json({
            success: true,
            message: 'Earnings updated successfully',
            response: {
                earnings: partner.earnings,
            },
        });
    } catch (error) {
        console.error('Update delivery partner earnings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// =====================
// ORDER MANAGEMENT
// =====================

// @desc    Get all orders with pagination and filters
// @route   GET /api/admin/orders
// @access  Private (Admin)
const getOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        const paymentMethod = req.query.paymentMethod || 'all';
        const dateFrom = req.query.dateFrom;
        const dateTo = req.query.dateTo;

        const skip = (page - 1) * limit;

        // Build query - optimized with indexed fields
        const query = {};

        if (search) {
            query.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'shippingAddress.name': { $regex: search, $options: 'i' } },
                { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
            ];
        }

        if (status !== 'all') {
            query.status = status;
        }

        if (paymentMethod !== 'all') {
            query.paymentMethod = paymentMethod;
        }

        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
            if (dateTo) query.createdAt.$lte = new Date(dateTo + 'T23:59:59.999Z');
        }

        // Use Promise.all for parallel execution - O(1) for both operations
        const [orders, total] = await Promise.all([
            Order.find(query)
                .select('orderNumber user shippingAddress items total status paymentMethod createdAt deliveredAt estimatedDeliveryTime')
                .populate('user', 'name phone avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(query),
        ]);

        res.json({
            success: true,
            response: {
                orders,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get order statistics
// @route   GET /api/admin/orders/stats
// @access  Private (Admin)
const getOrderStats = async (req, res) => {
    try {
        // Use MongoDB aggregation for optimal performance - O(n) single pass
        const [stats] = await Order.aggregate([
            {
                $facet: {
                    statusCounts: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    totals: [
                        {
                            $group: {
                                _id: null,
                                totalOrders: { $sum: 1 },
                                totalRevenue: { $sum: '$total' },
                                avgOrderValue: { $avg: '$total' },
                            }
                        }
                    ],
                    todayOrders: [
                        {
                            $match: {
                                createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                            }
                        },
                        { $count: 'count' }
                    ],
                    todayRevenue: [
                        {
                            $match: {
                                createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                            }
                        },
                        { $group: { _id: null, revenue: { $sum: '$total' } } }
                    ]
                }
            }
        ]);

        const statusCounts = {};
        stats.statusCounts.forEach(s => {
            statusCounts[s._id] = s.count;
        });

        res.json({
            success: true,
            response: {
                totalOrders: stats.totals[0]?.totalOrders || 0,
                totalRevenue: stats.totals[0]?.totalRevenue || 0,
                avgOrderValue: Math.round(stats.totals[0]?.avgOrderValue || 0),
                todayOrders: stats.todayOrders[0]?.count || 0,
                todayRevenue: stats.todayRevenue[0]?.revenue || 0,
                pending: statusCounts.pending || 0,
                confirmed: statusCounts.confirmed || 0,
                processing: statusCounts.processing || 0,
                shipped: statusCounts.shipped || 0,
                out_for_delivery: statusCounts.out_for_delivery || 0,
                delivered: statusCounts.delivered || 0,
                cancelled: statusCounts.cancelled || 0,
            },
        });
    } catch (error) {
        console.error('Get order stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get order by ID
// @route   GET /api/admin/orders/:id
// @access  Private (Admin)
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email phone avatar')
            .populate('deliveryPartner', 'name phone avatar vehicleType')
            .lean();

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        res.json({
            success: true,
            response: { order },
        });
    } catch (error) {
        console.error('Get order by ID error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.status = status;

        // Add to timeline
        order.timeline.push({
            status,
            date: new Date(),
            completed: true,
        });

        // Set delivered date if delivered
        if (status === 'delivered') {
            order.deliveredAt = new Date();
        }

        await order.save();

        res.json({
            success: true,
            message: 'Order status updated successfully',
            response: { order },
        });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Assign delivery partner to order
// @route   PUT /api/admin/orders/:id/assign
// @access  Private (Admin)
const assignDeliveryPartner = async (req, res) => {
    try {
        const { deliveryPartnerId } = req.body;

        const [order, partner] = await Promise.all([
            Order.findById(req.params.id),
            DeliveryPartner.findById(deliveryPartnerId),
        ]);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Delivery partner not found' });
        }

        order.deliveryPartner = deliveryPartnerId;
        await order.save();

        res.json({
            success: true,
            message: 'Delivery partner assigned successfully',
            response: { order },
        });
    } catch (error) {
        console.error('Assign delivery partner error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// =====================
// COUPON MANAGEMENT
// =====================

// @desc    Get all coupons with pagination and filters
// @route   GET /api/admin/coupons
// @access  Private (Admin)
const getCoupons = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        const discountType = req.query.discountType || 'all';

        const skip = (page - 1) * limit;
        const now = new Date();

        // Build query - optimized with indexed fields
        const query = {};

        if (search) {
            query.$or = [
                { code: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        if (status === 'active') {
            query.isActive = true;
            query.validUntil = { $gte: now };
        } else if (status === 'inactive') {
            query.isActive = false;
        } else if (status === 'expired') {
            query.validUntil = { $lt: now };
        }

        if (discountType !== 'all') {
            query.discountType = discountType;
        }

        // Use Promise.all for parallel execution
        const [coupons, total] = await Promise.all([
            Coupon.find(query)
                .select('code discountType discountValue minOrderValue maxDiscount usageLimit usedCount validFrom validUntil isActive description createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Coupon.countDocuments(query),
        ]);

        res.json({
            success: true,
            response: {
                coupons,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Get coupons error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get coupon statistics
// @route   GET /api/admin/coupons/stats
// @access  Private (Admin)
const getCouponStats = async (req, res) => {
    try {
        const now = new Date();

        // Use MongoDB aggregation for optimal performance - O(n) single pass
        const [stats] = await Coupon.aggregate([
            {
                $facet: {
                    total: [{ $count: 'count' }],
                    active: [
                        { $match: { isActive: true, validUntil: { $gte: now } } },
                        { $count: 'count' }
                    ],
                    expired: [
                        { $match: { validUntil: { $lt: now } } },
                        { $count: 'count' }
                    ],
                    totalUsage: [
                        { $group: { _id: null, total: { $sum: '$usedCount' } } }
                    ],
                    byType: [
                        { $group: { _id: '$discountType', count: { $sum: 1 } } }
                    ]
                }
            }
        ]);

        const typeStats = {};
        stats.byType.forEach(t => {
            typeStats[t._id] = t.count;
        });

        res.json({
            success: true,
            response: {
                totalCoupons: stats.total[0]?.count || 0,
                activeCoupons: stats.active[0]?.count || 0,
                expiredCoupons: stats.expired[0]?.count || 0,
                totalUsage: stats.totalUsage[0]?.total || 0,
                percentageCoupons: typeStats.percentage || 0,
                fixedCoupons: typeStats.fixed || 0,
            },
        });
    } catch (error) {
        console.error('Get coupon stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get coupon by ID
// @route   GET /api/admin/coupons/:id
// @access  Private (Admin)
const getCouponById = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id).lean();

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        res.json({
            success: true,
            response: { coupon },
        });
    } catch (error) {
        console.error('Get coupon by ID error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create coupon
// @route   POST /api/admin/coupons
// @access  Private (Admin)
const createCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, validFrom, validUntil, description } = req.body;

        if (!code || !discountType || !discountValue || !validUntil) {
            return res.status(400).json({ success: false, message: 'Required fields missing' });
        }

        // Check if coupon code already exists
        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            minOrderValue: minOrderValue || 0,
            maxDiscount: maxDiscount || null,
            usageLimit: usageLimit || null,
            validFrom: validFrom || new Date(),
            validUntil,
            description: description || '',
        });

        res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            response: { coupon },
        });
    } catch (error) {
        console.error('Create coupon error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update coupon
// @route   PUT /api/admin/coupons/:id
// @access  Private (Admin)
const updateCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, minOrderValue, maxDiscount, usageLimit, validFrom, validUntil, description, isActive } = req.body;

        const coupon = await Coupon.findById(req.params.id);

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        // Check if new code already exists (if code is being changed)
        if (code && code.toUpperCase() !== coupon.code) {
            const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
            if (existingCoupon) {
                return res.status(400).json({ success: false, message: 'Coupon code already exists' });
            }
            coupon.code = code.toUpperCase();
        }

        if (discountType) coupon.discountType = discountType;
        if (discountValue !== undefined) coupon.discountValue = discountValue;
        if (minOrderValue !== undefined) coupon.minOrderValue = minOrderValue;
        if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount;
        if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
        if (validFrom) coupon.validFrom = validFrom;
        if (validUntil) coupon.validUntil = validUntil;
        if (description !== undefined) coupon.description = description;
        if (typeof isActive === 'boolean') coupon.isActive = isActive;

        await coupon.save();

        res.json({
            success: true,
            message: 'Coupon updated successfully',
            response: { coupon },
        });
    } catch (error) {
        console.error('Update coupon error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete coupon
// @route   DELETE /api/admin/coupons/:id
// @access  Private (Admin)
const deleteCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        await coupon.deleteOne();

        res.json({
            success: true,
            message: 'Coupon deleted successfully',
            response: { id: req.params.id },
        });
    } catch (error) {
        console.error('Delete coupon error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Toggle coupon status
// @route   PUT /api/admin/coupons/:id/toggle
// @access  Private (Admin)
const toggleCouponStatus = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);

        if (!coupon) {
            return res.status(404).json({ success: false, message: 'Coupon not found' });
        }

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        res.json({
            success: true,
            message: coupon.isActive ? 'Coupon activated' : 'Coupon deactivated',
            response: { coupon },
        });
    } catch (error) {
        console.error('Toggle coupon status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get all products with pagination and filters
// @route   GET /api/admin/products
// @access  Private (Admin)
const getProductsAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        const category = req.query.category || '';
        const trending = req.query.trending || '';
        const fashionPick = req.query.fashionPick || '';
        const minPrice = parseFloat(req.query.minPrice) || 0;
        const maxPrice = parseFloat(req.query.maxPrice) || Infinity;

        const skip = (page - 1) * limit;

        // Build query
        const query = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { badge: { $regex: search, $options: 'i' } },
            ];
        }

        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        if (category) {
            query.category = category;
        }

        if (trending === 'true') {
            query.isTrending = true;
        } else if (trending === 'false') {
            query.isTrending = false;
        }

        if (fashionPick === 'true') {
            query.isFashionPick = true;
        } else if (fashionPick === 'false') {
            query.isFashionPick = false;
        }

        if (minPrice > 0 || maxPrice < Infinity) {
            query.price = {};
            if (minPrice > 0) query.price.$gte = minPrice;
            if (maxPrice < Infinity) query.price.$lte = maxPrice;
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('category', 'name color')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Product.countDocuments(query),
        ]);

        res.json({
            success: true,
            response: {
                products,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('Get products admin error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get product by ID
// @route   GET /api/admin/products/:id
// @access  Private (Admin)
const getProductByIdAdmin = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('category', 'name color')
            .lean();

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.json({
            success: true,
            response: { product },
        });
    } catch (error) {
        console.error('Get product by ID error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get product stats
// @route   GET /api/admin/products/stats
// @access  Private (Admin)
const getProductStats = async (req, res) => {
    try {
        const [
            totalProducts,
            activeProducts,
            inactiveProducts,
            trendingProducts,
            fashionPickProducts,
        ] = await Promise.all([
            Product.countDocuments(),
            Product.countDocuments({ isActive: true }),
            Product.countDocuments({ isActive: false }),
            Product.countDocuments({ isTrending: true, isActive: true }),
            Product.countDocuments({ isFashionPick: true, isActive: true }),
        ]);

        res.json({
            success: true,
            response: {
                totalProducts,
                activeProducts,
                inactiveProducts,
                trendingProducts,
                fashionPickProducts,
            },
        });
    } catch (error) {
        console.error('Get product stats error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Toggle product trending status
// @route   PUT /api/admin/products/:id/trending
// @access  Private (Admin)
const toggleProductTrending = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        product.isTrending = !product.isTrending;
        await product.save();

        res.json({
            success: true,
            message: product.isTrending ? 'Added to Trending Now' : 'Removed from Trending Now',
            response: { product },
        });
    } catch (error) {
        console.error('Toggle product trending error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Toggle product fashion pick status
// @route   PUT /api/admin/products/:id/fashion-pick
// @access  Private (Admin)
const toggleProductFashionPick = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        product.isFashionPick = !product.isFashionPick;
        await product.save();

        res.json({
            success: true,
            message: product.isFashionPick ? 'Added to Fashion Picks' : 'Removed from Fashion Picks',
            response: { product },
        });
    } catch (error) {
        console.error('Toggle product fashion pick error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Toggle product active status
// @route   PUT /api/admin/products/:id/toggle
// @access  Private (Admin)
const toggleProductStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        product.isActive = !product.isActive;
        await product.save();

        res.json({
            success: true,
            message: product.isActive ? 'Product activated' : 'Product deactivated',
            response: { product },
        });
    } catch (error) {
        console.error('Toggle product status error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete product
// @route   DELETE /api/admin/products/:id
// @access  Private (Admin)
const deleteProductAdmin = async (req, res) => {
    try {
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
        console.error('Delete product admin error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    adminLogin,
    getAdminProfile,
    setupDefaultAdmin,
    getUsers,
    getUserById,
    toggleUserBlock,
    getDashboardStats,
    getDashboardAnalytics,
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    getBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    reorderBanners,
    getDeliveryPartners,
    getDeliveryPartnerById,
    toggleDeliveryPartnerBlock,
    updateDeliveryPartnerKYC,
    toggleDeliveryPartnerActive,
    getDeliveryPartnerStats,
    updateDeliveryPartnerEarnings,
    getOrders,
    getOrderStats,
    getOrderById,
    updateOrderStatus,
    assignDeliveryPartner,
    getCoupons,
    getCouponStats,
    getCouponById,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    toggleCouponStatus,
    updateAdminProfile,
    updateAdminPassword,
    getAdminActivity,
    // Product admin functions
    getProductsAdmin,
    getProductByIdAdmin,
    getProductStats,
    toggleProductTrending,
    toggleProductFashionPick,
    toggleProductStatus,
    deleteProductAdmin,
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private (Admin)
async function updateAdminProfile(req, res) {
    try {
        const { name, email, avatar } = req.body;
        const admin = await Admin.findById(req.adminId);

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        if (name) admin.name = name;
        if (email) {
            const existingAdmin = await Admin.findOne({ email: email.toLowerCase(), _id: { $ne: req.adminId } });
            if (existingAdmin) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
            admin.email = email.toLowerCase();
        }
        if (avatar !== undefined) admin.avatar = avatar;

        await admin.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            response: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                avatar: admin.avatar,
                role: admin.role,
            },
        });
    } catch (error) {
        console.error('Update admin profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// @desc    Update admin password
// @route   PUT /api/admin/password
// @access  Private (Admin)
async function updateAdminPassword(req, res) {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
        }

        const admin = await Admin.findById(req.adminId);

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        const isMatch = await admin.comparePassword(currentPassword);

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        admin.password = newPassword;
        await admin.save();

        res.json({
            success: true,
            message: 'Password updated successfully',
        });
    } catch (error) {
        console.error('Update admin password error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// @desc    Get admin activity/stats
// @route   GET /api/admin/activity
// @access  Private (Admin)
async function getAdminActivity(req, res) {
    try {
        const admin = await Admin.findById(req.adminId).select('name email avatar role createdAt updatedAt').lean();

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        // Get activity stats - count of actions performed
        const [
            totalOrders,
            totalUsers,
            totalCoupons,
            totalCategories,
            totalBanners,
            totalDeliveryPartners,
        ] = await Promise.all([
            Order.countDocuments(),
            User.countDocuments(),
            Coupon.countDocuments(),
            Category.countDocuments(),
            Banner.countDocuments(),
            DeliveryPartner.countDocuments(),
        ]);

        res.json({
            success: true,
            response: {
                admin,
                activity: {
                    lastLogin: admin.updatedAt,
                    accountCreated: admin.createdAt,
                    stats: {
                        totalOrders,
                        totalUsers,
                        totalCoupons,
                        totalCategories,
                        totalBanners,
                        totalDeliveryPartners,
                    },
                },
            },
        });
    } catch (error) {
        console.error('Get admin activity error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
