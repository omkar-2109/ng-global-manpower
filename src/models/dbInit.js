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

  // 2. Seed Jobs
  if (db.jobs.count() === 0) {
    const initialJobs = [
      {
        job_code: 'NG-KSA-9041',
        title: 'Heavy Trailer & Tanker Driver',
        category: 'Logistics & Heavy Driving',
        country: 'Saudi Arabia (NEOM Mega Project)',
        flag: '🇸🇦',
        salary_inr: '₹85,000 – ₹1,25,000 / mo',
        salary_foreign: 'SAR 3,800 – 5,500',
        perks: ['Free Food', 'Bachelor Accomm.', '10-15 Days Visa', 'Indian / GCC Heavy DL'],
        employer_funded: 0,
        badge_text: 'Fast-Track Gulf',
        active: 1
      },
      {
        job_code: 'NG-EU-7720',
        title: '6G TIG & ARC Pipe Welder',
        category: 'Manufacturing & Industrial',
        country: 'Germany & Poland (EU Industrial)',
        flag: '🇩🇪',
        salary_inr: '₹1,45,000 – ₹2,30,000 / mo',
        salary_foreign: '€1,600 – €2,500',
        perks: ['EU Work Permit', 'Embassy Appointment', 'Overtime Extra', 'Trade Test Req.'],
        employer_funded: 0,
        badge_text: 'High Earning',
        active: 1
      },
      {
        job_code: 'NG-UAE-5512',
        title: 'Commercial MEP Electrician & Plumber',
        category: 'Electrical, Plumbing & MEP',
        country: 'UAE (Dubai / Abu Dhabi Projects)',
        flag: '🇦🇪',
        salary_inr: '₹70,000 – ₹1,10,000 / mo',
        salary_foreign: 'AED 3,100 – 4,800',
        perks: ['Free Transport', 'Medical Card', '7-12 Days Track', '2-Year Contract'],
        employer_funded: 0,
        badge_text: 'Active Quotas',
        active: 1
      },
      {
        job_code: 'NG-USA-3318',
        title: 'Hospitality & Resort Services Crew',
        category: 'Hospitality & Catering',
        country: 'United States (Seasonal H-2B)',
        flag: '🇺🇸',
        salary_inr: '₹1,80,000 – ₹2,60,000 / mo',
        salary_foreign: '$2,200 – $3,200',
        perks: ['US Consulate Visa', 'Shift Meals', 'Legal USD Salary', 'Seasonal Placement'],
        employer_funded: 0,
        badge_text: 'Seasonal USD',
        active: 1
      },
      {
        job_code: 'NG-NZ-8840',
        title: 'Heavy Equipment & Crane Mechanic',
        category: 'Manufacturing & Industrial',
        country: 'New Zealand & Australia',
        flag: '🇳🇿',
        salary_inr: '₹1,70,000 – ₹2,50,000 / mo',
        salary_foreign: 'NZ$ 3,400 – $5,000',
        perks: ['Accredited Employer', 'Essential Skills', 'Subsidized Stay', 'Direct Biometrics'],
        employer_funded: 0,
        badge_text: 'Essential Skill',
        active: 1
      },
      {
        job_code: 'NG-QAT-1190',
        title: 'Construction Helpers & Riggers',
        category: 'Construction & Infrastructure',
        country: 'Qatar (Infrastructure & Industrial)',
        flag: '🇶🇦',
        salary_inr: '₹55,000 – ₹75,000 / mo',
        salary_foreign: 'QAR 2,400 – 3,300',
        perks: ['Free Air Ticket', 'Zero Service Charge', 'Camp Accommodation', 'Catering Provided'],
        employer_funded: 1,
        badge_text: '100% Employer Funded',
        active: 1,
        image: '/images/job_qatar_construction.jpg'
      },
      {
        job_code: 'NG-UAE-6210',
        title: 'Warehouse Helper & Inventory Handler',
        category: 'Warehouse & Logistics',
        country: 'UAE (Dubai Logistics City)',
        flag: '🇦🇪',
        salary_inr: '₹45,000 – ₹62,000 / mo',
        salary_foreign: 'AED 1,800 – 2,400',
        perks: ['Accommodation Included', 'Medical Included', 'Transport Provided', 'Duty Meals'],
        employer_funded: 1,
        badge_text: '100% Free Quota',
        active: 1,
        image: '/images/job_warehouse_uae.jpg'
      },
      {
        job_code: 'NG-GULF-4491',
        title: 'Oil & Gas Piping & Valve Technician',
        category: 'Oil & Gas',
        country: 'Kuwait & Qatar (Refinery Projects)',
        flag: '🇰🇼',
        salary_inr: '₹1,20,000 – ₹1,85,000 / mo',
        salary_foreign: 'KWD 420 – 650',
        perks: ['Free Food & Camp', 'Overtime Extra', 'Flight Included', 'Safety Bonus'],
        employer_funded: 0,
        badge_text: 'Refinery Quota',
        active: 1,
        image: '/images/job_oilgas_gulf.jpg'
      }
    ];

    for (const job of initialJobs) {
      db.jobs.insert(job);
    }
    console.log(`[DB] Seeded ${initialJobs.length} verified overseas job openings.`);
  }

  // Ensure Singapore Quotas are active matching user requirements
  const hasSingaporeJob = db.jobs.findOne(j => (j.country || '').includes('Singapore'));
  if (!hasSingaporeJob) {
    const singaporeJobs = [
      {
        job_code: 'NG-SGP-8821',
        title: 'Hospital Patient Care & Nursing Attendant',
        category: 'Hospitality & Catering',
        country: 'Singapore (E-Pass & S-Pass)',
        flag: '🇸🇬',
        salary_inr: '₹1,38,000 – ₹1,70,000 / mo',
        salary_foreign: 'SGD 2,200 (Hike based on performance)',
        perks: ['Patient Care Duties', 'Medicine Timing Support', 'Duty Uniform Provided', 'Performance Hike 🔥', 'Medical Insurance'],
        employer_funded: 0,
        badge_text: 'E-PASS / S-PASS QUOTA',
        active: 1,
        image: '/brand/1_Complete_Color_Logo/ng-logo-complete-color-1024px.png'
      },
      {
        job_code: 'NG-SGP-5514',
        title: 'Restaurant Staff (Waiter, Chef & Kitchen Worker)',
        category: 'Hospitality & Catering',
        country: 'Singapore (Work Permit)',
        flag: '🇸🇬',
        salary_inr: '₹1,07,000 – ₹1,20,000 / mo',
        salary_foreign: 'SGD 1,700 – 1,900',
        perks: ['Waiter: $1700', 'Chef: $1900', 'Kitchen: $1800', 'Complimentary Meals', '2 Days Off/Month', 'Mon-Fri 9:30AM-7:30PM'],
        employer_funded: 0,
        badge_text: 'RESTAURANT WORK PERMIT',
        active: 1,
        image: '/brand/1_Complete_Color_Logo/ng-logo-complete-color-1024px.png'
      },
      {
        job_code: 'NG-SGP-3390',
        title: 'Supermarket Assistant & Retail Storekeeper',
        category: 'Logistics & Heavy Driving',
        country: 'Singapore (Work Permit)',
        flag: '🇸🇬',
        salary_inr: '₹1,26,000 / mo (Total Package)',
        salary_foreign: 'SGD 1,600 Basic + $400 Room',
        perks: ['Basic $1600', 'Room $400 Allowance', '10 Hours Duty', '2 Days Off/Month', 'Visa for Indians/Bangalis/Nepalis'],
        employer_funded: 0,
        badge_text: 'SUPERMARKET PERMIT',
        active: 1,
        image: '/brand/1_Complete_Color_Logo/ng-logo-complete-color-1024px.png'
      }
    ];
    for (const j of singaporeJobs) {
      db.jobs.insert(j);
    }
    console.log(`[DB] Seeded ${singaporeJobs.length} Singapore employer job quotas.`);
  }

  // 3. Seed Sample Leads
  if (db.leads.count() === 0) {
    const sampleLeads = [
      {
        full_name: 'Rajesh Kumar Verma',
        phone: '+91 98234 11223',
        trade: 'Construction & Infrastructure',
        destination: 'Gulf Countries (UAE, Saudi, Qatar)',
        experience: '3 to 5 Years',
        city: 'Lucknow, UP',
        source: 'eligibility_wizard',
        status: 'Contacted',
        notes: 'Interested in KSA NEOM. GAMCA medical completed.'
      },
      {
        full_name: 'Gurpreet Singh',
        phone: '+91 98765 99881',
        trade: 'Manufacturing & Industrial',
        destination: 'Europe (Germany, Poland, UK)',
        experience: '5+ Years GCC / Overseas',
        city: 'Jalandhar, Punjab',
        source: 'quick_apply',
        job_code: 'NG-EU-7720',
        status: 'In-Progress',
        notes: '6G Welder certificate submitted. Trade test scheduled.'
      },
      {
        full_name: 'Mohammed Mansoor',
        phone: '+91 97451 22334',
        trade: 'Logistics & Heavy Driving',
        destination: 'Gulf Countries (UAE, Saudi, Qatar)',
        experience: '5+ Years GCC / Overseas',
        city: 'Malappuram, Kerala',
        source: 'quick_apply',
        job_code: 'NG-KSA-9041',
        status: 'New',
        notes: 'Valid Qatar and Saudi heavy driving license.'
      }
    ];

    for (const lead of sampleLeads) {
      db.leads.insert(lead);
    }
    console.log(`[DB] Seeded ${sampleLeads.length} sample candidate leads for admin portal.`);
  }

  // 4. Default Settings
  if (!db.settings.get('whatsapp_number')) {
    db.settings.set('whatsapp_number', env.whatsappNumber);
    db.settings.set('helpline_phone', env.helplinePhone);
    db.settings.set('support_email', env.supportEmail);
    db.settings.set('anti_fraud_notice', 'Official visa & medical fees are paid directly to embassies. NG Global maintains transparent regulated service fees, with select 100% employer-funded positions.');
  }
}

module.exports = { initializeDatabase };
