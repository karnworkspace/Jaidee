/**
 * Rent-to-Own Calculation Service
 * Functions for calculating rent-to-own estimations and amortization tables
 */

/**
 * Calculate basic rent-to-own estimation
 * @param {number} rentToOwnValue - Initial rent-to-own value
 * @param {number} monthlyRentToOwnRate - Monthly rent-to-own rate
 * @returns {Array} Estimation results for different periods
 */
const calculateRentToOwnEstimation = (rentToOwnValue, monthlyRentToOwnRate) => {
  const results = [];
  const installmentPeriods = [6, 12, 18, 24, 30, 36];

  const initialRentToOwnValue = parseFloat(rentToOwnValue) || 0;
  const monthlyRate = parseFloat(monthlyRentToOwnRate) || 0;

  installmentPeriods.forEach(months => {
    const totalPayment = monthlyRate * months;
    const accumulatedPrincipalPayment = totalPayment;
    const remainingPrincipal = initialRentToOwnValue - accumulatedPrincipalPayment;

    results.push({
      months,
      totalPayment: Math.round(totalPayment),
      accumulatedPrincipalPayment: Math.round(accumulatedPrincipalPayment),
      remainingPrincipal: Math.round(remainingPrincipal),
    });
  });

  return results;
};

/**
 * Calculate detailed rent-to-own amortization table
 * @param {Object} data - Property and rent-to-own parameters
 * @returns {Object} Amortization table with summary
 */
const calculateRentToOwnAmortizationTable = (data) => {
  const propertyPrice = parseFloat(data.propertyPrice) || 0;
  const discount = parseFloat(data.discount) || 0;
  const overpaidRent = parseFloat(data.overpaidRent) || 0;
  const rentRatePerMillion = parseFloat(data.rentRatePerMillion) || 0;
  const guaranteeMultiplier = parseFloat(data.guaranteeMultiplier) || 0;
  const prepaidMultiplier = parseFloat(data.prepaidRentMultiplier) || 0;
  const annualInterestRate = parseFloat(data.annualInterestRate) || 0;
  const installmentMonths = parseInt(data.installmentMonths) || 0;
  const transferYear = parseInt(data.transferYear) || 1;

  const propertyAfterDiscount = propertyPrice - discount;

  if (propertyAfterDiscount <= 0) {
    return {
      error: true,
      message: 'Property price after discount must be greater than 0',
      propertyAfterDiscount,
      amortizationTable: []
    };
  }

  const rawMonthlyRent = (propertyAfterDiscount * rentRatePerMillion) / 1000000;
  const monthlyRent = Math.ceil(rawMonthlyRent / 100) * 100;

  const guarantee = monthlyRent * guaranteeMultiplier;
  const prepaidRent = monthlyRent * prepaidMultiplier;
  const totalRequired = guarantee + prepaidRent;
  const initialPayment = Math.max(0, totalRequired - overpaidRent);

  const amortizationTable = [];
  let remainingPrincipal = propertyAfterDiscount;

  for (let month = 1; month <= installmentMonths; month++) {
    let payment, interest, principalPaid;

    if (month === 1) {
      payment = Math.max(initialPayment, 0);
      interest = 0;
      const totalAmountPaid = initialPayment + overpaidRent;
      principalPaid = Math.max(0, totalAmountPaid - guarantee - prepaidRent);
      remainingPrincipal = propertyAfterDiscount - principalPaid;
    } else {
      payment = monthlyRent;
      interest = Math.round(remainingPrincipal * (annualInterestRate / 100) / 12 * 100) / 100;
      principalPaid = payment - interest;
      remainingPrincipal = remainingPrincipal - principalPaid;
    }

    amortizationTable.push({
      installment: month,
      payment: Math.round(payment),
      interest: Math.round(interest),
      principalPaid: Math.round(principalPaid),
      remainingPrincipal: Math.round(remainingPrincipal),
    });
  }

  // Add end-of-period summary rows
  const endOfMonthInstallments = [12, 24, 36];
  for (const endMonth of endOfMonthInstallments) {
    if (installmentMonths >= endMonth) {
      const previousMonthData = amortizationTable.find(row => row.installment === endMonth);
      if (previousMonthData) {
        const previousRemaining = previousMonthData.remainingPrincipal;
        const interestFinal = Math.round(previousRemaining * (annualInterestRate / 100) / 12 * 100) / 100;

        amortizationTable.push({
          installment: `สิ้นงวดที่ ${endMonth}`,
          payment: Math.round(interestFinal),
          interest: Math.round(interestFinal),
          principalPaid: 0,
          remainingPrincipal: Math.round(previousRemaining),
        });
      }
    }
  }

  const totalPaid = monthlyRent * installmentMonths;
  const additionalPayment = initialPayment;

  let transferFeeRate = 0;
  if (transferYear === 1) transferFeeRate = 0.01;
  else if (transferYear === 2) transferFeeRate = 0.015;
  else if (transferYear === 3) transferFeeRate = 0.02;
  const transferFee = Math.max(0, propertyAfterDiscount * transferFeeRate);

  const accumulatedSavings = totalPaid * 0.80;

  return {
    propertyAfterDiscount: Math.round(propertyAfterDiscount),
    monthlyRent: Math.round(monthlyRent),
    totalPaid: Math.round(totalPaid),
    guarantee: Math.round(guarantee),
    prepaidRent: Math.round(prepaidRent),
    additionalPayment: Math.round(additionalPayment),
    transferFee: Math.round(transferFee),
    accumulatedSavings: Math.round(accumulatedSavings),
    remainingPrincipal: Math.round(remainingPrincipal),
    amortizationTable,
  };
};

module.exports = {
  calculateRentToOwnEstimation,
  calculateRentToOwnAmortizationTable
};
