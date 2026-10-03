const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const API_BASE = 'http://localhost:5000/api/auth';
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
  console.log('  PHASE 3: BACKEND AUTH & AUTHORIZATION TEST SUITE   ');
  console.log('=====================================================\n');

  let citizenToken = null;
  let authorityToken = null;
  let adminToken = null;
  const testCitizenEmail = `test.citizen.${Date.now()}@example.com`;
  const testCitizenPassword = 'CitizenSecurePassword123!';

  // -----------------------------------------------------------------
  // 1. Citizen registration
  // -----------------------------------------------------------------
  try {
    const res = await axios.post(`${API_BASE}/register`, {
      name: 'Rohan Deshmukh',
      email: testCitizenEmail,
      password: testCitizenPassword,
      role: 'ADMIN' // Malicious attempt to escalate role
    });

    const isCitizen = res.data.user.role === 'CITIZEN';
    const noPasswordHash = res.data.user.passwordHash === undefined;
    const hasId = !!res.data.user.id;

    recordResult(
      1,
      'Citizen registration (forces CITIZEN role, excludes passwordHash)',
      res.status === 201 && isCitizen && noPasswordHash && hasId,
      { status: res.status, assignedRole: res.data.user.role, hasPasswordHash: !noPasswordHash }
    );
  } catch (err) {
    recordResult(1, 'Citizen registration', false, err.response?.data || err.message);
  }

  // -----------------------------------------------------------------
  // 2. Duplicate registration rejection
  // -----------------------------------------------------------------
  try {
    await axios.post(`${API_BASE}/register`, {
      name: 'Rohan Deshmukh Duplicate',
      email: testCitizenEmail,
      password: testCitizenPassword
    });
    recordResult(2, 'Duplicate registration rejection', false, 'Expected 409 Conflict, received success');
  } catch (err) {
    const isConflict = err.response?.status === 409;
    recordResult(
      2,
      'Duplicate registration rejection (HTTP 409 Conflict)',
      isConflict,
      { status: err.response?.status, message: err.response?.data?.message }
    );
  }

  // -----------------------------------------------------------------
  // 3. Successful citizen login
  // -----------------------------------------------------------------
  try {
    const res = await axios.post(`${API_BASE}/login`, {
      email: testCitizenEmail,
      password: testCitizenPassword
    });

    citizenToken = res.data.token;
    const hasToken = typeof citizenToken === 'string' && citizenToken.length > 20;
    const noPasswordHash = res.data.user.passwordHash === undefined;

    recordResult(
      3,
      'Successful citizen login (returns valid JWT, strips passwordHash)',
      res.status === 200 && hasToken && noPasswordHash,
      { status: res.status, tokenType: typeof citizenToken, user: res.data.user.email }
    );
  } catch (err) {
    recordResult(3, 'Successful citizen login', false, err.response?.data || err.message);
  }

  // -----------------------------------------------------------------
  // 4. Incorrect password rejection
  // -----------------------------------------------------------------
  try {
    await axios.post(`${API_BASE}/login`, {
      email: testCitizenEmail,
      password: 'CompletelyWrongPassword!'
    });
    recordResult(4, 'Incorrect password rejection', false, 'Expected 401 Unauthorized');
  } catch (err) {
    const isUnauthorized = err.response?.status === 401;
    recordResult(
      4,
      'Incorrect password rejection (HTTP 401 Unauthorized, generic error)',
      isUnauthorized,
      { status: err.response?.status, message: err.response?.data?.message }
    );
  }

  // -----------------------------------------------------------------
  // 5. Invalid token rejection
  // -----------------------------------------------------------------
  try {
    await axios.get(`${API_BASE}/me`, {
      headers: { Authorization: 'Bearer this.is.an.invalid.jwt.token' }
    });
    recordResult(5, 'Invalid token rejection', false, 'Expected 401 Unauthorized');
  } catch (err) {
    const isUnauthorized = err.response?.status === 401;
    recordResult(
      5,
      'Invalid token rejection (HTTP 401 Unauthorized)',
      isUnauthorized,
      { status: err.response?.status, message: err.response?.data?.message }
    );
  }

  // -----------------------------------------------------------------
  // 6. /api/auth/me with valid token
  // -----------------------------------------------------------------
  try {
    const res = await axios.get(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });

    const isMatch = res.data.user.email === testCitizenEmail;
    recordResult(
      6,
      '/api/auth/me profile retrieval with valid Bearer JWT',
      res.status === 200 && isMatch,
      { status: res.status, userEmail: res.data.user.email, role: res.data.user.role }
    );
  } catch (err) {
    recordResult(6, '/api/auth/me profile retrieval', false, err.response?.data || err.message);
  }

  // -----------------------------------------------------------------
  // 7. Citizen accessing citizen-protected endpoint
  // -----------------------------------------------------------------
  try {
    const res = await axios.get(`${API_BASE}/test/citizen`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });

    recordResult(
      7,
      'Citizen accessing CITIZEN-protected endpoint (HTTP 200 Granted)',
      res.status === 200,
      { status: res.status, message: res.data.message }
    );
  } catch (err) {
    recordResult(7, 'Citizen accessing citizen-protected endpoint', false, err.response?.data || err.message);
  }

  // -----------------------------------------------------------------
  // 8. Citizen being rejected from authority/admin endpoint
  // -----------------------------------------------------------------
  try {
    await axios.get(`${API_BASE}/test/authority`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    recordResult(8, 'Citizen rejected from AUTHORITY endpoint', false, 'Expected 403 Forbidden');
  } catch (err) {
    const isForbidden = err.response?.status === 403;
    recordResult(
      8,
      'Citizen rejected from AUTHORITY endpoint (HTTP 403 Forbidden)',
      isForbidden,
      { status: err.response?.status, message: err.response?.data?.message }
    );
  }

  // -----------------------------------------------------------------
  // 9. Authority access verification
  // -----------------------------------------------------------------
  try {
    // Login as seeded authority
    const loginRes = await axios.post(`${API_BASE}/login`, {
      email: 'authority.roads@grievance.gov.in',
      password: 'AuthorityPass123!'
    });
    authorityToken = loginRes.data.token;

    // Access authority endpoint
    const authEndpointRes = await axios.get(`${API_BASE}/test/authority`, {
      headers: { Authorization: `Bearer ${authorityToken}` }
    });

    // Attempt admin endpoint (should be forbidden)
    let adminForbidden = false;
    try {
      await axios.get(`${API_BASE}/test/admin`, {
        headers: { Authorization: `Bearer ${authorityToken}` }
      });
    } catch (e) {
      adminForbidden = e.response?.status === 403;
    }

    recordResult(
      9,
      'Authority access verification (Accesses AUTHORITY, blocked from ADMIN)',
      loginRes.status === 200 && authEndpointRes.status === 200 && adminForbidden,
      { authorityEndpointStatus: authEndpointRes.status, adminBlocked: adminForbidden }
    );
  } catch (err) {
    recordResult(9, 'Authority access verification', false, err.response?.data || err.message);
  }

  // -----------------------------------------------------------------
  // 10. Admin access verification
  // -----------------------------------------------------------------
  try {
    // Login as seeded admin
    const loginRes = await axios.post(`${API_BASE}/login`, {
      email: 'admin@grievance.gov.in',
      password: 'AdminPass123!'
    });
    adminToken = loginRes.data.token;

    // Access admin endpoint
    const adminEndpointRes = await axios.get(`${API_BASE}/test/admin`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    // Access authority endpoint
    const authorityEndpointRes = await axios.get(`${API_BASE}/test/authority`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    recordResult(
      10,
      'Admin access verification (Accesses both ADMIN and AUTHORITY tiers)',
      adminEndpointRes.status === 200 && authorityEndpointRes.status === 200,
      { adminStatus: adminEndpointRes.status, authorityStatus: authorityEndpointRes.status }
    );
  } catch (err) {
    recordResult(10, 'Admin access verification', false, err.response?.data || err.message);
  }

  // -----------------------------------------------------------------
  // 11. Failed-login audit log verification
  // -----------------------------------------------------------------
  try {
    const failedLog = await prisma.auditLog.findFirst({
      where: {
        action: 'LOGIN_FAILED',
        details: {
          path: ['attemptedEmail'],
          equals: testCitizenEmail
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const isVerified = failedLog !== null && !failedLog.details?.password;
    recordResult(
      11,
      'Failed-login audit log recorded (captures attempt, never logs passwords)',
      isVerified,
      failedLog ? { id: failedLog.id, action: failedLog.action, details: failedLog.details } : 'No log found'
    );
  } catch (err) {
    recordResult(11, 'Failed-login audit log verification', false, err.message);
  }

  // -----------------------------------------------------------------
  // 12. Successful-login audit log verification
  // -----------------------------------------------------------------
  try {
    const successLog = await prisma.auditLog.findFirst({
      where: {
        action: 'LOGIN_SUCCESS',
        details: {
          path: ['email'],
          equals: testCitizenEmail
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const isVerified = successLog !== null && !successLog.details?.token;
    recordResult(
      12,
      'Successful-login audit log recorded (captures role/user, never logs JWTs)',
      isVerified,
      successLog ? { id: successLog.id, action: successLog.action, details: successLog.details } : 'No log found'
    );
  } catch (err) {
    recordResult(12, 'Successful-login audit log verification', false, err.message);
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
