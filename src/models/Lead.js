const db = require('../config/db');

const Lead = {
  all(filter = {}) {
    let leads = db.leads.all();

    if (filter.status) {
      leads = leads.filter(l => l.status.toLowerCase() === filter.status.toLowerCase());
    }
    if (filter.trade) {
      leads = leads.filter(l => l.trade.toLowerCase().includes(filter.trade.toLowerCase()));
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      leads = leads.filter(l => 
        l.full_name.toLowerCase().includes(q) || 
        l.phone.includes(q) || 
        l.city.toLowerCase().includes(q)
      );
    }

    // Sort by created_at descending (latest first)
    return leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  findById(id) {
    return db.leads.findById(id);
  },

  create(data) {
    return db.leads.insert({
      full_name: data.full_name,
      phone: data.phone,
      trade: data.trade || 'General Trade',
      destination: data.destination || 'Gulf Countries',
      experience: data.experience || '1 to 2 Years',
      city: data.city || 'Not Specified',
      source: data.source || 'eligibility_wizard',
      job_code: data.job_code || null,
      status: 'New',
      notes: data.notes || '',
      ip_address: data.ip_address || null
    });
  },

  updateStatus(id, status, notes = null) {
    const updatePayload = { status };
    if (notes !== null) {
      updatePayload.notes = notes;
    }
    return db.leads.update(id, updatePayload);
  },

  delete(id) {
    return db.leads.delete(id);
  },

  getMetrics() {
    const all = db.leads.all();
    return {
      total: all.length,
      new: all.filter(l => l.status === 'New').length,
      contacted: all.filter(l => l.status === 'Contacted').length,
      inProgress: all.filter(l => l.status === 'In-Progress').length,
      placed: all.filter(l => l.status === 'Placed').length
    };
  }
};

module.exports = Lead;
