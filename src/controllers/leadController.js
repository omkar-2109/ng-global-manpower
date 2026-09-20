const leadService = require('../services/leadService');

const leadController = {
  // Public API to submit lead from 3-step wizard or quick apply
  submitLead(req, res, next) {
    try {
      const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const result = leadService.createLead(req.body, clientIp);

      return res.status(201).json({
        success: true,
        message: 'Your eligibility assessment has been registered successfully.',
        applicationRef: result.applicationRef,
        whatsappUrl: result.whatsappUrl,
        lead: {
          id: result.lead.id,
          full_name: result.lead.full_name,
          trade: result.lead.trade,
          destination: result.lead.destination
        }
      });
    } catch (err) {
      next(err);
    }
  },

  // Admin API: List all leads
  getLeads(req, res, next) {
    try {
      const filter = {
        status: req.query.status,
        trade: req.query.trade,
        search: req.query.search
      };
      const leads = leadService.getAllLeads(filter);
      res.json({ success: true, count: leads.length, leads });
    } catch (err) {
      next(err);
    }
  },

  // Admin API / Form: Update lead status
  updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const updated = leadService.updateLeadStatus(id, status, notes);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Lead not found.' });
      }

      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({ success: true, message: 'Lead updated successfully.', lead: updated });
      }

      res.redirect(`/admin/leads/${id}?updated=true`);
    } catch (err) {
      next(err);
    }
  },

  // Admin API: Delete lead
  deleteLead(req, res, next) {
    try {
      const { id } = req.params;
      leadService.deleteLead(id);
      if (req.xhr || req.headers.accept?.includes('json')) {
        return res.json({ success: true, message: 'Lead removed.' });
      }
      res.redirect('/admin/leads?deleted=true');
    } catch (err) {
      next(err);
    }
  },

  // Admin: Download CSV export
  exportCsv(req, res, next) {
    try {
      const csv = leadService.exportToCsv();
      const filename = `ng_global_leads_${new Date().toISOString().slice(0, 10)}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.status(200).send(csv);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = leadController;
