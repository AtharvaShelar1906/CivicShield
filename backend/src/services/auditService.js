const prisma = require('../config/prisma');

/**
 * Creates an immutable audit log entry in the database.
 * Never logs sensitive fields such as passwords or JWT tokens.
 *
 * @param {Object} params
 * @param {string|null} params.userId - ID of the user performing the action (if authenticated)
 * @param {string} params.action - High-level action name (e.g. LOGIN_SUCCESS, CITIZEN_REGISTERED)
 * @param {string} params.entityType - Target entity type (e.g. User, Grievance, System)
 * @param {string|null} params.entityId - Primary key of the affected entity
 * @param {Object|null} params.details - Additional structured context (JSON-serializable)
 * @param {string|null} params.ipAddress - Client IP address
 */
async function logAuditEvent({ userId = null, action, entityType, entityId = null, details = null, ipAddress = null }) {
  try {
    // Sanitize details: ensure no password or token fields are accidentally recorded
    let sanitizedDetails = details;
    if (sanitizedDetails && typeof sanitizedDetails === 'object') {
      sanitizedDetails = { ...sanitizedDetails };
      delete sanitizedDetails.password;
      delete sanitizedDetails.passwordHash;
      delete sanitizedDetails.token;
      delete sanitizedDetails.jwt;
      delete sanitizedDetails.authorization;
    }

    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        details: sanitizedDetails,
        ipAddress: ipAddress ? String(ipAddress).substring(0, 45) : null
      }
    });
  } catch (error) {
    // Audit log failure should be logged to stderr but not break primary user transaction
    console.error(`[AuditLog Error] Failed to write audit log for action "${action}":`, error.message);
    return null;
  }
}

module.exports = {
  logAuditEvent
};
