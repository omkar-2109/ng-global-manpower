const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
  findByEmail(email) {
    if (!email) return null;
    return db.users.findOne(u => u.email.toLowerCase() === email.toLowerCase());
  },

  findById(id) {
    return db.users.findById(id);
  },

  create({ name, email, password, role = 'recruiter' }) {
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(password, salt);
    return db.users.insert({
      name,
      email: email.toLowerCase(),
      password_hash,
      role
    });
  },

  verifyPassword(candidatePassword, storedHash) {
    return bcrypt.compareSync(candidatePassword, storedHash);
  },

  updatePassword(id, newPassword) {
    const salt = bcrypt.genSaltSync(10);
    const password_hash = bcrypt.hashSync(newPassword, salt);
    return db.users.update(id, { password_hash });
  },

  all() {
    return db.users.all().map(({ password_hash, ...rest }) => rest);
  }
};

module.exports = User;
