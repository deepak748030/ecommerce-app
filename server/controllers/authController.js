const User = require('../models/User');
const Otp = require('../models/Otp');
const Address = require('../models/Address');
const Order = require('../models/Order');
const WalletTransaction = require('../models/WalletTransaction');
const Notification = require('../models/Notification');
const { generateToken } = require('../middleware/auth');

// @desc    Send OTP to phone (Login)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        // Store OTP (hardcoded 123456 for development)
        await Otp.findOneAndUpdate(
            { phone },
            { phone, otp: '123456', expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
            { upsert: true, new: true }
        );

        const existingUser = await User.findOne({ phone });

        res.json({
            success: true,
            message: 'OTP sent successfully',
            response: {
                phone,
                isNewUser: !existingUser,
                isBlocked: existingUser?.isBlocked || false,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Verify OTP and login/register
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
    try {
        const { phone, otp, expoPushToken } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
        }

        const storedOtp = await Otp.findOne({ phone });

        // Check OTP (always accept 123456 for development)
        if (otp !== '123456' && (!storedOtp || storedOtp.otp !== otp || new Date() > storedOtp.expiresAt)) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Clear OTP
        await Otp.deleteOne({ phone });

        // Find or create user
        let user = await User.findOne({ phone });
        const isNewUser = !user;

        if (!user) {
            user = await User.create({
                phone,
                expoPushToken: expoPushToken || '',
            });
        } else if (expoPushToken) {
            user.expoPushToken = expoPushToken;
            await user.save();
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: isNewUser ? 'User registered successfully' : 'Login successful',
            response: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    avatar: user.avatar,
                    isBlocked: user.isBlocked,
                    memberSince: user.memberSince,
                },
                isNewUser,
            },
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOtp = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        await Otp.findOneAndUpdate(
            { phone },
            { phone, otp: '123456', expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: 'OTP resent successfully',
            response: {
                phone,
                otpSent: true,
            },
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Register new user with profile
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
    try {
        const { name, email, phone, avatar, expoPushToken } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        // Validate base64 image if provided
        if (avatar && avatar.startsWith('data:image')) {
            // Check size - Vercel limit is ~4.5MB payload
            const base64Length = avatar.length * 0.75; // Approximate byte size
            if (base64Length > 4 * 1024 * 1024) { // 4MB limit for image
                return res.status(400).json({
                    success: false,
                    message: 'Image too large. Please use an image smaller than 4MB.'
                });
            }
        }

        const existingUser = await User.findOne({ phone });

        if (existingUser) {
            existingUser.name = name || existingUser.name;
            existingUser.email = email || existingUser.email;
            existingUser.avatar = avatar || existingUser.avatar;
            if (expoPushToken) {
                existingUser.expoPushToken = expoPushToken;
            }
            await existingUser.save();

            return res.json({
                success: true,
                message: 'Profile updated',
                response: {
                    phone,
                    isNewUser: false,
                },
            });
        }

        await Otp.findOneAndUpdate(
            { phone },
            { phone, otp: '123456', expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: 'OTP sent for registration',
            response: {
                phone,
                isNewUser: true,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = req.user;

        res.json({
            success: true,
            response: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                isBlocked: user.isBlocked,
                memberSince: user.memberSince,
            },
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const user = req.user;
        const { name, email, avatar } = req.body;

        // Validate base64 image if provided
        if (avatar && avatar.startsWith('data:image')) {
            const base64Length = avatar.length * 0.75;
            if (base64Length > 4 * 1024 * 1024) {
                return res.status(400).json({
                    success: false,
                    message: 'Image too large. Please use an image smaller than 4MB.'
                });
            }
        }

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;
        if (avatar !== undefined) user.avatar = avatar;

        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            response: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                isBlocked: user.isBlocked,
                memberSince: user.memberSince,
            },
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update push token
// @route   PUT /api/auth/push-token
// @access  Private
const updatePushToken = async (req, res) => {
    try {
        const user = req.user;
        const { expoPushToken } = req.body;

        user.expoPushToken = expoPushToken || '';
        await user.save();

        res.json({
            success: true,
            response: {
                tokenUpdated: true,
                isBlocked: user.isBlocked,
            },
        });
    } catch (error) {
        console.error('Update push token error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get notification settings
// @route   GET /api/auth/notification-settings
// @access  Private
const getNotificationSettings = async (req, res) => {
    try {
        const user = req.user;

        res.json({
            success: true,
            response: {
                pushEnabled: user.notificationSettings?.pushEnabled ?? true,
                orderUpdates: user.notificationSettings?.orderUpdates ?? true,
                promotions: user.notificationSettings?.promotions ?? false,
            },
        });
    } catch (error) {
        console.error('Get notification settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update notification settings
// @route   PUT /api/auth/notification-settings
// @access  Private
const updateNotificationSettings = async (req, res) => {
    try {
        const user = req.user;
        const { pushEnabled, orderUpdates, promotions } = req.body;

        if (!user.notificationSettings) {
            user.notificationSettings = {};
        }

        if (typeof pushEnabled === 'boolean') {
            user.notificationSettings.pushEnabled = pushEnabled;
        }
        if (typeof orderUpdates === 'boolean') {
            user.notificationSettings.orderUpdates = orderUpdates;
        }
        if (typeof promotions === 'boolean') {
            user.notificationSettings.promotions = promotions;
        }

        await user.save();

        res.json({
            success: true,
            message: 'Notification settings updated',
            response: {
                pushEnabled: user.notificationSettings.pushEnabled,
                orderUpdates: user.notificationSettings.orderUpdates,
                promotions: user.notificationSettings.promotions,
            },
        });
    } catch (error) {
        console.error('Update notification settings error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
    try {
        const user = req.user;
        user.expoPushToken = '';
        await user.save();

        res.json({
            success: true,
            response: {
                loggedOut: true,
            },
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Send OTP for account deletion
// @route   POST /api/auth/delete-account/send-otp
// @access  Public
const sendDeleteOtp = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const existingUser = await User.findOne({ phone });

        if (!existingUser) {
            return res.json({
                success: true,
                message: 'No account found',
                response: {
                    phone,
                    userExists: false,
                },
            });
        }

        // Store OTP (hardcoded 123456 for development)
        await Otp.findOneAndUpdate(
            { phone },
            { phone, otp: '123456', expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
            { upsert: true, new: true }
        );

        res.json({
            success: true,
            message: 'OTP sent successfully',
            response: {
                phone,
                userExists: true,
            },
        });
    } catch (error) {
        console.error('Send delete OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Verify OTP for account deletion
// @route   POST /api/auth/delete-account/verify-otp
// @access  Public
const verifyDeleteOtp = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
        }

        const storedOtp = await Otp.findOne({ phone });

        // Check OTP (always accept 123456 for development)
        if (otp !== '123456' && (!storedOtp || storedOtp.otp !== otp || new Date() > storedOtp.expiresAt)) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        res.json({
            success: true,
            message: 'OTP verified successfully',
            response: {
                phone,
                verified: true,
            },
        });
    } catch (error) {
        console.error('Verify delete OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Confirm and delete account
// @route   POST /api/auth/delete-account/confirm
// @access  Public
const confirmDeleteAccount = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Delete all related data
        const userId = user._id;

        // Delete addresses
        await Address.deleteMany({ user: userId });

        // Delete wallet transactions
        await WalletTransaction.deleteMany({ user: userId });

        // Delete notifications
        await Notification.deleteMany({ user: userId });

        // Clear OTP
        await Otp.deleteOne({ phone });

        // Finally delete the user
        await User.findByIdAndDelete(userId);

        console.log(`Account deleted for phone: ${phone}`);

        res.json({
            success: true,
            message: 'Account deleted successfully',
            response: {
                deleted: true,
            },
        });
    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    login,
    verifyOtp,
    resendOtp,
    register,
    getMe,
    updateProfile,
    updatePushToken,
    getNotificationSettings,
    updateNotificationSettings,
    logout,
    sendDeleteOtp,
    verifyDeleteOtp,
    confirmDeleteAccount,
};
