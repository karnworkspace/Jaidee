/**
 * Customer Service
 * Orchestrates all calculations for a customer (single source of truth)
 * Replaces duplicated calculation code in GET/:id, POST, PUT routes
 */

const { calculateKPIs, calculateLoanEstimation, calculateLoanEstimationAllBanks } = require('./loanCalculation');
const { createCreditBureauAnalysis } = require('./creditAnalysis');
const { calculateBankMatchingWithCreditBureau } = require('./bankMatching');
const { calculateRentToOwnEstimation, calculateRentToOwnAmortizationTable } = require('./rentToOwn');

/**
 * Calculate all derived data for a customer
 * @param {Object} customerData - Customer data object
 * @returns {Promise<Object>} All calculated results
 */
const calculateAllForCustomer = async (customerData) => {
  const propertyPrice = parseFloat(customerData.propertyPrice) || parseFloat(customerData.propertyValue) || 0;

  const loanEstimation = calculateLoanEstimation(
    parseFloat(customerData.income) || 0,
    parseFloat(customerData.debt) || 0,
    propertyPrice,
    parseFloat(customerData.discount) || 0,
    parseFloat(customerData.ltv) || 0,
    customerData.targetBank || 'KTB'
  );

  const allBanksLoanEstimation = calculateLoanEstimationAllBanks(
    parseFloat(customerData.income) || 0,
    parseFloat(customerData.debt) || 0,
    propertyPrice,
    parseFloat(customerData.discount) || 0,
    parseFloat(customerData.ltv) || 0
  );

  const enhancedBankMatching = await calculateBankMatchingWithCreditBureau(customerData);
  const creditBureauAnalysis = createCreditBureauAnalysis(customerData);

  const rentToOwnEstimation = calculateRentToOwnEstimation(
    parseFloat(customerData.rentToOwnValue) || 0,
    parseFloat(customerData.monthlyRentToOwnRate) || 0
  );

  const detailedRentToOwnEstimation = calculateRentToOwnAmortizationTable(customerData);

  return {
    loanEstimation,
    allBanksLoanEstimation,
    enhancedBankMatching,
    creditBureauAnalysis,
    rentToOwnEstimation,
    detailedRentToOwnEstimation
  };
};

/**
 * Attach calculated data to a customer object
 * @param {Object} customer - Customer record
 * @returns {Promise<Object>} Customer with all calculated data attached
 */
const enrichCustomerWithCalculations = async (customer) => {
  const calculations = await calculateAllForCustomer(customer);
  return { ...customer, ...calculations };
};

module.exports = {
  calculateAllForCustomer,
  enrichCustomerWithCalculations
};
