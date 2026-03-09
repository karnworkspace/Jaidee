/**
 * Bank Matching Service
 * Enhanced bank matching algorithm using database rules and credit bureau data
 */

const { getAllBankRules } = require('../database');
const { interpretCreditScore, classify3BProblems, calculateLivNexCompatibility, parseAccountStatuses } = require('./creditAnalysis');
const { parseLtvDecimal } = require('./loanCalculation');

/** @param {number} totalScore */
const calculateApprovalProbability = (totalScore) => {
  if (totalScore >= 80) return 'สูงมาก';
  if (totalScore >= 65) return 'สูง';
  if (totalScore >= 50) return 'ปานกลาง';
  if (totalScore >= 35) return 'ต่ำ';
  return 'ต่ำมาก';
};

const calculateEstimatedApprovalTime = (totalScore, bankRule) => {
  if (bankRule.partnership === 'LivNex_Primary') {
    return totalScore >= 50 ? '7-14 วัน' : '14-21 วัน';
  } else if (bankRule.partnership === 'Government_Backing') {
    return totalScore >= 60 ? '14-21 วัน' : '21-30 วัน';
  }
  return totalScore >= 70 ? '7-14 วัน' : '14-30 วัน';
};

const calculateLoanBandScore = (customerData, bankCriteria) => {
  const income = parseFloat(customerData.income) || 0;
  const debt = parseFloat(customerData.debt) || 0;
  const age = parseInt(customerData.age) || 25;
  const dsr = income > 0 ? (debt / income) * 100 : 100;

  let score = 0;

  // Income Score (0-30 points)
  if (income >= bankCriteria.minIncome) {
    const incomeRatio = income / bankCriteria.minIncome;
    score += Math.min(30, incomeRatio * 15);
  }

  // DSR Score (0-40 points)
  if (dsr <= bankCriteria.maxDSR) {
    const dsrScore = ((bankCriteria.maxDSR - dsr) / bankCriteria.maxDSR) * 40;
    score += Math.max(0, dsrScore);
  }

  // Age Score (0-15 points)
  if (age >= bankCriteria.ageMin && age <= bankCriteria.ageMax) {
    const ageRange = bankCriteria.ageMax - bankCriteria.ageMin;
    const agePosition = (age - bankCriteria.ageMin) / ageRange;
    const ageScore = 15 * (1 - Math.abs(agePosition - 0.5) * 2);
    score += Math.max(5, ageScore);
  }

  // Stability Score (0-15 points)
  if (bankCriteria.stableIncome && customerData.job && customerData.job !== 'ธุรกิจส่วนตัว') {
    score += 15;
  } else if (!bankCriteria.stableIncome) {
    score += 10;
  }

  return Math.min(100, score);
};

const calculateRentToOwnScore = (customerData, bankCriteria) => {
  const propertyValue = parseFloat(customerData.propertyValue) || 0;
  const monthlyRent = parseFloat(customerData.monthlyRentToOwnRate) || 0;
  const income = parseFloat(customerData.income) || 0;
  const customerLtvDecimal = parseLtvDecimal(customerData.ltv);

  let score = 0;

  // LTV Score (0-30 points)
  const bankMaxLtvDecimal = bankCriteria.maxLTVDecimal || (bankCriteria.maxLTV || 80) / 100;
  if (customerLtvDecimal <= bankMaxLtvDecimal) {
    const ltvScore = ((bankMaxLtvDecimal - customerLtvDecimal) / bankMaxLtvDecimal) * 30;
    score += Math.max(0, ltvScore);
  }

  // Affordability Score (0-40 points)
  if (income > 0 && monthlyRent > 0) {
    const affordabilityRatio = (monthlyRent / income) * 100;
    if (affordabilityRatio <= 30) score += 40;
    else if (affordabilityRatio <= 40) score += 25;
    else if (affordabilityRatio <= 50) score += 10;
  }

  // Property Value Score (0-30 points)
  if (propertyValue >= 1000000) score += 30;
  else if (propertyValue >= 500000) score += 20;
  else if (propertyValue >= 200000) score += 10;

  return Math.min(100, score);
};

const calculateCreditBureauScore = (customerData, bankCriteria) => {
  const creditScore = parseFloat(customerData.creditScore) || null;
  const financialStatus = customerData.financialStatus || 'ไม่มีข้อมูล';
  const livnexCompleted = customerData.livnexCompleted || false;
  const accountStatuses = parseAccountStatuses(customerData.accountStatuses);

  let score = 0;

  // Credit Score (0-50 points)
  if (creditScore !== null && !isNaN(creditScore)) {
    if (creditScore >= bankCriteria.minCreditScore) {
      if (creditScore >= 750) score += 50;
      else if (creditScore >= 700) score += 45;
      else if (creditScore >= 650) score += 40;
      else if (creditScore >= 600) score += 30;
      else score += 20;
    } else {
      score += Math.max(0, 10 - ((bankCriteria.minCreditScore - creditScore) / 10));
    }
  } else {
    score += 25;
  }

  // Account Status Penalty/Bonus (0-25 points)
  let statusScore = 25;
  accountStatuses.forEach(status => {
    if (['30', '31', '33', '44'].includes(status)) statusScore -= 10;
    else if (['20', '21', '43'].includes(status)) statusScore -= 5;
    else if (['01', '11', '12', '42'].includes(status)) statusScore = Math.max(statusScore, 20);
  });
  score += Math.max(0, statusScore);

  // Financial Status Score (0-15 points)
  if (financialStatus === 'ดีเยี่ยม') score += 15;
  else if (financialStatus === 'เฝ้าระวัง') score += 10;
  else if (financialStatus === 'ต้องปรับปรุง') score += 5;

  // LivNex Bonus (0-10 points)
  if (livnexCompleted) score += Math.min(10, bankCriteria.livnexBonus / 10);

  return Math.min(100, score);
};

/**
 * Calculate enhanced bank matching using database rules
 * @param {Object} customerData - Customer data
 * @returns {Promise<Object>} Bank matching results
 */
const calculateEnhancedBankMatching = async (customerData) => {
  try {
    const bankRules = await getAllBankRules();
    const bankResults = {};

    bankRules.forEach(bankRule => {
      const loanCriteria = {
        minIncome: bankRule.min_income || 12000,
        maxDSR: (bankRule.dsr_high || bankRule.dsr_low) * 100,
        stableIncome: bankRule.partnership_type !== 'LivNex_Primary',
        ageMin: bankRule.age_min || 18,
        ageMax: bankRule.age_max || 65,
        maxTerm: bankRule.max_term || 30
      };

      const rentToOwnTerms = {
        maxLTV: parseFloat(bankRule.max_ltv_rent_to_own) || 80,
        maxLTVDecimal: (parseFloat(bankRule.max_ltv_rent_to_own) || 80) / 100,
        preferredInterestRate: bankRule.preferred_interest_rate || 4.5,
        maxTerm: bankRule.max_term_rent_to_own || 25,
        specialProgram: bankRule.special_programs?.[0],
        ltvType1: bankRule.ltv_type1 || 0.90,
        ltvType2Over2Years: bankRule.ltv_type2_over_2years || 0.80,
        ltvType2Under2Years: bankRule.ltv_type2_under_2years || 0.70,
        ltvType3: bankRule.ltv_type3 || 0.60
      };

      const creditRequirements = {
        minCreditScore: bankRule.min_credit_score || 600,
        livnexBonus: bankRule.livnex_bonus || 0,
        excludeStatus: bankRule.exclude_status || [],
        acceptableGrades: bankRule.acceptable_grades || []
      };

      const scoring = {
        loanWeight: bankRule.loan_weight || 0.4,
        rentToOwnWeight: bankRule.rent_to_own_weight || 0.3,
        creditWeight: bankRule.credit_weight || 0.3
      };

      // Calculate component scores
      const loanBandScore = calculateLoanBandScore(customerData, loanCriteria);
      const rentToOwnScore = calculateRentToOwnScore(customerData, rentToOwnTerms);
      const creditBureauScore = calculateCreditBureauScore(customerData, creditRequirements);

      const totalScore = (
        loanBandScore * scoring.loanWeight +
        rentToOwnScore * scoring.rentToOwnWeight +
        creditBureauScore * scoring.creditWeight
      );

      // Determine eligibility
      const basicEligible = totalScore >= 40;
      const income = parseFloat(customerData.income) || 0;
      const debt = parseFloat(customerData.debt) || 0;
      const age = parseInt(customerData.age) || 0;
      const customerLtvDecimal = parseLtvDecimal(customerData.ltv);

      let dsrPassed = true;
      if (income > 0) {
        const dsr = (debt / income) * 100;
        const dsrHigh = (parseFloat(bankRule.dsr_high) || 0.5) * 100;
        dsrPassed = dsr <= dsrHigh;
      }

      const maxLtvDecimal = parseFloat(bankRule.ltv_type1) || 0.9;
      const ltvPassed = customerLtvDecimal <= maxLtvDecimal;
      const agePassed = age >= (bankRule.age_min || 18) && age <= (bankRule.age_max || 65);
      const isEligible = basicEligible && dsrPassed && ltvPassed && agePassed;

      const creditInterpretation = interpretCreditScore(customerData.creditScore);

      bankResults[bankRule.bank_code] = {
        totalScore: Math.round(totalScore),
        componentScores: {
          loanBand: Math.round(loanBandScore),
          rentToOwn: Math.round(rentToOwnScore),
          creditBureau: Math.round(creditBureauScore)
        },
        eligibility: isEligible ? 'eligible' : 'not_eligible',
        approvalProbability: isEligible ? calculateApprovalProbability(totalScore) : 'ต่ำมาก',
        eligibilityReasons: (() => {
          if (isEligible) return [];
          const reasons = [];
          if (!basicEligible) reasons.push('คะแนนรวมต่ำกว่าเกณฑ์ขั้นต่ำ (40)');
          if (!dsrPassed) reasons.push('DSR เกินเกณฑ์ที่กำหนด');
          if (!ltvPassed) reasons.push('LTV เกินเกณฑ์ที่กำหนด');
          if (!agePassed) reasons.push('อายุไม่อยู่ในช่วงที่กำหนด');
          return reasons;
        })(),
        estimatedApprovalTime: calculateEstimatedApprovalTime(totalScore, { partnership: bankRule.partnership_type }),
        specialPrograms: bankRule.special_programs || [],
        recommendedTerms: {
          interestRate: rentToOwnTerms.preferredInterestRate,
          maxLTV: Math.round(rentToOwnTerms.maxLTV),
          maxTerm: rentToOwnTerms.maxTerm,
          dsrHigh: parseFloat(bankRule.dsr_high) || 0.5,
          dsrLow: parseFloat(bankRule.dsr_low) || 0.5,
          ageRange: `${bankRule.age_min || 18}-${bankRule.age_max || 65}`,
          ltvType1: parseFloat(bankRule.ltv_type1) || 0.9,
          ltvType2Over2Years: parseFloat(bankRule.ltv_type2_over_2years) || 0.8,
          ltvType2Under2Years: parseFloat(bankRule.ltv_type2_under_2years) || 0.7,
          ltvType3: parseFloat(bankRule.ltv_type3) || 0.6
        },
        customerAnalysis: {
          currentDSR: (() => {
            const inc = parseFloat(customerData.income) || 0;
            const dbt = parseFloat(customerData.debt) || 0;
            if (inc === 0) return 'N/A';
            return ((dbt / inc) * 100).toFixed(1);
          })(),
          requestedLTV: Math.round(parseLtvDecimal(customerData.ltv) * 100),
          customerAge: parseInt(customerData.age) || 0,
          dsrStatus: (() => {
            const inc = parseFloat(customerData.income) || 0;
            const dbt = parseFloat(customerData.debt) || 0;
            if (inc === 0) return 'ไม่สามารถคำนวณได้';
            const dsr = (dbt / inc) * 100;
            const dsrH = (parseFloat(bankRule.dsr_high) || 0.5) * 100;
            const dsrL = (parseFloat(bankRule.dsr_low) || 0.5) * 100;
            if (dsr <= dsrL) return 'ผ่านเกณฑ์ (DSR ต่ำ)';
            if (dsr <= dsrH) return 'ผ่านเกณฑ์ (DSR สูง)';
            return 'ไม่ผ่านเกณฑ์';
          })(),
          ltvStatus: (() => {
            const cLtv = parseLtvDecimal(customerData.ltv);
            const maxLtv = parseFloat(bankRule.ltv_type1) || 0.9;
            if (customerData.ltv === 0) return 'ไม่มีข้อมูล';
            return cLtv <= maxLtv ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์';
          })(),
          ageStatus: (() => {
            const a = parseInt(customerData.age) || 0;
            const ageMin = bankRule.age_min || 18;
            const ageMax = bankRule.age_max || 65;
            if (a === 0) return 'ไม่มีข้อมูล';
            return (a >= ageMin && a <= ageMax) ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์';
          })()
        },
        partnership: bankRule.partnership_type,
        bankName: bankRule.bank_name,
        creditBureauInsights: {
          creditGrade: creditInterpretation.grade,
          creditStatus: creditInterpretation.status,
          livnexRecommendation: `${creditInterpretation.livnexDuration} เดือน (${creditInterpretation.priority})`,
          problems3B: classify3BProblems(customerData)
        }
      };
    });

    // Sort by total score and show top 4
    let sortedResults = Object.entries(bankResults)
      .sort((a, b) => b[1].totalScore - a[1].totalScore)
      .slice(0, 4)
      .reduce((acc, [bank, data]) => { acc[bank] = data; return acc; }, {});

    // Always include target bank if exists
    if (customerData.targetBank && bankResults[customerData.targetBank] && !sortedResults[customerData.targetBank]) {
      sortedResults[customerData.targetBank] = bankResults[customerData.targetBank];
    }

    return sortedResults;
  } catch (error) {
    return {};
  }
};

/**
 * Calculate bank matching with credit bureau adjustments
 * @param {Object} customerData - Customer data
 * @returns {Promise<Object>} Adjusted bank matching results
 */
const calculateBankMatchingWithCreditBureau = async (customerData) => {
  const livnexCompatibility = calculateLivNexCompatibility(customerData);
  const enhancedBankMatching = await calculateEnhancedBankMatching(customerData);

  Object.keys(enhancedBankMatching).forEach(bankName => {
    const bankData = enhancedBankMatching[bankName];

    if (!livnexCompatibility.eligible) {
      bankData.eligibility = 'not_eligible';
      bankData.reason = livnexCompatibility.reason;
      bankData.totalScore = Math.max(0, bankData.totalScore - 50);
    } else if (livnexCompatibility.problems3B.badCredit.severity === 'high') {
      bankData.totalScore = Math.max(0, bankData.totalScore - 20);
      bankData.approvalProbability = calculateApprovalProbability(bankData.totalScore);
    }

    bankData.creditBureauInsights = {
      creditGrade: livnexCompatibility.creditGrade,
      creditStatus: livnexCompatibility.creditStatus,
      livnexRecommendation: livnexCompatibility.eligible ?
        `${livnexCompatibility.duration} เดือน (${livnexCompatibility.priority})` :
        livnexCompatibility.action,
      problems3B: livnexCompatibility.problems3B
    };
  });

  return enhancedBankMatching;
};

module.exports = {
  calculateEnhancedBankMatching,
  calculateBankMatchingWithCreditBureau
};
