const db = require('../src/config/db');
const Agent = require('../src/models/Agent');
const Job = require('../src/models/Job');
const authService = require('../src/services/authService');
const jobService = require('../src/services/jobService');

async function runVerification() {
  console.log('--- 1. Testing Agent Password Reset ---');
  const agent = Agent.findByUsername('apex-global');
  if (!agent) {
    throw new Error('Agent apex-global not found in database!');
  }
  console.log(`Found agent: ${agent.name} (${agent.agency_name}), id=${agent.id}`);

  // Test password reset
  const testNewPassword = 'ApexVerified@2026';
  Agent.updatePassword(agent.id, testNewPassword);
  console.log('Agent password updated via Agent.updatePassword()');

  // Verify password matches
  const updatedAgent = db.agents.findById(agent.id);
  const isValid = Agent.verifyPassword(testNewPassword, updatedAgent.password_hash);
  console.log(`Password verification check: ${isValid ? 'PASS' : 'FAIL'}`);
  if (!isValid) throw new Error('Password verification failed!');

  // Test agent login via username
  const loginResult1 = authService.agentLogin('apex-global', testNewPassword);
  console.log(`Agent login via username: PASS (token generated: ${loginResult1.token.substring(0, 20)}...)`);

  // Test agent login via email
  const loginResult2 = authService.agentLogin('vikram@apexrecruitment.in', testNewPassword);
  console.log(`Agent login via email: PASS (token generated: ${loginResult2.token.substring(0, 20)}...)`);

  console.log('\n--- 2. Testing Job Openings & Counters ---');
  const activeJobs = jobService.getActiveJobs();
  console.log(`Active live jobs in catalog: ${activeJobs.length}`);
  if (activeJobs.length < 6) {
    throw new Error(`Expected at least 6 active jobs, found ${activeJobs.length}`);
  }
  activeJobs.forEach((j, i) => {
    console.log(`  ${i + 1}. [${j.job_code}] ${j.title} (${j.country}) - ${j.employer_funded ? '100% Funded' : j.salary_inr}`);
  });

  console.log('\n--- 3. Testing Files & Assets ---');
  const fs = require('fs');
  const path = require('path');
  const assets = [
    '../public/favicon.ico',
    '../public/favicon.png',
    '../public/images/og-preview.png',
    '../public/brand/1_Favicons/favicon.ico',
    '../public/brand/1_Favicons/favicon-32x32.png',
    '../public/brand/1_Favicons/apple-touch-icon-180x180.png'
  ];

  for (const asset of assets) {
    const full = path.resolve(__dirname, asset);
    const exists = fs.existsSync(full);
    const size = exists ? fs.statSync(full).size : 0;
    console.log(`  ${path.basename(asset)}: ${exists ? 'EXISTS (' + size + ' bytes)' : 'MISSING'}`);
    if (!exists) throw new Error(`Missing asset: ${asset}`);
  }

  console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY!');
}

runVerification().catch(err => {
  console.error('Verification failed:', err);
  process.exit(1);
});
