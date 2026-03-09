/**
 * Test Setup Helper
 * Creates a JWT token and provides test utilities
 */
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'jaidee-secret-key-2025';

/** Generate a test JWT token for a given role */
function getTestToken(role = 'admin') {
  return jwt.sign(
    { id: 1, username: `test_${role}`, role, department: 'CO' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/** Wait for database to be initialized */
function waitForDb(ms = 2000) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { getTestToken, waitForDb, JWT_SECRET };
