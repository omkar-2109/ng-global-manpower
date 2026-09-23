const Lead = require('../models/Lead');
const Setting = require('../models/Setting');
const env = require('../config/env');

const leadService = {
  createLead(data, clientIp = null) {
    const lead = Lead.create({
      ...data,
      ip_address: clientIp
    });

    const whatsappNumber = Setting.get('whatsapp_number', env.whatsappNumber);

    // Build the high-converting WhatsApp message
    let message = `*APPLICATION FOR OVERSEAS RECRUITMENT (NG GLOBAL)*\n` +
      `----------------------------------------\n` +
      `👤 *Candidate Name:* ${lead.full_name}\n` +
      `📞 *WhatsApp:* ${lead.phone}\n` +
      `🛠️ *Primary Trade:* ${lead.trade}\n` +
      `🌍 *Desired Destination:* ${lead.destination}\n` +
      `⏱️ *Work Experience:* ${lead.experience}\n` +
      `📍 *Current Location:* ${lead.city}\n` +
      `🆔 *Application Ref:* #NG-${lead.id}\n`;

    if (lead.job_code) {
      message += `💼 *Applied For Opening:* [${lead.job_code}]\n`;
    }

    message += `----------------------------------------\n` +
      `*Candidate Note:* I have submitted my trade profile on your website. Please connect with me to assess my profile, discuss suitable employer openings and fee details, and guide me on official visa processing steps.`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    return {
      lead,
      whatsappUrl,
      applicationRef: `NG-${lead.id}`
    };
  },

  getAllLeads(filter = {}) {
    return Lead.all(filter);
  },

  getLeadById(id) {
    return Lead.findById(id);
  },

  updateLeadStatus(id, status, notes = null) {
    return Lead.updateStatus(id, status, notes);
  },

  markLeadBackedOut(id, reason, updatedBy) {
    return Lead.markBackedOut(id, reason, updatedBy);
  },

  deleteLead(id) {
    return Lead.delete(id);
  },

  getDashboardMetrics() {
    return Lead.getMetrics();
  },

  exportToCsv() {
    const leads = Lead.all();
    const headers = ['ID', 'Date', 'Type', 'Full Name', 'Phone', 'Trade', 'Destination', 'Experience', 'City', 'Status', 'Backout Reason', 'Dossier Ready', 'Job Code', 'Notes'];
    
    const rows = leads.map(l => [
      l.id,
      `"${new Date(l.created_at).toLocaleString('en-IN')}"`,
      `"${l.lead_type || 'inquiry_lead'}"`,
      `"${(l.full_name || '').replace(/"/g, '""')}"`,
      `"${(l.phone || '').replace(/"/g, '""')}"`,
      `"${(l.trade || '').replace(/"/g, '""')}"`,
      `"${(l.destination || '').replace(/"/g, '""')}"`,
      `"${(l.experience || '').replace(/"/g, '""')}"`,
      `"${(l.city || '').replace(/"/g, '""')}"`,
      `"${(l.status || '').replace(/"/g, '""')}"`,
      `"${(l.backout_reason || '').replace(/"/g, '""')}"`,
      `"${l.merged_dossier_pdf ? 'Yes' : 'No'}"`,
      `"${(l.job_code || '').replace(/"/g, '""')}"`,
      `"${(l.notes || '').replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
};

module.exports = leadService;
