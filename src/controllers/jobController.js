const jobService = require('../services/jobService');

const jobController = {
  // Public API: List active jobs
  getActiveJobs(req, res, next) {
    try {
      const jobs = jobService.getActiveJobs();
      res.json({ success: true, count: jobs.length, jobs });
    } catch (err) {
      next(err);
    }
  },

  // Public API: Get single job details
  getJobById(req, res, next) {
    try {
      const job = jobService.getJobById(req.params.id);
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found.' });
      }
      res.json({ success: true, job });
    } catch (err) {
      next(err);
    }
  },

  // Admin: Create job opening
  createJob(req, res, next) {
    try {
      const job = jobService.createJob(req.body);

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(201).json({ success: true, message: 'Job opening published.', job });
      }
      res.redirect('/admin/jobs?created=true');
    } catch (err) {
      next(err);
    }
  },

  // Admin: Update job opening
  updateJob(req, res, next) {
    try {
      const { id } = req.params;
      const updated = jobService.updateJob(id, req.body);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Job not found.' });
      }

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({ success: true, message: 'Job updated.', job: updated });
      }
      res.redirect('/admin/jobs?updated=true');
    } catch (err) {
      next(err);
    }
  },

  // Admin: Delete/Archive job
  deleteJob(req, res, next) {
    try {
      const { id } = req.params;
      jobService.deleteJob(id);

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({ success: true, message: 'Job removed.' });
      }
      res.redirect('/admin/jobs?deleted=true');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = jobController;
