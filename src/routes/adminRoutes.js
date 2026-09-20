const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const leadController = require('../controllers/leadController');
const jobController = require('../controllers/jobController');
const authController = require('../controllers/authController');
const { loginLimiter } = require('../middleware/rateLimiter');
const { validate, jobValidation, loginValidation } = require('../middleware/validator');
const { requireAuth } = require('../middleware/authMiddleware');

// Public admin auth routes (accessible without login)
router.get('/login', authController.showLogin);
router.post('/login', loginLimiter, validate(loginValidation), authController.login);
router.get('/logout', authController.logout);
router.post('/logout', authController.logout);

// All subsequent admin routes require authentication
router.use(requireAuth);

// Dashboard
router.get('/', (req, res) => res.redirect('/admin/dashboard'));
router.get('/dashboard', adminController.showDashboard);

// Leads
router.get('/leads', adminController.showLeads);
router.get('/leads/export', leadController.exportCsv);
router.get('/leads/:id', adminController.showLeadDetail);
router.post('/leads/:id/status', leadController.updateStatus);
router.post('/leads/:id/delete', leadController.deleteLead);

// Jobs
router.get('/jobs', adminController.showJobs);
router.get('/jobs/new', adminController.showJobForm);
router.post('/jobs', validate(jobValidation), jobController.createJob);
router.get('/jobs/:id/edit', adminController.showJobForm);
router.post('/jobs/:id/edit', validate(jobValidation), jobController.updateJob);
router.post('/jobs/:id/delete', jobController.deleteJob);

// Settings
router.get('/settings', adminController.showSettings);
router.post('/settings', adminController.updateSettings);

module.exports = router;
