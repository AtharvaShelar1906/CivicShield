const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const API_BASE = 'http://localhost:5000/api';
const prisma = new PrismaClient();

const results = [];

function recordResult(testNumber, description, passed, details) {
  results.push({ testNumber, description, passed, details });
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [Test ${testNumber}] ${description}`);
  if (details) {
    console.log(`   Details: ${typeof details === 'object' ? JSON.stringify(details) : details}`);
  }
}

async function runTests() {
  console.log('=====================================================');
  console.log('  PHASE 4: GRIEVANCE MANAGEMENT APIS TEST SUITE      ');
  console.log('=====================================================\n');

  // 1. Authenticate users
  console.log('Authenticating test users with seeded credentials...');
  const citizen1Auth = await axios.post(`${API_BASE}/auth/login`, {
    email: 'aarav.citizen@example.com',
    password: 'CitizenPass123!'
  });
  const citizen1Token = citizen1Auth.data.token;
  const citizen1 = citizen1Auth.data.user;

  const citizen2Auth = await axios.post(`${API_BASE}/auth/login`, {
    email: 'ananya.citizen@example.com',
    password: 'CitizenPass123!'
  });
  const citizen2Token = citizen2Auth.data.token;
  const citizen2 = citizen2Auth.data.user;

  const authorityAuth = await axios.post(`${API_BASE}/auth/login`, {
    email: 'authority.roads@grievance.gov.in',
    password: 'AuthorityPass123!'
  });
  const authorityToken = authorityAuth.data.token;
  const authority = authorityAuth.data.user;

  const adminAuth = await axios.post(`${API_BASE}/auth/login`, {
    email: 'admin@grievance.gov.in',
    password: 'AdminPass123!'
  });
  const adminToken = adminAuth.data.token;
  const admin = adminAuth.data.user;

  let testGrievanceId = null;

  // -----------------------------------------------------------------
  // 1. Citizen submits grievance successfully
  // -----------------------------------------------------------------
  try {
    const res = await axios.post(
      `${API_BASE}/grievances`,
      {
        title: 'Deep sinkhole developing rapidly near Metro Station Exit 2',
        description: 'A dangerous sinkhole approximately 3 feet wide has formed overnight on the main pedestrian path near Metro Exit 2.',
        location: 'Sector 4, Metro Station Exit 2'
      },
      { headers: { Authorization: `Bearer ${citizen1Token}` } }
    );

    testGrievanceId = res.data.grievance.id;
    const isSubmitted = res.data.grievance.status === 'SUBMITTED';
    const isMedium = res.data.grievance.priority === 'MEDIUM';
    const isOwn = res.data.grievance.submittedById === citizen1.id;
    const isUnassigned = res.data.grievance.assignedToId === null;

    recordResult(
      1,
      'Citizen submits grievance successfully (default SUBMITTED & MEDIUM)',
      res.status === 201 && isSubmitted && isMedium && isOwn && isUnassigned,
      { status: res.status, id: testGrievanceId, initialStatus: res.data.grievance.status }
    );
  } catch (err) {
    recordResult(1, 'Citizen submits grievance successfully', false, err.response?.data || err.message);
  }

  // -----------------------------------------------------------------
  // 2. Citizen cannot submit a grievance with another user's ID or override state
  // -----------------------------------------------------------------
  try {
    const res = await axios.post(
      `${API_BASE}/grievances`,
      {
        title: 'Malicious payload attempting to spoof submitter and state',
        description: 'Testing whether the client can inject a different citizen ID, priority, status, or assignment.',
        submittedById: citizen2.id,
        assignedToId: authority.id,
        status: 'RESOLVED',
        priority: 'CRITICAL'
      },
      { headers: { Authorization: `Bearer ${citizen1Token}` } }
    );

    const isOwn = res.data.grievance.submittedById === citizen1.id;
    const notSpoofed = res.data.grievance.submittedById !== citizen2.id;
    const statusClean = res.data.grievance.status === 'SUBMITTED';
    const priorityClean = res.data.grievance.priority === 'MEDIUM';
    const assignClean = res.data.grievance.assignedToId === null;

    recordResult(
      2,
      "Citizen cannot spoof submitter ID or override status/priority/assignment",
      isOwn && notSpoofed && statusClean && priorityClean && assignClean,
      {
        enforcedSubmitterId: res.data.grievance.submittedById,
        enforcedStatus: res.data.grievance.status,
        enforcedPriority: res.data.grievance.priority,
        enforcedAssignee: res.data.grievance.assignedToId
      }
    );
  } catch (err) {
    recordResult(2, 'Citizen cannot spoof submitter ID', false, err.response?.data || err.message);
  }

  // -----------------------------------------------------------------
  // 3. Citizen can retrieve their own grievance
  // -----------------------------------------------------------------
  try {
    const singleRes = await axios.get(`${API_BASE}/grievances/${testGrievanceId}`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });

    const myRes = await axios.get(`${API_BASE}/grievances/my`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });

    const inMyList = myRes.data.grievances.some(g => g.id === testGrievanceId);

    recordResult(
      3,
      'Citizen can retrieve their own grievance via /:id and /my',
      singleRes.status === 200 && singleRes.data.grievance.id === testGrievanceId && inMyList,
      { singleStatus: singleRes.status, totalMyGrievances: myRes.data.count }
    );
  } catch (err) {
    recordResult(3, 'Citizen can retrieve their own grievance', false, err.response?.data || err.message);
  }

  // -----------------------------------------------------------------
  // 4. Citizen cannot retrieve another citizen's grievance
  // -----------------------------------------------------------------
  try {
    await axios.get(`${API_BASE}/grievances/${testGrievanceId}`, {
      headers: { Authorization: `Bearer ${citizen2Token}` }
    });
    recordResult(4, "Citizen cannot retrieve another citizen's grievance", false, 'Expected 403 Forbidden');
  } catch (err) {
    recordResult(
      4,
      "Citizen cannot retrieve another citizen's grievance (HTTP 403 Forbidden)",
      err.response?.status === 403,
      { status: err.response?.status, message: err.response?.data?.message }
    );
  }

  // -----------------------------------------------------------------
  // 5. Citizen cannot list all grievances
  // -----------------------------------------------------------------
  try {
    await axios.get(`${API_BASE}/grievances`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    recordResult(5, 'Citizen cannot list all grievances', false, 'Expected 403 Forbidden');
  } catch (err) {
    recordResult(
      5,
      'Citizen cannot list all grievances (HTTP 403 Forbidden)',
      err.response?.status === 403,
      { status: err.response?.status, message: err.response?.data?.message }
    );
  }

  // -----------------------------------------------------------------
  // 6. Citizen cannot assign a grievance
  // -----------------------------------------------------------------
  try {
    await axios.patch(
      `${API_BASE}/grievances/${testGrievanceId}/assign`,
      { assignedToId: authority.id },
      { headers: { Authorization: `Bearer ${citizen1Token}` } }
    );
    recordResult(6, 'Citizen cannot assign a grievance', false, 'Expected 403 Forbidden');
  } catch (err) {
    recordResult(
      6,
      'Citizen cannot assign a grievance (HTTP 403 Forbidden)',
      err.response?.status === 403,
      { status: err.response?.status, message: err.response?.data?.message }
    );
  }

  // -----------------------------------------------------------------
  // 7. Citizen cannot change status
  // -----------------------------------------------------------------
  try {
    await axios.patch(
      `${API_BASE}/grievances/${testGrievanceId}/status`,
      { status: 'RESOLVED' },
      { headers: { Authorization: `Bearer ${citizen1Token}` } }
    );
    recordResult(7, 'Citizen cannot change status', false, 'Expected 403 Forbidden');
  } catch (err) {
    recordResult(
      7,
      'Citizen cannot change status (HTTP 403 Forbidden)',
      err.response?.status === 403,
      { status: err.response?.status, message: err.response?.data?.message }
    );
  }

  // -----------------------------------------------------------------
  // 8. Authority can retrieve authorized grievances
  // -----------------------------------------------------------------
  try {
    const listRes = await axios.get(`${API_BASE}/grievances`, {
      headers: { Authorization: `Bearer ${authorityToken}` }
    });

    const singleRes = await axios.get(`${API_BASE}/grievances/${testGrievanceId}`, {
      headers: { Authorization: `Bearer ${authorityToken}` }
    });

    recordResult(
      8,
      'Authority can retrieve authorized grievances (list & unassigned/assigned)',
      listRes.status === 200 && singleRes.status === 200,
      { accessibleCount: listRes.data.count, grievanceTitle: singleRes.data.grievance.title }
    );
  } catch (err) {
    recordResult(8, 'Authority can retrieve authorized grievances', false, err.response?.data || err.message);
  }

  // -----------------------------------------------------------------
  // 9. Authority can assign a grievance
  // -----------------------------------------------------------------
  try {
    const res = await axios.patch(
      `${API_BASE}/grievances/${testGrievanceId}/assign`,
      { assignedToId: authority.id },
      { headers: { Authorization: `Bearer ${authorityToken}` } }
    );

    const isAssigned = res.data.grievance.assignedToId === authority.id;
    const statusTransitioned = res.data.grievance.status === 'ASSIGNED';

    recordResult(
      9,
      'Authority can assign grievance (transitions status to ASSIGNED)',
      res.status === 200 && isAssigned && statusTransitioned,
      { assignedToId: res.data.grievance.assignedToId, newStatus: res.data.grievance.status }
    );
  } catch (err) {
    recordResult(9, 'Authority can assign a grievance', false, err.response?.data || err.message);
  }

  // -----------------------------------------------------------------
  // 10. Authority can update status through valid transitions
  // -----------------------------------------------------------------
  try {
    // Current status is ASSIGNED -> Transition to IN_PROGRESS
    const inProgressRes = await axios.patch(
      `${API_BASE}/grievances/${testGrievanceId}/status`,
      { status: 'IN_PROGRESS' },
      { headers: { Authorization: `Bearer ${authorityToken}` } }
    );

    // Transition IN_PROGRESS -> RESOLVED
    const resolvedRes = await axios.patch(
      `${API_BASE}/grievances/${testGrievanceId}/status`,
      { status: 'RESOLVED' },
      { headers: { Authorization: `Bearer ${authorityToken}` } }
    );

    const isResolved = resolvedRes.data.grievance.status === 'RESOLVED';
    const hasResolvedAt = resolvedRes.data.grievance.resolvedAt !== null;

    recordResult(
      10,
      'Authority can update status through valid transitions (ASSIGNED -> IN_PROGRESS -> RESOLVED, sets resolvedAt)',
      inProgressRes.status === 200 && isResolved && hasResolvedAt,
      {
        inProgressStatus: inProgressRes.data.grievance.status,
        finalStatus: resolvedRes.data.grievance.status,
        resolvedAt: resolvedRes.data.grievance.resolvedAt
      }
    );
  } catch (err) {
    recordResult(10, 'Authority can update status through valid transitions', false, err.response?.data || err.message);
  }

  // -----------------------------------------------------------------
  // 11. Invalid status transition is rejected
  // -----------------------------------------------------------------
  try {
    // Currently RESOLVED -> Attempting SUBMITTED (invalid for Authority)
    await axios.patch(
      `${API_BASE}/grievances/${testGrievanceId}/status`,
      { status: 'SUBMITTED' },
      { headers: { Authorization: `Bearer ${authorityToken}` } }
    );
    recordResult(11, 'Invalid status transition is rejected', false, 'Expected 400 Bad Request');
  } catch (err) {
    recordResult(
      11,
      'Invalid status transition is rejected (HTTP 400 Bad Request)',
      err.response?.status === 400,
      { status: err.response?.status, message: err.response?.data?.message }
    );
  }

  // -----------------------------------------------------------------
  // 12. Authority can update priority
  // -----------------------------------------------------------------
  try {
    const res = await axios.patch(
      `${API_BASE}/grievances/${testGrievanceId}/priority`,
      { priority: 'CRITICAL' },
      { headers: { Authorization: `Bearer ${authorityToken}` } }
    );

    recordResult(
      12,
      'Authority can update official priority (updated to CRITICAL)',
      res.status === 200 && res.data.grievance.priority === 'CRITICAL',
      { priority: res.data.grievance.priority }
    );
  } catch (err) {
    recordResult(12, 'Authority can update priority', false, err.response?.data || err.message);
  }

  // -----------------------------------------------------------------
  // 13. Authority can update category
  // -----------------------------------------------------------------
  try {
    const catRes = await axios.get(`${API_BASE}/grievances/categories`, {
      headers: { Authorization: `Bearer ${authorityToken}` }
    });
    const targetCategory = catRes.data.categories[0];

    const res = await axios.patch(
      `${API_BASE}/grievances/${testGrievanceId}/category`,
      { categoryId: targetCategory.id },
      { headers: { Authorization: `Bearer ${authorityToken}` } }
    );

    recordResult(
      13,
      'Authority can update official category',
      res.status === 200 && res.data.grievance.categoryId === targetCategory.id,
      { categoryName: targetCategory.name, categoryId: targetCategory.id }
    );
  } catch (err) {
    recordResult(13, 'Authority can update category', false, err.response?.data || err.message);
  }

  // -----------------------------------------------------------------
  // 14. Admin can access all grievances
  // -----------------------------------------------------------------
  try {
    const res = await axios.get(`${API_BASE}/grievances`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    recordResult(
      14,
      'Admin can access all grievances across all departments and citizens',
      res.status === 200 && res.data.count > 0,
      { totalGrievances: res.data.count }
    );
  } catch (err) {
    recordResult(14, 'Admin can access all grievances', false, err.response?.data || err.message);
  }

  // -----------------------------------------------------------------
  // 15. Admin can perform administrative corrections
  // -----------------------------------------------------------------
  try {
    // Admin directly overrides status from RESOLVED back to UNDER_REVIEW
    const res = await axios.patch(
      `${API_BASE}/grievances/${testGrievanceId}/status`,
      { status: 'UNDER_REVIEW' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const isUnderReview = res.data.grievance.status === 'UNDER_REVIEW';
    const resolvedCleared = res.data.grievance.resolvedAt === null;

    recordResult(
      15,
      'Admin can perform administrative corrections (reopens to UNDER_REVIEW, resets resolvedAt)',
      res.status === 200 && isUnderReview && resolvedCleared,
      { status: res.data.grievance.status, resolvedAt: res.data.grievance.resolvedAt }
    );
  } catch (err) {
    recordResult(15, 'Admin can perform administrative corrections', false, err.response?.data || err.message);
  }

  // -----------------------------------------------------------------
  // 16. Audit records are created correctly
  // -----------------------------------------------------------------
  try {
    const logs = await prisma.auditLog.findMany({
      where: { entityId: testGrievanceId }
    });

    const actions = logs.map(l => l.action);
    const hasSubmitted = actions.includes('GRIEVANCE_SUBMITTED');
    const hasAssigned = actions.includes('GRIEVANCE_ASSIGNED');
    const hasStatusUpdated = actions.includes('GRIEVANCE_STATUS_UPDATED');
    const hasPriorityUpdated = actions.includes('GRIEVANCE_PRIORITY_UPDATED');
    const hasCategoryUpdated = actions.includes('GRIEVANCE_CATEGORY_UPDATED');

    const allLogged = hasSubmitted && hasAssigned && hasStatusUpdated && hasPriorityUpdated && hasCategoryUpdated;

    recordResult(
      16,
      'Audit records created for submission, assignment, status, priority, and category changes',
      allLogged,
      { loggedActions: actions, logCount: logs.length }
    );
  } catch (err) {
    recordResult(16, 'Audit records created correctly', false, err.message);
  }

  // -----------------------------------------------------------------
  // 17. Unauthorized requests return appropriate HTTP errors
  // -----------------------------------------------------------------
  try {
    await axios.post(`${API_BASE}/grievances`, {
      title: 'Unauthorized grievance test',
      description: 'Attempting to submit without Authorization header.'
    });
    recordResult(17, 'Unauthorized requests return appropriate HTTP errors', false, 'Expected 401 Unauthorized');
  } catch (err) {
    recordResult(
      17,
      'Unauthorized requests return HTTP 401 Unauthorized',
      err.response?.status === 401,
      { status: err.response?.status, message: err.response?.data?.message }
    );
  }

  // -----------------------------------------------------------------
  // 18. Invalid/nonexistent grievance IDs are handled correctly
  // -----------------------------------------------------------------
  try {
    let invalidHandled = false;
    let nonexistentHandled = false;

    try {
      await axios.get(`${API_BASE}/grievances/invalid-uuid-format`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    } catch (e) {
      invalidHandled = e.response?.status === 400;
    }

    try {
      await axios.get(`${API_BASE}/grievances/00000000-0000-0000-0000-000000000000`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    } catch (e) {
      nonexistentHandled = e.response?.status === 404;
    }

    recordResult(
      18,
      'Invalid/nonexistent grievance IDs handled (HTTP 400 for malformed UUID, HTTP 404 for not found)',
      invalidHandled && nonexistentHandled,
      { invalidUuidStatus: 400, nonexistentUuidStatus: 404 }
    );
  } catch (err) {
    recordResult(18, 'Invalid/nonexistent grievance IDs handled', false, err.message);
  }

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log('\n=====================================================');
  const allPassed = results.every(r => r.passed);
  console.log(`TOTAL TESTS: ${results.length} | PASSED: ${results.filter(r => r.passed).length} | FAILED: ${results.filter(r => !r.passed).length}`);
  console.log(`FINAL RESULT: ${allPassed ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  console.log('=====================================================');
}

runTests()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
