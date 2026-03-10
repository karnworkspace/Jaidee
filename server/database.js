const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { runDOC2026Migrations } = require('./migrations');

// Create database connection — use /app/data/ for Docker volume persistence
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data', 'jaidee.sqlite');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
const fs = require('fs');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Create customers table
      db.run(`
        CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          name TEXT NOT NULL,
          age INTEGER,
          phone TEXT,
          job TEXT,
          position TEXT,
          businessOwnerType TEXT DEFAULT 'ไม่ใช่เจ้าของธุรกิจ',
          privateBusinessType TEXT,
          projectName TEXT,
          unit TEXT,
          readyToTransfer TEXT,
          propertyValue REAL,
          rentToOwnValue REAL,
          monthlyRentToOwnRate REAL,
          propertyPrice REAL,
          discount REAL DEFAULT 0,
          installmentMonths INTEGER DEFAULT 12,
          overpaidRent REAL DEFAULT 0,
          rentRatePerMillion REAL DEFAULT 4100,
          guaranteeMultiplier REAL DEFAULT 2,
          prepaidRentMultiplier REAL DEFAULT 1,
          transferYear INTEGER DEFAULT 1,
          annualInterestRate REAL DEFAULT 1.8,
          income REAL,
          debt REAL,
          maxDebtAllowed REAL,
          loanTerm REAL,
          ltv REAL,
          ltvNote TEXT,
          maxLoanAmount REAL,
          targetDate TEXT,
          officer TEXT DEFAULT 'นายพิชญ์ สุดทัน',
          selectedBank TEXT,
          targetBank TEXT,
          recommendedLoanTerm REAL,
          recommendedInstallment REAL,
          
          -- Calculated KPI fields
          potentialScore REAL,
          degreeOfOwnership REAL,
          financialStatus TEXT,
          actionPlanProgress REAL,
          paymentHistory TEXT,
          
          -- Credit Bureau fields
          creditScore REAL,
          accountStatuses TEXT,
          livnexCompleted BOOLEAN DEFAULT 0,
          creditNotes TEXT,
          
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Error creating customers table:', err);
          reject(err);
        }
      });

      // Create loan_problems table (for dynamic loan problems)
      db.run(`
        CREATE TABLE IF NOT EXISTS loan_problems (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER,
          problem TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating loan_problems table:', err);
          reject(err);
        }
      });

      // Create action_plans table (for dynamic action plans)
      db.run(`
        CREATE TABLE IF NOT EXISTS action_plans (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER,
          plan TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) {
          console.error('Error creating action_plans table:', err);
          reject(err);
          return;
        }

        // Create users table for authentication
        db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('admin', 'data_entry', 'data_user')),
            department TEXT NOT NULL CHECK (department IN ('เงินสดใจดี', 'CO')),
            is_active BOOLEAN NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('Error creating users table:', err);
            reject(err);
          }
        });

        // Create reports table (for saving report data)
        db.run(`
          CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            customer_name TEXT NOT NULL,
            report_date TEXT NOT NULL,
            selected_installment INTEGER,
            additional_notes TEXT,
            debt_limit INTEGER,
            loan_term_after INTEGER,
            analyst TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE
          )
        `, (err) => {
          if (err) {
            console.error('Error creating reports table:', err);
            reject(err);
          }
        });

        // Create bank_rules table
        db.run(`
          CREATE TABLE IF NOT EXISTS bank_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bank_code TEXT UNIQUE NOT NULL,
            bank_name TEXT NOT NULL,
            criteria TEXT,
            dsr_high REAL,
            dsr_low REAL,
            min_income_for_dsr_high INTEGER,
            age_min INTEGER,
            age_max INTEGER,
            max_term INTEGER,
            ltv_type1 REAL,
            ltv_type2_over_2years REAL,
            ltv_type2_under_2years REAL,
            ltv_type3 REAL,
            installment_rates TEXT,
            interest_rates TEXT,
            partnership_type TEXT DEFAULT 'Standard_Commercial',
            min_credit_score INTEGER DEFAULT 600,
            max_ltv_rent_to_own REAL DEFAULT 80,
            preferred_interest_rate REAL DEFAULT 4.5,
            max_term_rent_to_own INTEGER DEFAULT 25,
            special_programs TEXT,
            livnex_bonus INTEGER DEFAULT 0,
            exclude_status TEXT,
            acceptable_grades TEXT,
            loan_weight REAL DEFAULT 0.4,
            rent_to_own_weight REAL DEFAULT 0.3,
            credit_weight REAL DEFAULT 0.3,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `, (err) => {
          if (err) {
            console.error('Error creating bank_rules table:', err);
            reject(err);
          } else {
            // Add migration for Credit Bureau fields
            addCreditBureauFields(async () => {
              // Run DOC2026 migrations
              try {
                await runDOC2026Migrations(db);
                console.log('Database initialized successfully');
                resolve();
              } catch (migrationErr) {
                console.error('DOC2026 migration failed:', migrationErr);
                reject(migrationErr);
              }
            });
          }
        });
      });
    });
  });
};

// Migration function to add Credit Bureau fields to existing tables
const addCreditBureauFields = (callback) => {
  const migrations = [
    'ALTER TABLE customers ADD COLUMN creditScore REAL',
    'ALTER TABLE customers ADD COLUMN accountStatuses TEXT',
    'ALTER TABLE customers ADD COLUMN livnexCompleted BOOLEAN DEFAULT 0',
    'ALTER TABLE customers ADD COLUMN creditNotes TEXT'
  ];
  
  let completed = 0;
  
  migrations.forEach((migration) => {
    db.run(migration, (err) => {
      if (err && !err.message.includes('duplicate column')) {
      }
      completed++;
      if (completed === migrations.length) {
        callback();
      }
    });
  });
};

// Helper function to get customer with related data
const getCustomerWithDetails = (customerId) => {
  return new Promise((resolve, reject) => {
    // Get customer data
    db.get('SELECT * FROM customers WHERE id = ?', [customerId], (err, customer) => {
      if (err) {
        reject(err);
        return;
      }

      if (!customer) {
        resolve(null);
        return;
      }

      // Get loan problems
      db.all('SELECT problem FROM loan_problems WHERE customer_id = ?', [customerId], (err, problems) => {
        if (err) {
          reject(err);
          return;
        }

        // Get action plans
        db.all('SELECT plan FROM action_plans WHERE customer_id = ?', [customerId], (err, plans) => {
          if (err) {
            reject(err);
            return;
          }

          // Combine data
          const customerWithDetails = {
            ...customer,
            loanProblem: problems.map(p => p.problem),
            actionPlan: plans.map(p => p.plan)
          };

          resolve(customerWithDetails);
        });
      });
    });
  });
};

// Helper function to insert customer with related data
const insertCustomerWithDetails = (customerData) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Insert customer - only include fields that exist in the customers table
      const {
        loanProblem = [],
        actionPlan = [],
        ...allFields
      } = customerData;

      // Define allowed fields that exist in customers table
      const allowedFields = [
        'date', 'name', 'age', 'phone', 'job', 'position', 'businessOwnerType', 'privateBusinessType',
        'projectName', 'unit', 'readyToTransfer', 'propertyValue', 'rentToOwnValue', 'monthlyRentToOwnRate',
        'propertyPrice', 'discount', 'installmentMonths', 'overpaidRent', 'rentRatePerMillion',
        'guaranteeMultiplier', 'prepaidRentMultiplier', 'transferYear', 'annualInterestRate',
        'income', 'debt', 'maxDebtAllowed', 'loanTerm', 'ltv', 'ltvNote', 'maxLoanAmount',
        'targetDate', 'officer', 'selectedBank', 'targetBank', 'recommendedLoanTerm', 'recommendedInstallment',
        'potentialScore', 'degreeOfOwnership', 'financialStatus', 'actionPlanProgress', 'paymentHistory',
        'creditScore', 'accountStatuses', 'livnexCompleted', 'creditNotes',
        // DOC2026 fields
        'loan_status', 'consent_status', 'consent_date', 'assigned_ca', 'assigned_co',
        'approval_date', 'rejection_date', 'cancellation_reason', 'app_in_number', 'rem_livnex_ref',
        'area_sqm', 'deposit_amount', 'price_after_discount',
        'co_borrower_name', 'co_borrower_id_card', 'co_borrower_phone', 'id_card', 'plot_number'
      ];

      // Filter only allowed fields
      const customerFields = {};
      allowedFields.forEach(field => {
        if (allFields.hasOwnProperty(field)) {
          customerFields[field] = allFields[field];
        }
      });

      const columns = Object.keys(customerFields);
      const placeholders = columns.map(() => '?').join(',');
      const values = columns.map(col => customerFields[col]);

      const sql = `INSERT INTO customers (${columns.join(',')}) VALUES (${placeholders})`;

      db.run(sql, values, function(err) {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }

        const customerId = this.lastID;

        // Insert loan problems
        const insertProblems = loanProblem.map(problem => {
          return new Promise((resolve, reject) => {
            db.run('INSERT INTO loan_problems (customer_id, problem) VALUES (?, ?)', 
              [customerId, problem], (err) => {
                if (err) reject(err);
                else resolve();
              });
          });
        });

        // Insert action plans
        const insertPlans = actionPlan.map(plan => {
          return new Promise((resolve, reject) => {
            db.run('INSERT INTO action_plans (customer_id, plan) VALUES (?, ?)', 
              [customerId, plan], (err) => {
                if (err) reject(err);
                else resolve();
              });
          });
        });

        // Wait for all related data to be inserted
        Promise.all([...insertProblems, ...insertPlans])
          .then(() => {
            db.run('COMMIT');
            resolve(customerId);
          })
          .catch(err => {
            db.run('ROLLBACK');
            reject(err);
          });
      });
    });
  });
};

// Helper function to update customer with related data
const updateCustomerWithDetails = (customerId, customerData) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Update customer - only include fields that exist in the customers table
      const {
        loanProblem = [],
        actionPlan = [],
        id, // Exclude id from customerFields
        ...allFields
      } = customerData;

      // Define allowed fields that exist in customers table
      const allowedFields = [
        'date', 'name', 'age', 'phone', 'job', 'position', 'businessOwnerType', 'privateBusinessType',
        'projectName', 'unit', 'readyToTransfer', 'propertyValue', 'rentToOwnValue', 'monthlyRentToOwnRate',
        'propertyPrice', 'discount', 'installmentMonths', 'overpaidRent', 'rentRatePerMillion',
        'guaranteeMultiplier', 'prepaidRentMultiplier', 'transferYear', 'annualInterestRate',
        'income', 'debt', 'maxDebtAllowed', 'loanTerm', 'ltv', 'ltvNote', 'maxLoanAmount',
        'targetDate', 'officer', 'selectedBank', 'targetBank', 'recommendedLoanTerm', 'recommendedInstallment',
        'potentialScore', 'degreeOfOwnership', 'financialStatus', 'actionPlanProgress', 'paymentHistory',
        'creditScore', 'accountStatuses', 'livnexCompleted', 'creditNotes',
        // DOC2026 fields
        'loan_status', 'consent_status', 'consent_date', 'assigned_ca', 'assigned_co',
        'approval_date', 'rejection_date', 'cancellation_reason', 'app_in_number', 'rem_livnex_ref',
        'area_sqm', 'deposit_amount', 'price_after_discount',
        'co_borrower_name', 'co_borrower_id_card', 'co_borrower_phone', 'id_card', 'plot_number'
      ];

      // Filter only allowed fields
      const customerFields = {};
      allowedFields.forEach(field => {
        if (allFields.hasOwnProperty(field)) {
          customerFields[field] = allFields[field];
        }
      });

      // Add updated_at timestamp
      customerFields.updated_at = new Date().toISOString();

      const columns = Object.keys(customerFields);
      const setClause = columns.map(col => `${col} = ?`).join(',');
      const values = [...columns.map(col => customerFields[col]), customerId];

      const sql = `UPDATE customers SET ${setClause} WHERE id = ?`;

      db.run(sql, values, function(err) {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }

        // Delete existing loan problems and action plans
        db.run('DELETE FROM loan_problems WHERE customer_id = ?', [customerId], (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          db.run('DELETE FROM action_plans WHERE customer_id = ?', [customerId], (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }

            // Insert new loan problems
            const insertProblems = loanProblem.map(problem => {
              return new Promise((resolve, reject) => {
                db.run('INSERT INTO loan_problems (customer_id, problem) VALUES (?, ?)', 
                  [customerId, problem], (err) => {
                    if (err) reject(err);
                    else resolve();
                  });
              });
            });

            // Insert new action plans
            const insertPlans = actionPlan.map(plan => {
              return new Promise((resolve, reject) => {
                db.run('INSERT INTO action_plans (customer_id, plan) VALUES (?, ?)', 
                  [customerId, plan], (err) => {
                    if (err) reject(err);
                    else resolve();
                  });
              });
            });

            // Wait for all related data to be inserted
            Promise.all([...insertProblems, ...insertPlans])
              .then(() => {
                db.run('COMMIT');
                resolve();
              })
              .catch(err => {
                db.run('ROLLBACK');
                reject(err);
              });
          });
        });
      });
    });
  });
};

// Helper function to get all customers with basic info
const getAllCustomers = () => {
  return new Promise((resolve, reject) => {
    // JOIN with loan_applications to get latest loan_status
    const sql = `
      SELECT c.*, la.loan_status AS latest_loan_status
      FROM customers c
      LEFT JOIN (
        SELECT customer_id, loan_status
        FROM loan_applications
        WHERE id IN (SELECT MAX(id) FROM loan_applications GROUP BY customer_id)
      ) la ON c.id = la.customer_id
      ORDER BY c.created_at DESC
    `;
    db.all(sql, (err, customers) => {
      if (err) {
        reject(err);
        return;
      }

      // Override loan_status with latest from loan_applications
      const merged = customers.map(c => ({
        ...c,
        loan_status: c.latest_loan_status || c.loan_status || 'new'
      }));

      // Get related data for each customer
      const customersWithDetails = merged.map(customer => {
        return getCustomerWithDetails(customer.id).then(detail => ({
          ...detail,
          loan_status: customer.loan_status
        }));
      });

      Promise.all(customersWithDetails)
        .then(results => resolve(results))
        .catch(err => reject(err));
    });
  });
};

// Helper function to delete customer
const deleteCustomer = (customerId) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Delete related data first (due to foreign key constraints)
      db.run('DELETE FROM loan_problems WHERE customer_id = ?', [customerId], (err) => {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
          return;
        }

        db.run('DELETE FROM action_plans WHERE customer_id = ?', [customerId], (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          // Delete customer
          db.run('DELETE FROM customers WHERE id = ?', [customerId], function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }

            db.run('COMMIT');
            resolve(this.changes > 0);
          });
        });
      });
    });
  });
};

// Bank Rules Helper Functions
const getAllBankRules = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM bank_rules WHERE is_active = 1 ORDER BY bank_name', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Parse JSON fields
      const bankRules = rows.map(row => ({
        ...row,
        criteria: row.criteria ? JSON.parse(row.criteria) : {},
        installment_rates: row.installment_rates ? JSON.parse(row.installment_rates) : {},
        interest_rates: row.interest_rates ? JSON.parse(row.interest_rates) : {},
        special_programs: row.special_programs ? JSON.parse(row.special_programs) : [],
        exclude_status: row.exclude_status ? JSON.parse(row.exclude_status) : [],
        acceptable_grades: row.acceptable_grades ? JSON.parse(row.acceptable_grades) : []
      }));
      
      resolve(bankRules);
    });
  });
};

const getBankRuleByCode = (bankCode) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM bank_rules WHERE bank_code = ? AND is_active = 1', [bankCode], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!row) {
        resolve(null);
        return;
      }
      
      // Parse JSON fields
      const bankRule = {
        ...row,
        criteria: row.criteria ? JSON.parse(row.criteria) : {},
        installment_rates: row.installment_rates ? JSON.parse(row.installment_rates) : {},
        interest_rates: row.interest_rates ? JSON.parse(row.interest_rates) : {},
        special_programs: row.special_programs ? JSON.parse(row.special_programs) : [],
        exclude_status: row.exclude_status ? JSON.parse(row.exclude_status) : [],
        acceptable_grades: row.acceptable_grades ? JSON.parse(row.acceptable_grades) : []
      };
      
      resolve(bankRule);
    });
  });
};

const insertBankRule = (bankData) => {
  return new Promise((resolve, reject) => {
    const {
      bank_code,
      bank_name,
      criteria = {},
      dsr_high,
      dsr_low,
      min_income_for_dsr_high,
      age_min,
      age_max,
      max_term,
      ltv_type1,
      ltv_type2_over_2years,
      ltv_type2_under_2years,
      ltv_type3,
      installment_rates = {},
      interest_rates = {},
      partnership_type = 'Standard_Commercial',
      min_credit_score = 600,
      max_ltv_rent_to_own = 80,
      preferred_interest_rate = 4.5,
      max_term_rent_to_own = 25,
      special_programs = [],
      livnex_bonus = 0,
      exclude_status = [],
      acceptable_grades = [],
      loan_weight = 0.4,
      rent_to_own_weight = 0.3,
      credit_weight = 0.3
    } = bankData;

    const sql = `
      INSERT INTO bank_rules (
        bank_code, bank_name, criteria, dsr_high, dsr_low, min_income_for_dsr_high,
        age_min, age_max, max_term, ltv_type1, ltv_type2_over_2years, ltv_type2_under_2years, ltv_type3,
        installment_rates, interest_rates, partnership_type, min_credit_score, max_ltv_rent_to_own,
        preferred_interest_rate, max_term_rent_to_own, special_programs, livnex_bonus, exclude_status,
        acceptable_grades, loan_weight, rent_to_own_weight, credit_weight
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      bank_code, bank_name, JSON.stringify(criteria), dsr_high, dsr_low, min_income_for_dsr_high,
      age_min, age_max, max_term, ltv_type1, ltv_type2_over_2years, ltv_type2_under_2years, ltv_type3,
      JSON.stringify(installment_rates), JSON.stringify(interest_rates), partnership_type, min_credit_score, max_ltv_rent_to_own,
      preferred_interest_rate, max_term_rent_to_own, JSON.stringify(special_programs), livnex_bonus, JSON.stringify(exclude_status),
      JSON.stringify(acceptable_grades), loan_weight, rent_to_own_weight, credit_weight
    ];

    db.run(sql, values, function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.lastID);
    });
  });
};

const updateBankRule = (bankCode, bankData) => {
  return new Promise((resolve, reject) => {
    const {
      bank_name,
      criteria = {},
      dsr_high,
      dsr_low,
      min_income_for_dsr_high,
      age_min,
      age_max,
      max_term,
      ltv_type1,
      ltv_type2_over_2years,
      ltv_type2_under_2years,
      ltv_type3,
      installment_rates = {},
      interest_rates = {},
      partnership_type,
      min_credit_score,
      max_ltv_rent_to_own,
      preferred_interest_rate,
      max_term_rent_to_own,
      special_programs = [],
      livnex_bonus,
      exclude_status = [],
      acceptable_grades = [],
      loan_weight,
      rent_to_own_weight,
      credit_weight
    } = bankData;

    const sql = `
      UPDATE bank_rules SET 
        bank_name = ?, criteria = ?, dsr_high = ?, dsr_low = ?, min_income_for_dsr_high = ?,
        age_min = ?, age_max = ?, max_term = ?, ltv_type1 = ?, ltv_type2_over_2years = ?, 
        ltv_type2_under_2years = ?, ltv_type3 = ?, installment_rates = ?, interest_rates = ?,
        partnership_type = ?, min_credit_score = ?, max_ltv_rent_to_own = ?, preferred_interest_rate = ?,
        max_term_rent_to_own = ?, special_programs = ?, livnex_bonus = ?, exclude_status = ?,
        acceptable_grades = ?, loan_weight = ?, rent_to_own_weight = ?, credit_weight = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE bank_code = ? AND is_active = 1
    `;

    const values = [
      bank_name, JSON.stringify(criteria), dsr_high, dsr_low, min_income_for_dsr_high,
      age_min, age_max, max_term, ltv_type1, ltv_type2_over_2years, ltv_type2_under_2years, ltv_type3,
      JSON.stringify(installment_rates), JSON.stringify(interest_rates), partnership_type, min_credit_score, max_ltv_rent_to_own,
      preferred_interest_rate, max_term_rent_to_own, JSON.stringify(special_programs), livnex_bonus, JSON.stringify(exclude_status),
      JSON.stringify(acceptable_grades), loan_weight, rent_to_own_weight, credit_weight, bankCode
    ];

    db.run(sql, values, function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.changes > 0);
    });
  });
};

// Function to insert report data
const insertReport = (reportData) => {
  return new Promise((resolve, reject) => {
    
    const {
      customerId,
      customerName,
      reportDate,
      selectedInstallment,
      additionalNotes,
      debtLimit,
      loanTermAfter,
      analyst
    } = reportData;
    

    const sql = `
      INSERT INTO reports (
        customer_id, customer_name, report_date, selected_installment, 
        additional_notes, debt_limit, loan_term_after, analyst
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const additionalNotesString = JSON.stringify(additionalNotes);
    
    const values = [
      customerId,
      customerName,
      reportDate,
      selectedInstallment,
      additionalNotesString,
      debtLimit,
      loanTermAfter,
      analyst
    ];


    db.run(sql, values, function(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this.lastID);
    });
  });
};

// Function to get reports by customer ID
const getReportsByCustomerId = (customerId) => {
  return new Promise((resolve, reject) => {
    
    const sql = `
      SELECT * FROM reports 
      WHERE customer_id = ? 
      ORDER BY created_at DESC
    `;


    db.all(sql, [customerId], (err, reports) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(reports);
    });
  });
};

// ============================================================
// DOC2026: Loan Applications CRUD
// ============================================================

/**
 * Get all loan applications for a customer
 * @param {number} customerId
 * @returns {Promise<Array>}
 */
const getLoanApplicationsByCustomer = (customerId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM loan_applications WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId],
      (err, rows) => err ? reject(err) : resolve(rows || [])
    );
  });
};

/**
 * Get a single loan application by ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const getLoanApplicationById = (id) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM loan_applications WHERE id = ?', [id], (err, row) => {
      err ? reject(err) : resolve(row || null);
    });
  });
};

/**
 * Insert a new loan application
 * @param {Object} data
 * @returns {Promise<number>} - inserted ID
 */
const insertLoanApplication = (data) => {
  return new Promise((resolve, reject) => {
    const {
      customer_id, app_in_number, rem_livnex_ref, application_date,
      loan_status = 'new', status_reason, assigned_ca, assigned_co, source = 'REM_LivNex', notes
    } = data;

    db.run(
      `INSERT INTO loan_applications
       (customer_id, app_in_number, rem_livnex_ref, application_date, loan_status, status_reason, assigned_ca, assigned_co, source, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, app_in_number, rem_livnex_ref, application_date, loan_status, status_reason, assigned_ca, assigned_co, source, notes],
      function(err) { err ? reject(err) : resolve(this.lastID); }
    );
  });
};

/**
 * Update loan application status
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<boolean>}
 */
const updateLoanApplication = (id, data) => {
  return new Promise((resolve, reject) => {
    const allowedFields = [
      'app_in_number', 'rem_livnex_ref', 'application_date', 'loan_status',
      'status_reason', 'assigned_ca', 'assigned_co', 'source', 'notes'
    ];
    const fields = {};
    allowedFields.forEach(f => { if (data.hasOwnProperty(f)) fields[f] = data[f]; });
    fields.status_updated_at = new Date().toISOString();
    fields.updated_at = new Date().toISOString();

    const cols = Object.keys(fields);
    const sql = `UPDATE loan_applications SET ${cols.map(c => `${c} = ?`).join(', ')} WHERE id = ?`;
    db.run(sql, [...cols.map(c => fields[c]), id], function(err) {
      err ? reject(err) : resolve(this.changes > 0);
    });
  });
};

// ============================================================
// DOC2026: Bureau Requests CRUD
// ============================================================

/**
 * Get bureau requests for a customer
 * @param {number} customerId
 * @returns {Promise<Array>}
 */
const getBureauRequestsByCustomer = (customerId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM bureau_requests WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId],
      (err, rows) => err ? reject(err) : resolve(rows || [])
    );
  });
};

/**
 * Insert a new bureau request
 * @param {Object} data
 * @returns {Promise<number>}
 */
const insertBureauRequest = (data) => {
  return new Promise((resolve, reject) => {
    const {
      customer_id, loan_application_id, request_date,
      expiry_date, form1_status = 'pending', form2_status = 'pending',
      consent_status = 'pending', consent_date, requested_by, notes
    } = data;

    db.run(
      `INSERT INTO bureau_requests
       (customer_id, loan_application_id, request_date, expiry_date, form1_status, form2_status, consent_status, consent_date, requested_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, loan_application_id, request_date, expiry_date, form1_status, form2_status, consent_status, consent_date, requested_by, notes],
      function(err) { err ? reject(err) : resolve(this.lastID); }
    );
  });
};

/**
 * Update a bureau request
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<boolean>}
 */
const updateBureauRequest = (id, data) => {
  return new Promise((resolve, reject) => {
    const allowedFields = [
      'form1_status', 'form2_status', 'form2_received_date', 'bureau_result',
      'bureau_score', 'consent_status', 'consent_date', 'verified_by', 'notes'
    ];
    const fields = {};
    allowedFields.forEach(f => { if (data.hasOwnProperty(f)) fields[f] = data[f]; });

    const cols = Object.keys(fields);
    if (cols.length === 0) return resolve(false);
    const sql = `UPDATE bureau_requests SET ${cols.map(c => `${c} = ?`).join(', ')} WHERE id = ?`;
    db.run(sql, [...cols.map(c => fields[c]), id], function(err) {
      err ? reject(err) : resolve(this.changes > 0);
    });
  });
};

/**
 * Check for duplicate bureau request within 3 months
 * @param {number} customerId
 * @returns {Promise<Object|null>}
 */
const findRecentBureauRequest = (customerId) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM bureau_requests
       WHERE customer_id = ? AND request_date >= date('now', '-3 months')
       ORDER BY request_date DESC LIMIT 1`,
      [customerId],
      (err, row) => err ? reject(err) : resolve(row || null)
    );
  });
};

// ============================================================
// DOC2026: Debt Items CRUD
// ============================================================

/**
 * Get all debt items for a customer
 * @param {number} customerId
 * @returns {Promise<Array>}
 */
const getDebtItemsByCustomer = (customerId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM debt_items WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId],
      (err, rows) => err ? reject(err) : resolve(rows || [])
    );
  });
};

/**
 * Insert a new debt item with auto-calculation
 * @param {Object} data
 * @returns {Promise<number>}
 */
const insertDebtItem = (data) => {
  return new Promise((resolve, reject) => {
    const {
      customer_id, debt_type, creditor_name,
      outstanding_balance = 0, monthly_payment = 0,
      is_joint_loan = 0, account_status, notes
    } = data;

    // Auto-calculate payment per DOC2026 rules
    let calculated_payment = 0;
    switch (debt_type) {
      case 'revolving_personal':
      case 'revolving_other':
        calculated_payment = outstanding_balance * 0.05;
        break;
      case 'revolving_credit_card':
        calculated_payment = outstanding_balance * 0.08;
        break;
      case 'installment':
        calculated_payment = monthly_payment > outstanding_balance ? outstanding_balance : monthly_payment;
        break;
      case 'joint_loan':
        calculated_payment = monthly_payment / 2;
        break;
      default:
        calculated_payment = monthly_payment;
    }

    db.run(
      `INSERT INTO debt_items
       (customer_id, debt_type, creditor_name, outstanding_balance, monthly_payment, calculated_payment, is_joint_loan, account_status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, debt_type, creditor_name, outstanding_balance, monthly_payment, calculated_payment, is_joint_loan, account_status, notes],
      function(err) { err ? reject(err) : resolve(this.lastID); }
    );
  });
};

/**
 * Update a debt item
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<boolean>}
 */
const updateDebtItem = (id, data) => {
  return new Promise((resolve, reject) => {
    const allowedFields = [
      'debt_type', 'creditor_name', 'outstanding_balance', 'monthly_payment',
      'is_joint_loan', 'account_status', 'notes'
    ];
    const fields = {};
    allowedFields.forEach(f => { if (data.hasOwnProperty(f)) fields[f] = data[f]; });

    // Recalculate if balance/payment changed
    const debt_type = data.debt_type || '';
    const outstanding = data.outstanding_balance || 0;
    const monthly = data.monthly_payment || 0;

    if (data.hasOwnProperty('outstanding_balance') || data.hasOwnProperty('monthly_payment') || data.hasOwnProperty('debt_type')) {
      switch (debt_type) {
        case 'revolving_personal':
        case 'revolving_other':
          fields.calculated_payment = outstanding * 0.05;
          break;
        case 'revolving_credit_card':
          fields.calculated_payment = outstanding * 0.08;
          break;
        case 'installment':
          fields.calculated_payment = monthly > outstanding ? outstanding : monthly;
          break;
        case 'joint_loan':
          fields.calculated_payment = monthly / 2;
          break;
        default:
          fields.calculated_payment = monthly;
      }
    }

    fields.updated_at = new Date().toISOString();
    const cols = Object.keys(fields);
    const sql = `UPDATE debt_items SET ${cols.map(c => `${c} = ?`).join(', ')} WHERE id = ?`;
    db.run(sql, [...cols.map(c => fields[c]), id], function(err) {
      err ? reject(err) : resolve(this.changes > 0);
    });
  });
};

/**
 * Delete a debt item
 * @param {number} id
 * @returns {Promise<boolean>}
 */
const deleteDebtItem = (id) => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM debt_items WHERE id = ?', [id], function(err) {
      err ? reject(err) : resolve(this.changes > 0);
    });
  });
};

/**
 * Get total calculated debt for a customer
 * @param {number} customerId
 * @returns {Promise<number>}
 */
const getTotalDebtByCustomer = (customerId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT COALESCE(SUM(calculated_payment), 0) as total_debt FROM debt_items WHERE customer_id = ?',
      [customerId],
      (err, row) => err ? reject(err) : resolve(row ? row.total_debt : 0)
    );
  });
};

// ============================================================
// DOC2026: LivNex Tracking CRUD
// ============================================================

/**
 * Get tracking record for a customer
 * @param {number} customerId
 * @returns {Promise<Array>}
 */
const getLivnexTrackingByCustomer = (customerId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM livnex_tracking WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId],
      (err, rows) => err ? reject(err) : resolve(rows || [])
    );
  });
};

/**
 * Insert a LivNex tracking record
 * @param {Object} data
 * @returns {Promise<number>}
 */
const insertLivnexTracking = (data) => {
  return new Promise((resolve, reject) => {
    const {
      customer_id, loan_application_id, approval_date,
      status = 'approved', jd_officer, co_officer, notes
    } = data;

    db.run(
      `INSERT INTO livnex_tracking
       (customer_id, loan_application_id, approval_date, status, jd_officer, co_officer, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, loan_application_id, approval_date, status, jd_officer, co_officer, notes],
      function(err) { err ? reject(err) : resolve(this.lastID); }
    );
  });
};

/**
 * Update LivNex tracking status
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<boolean>}
 */
const updateLivnexTracking = (id, data) => {
  return new Promise((resolve, reject) => {
    const allowedFields = [
      'status', 'transfer_date', 'cancellation_date', 'cancellation_reason',
      'jd_officer', 'co_officer', 'performance_notes', 'notes'
    ];
    const fields = {};
    allowedFields.forEach(f => { if (data.hasOwnProperty(f)) fields[f] = data[f]; });
    fields.updated_at = new Date().toISOString();

    const cols = Object.keys(fields);
    const sql = `UPDATE livnex_tracking SET ${cols.map(c => `${c} = ?`).join(', ')} WHERE id = ?`;
    db.run(sql, [...cols.map(c => fields[c]), id], function(err) {
      err ? reject(err) : resolve(this.changes > 0);
    });
  });
};

// ============================================================
// DOC2026: CA Recommendations CRUD
// ============================================================

/**
 * Get CA recommendations for a customer
 * @param {number} customerId
 * @returns {Promise<Array>}
 */
const getCARecommendationsByCustomer = (customerId) => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM ca_recommendations WHERE customer_id = ? ORDER BY created_at DESC',
      [customerId],
      (err, rows) => err ? reject(err) : resolve(rows || [])
    );
  });
};

/**
 * Insert a CA recommendation
 * @param {Object} data
 * @returns {Promise<number>}
 */
const insertCARecommendation = (data) => {
  return new Promise((resolve, reject) => {
    const {
      customer_id, loan_application_id, problem_description, solution,
      bank_scores, dsr_calculated, dsr_breakdown,
      co_tracking_status = 'pending', co_officer, ca_officer, notes
    } = data;

    db.run(
      `INSERT INTO ca_recommendations
       (customer_id, loan_application_id, problem_description, solution, bank_scores, dsr_calculated, dsr_breakdown, co_tracking_status, co_officer, ca_officer, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [customer_id, loan_application_id, problem_description, solution, bank_scores, dsr_calculated, dsr_breakdown, co_tracking_status, co_officer, ca_officer, notes],
      function(err) { err ? reject(err) : resolve(this.lastID); }
    );
  });
};

/**
 * Update a CA recommendation
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<boolean>}
 */
const updateCARecommendation = (id, data) => {
  return new Promise((resolve, reject) => {
    const allowedFields = [
      'problem_description', 'solution', 'bank_scores', 'dsr_calculated',
      'dsr_breakdown', 'co_tracking_status', 'co_officer', 'ca_officer', 'notes'
    ];
    const fields = {};
    allowedFields.forEach(f => { if (data.hasOwnProperty(f)) fields[f] = data[f]; });
    fields.updated_at = new Date().toISOString();

    const cols = Object.keys(fields);
    const sql = `UPDATE ca_recommendations SET ${cols.map(c => `${c} = ?`).join(', ')} WHERE id = ?`;
    db.run(sql, [...cols.map(c => fields[c]), id], function(err) {
      err ? reject(err) : resolve(this.changes > 0);
    });
  });
};

module.exports = {
  db,
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
  // DOC2026: Loan Applications
  getLoanApplicationsByCustomer,
  getLoanApplicationById,
  insertLoanApplication,
  updateLoanApplication,
  // DOC2026: Bureau Requests
  getBureauRequestsByCustomer,
  insertBureauRequest,
  updateBureauRequest,
  findRecentBureauRequest,
  // DOC2026: Debt Items
  getDebtItemsByCustomer,
  insertDebtItem,
  updateDebtItem,
  deleteDebtItem,
  getTotalDebtByCustomer,
  // DOC2026: LivNex Tracking
  getLivnexTrackingByCustomer,
  insertLivnexTracking,
  updateLivnexTracking,
  // DOC2026: CA Recommendations
  getCARecommendationsByCustomer,
  insertCARecommendation,
  updateCARecommendation
};