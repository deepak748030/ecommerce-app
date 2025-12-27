const User = require('../models/User');
const Otp = require('../models/Otp');
const Address = require('../models/Address');
const Order = require('../models/Order');
const WalletTransaction = require('../models/WalletTransaction');
const Notification = require('../models/Notification');
const { generateToken } = require('../middleware/auth');
const otpConfig = require('../config/otpConfig');
const { uploadProfileImage, isBase64Image, isCloudinaryConfigured } = require('../services/cloudinaryService');

// @desc    Send OTP to phone (Login)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { phone } = req.body;

        if (!phone) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        // Generate OTP using config
        const otp = otpConfig.generateOtp();
        const expiresAt = otpConfig.getExpiryDate();

        await Otp.findOneAndUpdate(
            { phone },
            { phone, otp, expiresAt },
            { upsert: true, new: true }
        );

        // Check for existing user (exclude soft-deleted users within 7 days)
        const existingUser = await User.findOne({
            phone,
            $or: [
                { isDeleted: { $ne: true } },
                { isDeleted: true, scheduledDeletionDate: { $lte: new Date() } }
            ]
        });

        // Check if user is in deletion period
        const deletedUser = await User.findOne({
            phone,
            isDeleted: true,
            scheduledDeletionDate: { $gt: new Date() }
        });

        if (deletedUser) {
            const daysRemaining = Math.ceil((deletedUser.scheduledDeletionDate - new Date()) / (1000 * 60 * 60 * 24));
            return res.status(400).json({
                success: false,
                message: `This account is scheduled for deletion. You can register again after ${daysRemaining} day(s).`,
                response: {
                    phone,
                    isDeleted: true,
                    daysRemaining,
                }
            });
        }

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

        // Verify OTP using config
        if (!otpConfig.verifyOtp(otp, storedOtp?.otp, storedOtp?.expiresAt)) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Clear OTP
        await Otp.deleteOne({ phone });

        // Check if user is in deletion period
        const deletedUser = await User.findOne({
            phone,
            isDeleted: true,
            scheduledDeletionDate: { $gt: new Date() }
        });

        if (deletedUser) {
            const daysRemaining = Math.ceil((deletedUser.scheduledDeletionDate - new Date()) / (1000 * 60 * 60 * 24));
            return res.status(400).json({
                success: false,
                message: `This account is scheduled for deletion. You can register again after ${daysRemaining} day(s).`,
            });
        }

        // Check if there's a soft-deleted user past the 7-day period - reactivate it
        const expiredDeletedUser = await User.findOne({
            phone,
            isDeleted: true,
            scheduledDeletionDate: { $lte: new Date() }
        });

        if (expiredDeletedUser) {
            // Permanently delete the old account data so user can re-register fresh
            await Address.deleteMany({ user: expiredDeletedUser._id });
            await WalletTransaction.deleteMany({ user: expiredDeletedUser._id });
            await Notification.deleteMany({ user: expiredDeletedUser._id });
            await User.findByIdAndDelete(expiredDeletedUser._id);
        }

        // Find or create user
        let user = await User.findOne({ phone, isDeleted: { $ne: true } });
        const isNewUser = !user;

        if (!user) {
            user = await User.create({
                phone,
                expoPushToken: expoPushToken || '',
            });
        } else if (expoPushToken) {
            // Update push token at login
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

        const otp = otpConfig.generateOtp();
        const expiresAt = otpConfig.getExpiryDate();

        await Otp.findOneAndUpdate(
            { phone },
            { phone, otp, expiresAt },
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

        const existingUser = await User.findOne({ phone });

        if (existingUser) {
            existingUser.name = name || existingUser.name;
            existingUser.email = email || existingUser.email;

            // Upload avatar to Cloudinary if base64
            if (avatar && isBase64Image(avatar) && isCloudinaryConfigured()) {
                const uploadResult = await uploadProfileImage(avatar, existingUser._id.toString(), 'user');
                if (uploadResult.success) {
                    existingUser.avatar = uploadResult.url;
                } else {
                    console.error('Failed to upload avatar to Cloudinary:', uploadResult.error);
                    // Fall back to storing small images directly if Cloudinary fails
                    const base64Length = avatar.length * 0.75;
                    if (base64Length <= 500 * 1024) { // Only store if < 500KB
                        existingUser.avatar = avatar;
                    }
                }
            } else if (avatar) {
                existingUser.avatar = avatar;
            }

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

        const otp = otpConfig.generateOtp();
        const expiresAt = otpConfig.getExpiryDate();

        await Otp.findOneAndUpdate(
            { phone },
            { phone, otp, expiresAt },
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

        if (name !== undefined) user.name = name;
        if (email !== undefined) user.email = email;

        // Upload avatar to Cloudinary if base64
        if (avatar !== undefined) {
            if (isBase64Image(avatar) && isCloudinaryConfigured()) {
                const uploadResult = await uploadProfileImage(avatar, user._id.toString(), 'user');
                if (uploadResult.success) {
                    user.avatar = uploadResult.url;
                } else {
                    console.error('Failed to upload avatar to Cloudinary:', uploadResult.error);
                    // Fall back to storing small images directly
                    const base64Length = avatar.length * 0.75;
                    if (base64Length <= 500 * 1024) {
                        user.avatar = avatar;
                    }
                }
            } else {
                user.avatar = avatar;
            }
        }

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

        // Initialize settings if not present
        if (!user.notificationSettings) {
            user.notificationSettings = {
                pushEnabled: true,
                orderUpdates: true,
                promotions: false,
            };
            await user.save();
        }

        res.json({
            success: true,
            response: {
                pushEnabled: user.notificationSettings.pushEnabled !== false,
                orderUpdates: user.notificationSettings.orderUpdates !== false,
                promotions: user.notificationSettings.promotions === true,
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

        const otp = otpConfig.generateOtp();
        const expiresAt = otpConfig.getExpiryDate();

        await Otp.findOneAndUpdate(
            { phone },
            { phone, otp, expiresAt },
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

        if (!otpConfig.verifyOtp(otp, storedOtp?.otp, storedOtp?.expiresAt)) {
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

// @desc    Delete user account (soft delete)
// @route   POST /api/auth/delete-account/confirm
// @access  Public
const deleteAccount = async (req, res) => {
    try {
        const { phone, otp } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ success: false, message: 'Phone and OTP are required' });
        }

        const storedOtp = await Otp.findOne({ phone });

        if (!otpConfig.verifyOtp(otp, storedOtp?.otp, storedOtp?.expiresAt)) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        await Otp.deleteOne({ phone });

        const user = await User.findOne({ phone });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Soft delete - schedule for permanent deletion in 7 days
        user.isDeleted = true;
        user.deletedAt = new Date();
        user.scheduledDeletionDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        user.expoPushToken = '';
        await user.save();

        res.json({
            success: true,
            message: 'Account scheduled for deletion. You have 7 days to recover it.',
            response: {
                phone,
                deleted: true,
                scheduledDeletionDate: user.scheduledDeletionDate,
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
    confirmDeleteAccount: deleteAccount,
};
