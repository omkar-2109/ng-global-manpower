/**
 * NG Global Manpower Services — Comprehensive Test Suite & Fixture Validator
 * Runs full fixture integrity checks, service unit tests, and live HTTP integration tests.
 */

const assert = require('assert');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Load environment and DB
const env = require('../src/config/env');
const db = require('../src/config/db');
const { initializeDatabase } = require('../src/models/dbInit');

// Models & Services
const User = require('../src/models/User');
const Agent = require('../src/models/Agent');
const Job = require('../src/models/Job');
const Lead = require('../src/models/Lead');
const authService = require('../src/services/authService');
const jobService = require('../src/services/jobService');
const leadService = require('../src/services/leadService');

let passedTests = 0;
let failedTests = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    -> ${err.message}`);
    failedTests++;
  }
}

async function runTestSuite() {
  console.log('\n===============================================================');
  console.log('  NG GLOBAL MANPOWER SERVICES — FIXTURE & TEST CASE RUNNER');
  console.log('===============================================================\n');

  // STEP 0: Initialize database fixtures
  console.log('--- SUITE 1: DATABASE FIXTURES & SEEDING INTEGRITY ---');
  initializeDatabase();

  await test('Default HR Administrator fixture exists and has correct email & role', () => {
    const admin = db.users.findOne(u => u.email === env.defaultAdmin.email.toLowerCase());
    assert(admin, 'Default HR admin must exist in users table');
    assert.strictEqual(admin.role, 'admin');
    assert(admin.password_hash, 'Admin must have a password_hash');
    assert(User.verifyPassword(env.defaultAdmin.password, admin.password_hash), 'Admin password hash must match env.defaultAdmin.password');
  });

  await test('Sample Recruitment Agent fixture (apex-global) exists with active status', () => {
    const agent = db.agents.findOne(a => a.username === 'apex-global');
    assert(agent, 'Agent apex-global must exist in agents table');
    assert.strictEqual(agent.status, 'active');
    assert.strictEqual(agent.country, 'India');
    assert(agent.email, 'Agent must have an email');
    assert(agent.license_no, 'Agent must have a license number');
  });

  await test('Job catalog is controlled by HR and not pre-seeded with sample dummy jobs on boot', () => {
    const jobs = Job.all(false);
    assert(Array.isArray(jobs), 'Job catalog must be an array');
    const dummyCodes = ['NG-KSA-9041', 'NG-EU-7720', 'NG-UAE-4412', 'NG-QAT-3180', 'NG-NZ-5510', 'NG-USA-8210'];
    const foundDummy = jobs.some(j => dummyCodes.includes(j.job_code));
    assert(!foundDummy, 'Hardcoded sample dummy jobs must NOT be auto-seeded into job catalog');
  });

  await test('Lead table stores candidate applicant dossiers without dummy sample leads', () => {
    const leads = db.leads.all();
    assert(Array.isArray(leads), 'Leads must be an array');
    const dummyNames = ['Rajesh Kumar Verma', 'Gurpreet Singh', 'Mohammed Mansoor'];
    const foundDummyLead = leads.some(l => dummyNames.includes(l.full_name));
    assert(!foundDummyLead, 'Hardcoded dummy sample leads must NOT be auto-seeded into leads table');
  });

  await test('System settings fixtures are initialized with support and helpline info', () => {
    assert(db.settings.get('whatsapp_number'), 'whatsapp_number setting must be present');
    assert(db.settings.get('helpline_phone'), 'helpline_phone setting must be present');
    assert(db.settings.get('support_email'), 'support_email setting must be present');
    assert(db.settings.get('anti_fraud_notice'), 'anti_fraud_notice setting must be present');
  });

  console.log('\n--- SUITE 2: AUTHENTICATION & SECURITY SERVICES ---');

  await test('Admin login succeeds with valid credentials and returns JWT', () => {
    const result = authService.adminLogin(env.defaultAdmin.email, env.defaultAdmin.password);
    assert(result && result.token, 'Must return JWT token');
    assert.strictEqual(result.user.email, env.defaultAdmin.email.toLowerCase());
    const decoded = authService.verifyToken(result.token);
    assert.strictEqual(decoded.id, result.user.id);
    assert.strictEqual(decoded.role, 'admin');
  });

  await test('Admin login fails with invalid password', () => {
    assert.throws(() => {
      authService.adminLogin(env.defaultAdmin.email, 'WrongPassword@9999');
    }, /Invalid HR credentials/i);
  });

  await test('Agent login succeeds via username', () => {
    const agent = Agent.findByUsername('apex-global');
    // Ensure agent password matches known test password
    Agent.updatePassword(agent.id, 'AgentTest@2026');
    const result = authService.agentLogin('apex-global', 'AgentTest@2026');
    assert(result && result.token, 'Must return JWT token');
    assert.strictEqual(result.agent.username, 'apex-global');
    const decoded = authService.verifyAgentToken(result.token);
    assert.strictEqual(decoded.id, agent.id);
    assert.strictEqual(decoded.role, 'agent');
  });

  await test('Agent login succeeds via email address', () => {
    const agent = Agent.findByUsername('apex-global');
    const result = authService.agentLogin(agent.email, 'AgentTest@2026');
    assert(result && result.token, 'Must return JWT token');
    assert.strictEqual(result.agent.id, agent.id);
  });

  await test('Agent login fails with incorrect password', () => {
    assert.throws(() => {
      authService.agentLogin('apex-global', 'IncorrectPass_123');
    }, /Invalid password/i);
  });

  await test('Tampered or malformed JWT token is rejected safely', () => {
    const badToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidSignature';
    assert.strictEqual(authService.verifyToken(badToken), null);
    assert.strictEqual(authService.verifyAgentToken(badToken), null);
  });

  console.log('\n--- SUITE 3: JOB SERVICE & MARKET METRICS ---');

  await test('jobService.getActiveJobs() handles active list and caching', () => {
    const active = jobService.getActiveJobs(true);
    assert(Array.isArray(active), 'Should return an array');
    const cached = jobService.getActiveJobs();
    assert.strictEqual(active, cached, 'Should return cached array on consecutive calls within TTL');
  });

  await test('jobService.getLiveMarketStats() calculates counts and regional buckets safely', () => {
    const stats = jobService.getLiveMarketStats();
    assert(typeof stats.totalActive === 'number', 'Total active jobs count must be a number');
    assert(typeof stats.countriesCount === 'number', 'Countries count must be a number');
    assert(typeof stats.sponsoredCount === 'number', 'Sponsored count must be a number');
    assert(stats.regions && typeof stats.regions.middleEast === 'number');
  });

  await test('jobService CRUD lifecycle (create -> update -> delete)', () => {
    const testJob = jobService.createJob({
      title: 'Temporary Test Rig Welder',
      category: 'Manufacturing',
      country: 'Norway',
      salary_inr: '₹2,50,000 / month',
      perks: ['Housing', 'Flight'],
      requirements: ['Valid Certification'],
      active: 1
    });
    assert(testJob && testJob.id, 'Job should be created with auto-generated id');
    assert(testJob.job_code.startsWith('NG-NOR-'), 'Job code should be automatically prefixed');

    // Update
    const updated = jobService.updateJob(testJob.id, { title: 'Updated Test Rig Welder' });
    assert.strictEqual(updated.title, 'Updated Test Rig Welder');

    // Delete
    const deleted = jobService.deleteJob(testJob.id);
    assert(deleted, 'Job should be deleted successfully');
    assert.strictEqual(jobService.getJobById(testJob.id), null);
  });

  console.log('\n--- SUITE 4: CANDIDATE LEAD & CRM PIPELINE ---');

  await test('leadService.createLead() validates and stores new candidate assessment', () => {
    const result = leadService.createLead({
      full_name: 'Test Candidate Verma',
      phone: '+91 98989 12345',
      trade: 'Logistics & Heavy Driving',
      destination: 'Saudi Arabia (NEOM)',
      experience: '4 Years',
      city: 'Delhi',
      source: 'test_suite'
    });
    assert(result && result.lead && result.lead.id, 'New lead should have an ID');
    assert.strictEqual(result.lead.status, 'New', 'Initial lead status must be "New"');
    assert.strictEqual(result.lead.full_name, 'Test Candidate Verma');
    assert(result.whatsappUrl.includes('https://wa.me/'), 'Should generate WhatsApp launch URL');

    // Cleanup
    db.leads.delete(result.lead.id);
  });

  await test('leadService.exportToCsv() generates properly formatted CSV export', () => {
    const csv = leadService.exportToCsv();
    assert(typeof csv === 'string');
    assert(csv.includes('ID,Date,Type,Full Name,Phone'), 'CSV should include header row');
    assert(csv.split('\n').length >= 3, 'CSV should contain records');
  });

  console.log('\n--- SUITE 5: STATIC ASSETS & BRANDING INTEGRITY ---');

  const requiredAssets = [
    'public/favicon.ico',
    'public/favicon.png',
    'public/images/og-preview.png',
    'public/brand/1_Favicons/favicon.ico',
    'public/brand/1_Favicons/favicon-32x32.png',
    'public/brand/1_Favicons/apple-touch-icon-180x180.png',
    'public/brand/2_Web_Navbar_Logos/logo-nav-standard.png',
    'public/brand/5_Full_Corporate_Master/ng-corporate-full-1200px.png',
    'public/css/main.css',
    'public/js/main.js',
    'public/js/wizard.js'
  ];

  for (const relPath of requiredAssets) {
    await test(`Required asset exists and is non-empty: ${relPath}`, () => {
      const fullPath = path.resolve(__dirname, '..', relPath);
      assert(fs.existsSync(fullPath), `Missing file: ${relPath}`);
      const stats = fs.statSync(fullPath);
      assert(stats.size > 0, `File ${relPath} is empty`);
    });
  }

  console.log('\n--- SUITE 6: LIVE HTTP SERVER & ENDPOINT INTEGRATION ---');

  // Launch express server dynamically on ephemeral port for integration testing
  const { app } = require('../server');
  const testPort = 3088;
  const testServer = http.createServer(app);

  await new Promise((resolve, reject) => {
    testServer.listen(testPort, resolve);
    testServer.on('error', reject);
  });

  console.log(`  [HTTP Test Server running at http://localhost:${testPort}]`);
  const baseUrl = `http://localhost:${testPort}`;

  try {
    // Test 1: GET /health
    await test('GET /health returns 200 with JSON health status', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'healthy');
      assert.strictEqual(data.service, env.appName);
    });

    // Test 2: GET / (Homepage SSR)
    await test('GET / (Homepage SSR) returns 200 HTML with brand and jobs', async () => {
      const res = await fetch(`${baseUrl}/`);
      assert.strictEqual(res.status, 200);
      const html = await res.text();
      assert(html.includes('NG Global') || html.includes('ng-global'), 'Homepage must contain brand name');
      assert(html.includes('<!DOCTYPE html>') || html.includes('<html'), 'Must be valid HTML document');
    });

    // Test 3: GET /jobs
    await test('GET /jobs returns 200 HTML job directory', async () => {
      const res = await fetch(`${baseUrl}/jobs`);
      assert.strictEqual(res.status, 200);
      const html = await res.text();
      assert(html.includes('job') || html.includes('Job'), 'Jobs page must render job listings');
    });

    // Test 4: GET /agency/apex-global
    await test('GET /agency/apex-global returns 200 for verified agency profile', async () => {
      const res = await fetch(`${baseUrl}/agency/apex-global`);
      assert.strictEqual(res.status, 200);
      const html = await res.text();
      assert(html.includes('Apex Global') || html.includes('Vikram Sharma'), 'Agency profile must render agency details');
    });

    // Test 5: GET /api/v1/jobs
    await test('GET /api/v1/jobs returns JSON list of live openings', async () => {
      const res = await fetch(`${baseUrl}/api/v1/jobs`);
      assert.strictEqual(res.status, 200);
      const json = await res.json();
      assert(json.success, 'API response must have success: true');
      assert(Array.isArray(json.jobs), 'API jobs must be an array');
      assert(typeof json.count === 'number', 'Count must be a number');
      assert.strictEqual(json.count, json.jobs.length, 'Count must match jobs array length');
    });

    // Test 6: POST /api/v1/leads (validation & ingestion)
    await test('POST /api/v1/leads accepts valid candidate application', async () => {
      const res = await fetch(`${baseUrl}/api/v1/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: 'Harpreet Singh Test',
          phone: '9876543219',
          trade: 'Welding & Heavy Fabrication',
          destination: 'Europe (Germany, Poland, UK)',
          experience: '5+ Years GCC / Overseas',
          city: 'Amritsar'
        })
      });
      assert.strictEqual(res.status, 201);
      const json = await res.json();
      assert(json.success, 'Response must be success: true');
      assert(json.lead && json.lead.id, 'Lead must be created with ID');

      // Clean up created lead
      db.leads.delete(json.lead.id);
    });

    // Test 7: POST /api/v1/leads rejects invalid payload
    await test('POST /api/v1/leads rejects empty or missing required fields', async () => {
      const res = await fetch(`${baseUrl}/api/v1/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: 'A' }) // Invalid short name, missing phone, trade, etc.
      });
      assert.strictEqual(res.status, 400);
      const json = await res.json();
      assert.strictEqual(json.success, false);
      assert(json.errors && json.errors.length > 0, 'Must return validation error list');
    });

    // Test 8: Protected Admin Route without cookie redirects to /admin/login
    await test('GET /admin/dashboard without authentication redirects to login', async () => {
      const res = await fetch(`${baseUrl}/admin/dashboard`, { redirect: 'manual' });
      assert([301, 302, 303, 307].includes(res.status), `Expected redirect status, got ${res.status}`);
      const location = res.headers.get('location');
      assert(location && location.includes('/admin/login'), `Location header should point to /admin/login, got: ${location}`);
    });

    // Test 9: Protected Agent Route without cookie redirects to /agent/login
    await test('GET /agent/dashboard without authentication redirects to login', async () => {
      const res = await fetch(`${baseUrl}/agent/dashboard`, { redirect: 'manual' });
      assert([301, 302, 303, 307].includes(res.status), `Expected redirect status, got ${res.status}`);
      const location = res.headers.get('location');
      assert(location && location.includes('/agent/login'), `Location header should point to /agent/login, got: ${location}`);
    });

    // Test 10: 404 handler returns branded error page
    await test('GET /route-that-does-not-exist returns 404 status', async () => {
      const res = await fetch(`${baseUrl}/route-that-does-not-exist`);
      assert.strictEqual(res.status, 404);
    });

  } finally {
    await new Promise(resolve => testServer.close(resolve));
    console.log('  [HTTP Test Server shut down cleanly]');
  }

  console.log('\n===============================================================');
  console.log(`  TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal Test Suite Error:', err);
  process.exit(1);
});
