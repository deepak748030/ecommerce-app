const express = require('express');
const router = express.Router();
const {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
} = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');

// All routes are protected
router.get('/', verifyToken, getNotifications);
router.put('/read-all', verifyToken, markAllAsRead);
router.put('/:id/read', verifyToken, markAsRead);
router.delete('/all', verifyToken, deleteAllNotifications);
router.delete('/:id', verifyToken, deleteNotification);

module.exports = router;
