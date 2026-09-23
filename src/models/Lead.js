const db = require('../config/db');

const Lead = {
  all(filter = {}) {
    let leads = db.leads.all();

    if (filter.agent_id) {
      const agentId = parseInt(filter.agent_id, 10);
      leads = leads.filter(l => l.agent_id === agentId);
    }
    if (filter.status) {
      const targetStatus = filter.status.toLowerCase();
      leads = leads.filter(l => (l.status || '').toLowerCase() === targetStatus);
    }
    if (filter.lead_type) {
      leads = leads.filter(l => (l.lead_type || 'inquiry_lead') === filter.lead_type);
    }
    if (filter.has_dossier !== undefined) {
      if (filter.has_dossier) {
        leads = leads.filter(l => !!l.merged_dossier_pdf);
      } else {
        leads = leads.filter(l => !l.merged_dossier_pdf);
      }
    }
    if (filter.trade) {
      leads = leads.filter(l => (l.trade || '').toLowerCase().includes(filter.trade.toLowerCase()));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      leads = leads.filter(l => 
        (l.full_name || '').toLowerCase().includes(q) || 
        (l.phone || '').includes(q) || 
        (l.city || '').toLowerCase().includes(q) ||
        (l.passport_no || '').toLowerCase().includes(q) ||
        (l.trade || '').toLowerCase().includes(q)
      );
    }

    // Sort by created_at descending (latest first)
    return leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  findById(id) {
    return db.leads.findById(id);
  },

  create(data) {
    const isAgent = !!data.agent_id;
    const hasDocs = (data.documents && data.documents.length > 0) || !!data.merged_dossier_pdf;
    
    // Default classification: inquiries vs confirmed candidates ready to pay & go
    const leadType = data.lead_type || (isAgent || hasDocs || data.status === 'Confirmed' ? 'confirmed_candidate' : 'inquiry_lead');
    const defaultStatus = data.status || (leadType === 'confirmed_candidate' ? 'Confirmed' : 'New');

    return db.leads.insert({
      full_name: data.full_name,
      phone: data.phone,
      whatsapp: data.whatsapp || data.phone,
      email: data.email || '',
      trade: data.trade || 'General Trade',
      destination: data.destination || 'Gulf Countries',
      experience: data.experience || '1 to 2 Years',
      city: data.city || 'Not Specified',
      state: data.state || '',
      nationality: data.nationality || 'Indian',
      passport_no: data.passport_no ? data.passport_no.trim().toUpperCase() : null,
      passport_expiry: data.passport_expiry || null,
      dob: data.dob || null,
      gamca_status: data.gamca_status || 'Pending',
      source: data.source || (data.agent_id ? 'agent_intake' : 'eligibility_wizard'),
      lead_type: leadType, // 'inquiry_lead' (query) or 'confirmed_candidate' (ready to pay)
      job_code: data.job_code || null,
      agent_id: data.agent_id ? parseInt(data.agent_id, 10) : null,
      agent_username: data.agent_username || null,
      documents: data.documents || [],
      merged_dossier_pdf: data.merged_dossier_pdf || null,
      status: defaultStatus,
      notes: data.notes || '',
      procedure_explained: data.procedure_explained || false,
      followup_notes: data.followup_notes || '',
      backout_reason: data.backout_reason || null,
      backed_out_at: data.backed_out_at || null,
      backed_out_by: data.backed_out_by || null,
      ip_address: data.ip_address || null
    });
  },

  update(id, data) {
    return db.leads.update(id, data);
  },

  updateStatus(id, status, notes = null) {
    const updatePayload = { status };
    if (notes !== null) {
      updatePayload.notes = notes;
    }
    return db.leads.update(id, updatePayload);
  },

  markBackedOut(id, reason, updatedBy = 'Agent') {
    const lead = this.findById(id);
    if (!lead) return null;

    const existingNotes = lead.notes ? `${lead.notes}\n` : '';
    const timestamp = new Date().toLocaleString('en-IN');
    const newNotes = `${existingNotes}[${timestamp} - Marked Backed Out by ${updatedBy}]: ${reason}`.trim();

    return db.leads.update(id, {
      status: 'Backed Out',
      backout_reason: reason,
      backed_out_at: new Date().toISOString(),
      backed_out_by: updatedBy,
      notes: newNotes
    });
  },

  delete(id) {
    return db.leads.delete(id);
  },

  getMetrics(agentId = null) {
    let all = db.leads.all();
    if (agentId) {
      const numericId = parseInt(agentId, 10);
      all = all.filter(l => l.agent_id === numericId);
    }
    return {
      total: all.length,
      new: all.filter(l => l.status === 'New').length,
      inquiries: all.filter(l => (l.lead_type || 'inquiry_lead') === 'inquiry_lead').length,
      confirmed: all.filter(l => (l.lead_type || 'inquiry_lead') === 'confirmed_candidate').length,
      contacted: all.filter(l => l.status === 'Contacted').length,
      inProgress: all.filter(l => l.status === 'In-Progress').length,
      placed: all.filter(l => l.status === 'Placed').length,
      backedOut: all.filter(l => l.status === 'Backed Out').length,
      dossiersReady: all.filter(l => !!l.merged_dossier_pdf).length
    };
  }
};

module.exports = Lead;
