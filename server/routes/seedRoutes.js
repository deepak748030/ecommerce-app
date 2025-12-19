const express = require('express');
const router = express.Router();
const { seedUsers, seedAll } = require('../controllers/seedController');

// Public seed routes (no auth required)
router.get('/users', seedUsers);
router.get('/all', seedAll);

module.exports = router;
