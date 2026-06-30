const timestamp = () => new Date().toISOString();

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LEVEL = process.env.NODE_ENV === 'development' ? 'debug' : 'info';

const logger = {
  debug: (message, ...args) => {
    if (LOG_LEVELS[CURRENT_LEVEL] <= LOG_LEVELS.debug) {
      console.debug(`[${timestamp()}] [DEBUG] ${message}`, ...args);
    }
  },

  info: (message, ...args) => {
    if (LOG_LEVELS[CURRENT_LEVEL] <= LOG_LEVELS.info) {
      console.log(`[${timestamp()}] [INFO] ${message}`, ...args);
    }
  },

  warn: (message, ...args) => {
    if (LOG_LEVELS[CURRENT_LEVEL] <= LOG_LEVELS.warn) {
      console.warn(`[${timestamp()}] [WARN] ${message}`, ...args);
    }
  },

  error: (message, ...args) => {
    if (LOG_LEVELS[CURRENT_LEVEL] <= LOG_LEVELS.error) {
      console.error(`[${timestamp()}] [ERROR] ${message}`, ...args);
    }
  },
};

module.exports = logger;
