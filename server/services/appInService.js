/**
 * APP-IN Number Generation Service
 * Format: APPIN-YYMM-XXXX (e.g., APPIN-2603-0001)
 */
const { db } = require('../database');

/**
 * Generate next APP-IN number for current month
 * Format: APPIN-YYMM-XXXX where XXXX is zero-padded sequence
 * @returns {Promise<string>}
 */
const generateAppInNumber = () => {
  return new Promise((resolve, reject) => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `APPIN-${yy}${mm}-`;

    // Find max sequence for this month
    db.get(
      `SELECT app_in_number FROM loan_applications
       WHERE app_in_number LIKE ?
       ORDER BY app_in_number DESC LIMIT 1`,
      [`${prefix}%`],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        let nextSeq = 1;
        if (row && row.app_in_number) {
          const lastSeq = parseInt(row.app_in_number.split('-')[2], 10);
          if (!isNaN(lastSeq)) {
            nextSeq = lastSeq + 1;
          }
        }

        const appInNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;
        resolve(appInNumber);
      }
    );
  });
};

module.exports = { generateAppInNumber };
