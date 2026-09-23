const leadService = require('../services/leadService');
const jobService = require('../services/jobService');
const Setting = require('../models/Setting');
const Agent = require('../models/Agent');
const Lead = require('../models/Lead');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const documentService = require('../services/documentService');
const aiJobService = require('../services/aiJobService');
const env = require('../config/env');

const adminController = {
  // Dashboard Overview with real-time backout alerts and notifications
  showDashboard(req, res, next) {
    try {
      const metrics = leadService.getDashboardMetrics();
      const recentLeads = leadService.getAllLeads().slice(0, 10);
      const activeJobsCount = jobService.getActiveJobs().length;
      const unreadNotifications = Notification.getUnread();
      const backedOutCandidates = Lead.all({ status: 'Backed Out' });

      res.render('admin/dashboard', {
        title: 'Recruitment Command Center | NG Global',
        metrics,
        recentLeads,
        activeJobsCount,
        unreadNotifications,
        backedOutCandidates,
        path: '/admin/dashboard'
      });
    } catch (err) {
      next(err);
    }
  },

  // Leads Management Page with Pipeline Tab Filtering
  showLeads(req, res, next) {
    try {
      const { status, trade, search, lead_type } = req.query;
      const filter = { status, trade, search };
      if (lead_type) filter.lead_type = lead_type;

      const leads = leadService.getAllLeads(filter);
      const metrics = leadService.getDashboardMetrics();

      res.render('admin/leads', {
        title: 'Candidate Applications & Dossiers | NG Global',
        leads,
        metrics,
        filter: { status, trade, search, lead_type },
        path: '/admin/leads'
      });
    } catch (err) {
      next(err);
    }
  },

  // Single Lead Detail Page with Documentation Management & Follow-up Actions
  showLeadDetail(req, res, next) {
    try {
      const lead = leadService.getLeadById(req.params.id);
      if (!lead) {
        return res.status(404).render('pages/404', { title: 'Candidate Profile Not Found' });
      }

      // WhatsApp direct clean link
      const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
      const quickWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${lead.full_name}, this is NG Global Manpower Services following up on your overseas application (#NG-${lead.id}) for ${lead.trade}.`)}`;

      // WhatsApp explanation of procedure link
      const procedureMessage = `Hello ${lead.full_name},\n\n` +
        `Thank you for your interest in overseas deployment with NG Global Manpower Services (#NG-${lead.id} - ${lead.trade}).\n\n` +
        `📋 OVERSEAS RECRUITMENT & MOBILIZATION PROCEDURE:\n` +
        `1️⃣ Step 1: Profile & Document Verification (CV, Experience, Passport Copy & 1 Photo)\n` +
        `2️⃣ Step 2: Trade test evaluation or direct client video interview\n` +
        `3️⃣ Step 3: Offer letter signing & GAMCA medical examination\n` +
        `4️⃣ Step 4: Official Embassy Visa stamping & work permit clearance\n` +
        `5️⃣ Step 5: Pre-departure orientation & flight ticket deployment\n\n` +
        `Please share your updated CV, Passport copy front/back, and 1 studio photo so our documentation team can compile your official dossier for upcoming client interviews.\n\n` +
        `Best regards,\nNG Global Manpower Services | Helpline: +91 80800 25670`;

      const procedureWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(procedureMessage)}`;

      res.render('admin/lead-detail', {
        title: `Candidate: ${lead.full_name} | NG Global`,
        lead,
        quickWhatsAppUrl,
        procedureWhatsAppUrl,
        docsUploaded: req.query.docsUploaded === 'true',
        updated: req.query.updated === 'true',
        path: '/admin/leads'
      });
    } catch (err) {
      next(err);
    }
  },

  // Jobs Management Page
  showJobs(req, res, next) {
    try {
      const jobs = jobService.getAllJobs();
      res.render('admin/jobs', {
        title: 'Overseas Job Openings | NG Global',
        jobs,
        query: req.query,
        path: '/admin/jobs'
      });
    } catch (err) {
      next(err);
    }
  },

  // Job Create / Edit Form
  showJobForm(req, res, next) {
    try {
      const { id } = req.params;
      let job = null;
      let isEdit = false;

      if (id) {
        job = jobService.getJobById(id);
        if (!job) {
          return res.status(404).render('pages/404', { title: 'Job Not Found' });
        }
        isEdit = true;
      }

      res.render('admin/job-edit', {
        title: isEdit ? `Edit Job: ${job.title}` : 'Add New Job Quota | NG Global',
        job: job || {},
        isEdit,
        path: '/admin/jobs'
      });
    } catch (err) {
      next(err);
    }
  },

  // Settings Page
  showSettings(req, res, next) {
    try {
      const settings = Setting.all();
      res.render('admin/settings', {
        title: 'Platform Settings & Routing | NG Global',
        settings: {
          whatsapp_number: settings.whatsapp_number || env.whatsappNumber,
          helpline_phone: settings.helpline_phone || env.helplinePhone,
          support_email: settings.support_email || env.supportEmail,
          anti_fraud_notice: settings.anti_fraud_notice || ''
        },
        saved: req.query.saved === 'true',
        path: '/admin/settings'
      });
    } catch (err) {
      next(err);
    }
  },

  // Update Settings
  updateSettings(req, res, next) {
    try {
      const { whatsapp_number, helpline_phone, support_email, anti_fraud_notice } = req.body;
      if (whatsapp_number) Setting.set('whatsapp_number', whatsapp_number.trim());
      if (helpline_phone) Setting.set('helpline_phone', helpline_phone.trim());
      if (support_email) Setting.set('support_email', support_email.trim());
      if (anti_fraud_notice) Setting.set('anti_fraud_notice', anti_fraud_notice.trim());

      res.redirect('/admin/settings?saved=true');
    } catch (err) {
      next(err);
    }
  },

  // Agent Management: List all agents
  showAgents(req, res, next) {
    try {
      const agents = Agent.all();
      res.render('admin/agents', {
        title: 'Recruitment Partner Agents | NG Global',
        agents,
        path: '/admin/agents'
      });
    } catch (err) {
      next(err);
    }
  },

  // Agent Management: Show create / edit form
  showAgentForm(req, res, next) {
    try {
      const { id } = req.params;
      let agent = null;
      let isEdit = false;

      if (id) {
        agent = Agent.findById(id);
        if (!agent) {
          return res.status(404).render('pages/404', { title: 'Agent Partner Not Found' });
        }
        isEdit = true;
      }

      res.render('admin/agent-edit', {
        title: isEdit ? `Edit Agent: ${agent.name}` : 'Register New Recruitment Partner Agent | NG Global',
        agent: agent || {},
        isEdit,
        error: null,
        path: '/admin/agents'
      });
    } catch (err) {
      next(err);
    }
  },

  // Agent Management: Create new agent
  createAgent(req, res, next) {
    try {
      const {
        name,
        agency_name,
        username,
        email,
        phone,
        city,
        state,
        country,
        license_no,
        password,
        commission_notes,
        status
      } = req.body;

      if (!name || !email || !password) {
        throw new Error('Agent Name, Email, and Password are required.');
      }

      // Check unique email and username
      const existingEmail = Agent.findByEmail(email);
      if (existingEmail) {
        throw new Error('An agent with this email address already exists.');
      }

      const existingUser = Agent.findByUsername(username || name);
      if (existingUser) {
        throw new Error('This subdomain slug / username is already taken. Please choose another.');
      }

      Agent.create({
        name,
        agency_name,
        username,
        email,
        phone: phone || '',
        city,
        state,
        country,
        license_no,
        password,
        commission_notes,
        status: status || 'active'
      });

      res.redirect('/admin/agents?created=true');
    } catch (err) {
      res.render('admin/agent-edit', {
        title: 'Register New Recruitment Partner Agent | NG Global',
        agent: req.body,
        isEdit: false,
        error: err.message,
        path: '/admin/agents'
      });
    }
  },

  // Agent Management: Update agent
  updateAgent(req, res, next) {
    try {
      const { id } = req.params;
      const {
        name,
        agency_name,
        username,
        email,
        phone,
        city,
        state,
        country,
        license_no,
        commission_notes,
        status
      } = req.body;

      Agent.update(id, {
        name,
        agency_name,
        username,
        email,
        phone,
        city,
        state,
        country,
        license_no,
        commission_notes,
        status
      });

      res.redirect('/admin/agents?updated=true');
    } catch (err) {
      next(err);
    }
  },

  // Agent Management: Reset Password
  resetAgentPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { new_password } = req.body;

      if (!new_password || new_password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }

      Agent.updatePassword(id, new_password);
      res.redirect('/admin/agents?passwordReset=true');
    } catch (err) {
      next(err);
    }
  },

  // Agent Management: Delete agent
  deleteAgent(req, res, next) {
    try {
      const { id } = req.params;
      Agent.delete(id);
      res.redirect('/admin/agents?deleted=true');
    } catch (err) {
      next(err);
    }
  },

  // AI Job Generator API endpoint
  async generateJobAi(req, res, next) {
    try {
      const { details } = req.body;
      const flyerInfo = req.file ? {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path
      } : null;

      const jobData = await aiJobService.generateJobPost({ details, flyerInfo });
      res.json({ success: true, data: jobData });
    } catch (err) {
      console.error('[Admin] AI Job Generation error:', err.message);
      res.status(500).json({
        success: false,
        message: err.message || 'AI Job generation encountered an error.'
      });
    }
  },

  // Direct Admin Document Upload & Dossier Compilation
  async uploadCandidateDocuments(req, res, next) {
    try {
      const { id } = req.params;
      const lead = leadService.getLeadById(id);
      if (!lead) {
        return res.status(404).render('pages/404', { title: 'Candidate Not Found' });
      }

      let existingDocs = lead.documents || [];
      let candidateFolder = null;

      // If lead already had documents with absolute paths, reuse folder
      if (existingDocs.length > 0 && existingDocs[0].absolutePath) {
        const pathModule = require('path');
        candidateFolder = pathModule.dirname(existingDocs[0].absolutePath);
      }

      if (req.files && Object.keys(req.files).length > 0) {
        const { candidateFolder: newFolder, files } = await documentService.processCandidateFiles(
          lead.full_name,
          req.files,
          candidateFolder
        );
        candidateFolder = newFolder;

        // Merge newly processed files into existing docs (avoid duplicate doc types)
        const newTypes = new Set(files.map(f => f.type));
        existingDocs = existingDocs.filter(doc => !newTypes.has(doc.type));
        existingDocs = [...existingDocs, ...files];
      }

      let mergedPdfPath = lead.merged_dossier_pdf;
      if (existingDocs.length > 0 && candidateFolder) {
        // Enforce strict merge order: 1. CV, 2. Experience, 3. Passport, 4. Pic, 5. Others
        mergedPdfPath = await documentService.mergeCandidateDossier(
          lead.full_name,
          existingDocs,
          candidateFolder
        );
      }

      // Upgrade lead to confirmed_candidate with ready dossier
      Lead.update(lead.id, {
        documents: existingDocs,
        merged_dossier_pdf: mergedPdfPath,
        lead_type: 'confirmed_candidate',
        status: lead.status === 'New' ? 'Confirmed' : lead.status
      });

      res.redirect(`/admin/leads/${lead.id}?docsUploaded=true`);
    } catch (err) {
      next(err);
    }
  },

  // Update Lead Procedure Follow-up notes & Classification
  updateLeadFollowup(req, res, next) {
    try {
      const { id } = req.params;
      const { lead_type, status, procedure_explained, followup_notes } = req.body;
      const updateData = {};
      if (lead_type) updateData.lead_type = lead_type;
      if (status) updateData.status = status;
      if (procedure_explained !== undefined) {
        updateData.procedure_explained = procedure_explained === '1' || procedure_explained === 'true' || procedure_explained === true;
      }
      if (followup_notes !== undefined) {
        updateData.followup_notes = followup_notes;
      }

      Lead.update(id, updateData);
      res.redirect(`/admin/leads/${id}?updated=true`);
    } catch (err) {
      next(err);
    }
  },

  // Notification Dismissal
  dismissNotification(req, res, next) {
    try {
      const { id } = req.params;
      Notification.markAsRead(id);
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({ success: true, message: 'Notification marked as read.' });
      }
      res.redirect('/admin/dashboard');
    } catch (err) {
      next(err);
    }
  },

  // Dismiss All Notifications
  dismissAllNotifications(req, res, next) {
    try {
      Notification.markAllAsRead();
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({ success: true, message: 'All notifications cleared.' });
      }
      res.redirect('/admin/dashboard');
    } catch (err) {
      next(err);
    }
  },

  // Smart Job Post Parser (Deterministic rule parser + AI fallback)
  smartParseJob(req, res, next) {
    try {
      const { rawText } = req.body;
      if (!rawText || !rawText.trim()) {
        return res.status(400).json({ success: false, message: 'Please provide job description text.' });
      }

      const parsedData = aiJobService.parseSocialJobPost(rawText);
      res.json({ success: true, data: parsedData });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Generate WhatsApp / Telegram Broadcast Copy for Job
  getJobWhatsAppBroadcast(req, res, next) {
    try {
      const { id } = req.params;
      const job = jobService.getJobById(id);
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }

      const broadcastText = aiJobService.generateSocialBroadcastCopy(job);
      res.json({ success: true, broadcastText });
    } catch (err) {
      next(err);
    }
  },

  // Fast 1-Click AI Generate & Auto-Publish Job Post
  async autoPublishJobAi(req, res, next) {
    try {
      const rawText = req.body.rawText || req.body.details;
      if (!rawText || !rawText.trim()) {
        return res.status(400).json({ success: false, message: 'Please provide job description text.' });
      }

      // Generate structured job data using Qwen-3 engine
      const jobData = await aiJobService.generateJobPost({ details: rawText });

      // Handle optional graphic upload
      if (req.file) {
        const graphicUrl = await documentService.processJobGraphic(req.file);
        if (graphicUrl) {
          jobData.image = graphicUrl;
        }
      }

      // Insert job directly into database
      const newJob = Job.create(jobData);

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(201).json({
          success: true,
          message: 'Job opening synthesized and published successfully!',
          job: newJob,
          redirectUrl: `/jobs/${newJob.job_code || newJob.id}`
        });
      }

      res.redirect(`/jobs/${newJob.job_code || newJob.id}`);
    } catch (err) {
      console.error('[Admin] Auto-publish AI error:', err.message);
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(500).json({ success: false, message: err.message });
      }
      res.redirect('/admin/jobs?error=' + encodeURIComponent(err.message));
    }
  }
};

module.exports = adminController;
