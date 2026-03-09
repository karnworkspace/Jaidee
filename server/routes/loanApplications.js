/**
 * Loan Applications Routes (APP-IN)
 */
const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../auth');
const {
  getLoanApplicationsByCustomer, getLoanApplicationById,
  insertLoanApplication, updateLoanApplication
} = require('../database');
const { validateTransition, getNextStatuses } = require('../services/workflowService');

/**
 * GET /api/loan-applications/customer/:customerId
 * Get all loan applications for a customer
 */
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    const applications = await getLoanApplicationsByCustomer(customerId);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching loan applications', error: error.message });
  }
});

/**
 * GET /api/loan-applications/:id
 * Get a single loan application by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }
    const application = await getLoanApplicationById(id);
    if (!application) {
      return res.status(404).json({ message: 'Loan application not found' });
    }
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching loan application', error: error.message });
  }
});

/**
 * POST /api/loan-applications
 * Create a new loan application
 */
router.post('/', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  try {
    const { customer_id, application_date } = req.body;
    if (!customer_id || !application_date) {
      return res.status(400).json({ message: 'Missing required fields: customer_id, application_date' });
    }
    const id = await insertLoanApplication(req.body);
    const application = await getLoanApplicationById(id);
    res.status(201).json({ message: 'Loan application created', application });
  } catch (error) {
    res.status(500).json({ message: 'Error creating loan application', error: error.message });
  }
});

/**
 * PUT /api/loan-applications/:id
 * Update a loan application
 */
router.put('/:id', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }
    const existing = await getLoanApplicationById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Loan application not found' });
    }

    // Validate workflow transition if loan_status is being changed
    if (req.body.loan_status && req.body.loan_status !== existing.loan_status) {
      const check = validateTransition(existing.loan_status, req.body.loan_status);
      if (!check.valid) {
        return res.status(400).json({ message: check.message });
      }
    }

    const updated = await updateLoanApplication(id, req.body);
    if (!updated) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }
    const application = await getLoanApplicationById(id);
    res.json({ message: 'Loan application updated', application });
  } catch (error) {
    res.status(500).json({ message: 'Error updating loan application', error: error.message });
  }
});

/**
 * GET /api/loan-applications/:id/next-statuses
 * Get allowed next statuses for a loan application
 */
router.get('/:id/next-statuses', authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid application ID' });
    }
    const application = await getLoanApplicationById(id);
    if (!application) {
      return res.status(404).json({ message: 'Loan application not found' });
    }
    const nextStatuses = getNextStatuses(application.loan_status);
    res.json({
      currentStatus: application.loan_status,
      allowedTransitions: nextStatuses
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching next statuses', error: error.message });
  }
});

module.exports = router;
