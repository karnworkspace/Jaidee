const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, 'jaidee.sqlite');
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
          officer TEXT DEFAULT 'ณัฐพงศ์ ไหมพรม',
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
        } else {
          console.log('Database initialized successfully');
          resolve();
        }
      });
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

      // Insert customer
      const {
        loanProblem = [],
        actionPlan = [],
        ...customerFields
      } = customerData;

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

      // Update customer
      const {
        loanProblem = [],
        actionPlan = [],
        ...customerFields
      } = customerData;

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
    db.all('SELECT * FROM customers ORDER BY created_at DESC', (err, customers) => {
      if (err) {
        reject(err);
        return;
      }

      // Get related data for each customer
      const customersWithDetails = customers.map(customer => {
        return getCustomerWithDetails(customer.id);
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

module.exports = {
  db,
  initializeDatabase,
  getCustomerWithDetails,
  insertCustomerWithDetails,
  updateCustomerWithDetails,
  getAllCustomers,
  deleteCustomer
};