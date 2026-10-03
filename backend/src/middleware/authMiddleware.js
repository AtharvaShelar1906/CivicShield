const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

/**
 * Middleware: Verifies Bearer JWT and attaches authenticated user to request.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Missing or malformed Bearer token.'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required. Token is empty.'
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[Auth Error] JWT_SECRET environment variable is not defined.');
      return res.status(500).json({
        status: 'error',
        message: 'Server configuration error.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Token expired. Please log in again.'
        });
      }
      return res.status(401).json({
        status: 'error',
        message: 'Invalid authentication token.'
      });
    }

    // Verify user exists in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User account not found or has been revoked.'
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('[Auth Middleware Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server authentication error.'
    });
  }
}

/**
 * Middleware factory: Enforces role-based authorization.
 * Supports single role or multiple permitted roles:
 * Example: requireRole('ADMIN') or requireRole('AUTHORITY', 'ADMIN')
 */
function requireRole(...roles) {
  const allowedRoles = roles.flat();

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] privileges.`
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  requireRole
};
