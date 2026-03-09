/**
 * CA Recommendations Routes
 */
const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../auth');
const {
  getCARecommendationsByCustomer, insertCARecommendation, updateCARecommendation
} = require('../database');

/**
 * GET /api/ca-recommendations/customer/:customerId
 * Get CA recommendations for a customer
 */
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    const recommendations = await getCARecommendationsByCustomer(customerId);
    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching CA recommendations', error: error.message });
  }
});

/**
 * POST /api/ca-recommendations
 * Create a new CA recommendation
 */
router.post('/', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  try {
    const { customer_id } = req.body;
    if (!customer_id) {
      return res.status(400).json({ message: 'Missing required field: customer_id' });
    }
    const id = await insertCARecommendation(req.body);
    res.status(201).json({ message: 'CA recommendation created', id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating CA recommendation', error: error.message });
  }
});

/**
 * PUT /api/ca-recommendations/:id
 * Update a CA recommendation
 */
router.put('/:id', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid recommendation ID' });
    }
    const updated = await updateCARecommendation(id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'CA recommendation not found or no valid fields to update' });
    }
    res.json({ message: 'CA recommendation updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating CA recommendation', error: error.message });
  }
});

module.exports = router;
