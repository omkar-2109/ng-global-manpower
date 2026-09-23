const db = require('../config/db');
const bcrypt = require('bcryptjs');

const Agent = {
  all() {
    return db.agents.all().map(({ password_hash, ...rest }) => rest);
  },

  findById(id) {
    return db.agents.findById(id);
  },

  findByUsername(username) {
    if (!username) return null;
    const clean = username.trim().toLowerCase();
    return db.agents.findOne(a => a.username && a.username.toLowerCase() === clean);
  },

  findByEmail(email) {
    if (!email) return null;
    return db.agents.findOne(a => a.email && a.email.toLowerCase() === email.trim().toLowerCase());
  },

  create({
    name,
    agency_name,
    username,
    email,
    phone,
    city = '',
    state = '',
    country = 'India',
    license_no = '',
    password,
    commission_notes = '',
    status = 'active'
  }) {
    // Sanitize slug/username for subdomain use (lowercase alphanumeric + hyphens)
    const cleanUsername = (username || name)
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);

    return db.agents.insert({
      name: name.trim(),
      agency_name: (agency_name || name).trim(),
      username: cleanUsername,
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country.trim(),
      license_no: license_no.trim(),
      password_hash,
      commission_notes: commission_notes.trim(),
      status: status || 'active',
      candidates_count: 0
    });
  },

  update(id, data) {
    const payload = { ...data };
    if (payload.username) {
      payload.username = payload.username
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }
    if (payload.password) {
      const salt = bcrypt.genSaltSync(10);
      payload.password_hash = bcrypt.hashSync(payload.password, salt);
      delete payload.password;
    }
    return db.agents.update(id, payload);
  },

  updatePassword(id, newPassword) {
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(newPassword, salt);
    return db.agents.update(id, { password_hash });
  },

  verifyPassword(candidatePassword, storedHash) {
    if (!candidatePassword || !storedHash) return false;
    return bcrypt.compareSync(candidatePassword, storedHash);
  },

  delete(id) {
    return db.agents.delete(id);
  },

  incrementCandidateCount(id) {
    const agent = this.findById(id);
    if (agent) {
      return db.agents.update(id, {
        candidates_count: (agent.candidates_count || 0) + 1
      });
    }
    return null;
  }
};

module.exports = Agent;
