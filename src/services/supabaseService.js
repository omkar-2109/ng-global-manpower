const env = require('../config/env');

const supabaseService = {
  isEnabled() {
    return Boolean(env.supabase && env.supabase.url && env.supabase.key);
  },

  getHeaders() {
    const key = env.supabase.key;
    return {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    };
  },

  getBaseUrl() {
    const url = (env.supabase.url || '').trim().replace(/\/+$/, '');
    return `${url}/rest/v1`;
  },

  // Fetch all rows from a Supabase table
  async fetchTable(table) {
    if (!this.isEnabled()) return null;
    try {
      const url = `${this.getBaseUrl()}/${table}?select=*`;
      const res = await fetch(url, { headers: this.getHeaders() });
      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`[Supabase] Table ${table} fetch returned status ${res.status}:`, errorText.slice(0, 150));
        return null;
      }
      const data = await res.json();
      return Array.isArray(data) ? data : null;
    } catch (err) {
      console.warn(`[Supabase] Table ${table} fetch error:`, err.message);
      return null;
    }
  },

  // Push single record (upsert)
  async pushRecord(table, data) {
    if (!this.isEnabled() || !data) return;
    try {
      const url = `${this.getBaseUrl()}/${table}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          ...this.getHeaders(),
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Supabase] Upsert into ${table} failed (${res.status}):`, errText.slice(0, 150));
      }
    } catch (err) {
      console.warn(`[Supabase] pushRecord error for ${table}:`, err.message);
    }
  },

  // Update record by id
  async updateRecord(table, id, data) {
    if (!this.isEnabled() || !id) return;
    try {
      const url = `${this.getBaseUrl()}/${table}?id=eq.${id}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Supabase] updateRecord in ${table} id=${id} failed (${res.status}):`, errText.slice(0, 150));
      }
    } catch (err) {
      console.warn(`[Supabase] updateRecord error for ${table}:`, err.message);
    }
  },

  // Delete record by id or extra attributes (e.g. job_code)
  async deleteRecord(table, id, extra = null) {
    if (!this.isEnabled() || !id) return;
    try {
      const url = `${this.getBaseUrl()}/${table}?id=eq.${id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Supabase] deleteRecord from ${table} id=${id} failed (${res.status}):`, errText.slice(0, 150));
      }

      // If deleting a job, also delete by job_code just in case it was stored under its unique code
      if (table === 'jobs' && extra && extra.job_code) {
        const urlCode = `${this.getBaseUrl()}/${table}?job_code=eq.${encodeURIComponent(extra.job_code)}`;
        await fetch(urlCode, {
          method: 'DELETE',
          headers: this.getHeaders()
        }).catch(() => {});
      }
    } catch (err) {
      console.warn(`[Supabase] deleteRecord error for ${table}:`, err.message);
    }
  },

  // Delete many records by ids
  async deleteManyRecords(table, ids) {
    if (!this.isEnabled() || !Array.isArray(ids) || ids.length === 0) return;
    try {
      const idList = ids.map(id => encodeURIComponent(id)).join(',');
      const url = `${this.getBaseUrl()}/${table}?id=in.(${idList})`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      if (!res.ok) {
        const errText = await res.text();
        console.warn(`[Supabase] deleteManyRecords from ${table} failed (${res.status}):`, errText.slice(0, 150));
      }
    } catch (err) {
      console.warn(`[Supabase] deleteManyRecords error for ${table}:`, err.message);
    }
  },

  // Synchronize on startup: Strictly fetch live database state from Supabase
  async syncOnStartup(store, persistFn) {
    if (!this.isEnabled()) {
      console.log('[Supabase] Supabase credentials not configured; operating in local JSON mode.');
      return;
    }

    try {
      console.log('[Supabase] Connecting to Supabase to fetch live jobs & database state...');
      const remoteJobs = await this.fetchTable('jobs');

      if (Array.isArray(remoteJobs)) {
        console.log(`[Supabase] Successfully fetched ${remoteJobs.length} live jobs from Supabase.`);
        // Jobs come strictly from Supabase! Never inject test jobs from git.
        store.jobs = remoteJobs;
        if (typeof persistFn === 'function') persistFn();
      } else {
        console.warn('[Supabase] Could not fetch jobs from Supabase (returned non-array or error). Keeping current memory state.');
      }

      // Check leads
      const remoteLeads = await this.fetchTable('leads');
      if (Array.isArray(remoteLeads) && remoteLeads.length > 0) {
        console.log(`[Supabase] Found ${remoteLeads.length} leads in Supabase.`);
        const localLeadIds = new Set((store.leads || []).map(l => l.id));
        for (const rLead of remoteLeads) {
          if (!localLeadIds.has(rLead.id)) {
            store.leads.push(rLead);
          }
        }
        if (typeof persistFn === 'function') persistFn();
      }

      // Check settings
      const remoteSettings = await this.fetchTable('settings');
      if (Array.isArray(remoteSettings) && remoteSettings.length > 0) {
        for (const s of remoteSettings) {
          if (s.key && s.value !== undefined) {
            store.settings[s.key] = s.value;
          }
        }
      }
    } catch (err) {
      console.warn('[Supabase] Startup synchronization notice:', err.message);
    }
  }
};

module.exports = supabaseService;
