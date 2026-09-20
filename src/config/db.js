const fs = require('fs');
const path = require('path');
const env = require('./env');

const dbFilePath = path.resolve(env.dbFile.replace(/\.sqlite$/, '.json'));
const dbDir = path.dirname(dbFilePath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// In-memory store with disk persistence
let store = {
  users: [],
  jobs: [],
  leads: [],
  settings: {}
};

// Load existing data from disk
if (fs.existsSync(dbFilePath)) {
  try {
    const raw = fs.readFileSync(dbFilePath, 'utf8');
    store = { ...store, ...JSON.parse(raw) };
  } catch (err) {
    console.error('[DB] Error loading existing database file, initializing clean state:', err.message);
  }
}

// Atomic save to disk
function persist() {
  try {
    const tempPath = `${dbFilePath}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(store, null, 2), 'utf8');
    fs.renameSync(tempPath, dbFilePath);
  } catch (err) {
    console.error('[DB] Persistence error:', err.message);
  }
}

// Table interface
function createTableInterface(tableName) {
  return {
    all() {
      return [...(store[tableName] || [])];
    },

    find(filterFn) {
      const items = store[tableName] || [];
      if (!filterFn) return [...items];
      if (typeof filterFn === 'function') {
        return items.filter(filterFn);
      }
      // Simple key-value match
      return items.filter(item => {
        return Object.entries(filterFn).every(([k, v]) => item[k] === v);
      });
    },

    findOne(filterFn) {
      const items = store[tableName] || [];
      if (typeof filterFn === 'function') {
        return items.find(filterFn) || null;
      }
      return items.find(item => {
        return Object.entries(filterFn).every(([k, v]) => item[k] === v);
      }) || null;
    },

    findById(id) {
      const numericId = parseInt(id, 10);
      const items = store[tableName] || [];
      return items.find(item => item.id === numericId || item.id === id) || null;
    },

    count(filterFn) {
      if (!filterFn) return (store[tableName] || []).length;
      return this.find(filterFn).length;
    },

    insert(data) {
      if (!store[tableName]) store[tableName] = [];
      const items = store[tableName];
      const maxId = items.reduce((max, item) => (item.id > max ? item.id : max), 0);
      const now = new Date().toISOString();
      const record = {
        id: maxId + 1,
        ...data,
        created_at: data.created_at || now,
        updated_at: now
      };
      items.push(record);
      persist();
      return record;
    },

    update(id, data) {
      const numericId = parseInt(id, 10);
      const items = store[tableName] || [];
      const index = items.findIndex(item => item.id === numericId || item.id === id);
      if (index === -1) return null;

      const now = new Date().toISOString();
      items[index] = {
        ...items[index],
        ...data,
        id: items[index].id, // preserve ID
        updated_at: now
      };
      persist();
      return items[index];
    },

    delete(id) {
      const numericId = parseInt(id, 10);
      const items = store[tableName] || [];
      const index = items.findIndex(item => item.id === numericId || item.id === id);
      if (index === -1) return false;

      items.splice(index, 1);
      persist();
      return true;
    }
  };
}

const db = {
  users: createTableInterface('users'),
  jobs: createTableInterface('jobs'),
  leads: createTableInterface('leads'),
  settings: {
    get(key, defaultValue = null) {
      return store.settings && store.settings[key] !== undefined ? store.settings[key] : defaultValue;
    },
    set(key, value) {
      if (!store.settings) store.settings = {};
      store.settings[key] = value;
      persist();
      return value;
    },
    all() {
      return { ...(store.settings || {}) };
    }
  },
  _raw: store,
  persist
};

module.exports = db;
