const authService = require('../services/authService');
const documentService = require('../services/documentService');
const Lead = require('../models/Lead');
const Agent = require('../models/Agent');
const Notification = require('../models/Notification');
const env = require('../config/env');

const agentController = {
  // Agent Login View
  showLogin(req, res) {
    if (req.agent) {
      return res.redirect('/agent/dashboard');
    }
    res.render('agent/login', {
      title: 'Recruitment Partner Agent Portal | NG Global',
      error: req.query.error || null,
      redirect: req.query.redirect || '/agent/dashboard'
    });
  },

  // Agent Login POST
  async login(req, res, next) {
    try {
      const { identifier, password, redirect } = req.body;
      const { token, agent } = authService.agentLogin(identifier, password);

      res.cookie('agent_token', token, {
        httpOnly: true,
        secure: env.isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({ success: true, message: 'Welcome back, Agent partner!', agent, token });
      }

      const target = redirect && redirect.startsWith('/') ? redirect : '/agent/dashboard';
      res.redirect(target);
    } catch (err) {
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(401).json({ success: false, message: err.message });
      }
      res.render('agent/login', {
        title: 'Recruitment Partner Agent Portal | NG Global',
        error: err.message,
        redirect: req.body.redirect || '/agent/dashboard'
      });
    }
  },

  // Agent Logout
  logout(req, res) {
    res.clearCookie('agent_token');
    res.redirect('/agent/login?loggedOut=true');
  },

  // Agent Dashboard
  showDashboard(req, res, next) {
    try {
      const agentId = req.agent.id;
      const candidates = Lead.all({ agent_id: agentId });
      const metrics = Lead.getMetrics(agentId);

      res.render('agent/dashboard', {
        title: `${req.agent.agency_name} | Agent Portal | NG Global`,
        agent: req.agent,
        candidates,
        metrics,
        path: '/agent/dashboard'
      });
    } catch (err) {
      next(err);
    }
  },

  // New Candidate Intake Form
  showCandidateForm(req, res) {
    res.render('agent/candidate-new', {
      title: 'New Candidate Intake & Document Dossier | NG Global',
      agent: req.agent,
      path: '/agent/candidates/new',
      error: null
    });
  },

  // Submit Candidate with Compressed Documents & PDF Merging
  async createCandidate(req, res, next) {
    try {
      const {
        full_name,
        phone,
        whatsapp,
        email,
        trade,
        destination,
        experience,
        city,
        state,
        nationality,
        passport_no,
        passport_expiry,
        dob,
        gamca_status,
        notes
      } = req.body;

      if (!full_name || !phone || !trade) {
        throw new Error('Full Name, Contact Phone, and Trade Applied are required.');
      }

      // Process uploaded files with compression
      let processedFiles = [];
      let mergedPdfPath = null;

      if (req.files && Object.keys(req.files).length > 0) {
        const { candidateFolder, files } = await documentService.processCandidateFiles(full_name, req.files);
        processedFiles = files;

        // Automatically merge all files (PDF, JPG, PNG) into a single master PDF
        if (processedFiles.length > 0) {
          mergedPdfPath = await documentService.mergeCandidateDossier(full_name, processedFiles, candidateFolder);
        }
      }

      const candidate = Lead.create({
        full_name,
        phone,
        whatsapp: whatsapp || phone,
        email: email || '',
        trade,
        destination: destination || 'Gulf Countries',
        experience: experience || '1 to 2 Years',
        city: city || 'Not Specified',
        state: state || '',
        nationality: nationality || 'Indian',
        passport_no,
        passport_expiry,
        dob,
        gamca_status: gamca_status || 'Pending',
        source: 'agent_portal',
        lead_type: 'confirmed_candidate',
        agent_id: req.agent.id,
        agent_username: req.agent.username,
        documents: processedFiles,
        merged_dossier_pdf: mergedPdfPath,
        status: 'Confirmed',
        notes: notes ? `[Agent: ${req.agent.name}] ${notes}` : `Submitted via partner agency: ${req.agent.agency_name} (Confirmed & Ready to Pay)`
      });

      Agent.incrementCandidateCount(req.agent.id);

      // Notify Admin immediately of new confirmed candidate with documentation
      Notification.create({
        type: 'new_confirmed_candidate',
        title: `⭐ New Confirmed Candidate: ${candidate.full_name}`,
        message: `Partner agency ${req.agent.agency_name} registered confirmed candidate #${candidate.id} (${candidate.full_name} - ${candidate.trade}) ready to pay and mobilize.`,
        lead_id: candidate.id,
        agent_id: req.agent.id,
        agent_name: req.agent.agency_name,
        priority: 'high'
      });

      res.redirect(`/agent/candidates/${candidate.id}?created=true`);
    } catch (err) {
      res.render('agent/candidate-new', {
        title: 'New Candidate Intake & Document Dossier | NG Global',
        agent: req.agent,
        path: '/agent/candidates/new',
        error: err.message,
        formData: req.body
      });
    }
  },

  // View Candidate Details & Dossier Download
  showCandidateDetail(req, res, next) {
    try {
      const candidate = Lead.findById(req.params.id);
      if (!candidate || candidate.agent_id !== req.agent.id) {
        return res.status(404).render('pages/404', { title: 'Candidate Profile Not Found' });
      }

      res.render('agent/candidate-detail', {
        title: `Candidate: ${candidate.full_name} | NG Global`,
        candidate,
        agent: req.agent,
        created: req.query.created === 'true',
        statusUpdated: req.query.statusUpdated === 'true',
        path: '/agent/dashboard'
      });
    } catch (err) {
      next(err);
    }
  },

  // Update Candidate Status / Report Backout (Agent Action)
  async updateCandidateStatus(req, res, next) {
    try {
      const candidate = Lead.findById(req.params.id);
      if (!candidate || candidate.agent_id !== req.agent.id) {
        return res.status(404).render('pages/404', { title: 'Candidate Profile Not Found' });
      }

      const { status, reason, notes } = req.body;
      const agentIdentifier = `${req.agent.name} (${req.agent.agency_name})`;

      if (status === 'Backed Out') {
        const backoutReason = (reason || notes || '').trim() || 'Candidate backed out / no longer available';
        Lead.markBackedOut(candidate.id, backoutReason, agentIdentifier);

        // Send immediate URGENT alert notification to Admin
        Notification.create({
          type: 'candidate_backout',
          title: `🚨 Candidate Backed Out: ${candidate.full_name}`,
          message: `Agent ${req.agent.agency_name} reported that candidate #${candidate.id} (${candidate.full_name}, ${candidate.trade}) has BACKED OUT. Reason: "${backoutReason}"`,
          lead_id: candidate.id,
          agent_id: req.agent.id,
          agent_name: req.agent.agency_name,
          priority: 'urgent',
          metadata: {
            candidate_name: candidate.full_name,
            phone: candidate.phone,
            trade: candidate.trade,
            reason: backoutReason
          }
        });
      } else {
        Lead.updateStatus(candidate.id, status, notes ? `[Agent update: ${notes}]` : null);

        Notification.create({
          type: 'status_update',
          title: `Candidate Stage Update: ${candidate.full_name}`,
          message: `Agent ${req.agent.agency_name} updated candidate #${candidate.id} to "${status}".`,
          lead_id: candidate.id,
          agent_id: req.agent.id,
          agent_name: req.agent.agency_name,
          priority: 'normal'
        });
      }

      res.redirect(`/agent/candidates/${candidate.id}?statusUpdated=true`);
    } catch (err) {
      next(err);
    }
  },

  // Public Verified Agent Profile Page ([username].url or /agency/:username)
  showAgencyProfile(req, res, next) {
    try {
      const username = req.params.username || (req.subdomainAgent ? req.subdomainAgent.username : null);
      if (!username) {
        return res.status(404).render('pages/404', { title: 'Agent Profile Not Found' });
      }

      const agent = Agent.findByUsername(username);
      if (!agent || agent.status !== 'active') {
        return res.status(404).render('pages/404', { title: 'Partner Agency Not Found or Inactive' });
      }

      res.render('pages/agent-profile', {
        title: `${agent.agency_name} | Official Recruitment Partner | NG Global`,
        agent,
        submitted: req.query.applied === 'true'
      });
    } catch (err) {
      next(err);
    }
  },

  // Public candidate submission via Agent Landing Page
  async handlePublicCandidateApplication(req, res, next) {
    try {
      const { username } = req.params;
      const agent = Agent.findByUsername(username);
      if (!agent || agent.status !== 'active') {
        return res.status(404).json({ success: false, message: 'Agent partner not active.' });
      }

      const { full_name, phone, trade, city, experience } = req.body;
      const candidate = Lead.create({
        full_name,
        phone,
        trade: trade || 'General Trade',
        city: city || 'Not Specified',
        experience: experience || '1 to 2 Years',
        source: 'agent_public_profile',
        agent_id: agent.id,
        agent_username: agent.username,
        status: 'New',
        notes: `Applied through verified partner agent page: ${agent.agency_name} (${agent.city}, ${agent.state})`
      });

      Agent.incrementCandidateCount(agent.id);

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({ success: true, message: 'Application submitted directly to partner agent.' });
      }

      res.redirect(`/agency/${agent.username}?applied=true`);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = agentController;
