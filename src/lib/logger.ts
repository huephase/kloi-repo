// Centralized logger setup
// Uses pino if available, otherwise falls back to console

let pino: any = null;
try {
  pino = require('pino');
} catch (e) {
  // fallback to console
}

const logger = pino ? pino() : console;

export function logInfo(message: string, ...args: any[]) {
  console.log('🟡🟡🟡 - [logInfo] called:', message, ...args);
  logger.info ? logger.info('🟡🟡🟡 - ' + message, ...args) : logger.log('🟡🟡🟡 - ' + message, ...args);
}

export function logWarn(message: string, ...args: any[]) {
  console.log('🟡🟡🟡 - [logWarn] called:', message, ...args);
  logger.warn ? logger.warn('🟡🟡🟡 - ' + message, ...args) : logger.warn('🟡🟡🟡 - ' + message, ...args);
}

export function logError(message: string, ...args: any[]) {
  console.error('❗❗❗ - [logError] called:', message, ...args);
  logger.error ? logger.error('❗❗❗ - ' + message, ...args) : logger.error('❗❗❗ - ' + message, ...args);
}

export function logDebug(message: string, ...args: any[]) {
  console.log('🟡🟡🟡 - [logDebug] called:', message, ...args);
  logger.debug ? logger.debug('🟡🟡🟡 - ' + message, ...args) : logger.log('🟡🟡🟡 - ' + message, ...args);
}

export default logger;
