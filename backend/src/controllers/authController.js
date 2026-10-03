const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { logAuditEvent } = require('../services/auditService');

/**
 * Extracts client IP from request headers or socket.
 */
function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || null;
}

/**
 * Strips passwordHash and returns a safe User object.
 */
function toSafeUser(user) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * POST /api/auth/register
 * Registers a new citizen account. Role is strictly hardcoded to CITIZEN.
 */
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
      return res.status(400).json({
        status: 'error',
        message: 'Name is required and must be between 2 and 100 characters.'
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      return res.status(400).json({
        status: 'error',
        message: 'A valid email address is required.'
      });
    }

    // Validate password
    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters long.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check for existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password with bcryptjs
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user (Strictly CITIZEN role, client cannot override)
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: 'CITIZEN'
      }
    });

    const clientIp = getClientIp(req);

    // Audit log registration
    await logAuditEvent({
      userId: newUser.id,
      action: 'CITIZEN_REGISTERED',
      entityType: 'User',
      entityId: newUser.id,
      details: {
        registeredEmail: newUser.email,
        assignedRole: newUser.role
      },
      ipAddress: clientIp
    });

    return res.status(201).json({
      status: 'success',
      message: 'Citizen account registered successfully.',
      user: toSafeUser(newUser)
    });
  } catch (error) {
    console.error('[Registration Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during registration. Please try again later.'
    });
  }
}

/**
 * POST /api/auth/login
 * Authenticates user credentials, generates JWT, and logs audit events.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const clientIp = getClientIp(req);

    // Input presence check
    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Lookup user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    // Verify user and password hash
    let passwordValid = false;
    if (user) {
      passwordValid = await bcrypt.compare(password, user.passwordHash);
    }

    // Security: Generic rejection for non-existent email or wrong password
    if (!user || !passwordValid) {
      // Audit log failed login attempt
      await logAuditEvent({
        userId: user ? user.id : null,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user ? user.id : null,
        details: {
          attemptedEmail: normalizedEmail,
          reason: 'Invalid credentials'
        },
        ipAddress: clientIp
      });

      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password.'
      });
    }

    // Verify account active status
    if (user.isActive === false) {
      await logAuditEvent({
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityType: 'User',
        entityId: user.id,
        details: {
          attemptedEmail: normalizedEmail,
          reason: 'Account deactivated'
        },
        ipAddress: clientIp
      });

      return res.status(403).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('[Login Error] Missing JWT_SECRET environment variable.');
      return res.status(500).json({
        status: 'error',
        message: 'Server configuration error.'
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Audit log successful login
    await logAuditEvent({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityType: 'User',
      entityId: user.id,
      details: {
        role: user.role,
        email: user.email
      },
      ipAddress: clientIp
    });

    return res.status(200).json({
      status: 'success',
      message: 'Login successful.',
      token,
      user: toSafeUser(user)
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred during authentication.'
    });
  }
}

/**
 * GET /api/auth/me
 * Returns authenticated user's profile details.
 */
function getMe(req, res) {
  return res.status(200).json({
    status: 'success',
    user: req.user
  });
}

/**
 * Verification test endpoints for role permissions
 */
function testCitizen(req, res) {
  return res.status(200).json({
    status: 'success',
    message: 'Citizen access verified successfully.',
    user: req.user
  });
}

function testAuthority(req, res) {
  return res.status(200).json({
    status: 'success',
    message: 'Authority access verified successfully.',
    user: req.user
  });
}

function testAdmin(req, res) {
  return res.status(200).json({
    status: 'success',
    message: 'Admin access verified successfully.',
    user: req.user
  });
}

module.exports = {
  register,
  login,
  getMe,
  testCitizen,
  testAuthority,
  testAdmin
};
