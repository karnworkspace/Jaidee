/**
 * Debt Items Routes
 */
const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../auth');
const {
  getDebtItemsByCustomer, insertDebtItem, updateDebtItem,
  deleteDebtItem, getTotalDebtByCustomer
} = require('../database');

/** Valid debt types per DOC2026 */
const VALID_DEBT_TYPES = [
  'revolving_personal', 'revolving_credit_card', 'revolving_other',
  'installment', 'joint_loan', 'legacy'
];

/**
 * GET /api/debt-items/customer/:customerId
 * Get all debt items for a customer
 */
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    const items = await getDebtItemsByCustomer(customerId);
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching debt items', error: error.message });
  }
});

/**
 * GET /api/debt-items/customer/:customerId/summary
 * Get total calculated debt for a customer
 */
router.get('/customer/:customerId/summary', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    const totalDebt = await getTotalDebtByCustomer(customerId);
    const items = await getDebtItemsByCustomer(customerId);
    res.json({ totalDebt, itemCount: items.length, items });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching debt summary', error: error.message });
  }
});

/**
 * POST /api/debt-items
 * Create a new debt item (auto-calculates payment per DOC2026 rules)
 */
router.post('/', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  try {
    const { customer_id, debt_type } = req.body;
    if (!customer_id || !debt_type) {
      return res.status(400).json({ message: 'Missing required fields: customer_id, debt_type' });
    }
    if (!VALID_DEBT_TYPES.includes(debt_type)) {
      return res.status(400).json({ message: `Invalid debt_type. Must be one of: ${VALID_DEBT_TYPES.join(', ')}` });
    }
    const id = await insertDebtItem(req.body);
    res.status(201).json({ message: 'Debt item created', id });
  } catch (error) {
    res.status(500).json({ message: 'Error creating debt item', error: error.message });
  }
});

/**
 * PUT /api/debt-items/:id
 * Update a debt item (auto-recalculates payment)
 */
router.put('/:id', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid debt item ID' });
    }
    if (req.body.debt_type && !VALID_DEBT_TYPES.includes(req.body.debt_type)) {
      return res.status(400).json({ message: `Invalid debt_type. Must be one of: ${VALID_DEBT_TYPES.join(', ')}` });
    }
    const updated = await updateDebtItem(id, req.body);
    if (!updated) {
      return res.status(404).json({ message: 'Debt item not found' });
    }
    res.json({ message: 'Debt item updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating debt item', error: error.message });
  }
});

/**
 * DELETE /api/debt-items/:id
 * Delete a debt item
 */
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid debt item ID' });
    }
    const deleted = await deleteDebtItem(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Debt item not found' });
    }
    res.json({ message: 'Debt item deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting debt item', error: error.message });
  }
});

/**
 * GET /api/debt-items/customer/:customerId/dsr
 * Calculate DSR (Debt Service Ratio) for a customer
 * DSR = total_calculated_debt / income * 100
 */
router.get('/customer/:customerId/dsr', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.customerId);
    if (isNaN(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID' });
    }
    const { getCustomerWithDetails } = require('../database');
    const customer = await getCustomerWithDetails(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const totalDebt = await getTotalDebtByCustomer(customerId);
    const items = await getDebtItemsByCustomer(customerId);
    const income = customer.income || 0;
    const dsr = income > 0 ? (totalDebt / income) * 100 : 0;

    res.json({
      customerId,
      income,
      totalDebt,
      dsr: Math.round(dsr * 100) / 100,
      itemCount: items.length,
      breakdown: items.map(i => ({
        id: i.id,
        type: i.debt_type,
        creditor: i.creditor_name,
        outstanding: i.outstanding_balance,
        monthly: i.monthly_payment,
        calculated: i.calculated_payment
      }))
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating DSR', error: error.message });
  }
});

module.exports = router;
