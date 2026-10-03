const express = require('express');
const {
  getAdminMetrics,
  listUsers,
  updateUserStatus,
  getAuditLogs
} = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Strict security: All administrative endpoints require an active ADMIN session
router.use(authenticate, requireRole('ADMIN'));

// 1. System governance metrics
router.get('/metrics', getAdminMetrics);

// 2. User registry management
router.get('/users', listUsers);
router.patch('/users/:id/status', updateUserStatus);

// 3. System audit trail inspection
router.get('/audit-logs', getAuditLogs);

module.exports = router;
