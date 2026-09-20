const db = require('../config/db');

const Job = {
  all(activeOnly = false) {
    if (activeOnly) {
      return db.jobs.find(j => j.active === 1);
    }
    return db.jobs.all();
  },

  findById(id) {
    return db.jobs.findById(id);
  },

  findByCode(jobCode) {
    return db.jobs.findOne({ job_code: jobCode });
  },

  findByCategory(category) {
    return db.jobs.find(j => j.category.toLowerCase().includes(category.toLowerCase()));
  },

  create(jobData) {
    const job_code = jobData.job_code || `NG-${(jobData.country || 'GLB').substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const perks = Array.isArray(jobData.perks) ? jobData.perks : (jobData.perks ? jobData.perks.split(',').map(s => s.trim()) : []);

    return db.jobs.insert({
      job_code,
      title: jobData.title,
      category: jobData.category || 'General',
      country: jobData.country,
      flag: jobData.flag || '🌐',
      salary_inr: jobData.salary_inr,
      salary_foreign: jobData.salary_foreign || '',
      perks,
      employer_funded: jobData.employer_funded ? 1 : 0,
      badge_text: jobData.badge_text || '',
      active: jobData.active !== undefined ? (jobData.active ? 1 : 0) : 1
    });
  },

  update(id, jobData) {
    const payload = { ...jobData };
    if (payload.perks && !Array.isArray(payload.perks)) {
      payload.perks = payload.perks.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (payload.employer_funded !== undefined) {
      payload.employer_funded = payload.employer_funded ? 1 : 0;
    }
    if (payload.active !== undefined) {
      payload.active = payload.active ? 1 : 0;
    }
    return db.jobs.update(id, payload);
  },

  delete(id) {
    return db.jobs.delete(id);
  },

  count(activeOnly = false) {
    if (activeOnly) {
      return db.jobs.count(j => j.active === 1);
    }
    return db.jobs.count();
  }
};

module.exports = Job;
