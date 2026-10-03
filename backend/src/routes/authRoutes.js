const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  register,
  login,
  getMe,
  testCitizen,
  testAuthority,
  testAdmin
} = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Dedicated rate limiter for authentication attempts (prevents credential stuffing)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

// Public authentication routes
router.post('/register', register);
router.post('/login', loginLimiter, login);

// Protected user routes
router.get('/me', authenticate, getMe);

// Role verification test endpoints for Phase 3
router.get('/test/citizen', authenticate, requireRole('CITIZEN'), testCitizen);
router.get('/test/authority', authenticate, requireRole('AUTHORITY', 'ADMIN'), testAuthority);
router.get('/test/admin', authenticate, requireRole('ADMIN'), testAdmin);

module.exports = router;
