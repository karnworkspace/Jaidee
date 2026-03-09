/**
 * Rent-to-Own Calculation Route
 */
const express = require('express');
const router = express.Router();

router.post('/calculate-rent-to-own', (req, res) => {
  const {
    propertyPrice, discount, overpaidRent, installmentMonths,
    rentRatePerMillion, guaranteeMultiplier, prepaidRentMultiplier, transferYear
  } = req.body;

  // Validation
  if (
    !propertyPrice || propertyPrice <= 0 ||
    discount === undefined || discount < 0 ||
    overpaidRent === undefined || overpaidRent < 0 ||
    !installmentMonths || ![6, 12, 18, 24, 30, 36].includes(installmentMonths) ||
    !rentRatePerMillion || rentRatePerMillion <= 0 ||
    !guaranteeMultiplier || guaranteeMultiplier <= 0 ||
    !prepaidRentMultiplier || prepaidRentMultiplier <= 0 ||
    !transferYear || ![1, 2, 3].includes(transferYear)
  ) {
    return res.status(400).json({ message: 'Invalid or missing input parameters. All numeric values must be positive.' });
  }

  const propertyAfterDiscount = propertyPrice - discount;
  const monthlyRent = Math.ceil((propertyAfterDiscount * rentRatePerMillion) / 1000000 / 100) * 100;
  const totalPaid = monthlyRent * installmentMonths;
  const guarantee = monthlyRent * guaranteeMultiplier;
  const prepaidRent = monthlyRent * prepaidRentMultiplier;
  const additionalPayment = (guarantee + prepaidRent) - overpaidRent;

  let transferFeeRate = 0;
  if (transferYear === 1) transferFeeRate = 0.01;
  else if (transferYear === 2) transferFeeRate = 0.015;
  else if (transferYear === 3) transferFeeRate = 0.02;
  const transferFee = propertyAfterDiscount * transferFeeRate;

  const accumulatedSavings = totalPaid * 0.80;
  const remainingPrincipal = propertyAfterDiscount - accumulatedSavings;

  res.status(200).json({
    propertyAfterDiscount: Math.round(propertyAfterDiscount),
    monthlyRent: Math.round(monthlyRent),
    totalPaid: Math.round(totalPaid),
    guarantee: Math.round(guarantee),
    prepaidRent: Math.round(prepaidRent),
    additionalPayment: Math.round(additionalPayment),
    transferFee: Math.round(transferFee),
    accumulatedSavings: Math.round(accumulatedSavings),
    remainingPrincipal: Math.round(remainingPrincipal)
  });
});

module.exports = router;
