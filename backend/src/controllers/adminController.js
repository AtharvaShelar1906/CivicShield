const prisma = require('../config/prisma');
const { logAuditEvent } = require('../services/auditService');
const { isValidUUID } = require('../utils/validators');

/**
 * Helper to safely extract client IP.
 */
function getClientIp(req) {
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return (req.socket && req.socket.remoteAddress) || req.ip || null;
}

/**
 * GET /api/admin/metrics
 * System-wide metrics aggregator for administrator oversight.
 * Access: ADMIN only.
 */
async function getAdminMetrics(req, res) {
  try {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      citizenCount,
      authorityCount,
      adminCount,
      totalGrievances,
      submittedCount,
      underReviewCount,
      assignedCount,
      inProgressCount,
      resolvedCount,
      closedCount,
      rejectedCount,
      highPriorityCount,
      criticalPriorityCount,
      unassignedCount,
      totalAuditLogs
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.user.count({ where: { role: 'CITIZEN' } }),
      prisma.user.count({ where: { role: 'AUTHORITY' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.grievance.count(),
      prisma.grievance.count({ where: { status: 'SUBMITTED' } }),
      prisma.grievance.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.grievance.count({ where: { status: 'ASSIGNED' } }),
      prisma.grievance.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.grievance.count({ where: { status: 'RESOLVED' } }),
      prisma.grievance.count({ where: { status: 'CLOSED' } }),
      prisma.grievance.count({ where: { status: 'REJECTED' } }),
      prisma.grievance.count({ where: { priority: 'HIGH' } }),
      prisma.grievance.count({ where: { priority: 'CRITICAL' } }),
      prisma.grievance.count({ where: { assignedToId: null } }),
      prisma.auditLog.count()
    ]);

    return res.status(200).json({
      status: 'success',
      metrics: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          citizens: citizenCount,
          authorities: authorityCount,
          admins: adminCount
        },
        grievances: {
          total: totalGrievances,
          submitted: submittedCount,
          underReview: underReviewCount,
          assigned: assignedCount,
          inProgress: inProgressCount,
          resolved: resolvedCount,
          closed: closedCount,
          rejected: rejectedCount,
          highPriority: highPriorityCount,
          criticalPriority: criticalPriorityCount,
          unassigned: unassignedCount
        },
        governance: {
          totalAuditLogs
        }
      }
    });
  } catch (error) {
    console.error('[Admin Metrics Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve administrative metrics.'
    });
  }
}

/**
 * GET /api/admin/users
 * Lists all registered users with their active status. Excludes passwordHash.
 * Access: ADMIN only.
 */
async function listUsers(req, res) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            submittedGrievances: true,
            assignedGrievances: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      status: 'success',
      count: users.length,
      users
    });
  } catch (error) {
    console.error('[Admin List Users Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user registry.'
    });
  }
}

/**
 * PATCH /api/admin/users/:id/status
 * Activates or deactivates a user account.
 * Prevents admin from self-deactivation. Logs audit events.
 * Access: ADMIN only.
 */
async function updateUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID format.'
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'Field "isActive" must be a boolean.'
      });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!targetUser) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found.'
      });
    }

    // Safety constraint: Prevent admin from deactivating their own authenticated account
    if (targetUser.id === req.user.id && !isActive) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot deactivate your own administrator account.'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    const clientIp = getClientIp(req);

    // Audit log account activation/deactivation
    await logAuditEvent({
      userId: req.user.id,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: updatedUser.id,
      details: {
        targetUserEmail: updatedUser.email,
        targetUserName: updatedUser.name,
        targetUserRole: updatedUser.role,
        previousState: targetUser.isActive,
        newState: isActive
      },
      ipAddress: clientIp
    });

    return res.status(200).json({
      status: 'success',
      message: `User ${updatedUser.name} has been ${isActive ? 'activated' : 'deactivated'} successfully.`,
      user: updatedUser
    });
  } catch (error) {
    console.error('[Admin Update User Status Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update user status.'
    });
  }
}

/**
 * GET /api/admin/audit-logs
 * Retrieves system audit logs with actor details and optional action/entity filters.
 * Excludes all sensitive tokens, secrets, or password hashes.
 * Access: ADMIN only.
 */
async function getAuditLogs(req, res) {
  try {
    const { action, entityType, limit = 100, offset = 0 } = req.query;

    const where = {};
    if (action && typeof action === 'string') {
      where.action = action.trim();
    }
    if (entityType && typeof entityType === 'string') {
      where.entityType = entityType.trim();
    }

    const take = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const skip = Math.max(parseInt(offset, 10) || 0, 0);

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip
      })
    ]);

    return res.status(200).json({
      status: 'success',
      total,
      count: logs.length,
      limit: take,
      offset: skip,
      logs
    });
  } catch (error) {
    console.error('[Admin Audit Logs Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve system audit logs.'
    });
  }
}

module.exports = {
  getAdminMetrics,
  listUsers,
  updateUserStatus,
  getAuditLogs
};
