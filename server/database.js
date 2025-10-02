const mysql = require('mysql2/promise');

// MySQL Configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'jaidee_user',
  password: process.env.DB_PASSWORD || 'jaidee123',
  database: process.env.DB_NAME || 'jaidee_db',
  charset: 'utf8mb4',
  timezone: '+07:00',
  acquireTimeout: 60000,
  timeout: 60000,
  multipleStatements: true
};

// Create MySQL connection pool
const pool = mysql.createPool({
  ...dbConfig,
  connectionLimit: 10,
  queueLimit: 0,
  reconnect: true,
  idleTimeout: 300000,
  acquireTimeout: 60000
});

// Helper function to execute queries
const executeQuery = async (sql, params = []) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Initialize database (MySQL tables already exist from migration)
const initializeDatabase = async () => {
  try {
    // Test connection
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    connection.release();

    // Verify tables exist
    const tables = await executeQuery(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);

    console.log('📊 Available tables:', tables.map(t => t.TABLE_NAME).join(', '));

    return true;
  } catch (error) {
    console.error('❌ MySQL Database connection failed:', error);
    throw error;
  }
};

// Get customer with details
const getCustomerWithDetails = async (customerId) => {
  try {
    // Get customer basic info
    const customer = await executeQuery(
      'SELECT * FROM customers WHERE id = ?',
      [customerId]
    );

    if (customer.length === 0) {
      return null;
    }

    // Get loan problems
    const loanProblems = await executeQuery(
      'SELECT * FROM loan_problems WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    );

    // Get action plans
    const actionPlans = await executeQuery(
      'SELECT * FROM action_plans WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    );

    return {
      ...customer[0],
      loanProblems: loanProblems || [],
      actionPlans: actionPlans || []
    };
  } catch (error) {
    console.error('Error getting customer with details:', error);
    throw error;
  }
};

// Helper function to convert undefined to null for MySQL
const sanitizeValue = (value) => {
  if (value === undefined || value === null) return null;
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

// Helper function to create array with all customer fields initialized to null
const createSanitizedCustomerArray = (customerData) => {
  const fields = [
    'date', 'name', 'age', 'phone', 'job', 'position', 'businessOwnerType', 'privateBusinessType',
    'projectName', 'unit', 'readyToTransfer', 'propertyValue', 'rentToOwnValue', 'monthlyRentToOwnRate',
    'propertyPrice', 'discount', 'installmentMonths', 'overpaidRent', 'rentRatePerMillion',
    'guaranteeMultiplier', 'prepaidRentMultiplier', 'transferYear', 'annualInterestRate',
    'income', 'debt', 'maxDebtAllowed', 'loanTerm', 'ltv', 'ltvNote', 'maxLoanAmount', 'targetDate',
    'officer', 'selectedBank', 'targetBank', 'recommendedLoanTerm', 'recommendedInstallment',
    'potentialScore', 'degreeOfOwnership', 'financialStatus', 'actionPlanProgress',
    'paymentHistory', 'accountStatuses', 'livnexCompleted', 'creditScore', 'creditNotes'
  ];

  const numericFields = new Set([
    'age', 'propertyValue', 'rentToOwnValue', 'monthlyRentToOwnRate', 'propertyPrice', 'discount',
    'installmentMonths', 'overpaidRent', 'rentRatePerMillion', 'guaranteeMultiplier', 'prepaidRentMultiplier',
    'transferYear', 'annualInterestRate', 'income', 'debt', 'maxDebtAllowed', 'loanTerm', 'ltv',
    'maxLoanAmount', 'recommendedLoanTerm', 'recommendedInstallment', 'potentialScore',
    'degreeOfOwnership', 'actionPlanProgress', 'creditScore'
  ]);

  const jsonFields = new Set(['paymentHistory', 'accountStatuses']);

  return fields.map(field => {
    let value = sanitizeValue(customerData[field]);

    if (value === null || value === undefined) return null;

    if (jsonFields.has(field)) {
      if (Array.isArray(value)) {
        return JSON.stringify(value);
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return value;
    }

    if (numericFields.has(field)) {
      const num = Number(typeof value === 'string' ? value.replace(/,/g, '') : value);
      return Number.isFinite(num) ? num : null;
    }

    if (field === 'livnexCompleted') {
      if (typeof value === 'boolean') return value ? 1 : 0;
      const num = Number(value);
      if (Number.isNaN(num)) return 0;
      return num ? 1 : 0;
    }

    // Final safety check: ensure no undefined values pass through
    return value === undefined ? null : value;
  }).map(val => val === undefined ? null : val); // Double safety filter
};

// Insert customer with details
const insertCustomerWithDetails = async (customerData, loanProblems = [], actionPlans = []) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    console.log('📥 Incoming loanProblems:', JSON.stringify(loanProblems));
    console.log('📥 Incoming actionPlans:', JSON.stringify(actionPlans));

    // Create sanitized array with all required fields
    let sanitizedArray = createSanitizedCustomerArray(customerData);

    // Final safety filter to remove any undefined values
    sanitizedArray = sanitizedArray.map(val => val === undefined ? null : val);

    // Debug log to find problematic values
    console.log('🔍 Sanitized array length:', sanitizedArray.length);

    const fieldNames = [
      'date', 'name', 'age', 'phone', 'job', 'position', 'businessOwnerType', 'privateBusinessType',
      'projectName', 'unit', 'readyToTransfer', 'propertyValue', 'rentToOwnValue', 'monthlyRentToOwnRate',
      'propertyPrice', 'discount', 'installmentMonths', 'overpaidRent', 'rentRatePerMillion',
      'guaranteeMultiplier', 'prepaidRentMultiplier', 'transferYear', 'annualInterestRate',
      'income', 'debt', 'maxDebtAllowed', 'loanTerm', 'ltv', 'ltvNote', 'maxLoanAmount', 'targetDate',
      'officer', 'selectedBank', 'targetBank', 'recommendedLoanTerm', 'recommendedInstallment',
      'potentialScore', 'degreeOfOwnership', 'financialStatus', 'actionPlanProgress',
      'paymentHistory', 'accountStatuses', 'livnexCompleted', 'creditScore', 'creditNotes'
    ];

    sanitizedArray.forEach((value, index) => {
      if (value === undefined) {
        console.log(`❌ Undefined at index ${index} (${fieldNames[index]})`);
      }
      if (Number.isNaN(value)) {
        console.log(`⚠️ NaN at index ${index} (${fieldNames[index]})`);
      }
    });
    console.log('🔎 Sanitized sample:', sanitizedArray);

    // Insert customer
    const [customerResult] = await connection.execute(`
      INSERT INTO customers (
        date, name, age, phone, job, position, businessOwnerType, privateBusinessType,
        projectName, unit, readyToTransfer, propertyValue, rentToOwnValue, monthlyRentToOwnRate,
        propertyPrice, discount, installmentMonths, overpaidRent, rentRatePerMillion,
        guaranteeMultiplier, prepaidRentMultiplier, transferYear, annualInterestRate,
        income, debt, maxDebtAllowed, loanTerm, ltv, ltvNote, maxLoanAmount, targetDate,
        officer, selectedBank, targetBank, recommendedLoanTerm, recommendedInstallment,
        potentialScore, degreeOfOwnership, financialStatus, actionPlanProgress,
        paymentHistory, accountStatuses, livnexCompleted, creditScore, creditNotes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, sanitizedArray);

    const customerId = customerResult.insertId;
    console.log("✅ Customer INSERT result:", JSON.stringify(customerResult));
    console.log("🆔 Generated customerId:", customerId);

    // Insert loan problems
    if (loanProblems && loanProblems.length > 0) {
      // Filter out undefined, null, and empty strings
      const validProblems = loanProblems.filter(p => p !== undefined && p !== null && p !== '');
      console.log('✅ Valid loan problems to insert:', validProblems.length);

      for (const problem of validProblems) {
        await connection.execute(
          'INSERT INTO loan_problems (customer_id, problem) VALUES (?, ?)',
          [customerId, problem]
        );
      }
    }

    // Insert action plans
    if (actionPlans && actionPlans.length > 0) {
      // Filter out undefined, null, and empty strings
      const validPlans = actionPlans.filter(p => p !== undefined && p !== null && p !== '');
      console.log('✅ Valid action plans to insert:', validPlans.length);

      for (const plan of validPlans) {
        await connection.execute(
          'INSERT INTO action_plans (customer_id, plan) VALUES (?, ?)',
          [customerId, plan]
        );
      }
    }

    await connection.commit();
    console.log(`✅ Customer ${customerId} inserted successfully`);
    return customerId;

  } catch (error) {
    await connection.rollback();
    console.error('Error inserting customer with details:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Update customer with details
const updateCustomerWithDetails = async (customerId, customerData, loanProblems = [], actionPlans = []) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Update customer
    await connection.execute(`
      UPDATE customers SET
        date=?, name=?, age=?, phone=?, job=?, position=?, businessOwnerType=?,
        privateBusinessType=?, projectName=?, unit=?, readyToTransfer=?, propertyValue=?,
        rentToOwnValue=?, monthlyRentToOwnRate=?, propertyPrice=?, discount=?,
        installmentMonths=?, overpaidRent=?, rentRatePerMillion=?, guaranteeMultiplier=?,
        prepaidRentMultiplier=?, transferYear=?, annualInterestRate=?, income=?, debt=?,
        maxDebtAllowed=?, loanTerm=?, ltv=?, ltvNote=?, maxLoanAmount=?, targetDate=?,
        officer=?, selectedBank=?, targetBank=?, recommendedLoanTerm=?, recommendedInstallment=?,
        potentialScore=?, degreeOfOwnership=?, financialStatus=?, actionPlanProgress=?,
        paymentHistory=?, accountStatuses=?, livnexCompleted=?, creditScore=?, creditNotes=?,
        updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `, [
      sanitizeValue(customerData.date), sanitizeValue(customerData.name), sanitizeValue(customerData.age), sanitizeValue(customerData.phone),
      sanitizeValue(customerData.job), sanitizeValue(customerData.position), sanitizeValue(customerData.businessOwnerType),
      sanitizeValue(customerData.privateBusinessType), sanitizeValue(customerData.projectName), sanitizeValue(customerData.unit),
      sanitizeValue(customerData.readyToTransfer), sanitizeValue(customerData.propertyValue), sanitizeValue(customerData.rentToOwnValue),
      sanitizeValue(customerData.monthlyRentToOwnRate), sanitizeValue(customerData.propertyPrice), sanitizeValue(customerData.discount),
      sanitizeValue(customerData.installmentMonths), sanitizeValue(customerData.overpaidRent), sanitizeValue(customerData.rentRatePerMillion),
      sanitizeValue(customerData.guaranteeMultiplier), sanitizeValue(customerData.prepaidRentMultiplier),
      sanitizeValue(customerData.transferYear), sanitizeValue(customerData.annualInterestRate), sanitizeValue(customerData.income),
      sanitizeValue(customerData.debt), sanitizeValue(customerData.maxDebtAllowed), sanitizeValue(customerData.loanTerm),
      sanitizeValue(customerData.ltv), sanitizeValue(customerData.ltvNote), sanitizeValue(customerData.maxLoanAmount),
      sanitizeValue(customerData.targetDate), sanitizeValue(customerData.officer), sanitizeValue(customerData.selectedBank),
      sanitizeValue(customerData.targetBank), sanitizeValue(customerData.recommendedLoanTerm),
      sanitizeValue(customerData.recommendedInstallment), sanitizeValue(customerData.potentialScore),
      sanitizeValue(customerData.degreeOfOwnership), sanitizeValue(customerData.financialStatus),
      sanitizeValue(customerData.actionPlanProgress), sanitizeValue(customerData.paymentHistory),
      sanitizeValue(customerData.accountStatuses), sanitizeValue(customerData.livnexCompleted),
      sanitizeValue(customerData.creditScore), sanitizeValue(customerData.creditNotes), customerId
    ]);

    // Delete existing problems and plans
    await connection.execute('DELETE FROM loan_problems WHERE customer_id = ?', [customerId]);
    await connection.execute('DELETE FROM action_plans WHERE customer_id = ?', [customerId]);

    // Insert new loan problems
    if (loanProblems && loanProblems.length > 0) {
      // Filter out undefined, null, and empty strings
      const validProblems = loanProblems.filter(p => p !== undefined && p !== null && p !== '');
      console.log('✅ Valid loan problems to update:', validProblems.length);

      for (const problem of validProblems) {
        await connection.execute(
          'INSERT INTO loan_problems (customer_id, problem) VALUES (?, ?)',
          [customerId, problem]
        );
      }
    }

    // Insert new action plans
    if (actionPlans && actionPlans.length > 0) {
      // Filter out undefined, null, and empty strings
      const validPlans = actionPlans.filter(p => p !== undefined && p !== null && p !== '');
      console.log('✅ Valid action plans to update:', validPlans.length);

      for (const plan of validPlans) {
        await connection.execute(
          'INSERT INTO action_plans (customer_id, plan) VALUES (?, ?)',
          [customerId, plan]
        );
      }
    }

    await connection.commit();
    console.log(`✅ Customer ${customerId} updated successfully`);
    return true;

  } catch (error) {
    await connection.rollback();
    console.error('Error updating customer with details:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Get all customers (fields required by dashboard)
const getAllCustomers = async () => {
  try {
    const customers = await executeQuery(`
      SELECT 
        id,
        name,
        projectName,
        unit,
        income,
        potentialScore,
        financialStatus,
        officer,
        targetDate,
        created_at,
        updated_at
      FROM customers
      ORDER BY updated_at DESC
    `);
    return customers;
  } catch (error) {
    console.error('Error getting all customers:', error);
    throw error;
  }
};

// Delete customer
const deleteCustomer = async (customerId) => {
  try {
    // MySQL will cascade delete loan_problems and action_plans automatically
    const result = await executeQuery('DELETE FROM customers WHERE id = ?', [customerId]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};

// Bank rules functions
const getAllBankRules = async () => {
  try {
    const bankRules = await executeQuery('SELECT * FROM bank_rules WHERE is_active = 1 ORDER BY bank_name');
    return bankRules;
  } catch (error) {
    console.error('Error getting bank rules:', error);
    throw error;
  }
};

const getBankRuleByCode = async (bankCode) => {
  try {
    const bankRule = await executeQuery('SELECT * FROM bank_rules WHERE bank_code = ? AND is_active = 1', [bankCode]);
    return bankRule.length > 0 ? bankRule[0] : null;
  } catch (error) {
    console.error('Error getting bank rule by code:', error);
    throw error;
  }
};

const insertBankRule = async (bankRuleData) => {
  try {
    const result = await executeQuery(`
      INSERT INTO bank_rules (
        bank_code, bank_name, criteria, dsr_high, dsr_low, min_income_for_dsr_high,
        age_min, age_max, max_term, ltv_type1, ltv_type2_over_2years, ltv_type2_under_2years,
        ltv_type3, installment_rates, interest_rates, partnership_type, min_credit_score,
        max_ltv_rent_to_own, preferred_interest_rate, max_term_rent_to_own, special_programs,
        livnex_bonus, exclude_status, acceptable_grades, loan_weight, rent_to_own_weight,
        credit_weight, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      bankRuleData.bank_code, bankRuleData.bank_name, bankRuleData.criteria,
      bankRuleData.dsr_high, bankRuleData.dsr_low, bankRuleData.min_income_for_dsr_high,
      bankRuleData.age_min, bankRuleData.age_max, bankRuleData.max_term,
      bankRuleData.ltv_type1, bankRuleData.ltv_type2_over_2years, bankRuleData.ltv_type2_under_2years,
      bankRuleData.ltv_type3, bankRuleData.installment_rates, bankRuleData.interest_rates,
      bankRuleData.partnership_type, bankRuleData.min_credit_score, bankRuleData.max_ltv_rent_to_own,
      bankRuleData.preferred_interest_rate, bankRuleData.max_term_rent_to_own,
      bankRuleData.special_programs, bankRuleData.livnex_bonus, bankRuleData.exclude_status,
      bankRuleData.acceptable_grades, bankRuleData.loan_weight, bankRuleData.rent_to_own_weight,
      bankRuleData.credit_weight, bankRuleData.is_active || 1
    ]);
    return result.insertId;
  } catch (error) {
    console.error('Error inserting bank rule:', error);
    throw error;
  }
};

const updateBankRule = async (bankRuleId, bankRuleData) => {
  try {
    const result = await executeQuery(`
      UPDATE bank_rules SET
        bank_code=?, bank_name=?, criteria=?, dsr_high=?, dsr_low=?, min_income_for_dsr_high=?,
        age_min=?, age_max=?, max_term=?, ltv_type1=?, ltv_type2_over_2years=?, ltv_type2_under_2years=?,
        ltv_type3=?, installment_rates=?, interest_rates=?, partnership_type=?, min_credit_score=?,
        max_ltv_rent_to_own=?, preferred_interest_rate=?, max_term_rent_to_own=?, special_programs=?,
        livnex_bonus=?, exclude_status=?, acceptable_grades=?, loan_weight=?, rent_to_own_weight=?,
        credit_weight=?, is_active=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `, [
      bankRuleData.bank_code, bankRuleData.bank_name, bankRuleData.criteria,
      bankRuleData.dsr_high, bankRuleData.dsr_low, bankRuleData.min_income_for_dsr_high,
      bankRuleData.age_min, bankRuleData.age_max, bankRuleData.max_term,
      bankRuleData.ltv_type1, bankRuleData.ltv_type2_over_2years, bankRuleData.ltv_type2_under_2years,
      bankRuleData.ltv_type3, bankRuleData.installment_rates, bankRuleData.interest_rates,
      bankRuleData.partnership_type, bankRuleData.min_credit_score, bankRuleData.max_ltv_rent_to_own,
      bankRuleData.preferred_interest_rate, bankRuleData.max_term_rent_to_own,
      bankRuleData.special_programs, bankRuleData.livnex_bonus, bankRuleData.exclude_status,
      bankRuleData.acceptable_grades, bankRuleData.loan_weight, bankRuleData.rent_to_own_weight,
      bankRuleData.credit_weight, bankRuleData.is_active, bankRuleId
    ]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error updating bank rule:', error);
    throw error;
  }
};

// Reports functions
const insertReport = async (reportData) => {
  try {
    const result = await executeQuery(`
      INSERT INTO reports (
        customer_id, customer_name, report_date, selected_installment,
        additional_notes, debt_limit, loan_term_after, analyst
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      reportData.customer_id, reportData.customer_name, reportData.report_date,
      reportData.selected_installment, reportData.additional_notes,
      reportData.debt_limit, reportData.loan_term_after, reportData.analyst
    ]);
    return result.insertId;
  } catch (error) {
    console.error('Error inserting report:', error);
    throw error;
  }
};

const getReportsByCustomerId = async (customerId) => {
  try {
    const reports = await executeQuery(
      'SELECT * FROM reports WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId]
    );
    return reports;
  } catch (error) {
    console.error('Error getting reports by customer ID:', error);
    throw error;
  }
};

// Close pool connection when app terminates
process.on('SIGINT', async () => {
  console.log('🔒 Closing MySQL connection pool...');
  await pool.end();
  process.exit(0);
});

module.exports = {
  initializeDatabase,
  getCustomerWithDetails,
  insertCustomerWithDetails,
  updateCustomerWithDetails,
  getAllCustomers,
  deleteCustomer,
  getAllBankRules,
  getBankRuleByCode,
  insertBankRule,
  updateBankRule,
  insertReport,
  getReportsByCustomerId,
  executeQuery,
  pool
};
