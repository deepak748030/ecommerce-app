const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token for admin
const generateAdminToken = (adminId) => {
    return jwt.sign({ adminId, type: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
};

// Verify admin JWT token middleware
const verifyAdminToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.type !== 'admin') {
            return res.status(401).json({ success: false, message: 'Invalid admin token' });
        }

        const admin = await Admin.findById(decoded.adminId).select('-password');

        if (!admin) {
            return res.status(401).json({ success: false, message: 'Admin not found' });
        }

        if (!admin.isActive) {
            return res.status(401).json({ success: false, message: 'Admin account is deactivated' });
        }

        req.adminId = decoded.adminId;
        req.admin = admin;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

// Check if admin has required role
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(401).json({ success: false, message: 'Not authenticated' });
        }

        if (!roles.includes(req.admin.role)) {
            return res.status(403).json({ success: false, message: 'Insufficient permissions' });
        }

        next();
    };
};

module.exports = { generateAdminToken, verifyAdminToken, requireRole };
