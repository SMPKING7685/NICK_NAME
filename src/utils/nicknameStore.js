const fs = require('fs');
const path = require('path');
const logger = require('./logger');

const FILE = path.join(__dirname, '../data/nicknames.json');

class NicknameStore {
  constructor() {
    this.data = new Map();
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(FILE)) {
        const raw = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
        for (const [guildId, users] of Object.entries(raw)) {
          const guildMap = new Map();
          for (const [userId, nickname] of Object.entries(users)) {
            guildMap.set(userId, nickname);
          }
          this.data.set(guildId, guildMap);
        }
        logger.debug('Loaded nickname store from disk');
      }
    } catch (err) {
      logger.error('Failed to load nickname store:', err.message);
    }
  }

  save() {
    try {
      const obj = {};
      for (const [guildId, guildMap] of this.data) {
        obj[guildId] = Object.fromEntries(guildMap);
      }
      fs.writeFileSync(FILE, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (err) {
      logger.error('Failed to save nickname store:', err.message);
    }
  }

  set(guildId, userId, nickname) {
    if (!this.data.has(guildId)) {
      this.data.set(guildId, new Map());
    }
    this.data.get(guildId).set(userId, nickname);
    this.save();
    logger.debug(`Stored nickname for user ${userId} in guild ${guildId}: ${nickname}`);
  }

  get(guildId, userId) {
    return this.data.get(guildId)?.get(userId) || null;
  }

  delete(guildId, userId) {
    const guildMap = this.data.get(guildId);
    if (guildMap) {
      const deleted = guildMap.delete(userId);
      if (guildMap.size === 0) this.data.delete(guildId);
      if (deleted) this.save();
      return deleted;
    }
    return false;
  }

  getAll(guildId) {
    const guildMap = this.data.get(guildId);
    return guildMap ? Array.from(guildMap.entries()) : [];
  }

  clear(guildId) {
    this.data.delete(guildId);
    this.save();
    logger.debug(`Cleared all nickname data for guild ${guildId}`);
  }
}

module.exports = new NicknameStore();
