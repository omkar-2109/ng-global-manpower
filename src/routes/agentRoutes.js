const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const documentService = require('../services/documentService');
const { requireAgentAuth } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');

// Public agent auth
router.get('/login', agentController.showLogin);
router.post('/login', loginLimiter, agentController.login);
router.get('/logout', agentController.logout);
router.post('/logout', agentController.logout);

// Protected Agent routes
router.get('/', (req, res) => res.redirect('/agent/dashboard'));
router.get('/dashboard', requireAgentAuth, agentController.showDashboard);
router.get('/candidates/new', requireAgentAuth, agentController.showCandidateForm);
router.post('/candidates', requireAgentAuth, documentService.uploadFields, agentController.createCandidate);
router.get('/candidates/:id', requireAgentAuth, agentController.showCandidateDetail);
router.post('/candidates/:id/status', requireAgentAuth, agentController.updateCandidateStatus);

module.exports = router;
