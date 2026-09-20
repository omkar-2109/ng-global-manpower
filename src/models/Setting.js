const db = require('../config/db');

const Setting = {
  get(key, defaultValue = null) {
    return db.settings.get(key, defaultValue);
  },

  set(key, value) {
    return db.settings.set(key, value);
  },

  all() {
    return db.settings.all();
  }
};

module.exports = Setting;
