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

  // 2. Initial Job Seeding - Runs if no jobs exist to populate real verified overseas quotas
  if (db.jobs && db.jobs.count() === 0) {
    const verifiedJobs = [
      {
        job_code: 'NG-KSA-9041',
        title: 'Heavy Equipment & Multi-Axle Trailer Driver',
        category: 'Logistics & Heavy Driving',
        country: 'Saudi Arabia (NEOM Mega-Project)',
        flag: '🇸🇦',
        salary_inr: '₹85,000 - ₹1,10,000 / month',
        salary_foreign: 'SAR 3,800 - 4,800 + Overtime',
        perks: ['100% Free Visa & Air Ticket', 'Free Camp Accommodation', 'Food Provided', 'Medical & Life Insurance', 'Overtime Extra'],
        employer_funded: 1,
        badge_text: '100% Company-Sponsored Quota',
        image: '/images/job_saudi_driver.jpg',
        description: 'Direct employment quota with top tier infrastructure contractor working on the prestigious NEOM Oxagon / The Line project. Responsible for heavy transport, low-bed multi-axle trailers, and bulk material haulage across designated corridors.',
        requirements: ['Valid Indian Heavy Driving License (HTV) or GCC License', 'Minimum 3 years heavy trailer or construction logistics experience', 'Clean driving record and valid Indian passport (min 18 months validity)', 'GAMCA medical fitness clearance required'],
        age_limit: '24 to 45 Years',
        working_hours: '8 Hours + 2-3 Hours Fixed Overtime',
        eligibility_notes: 'ECR & ECNR passport holders eligible. Trade test & client interview in Mumbai, Delhi & Lucknow.',
        active: 1
      },
      {
        job_code: 'NG-EU-7720',
        title: 'Certified 6G TIG & MIG Industrial Welder',
        category: 'Manufacturing & Industrial',
        country: 'Germany (Europe)',
        flag: '🇩🇪',
        salary_inr: '₹2,40,000 - ₹2,90,000 / month',
        salary_foreign: '€2,650 - €3,200 / month Net',
        perks: ['Fast-Track Work Visa', 'Company Subsidized Housing', 'EU Health Coverage', 'PR Settlement Pathway', 'Annual Flight Allowance'],
        employer_funded: 0,
        badge_text: 'EU Work Permit Track',
        image: '/images/job_germany_welder.jpg',
        description: 'Long-term industrial welding placement with certified steel fabrication and plant assembly units in North Rhine-Westphalia, Germany. High precision welding on carbon steel, alloy pipes, and pressure vessels.',
        requirements: ['Certified 6G Welder (TUV, ASME, or DNV equivalent certificate)', 'Minimum 4 years structural or pipeline welding experience', 'Basic English or German communicative capability', 'Apostille document clearance assistance provided'],
        age_limit: '22 to 42 Years',
        working_hours: '40 Hours/Week (Mon - Fri) + Voluntary Weekend Rates',
        eligibility_notes: 'Trade test mandatory at NG Global accredited training bay prior to embassy file submission.',
        active: 1
      },
      {
        job_code: 'NG-UAE-4412',
        title: 'Commercial MEP & HVAC Maintenance Specialist',
        category: 'Facility Management & Engineering',
        country: 'UAE (Dubai & Abu Dhabi)',
        flag: '🇦🇪',
        salary_inr: '₹92,000 - ₹1,25,000 / month',
        salary_foreign: 'AED 4,000 - 5,500 / month',
        perks: ['Company Furnished Accommodation', 'Transport Provided', 'Annual Paid Leave + Flight', 'Health Insurance', 'Bonus Incentives'],
        employer_funded: 0,
        badge_text: 'Immediate MOHRE Visa',
        image: '/images/job_dubai_electrician.jpg',
        description: 'Maintenance and diagnostics of central chillers, VRF air conditioning systems, and commercial building electrical distribution boards across premium corporate towers in Business Bay, Dubai.',
        requirements: ['ITI / Diploma in Electrical or Refrigeration & Air Conditioning', 'Minimum 3 years Gulf or facility management experience', 'Knowledge of BMS controls, chiller circuits, and single line diagrams', 'Valid passport with min 1 year validity'],
        age_limit: '23 to 44 Years',
        working_hours: '9 Hours/Day (6 Days/Week)',
        eligibility_notes: 'Direct MOHRE e-visa issued in 14-21 working days upon document validation.',
        active: 1
      },
      {
        job_code: 'NG-QAT-3180',
        title: 'High-Voltage Industrial Electrician & Panel Technician',
        category: 'Construction & Infrastructure',
        country: 'Qatar (Doha)',
        flag: '🇶🇦',
        salary_inr: '₹80,000 - ₹1,05,000 / month',
        salary_foreign: 'QAR 3,500 - 4,600 + OT',
        perks: ['100% Employer Funded Visa', 'Single Room Shared Camp', 'Duty Meals Provided', 'Medical Card', 'End of Service Gratuity'],
        employer_funded: 1,
        badge_text: '100% Company-Sponsored Quota',
        image: '/images/job_qatar_construction.jpg',
        description: 'Installation, cable laying, terminations, and switchgear commissioning for major utility and energy infrastructure projects in Ras Laffan and Mesaieed industrial zones.',
        requirements: ['ITI Electrical certificate with wireman license', '3+ years industrial plant or substation experience', 'Familiarity with cable pulling, glanding, and megger testing', 'GAMCA medical fitness'],
        age_limit: '22 to 43 Years',
        working_hours: '8 Hours + 2 Hours Overtime',
        eligibility_notes: 'Embassy authorized work visa issued directly through Qatar Visa Center (QVC).',
        active: 1
      },
      {
        job_code: 'NG-NZ-5510',
        title: 'Heavy Diesel Fleet & Hydraulic Equipment Mechanic',
        category: 'Mechanical & Automotive',
        country: 'New Zealand',
        flag: '🇳🇿',
        salary_inr: '₹2,60,000 - ₹3,30,000 / month',
        salary_foreign: 'NZD $32.00 - $38.50 / hour',
        perks: ['Accredited Employer Work Visa (AEWV)', 'Family Relocation Eligible', 'Comprehensive KiwiCare Health', 'Relocation Support Allowance', 'Tool Allowance'],
        employer_funded: 0,
        badge_text: 'New Zealand AEWV Pathway',
        image: '/images/job_nz_mechanic.jpg',
        description: 'Diagnostics, overhauling, and preventative maintenance for commercial truck fleets (Scania, Volvo, Kenworth) and earthmoving hydraulic machinery across Auckland and Christchurch service depots.',
        requirements: ['Diploma or Degree in Automobile / Mechanical Engineering or Trade Certificate', 'Minimum 5 years verified commercial diesel workshop experience', 'IELTS General band 5.0+ or PTE Academic 36+', 'Clean police clearance certificate (PCC)'],
        age_limit: '25 to 45 Years',
        working_hours: '40-45 Hours/Week',
        eligibility_notes: 'Direct sponsorship under New Zealand Immigration Accredited Employer scheme.',
        active: 1
      },
      {
        job_code: 'NG-USA-8210',
        title: 'Industrial Logistics & Reach Truck Equipment Operator',
        category: 'Logistics & Warehouse',
        country: 'USA (Texas & Georgia)',
        flag: '🇺🇸',
        salary_inr: '₹2,20,000 - ₹2,75,000 / month',
        salary_foreign: 'USD $18.50 - $22.00 / hour',
        perks: ['Official H-2B Certified Visa', 'Company Arranged Housing', 'OSHA Safety Equipment Provided', 'Overtime at 1.5x Rate', 'Guaranteed Weekly Hours'],
        employer_funded: 0,
        badge_text: 'US Dept of Labor Approved',
        image: '/images/job_warehouse_uae.jpg',
        description: 'High-density fulfillment and distribution center logistics. Operation of motorized electric pallet trucks, high-bay reach trucks, and RFID inventory scanners with strict adherence to OSHA safety guidelines.',
        requirements: ['Previous warehouse, supply chain, or material handling experience', 'Forklift / Reach Truck operating proficiency', 'Basic conversational English and physical fitness', 'Valid passport with no prior US immigration violations'],
        age_limit: '21 to 42 Years',
        working_hours: '40 Hours/Week + Overtime',
        eligibility_notes: 'US Department of Labor labor certification filed; consular appointment guidance provided.',
        active: 1
      }
    ];

    verifiedJobs.forEach(job => {
      db.jobs.insert(job);
    });
    console.log(`[DB] Seeded ${verifiedJobs.length} verified live overseas job quotas.`);
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
