const db = require('../config/db');
const bcrypt = require('bcryptjs');
const env = require('../config/env');

function initializeDatabase() {
  // 1. Seed Administrator
  if (db.users.count() === 0) {
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(env.defaultAdmin.password, salt);
    db.users.insert({
      name: env.defaultAdmin.name,
      email: env.defaultAdmin.email.toLowerCase(),
      password_hash: hash,
      role: 'admin'
    });
    console.log(`[DB] Seeded default administrator account: ${env.defaultAdmin.email}`);
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
