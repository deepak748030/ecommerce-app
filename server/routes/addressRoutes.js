const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
    getAddresses,
    getAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
} = require('../controllers/addressController');

// All routes are protected
router.use(verifyToken);

router.route('/')
    .get(getAddresses)
    .post(createAddress);

router.route('/:id')
    .get(getAddress)
    .put(updateAddress)
    .delete(deleteAddress);

router.put('/:id/default', setDefaultAddress);

module.exports = router;
