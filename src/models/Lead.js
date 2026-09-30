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
  },

  getAgentAnalytics(agentId = null) {
    let all = db.leads.all();
    if (agentId) {
      const numericId = parseInt(agentId, 10);
      all = all.filter(l => l.agent_id === numericId);
    }

    const total = all.length;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Status counts
    const newCount = all.filter(l => l.status === 'New').length;
    const contactedCount = all.filter(l => l.status === 'Contacted').length;
    const confirmedCount = all.filter(l => l.status === 'Confirmed').length;
    const inProgressCount = all.filter(l => l.status === 'In-Progress').length;
    const placedCount = all.filter(l => l.status === 'Placed').length;
    const backedOutCount = all.filter(l => l.status === 'Backed Out').length;
    const activeCount = newCount + contactedCount + confirmedCount + inProgressCount;
    const dossiersReadyCount = all.filter(l => !!l.merged_dossier_pdf).length;
    const recent30DaysCount = all.filter(l => new Date(l.created_at) >= thirtyDaysAgo).length;

    const placementRate = total > 0 ? ((placedCount / total) * 100).toFixed(1) : '0.0';
    const dossierReadyRate = total > 0 ? ((dossiersReadyCount / total) * 100).toFixed(1) : '0.0';

    // Normalize country / destination
    function normalizeCountry(destStr) {
      const raw = (destStr || '').toLowerCase();
      if (raw.includes('saudi') || raw.includes('ksa') || raw.includes('neom')) {
        return { name: 'Saudi Arabia', flag: '🇸🇦', region: 'Gulf GCC' };
      }
      if (raw.includes('uae') || raw.includes('dubai') || raw.includes('abu dhabi') || raw.includes('emirates')) {
        return { name: 'United Arab Emirates', flag: '🇦🇪', region: 'Gulf GCC' };
      }
      if (raw.includes('qatar')) {
        return { name: 'Qatar', flag: '🇶🇦', region: 'Gulf GCC' };
      }
      if (raw.includes('kuwait')) {
        return { name: 'Kuwait', flag: '🇰🇼', region: 'Gulf GCC' };
      }
      if (raw.includes('oman')) {
        return { name: 'Oman', flag: '🇴🇲', region: 'Gulf GCC' };
      }
      if (raw.includes('bahrain')) {
        return { name: 'Bahrain', flag: '🇧🇭', region: 'Gulf GCC' };
      }
      if (raw.includes('germany') || raw.includes('poland') || raw.includes('europe') || raw.includes('uk') || raw.includes('croatia')) {
        return { name: 'Europe (EU & UK)', flag: '🇪🇺', region: 'Europe' };
      }
      if (raw.includes('singapore') || raw.includes('malaysia')) {
        return { name: 'Singapore & SE Asia', flag: '🇸🇬', region: 'SE Asia' };
      }
      if (raw.includes('usa') || raw.includes('united states') || raw.includes('america')) {
        return { name: 'United States (H-2B)', flag: '🇺🇸', region: 'North America' };
      }
      if (raw.includes('new zealand') || raw.includes('australia')) {
        return { name: 'New Zealand & Aus', flag: '🇳🇿', region: 'Oceania' };
      }
      return { name: destStr && destStr.trim() ? destStr.trim() : 'Gulf Countries', flag: '🌐', region: 'General' };
    }

    const countryMap = {};
    all.forEach(l => {
      const c = normalizeCountry(l.destination);
      if (!countryMap[c.name]) {
        countryMap[c.name] = { name: c.name, flag: c.flag, region: c.region, count: 0, placed: 0, inProgress: 0 };
      }
      countryMap[c.name].count++;
      if (l.status === 'Placed') countryMap[c.name].placed++;
      if (l.status === 'In-Progress') countryMap[c.name].inProgress++;
    });

    const countryBreakdown = Object.values(countryMap).map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // Normalize trades
    function normalizeTrade(tradeStr) {
      const t = (tradeStr || '').toLowerCase();
      if (t.includes('weld') || t.includes('fabricat') || t.includes('fitter') || t.includes('rigg')) {
        return { name: 'Welding & Heavy Fabrication', icon: 'fa-fire-burner' };
      }
      if (t.includes('driv') || t.includes('operator') || t.includes('forklift') || t.includes('truck') || t.includes('trailer')) {
        return { name: 'Heavy Driving & Equipment', icon: 'fa-truck-moving' };
      }
      if (t.includes('electr') || t.includes('mep') || t.includes('plumb') || t.includes('hvac') || t.includes('ac tech')) {
        return { name: 'MEP, Electrical & HVAC', icon: 'fa-bolt' };
      }
      if (t.includes('construct') || t.includes('mason') || t.includes('carpent') || t.includes('steel') || t.includes('scaffold')) {
        return { name: 'Construction & Civil Trades', icon: 'fa-helmet-safety' };
      }
      if (t.includes('nurse') || t.includes('health') || t.includes('medical') || t.includes('hospital')) {
        return { name: 'Healthcare & Nursing', icon: 'fa-user-nurse' };
      }
      if (t.includes('hotel') || t.includes('cook') || t.includes('chef') || t.includes('waiter') || t.includes('hospitality')) {
        return { name: 'Hospitality & Catering', icon: 'fa-utensils' };
      }
      if (t.includes('it') || t.includes('comput') || t.includes('soft') || t.includes('techn') || t.includes('engineer')) {
        return { name: 'IT, Technical & Engineering', icon: 'fa-laptop-code' };
      }
      return { name: tradeStr && tradeStr.trim() ? tradeStr.trim() : 'General Trades', icon: 'fa-briefcase' };
    }

    const tradeMap = {};
    all.forEach(l => {
      const tr = normalizeTrade(l.trade);
      if (!tradeMap[tr.name]) {
        tradeMap[tr.name] = { name: tr.name, icon: tr.icon, count: 0 };
      }
      tradeMap[tr.name].count++;
    });

    const tradeBreakdown = Object.values(tradeMap).map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // GAMCA medical breakdown
    const gamcaBreakdown = {
      passed: all.filter(l => (l.gamca_status || '').toLowerCase().includes('pass') || (l.gamca_status || '').toLowerCase().includes('fit')).length,
      inProcess: all.filter(l => (l.gamca_status || '').toLowerCase().includes('process')).length,
      pending: all.filter(l => !l.gamca_status || (l.gamca_status || '').toLowerCase().includes('pend')).length,
      unfit: all.filter(l => (l.gamca_status || '').toLowerCase().includes('unfit')).length
    };

    // Passport readiness
    const passportBreakdown = {
      withPassport: all.filter(l => !!l.passport_no).length,
      missingPassport: all.filter(l => !l.passport_no).length,
      withExpiry: all.filter(l => !!l.passport_expiry).length
    };

    // Monthly trend for the past 6 calendar months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMonths = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mLabel = monthNames[d.getMonth()] + ' ' + (d.getFullYear() % 100);
      const count = all.filter(l => {
        const cDate = new Date(l.created_at);
        return cDate.getFullYear() === d.getFullYear() && cDate.getMonth() === d.getMonth();
      }).length;
      trendMonths.push({ label: mLabel, count });
    }

    return {
      total,
      activeCount,
      newCount,
      contactedCount,
      confirmedCount,
      inProgressCount,
      placedCount,
      backedOutCount,
      dossiersReadyCount,
      recent30DaysCount,
      placementRate,
      dossierReadyRate,
      statusBreakdown: {
        'New': newCount,
        'Contacted': contactedCount,
        'Confirmed': confirmedCount,
        'In-Progress': inProgressCount,
        'Placed': placedCount,
        'Backed Out': backedOutCount
      },
      countryBreakdown,
      tradeBreakdown,
      gamcaBreakdown,
      passportBreakdown,
      trendMonths
    };
  }
};

module.exports = Lead;
