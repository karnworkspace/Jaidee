/**
 * Bank Rules Routes
 */
const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../auth');
const { getAllBankRules, getBankRuleByCode, insertBankRule, updateBankRule } = require('../database');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const bankRules = await getAllBankRules();
    res.json(bankRules);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bank rules', error: error.message });
  }
});

router.get('/:bankCode', authenticateToken, async (req, res) => {
  try {
    const bankCode = req.params.bankCode.toUpperCase();
    const bankRule = await getBankRuleByCode(bankCode);
    if (!bankRule) return res.status(404).json({ message: 'Bank rule not found' });
    res.json(bankRule);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bank rule', error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const bankRuleId = await insertBankRule(req.body);
    const newBankRule = await getBankRuleByCode(req.body.bank_code);
    res.status(201).json({ message: 'Bank rule added successfully', bankRule: newBankRule, id: bankRuleId });
  } catch (error) {
    res.status(500).json({ message: 'Error adding bank rule', error: error.message });
  }
});

router.put('/:bankCode', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const bankCode = req.params.bankCode.toUpperCase();
    const existingBankRule = await getBankRuleByCode(bankCode);
    if (!existingBankRule) return res.status(404).json({ message: 'Bank rule not found' });

    const success = await updateBankRule(bankCode, req.body);
    if (!success) return res.status(400).json({ message: 'Failed to update bank rule' });

    const updatedBankRule = await getBankRuleByCode(bankCode);
    res.json({ message: 'Bank rule updated successfully', bankRule: updatedBankRule });
  } catch (error) {
    res.status(500).json({ message: 'Error updating bank rule', error: error.message });
  }
});

module.exports = router;
