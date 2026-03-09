/**
 * Bureau Requests Routes
 */
const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../auth');
const {
  getBureauRequestsByCustomer, insertBureauRequest,
  updateBureauRequest, findRecentBureauRequest,
  getLoanApplicationById
} = require('../database');

/**
 * GET /api/bureau-requests/customer/:customerId
 * Get all bureau requests for a customer
 */
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    const requests = await getBureauRequestsByCustomer(customerId);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bureau requests', error: error.message });
  }
});

/**
 * GET /api/bureau-requests/customer/:customerId/recent
 * Check for duplicate bureau request within 3 months
 */
router.get('/customer/:customerId/recent', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    const recent = await findRecentBureauRequest(customerId);
    res.json({ hasDuplicate: !!recent, recentRequest: recent });
  } catch (error) {
    res.status(500).json({ message: 'Error checking recent bureau request', error: error.message });
  }
});

/**
 * POST /api/bureau-requests
 * Create a new bureau request
 */
router.post('/', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  try {
    const { customer_id, request_date } = req.body;
    if (!customer_id || !request_date) {
      return res.status(400).json({ message: 'Missing required fields: customer_id, request_date' });
    }

    // Validate loan application status if provided
    if (req.body.loan_application_id) {
      const loanApp = await getLoanApplicationById(req.body.loan_application_id);
      if (!loanApp) {
        return res.status(404).json({ message: 'Loan application not found' });
      }
      if (!['document_check', 'bureau_check'].includes(loanApp.loan_status)) {
        return res.status(400).json({
          message: `Loan must be in "document_check" or "bureau_check" to request bureau. Current: "${loanApp.loan_status}"`
        });
      }
    }

    // Check for duplicate within 3 months
    const recent = await findRecentBureauRequest(customer_id);
    if (recent) {
      return res.status(409).json({
        message: 'Bureau request already exists within 3 months',
        existingRequest: recent
      });
    }

    // Auto-set expiry date (3 months from request_date)
    const data = { ...req.body };
    if (!data.expiry_date) {
      const reqDate = new Date(request_date);
      reqDate.setMonth(reqDate.getMonth() + 3);
      data.expiry_date = reqDate.toISOString().split('T')[0];
    }

    const id = await insertBureauRequest(data);
    res.status(201).json({ message: 'Bureau request created', id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating bureau request', error: error.message });
  }
});

/**
 * PUT /api/bureau-requests/:id
 * Update a bureau request
 */
router.put('/:id', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }
    // Validate form sequence: form2 cannot be verified before form1
    if (req.body.form2_status === 'verified') {
      const { db } = require('../database');
      const current = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM bureau_requests WHERE id = ?', [id], (err, row) => {
          err ? reject(err) : resolve(row);
        });
      });
      if (!current) {
        return res.status(404).json({ message: 'Bureau request not found' });
      }
      if (current.form1_status !== 'verified') {
        return res.status(400).json({
          message: 'Form 1 must be verified before Form 2 can be verified'
        });
      }
    }

    // Validate consent before bureau check can proceed
    if (req.body.bureau_result || req.body.bureau_score) {
      const { db } = require('../database');
      const current = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM bureau_requests WHERE id = ?', [id], (err, row) => {
          err ? reject(err) : resolve(row);
        });
      });
      if (current && current.consent_status !== 'received') {
        return res.status(400).json({
          message: 'Consent must be received before recording bureau results'
        });
      }
    }

    const updated = await updateBureauRequest(id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Bureau request not found or no valid fields to update' });
    }
    res.json({ message: 'Bureau request updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating bureau request', error: error.message });
  }
});

module.exports = router;
