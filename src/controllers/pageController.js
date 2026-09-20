const jobService = require('../services/jobService');
const Setting = require('../models/Setting');
const env = require('../config/env');

const pageController = {
  getHomePage(req, res, next) {
    try {
      const activeJobs = jobService.getActiveJobs();
      const stats = jobService.getLiveMarketStats();
      const settings = Setting.all();

      res.render('pages/index', {
        title: 'Find Verified Overseas Jobs | NG Global Manpower Services',
        description: 'Connect with verified employers across Gulf, Europe, USA, and New Zealand. Live job openings with transparent regulated agency fees and 100% employer-sponsored quotas.',
        jobs: activeJobs,
        stats,
        settings: {
          whatsappNumber: settings.whatsapp_number || env.whatsappNumber,
          helplinePhone: settings.helpline_phone || env.helplinePhone,
          supportEmail: settings.support_email || env.supportEmail
        },
        path: '/'
      });
    } catch (err) {
      next(err);
    }
  },

  getJobsPage(req, res, next) {
    try {
      const category = req.query.category || '';
      const country = req.query.country || '';
      let jobs = jobService.getActiveJobs();

      if (category) {
        jobs = jobs.filter(j => j.category.toLowerCase().includes(category.toLowerCase()));
      }
      if (country) {
        jobs = jobs.filter(j => j.country.toLowerCase().includes(country.toLowerCase()));
      }

      res.render('pages/jobs', {
        title: 'Current International Job Openings | NG Global Manpower',
        description: 'Explore verified overseas job openings for skilled and semi-skilled trade professionals with employer-sponsored work permits.',
        jobs,
        selectedCategory: category,
        selectedCountry: country,
        path: '/jobs'
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = pageController;
