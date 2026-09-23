const db = require('../config/db');

const Notification = {
  all(filter = {}) {
    let items = db.notifications.all();
    if (filter.is_read !== undefined) {
      items = items.filter(n => n.is_read === filter.is_read);
    }
    if (filter.type) {
      items = items.filter(n => n.type === filter.type);
    }
    return items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getUnread() {
    return this.all({ is_read: false });
  },

  getRecent(limit = 10) {
    return this.all().slice(0, limit);
  },

  create({ type, title, message, lead_id = null, agent_id = null, agent_name = null, priority = 'normal', metadata = {} }) {
    return db.notifications.insert({
      type, // 'candidate_backout', 'status_update', 'new_confirmed_candidate'
      title,
      message,
      lead_id: lead_id ? parseInt(lead_id, 10) : null,
      agent_id: agent_id ? parseInt(agent_id, 10) : null,
      agent_name: agent_name || null,
      priority, // 'urgent', 'high', 'normal'
      is_read: false,
      metadata: metadata || {}
    });
  },

  markAsRead(id) {
    return db.notifications.update(id, { is_read: true, read_at: new Date().toISOString() });
  },

  markAllAsRead() {
    const unread = this.getUnread();
    const now = new Date().toISOString();
    unread.forEach(item => {
      db.notifications.update(item.id, { is_read: true, read_at: now });
    });
    return true;
  },

  delete(id) {
    return db.notifications.delete(id);
  }
};

module.exports = Notification;
