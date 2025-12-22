const Admin = require('../models/Admin');
const User = require('../models/User');
const Category = require('../models/Category');
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
                .select('-expoPushToken -notificationSettings -wallet')
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
        const user = await User.findById(req.params.id).select('-expoPushToken -notificationSettings').lean();

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

        const [totalUsers, blockedUsers] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ isBlocked: true }),
        ]);

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

        const periodUsers = await User.countDocuments({ createdAt: { $gte: startDate } });

        // Generate chart data
        const userGrowth = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const count = await User.countDocuments({
                createdAt: { $gte: monthStart, $lte: monthEnd }
            });

            userGrowth.push({
                name: monthNames[date.getMonth()],
                users: count,
                vendors: 0,
            });
        }

        res.json({
            success: true,
            response: {
                overview: {
                    totalUsers,
                    activeUsers: totalUsers - blockedUsers,
                    blockedUsers,
                    totalVendors: 0,
                    activeVendors: 0,
                    blockedVendors: 0,
                    pendingKYC: 0,
                    verifiedVendors: 0,
                    totalBookings: 0,
                    pendingBookings: 0,
                    confirmedBookings: 0,
                    completedBookings: 0,
                    cancelledBookings: 0,
                    totalRevenue: 0,
                    totalEvents: 0,
                    activeEvents: 0,
                    featuredEvents: 0,
                    inactiveEvents: 0,
                },
                periodStats: {
                    users: periodUsers,
                    vendors: 0,
                    bookings: 0,
                    events: 0,
                    revenue: 0,
                    filter,
                },
                charts: {
                    userGrowth,
                    bookingStatusDistribution: [
                        { name: 'Pending', value: 0, color: '#f59e0b' },
                        { name: 'Confirmed', value: 0, color: '#3b82f6' },
                        { name: 'Completed', value: 0, color: '#22c55e' },
                        { name: 'Cancelled', value: 0, color: '#ef4444' },
                    ],
                    vendorKycDistribution: [
                        { name: 'Verified', value: 0, color: '#22c55e' },
                        { name: 'Pending', value: 0, color: '#f59e0b' },
                        { name: 'Rejected', value: 0, color: '#ef4444' },
                    ],
                    revenueTrend: userGrowth.map(item => ({ name: item.name, revenue: 0 })),
                    bookingsTrend: userGrowth.map(item => ({ name: item.name, bookings: 0 })),
                    eventsTrend: userGrowth.map(item => ({ name: item.name, events: 0 })),
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

        const query = {};

        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        const [categories, total] = await Promise.all([
            Category.find(query)
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
};
