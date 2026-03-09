/**
 * Database Migration System
 * Idempotent migrations that can be run multiple times safely
 */

/**
 * Run a single ALTER TABLE migration safely (ignores "duplicate column" errors)
 * @param {Object} db - SQLite database instance
 * @param {string} sql - ALTER TABLE SQL statement
 * @returns {Promise<void>}
 */
const runAlterTable = (db, sql) => {
  return new Promise((resolve) => {
    db.run(sql, (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.warn('Migration warning:', err.message);
      }
      resolve();
    });
  });
};

/**
 * Run CREATE TABLE IF NOT EXISTS safely
 * @param {Object} db - SQLite database instance
 * @param {string} sql - CREATE TABLE SQL statement
 * @returns {Promise<void>}
 */
const runCreateTable = (db, sql) => {
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      if (err) {
        console.error('Migration error:', err.message);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Migration: Add DOC2026 fields to customers table
 * New fields for workflow, consent, case assignment, and approval tracking
 */
const migrateCustomersDOC2026 = async (db) => {
  const alterations = [
    // Workflow status
    "ALTER TABLE customers ADD COLUMN loan_status TEXT DEFAULT 'new'",
    // Consent management
    'ALTER TABLE customers ADD COLUMN consent_status TEXT',
    'ALTER TABLE customers ADD COLUMN consent_date TEXT',
    // Case assignment
    'ALTER TABLE customers ADD COLUMN assigned_ca TEXT',
    'ALTER TABLE customers ADD COLUMN assigned_co TEXT',
    // Approval tracking
    'ALTER TABLE customers ADD COLUMN approval_date TEXT',
    'ALTER TABLE customers ADD COLUMN rejection_date TEXT',
    'ALTER TABLE customers ADD COLUMN cancellation_reason TEXT',
    // APP-IN reference
    'ALTER TABLE customers ADD COLUMN app_in_number TEXT',
    'ALTER TABLE customers ADD COLUMN rem_livnex_ref TEXT',
    // Product details (DOC2026 section 3)
    'ALTER TABLE customers ADD COLUMN area_sqm REAL',
    'ALTER TABLE customers ADD COLUMN deposit_amount REAL',
    'ALTER TABLE customers ADD COLUMN price_after_discount REAL',
    // Co-borrower (DOC2026 section 1)
    'ALTER TABLE customers ADD COLUMN co_borrower_name TEXT',
    'ALTER TABLE customers ADD COLUMN co_borrower_id_card TEXT',
    'ALTER TABLE customers ADD COLUMN co_borrower_phone TEXT',
    // ID card for main borrower
    'ALTER TABLE customers ADD COLUMN id_card TEXT',
    // Plot number (เลขแปลง)
    'ALTER TABLE customers ADD COLUMN plot_number TEXT',
  ];

  for (const sql of alterations) {
    await runAlterTable(db, sql);
  }
  console.log('Migration: customers DOC2026 fields - done');
};

/**
 * Migration: Create loan_applications table (APP-IN)
 * Tracks case intake from REM LivNex
 */
const createLoanApplicationsTable = async (db) => {
  await runCreateTable(db, `
    CREATE TABLE IF NOT EXISTS loan_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      app_in_number TEXT UNIQUE,
      rem_livnex_ref TEXT,
      application_date TEXT NOT NULL,
      loan_status TEXT DEFAULT 'new'
        CHECK (loan_status IN (
          'new', 'document_check', 'document_incomplete',
          'bureau_check', 'analyzing', 'approved', 'rejected',
          'transferred', 'cancelled', 'cancelled_after_approval'
        )),
      status_reason TEXT,
      status_updated_at DATETIME,
      assigned_ca TEXT,
      assigned_co TEXT,
      source TEXT DEFAULT 'REM_LivNex',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
    )
  `);
  console.log('Migration: loan_applications table - done');
};

/**
 * Migration: Create bureau_requests table
 * Tracks bureau check history + 3-month duplicate detection
 */
const createBureauRequestsTable = async (db) => {
  await runCreateTable(db, `
    CREATE TABLE IF NOT EXISTS bureau_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      loan_application_id INTEGER,
      request_date TEXT NOT NULL,
      expiry_date TEXT,
      form1_status TEXT DEFAULT 'pending'
        CHECK (form1_status IN ('pending', 'received', 'verified', 'rejected')),
      form2_status TEXT DEFAULT 'pending'
        CHECK (form2_status IN ('pending', 'received', 'verified', 'rejected')),
      form2_received_date TEXT,
      bureau_result TEXT,
      bureau_score REAL,
      consent_status TEXT DEFAULT 'pending'
        CHECK (consent_status IN ('pending', 'received', 'expired')),
      consent_date TEXT,
      requested_by TEXT,
      verified_by TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
      FOREIGN KEY (loan_application_id) REFERENCES loan_applications (id) ON DELETE SET NULL
    )
  `);
  console.log('Migration: bureau_requests table - done');
};

/**
 * Migration: Create debt_items table
 * Replaces single 'debt' field with detailed debt breakdown
 * Calculation rules from DOC2026:
 *   - revolving_personal: 5% of outstanding_balance
 *   - revolving_credit_card: 8% of outstanding_balance
 *   - revolving_other: 5% of outstanding_balance
 *   - installment: monthly_payment (or outstanding_balance if monthly < balance)
 *   - joint_loan: monthly_payment / 2
 */
const createDebtItemsTable = async (db) => {
  await runCreateTable(db, `
    CREATE TABLE IF NOT EXISTS debt_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      debt_type TEXT NOT NULL
        CHECK (debt_type IN (
          'revolving_personal', 'revolving_credit_card', 'revolving_other',
          'installment', 'joint_loan', 'legacy'
        )),
      creditor_name TEXT,
      outstanding_balance REAL DEFAULT 0,
      monthly_payment REAL DEFAULT 0,
      calculated_payment REAL DEFAULT 0,
      is_joint_loan INTEGER DEFAULT 0,
      account_status TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
    )
  `);
  console.log('Migration: debt_items table - done');
};

/**
 * Migration: Create livnex_tracking table
 * Tracks post-approval status (Active/Transfer/Cancel)
 */
const createLivnexTrackingTable = async (db) => {
  await runCreateTable(db, `
    CREATE TABLE IF NOT EXISTS livnex_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      loan_application_id INTEGER,
      approval_date TEXT,
      status TEXT DEFAULT 'approved'
        CHECK (status IN ('approved', 'active', 'transferred', 'cancelled')),
      transfer_date TEXT,
      cancellation_date TEXT,
      cancellation_reason TEXT,
      jd_officer TEXT,
      co_officer TEXT,
      performance_notes TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
      FOREIGN KEY (loan_application_id) REFERENCES loan_applications (id) ON DELETE SET NULL
    )
  `);
  console.log('Migration: livnex_tracking table - done');
};

/**
 * Migration: Create ca_recommendations table
 * Stores credit advisor recommendations for customers
 */
const createCARecommendationsTable = async (db) => {
  await runCreateTable(db, `
    CREATE TABLE IF NOT EXISTS ca_recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      loan_application_id INTEGER,
      problem_description TEXT,
      solution TEXT,
      bank_scores TEXT,
      dsr_calculated REAL,
      dsr_breakdown TEXT,
      co_tracking_status TEXT DEFAULT 'pending'
        CHECK (co_tracking_status IN ('pending', 'in_progress', 'completed', 'cancelled')),
      co_officer TEXT,
      ca_officer TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
      FOREIGN KEY (loan_application_id) REFERENCES loan_applications (id) ON DELETE SET NULL
    )
  `);
  console.log('Migration: ca_recommendations table - done');
};

/**
 * Migrate existing debt data from customers.debt to debt_items table
 * Creates a 'legacy' type entry preserving original data
 * Only runs if there are customers with debt but no debt_items
 */
const migrateDebtData = async (db) => {
  return new Promise((resolve) => {
    db.all(
      `SELECT c.id, c.debt FROM customers c
       WHERE c.debt IS NOT NULL AND c.debt > 0
       AND NOT EXISTS (SELECT 1 FROM debt_items d WHERE d.customer_id = c.id)`,
      [],
      (err, rows) => {
        if (err || !rows || rows.length === 0) {
          console.log('Migration: debt data migration - skipped (no data to migrate)');
          resolve();
          return;
        }

        let completed = 0;
        rows.forEach(row => {
          db.run(
            `INSERT INTO debt_items (customer_id, debt_type, outstanding_balance, monthly_payment, calculated_payment, notes)
             VALUES (?, 'legacy', ?, ?, ?, 'Migrated from customers.debt field')`,
            [row.id, row.debt, row.debt, row.debt],
            () => {
              completed++;
              if (completed === rows.length) {
                console.log(`Migration: debt data migration - ${rows.length} records migrated`);
                resolve();
              }
            }
          );
        });
      }
    );
  });
};

/**
 * Run all DOC2026 migrations in order
 * @param {Object} db - SQLite database instance
 * @returns {Promise<void>}
 */
const runDOC2026Migrations = async (db) => {
  console.log('--- Running DOC2026 Migrations ---');

  // 1. Add new fields to customers (no FK dependencies)
  await migrateCustomersDOC2026(db);

  // 2. Create tables in FK dependency order
  await createLoanApplicationsTable(db);      // no FK to new tables
  await createBureauRequestsTable(db);        // FK -> loan_applications
  await createDebtItemsTable(db);             // FK -> customers only
  await createLivnexTrackingTable(db);        // FK -> loan_applications
  await createCARecommendationsTable(db);     // FK -> loan_applications

  // 3. Migrate existing data
  await migrateDebtData(db);

  console.log('--- DOC2026 Migrations Complete ---');
};

module.exports = {
  runDOC2026Migrations
};
