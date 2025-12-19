const User = require('../models/User');

// @desc    Seed sample users
// @route   GET /api/seed/users
// @access  Public
const seedUsers = async (req, res) => {
    try {
        const sampleUsers = [
            {
                name: 'Rahul Sharma',
                email: 'rahul@example.com',
                phone: '+919876543210',
                avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
                isBlocked: false,
                memberSince: new Date('2024-01-15T10:30:00.000Z'),
            },
            {
                name: 'Priya Patel',
                email: 'priya@example.com',
                phone: '+919876543211',
                avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=200',
                isBlocked: false,
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

// @desc    Seed all data
// @route   GET /api/seed/all
// @access  Public
const seedAll = async (req, res) => {
    try {
        // Seed users
        const sampleUser = {
            name: 'Rahul Sharma',
            email: 'rahul@example.com',
            phone: '+919876543210',
            avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200',
            isBlocked: false,
            memberSince: new Date('2024-01-15T10:30:00.000Z'),
        };

        await User.findOneAndUpdate(
            { phone: sampleUser.phone },
            sampleUser,
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: 'All data seeded successfully',
            response: {
                users: 1,
            },
        });
    } catch (error) {
        console.error('Seed all error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    seedUsers,
    seedAll,
};
