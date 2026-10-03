/**
 * Phase 6C-2 Verification Suite: Admin Management Portal & System Governance
 */
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=====================================================');
  console.log('  PHASE 6C-2: ADMIN MANAGEMENT & GOVERNANCE SUITE    ');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function recordResult(testNum, name, condition, details) {
    if (condition) {
      console.log(`✅ PASS [Test ${testNum}] ${name}`);
      if (details) console.log(`   Details: ${JSON.stringify(details)}`);
      passed++;
    } else {
      console.error(`❌ FAIL [Test ${testNum}] ${name}`);
      if (details) console.error(`   Details: ${JSON.stringify(details)}`);
      failed++;
    }
  }

  // 1. Authenticate Admin, Authority, and Citizen
  let adminRes, authorityRes, citizenRes;
  try {
    adminRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@grievance.gov.in',
      password: 'AdminPass123!'
    });
    authorityRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'authority.roads@grievance.gov.in',
      password: 'AuthorityPass123!'
    });
    citizenRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'aarav.citizen@example.com',
      password: 'CitizenPass123!'
    });
  } catch (err) {
    console.error('Fatal: Failed to login test users:', err.response?.data || err.message);
    process.exit(1);
  }

  const admin = adminRes.data.user;
  const adminToken = adminRes.data.token;
  const authorityToken = authorityRes.data.token;
  const citizenToken = citizenRes.data.token;

  console.log(`Admin authenticated: ${admin.name} (${admin.role})\n`);

  // Test 1: Admin authentication & profile verification
  recordResult(
    1,
    'Admin authenticated with ADMIN role and system privileges',
    admin.role === 'ADMIN',
    { name: admin.name, email: admin.email, role: admin.role }
  );

  // Test 2: Admin metrics aggregation (live backend data)
  try {
    const metricsRes = await axios.get(`${API_BASE}/admin/metrics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const m = metricsRes.data.metrics;
    const hasUsers = m.users && m.users.total > 0 && m.users.active > 0;
    const hasGrievances = m.grievances && m.grievances.total >= 0 && m.grievances.submitted >= 0;
    const hasGov = m.governance && m.governance.totalAuditLogs >= 0;

    recordResult(
      2,
      'Admin retrieves system-wide governance metrics (users, lifecycle, audit logs)',
      metricsRes.status === 200 && hasUsers && hasGrievances && hasGov,
      {
        totalUsers: m.users.total,
        activeUsers: m.users.active,
        totalGrievances: m.grievances.total,
        auditLogs: m.governance.totalAuditLogs
      }
    );
  } catch (err) {
    recordResult(2, 'Admin retrieves system metrics', false, err.response?.data || err.message);
  }

  // Test 3: Citizen blocked from admin metrics (HTTP 403 Forbidden)
  try {
    await axios.get(`${API_BASE}/admin/metrics`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    recordResult(3, 'Citizen blocked from admin metrics', false, 'Expected HTTP 403 Forbidden');
  } catch (err) {
    recordResult(
      3,
      'Citizen blocked from admin metrics (HTTP 403 Forbidden enforced)',
      err.response?.status === 403,
      { status: err.response?.status, message: err.response?.data?.message }
    );
  }

  // Test 4: Authority blocked from admin metrics (HTTP 403 Forbidden)
  try {
    await axios.get(`${API_BASE}/admin/metrics`, {
      headers: { Authorization: `Bearer ${authorityToken}` }
    });
    recordResult(4, 'Authority blocked from admin metrics', false, 'Expected HTTP 403 Forbidden');
  } catch (err) {
    recordResult(
      4,
      'Authority blocked from admin metrics (HTTP 403 Forbidden enforced)',
      err.response?.status === 403,
      { status: err.response?.status, message: err.response?.data?.message }
    );
  }

  // Test 5: User listing with no passwordHash leakage
  let targetCitizenUser;
  try {
    const usersRes = await axios.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const users = usersRes.data.users;
    const hasNoPasswordHash = users.every((u) => u.passwordHash === undefined);
    targetCitizenUser = users.find((u) => u.email === 'vikram.citizen@example.com') || users.find((u) => u.role === 'CITIZEN' && u.email !== 'aarav.citizen@example.com');

    recordResult(
      5,
      'Admin retrieves user registry; passwordHash strictly excluded from all user records',
      usersRes.status === 200 && Array.isArray(users) && users.length >= 3 && hasNoPasswordHash,
      { userCount: users.length, allPasswordHashStripped: hasNoPasswordHash }
    );
  } catch (err) {
    recordResult(5, 'User listing', false, err.response?.data || err.message);
  }

  // Test 6: User deactivation by Admin (toggles isActive = false)
  try {
    const deactRes = await axios.patch(
      `${API_BASE}/admin/users/${targetCitizenUser.id}/status`,
      { isActive: false },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    recordResult(
      6,
      'Admin deactivates user account (isActive toggled to false)',
      deactRes.status === 200 && deactRes.data.user.isActive === false,
      { targetUser: targetCitizenUser.email, newActiveStatus: deactRes.data.user.isActive }
    );
  } catch (err) {
    recordResult(6, 'User deactivation', false, err.response?.data || err.message);
  }

  // Test 7: Deactivated user blocked from authentication (HTTP 403 Forbidden)
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: targetCitizenUser.email,
      password: 'CitizenPass123!'
    });
    recordResult(7, 'Deactivated user blocked from login', false, 'Expected HTTP 403 Forbidden');
  } catch (err) {
    recordResult(
      7,
      'Deactivated user blocked from login (HTTP 403 Forbidden enforced on authentication)',
      err.response?.status === 403,
      { status: err.response?.status, message: err.response?.data?.message }
    );
  }

  // Test 8: User reactivation by Admin (restores isActive = true)
  try {
    const reactRes = await axios.patch(
      `${API_BASE}/admin/users/${targetCitizenUser.id}/status`,
      { isActive: true },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    recordResult(
      8,
      'Admin reactivates user account (isActive restored to true)',
      reactRes.status === 200 && reactRes.data.user.isActive === true,
      { targetUser: targetCitizenUser.email, restoredStatus: reactRes.data.user.isActive }
    );
  } catch (err) {
    recordResult(8, 'User reactivation', false, err.response?.data || err.message);
  }

  // Test 9: Self-deactivation protection (Admin cannot deactivate own account)
  try {
    await axios.patch(
      `${API_BASE}/admin/users/${admin.id}/status`,
      { isActive: false },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    recordResult(9, 'Admin self-deactivation protection', false, 'Expected HTTP 400 Bad Request');
  } catch (err) {
    recordResult(
      9,
      'Admin self-deactivation protection enforced (HTTP 400 Bad Request)',
      err.response?.status === 400,
      { status: err.response?.status, message: err.response?.data?.message }
    );
  }

  // Test 10: System-wide grievance visibility for Admin
  let testGrievanceId;
  try {
    const allGrievancesRes = await axios.get(`${API_BASE}/grievances`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const gList = allGrievancesRes.data.grievances;
    testGrievanceId = gList[0].id;

    recordResult(
      10,
      'Admin has system-wide grievance visibility across all departments and citizens',
      allGrievancesRes.status === 200 && gList.length > 0,
      { totalVisibleGrievances: allGrievancesRes.data.count }
    );
  } catch (err) {
    recordResult(10, 'Admin grievance visibility', false, err.response?.data || err.message);
  }

  // Test 11: Administrative workflow status correction
  try {
    // Admin corrects status to UNDER_REVIEW
    const correctRes = await axios.patch(
      `${API_BASE}/grievances/${testGrievanceId}/status`,
      { status: 'UNDER_REVIEW' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    recordResult(
      11,
      'Admin performs administrative workflow status correction',
      correctRes.status === 200 && correctRes.data.grievance.status === 'UNDER_REVIEW',
      { correctedStatus: correctRes.data.grievance.status }
    );
  } catch (err) {
    recordResult(11, 'Admin status correction', false, err.response?.data || err.message);
  }

  // Test 12: Audit log retrieval with no sensitive token/password leakage
  try {
    const auditRes = await axios.get(`${API_BASE}/admin/audit-logs?limit=20`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const logs = auditRes.data.logs;
    const hasLogs = logs.length > 0;
    // Verify no password, passwordHash, or JWT secrets in audit logs
    const hasNoSecrets = logs.every((l) => {
      const detailsStr = JSON.stringify(l.details || {});
      return !detailsStr.includes('password') && !detailsStr.includes('Bearer') && !detailsStr.includes('JWT');
    });

    recordResult(
      12,
      'Admin retrieves audit logs; sensitive tokens, JWTs, and passwords strictly excluded',
      auditRes.status === 200 && hasLogs && hasNoSecrets,
      { totalLogsCount: auditRes.data.total, recentRetrieved: logs.length, safeAuditRecords: hasNoSecrets }
    );
  } catch (err) {
    recordResult(12, 'Audit log retrieval', false, err.response?.data || err.message);
  }

  console.log('\n=====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log(`FINAL RESULT: ${failed === 0 ? 'ALL TESTS PASSED ✅' : 'FAILURES DETECTED ❌'}`);
  console.log('=====================================================');

  await prisma.$disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
