/**
 * Customer Routes
 */
const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../auth');
const {
  getCustomerWithDetails, insertCustomerWithDetails, updateCustomerWithDetails,
  getAllCustomers, deleteCustomer
} = require('../database');
const { calculateKPIs } = require('../services/loanCalculation');
const { enrichCustomerWithCalculations } = require('../services/customerService');

// Get all customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const customers = await getAllCustomers();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
});

// Get customer by ID (with all calculations)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const customer = await getCustomerWithDetails(customerId);

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const enrichedCustomer = await enrichCustomerWithCalculations(customer);
    res.json(enrichedCustomer);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer', error: error.message });
  }
});

// Create customer
router.post('/', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  try {
    const kpis = calculateKPIs(req.body);

    const customerData = {
      ...req.body,
      projectName: req.body.projectName || '',
      unit: req.body.unit || '',
      readyToTransfer: req.body.readyToTransfer || '',
      loanProblem: req.body.loanProblem || [],
      actionPlan: req.body.actionPlan || [],
      ...kpis
    };

    const customerId = await insertCustomerWithDetails(customerData);
    const newCustomer = await getCustomerWithDetails(customerId);
    const enrichedCustomer = await enrichCustomerWithCalculations(newCustomer);

    res.status(201).json({ message: 'Customer added successfully', customer: enrichedCustomer });
  } catch (error) {
    res.status(500).json({ message: 'Error adding customer', error: error.message });
  }
});

// Update customer
router.put('/:id', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const existingCustomer = await getCustomerWithDetails(customerId);
    if (!existingCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const updatedCustomerData = { ...existingCustomer, ...req.body };
    const kpis = calculateKPIs(updatedCustomerData);

    const dbData = {
      date: updatedCustomerData.date,
      name: updatedCustomerData.name,
      age: updatedCustomerData.age,
      phone: updatedCustomerData.phone,
      job: updatedCustomerData.job,
      position: updatedCustomerData.position,
      businessOwnerType: updatedCustomerData.businessOwnerType,
      privateBusinessType: updatedCustomerData.privateBusinessType,
      projectName: updatedCustomerData.projectName,
      unit: updatedCustomerData.unit,
      readyToTransfer: updatedCustomerData.readyToTransfer,
      propertyValue: updatedCustomerData.propertyValue,
      rentToOwnValue: updatedCustomerData.rentToOwnValue,
      monthlyRentToOwnRate: updatedCustomerData.monthlyRentToOwnRate,
      propertyPrice: updatedCustomerData.propertyPrice,
      discount: updatedCustomerData.discount,
      installmentMonths: updatedCustomerData.installmentMonths,
      overpaidRent: updatedCustomerData.overpaidRent,
      rentRatePerMillion: updatedCustomerData.rentRatePerMillion,
      guaranteeMultiplier: updatedCustomerData.guaranteeMultiplier,
      prepaidRentMultiplier: updatedCustomerData.prepaidRentMultiplier,
      transferYear: updatedCustomerData.transferYear,
      annualInterestRate: updatedCustomerData.annualInterestRate,
      income: updatedCustomerData.income,
      debt: updatedCustomerData.debt,
      maxDebtAllowed: updatedCustomerData.maxDebtAllowed,
      loanTerm: updatedCustomerData.loanTerm,
      ltv: updatedCustomerData.ltv,
      ltvNote: updatedCustomerData.ltvNote,
      maxLoanAmount: updatedCustomerData.maxLoanAmount,
      targetDate: updatedCustomerData.targetDate,
      officer: updatedCustomerData.officer,
      selectedBank: updatedCustomerData.selectedBank,
      targetBank: updatedCustomerData.targetBank,
      recommendedLoanTerm: updatedCustomerData.recommendedLoanTerm,
      recommendedInstallment: updatedCustomerData.recommendedInstallment,
      potentialScore: kpis.potentialScore,
      degreeOfOwnership: kpis.degreeOfOwnership,
      financialStatus: kpis.financialStatus,
      actionPlanProgress: kpis.actionPlanProgress,
      paymentHistory: kpis.paymentHistory,
      creditScore: updatedCustomerData.creditScore,
      accountStatuses: updatedCustomerData.accountStatuses,
      livnexCompleted: updatedCustomerData.livnexCompleted,
      creditNotes: updatedCustomerData.creditNotes,
      loanProblem: req.body.loanProblem || [],
      actionPlan: req.body.actionPlan || []
    };

    await updateCustomerWithDetails(customerId, dbData);
    const updatedCustomer = await getCustomerWithDetails(customerId);
    const enrichedCustomer = await enrichCustomerWithCalculations(updatedCustomer);

    res.json({ message: 'Customer updated successfully', customer: enrichedCustomer });
  } catch (error) {
    res.status(500).json({ message: 'Error updating customer', error: error.message });
  }
});

// Delete customer
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const existing = await getCustomerWithDetails(customerId);
    if (!existing) return res.status(404).json({ message: 'Customer not found' });
    await deleteCustomer(customerId);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting customer', error: error.message });
  }
});

module.exports = router;
