const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const FILE = path.join(__dirname, '../data/guildConfig.json');

class GuildConfig {
  constructor() {
    this.data = {};
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(FILE)) {
        this.data = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
        logger.debug('Loaded guild config from disk');
      }
    } catch (err) {
      logger.error('Failed to load guild config:', err.message);
    }
  }

  save() {
    try {
      fs.writeFileSync(FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      logger.error('Failed to save guild config:', err.message);
    }
  }

  get(guildId, key) {
    return this.data[guildId]?.[key] ?? null;
  }

  set(guildId, key, value) {
    if (!this.data[guildId]) this.data[guildId] = {};
    this.data[guildId][key] = value;
    this.save();
  }

  delete(guildId, key) {
    if (this.data[guildId]) {
      delete this.data[guildId][key];
      if (Object.keys(this.data[guildId]).length === 0) delete this.data[guildId];
      this.save();
    }
  }
}

module.exports = new GuildConfig();
