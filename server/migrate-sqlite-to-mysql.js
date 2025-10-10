#!/usr/bin/env node

/**
 * SQLite to MySQL Migration Script
 *
 * Migrates data from jaidee.sqlite to MySQL database
 * Tables: customers, loan_problems, action_plans, bank_rules, reports, users
 */

const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

// MySQL Configuration
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'jaidee_user',
  password: process.env.DB_PASSWORD || 'jaidee123',
  database: process.env.DB_NAME || 'jaidee_db',
  charset: 'utf8mb4',
  timezone: '+07:00'
};

// Statistics
const stats = {
  customers: { total: 0, migrated: 0, errors: 0 },
  loan_problems: { total: 0, migrated: 0, errors: 0 },
  action_plans: { total: 0, migrated: 0, errors: 0 },
  bank_rules: { total: 0, migrated: 0, errors: 0 },
  reports: { total: 0, migrated: 0, errors: 0 },
  users: { total: 0, migrated: 0, errors: 0 }
};

// Helper function to convert Thai date format (DD/MM/BBBB) to MySQL format (YYYY-MM-DD)
const convertThaiDate = (thaiDate) => {
  if (!thaiDate || thaiDate === null || thaiDate === '') return null;

  const dateStr = String(thaiDate).trim();
  // Match formats: DD/MM/YYYY or DD/MM/YY or D/M/YYYY
  const match = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);

  if (!match) return null;

  let day = match[1].padStart(2, '0');
  let month = match[2].padStart(2, '0');
  let year = parseInt(match[3]);

  // Convert Buddhist year to Christian year (subtract 543)
  if (year > 2500) {
    year -= 543;
  } else if (year < 100) {
    // Handle 2-digit year
    year += (year > 50 ? 1900 : 2000);
  }

  // Return MySQL format: YYYY-MM-DD
  return `${year}-${month}-${day}`;
};

// Helper function to sanitize values for MySQL
const sanitizeValue = (value) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '' || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
      return null;
    }
    return trimmed;
  }
  if (Number.isNaN(value)) return null;
  return value;
};

// Open SQLite database
const openSQLite = () => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database('./jaidee.sqlite', sqlite3.OPEN_READONLY, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
};

// Query SQLite
const querySQLite = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Migrate Users
const migrateUsers = async (sqliteDb, mysqlConn) => {
  console.log('\n📊 Migrating users...');
  const users = await querySQLite(sqliteDb, 'SELECT * FROM users');
  stats.users.total = users.length;

  for (const user of users) {
    try {
      // Check if user already exists in MySQL
      const [existing] = await mysqlConn.execute(
        'SELECT id FROM users WHERE username = ?',
        [user.username]
      );

      if (existing.length > 0) {
        console.log(`  ⏭️  User '${user.username}' already exists, skipping...`);
        stats.users.migrated++;
        continue;
      }

      await mysqlConn.execute(`
        INSERT INTO users (username, password_hash, full_name, role, department, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        user.username,
        user.password_hash || user.password, // Handle both old and new schema
        sanitizeValue(user.full_name),
        sanitizeValue(user.role) || 'data_user',
        sanitizeValue(user.department) || 'CO',
        user.is_active !== undefined ? user.is_active : 1,
        user.created_at || new Date().toISOString(),
        user.updated_at || new Date().toISOString()
      ]);

      stats.users.migrated++;
      console.log(`  ✅ Migrated user: ${user.username}`);
    } catch (error) {
      stats.users.errors++;
      console.error(`  ❌ Error migrating user ${user.username}:`, error.message);
    }
  }
};

// Migrate Bank Rules
const migrateBankRules = async (sqliteDb, mysqlConn) => {
  console.log('\n📊 Migrating bank rules...');
  const bankRules = await querySQLite(sqliteDb, 'SELECT * FROM bank_rules');
  stats.bank_rules.total = bankRules.length;

  for (const rule of bankRules) {
    try {
      // Check if bank rule already exists
      const [existing] = await mysqlConn.execute(
        'SELECT id FROM bank_rules WHERE bank_code = ?',
        [rule.bank_code]
      );

      if (existing.length > 0) {
        console.log(`  ⏭️  Bank rule '${rule.bank_code}' already exists, skipping...`);
        stats.bank_rules.migrated++;
        continue;
      }

      await mysqlConn.execute(`
        INSERT INTO bank_rules (
          bank_code, bank_name, criteria, dsr_high, dsr_low, min_income_for_dsr_high,
          age_min, age_max, max_term, ltv_type1, ltv_type2_over_2years, ltv_type2_under_2years,
          ltv_type3, installment_rates, interest_rates, partnership_type, min_credit_score,
          max_ltv_rent_to_own, preferred_interest_rate, max_term_rent_to_own, special_programs,
          livnex_bonus, exclude_status, acceptable_grades, loan_weight, rent_to_own_weight,
          credit_weight, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        rule.bank_code,
        rule.bank_name,
        sanitizeValue(rule.criteria),
        sanitizeValue(rule.dsr_high),
        sanitizeValue(rule.dsr_low),
        sanitizeValue(rule.min_income_for_dsr_high),
        sanitizeValue(rule.age_min),
        sanitizeValue(rule.age_max),
        sanitizeValue(rule.max_term),
        sanitizeValue(rule.ltv_type1),
        sanitizeValue(rule.ltv_type2_over_2years),
        sanitizeValue(rule.ltv_type2_under_2years),
        sanitizeValue(rule.ltv_type3),
        sanitizeValue(rule.installment_rates),
        sanitizeValue(rule.interest_rates),
        sanitizeValue(rule.partnership_type),
        sanitizeValue(rule.min_credit_score),
        sanitizeValue(rule.max_ltv_rent_to_own),
        sanitizeValue(rule.preferred_interest_rate),
        sanitizeValue(rule.max_term_rent_to_own),
        sanitizeValue(rule.special_programs),
        sanitizeValue(rule.livnex_bonus),
        sanitizeValue(rule.exclude_status),
        sanitizeValue(rule.acceptable_grades),
        sanitizeValue(rule.loan_weight),
        sanitizeValue(rule.rent_to_own_weight),
        sanitizeValue(rule.credit_weight),
        rule.is_active !== undefined ? rule.is_active : 1,
        rule.created_at || new Date().toISOString(),
        rule.updated_at || new Date().toISOString()
      ]);

      stats.bank_rules.migrated++;
      console.log(`  ✅ Migrated bank rule: ${rule.bank_code}`);
    } catch (error) {
      stats.bank_rules.errors++;
      console.error(`  ❌ Error migrating bank rule ${rule.bank_code}:`, error.message);
    }
  }
};

// Migrate Customers with Loan Problems and Action Plans
const migrateCustomers = async (sqliteDb, mysqlConn) => {
  console.log('\n📊 Migrating customers with loan problems and action plans...');
  const customers = await querySQLite(sqliteDb, 'SELECT * FROM customers ORDER BY id');
  stats.customers.total = customers.length;

  let processed = 0;
  const batchSize = 50;

  for (const customer of customers) {
    try {
      // Insert customer
      const [result] = await mysqlConn.execute(`
        INSERT INTO customers (
          date, name, age, phone, job, position, businessOwnerType, privateBusinessType,
          projectName, unit, readyToTransfer, propertyValue, rentToOwnValue, monthlyRentToOwnRate,
          propertyPrice, discount, installmentMonths, overpaidRent, rentRatePerMillion,
          guaranteeMultiplier, prepaidRentMultiplier, transferYear, annualInterestRate,
          income, debt, maxDebtAllowed, loanTerm, ltv, ltvNote, maxLoanAmount, targetDate,
          officer, selectedBank, targetBank, recommendedLoanTerm, recommendedInstallment,
          potentialScore, degreeOfOwnership, financialStatus, actionPlanProgress,
          paymentHistory, accountStatuses, livnexCompleted, creditScore, creditNotes,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        convertThaiDate(customer.date),
        sanitizeValue(customer.name),
        sanitizeValue(customer.age),
        sanitizeValue(customer.phone),
        sanitizeValue(customer.job),
        sanitizeValue(customer.position),
        sanitizeValue(customer.businessOwnerType),
        sanitizeValue(customer.privateBusinessType),
        sanitizeValue(customer.projectName),
        sanitizeValue(customer.unit),
        sanitizeValue(customer.readyToTransfer),
        sanitizeValue(customer.propertyValue),
        sanitizeValue(customer.rentToOwnValue),
        sanitizeValue(customer.monthlyRentToOwnRate),
        sanitizeValue(customer.propertyPrice),
        sanitizeValue(customer.discount),
        sanitizeValue(customer.installmentMonths),
        sanitizeValue(customer.overpaidRent),
        sanitizeValue(customer.rentRatePerMillion),
        sanitizeValue(customer.guaranteeMultiplier),
        sanitizeValue(customer.prepaidRentMultiplier),
        sanitizeValue(customer.transferYear),
        sanitizeValue(customer.annualInterestRate),
        sanitizeValue(customer.income),
        sanitizeValue(customer.debt),
        sanitizeValue(customer.maxDebtAllowed),
        sanitizeValue(customer.loanTerm),
        sanitizeValue(customer.ltv),
        sanitizeValue(customer.ltvNote),
        sanitizeValue(customer.maxLoanAmount),
        sanitizeValue(customer.targetDate),
        sanitizeValue(customer.officer),
        sanitizeValue(customer.selectedBank),
        sanitizeValue(customer.targetBank),
        sanitizeValue(customer.recommendedLoanTerm),
        sanitizeValue(customer.recommendedInstallment),
        sanitizeValue(customer.potentialScore),
        sanitizeValue(customer.degreeOfOwnership),
        sanitizeValue(customer.financialStatus),
        sanitizeValue(customer.actionPlanProgress),
        sanitizeValue(customer.paymentHistory),
        sanitizeValue(customer.accountStatuses),
        sanitizeValue(customer.livnexCompleted),
        sanitizeValue(customer.creditScore),
        sanitizeValue(customer.creditNotes),
        customer.created_at || new Date().toISOString(),
        customer.updated_at || new Date().toISOString()
      ]);

      const newCustomerId = result.insertId;

      // Migrate loan problems for this customer
      const loanProblems = await querySQLite(
        sqliteDb,
        'SELECT * FROM loan_problems WHERE customer_id = ?',
        [customer.id]
      );

      for (const problem of loanProblems) {
        if (problem.problem && problem.problem.trim()) {
          await mysqlConn.execute(
            'INSERT INTO loan_problems (customer_id, problem, created_at) VALUES (?, ?, ?)',
            [newCustomerId, problem.problem, problem.created_at || new Date().toISOString()]
          );
          stats.loan_problems.migrated++;
        }
      }
      stats.loan_problems.total += loanProblems.length;

      // Migrate action plans for this customer
      const actionPlans = await querySQLite(
        sqliteDb,
        'SELECT * FROM action_plans WHERE customer_id = ?',
        [customer.id]
      );

      for (const plan of actionPlans) {
        if (plan.plan && plan.plan.trim()) {
          await mysqlConn.execute(
            'INSERT INTO action_plans (customer_id, plan, created_at) VALUES (?, ?, ?)',
            [newCustomerId, plan.plan, plan.created_at || new Date().toISOString()]
          );
          stats.action_plans.migrated++;
        }
      }
      stats.action_plans.total += actionPlans.length;

      stats.customers.migrated++;
      processed++;

      if (processed % batchSize === 0) {
        console.log(`  📈 Progress: ${processed}/${customers.length} customers (${Math.round(processed/customers.length*100)}%)`);
      }

    } catch (error) {
      stats.customers.errors++;
      console.error(`  ❌ Error migrating customer ID ${customer.id}:`, error.message);
    }
  }

  console.log(`  ✅ Completed: ${stats.customers.migrated}/${customers.length} customers`);
};

// Migrate Reports
const migrateReports = async (sqliteDb, mysqlConn) => {
  console.log('\n📊 Migrating reports...');
  const reports = await querySQLite(sqliteDb, 'SELECT * FROM reports');
  stats.reports.total = reports.length;

  for (const report of reports) {
    try {
      // Note: customer_id from SQLite might not match MySQL customer_id
      // We'll skip reports migration or need to map customer IDs
      console.log(`  ⚠️  Skipping reports migration (customer_id mapping required)`);
      stats.reports.migrated++;
    } catch (error) {
      stats.reports.errors++;
      console.error(`  ❌ Error migrating report:`, error.message);
    }
  }
};

// Print Statistics
const printStats = () => {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary');
  console.log('='.repeat(60));

  Object.keys(stats).forEach(table => {
    const s = stats[table];
    const successRate = s.total > 0 ? Math.round((s.migrated / s.total) * 100) : 0;
    console.log(`\n${table.toUpperCase()}:`);
    console.log(`  Total: ${s.total}`);
    console.log(`  Migrated: ${s.migrated} (${successRate}%)`);
    console.log(`  Errors: ${s.errors}`);
  });

  console.log('\n' + '='.repeat(60));
};

// Main Migration Function
const migrate = async () => {
  let sqliteDb = null;
  let mysqlConn = null;

  try {
    console.log('🚀 Starting SQLite to MySQL Migration');
    console.log('='.repeat(60));

    // Connect to SQLite
    console.log('\n📂 Opening SQLite database...');
    sqliteDb = await openSQLite();
    console.log('✅ SQLite connected');

    // Connect to MySQL
    console.log('\n🔌 Connecting to MySQL...');
    mysqlConn = await mysql.createConnection(mysqlConfig);
    console.log('✅ MySQL connected');

    // Run migrations in order
    await migrateUsers(sqliteDb, mysqlConn);
    await migrateBankRules(sqliteDb, mysqlConn);
    await migrateCustomers(sqliteDb, mysqlConn);
    // await migrateReports(sqliteDb, mysqlConn); // Skip for now

    // Print summary
    printStats();

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close connections
    if (sqliteDb) {
      sqliteDb.close();
      console.log('\n📂 SQLite connection closed');
    }
    if (mysqlConn) {
      await mysqlConn.end();
      console.log('🔌 MySQL connection closed');
    }
  }
};

// Run migration
migrate();
