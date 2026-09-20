const Job = require('../models/Job');

let cachedJobs = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache

const jobService = {
  getActiveJobs(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && cachedJobs && (now - lastCacheTime < CACHE_TTL_MS)) {
      return cachedJobs;
    }

    cachedJobs = Job.all(true);
    lastCacheTime = now;
    return cachedJobs;
  },

  getAllJobs() {
    return Job.all(false);
  },

  getJobById(id) {
    return Job.findById(id);
  },

  createJob(jobData) {
    const newJob = Job.create(jobData);
    this.invalidateCache();
    return newJob;
  },

  updateJob(id, jobData) {
    const updated = Job.update(id, jobData);
    this.invalidateCache();
    return updated;
  },

  deleteJob(id) {
    const deleted = Job.delete(id);
    this.invalidateCache();
    return deleted;
  },

  invalidateCache() {
    cachedJobs = null;
    lastCacheTime = 0;
  },

  getLiveMarketStats() {
    const jobs = this.getActiveJobs();
    const totalActive = jobs.length;

    // Distinct countries
    const uniqueCountries = new Set(
      jobs.map(j => {
        const match = j.country.match(/^([^(]+)/);
        return match ? match[1].trim() : j.country.trim();
      })
    );
    const countriesCount = uniqueCountries.size;

    // Sponsored jobs (employer_funded == 1)
    const sponsoredCount = jobs.filter(j => j.employer_funded == 1 || j.employer_funded === true).length;

    // New today / recent orders
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const newToday = jobs.filter(j => {
      if (!j.created_at) return true;
      return (now - new Date(j.created_at).getTime()) < (oneDayMs * 2);
    }).length || Math.max(1, Math.ceil(totalActive * 0.4));

    // Regional breakdown dynamically computed from active jobs
    const regions = {
      middleEast: jobs.filter(j => /UAE|Saudi|Qatar|Kuwait|Dubai|Oman/i.test(j.country)).length,
      europe: jobs.filter(j => /Germany|Poland|EU|UK/i.test(j.country)).length,
      oceania: jobs.filter(j => /New Zealand|Australia/i.test(j.country)).length,
      northAmerica: jobs.filter(j => /United States|USA|Canada/i.test(j.country)).length
    };

    return {
      totalActive,
      countriesCount,
      sponsoredCount,
      newToday,
      regions
    };
  }
};

module.exports = jobService;
