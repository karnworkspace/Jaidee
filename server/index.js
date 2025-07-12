const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

let customers = [];

const refbank = {
  "KTB": {"40": 4100, "30": 4700, "20": 5200, "10": 10100},
  "GHB": {"40": 4100, "30": 5100, "20": 6100, "10": 10300},
  "GSB": {"40": 4500, "30": 5500, "20": 6500, "10": 10600},
  "BBL": {"30": 6400, "20": 7500, "10": 11300},
  "SCB": {"30": 6200, "20": 7500, "10": 11300},
  "KBANK": {"30": 6200, "20": 7400, "10": 11200},
  "BAY": {"30": 6000, "20": 7100, "10": 11100},
  "TTB": {"30": 6400, "20": 10600, "10": 10600},
  "CIMBT": {"30": 7900, "20": 7900, "10": 11500},
  "TISCO": {"40": 7000, "30": 8000, "20": 8800, "10": 11800},
  "KKP": {"40": 6000, "30": 6500, "20": 7600, "10": 11500},
  "LH BANK": {"40": 6100, "30": 6500, "20": 7600, "10": 11500}
};

const INCOME_PERCENTAGE_FOR_LOAN = 0.70;

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
    else if (dsr < 60) { financialStatus = 'ดีขึ้น'; dsrScore = 75; }
    else { financialStatus = 'ต้องปรับปรุง'; dsrScore = 50; }
  }

  let potentialScore = (actionPlanProgress * 0.5) + (dsrScore * 0.5);
  potentialScore = Math.min(100, Math.max(0, potentialScore));

  return {
    potentialScore: Math.round(potentialScore),
    degreeOfOwnership: Math.round(degreeOfOwnership),
    financialStatus: financialStatus,
    actionPlanProgress: Math.round(actionPlanProgress),
    paymentHistory: customerData.paymentHistory || 'ไม่มีข้อมูล',
  };
};

const calculateLoanEstimation = (income, currentDebt, propertyPrice, discount, ltv, targetBank) => {
  const results = [];
  const loanTerms = [40, 30, 20, 10];
  const debtReductionSteps = [0, -0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.7, -1]; // -1 represents "ไม่มีหนี้"

  const propertyAfterDiscount = (parseFloat(propertyPrice) || 0) - (parseFloat(discount) || 0);
  const ltvPercentage = parseFloat(ltv) / 100 || 0;
  const ltvLimit = propertyAfterDiscount * ltvPercentage;

  const bankRates = refbank[targetBank];
  if (!bankRates) {
    return []; // Return empty if bank not found
  }

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

const calculateRentToOwnEstimation = (rentToOwnValue, monthlyRentToOwnRate) => {
  const results = [];
  const installmentPeriods = [6, 12, 18, 24, 30, 36];

  const initialRentToOwnValue = parseFloat(rentToOwnValue) || 0;
  const monthlyRate = parseFloat(monthlyRentToOwnRate) || 0;

  installmentPeriods.forEach(months => {
    const totalPayment = monthlyRate * months;
    const accumulatedPrincipalPayment = totalPayment; // Assuming deposit and interest are 0 for now
    const remainingPrincipal = initialRentToOwnValue - accumulatedPrincipalPayment;

    results.push({
      months: months,
      totalPayment: Math.round(totalPayment),
      accumulatedPrincipalPayment: Math.round(accumulatedPrincipalPayment),
      remainingPrincipal: Math.round(remainingPrincipal),
    });
  });

  return results;
};

const calculateRentToOwnAmortizationTable = (data) => {
  const propertyPrice = parseFloat(data.propertyPrice) || 0;
  const discount = parseFloat(data.discount) || 0;
  const overpaidRent = parseFloat(data.overpaidRent) || 0;
  const rentRatePerMillion = parseFloat(data.rentRatePerMillion) || 0;
  const guaranteeMultiplier = parseFloat(data.guaranteeMultiplier) || 0;
  const prepaidMultiplier = parseFloat(data.prepaidRentMultiplier) || 0;
  const annualInterestRate = parseFloat(data.annualInterestRate) || 0;
  const installmentMonths = parseInt(data.installmentMonths) || 0;

  // Step 1: Pre-Calculation
  const propertyAfterDiscount = propertyPrice - discount;
  const rawMonthlyRent = (propertyAfterDiscount * rentRatePerMillion) / 1000000;
  const monthlyRent = Math.ceil(rawMonthlyRent / 100) * 100; // Round up to nearest hundred

  const guarantee = monthlyRent * guaranteeMultiplier;
  const prepaidRent = monthlyRent * prepaidMultiplier;
  const initialPayment = (guarantee + prepaidRent) - overpaidRent;

  // Step 2: Initialize Result Array
  const amortizationTable = [];
  let remainingPrincipal = propertyAfterDiscount;

  // Step 3: Loop to Build Table
  for (let month = 1; month <= installmentMonths; month++) {
    let payment, interest, principalPaid;

    if (month === 1) {
      payment = initialPayment + overpaidRent; // ชำระรวม ณ งวดแรก
      interest = 0; // งวดแรกยังไม่มีดอกเบี้ย
      principalPaid = payment - guarantee; // เงินต้น = ชำระ - ค่าประกัน
      remainingPrincipal = propertyAfterDiscount - principalPaid;
    } else {
      payment = monthlyRent;
      interest = Math.round(remainingPrincipal * (annualInterestRate / 100) / 12 * 100) / 100; // Round to 2 decimal places
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

  // Step 4: Add “สิ้นงวด” rows at 12, 24, 36 months
  const endOfMonthInstallments = [12, 24, 36];
  for (const endMonth of endOfMonthInstallments) {
    if (installmentMonths >= endMonth) {
      const previousMonthData = amortizationTable.find(row => row.installment === endMonth);
      if (previousMonthData) {
        const previousRemaining = previousMonthData.remainingPrincipal;
        const interestFinal = Math.round(previousRemaining * (annualInterestRate / 100) / 12 * 100) / 100;
        const principalFinal = 0 - interestFinal; // As per pseudocode
        const remainingFinal = previousRemaining;

        amortizationTable.push({
          installment: `สิ้นงวดที่ ${endMonth}`,
          payment: Math.round(interestFinal),
          interest: Math.round(interestFinal),
          principalPaid: Math.round(principalFinal),
          remainingPrincipal: Math.round(remainingFinal),
        });
      }
    }
  }

  // Summary results (from previous detailed calculation, adjusted for new logic)
  const totalPaid = monthlyRent * installmentMonths;
  const additionalPayment = (guarantee + prepaidRent) - overpaidRent;
  const transferFee = 0; // Needs clarification if there's a formula for this in the new pseudocode
  const accumulatedSavings = totalPaid * 0.80; // Assuming 80% as per previous formula

  return {
    propertyAfterDiscount: Math.round(propertyAfterDiscount),
    monthlyRent: Math.round(monthlyRent),
    totalPaid: Math.round(totalPaid),
    guarantee: Math.round(guarantee),
    prepaidRent: Math.round(prepaidRent),
    additionalPayment: Math.round(additionalPayment),
    transferFee: Math.round(transferFee),
    accumulatedSavings: Math.round(accumulatedSavings),
    remainingPrincipal: Math.round(remainingPrincipal), // This will be the final remaining principal from the table
    amortizationTable: amortizationTable,
  };
};

app.post('/api/calculate-rent-to-own', (req, res) => {
  const {
    propertyPrice,
    discount,
    overpaidRent,
    installmentMonths,
    rentRatePerMillion,
    guaranteeMultiplier,
    prepaidRentMultiplier,
    transferYear
  } = req.body;

  // 1. Validation
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

  // 2. Calculation Logic
  const propertyAfterDiscount = propertyPrice - discount;

  // monthlyRent = ROUNDUP((propertyAfterDiscount * rentRatePerMillion) / 1,000,000, -2)
  // Round up to the nearest hundred
  const monthlyRent = Math.ceil((propertyAfterDiscount * rentRatePerMillion) / 1000000 / 100) * 100;

  const totalPaid = monthlyRent * installmentMonths;
  const guarantee = monthlyRent * guaranteeMultiplier;
  const prepaidRent = monthlyRent * prepaidRentMultiplier;
  const additionalPayment = (guarantee + prepaidRent) - overpaidRent;

  let transferFeeRate;
  if (transferYear === 1) {
    transferFeeRate = 0.01; // 1%
  } else if (transferYear === 2) {
    transferFeeRate = 0.015; // 1.5%
  } else if (transferYear === 3) {
    transferFeeRate = 0.02; // 2%
  } else {
    transferFeeRate = 0; // Default or error case, though validation should catch this
  }
  const transferFee = propertyAfterDiscount * transferFeeRate;

  // For now, using 0.80 as per the provided formula. "หรือจากตาราง Lookup" is not implemented.
  const accumulatedSavings = totalPaid * 0.80;
  const remainingPrincipal = propertyAfterDiscount - accumulatedSavings;

  // 3. Construct Response Body
  const response = {
    propertyAfterDiscount: Math.round(propertyAfterDiscount),
    monthlyRent: Math.round(monthlyRent),
    totalPaid: Math.round(totalPaid),
    guarantee: Math.round(guarantee),
    prepaidRent: Math.round(prepaidRent),
    additionalPayment: Math.round(additionalPayment),
    transferFee: Math.round(transferFee),
    accumulatedSavings: Math.round(accumulatedSavings),
    remainingPrincipal: Math.round(remainingPrincipal)
  };

  res.status(200).json(response);
});

app.get('/api/customers', (req, res) => {
  res.json(customers);
});

app.get('/api/customers/:id', (req, res) => {
  const customerId = parseInt(req.params.id);
  const customer = customers.find(c => c.id === customerId);
  if (customer) {
    res.json(customer);
  } else {
    res.status(404).json({ message: 'Customer not found' });
  }
});

app.post('/api/customers', (req, res) => {
  const kpis = calculateKPIs(req.body);
  const loanEstimation = calculateLoanEstimation(
    parseFloat(req.body.income) || 0,
    parseFloat(req.body.debt) || 0,
    parseFloat(req.body.propertyPrice) || 0, // Use propertyPrice
    parseFloat(req.body.discount) || 0,      // Use discount
    parseFloat(req.body.ltv) || 0,
    req.body.targetBank || 'KTB'
  );
  const rentToOwnEstimation = calculateRentToOwnEstimation(
    parseFloat(req.body.rentToOwnValue) || 0,
    parseFloat(req.body.monthlyRentToOwnRate) || 0
  );
  const detailedRentToOwnEstimation = calculateRentToOwnAmortizationTable(req.body);
  const newCustomer = {
    id: customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1,
    ...req.body,
    projectName: req.body.projectName || '',
    unit: req.body.unit || '',
    readyToTransfer: req.body.readyToTransfer || '',
    loanProblem: req.body.loanProblem || [],
    actionPlan: req.body.actionPlan || [],
    ...kpis,
    loanEstimation,
    rentToOwnEstimation,
    detailedRentToOwnEstimation,
  };
  customers.push(newCustomer);
  res.status(201).json({ message: 'Customer added successfully', customer: newCustomer });
});

app.put('/api/customers/:id', (req, res) => {
  const customerId = parseInt(req.params.id);
  const customerIndex = customers.findIndex(c => c.id === customerId);

  if (customerIndex !== -1) {
    const updatedCustomerData = { ...customers[customerIndex], ...req.body, id: customerId };
    const kpis = calculateKPIs(updatedCustomerData);
    const loanEstimation = calculateLoanEstimation(
      parseFloat(updatedCustomerData.income) || 0,
      parseFloat(updatedCustomerData.debt) || 0,
      parseFloat(updatedCustomerData.propertyPrice) || 0, // Use propertyPrice
      parseFloat(updatedCustomerData.discount) || 0,      // Use discount
      parseFloat(updatedCustomerData.ltv) || 0,
      updatedCustomerData.targetBank || 'KTB'
    );
    const rentToOwnEstimation = calculateRentToOwnEstimation(
      parseFloat(updatedCustomerData.rentToOwnValue) || 0,
      parseFloat(updatedCustomerData.monthlyRentToOwnRate) || 0
    );
    const detailedRentToOwnEstimation = calculateRentToOwnAmortizationTable(updatedCustomerData);
    customers[customerIndex] = { 
      ...updatedCustomerData, 
      ...kpis, 
      loanEstimation,
      rentToOwnEstimation,
      detailedRentToOwnEstimation,
    };
    res.json({ message: 'Customer updated successfully', customer: customers[customerIndex] });
  } else {
    res.status(404).json({ message: 'Customer not found' });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});