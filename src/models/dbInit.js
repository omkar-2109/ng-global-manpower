const db = require('../config/db');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

function initializeDatabase() {
  // 1. Seed or Migrate Strict Administrator
  const hrEmail = env.defaultAdmin.email.toLowerCase();
  const hrSalt = bcrypt.genSaltSync(10);
  const hrHash = bcrypt.hashSync(env.defaultAdmin.password, hrSalt);

  // Check if legacy demo admin exists and remove it
  const legacyAdmin = db.users.findOne(u => u.email === 'admin@ngglobal.com');
  if (legacyAdmin) {
    db.users.delete(legacyAdmin.id);
    console.log('[DB] Removed legacy demo administrator account.');
  }

  // Find or create HR Admin
  const existingHrAdmin = db.users.findOne(u => u.email === hrEmail);
  if (!existingHrAdmin) {
    db.users.insert({
      name: env.defaultAdmin.name,
      email: hrEmail,
      password_hash: hrHash,
      role: 'admin'
    });
    console.log(`[DB] Initialized strict HR administrator: ${hrEmail}`);
  } else {
    // Ensure password hash matches current contact number password
    db.users.update(existingHrAdmin.id, {
      name: env.defaultAdmin.name,
      password_hash: hrHash,
      role: 'admin'
    });
  }

  // 1b. Seed Sample Verified Agent if table empty
  if (db.agents && db.agents.count() === 0) {
    const agentSalt = bcrypt.genSaltSync(10);
    const agentHash = bcrypt.hashSync('Agent@2026', agentSalt);
    db.agents.insert({
      name: 'Vikram Sharma',
      agency_name: 'Apex Global Manpower Services',
      username: 'apex-global',
      email: 'vikram@apexrecruitment.in',
      phone: '+91 98123 45670',
      city: 'Chandigarh',
      state: 'Punjab',
      country: 'India',
      license_no: 'RA/B-0982/PUN/PER/1000+/5/9921',
      status: 'active',
      password_hash: agentHash,
      commission_notes: '15% referral bonus on successful GCC placement',
      candidates_count: 0
    });
    console.log('[DB] Initialized sample recruitment partner agent: apex-global');
  }

  // 2. Job Openings are strictly managed by HR Admin
  // No sample or dummy jobs are seeded here to prevent overwriting live HR data.

  // 3. Candidate Leads are submitted strictly by live portal applicants and partner agents
  // No dummy sample leads are seeded here.

  // 4. Default Settings
  if (!db.settings.get('whatsapp_number')) {
    db.settings.set('whatsapp_number', env.whatsappNumber);
    db.settings.set('helpline_phone', env.helplinePhone);
    db.settings.set('support_email', env.supportEmail);
    db.settings.set('anti_fraud_notice', 'Official visa & medical fees are paid directly to embassies. NG Global maintains transparent regulated service fees, with select 100% employer-funded positions.');
  }
}

module.exports = { initializeDatabase };
