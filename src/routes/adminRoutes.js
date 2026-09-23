const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const leadController = require('../controllers/leadController');
const jobController = require('../controllers/jobController');
const authController = require('../controllers/authController');
const documentService = require('../services/documentService');
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

// Leads / Candidates
router.get('/leads', adminController.showLeads);
router.get('/leads/export', leadController.exportCsv);
router.get('/leads/:id', adminController.showLeadDetail);
router.post('/leads/:id/status', leadController.updateStatus);
router.post('/leads/:id/followup', adminController.updateLeadFollowup);
router.post('/leads/:id/documents', documentService.adminUploadFields, adminController.uploadCandidateDocuments);
router.post('/leads/:id/delete', leadController.deleteLead);

// Dashboard Notifications
router.post('/notifications/:id/dismiss', adminController.dismissNotification);
router.post('/notifications/dismiss-all', adminController.dismissAllNotifications);

// Recruitment Partner Agents Management
router.get('/agents', adminController.showAgents);
router.get('/agents/new', adminController.showAgentForm);
router.post('/agents', adminController.createAgent);
router.get('/agents/:id/edit', adminController.showAgentForm);
router.post('/agents/:id/edit', adminController.updateAgent);
router.post('/agents/:id/reset-password', adminController.resetAgentPassword);
router.post('/agents/:id/delete', adminController.deleteAgent);

// Jobs Management
router.get('/jobs', adminController.showJobs);
router.get('/jobs/new', adminController.showJobForm);
router.post('/jobs', validate(jobValidation), jobController.createJob);
router.get('/jobs/:id/edit', adminController.showJobForm);
router.post('/jobs/:id/edit', validate(jobValidation), jobController.updateJob);
router.post('/jobs/:id/delete', jobController.deleteJob);
router.post('/jobs/ai-generate', documentService.uploadFlyer, adminController.generateJobAi);
router.post('/jobs/smart-parse', adminController.smartParseJob);
router.get('/jobs/:id/whatsapp-broadcast', adminController.getJobWhatsAppBroadcast);

// Settings
router.get('/settings', adminController.showSettings);
router.post('/settings', adminController.updateSettings);

module.exports = router;
