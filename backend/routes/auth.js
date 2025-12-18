const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    getMe, 
    forgotPassword, 
    resetPassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', protect, register); // Only admins can register new users
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
