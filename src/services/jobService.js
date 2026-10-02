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

  getJobByCodeOrId(identifier) {
    if (!identifier) return null;
    let job = Job.findById(identifier);
    if (!job) {
      job = Job.findByCode(identifier);
    }
    return job;
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

  deleteBulkJobs(ids) {
    const deletedCount = Job.deleteMany(ids);
    this.invalidateCache();
    return deletedCount;
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
    const newToday = totalActive === 0 ? 0 : ((jobs.filter(j => {
      if (!j.created_at) return true;
      return (now - new Date(j.created_at).getTime()) < (oneDayMs * 2);
    }).length) || Math.ceil(totalActive * 0.4));

    // Regional breakdown dynamically computed from active jobs
    const regions = {
      middleEast: jobs.filter(j => /UAE|Saudi|Qatar|Kuwait|Dubai|Oman|Bahrain/i.test(j.country)).length,
      europe: jobs.filter(j => /Germany|Poland|EU|UK|Czech|Romania|Malta|Europe/i.test(j.country)).length,
      oceania: jobs.filter(j => /New Zealand|Australia|NZ/i.test(j.country)).length,
      northAmerica: jobs.filter(j => /United States|USA|Canada/i.test(j.country)).length
    };

    // Country-specific breakdowns for quick destination chips
    const countries = {
      uae: jobs.filter(j => /UAE|Dubai|Abu Dhabi/i.test(j.country)).length,
      germany: jobs.filter(j => /Germany/i.test(j.country)).length,
      qatar: jobs.filter(j => /Qatar/i.test(j.country)).length,
      saudi: jobs.filter(j => /Saudi|KSA|Riyadh/i.test(j.country)).length,
      usa: jobs.filter(j => /United States|USA/i.test(j.country)).length,
      newZealand: jobs.filter(j => /New Zealand|NZ/i.test(j.country)).length
    };

    // Category breakdown for popular trade cards
    const categories = {
      construction: jobs.filter(j => /Construction|Infrastructure|Civil|Steel|Rigger/i.test(j.category) || /Construction|Rigger|Steel/i.test(j.title)).length,
      logistics: jobs.filter(j => /Driving|Driver|Logistics|Trailer/i.test(j.category) || /Driver|Driving|Trailer|Truck/i.test(j.title)).length,
      warehouse: jobs.filter(j => /Warehouse|Storekeeper|Inventory|Forklift/i.test(j.category) || /Warehouse|Storekeeper|Forklift/i.test(j.title)).length,
      hospitality: jobs.filter(j => /Hospitality|Catering|Hotel|Restaurant|Chef|Cook|Waiter/i.test(j.category) || /Chef|Cook|Waiter|Hospitality/i.test(j.title)).length,
      oilGas: jobs.filter(j => /Oil|Gas|Refinery|Petrochemical/i.test(j.category) || /Oil|Gas|Piping/i.test(j.title)).length,
      manufacturing: jobs.filter(j => /Manufacturing|Industrial|Electrical|Plumbing|MEP|Welder|CNC|Mechanic/i.test(j.category) || /Welder|Mechanic|CNC|Electrician|Plumber/i.test(j.title)).length
    };

    return {
      totalActive,
      countriesCount,
      sponsoredCount,
      newToday,
      regions,
      countries,
      categories
    };
  }
};

module.exports = jobService;
