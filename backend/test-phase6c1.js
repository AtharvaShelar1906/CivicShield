/**
 * Phase 6C-1 Verification Suite: Authority Dashboard + Grievance Triage
 */
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('=====================================================');
  console.log('  PHASE 6C-1: AUTHORITY DASHBOARD & TRIAGE SUITE    ');
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

  // 1. Authenticate Authority (Rajesh Sharma) and Citizen (Aarav Mehta)
  let authRes, citizenRes;
  try {
    authRes = await axios.post(`${API_BASE}/auth/login`, {
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

  const authority = authRes.data.user;
  const authorityToken = authRes.data.token;
  const citizenToken = citizenRes.data.token;

  console.log(`Authority authenticated: ${authority.name} (${authority.department || 'Authority'})`);

  // Create a fresh test grievance by citizen for clean triage testing
  let testGrievance;
  try {
    const createRes = await axios.post(
      `${API_BASE}/grievances`,
      {
        title: 'Severe road cave-in and broken sewer cover on 5th Avenue',
        description: 'Large crater opened up overnight on 5th Avenue near the bus stop. Multiple vehicles damaged and danger to pedestrians.',
        location: '5th Avenue Bus Stop'
      },
      { headers: { Authorization: `Bearer ${citizenToken}` } }
    );
    testGrievance = createRes.data.grievance;
    console.log(`Created test grievance #${testGrievance.id.substring(0, 8)} for triage.\n`);
  } catch (err) {
    console.error('Fatal: Failed to create test grievance:', err.response?.data || err.message);
    process.exit(1);
  }

  // Test 1: Authority login & profile verification
  recordResult(
    1,
    'Authority authenticated with AUTHORITY role and department',
    authority.role === 'AUTHORITY' && authority.department !== undefined,
    { name: authority.name, role: authority.role, department: authority.department }
  );

  // Test 2: Authority dashboard data retrieval (real metrics)
  try {
    const listRes = await axios.get(`${API_BASE}/grievances`, {
      headers: { Authorization: `Bearer ${authorityToken}` }
    });
    const grievances = listRes.data.grievances;
    const totalVisible = listRes.data.count;
    const unassigned = grievances.filter((g) => !g.assignedToId).length;
    const assignedToMe = grievances.filter((g) => g.assignedToId === authority.id).length;

    recordResult(
      2,
      'Authority retrieves visible grievance queue with real metric data',
      listRes.status === 200 && Array.isArray(grievances) && totalVisible > 0,
      { totalVisible, unassigned, assignedToMe }
    );
  } catch (err) {
    recordResult(2, 'Authority retrieves visible grievance queue', false, err.response?.data || err.message);
  }

  // Test 3: Authority category lookup
  let allCategories = [];
  try {
    const catRes = await axios.get(`${API_BASE}/grievances/categories`, {
      headers: { Authorization: `Bearer ${authorityToken}` }
    });
    allCategories = catRes.data.categories;
    recordResult(
      3,
      'Authority retrieves active grievance categories for triage assignment',
      catRes.status === 200 && Array.isArray(allCategories) && allCategories.length >= 5,
      { categoryCount: allCategories.length }
    );
  } catch (err) {
    recordResult(3, 'Authority category lookup', false, err.response?.data || err.message);
  }

  // Test 4: Authority active officers lookup
  try {
    const authListRes = await axios.get(`${API_BASE}/grievances/authorities`, {
      headers: { Authorization: `Bearer ${authorityToken}` }
    });
    recordResult(
      4,
      'Authority retrieves active authority officers list for assignment',
      authListRes.status === 200 && Array.isArray(authListRes.data.authorities) && authListRes.data.authorities.length > 0,
      { officerCount: authListRes.data.count }
    );
  } catch (err) {
    recordResult(4, 'Authority active officers lookup', false, err.response?.data || err.message);
  }

  // Test 5: Authority retrieves single grievance with official data + advisory AI
  try {
    const singleRes = await axios.get(`${API_BASE}/grievances/${testGrievance.id}`, {
      headers: { Authorization: `Bearer ${authorityToken}` }
    });
    const g = singleRes.data.grievance;
    const hasOfficial = g.id && g.title && g.status === 'SUBMITTED' && g.priority === 'MEDIUM';
    const hasAI = g.analysis && g.analysis.predictedCategory && g.analysis.severityScore !== undefined;

    recordResult(
      5,
      'Authority detail retrieval separates official record and advisory AI analysis',
      singleRes.status === 200 && hasOfficial && hasAI,
      {
        officialStatus: g.status,
        officialPriority: g.priority,
        aiCategory: g.analysis?.predictedCategory,
        aiPriority: g.analysis?.predictedPriority
      }
    );
  } catch (err) {
    recordResult(5, 'Authority detail retrieval', false, err.response?.data || err.message);
  }

  // Test 6: Authority priority triage (Update official priority to CRITICAL)
  try {
    const prioRes = await axios.patch(
      `${API_BASE}/grievances/${testGrievance.id}/priority`,
      { priority: 'CRITICAL' },
      { headers: { Authorization: `Bearer ${authorityToken}` } }
    );
    recordResult(
      6,
      'Authority updates official priority to CRITICAL',
      prioRes.status === 200 && prioRes.data.grievance.priority === 'CRITICAL',
      { updatedPriority: prioRes.data.grievance.priority }
    );
  } catch (err) {
    recordResult(6, 'Authority updates official priority', false, err.response?.data || err.message);
  }

  // Test 7: Authority category triage (Update official category)
  try {
    const roadsCategory = allCategories.find((c) => c.name.includes('Roads')) || allCategories[0];
    const catUpdateRes = await axios.patch(
      `${API_BASE}/grievances/${testGrievance.id}/category`,
      { categoryId: roadsCategory.id },
      { headers: { Authorization: `Bearer ${authorityToken}` } }
    );
    recordResult(
      7,
      'Authority assigns authoritative category',
      catUpdateRes.status === 200 && catUpdateRes.data.grievance.categoryId === roadsCategory.id,
      { categoryName: roadsCategory.name }
    );
  } catch (err) {
    recordResult(7, 'Authority assigns authoritative category', false, err.response?.data || err.message);
  }

  // Test 8: Authority assignment (Assign to authority user, transitions status to ASSIGNED)
  try {
    const assignRes = await axios.patch(
      `${API_BASE}/grievances/${testGrievance.id}/assign`,
      { assignedToId: authority.id },
      { headers: { Authorization: `Bearer ${authorityToken}` } }
    );
    recordResult(
      8,
      'Authority assigns unassigned grievance (transitions status to ASSIGNED)',
      assignRes.status === 200 &&
        assignRes.data.grievance.assignedToId === authority.id &&
        assignRes.data.grievance.status === 'ASSIGNED',
      { assignedToId: assignRes.data.grievance.assignedToId, newStatus: assignRes.data.grievance.status }
    );
  } catch (err) {
    recordResult(8, 'Authority assigns unassigned grievance', false, err.response?.data || err.message);
  }

  // Test 9: Authority workflow status transition: ASSIGNED -> IN_PROGRESS
  try {
    const inProgRes = await axios.patch(
      `${API_BASE}/grievances/${testGrievance.id}/status`,
      { status: 'IN_PROGRESS' },
      { headers: { Authorization: `Bearer ${authorityToken}` } }
    );
    recordResult(
      9,
      'Authority transitions workflow status from ASSIGNED to IN_PROGRESS',
      inProgRes.status === 200 && inProgRes.data.grievance.status === 'IN_PROGRESS',
      { newStatus: inProgRes.data.grievance.status }
    );
  } catch (err) {
    recordResult(9, 'Authority transitions to IN_PROGRESS', false, err.response?.data || err.message);
  }

  // Test 10: Authority workflow status transition: IN_PROGRESS -> RESOLVED (sets resolvedAt)
  try {
    const resRes = await axios.patch(
      `${API_BASE}/grievances/${testGrievance.id}/status`,
      { status: 'RESOLVED' },
      { headers: { Authorization: `Bearer ${authorityToken}` } }
    );
    recordResult(
      10,
      'Authority resolves grievance (sets status RESOLVED and resolvedAt timestamp)',
      resRes.status === 200 &&
        resRes.data.grievance.status === 'RESOLVED' &&
        resRes.data.grievance.resolvedAt !== null,
      { newStatus: resRes.data.grievance.status, resolvedAt: resRes.data.grievance.resolvedAt }
    );
  } catch (err) {
    recordResult(10, 'Authority resolves grievance', false, err.response?.data || err.message);
  }

  // Test 11: Invalid status transition rejection (RESOLVED -> SUBMITTED rejected with HTTP 400)
  try {
    await axios.patch(
      `${API_BASE}/grievances/${testGrievance.id}/status`,
      { status: 'SUBMITTED' },
      { headers: { Authorization: `Bearer ${authorityToken}` } }
    );
    recordResult(11, 'Invalid status transition rejected', false, 'Expected HTTP 400 Bad Request');
  } catch (err) {
    recordResult(
      11,
      'Invalid status transition rejected by backend state machine (HTTP 400 Bad Request)',
      err.response?.status === 400,
      { status: err.response?.status, message: err.response?.data?.message }
    );
  }

  // Test 12: Citizen blocked from authority endpoints (HTTP 403 Forbidden)
  try {
    await axios.get(`${API_BASE}/grievances`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    recordResult(12, 'Citizen blocked from authority queue', false, 'Expected 403 Forbidden');
  } catch (err) {
    recordResult(
      12,
      'Citizen blocked from authority triage queue (HTTP 403 Forbidden enforced)',
      err.response?.status === 403,
      { status: err.response?.status, message: err.response?.data?.message }
    );
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
