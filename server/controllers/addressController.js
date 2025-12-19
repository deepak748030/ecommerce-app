const Address = require('../models/Address');

// @desc    Get all addresses for current user
// @route   GET /api/addresses
// @access  Private
exports.getAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 });

        res.json({
            success: true,
            response: {
                count: addresses.length,
                data: addresses,
            },
        });
    } catch (error) {
        console.error('Get addresses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch addresses',
        });
    }
};

// @desc    Get single address
// @route   GET /api/addresses/:id
// @access  Private
exports.getAddress = async (req, res) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        res.json({
            success: true,
            response: address,
        });
    } catch (error) {
        console.error('Get address error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch address',
        });
    }
};

// @desc    Create address
// @route   POST /api/addresses
// @access  Private
exports.createAddress = async (req, res) => {
    try {
        const { type, name, phone, address, city, state, pincode, isDefault } = req.body;

        // If this is the first address or isDefault is true, set it as default
        const addressCount = await Address.countDocuments({ user: req.user._id });
        const shouldBeDefault = addressCount === 0 || isDefault;

        // If setting as default, unset other defaults
        if (shouldBeDefault) {
            await Address.updateMany(
                { user: req.user._id },
                { isDefault: false }
            );
        }

        const newAddress = await Address.create({
            user: req.user._id,
            type,
            name,
            phone,
            address,
            city,
            state: state || '',
            pincode,
            isDefault: shouldBeDefault,
        });

        res.status(201).json({
            success: true,
            response: newAddress,
        });
    } catch (error) {
        console.error('Create address error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create address',
        });
    }
};

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
exports.updateAddress = async (req, res) => {
    try {
        let address = await Address.findOne({ _id: req.params.id, user: req.user._id });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        // If setting as default, unset other defaults
        if (req.body.isDefault) {
            await Address.updateMany(
                { user: req.user._id, _id: { $ne: req.params.id } },
                { isDefault: false }
            );
        }

        address = await Address.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            response: address,
        });
    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update address',
        });
    }
};

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res) => {
    try {
        const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user._id });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        // If deleted address was default, set another as default
        if (address.isDefault) {
            const firstAddress = await Address.findOne({ user: req.user._id });
            if (firstAddress) {
                firstAddress.isDefault = true;
                await firstAddress.save();
            }
        }

        res.json({
            success: true,
            response: { id: req.params.id },
        });
    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete address',
        });
    }
};

// @desc    Set address as default
// @route   PUT /api/addresses/:id/default
// @access  Private
exports.setDefaultAddress = async (req, res) => {
    try {
        const address = await Address.findOne({ _id: req.params.id, user: req.user._id });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found',
            });
        }

        // Unset all other defaults
        await Address.updateMany(
            { user: req.user._id },
            { isDefault: false }
        );

        // Set this as default
        address.isDefault = true;
        await address.save();

        res.json({
            success: true,
            response: address,
        });
    } catch (error) {
        console.error('Set default address error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set default address',
        });
    }
};
