const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

// Sample Coupons
const sampleCoupons = [
    {
        code: 'WELCOME10',
        discountType: 'percentage',
        discountValue: 10,
        minOrderValue: 100,
        maxDiscount: 500,
        usageLimit: 1000,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        description: 'Get 10% off on your first order',
    },
    {
        code: 'SAVE50',
        discountType: 'fixed',
        discountValue: 50,
        minOrderValue: 300,
        maxDiscount: null,
        usageLimit: 500,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        description: 'Flat ₹50 off on orders above ₹300',
    },
    {
        code: 'FLAT100',
        discountType: 'fixed',
        discountValue: 100,
        minOrderValue: 500,
        maxDiscount: null,
        usageLimit: 200,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
        description: 'Flat ₹100 off on orders above ₹500',
    },
    {
        code: 'SUPER20',
        discountType: 'percentage',
        discountValue: 20,
        minOrderValue: 1000,
        maxDiscount: 1000,
        usageLimit: 100,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        description: 'Get 20% off up to ₹1000 on orders above ₹1000',
    },
];

// Sample Categories
const sampleCategories = [
    { name: 'Fruits', image: 'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=200', color: '#DCFCE7' },
    { name: 'Fashion', image: 'https://images.pexels.com/photos/934070/pexels-photo-934070.jpeg?auto=compress&cs=tinysrgb&w=200', color: '#E0E7FF' },
    { name: 'Weddings', image: 'https://images.pexels.com/photos/1983046/pexels-photo-1983046.jpeg?auto=compress&cs=tinysrgb&w=200', color: '#FCE7F3' },
    { name: 'Birthday Parties', image: 'https://images.pexels.com/photos/1857157/pexels-photo-1857157.jpeg?auto=compress&cs=tinysrgb&w=200', color: '#FEF3C7' },
    { name: 'Corporate Events', image: 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=200', color: '#CFFAFE' },
    { name: 'Concerts & Music', image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=200', color: '#F3E8FF' },
    { name: 'Vegetables', image: 'https://images.pexels.com/photos/2255935/pexels-photo-2255935.jpeg?auto=compress&cs=tinysrgb&w=200', color: '#D1FAE5' },
    { name: 'Electronics', image: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=200', color: '#FEF3C7' },
];

// Sample Products
const sampleProducts = [
    // Fruits
    {
        title: 'Fresh Apples',
        description: 'Premium quality fresh apples sourced directly from Kashmir orchards. Rich in fiber and vitamins.',
        price: 120,
        mrp: 150,
        categoryName: 'Fruits',
        image: 'https://images.pexels.com/photos/1510392/pexels-photo-1510392.jpeg?auto=compress&cs=tinysrgb&w=300',
        images: ['https://images.pexels.com/photos/1510392/pexels-photo-1510392.jpeg?auto=compress&cs=tinysrgb&w=400'],
        badge: '20% OFF',
        location: 'Fresh Market',
        fullLocation: 'Fresh Market, Mumbai',
        rating: 4.8,
        reviews: 234,
        date: 'Available Daily',
        time: '8:00 AM - 10:00 PM',
        services: ['Fresh Quality', 'Same Day Delivery', 'Easy Returns', '100% Organic'],
    },
    {
        title: 'Organic Bananas',
        description: 'Certified organic bananas grown without pesticides. Perfect for smoothies and healthy snacks.',
        price: 60,
        mrp: 80,
        categoryName: 'Fruits',
        image: 'https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=300',
        images: ['https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=400'],
        badge: 'Organic',
        location: 'Farm Fresh',
        fullLocation: 'Farm Fresh Store, Delhi',
        rating: 4.9,
        reviews: 456,
        date: 'Available Daily',
        time: '8:00 AM - 10:00 PM',
        services: ['Certified Organic', 'Farm Fresh', 'No Pesticides', 'Rich in Potassium'],
    },
    {
        title: 'Premium Mangoes',
        description: 'Alphonso mangoes - the king of fruits. Sweet, juicy, and aromatic.',
        price: 250,
        mrp: 300,
        categoryName: 'Fruits',
        image: 'https://images.pexels.com/photos/918643/pexels-photo-918643.jpeg?auto=compress&cs=tinysrgb&w=300',
        images: ['https://images.pexels.com/photos/918643/pexels-photo-918643.jpeg?auto=compress&cs=tinysrgb&w=400'],
        badge: 'Premium',
        location: 'Tropical Store',
        fullLocation: 'Tropical Store, Bangalore',
        rating: 4.7,
        reviews: 189,
        date: 'Seasonal',
        time: '9:00 AM - 9:00 PM',
        services: ['Alphonso Quality', 'Hand Picked', 'Ripened Naturally', 'Export Quality'],
    },
    {
        title: 'Fresh Oranges',
        description: 'Juicy Nagpur oranges packed with Vitamin C. Perfect for fresh juice.',
        price: 90,
        mrp: 110,
        categoryName: 'Fruits',
        image: 'https://images.pexels.com/photos/42059/citrus-diet-food-fresh-42059.jpeg?auto=compress&cs=tinysrgb&w=300',
        images: ['https://images.pexels.com/photos/42059/citrus-diet-food-fresh-42059.jpeg?auto=compress&cs=tinysrgb&w=400'],
        badge: 'Fresh',
        location: 'City Market',
        fullLocation: 'City Market, Pune',
        rating: 4.6,
        reviews: 321,
        date: 'Available Daily',
        time: '8:00 AM - 10:00 PM',
        services: ['Rich in Vitamin C', 'Nagpur Special', 'Fresh Stock', 'Bulk Available'],
    },
    // Fashion
    {
        title: 'Summer T-Shirt',
        description: 'Comfortable cotton t-shirt perfect for summer. Available in multiple colors and sizes.',
        price: 599,
        mrp: 999,
        categoryName: 'Fashion',
        image: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=300',
        images: ['https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400'],
        badge: 'Trending',
        location: 'Fashion Hub',
        fullLocation: 'Fashion Hub, Mumbai',
        rating: 4.5,
        reviews: 567,
        date: 'In Stock',
        time: 'Ships in 2-3 days',
        services: ['100% Cotton', 'Multiple Colors', 'All Sizes', 'Easy Returns'],
    },
    {
        title: 'Denim Jeans',
        description: 'Classic fit denim jeans with premium quality fabric. Comfortable and durable.',
        price: 1299,
        mrp: 1999,
        categoryName: 'Fashion',
        image: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=300',
        images: ['https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400'],
        badge: 'Bestseller',
        location: 'Style Store',
        fullLocation: 'Style Store, Delhi',
        rating: 4.7,
        reviews: 892,
        date: 'In Stock',
        time: 'Ships in 2-3 days',
        services: ['Premium Denim', 'Classic Fit', 'Durable', 'All Waist Sizes'],
    },
    {
        title: 'Sneakers',
        description: 'Trendy sneakers with cushioned sole for maximum comfort. Perfect for daily wear.',
        price: 2499,
        mrp: 3999,
        categoryName: 'Fashion',
        image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300',
        images: ['https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400'],
        badge: 'Hot Deal',
        location: 'Shoe Palace',
        fullLocation: 'Shoe Palace, Bangalore',
        rating: 4.8,
        reviews: 1234,
        date: 'In Stock',
        time: 'Ships in 1-2 days',
        services: ['Cushioned Sole', 'Breathable', 'All Sizes', 'Lightweight'],
    },
    {
        title: 'Sunglasses',
        description: 'Stylish UV protection sunglasses. Lightweight frame with polarized lenses.',
        price: 799,
        mrp: 1499,
        categoryName: 'Fashion',
        image: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=300',
        images: ['https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=400'],
        badge: 'New',
        location: 'Eye Wear',
        fullLocation: 'Eye Wear Store, Goa',
        rating: 4.4,
        reviews: 445,
        date: 'In Stock',
        time: 'Ships in 2-3 days',
        services: ['UV Protection', 'Polarized Lens', 'Lightweight', 'Unisex'],
    },
    // Weddings
    {
        title: 'Traditional Indian Wedding Package',
        description: 'Complete traditional Indian wedding package with decoration, catering, and photography services.',
        price: 75000,
        mrp: 107000,
        categoryName: 'Weddings',
        image: 'https://images.pexels.com/photos/1983046/pexels-photo-1983046.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
        images: [
            'https://images.pexels.com/photos/1983046/pexels-photo-1983046.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
            'https://images.pexels.com/photos/169193/pexels-photo-169193.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
        ],
        badge: '30% OFF',
        location: 'Mumbai',
        fullLocation: 'Mumbai, Maharashtra, India',
        rating: 4.8,
        reviews: 124,
        date: '2025-02-15',
        time: '6:00 PM - 11:00 PM',
        services: ['Mandap decoration', 'Catering for 500 guests', 'Photography & Videography', 'DJ & Sound system', 'Flower arrangements'],
    },
    {
        title: 'Engagement Ceremony',
        description: 'Beautiful engagement ceremony arrangements with traditional decorations.',
        price: 35000,
        mrp: 45000,
        categoryName: 'Weddings',
        image: 'https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
        images: ['https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=400&h=300'],
        badge: '',
        location: 'Pune',
        fullLocation: 'Pune, Maharashtra, India',
        rating: 4.5,
        reviews: 67,
        date: '2025-03-05',
        time: '5:00 PM - 9:00 PM',
        services: ['Ring ceremony setup', 'Floral decorations', 'Photography', 'Catering', 'Music arrangements'],
    },
    // Birthday Parties
    {
        title: 'Birthday Party Celebration',
        description: 'Fun-filled birthday party package with themes, decorations, and entertainment.',
        price: 25000,
        mrp: 30000,
        categoryName: 'Birthday Parties',
        image: 'https://images.pexels.com/photos/1857157/pexels-photo-1857157.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
        images: [
            'https://images.pexels.com/photos/1857157/pexels-photo-1857157.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
            'https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
        ],
        badge: '₹500 OFF',
        location: 'Delhi',
        fullLocation: 'New Delhi, Delhi, India',
        rating: 4.6,
        reviews: 89,
        date: '2025-01-20',
        time: '4:00 PM - 8:00 PM',
        services: ['Theme decoration', 'Birthday cake', 'Entertainment activities', 'Photo booth setup', 'Party favors'],
    },
    {
        title: 'Kids Birthday Party',
        description: 'Exciting kids birthday party with games, activities, and cartoon themes.',
        price: 18000,
        mrp: 25000,
        categoryName: 'Birthday Parties',
        image: 'https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
        images: ['https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=400&h=300'],
        badge: '',
        location: 'Mumbai',
        fullLocation: 'Mumbai, Maharashtra, India',
        rating: 4.8,
        reviews: 92,
        date: '2025-01-30',
        time: '3:00 PM - 7:00 PM',
        services: ['Cartoon theme decoration', 'Magic show', 'Game activities', 'Birthday cake', 'Return gifts'],
    },
    // Corporate Events
    {
        title: 'Corporate Event Management',
        description: 'Professional corporate event management for conferences, seminars, and team building.',
        price: 50000,
        mrp: 65000,
        categoryName: 'Corporate Events',
        image: 'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
        images: [
            'https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
            'https://images.pexels.com/photos/2422294/pexels-photo-2422294.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
        ],
        badge: 'BUY 1 GET 1',
        location: 'Bangalore',
        fullLocation: 'Bangalore, Karnataka, India',
        rating: 4.7,
        reviews: 156,
        date: '2025-01-25',
        time: '9:00 AM - 6:00 PM',
        services: ['Venue setup', 'AV equipment', 'Catering service', 'Registration management', 'Event coordination'],
    },
    // Concerts & Music
    {
        title: 'Live Music Concert',
        description: 'Experience amazing live music concerts with top artists and performers.',
        price: 15000,
        mrp: 20000,
        categoryName: 'Concerts & Music',
        image: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
        images: [
            'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
            'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=400&h=300',
        ],
        badge: '',
        location: 'Goa',
        fullLocation: 'Panaji, Goa, India',
        rating: 4.9,
        reviews: 201,
        date: '2025-02-10',
        time: '7:00 PM - 12:00 AM',
        services: ['Live band performance', 'Sound & lighting system', 'Stage setup', 'Security arrangements', 'Parking management'],
    },
];

// @desc    Seed sample users
// @route   GET /api/seed/users
// @access  Public
const seedUsers = async (req, res) => {
    try {
        const sampleUsers = [
            {
                name: 'Admin User',
                email: 'admin@bhaojan.com',
                phone: '+919999999999',
                avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200',
                isBlocked: false,
                isAdmin: true,
                memberSince: new Date('2024-01-01T10:30:00.000Z'),
            },
            {
                name: 'Rahul Sharma',
                email: 'rahul@example.com',
                phone: '+919876543210',
                avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
                isBlocked: false,
                isAdmin: false,
                memberSince: new Date('2024-01-15T10:30:00.000Z'),
            },
            {
                name: 'Priya Patel',
                email: 'priya@example.com',
                phone: '+919876543211',
                avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
                isBlocked: false,
                isAdmin: false,
                memberSince: new Date('2024-02-20T14:45:00.000Z'),
            },
        ];

        const createdUsers = [];

        for (const userData of sampleUsers) {
            const user = await User.findOneAndUpdate(
                { phone: userData.phone },
                userData,
                { upsert: true, new: true }
            );
            createdUsers.push(user);
        }

        res.json({
            success: true,
            message: 'Users seeded successfully',
            response: {
                count: createdUsers.length,
                data: createdUsers,
            },
        });
    } catch (error) {
        console.error('Seed users error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Seed categories
// @route   GET /api/seed/categories
// @access  Public
const seedCategories = async (req, res) => {
    try {
        const createdCategories = [];

        for (const catData of sampleCategories) {
            const category = await Category.findOneAndUpdate(
                { name: catData.name },
                catData,
                { upsert: true, new: true }
            );
            createdCategories.push(category);
        }

        res.json({
            success: true,
            message: 'Categories seeded successfully',
            response: {
                count: createdCategories.length,
                data: createdCategories,
            },
        });
    } catch (error) {
        console.error('Seed categories error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Seed products
// @route   GET /api/seed/products
// @access  Public
const seedProducts = async (req, res) => {
    try {
        // First ensure categories exist
        const categoryMap = {};
        for (const catData of sampleCategories) {
            const category = await Category.findOneAndUpdate(
                { name: catData.name },
                catData,
                { upsert: true, new: true }
            );
            categoryMap[catData.name] = category._id;
        }

        const createdProducts = [];

        for (const prodData of sampleProducts) {
            const categoryId = categoryMap[prodData.categoryName];
            if (!categoryId) continue;

            const productData = {
                ...prodData,
                category: categoryId,
            };
            delete productData.categoryName;

            const product = await Product.findOneAndUpdate(
                { title: prodData.title },
                productData,
                { upsert: true, new: true }
            );
            createdProducts.push(product);
        }

        // Update category item counts
        for (const catName in categoryMap) {
            const count = await Product.countDocuments({ category: categoryMap[catName] });
            await Category.findByIdAndUpdate(categoryMap[catName], { itemsCount: count });
        }

        res.json({
            success: true,
            message: 'Products seeded successfully',
            response: {
                count: createdProducts.length,
                data: createdProducts,
            },
        });
    } catch (error) {
        console.error('Seed products error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Seed all data
// @route   GET /api/seed/all
// @access  Public
const seedAll = async (req, res) => {
    try {
        // Seed admin user
        const adminUser = {
            name: 'Admin User',
            email: 'admin@bhaojan.com',
            phone: '+919999999999',
            avatar: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200',
            isBlocked: false,
            isAdmin: true,
            memberSince: new Date('2024-01-01T10:30:00.000Z'),
        };

        await User.findOneAndUpdate(
            { phone: adminUser.phone },
            adminUser,
            { upsert: true, new: true }
        );

        // Seed categories
        const categoryMap = {};
        for (const catData of sampleCategories) {
            const category = await Category.findOneAndUpdate(
                { name: catData.name },
                catData,
                { upsert: true, new: true }
            );
            categoryMap[catData.name] = category._id;
        }

        // Seed products
        let productsCount = 0;
        for (const prodData of sampleProducts) {
            const categoryId = categoryMap[prodData.categoryName];
            if (!categoryId) continue;

            const productData = {
                ...prodData,
                category: categoryId,
            };
            delete productData.categoryName;

            await Product.findOneAndUpdate(
                { title: prodData.title },
                productData,
                { upsert: true, new: true }
            );
            productsCount++;
        }

        // Update category item counts
        for (const catName in categoryMap) {
            const count = await Product.countDocuments({ category: categoryMap[catName] });
            await Category.findByIdAndUpdate(categoryMap[catName], { itemsCount: count });
        }

        // Seed coupons
        let couponsCount = 0;
        for (const couponData of sampleCoupons) {
            await Coupon.findOneAndUpdate(
                { code: couponData.code },
                couponData,
                { upsert: true, new: true }
            );
            couponsCount++;
        }

        res.json({
            success: true,
            message: 'All data seeded successfully',
            response: {
                users: 1,
                categories: sampleCategories.length,
                products: productsCount,
                coupons: couponsCount,
            },
        });
    } catch (error) {
        console.error('Seed all error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Seed coupons
// @route   GET /api/seed/coupons
// @access  Public
const seedCoupons = async (req, res) => {
    try {
        const createdCoupons = [];

        for (const couponData of sampleCoupons) {
            const coupon = await Coupon.findOneAndUpdate(
                { code: couponData.code },
                couponData,
                { upsert: true, new: true }
            );
            createdCoupons.push(coupon);
        }

        res.json({
            success: true,
            message: 'Coupons seeded successfully',
            response: {
                count: createdCoupons.length,
                data: createdCoupons,
            },
        });
    } catch (error) {
        console.error('Seed coupons error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    seedUsers,
    seedCategories,
    seedProducts,
    seedCoupons,
    seedAll,
};
