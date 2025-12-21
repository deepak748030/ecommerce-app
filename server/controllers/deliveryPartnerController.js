const DeliveryPartner = require('../models/DeliveryPartner');
const Otp = require('../models/Otp');
const { generateToken } = require('../middleware/auth');

// @desc    Send OTP to phone (Login/Signup)
// @route   POST /api/delivery-partner/auth/login
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

        const existingPartner = await DeliveryPartner.findOne({ phone });

        res.json({
            success: true,
            message: 'OTP sent successfully',
            response: {
                phone,
                isNewUser: !existingPartner,
                isProfileComplete: existingPartner?.isProfileComplete || false,
                isBlocked: existingPartner?.isBlocked || false,
            },
        });
    } catch (error) {
        console.error('Delivery Partner Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Verify OTP and login/register
// @route   POST /api/delivery-partner/auth/verify-otp
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

        // Find or create delivery partner
        let partner = await DeliveryPartner.findOne({ phone });
        const isNewUser = !partner;

        if (!partner) {
            partner = await DeliveryPartner.create({
                phone,
                expoPushToken: expoPushToken || '',
            });
        } else if (expoPushToken) {
            partner.expoPushToken = expoPushToken;
            await partner.save();
        }

        const token = generateToken(partner._id);

        res.json({
            success: true,
            message: isNewUser ? 'Partner registered successfully' : 'Login successful',
            response: {
                token,
                partner: {
                    id: partner._id,
                    name: partner.name,
                    phone: partner.phone,
                    avatar: partner.avatar,
                    vehicle: partner.vehicle,
                    isProfileComplete: partner.isProfileComplete,
                    isVerified: partner.isVerified,
                    isBlocked: partner.isBlocked,
                    stats: partner.stats,
                    earnings: partner.earnings,
                    memberSince: partner.memberSince,
                },
                isNewUser,
            },
        });
    } catch (error) {
        console.error('Delivery Partner Verify OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Resend OTP
// @route   POST /api/delivery-partner/auth/resend-otp
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
        console.error('Delivery Partner Resend OTP error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Complete profile with vehicle details
// @route   POST /api/delivery-partner/auth/complete-profile
// @access  Private
const completeProfile = async (req, res) => {
    try {
        const { partnerId, name, vehicleType, vehicleNumber, vehicleModel, vehicleColor } = req.body;

        if (!partnerId) {
            return res.status(400).json({ success: false, message: 'Partner ID is required' });
        }

        const partner = await DeliveryPartner.findById(partnerId);

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        partner.name = name || partner.name;
        partner.vehicle = {
            type: vehicleType || 'bike',
            number: vehicleNumber || '',
            model: vehicleModel || '',
            color: vehicleColor || '',
        };
        partner.isProfileComplete = true;

        await partner.save();

        res.json({
            success: true,
            message: 'Profile completed successfully',
            response: {
                partner: {
                    id: partner._id,
                    name: partner.name,
                    phone: partner.phone,
                    avatar: partner.avatar,
                    vehicle: partner.vehicle,
                    isProfileComplete: partner.isProfileComplete,
                    isVerified: partner.isVerified,
                    isBlocked: partner.isBlocked,
                    stats: partner.stats,
                    earnings: partner.earnings,
                    memberSince: partner.memberSince,
                },
            },
        });
    } catch (error) {
        console.error('Complete Profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Get partner profile
// @route   GET /api/delivery-partner/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const partner = await DeliveryPartner.findById(partnerId);

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        res.json({
            success: true,
            response: {
                id: partner._id,
                name: partner.name,
                phone: partner.phone,
                avatar: partner.avatar,
                vehicle: partner.vehicle,
                isProfileComplete: partner.isProfileComplete,
                isVerified: partner.isVerified,
                isOnline: partner.isOnline,
                isBlocked: partner.isBlocked,
                stats: partner.stats,
                earnings: partner.earnings,
                memberSince: partner.memberSince,
            },
        });
    } catch (error) {
        console.error('Get Partner Profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update partner profile
// @route   PUT /api/delivery-partner/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const { name, avatar, vehicleType, vehicleNumber, vehicleModel, vehicleColor } = req.body;

        const partner = await DeliveryPartner.findById(partnerId);

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        if (name !== undefined) partner.name = name;
        if (avatar !== undefined) partner.avatar = avatar;
        if (vehicleType !== undefined) partner.vehicle.type = vehicleType;
        if (vehicleNumber !== undefined) partner.vehicle.number = vehicleNumber;
        if (vehicleModel !== undefined) partner.vehicle.model = vehicleModel;
        if (vehicleColor !== undefined) partner.vehicle.color = vehicleColor;

        await partner.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            response: {
                id: partner._id,
                name: partner.name,
                phone: partner.phone,
                avatar: partner.avatar,
                vehicle: partner.vehicle,
                isProfileComplete: partner.isProfileComplete,
                isVerified: partner.isVerified,
                isBlocked: partner.isBlocked,
                stats: partner.stats,
                earnings: partner.earnings,
                memberSince: partner.memberSince,
            },
        });
    } catch (error) {
        console.error('Update Partner Profile error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Toggle online status
// @route   PUT /api/delivery-partner/auth/toggle-online
// @access  Private
const toggleOnline = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const partner = await DeliveryPartner.findById(partnerId);

        if (!partner) {
            return res.status(404).json({ success: false, message: 'Partner not found' });
        }

        partner.isOnline = !partner.isOnline;
        await partner.save();

        res.json({
            success: true,
            message: partner.isOnline ? 'You are now online' : 'You are now offline',
            response: {
                isOnline: partner.isOnline,
            },
        });
    } catch (error) {
        console.error('Toggle Online error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Logout partner
// @route   POST /api/delivery-partner/auth/logout
// @access  Private
const logout = async (req, res) => {
    try {
        const partnerId = req.user._id;
        const partner = await DeliveryPartner.findById(partnerId);

        if (partner) {
            partner.expoPushToken = '';
            partner.isOnline = false;
            await partner.save();
        }

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

module.exports = {
    login,
    verifyOtp,
    resendOtp,
    completeProfile,
    getMe,
    updateProfile,
    toggleOnline,
    logout,
};
