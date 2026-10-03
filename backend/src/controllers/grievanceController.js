const axios = require('axios');
const prisma = require('../config/prisma');
const { logAuditEvent } = require('../services/auditService');
const { isValidUUID } = require('../utils/validators');

/**
 * Extracts client IP from request.
 */
function getClientIp(req) {
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return (req.socket && req.socket.remoteAddress) || req.ip || null;
}

// Valid enum values
const VALID_STATUSES = ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

// Baseline workflow transition state machine for authorities
const ALLOWED_STATUS_TRANSITIONS = {
  SUBMITTED: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['ASSIGNED', 'REJECTED'],
  ASSIGNED: ['IN_PROGRESS'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
  REJECTED: []
};

// Safe selector for Prisma queries
const grievanceInclude = {
  category: {
    select: { id: true, name: true, description: true }
  },
  submittedBy: {
    select: { id: true, name: true, email: true, role: true }
  },
  assignedTo: {
    select: { id: true, name: true, email: true, role: true, department: true }
  },
  analysis: {
    select: {
      id: true,
      predictedCategory: true,
      categoryConfidence: true,
      severityScore: true,
      predictedPriority: true,
      isAnomalous: true,
      anomalyReason: true,
      modelVersion: true,
      createdAt: true
    }
  },
  similarAsSource: {
    select: {
      id: true,
      targetGrievanceId: true,
      similarityScore: true,
      targetGrievance: {
        select: { id: true, title: true, status: true, priority: true }
      }
    }
  },
  similarAsTarget: {
    select: {
      id: true,
      sourceGrievanceId: true,
      similarityScore: true,
      sourceGrievance: {
        select: { id: true, title: true, status: true, priority: true }
      }
    }
  }
};

/**
 * POST /api/grievances
 * Submits a new citizen grievance.
 * Automatically attempts advisory AI analysis through the intelligence-service,
 * falling back gracefully if the ML service is temporarily unreachable.
 * Access: CITIZEN only.
 */
async function submitGrievance(req, res) {
  try {
    const { title, description, location } = req.body;

    // Validate title
    if (!title || typeof title !== 'string' || title.trim().length < 5 || title.trim().length > 200) {
      return res.status(400).json({
        status: 'error',
        message: 'Title is required and must be between 5 and 200 characters.'
      });
    }

    // Validate description
    if (!description || typeof description !== 'string' || description.trim().length < 10 || description.trim().length > 3000) {
      return res.status(400).json({
        status: 'error',
        message: 'Description is required and must be between 10 and 3000 characters.'
      });
    }

    // Optional location
    let sanitizedLocation = null;
    if (location && typeof location === 'string') {
      sanitizedLocation = location.trim().substring(0, 255);
    }

    // 1. Create grievance with authoritative defaults
    // Official category remains NULL and official priority remains MEDIUM (AI is advisory only)
    const newGrievance = await prisma.grievance.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        location: sanitizedLocation,
        status: 'SUBMITTED',
        priority: 'MEDIUM',
        submittedById: req.user.id,
        categoryId: null,
        assignedToId: null
      }
    });

    const clientIp = getClientIp(req);

    // Audit log grievance submission
    await logAuditEvent({
      userId: req.user.id,
      action: 'GRIEVANCE_SUBMITTED',
      entityType: 'Grievance',
      entityId: newGrievance.id,
      details: {
        title: newGrievance.title,
        location: newGrievance.location,
        initialStatus: newGrievance.status,
        initialPriority: newGrievance.priority
      },
      ipAddress: clientIp
    });

    // 2. Intelligence Layer Integration (Graceful degradation)
    let analysisResult = null;
    try {
      // Fetch recent candidate grievances for similarity detection (max 50, excluding newly created)
      const existingCandidates = await prisma.grievance.findMany({
        where: { id: { not: newGrievance.id } },
        select: { id: true, title: true, description: true },
        take: 50,
        orderBy: { createdAt: 'desc' }
      });

      const mlServiceUrl = process.env.ML_SERVICE_URL || process.env.INTELLIGENCE_SERVICE_URL || 'http://intelligence-service:8000';
      const analyzeEndpoint = mlServiceUrl.endsWith('/analyze') ? mlServiceUrl : `${mlServiceUrl}/analyze`;
      const mlResponse = await axios.post(
        analyzeEndpoint,
        {
          title: newGrievance.title,
          description: newGrievance.description,
          location: newGrievance.location,
          existingGrievances: existingCandidates
        },
        { timeout: 4000 }
      );

      if (mlResponse.data) {
        // Persist advisory GrievanceAnalysis
        analysisResult = await prisma.grievanceAnalysis.create({
          data: {
            grievanceId: newGrievance.id,
            predictedCategory: mlResponse.data.predictedCategory,
            categoryConfidence: mlResponse.data.categoryConfidence,
            severityScore: mlResponse.data.severityScore,
            predictedPriority: mlResponse.data.predictedPriority,
            isAnomalous: mlResponse.data.isAnomalous,
            anomalyReason: mlResponse.data.anomalyReason,
            modelVersion: mlResponse.data.modelVersion || 'scikit-tfidf-v1.0.0'
          }
        });

        // Persist similarity relationships if above threshold
        if (Array.isArray(mlResponse.data.similarities)) {
          for (const sim of mlResponse.data.similarities) {
            if (sim.isPotentialDuplicate || sim.similarityScore >= 0.50) {
              try {
                await prisma.grievanceSimilarity.create({
                  data: {
                    sourceGrievanceId: newGrievance.id,
                    targetGrievanceId: sim.targetGrievanceId,
                    similarityScore: sim.similarityScore
                  }
                });
              } catch (simErr) {
                // Prevent duplicate relationship error if pair exists
              }
            }
          }
        }

        // Audit log AI analysis execution
        await logAuditEvent({
          userId: null,
          action: 'AI_ANALYSIS_EXECUTED',
          entityType: 'GrievanceAnalysis',
          entityId: analysisResult.id,
          details: {
            grievanceId: newGrievance.id,
            predictedCategory: analysisResult.predictedCategory,
            severityScore: analysisResult.severityScore,
            predictedPriority: analysisResult.predictedPriority,
            isAnomalous: analysisResult.isAnomalous
          },
          ipAddress: clientIp
        });
      }
    } catch (mlErr) {
      console.warn(`[ML Pipeline Warning]: Intelligence service unreachable for grievance ${newGrievance.id}:`, mlErr.message);
      await logAuditEvent({
        userId: null,
        action: 'AI_ANALYSIS_UNAVAILABLE',
        entityType: 'Grievance',
        entityId: newGrievance.id,
        details: {
          reason: 'Intelligence service connection timeout or offline'
        },
        ipAddress: clientIp
      });
    }

    // 3. Re-fetch complete grievance with relations
    const completeGrievance = await prisma.grievance.findUnique({
      where: { id: newGrievance.id },
      include: grievanceInclude
    });

    return res.status(201).json({
      status: 'success',
      message: 'Grievance submitted successfully.',
      grievance: completeGrievance,
      intelligenceStatus: analysisResult ? 'completed' : 'unavailable'
    });
  } catch (error) {
    console.error('[Submit Grievance Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to submit grievance. Please try again later.'
    });
  }
}

/**
 * GET /api/grievances/my
 * Retrieves all grievances submitted by the authenticated citizen.
 * Access: CITIZEN only.
 */
async function getMyGrievances(req, res) {
  try {
    const grievances = await prisma.grievance.findMany({
      where: { submittedById: req.user.id },
      include: grievanceInclude,
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      status: 'success',
      count: grievances.length,
      grievances
    });
  } catch (error) {
    console.error('[Get My Grievances Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve your grievances.'
    });
  }
}

/**
 * GET /api/grievances/:id
 * Retrieves a single grievance by ID with strict ownership/authorization checks.
 * Access: Authenticated (Citizen=own only, Authority=assigned/unassigned, Admin=all).
 */
async function getGrievanceById(req, res) {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid grievance ID format.'
      });
    }

    const grievance = await prisma.grievance.findUnique({
      where: { id },
      include: grievanceInclude
    });

    if (!grievance) {
      return res.status(404).json({
        status: 'error',
        message: 'Grievance not found.'
      });
    }

    // Role-based authorization enforcement
    if (req.user.role === 'CITIZEN') {
      if (grievance.submittedById !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: You do not have permission to view this grievance.'
        });
      }
    } else if (req.user.role === 'AUTHORITY') {
      // Authority can view grievances assigned to them, or unassigned grievances
      const isAssignedToThem = grievance.assignedToId === req.user.id;
      const isUnassigned = grievance.assignedToId === null;

      if (!isAssignedToThem && !isUnassigned) {
        return res.status(403).json({
          status: 'error',
          message: 'Forbidden: This grievance is assigned to another authority.'
        });
      }
    }
    // ADMIN has unrestricted access

    return res.status(200).json({
      status: 'success',
      grievance
    });
  } catch (error) {
    console.error('[Get Grievance By ID Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve grievance.'
    });
  }
}

/**
 * GET /api/grievances
 * Lists grievances with filtering.
 * Access: AUTHORITY or ADMIN.
 */
async function listGrievances(req, res) {
  try {
    const { status, priority, categoryId, assignedToId } = req.query;

    const where = {};

    // Validate and apply status filter
    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid status filter. Allowed values: [${VALID_STATUSES.join(', ')}]`
        });
      }
      where.status = status;
    }

    // Validate and apply priority filter
    if (priority) {
      if (!VALID_PRIORITIES.includes(priority)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid priority filter. Allowed values: [${VALID_PRIORITIES.join(', ')}]`
        });
      }
      where.priority = priority;
    }

    // Validate and apply category filter
    if (categoryId) {
      if (!isValidUUID(categoryId)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid categoryId format.'
        });
      }
      where.categoryId = categoryId;
    }

    // Role-specific scoping & assignment filter
    if (req.user.role === 'AUTHORITY') {
      if (assignedToId) {
        if (!isValidUUID(assignedToId)) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid assignedToId format.'
          });
        }
        where.assignedToId = assignedToId;
      } else {
        // By default, authority sees grievances assigned to them or unassigned grievances
        where.OR = [
          { assignedToId: req.user.id },
          { assignedToId: null }
        ];
      }
    } else if (req.user.role === 'ADMIN') {
      if (assignedToId) {
        if (!isValidUUID(assignedToId)) {
          return res.status(400).json({
            status: 'error',
            message: 'Invalid assignedToId format.'
          });
        }
        where.assignedToId = assignedToId;
      }
    }

    const grievances = await prisma.grievance.findMany({
      where,
      include: grievanceInclude,
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json({
      status: 'success',
      count: grievances.length,
      grievances
    });
  } catch (error) {
    console.error('[List Grievances Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve grievances.'
    });
  }
}

/**
 * PATCH /api/grievances/:id/assign
 * Assigns a grievance to an active authority user.
 * Access: AUTHORITY or ADMIN.
 */
async function assignGrievance(req, res) {
  try {
    const { id } = req.params;
    const { assignedToId } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid grievance ID format.'
      });
    }

    if (!assignedToId || !isValidUUID(assignedToId)) {
      return res.status(400).json({
        status: 'error',
        message: 'assignedToId is required and must be a valid UUID.'
      });
    }

    // Verify grievance exists
    const grievance = await prisma.grievance.findUnique({
      where: { id }
    });

    if (!grievance) {
      return res.status(404).json({
        status: 'error',
        message: 'Grievance not found.'
      });
    }

    // Verify target user exists and has role AUTHORITY
    const assignee = await prisma.user.findUnique({
      where: { id: assignedToId }
    });

    if (!assignee) {
      return res.status(400).json({
        status: 'error',
        message: 'Assigned user not found.'
      });
    }

    if (assignee.role !== 'AUTHORITY') {
      return res.status(400).json({
        status: 'error',
        message: 'Grievance can only be assigned to a user with the AUTHORITY role.'
      });
    }

    // Determine new status: if currently SUBMITTED or UNDER_REVIEW, transition to ASSIGNED
    let newStatus = grievance.status;
    if (grievance.status === 'SUBMITTED' || grievance.status === 'UNDER_REVIEW') {
      newStatus = 'ASSIGNED';
    }

    const updatedGrievance = await prisma.grievance.update({
      where: { id },
      data: {
        assignedToId,
        status: newStatus
      },
      include: grievanceInclude
    });

    const clientIp = getClientIp(req);

    // Audit log assignment
    await logAuditEvent({
      userId: req.user.id,
      action: 'GRIEVANCE_ASSIGNED',
      entityType: 'Grievance',
      entityId: id,
      details: {
        previousAssignedToId: grievance.assignedToId,
        newAssignedToId: assignedToId,
        assigneeName: assignee.name,
        assigneeEmail: assignee.email,
        previousStatus: grievance.status,
        newStatus: updatedGrievance.status
      },
      ipAddress: clientIp
    });

    return res.status(200).json({
      status: 'success',
      message: `Grievance successfully assigned to ${assignee.name}.`,
      grievance: updatedGrievance
    });
  } catch (error) {
    console.error('[Assign Grievance Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to assign grievance.'
    });
  }
}

/**
 * PATCH /api/grievances/:id/status
 * Updates grievance status using enforced workflow transition rules.
 * Access: AUTHORITY or ADMIN.
 */
async function updateGrievanceStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid grievance ID format.'
      });
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid status. Permitted values: [${VALID_STATUSES.join(', ')}]`
      });
    }

    const grievance = await prisma.grievance.findUnique({
      where: { id }
    });

    if (!grievance) {
      return res.status(404).json({
        status: 'error',
        message: 'Grievance not found.'
      });
    }

    // Enforce workflow transitions for AUTHORITY
    if (req.user.role === 'AUTHORITY') {
      const allowedNext = ALLOWED_STATUS_TRANSITIONS[grievance.status] || [];
      if (!allowedNext.includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: `Invalid status transition from "${grievance.status}" to "${status}". Permitted transitions are: [${allowedNext.join(', ')}]`
        });
      }
    }
    // ADMIN can perform administrative corrections to any valid status

    // Handle resolvedAt consistency
    let resolvedAt = grievance.resolvedAt;
    if (status === 'RESOLVED') {
      resolvedAt = new Date();
    } else if (status === 'CLOSED') {
      resolvedAt = grievance.resolvedAt || new Date();
    } else {
      // Transitioned away from RESOLVED / CLOSED
      resolvedAt = null;
    }

    const updatedGrievance = await prisma.grievance.update({
      where: { id },
      data: {
        status,
        resolvedAt
      },
      include: grievanceInclude
    });

    const clientIp = getClientIp(req);

    // Audit log status update
    await logAuditEvent({
      userId: req.user.id,
      action: 'GRIEVANCE_STATUS_UPDATED',
      entityType: 'Grievance',
      entityId: id,
      details: {
        previousStatus: grievance.status,
        newStatus: status,
        resolvedAt: updatedGrievance.resolvedAt
      },
      ipAddress: clientIp
    });

    return res.status(200).json({
      status: 'success',
      message: `Grievance status updated to "${status}".`,
      grievance: updatedGrievance
    });
  } catch (error) {
    console.error('[Update Status Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update grievance status.'
    });
  }
}

/**
 * PATCH /api/grievances/:id/priority
 * Updates official grievance priority.
 * Access: AUTHORITY or ADMIN.
 */
async function updateGrievancePriority(req, res) {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid grievance ID format.'
      });
    }

    if (!priority || !VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid priority. Permitted values: [${VALID_PRIORITIES.join(', ')}]`
      });
    }

    const grievance = await prisma.grievance.findUnique({
      where: { id }
    });

    if (!grievance) {
      return res.status(404).json({
        status: 'error',
        message: 'Grievance not found.'
      });
    }

    const updatedGrievance = await prisma.grievance.update({
      where: { id },
      data: { priority },
      include: grievanceInclude
    });

    const clientIp = getClientIp(req);

    // Audit log priority update
    await logAuditEvent({
      userId: req.user.id,
      action: 'GRIEVANCE_PRIORITY_UPDATED',
      entityType: 'Grievance',
      entityId: id,
      details: {
        previousPriority: grievance.priority,
        newPriority: priority
      },
      ipAddress: clientIp
    });

    return res.status(200).json({
      status: 'success',
      message: `Grievance priority updated to "${priority}".`,
      grievance: updatedGrievance
    });
  } catch (error) {
    console.error('[Update Priority Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update grievance priority.'
    });
  }
}

/**
 * PATCH /api/grievances/:id/category
 * Updates official authoritative grievance category.
 * Access: AUTHORITY or ADMIN.
 */
async function updateGrievanceCategory(req, res) {
  try {
    const { id } = req.params;
    const { categoryId } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid grievance ID format.'
      });
    }

    if (!categoryId || !isValidUUID(categoryId)) {
      return res.status(400).json({
        status: 'error',
        message: 'categoryId is required and must be a valid UUID.'
      });
    }

    const grievance = await prisma.grievance.findUnique({
      where: { id }
    });

    if (!grievance) {
      return res.status(404).json({
        status: 'error',
        message: 'Grievance not found.'
      });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return res.status(400).json({
        status: 'error',
        message: 'Category not found.'
      });
    }

    const updatedGrievance = await prisma.grievance.update({
      where: { id },
      data: { categoryId },
      include: grievanceInclude
    });

    const clientIp = getClientIp(req);

    // Audit log category update
    await logAuditEvent({
      userId: req.user.id,
      action: 'GRIEVANCE_CATEGORY_UPDATED',
      entityType: 'Grievance',
      entityId: id,
      details: {
        previousCategoryId: grievance.categoryId,
        newCategoryId: categoryId,
        categoryName: category.name
      },
      ipAddress: clientIp
    });

    return res.status(200).json({
      status: 'success',
      message: `Grievance category updated to "${category.name}".`,
      grievance: updatedGrievance
    });
  } catch (error) {
    console.error('[Update Category Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update grievance category.'
    });
  }
}

/**
 * GET /api/grievances/categories
 * Returns all active grievance categories for selection.
 * Access: Authenticated users.
 */
async function listCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({
      status: 'success',
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error('[List Categories Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve categories.'
    });
  }
}

/**
 * GET /api/grievances/authorities
 * Returns active authority officers for triage assignment.
 * Access: AUTHORITY or ADMIN.
 */
async function listAuthorities(req, res) {
  try {
    const authorities = await prisma.user.findMany({
      where: { role: 'AUTHORITY' },
      select: { id: true, name: true, email: true, department: true },
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({
      status: 'success',
      count: authorities.length,
      authorities
    });
  } catch (error) {
    console.error('[List Authorities Error]:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve authorities.'
    });
  }
}

module.exports = {
  submitGrievance,
  getMyGrievances,
  getGrievanceById,
  listGrievances,
  assignGrievance,
  updateGrievanceStatus,
  updateGrievancePriority,
  updateGrievanceCategory,
  listCategories,
  listAuthorities
};
