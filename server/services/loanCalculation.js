/**
 * Loan Calculation Service
 * Functions for calculating loan estimations, KPIs, and approval probability
 */

const { refbank, INCOME_PERCENTAGE_FOR_LOAN } = require('../config/bankConstants');

/**
 * Parse LTV value to get the actual limit amount
 * @param {number} ltvValue - LTV value (decimal 0.5-1.0 or percentage 1-100)
 * @param {number} propertyAfterDiscount - Property price after discount
 * @returns {number} LTV limit amount
 */
const parseLtvLimit = (ltvValue, propertyAfterDiscount) => {
  let parsedLtv = parseFloat(ltvValue) || 1.0;

  if (parsedLtv >= 0.5 && parsedLtv <= 1.0) {
    return propertyAfterDiscount * parsedLtv;
  } else if (parsedLtv > 1 && parsedLtv <= 100) {
    return propertyAfterDiscount * (parsedLtv / 100);
  }
  return propertyAfterDiscount * 1.0;
};

/**
 * Parse LTV value to decimal (0-1)
 * @param {number} ltvValue - LTV value
 * @returns {number} LTV as decimal
 */
const parseLtvDecimal = (ltvValue) => {
  let parsed = parseFloat(ltvValue) || 1.0;
  if (parsed >= 0.5 && parsed <= 1.0) return parsed;
  if (parsed > 1 && parsed <= 100) return parsed / 100;
  return 1.0;
};

/** @param {Object} customerData - Customer data */
const calculateKPIs = (customerData) => {
  const income = parseFloat(customerData.income) || 0;
  const debt = parseFloat(customerData.debt) || 0;
  const propertyValue = parseFloat(customerData.propertyValue) || 0;
  const actionPlanProgress = parseFloat(customerData.actionPlanProgress) || 0;

  let degreeOfOwnership = 0;
  if (propertyValue > 0 && income > 0) {
    degreeOfOwnership = (income / propertyValue) * 100;
  }

  let financialStatus = 'ไม่มีข้อมูล';
  let dsrScore = 0;
  if (income > 0) {
    const dsr = (debt / income) * 100;
    if (dsr < 40) { financialStatus = 'ดีเยี่ยม'; dsrScore = 100; }
    else if (dsr < 60) { financialStatus = 'เฝ้าระวัง'; dsrScore = 75; }
    else { financialStatus = 'ต้องปรับปรุง'; dsrScore = 50; }
  }

  let potentialScore = (actionPlanProgress * 0.5) + (dsrScore * 0.5);
  potentialScore = Math.min(100, Math.max(0, potentialScore));

  return {
    potentialScore: Math.round(potentialScore),
    degreeOfOwnership: Math.round(degreeOfOwnership),
    financialStatus,
    actionPlanProgress: Math.round(actionPlanProgress),
    paymentHistory: customerData.paymentHistory || 'ไม่มีข้อมูล',
  };
};

/** @param {number} totalScore - Total matching score */
const calculateApprovalProbability = (totalScore) => {
  if (totalScore >= 80) return 'สูงมาก';
  if (totalScore >= 65) return 'สูง';
  if (totalScore >= 50) return 'ปานกลาง';
  if (totalScore >= 35) return 'ต่ำ';
  return 'ต่ำมาก';
};

/**
 * Calculate loan estimation for all banks
 * @param {number} income - Monthly income
 * @param {number} currentDebt - Current debt
 * @param {number} propertyPrice - Property price
 * @param {number} discount - Discount amount
 * @param {number} ltv - LTV value
 * @returns {Object} Results for all banks
 */
const calculateLoanEstimationAllBanks = (income, currentDebt, propertyPrice, discount, ltv) => {
  const allBanksResults = {};
  const loanTerms = [40, 30, 20, 10];
  const debtReductionSteps = [0, -0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.7, -1];

  const propertyAfterDiscount = (parseFloat(propertyPrice) || 0) - (parseFloat(discount) || 0);
  const ltvLimit = parseLtvLimit(ltv, propertyAfterDiscount);

  Object.keys(refbank).forEach(bankName => {
    const bankRates = refbank[bankName];
    const results = [];

    debtReductionSteps.forEach(reduction => {
      const scenario = {};
      let reducedDebt;
      if (reduction === -1) {
        reducedDebt = 0;
        scenario.label = 'ไม่มีหนี้';
      } else {
        reducedDebt = currentDebt * (1 + reduction);
        scenario.label = reduction === 0 ? 'ปัจจุบัน' : `${reduction * 100}%`;
      }
      scenario.debt = Math.round(reducedDebt);

      scenario.loanAmounts = {};
      loanTerms.forEach(term => {
        const ratePerMillion = bankRates[term];
        if (ratePerMillion) {
          const dsrPayment = (income * INCOME_PERCENTAGE_FOR_LOAN) - reducedDebt;
          let loanAmount = 0;
          if (dsrPayment > 0) {
            loanAmount = (dsrPayment / ratePerMillion) * 1000000;
          }
          const finalLoan = ltvLimit > 0 ? Math.min(loanAmount, ltvLimit) : loanAmount;
          scenario.loanAmounts[term] = Math.round(finalLoan);
        } else {
          scenario.loanAmounts[term] = "N/A";
        }
      });
      results.push(scenario);
    });

    allBanksResults[bankName] = results;
  });

  return allBanksResults;
};

/**
 * Calculate loan estimation for a specific bank
 * @param {number} income - Monthly income
 * @param {number} currentDebt - Current debt
 * @param {number} propertyPrice - Property price
 * @param {number} discount - Discount amount
 * @param {number} ltv - LTV value
 * @param {string} targetBank - Target bank code
 * @returns {Array} Loan estimation results
 */
const calculateLoanEstimation = (income, currentDebt, propertyPrice, discount, ltv, targetBank) => {
  const results = [];
  const loanTerms = [40, 30, 20, 10];
  const debtReductionSteps = [0, -0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.7, -1];

  const propertyAfterDiscount = (parseFloat(propertyPrice) || 0) - (parseFloat(discount) || 0);
  const ltvLimit = parseLtvLimit(ltv, propertyAfterDiscount);

  const bankRates = refbank[targetBank];
  if (!bankRates) return [];

  debtReductionSteps.forEach(reduction => {
    const scenario = {};
    let reducedDebt;
    if (reduction === -1) {
      reducedDebt = 0;
      scenario.label = 'ไม่มีหนี้';
    } else {
      reducedDebt = currentDebt * (1 + reduction);
      scenario.label = reduction === 0 ? 'ปัจจุบัน' : `${reduction * 100}%`;
    }
    scenario.debt = Math.round(reducedDebt);

    scenario.loanAmounts = {};
    loanTerms.forEach(term => {
      const ratePerMillion = bankRates[term];
      if (ratePerMillion) {
        const dsrPayment = (income * INCOME_PERCENTAGE_FOR_LOAN) - reducedDebt;
        let loanAmount = 0;
        if (dsrPayment > 0) {
          loanAmount = (dsrPayment / ratePerMillion) * 1000000;
        }
        const finalLoan = ltvLimit > 0 ? Math.min(loanAmount, ltvLimit) : loanAmount;
        scenario.loanAmounts[term] = Math.round(finalLoan);
      } else {
        scenario.loanAmounts[term] = "N/A";
      }
    });
    results.push(scenario);
  });

  return results;
};

module.exports = {
  parseLtvLimit,
  parseLtvDecimal,
  calculateKPIs,
  calculateApprovalProbability,
  calculateLoanEstimationAllBanks,
  calculateLoanEstimation
};
