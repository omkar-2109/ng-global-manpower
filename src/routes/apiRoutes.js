const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const jobController = require('../controllers/jobController');
const { requireAuth } = require('../middleware/authMiddleware');
const { leadSubmissionLimiter } = require('../middleware/rateLimiter');
const { validate, leadValidation, jobValidation } = require('../middleware/validator');

// Public API endpoints
router.post('/v1/leads', leadSubmissionLimiter, validate(leadValidation), leadController.submitLead);
router.get('/v1/jobs', jobController.getActiveJobs);
router.get('/v1/jobs/:id', jobController.getJobById);

// Protected Admin API endpoints
router.get('/v1/admin/leads', requireAuth, leadController.getLeads);
router.patch('/v1/admin/leads/:id', requireAuth, leadController.updateStatus);
router.delete('/v1/admin/leads/:id', requireAuth, leadController.deleteLead);

router.post('/v1/admin/jobs', requireAuth, validate(jobValidation), jobController.createJob);
router.put('/v1/admin/jobs/:id', requireAuth, jobController.updateJob);
router.delete('/v1/admin/jobs/:id', requireAuth, jobController.deleteJob);

module.exports = router;
