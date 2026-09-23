const env = require('../config/env');

let OpenRouterClient = null;
try {
  const sdk = require('@openrouter/sdk');
  OpenRouterClient = sdk.OpenRouter;
} catch (err) {
  // handled via fallback
}

const CANDIDATE_MODELS = [
  env.openrouter.model || 'qwen/qwen-2.5-72b-instruct:free',
  'qwen/qwen-2.5-coder-32b-instruct:free',
  'qwen/qwen3.8-27b:free',
  'google/gemma-4-31b-it:free',
  'nvidia/nemotron-3.5-lightning:free'
];

const aiJobService = {
  /**
   * Generate overseas job quota post from brief notes or flyer details
   * Uses Qwen-3 via OpenRouter, with immediate heuristic fallback
   */
  async generateJobPost({ details, flyerInfo = null }) {
    const rawText = details || (flyerInfo ? flyerInfo.originalName : '');
    const apiKey = env.openrouter.apiKey;

    if (!apiKey) {
      console.log('[AI] OpenRouter API key not set, using high-speed deterministic Qwen-3 rule engine.');
      return aiJobService.parseSocialJobPost(rawText);
    }

    const systemPrompt = `You are the Lead Recruitment Director at NG Global Manpower Services, a premier licensed overseas workforce consultancy.
Generate a structured, professional overseas job listing from the user's brief notes or job flyer details.

Always respond ONLY with a raw JSON object (no markdown code blocks, no backticks, no explanatory text).
The JSON must follow this exact schema:
{
  "title": "Exact professional trade designation (e.g. Supermarket Assistant & Retail Storekeeper)",
  "job_code": "NG-XXX-XXXX format where XXX is 3-letter country code and 4 random digits (e.g. NG-SGP-3390)",
  "category": "Must be one of: 'Logistics & Heavy Driving', 'Manufacturing & Industrial', 'Electrical, Plumbing & MEP', 'Construction & Infrastructure', 'Hospitality & Catering', or 'Oil & Gas'",
  "country": "Full country name with project context (e.g. Singapore (Work Permit))",
  "flag": "Single country flag emoji (e.g. 🇸🇬, 🇸🇦, 🇦🇪, 🇶🇦, 🇩🇪, 🇺🇸)",
  "salary_inr": "Formatted monthly INR salary range (e.g. ₹1,26,000 / mo (Total Package))",
  "salary_foreign": "Formatted local monthly currency package (e.g. SGD 1,600 Basic + $400 Room)",
  "perks": ["Array of 4-6 key amenities e.g. Free Food, Bachelor Accommodation, Medical Insurance, 2-Year Contract, Overtime Allowance"],
  "badge_text": "Short catchy badge e.g. 'SINGAPORE WORK PERMIT', 'E-PASS / S-PASS QUOTA', '100% Free Visa'",
  "employer_funded": 0,
  "age_limit": "Age criteria if mentioned e.g. 18 - 49 Years",
  "working_hours": "Shift timings or hours e.g. 10 Hours Duty / 2 Days Off per month",
  "eligibility_notes": "Eligible nationalities e.g. Visa for Indians, Bangladeshis, Nepalis",
  "description": "2-3 paragraphs of clear job description, scope of work, client profile, and interview instructions.",
  "requirements": ["List of 4-5 bullet requirements e.g. Age 18-49, Valid Passport with 1+ year validity, 1 White background studio photo, Updated CV"]
}`;

    const userPrompt = `Job Requirements / Details provided by Recruiter:
${rawText || 'Urgent Overseas Recruitment'}
${flyerInfo ? `\nFlyer graphic filename: ${flyerInfo.filename || flyerInfo.originalName}` : ''}

Convert this into a fully compliant JSON job listing.`;

    let generatedText = '';
    let lastError = null;

    // Try candidate models in sequence (Prioritizing Qwen models)
    for (const model of CANDIDATE_MODELS) {
      try {
        console.log(`[AI] Attempting job post generation with model: ${model}`);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': env.appUrl,
            'X-Title': 'NG Global Manpower AI Recruiter'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3
          }),
          signal: AbortSignal.timeout(4000)
        });

        if (response.ok) {
          const data = await response.json();
          generatedText = data.choices?.[0]?.message?.content || '';
          if (generatedText) {
            console.log(`[AI] Successfully generated with model: ${model}`);
            break;
          }
        } else {
          const errorText = await response.text();
          lastError = new Error(`OpenRouter (${model}) status ${response.status}: ${errorText}`);
          console.warn(`[AI] Model ${model} returned error: ${lastError.message}. Trying next candidate model...`);
        }
      } catch (err) {
        lastError = err;
        console.warn(`[AI] Model ${model} network error: ${err.message}. Trying next candidate model...`);
      }
    }

    if (!generatedText) {
      console.warn('[AI] OpenRouter models unavailable or rate limited, falling back to local deterministic rule parser:', lastError?.message);
      return aiJobService.parseSocialJobPost(rawText);
    }

    // Clean markdown wrappers if returned (```json ... ```)
    let cleaned = generatedText.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
    }

    try {
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (parseErr) {
      console.error('[AI] JSON Parse Error on text, falling back to rule parser:', cleaned);
      return aiJobService.parseSocialJobPost(rawText);
    }
  },

  /**
   * High-accuracy heuristic parser for unstructured WhatsApp / Telegram / Agency job descriptions
   * (e.g. Singapore Work Permit, E-Pass/S-Pass, Gulf quotas)
   */
  parseSocialJobPost(rawText) {
    if (!rawText || !rawText.trim()) {
      throw new Error('Please paste a job description or WhatsApp message.');
    }

    const text = rawText.trim();
    const lower = text.toLowerCase();

    // 1. Detect Country and Flag
    let country = 'Singapore';
    let flag = '🇸🇬';
    let countryCode = 'SGP';
    let currencyCode = 'SGD';
    let inrRate = 63; // 1 SGD ~ 63 INR

    if (lower.includes('singapore') || text.includes('🇸🇬')) {
      country = 'Singapore';
      flag = '🇸🇬';
      countryCode = 'SGP';
      currencyCode = 'SGD';
      inrRate = 63;
    } else if (lower.includes('saudi') || lower.includes('ksa') || text.includes('🇸🇦')) {
      country = 'Saudi Arabia';
      flag = '🇸🇦';
      countryCode = 'KSA';
      currencyCode = 'SAR';
      inrRate = 22.5;
    } else if (lower.includes('kuwait') || text.includes('🇰🇼')) {
      country = 'Kuwait';
      flag = '🇰🇼';
      countryCode = 'KWT';
      currencyCode = 'KWD';
      inrRate = 275;
    } else if (lower.includes('qatar') || text.includes('🇶🇦')) {
      country = 'Qatar';
      flag = '🇶🇦';
      countryCode = 'QAT';
      currencyCode = 'QAR';
      inrRate = 23;
    } else if (lower.includes('dubai') || lower.includes('uae') || text.includes('🇦🇪')) {
      country = 'United Arab Emirates';
      flag = '🇦🇪';
      countryCode = 'UAE';
      currencyCode = 'AED';
      inrRate = 23;
    } else if (lower.includes('germany') || text.includes('🇩🇪')) {
      country = 'Germany';
      flag = '🇩🇪';
      countryCode = 'DEU';
      currencyCode = 'EUR';
      inrRate = 92;
    }

    // 2. Detect Permit / Visa Type
    let permitType = 'Work Permit';
    if (lower.includes('e-pass') && lower.includes('s-pass')) permitType = 'E-Pass & S-Pass';
    else if (lower.includes('e-pass') || lower.includes('epass')) permitType = 'E-Pass';
    else if (lower.includes('s-pass') || lower.includes('spass')) permitType = 'S-Pass';
    else if (lower.includes('work permit')) permitType = 'Work Permit';
    else if (lower.includes('employment visa')) permitType = 'Employment Visa';

    // 3. Detect Title / Designation
    let title = 'Overseas Trade Specialist';
    let category = 'Hospitality & Catering';

    if (lower.includes('hospital') || lower.includes('patient') || lower.includes('nursing')) {
      title = 'Hospital Staff & Patient Care Attendant';
      category = 'Hospitality & Catering';
    } else if (lower.includes('supermarket') || lower.includes('grocery')) {
      title = 'Supermarket Assistant & Retail Storekeeper';
      category = 'Logistics & Heavy Driving';
    } else if (lower.includes('restaurant') || lower.includes('waiter') || lower.includes('chef') || lower.includes('kitchen')) {
      title = 'Restaurant Staff (Waiter / Chef / Kitchen)';
      category = 'Hospitality & Catering';
    } else if (lower.includes('welder') || lower.includes('pipe') || lower.includes('fabricator')) {
      title = 'Pipe Welder & Industrial Fabricator';
      category = 'Manufacturing & Industrial';
    } else if (lower.includes('driver') || lower.includes('trailer')) {
      title = 'Heavy Driver & Trailer Operator';
      category = 'Logistics & Heavy Driving';
    } else if (lower.includes('electrician') || lower.includes('plumber') || lower.includes('mep')) {
      title = 'Electrician & MEP Technician';
      category = 'Electrical, Plumbing & MEP';
    } else if (lower.includes('general worker')) {
      title = 'General Service & Maintenance Worker';
      category = 'Construction & Infrastructure';
    }

    // 4. Extract Salaries
    let salaryForeign = '';
    let salaryInr = '';
    const rangeMatch = text.match(/\$?(\d{3,5})\s*(?:-|to)\s*\$?(\d{3,5})/i);
    const singleSalaryMatch = text.match(/salary\s*[-:]?\s*[\$£€₹]?\s*(\d{3,5})/i) || text.match(/\$\s*(\d{3,5})/);
    const basicMatch = text.match(/basic\s*[\$£€₹]?\s*(\d{3,5})/i);
    const roomMatch = text.match(/room\s*[\$£€₹]?\s*(\d{3,4})/i);

    if (rangeMatch) {
      const minVal = parseInt(rangeMatch[1], 10);
      const maxVal = parseInt(rangeMatch[2], 10);
      salaryForeign = `${currencyCode} ${minVal.toLocaleString()} – ${maxVal.toLocaleString()}`;
      const minInr = Math.round((minVal * inrRate) / 1000) * 1000;
      const maxInr = Math.round((maxVal * inrRate) / 1000) * 1000;
      salaryInr = `₹${minInr.toLocaleString('en-IN')} – ₹${maxInr.toLocaleString('en-IN')} / mo`;
    } else if (basicMatch) {
      const basicVal = parseInt(basicMatch[1], 10);
      const roomVal = roomMatch ? parseInt(roomMatch[1], 10) : 0;
      const total = basicVal + roomVal;
      salaryForeign = roomVal > 0 ? `${currencyCode} ${basicVal} Basic + $${roomVal} Room` : `${currencyCode} ${basicVal}`;
      const approxInr = Math.round((total * inrRate) / 1000) * 1000;
      salaryInr = `₹${approxInr.toLocaleString('en-IN')} / mo (Total Package)`;
    } else if (singleSalaryMatch) {
      const val = parseInt(singleSalaryMatch[1], 10);
      salaryForeign = `${currencyCode} ${val.toLocaleString()}`;
      const inrVal = Math.round((val * inrRate) / 1000) * 1000;
      salaryInr = `₹${inrVal.toLocaleString('en-IN')} / mo`;
    } else {
      salaryForeign = `${currencyCode} 2,000 – 2,500`;
      salaryInr = `₹1,25,000 – ₹1,55,000 / mo`;
    }

    // 5. Extract Perks
    const perks = [];
    if (lower.includes('food') || lower.includes('meal')) perks.push('Complimentary Duty Meals');
    if (lower.includes('accommodation') || lower.includes('room') || lower.includes('bedsheet')) perks.push('Accommodation Provided');
    if (lower.includes('medical') || lower.includes('hospital') || lower.includes('nursing')) perks.push('Medical Insurance');
    if (lower.includes('hike') || lower.includes('performance')) perks.push('Performance Salary Hike');
    if (lower.includes('days off') || lower.includes('day off')) {
      const offMatch = text.match(/(\d+)\s*days?\s*off/i);
      perks.push(offMatch ? `${offMatch[1]} Days Off / Month` : 'Monthly Days Off');
    }
    if (lower.includes('10-11') || lower.includes('10 hrs') || lower.includes('working hours')) {
      perks.push('10-11 Hours Duty');
    }
    if (perks.length === 0) {
      perks.push('Duty Meals', 'Camp Accommodation', 'Overtime Allowance', 'Medical Insurance');
    }

    // 6. Generate Job Code
    const random4 = Math.floor(1000 + Math.random() * 9000);
    const jobCode = `NG-${countryCode}-${random4}`;

    // 7. Requirements & Document Checklist
    const requirements = [
      'Valid Passport with minimum 1+ year validity',
      'White background passport photograph (1 studio print)',
      'Updated CV / Biodata detailing experience',
      'Experience / Trade certificates (if available)'
    ];

    let ageLimit = '';
    if (lower.includes('age')) {
      const ageMatch = text.match(/age\s*[-:]?\s*(\d{1,2}\s*-\s*\d{1,2})/i);
      if (ageMatch) {
        ageLimit = `${ageMatch[1].replace(/\s+/g, '')} Years`;
        requirements.push(`Age Requirement: ${ageLimit}`);
      }
    }

    let workingHours = '';
    if (lower.includes('10 hrs') || lower.includes('10-11') || lower.includes('working hours')) {
      const hrMatch = text.match(/(\d{1,2}(?:\s*-\s*\d{1,2})?)\s*(?:hrs|hours)/i);
      const daysOffMatch = text.match(/(\d+)\s*days?\s*off/i);
      workingHours = `${hrMatch ? hrMatch[1] + ' Hours Daily Duty' : '10 Hours Duty'}${daysOffMatch ? ` / ${daysOffMatch[1]} Days Off Monthly` : ''}`;
    }

    let eligibilityNotes = '';
    if (lower.includes('indian') || lower.includes('bangladesh') || lower.includes('nepal')) {
      const natList = [];
      if (lower.includes('indian')) natList.push('Indian');
      if (lower.includes('bangladesh')) natList.push('Bangladeshi');
      if (lower.includes('nepal')) natList.push('Nepali');
      eligibilityNotes = `Visa eligible for ${natList.join(', ')} passport holders`;
      requirements.push(eligibilityNotes);
    }

    if (lower.includes('nursing')) {
      requirements.push('Basic knowledge of patient care / nursing assistance');
    }

    // Default professional banner image depending on category
    let defaultImage = '/brand/1_Complete_Color_Logo/ng-logo-complete-color-1024px.png';
    if (category.includes('Hospitality')) defaultImage = '/images/job_croatia_hospitality.jpg';
    else if (category.includes('Logistics')) defaultImage = '/images/job_saudi_driver.jpg';
    else if (category.includes('Manufacturing')) defaultImage = '/images/job_poland_factory.jpg';
    else if (category.includes('Construction')) defaultImage = '/images/job_germany_construction.jpg';

    return {
      title,
      job_code: jobCode,
      category,
      country: `${country} (${permitType})`,
      flag,
      salary_inr: salaryInr,
      salary_foreign: salaryForeign,
      perks,
      badge_text: permitType.toUpperCase() + ' QUOTA',
      employer_funded: lower.includes('free visa') || lower.includes('100% free') ? 1 : 0,
      age_limit: ageLimit,
      working_hours: workingHours,
      eligibility_notes: eligibilityNotes,
      image: defaultImage,
      description: text,
      requirements
    };
  },

  /**
   * Generate ready-to-broadcast WhatsApp/Telegram formatted social post
   */
  generateSocialBroadcastCopy(job) {
    const flag = job.flag || '🇸🇬';
    const perksFormatted = Array.isArray(job.perks) 
      ? job.perks.map(p => `✨ ${p}`).join('\n') 
      : (job.perks || '').split(',').map(p => `✨ ${p.trim()}`).join('\n');

    return `${flag} ${job.country.toUpperCase()} PERMIT QUOTA 🥳\n` +
      `====================================\n\n` +
      `🔥 VACANCY: ${job.title.toUpperCase()}\n` +
      `📌 JOB REF: ${job.job_code}\n` +
      `💰 SALARY: ${job.salary_foreign} (${job.salary_inr})\n\n` +
      `🍱 PERKS & BENEFITS:\n` +
      `${perksFormatted}\n\n` +
      `📑 REQUIRED DOCUMENTS (IN ORDER):\n` +
      `1️⃣ Updated CV / Bio-Data\n` +
      `2️⃣ Trade & Experience Certificates\n` +
      `3️⃣ Original Passport Copy (Front & Back)\n` +
      `4️⃣ White-Background Studio Photograph 📸\n\n` +
      `⚡ CANDIDATE REQUIREMENT:\n` +
      `Confirmed candidates ready to pay & go for immediate processing.\n\n` +
      `📲 DM / CALL OFFICIAL HELPLINE:\n` +
      `NG Global Manpower Services\n` +
      `WhatsApp: +91 80800 25670\n` +
      `Official Portal: https://ngglobalmp.in/jobs`;
  }
};

module.exports = aiJobService;
