const leadService = require('../services/leadService');
const jobService = require('../services/jobService');
const Setting = require('../models/Setting');
const env = require('../config/env');

const adminController = {
  // Dashboard Overview
  showDashboard(req, res, next) {
    try {
      const metrics = leadService.getDashboardMetrics();
      const recentLeads = leadService.getAllLeads().slice(0, 8);
      const activeJobsCount = jobService.getActiveJobs().length;

      res.render('admin/dashboard', {
        title: 'Recruitment Command Center | NG Global',
        metrics,
        recentLeads,
        activeJobsCount,
        path: '/admin/dashboard'
      });
    } catch (err) {
      next(err);
    }
  },

  // Leads Management Page
  showLeads(req, res, next) {
    try {
      const { status, trade, search } = req.query;
      const leads = leadService.getAllLeads({ status, trade, search });
      const metrics = leadService.getDashboardMetrics();

      res.render('admin/leads', {
        title: 'Candidate Applications | NG Global',
        leads,
        metrics,
        filter: { status, trade, search },
        path: '/admin/leads'
      });
    } catch (err) {
      next(err);
    }
  },

  // Single Lead Detail Page
  showLeadDetail(req, res, next) {
    try {
      const lead = leadService.getLeadById(req.params.id);
      if (!lead) {
        return res.status(404).render('pages/404', { title: 'Candidate Profile Not Found' });
      }

      // WhatsApp direct clean link
      const cleanPhone = (lead.phone || '').replace(/[^0-9]/g, '');
      const quickWhatsAppUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello ${lead.full_name}, this is NG Global Manpower Services following up on your overseas application (#NG-${lead.id}) for ${lead.trade}.`)}`;

      res.render('admin/lead-detail', {
        title: `Candidate: ${lead.full_name} | NG Global`,
        lead,
        quickWhatsAppUrl,
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
  }
};

module.exports = adminController;
