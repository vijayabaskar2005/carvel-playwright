/**
 * Centralized framework logger.
 * All framework execution and progress logging must route through log_step().
 * Direct console.log / console.error / console.warn calls are prohibited elsewhere.
 */
function log_step(message) {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  // eslint-disable-next-line no-console
  console.log(`[${timestamp}] [STEP] ${message}`);
}

module.exports = {
  log_step,
  default: log_step,
};
