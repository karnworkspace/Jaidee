/**
 * LivNex Tracking Routes
 */
const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../auth');
const {
  getLivnexTrackingByCustomer, insertLivnexTracking, updateLivnexTracking
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
    const { customer_id } = req.body;
    if (!customer_id) {
      return res.status(400).json({ message: 'Missing required field: customer_id' });
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
