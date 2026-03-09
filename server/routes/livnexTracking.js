/**
 * LivNex Tracking Routes
 */
const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../auth');
const {
  getLivnexTrackingByCustomer, insertLivnexTracking, updateLivnexTracking,
  getLoanApplicationById
} = require('../database');

/**
 * GET /api/livnex-tracking/customer/:customerId
 * Get tracking records for a customer
 */
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    const records = await getLivnexTrackingByCustomer(customerId);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tracking records', error: error.message });
  }
});

/**
 * POST /api/livnex-tracking
 * Create a new tracking record
 */
router.post('/', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  try {
    const { customer_id, loan_application_id } = req.body;
    if (!customer_id) {
      return res.status(400).json({ message: 'Missing required field: customer_id' });
    }

    // Validate loan application is approved before creating tracking
    if (loan_application_id) {
      const loanApp = await getLoanApplicationById(loan_application_id);
      if (!loanApp) {
        return res.status(404).json({ message: 'Loan application not found' });
      }
      if (loanApp.loan_status !== 'approved') {
        return res.status(400).json({
          message: `Loan application must be "approved" to create tracking. Current status: "${loanApp.loan_status}"`
        });
      }
    }

    const id = await insertLivnexTracking(req.body);
    res.status(201).json({ message: 'Tracking record created', id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating tracking record', error: error.message });
  }
});

/**
 * PUT /api/livnex-tracking/:id
 * Update tracking status
 */
router.put('/:id', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid tracking ID' });
    }
    // Validate tracking status transitions
    const TRACKING_TRANSITIONS = {
      approved: ['active', 'cancelled'],
      active: ['transferred', 'cancelled'],
      transferred: [],
      cancelled: []
    };

    if (req.body.status) {
      // Need current record to validate transition
      const { db } = require('../database');
      const current = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM livnex_tracking WHERE id = ?', [id], (err, row) => {
          err ? reject(err) : resolve(row);
        });
      });
      if (!current) {
        return res.status(404).json({ message: 'Tracking record not found' });
      }
      const allowed = TRACKING_TRANSITIONS[current.status] || [];
      if (req.body.status !== current.status && !allowed.includes(req.body.status)) {
        return res.status(400).json({
          message: `Cannot transition from "${current.status}" to "${req.body.status}". Allowed: [${allowed.join(', ')}]`
        });
      }
    }

    const updated = await updateLivnexTracking(id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Tracking record not found or no valid fields to update' });
    }
    res.json({ message: 'Tracking record updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating tracking record', error: error.message });
  }
});

module.exports = router;
