/**
 * Credit Bureau Analysis Service
 * Functions for interpreting credit scores, classifying problems, and LivNex compatibility
 */

const { creditGradeRanges, livnexEligibilityRules } = require('../config/bankConstants');

/** @param {number|string} score - Credit score */
const interpretCreditScore = (score) => {
  const creditScore = parseFloat(score) || null;

  if (creditScore === null || isNaN(creditScore)) {
    return { score: null, grade: null, status: 'ไม่มีข้อมูล', livnexDuration: null, priority: 'unknown' };
  }

  for (const [grade, range] of Object.entries(creditGradeRanges)) {
    if (creditScore >= range.min && creditScore <= range.max) {
      return { score: creditScore, grade, status: range.status, livnexDuration: range.livnexDuration, priority: range.priority };
    }
  }

  return { score: creditScore, grade: 'HH', status: 'Very Bad', livnexDuration: 36, priority: 'critical' };
};

/** @param {string|string[]} rawStatuses - Account statuses string or array */
const parseAccountStatuses = (rawStatuses) => {
  if (!rawStatuses) return [];
  if (Array.isArray(rawStatuses)) return rawStatuses;
  return rawStatuses.split(',').map(s => s.trim()).filter(s => s);
};

/** @param {Object} customerData - Customer data object */
const classify3BProblems = (customerData) => {
  const creditScore = parseFloat(customerData.creditScore) || null;
  const accountStatuses = parseAccountStatuses(customerData.accountStatuses);
  const paymentHistory = customerData.paymentHistory || 'ไม่มีข้อมูล';
  const financialStatus = customerData.financialStatus || 'ไม่มีข้อมูล';

  const problems = {
    badCredit: { indicators: [], severity: 'none', recommendations: [] },
    badIncome: { indicators: [], severity: 'none', recommendations: [] },
    badConfidence: { indicators: [], severity: 'none', recommendations: [] }
  };

  // Bad Credit Analysis
  if (creditScore !== null && !isNaN(creditScore) && creditScore < 680) {
    problems.badCredit.indicators.push('creditScore < 680');
    problems.badCredit.severity = creditScore < 600 ? 'high' : 'medium';
  }

  const problemStatuses = accountStatuses.filter(status =>
    ['20', '21', '30', '31', '33', '43', '44'].includes(status)
  );
  if (problemStatuses.length > 0) {
    problems.badCredit.indicators.push('hasProblematicAccountStatus');
    problems.badCredit.severity = 'high';
  }

  if (paymentHistory === 'ไม่ดี' || paymentHistory.includes('ค้างชำระ')) {
    problems.badCredit.indicators.push('hasOverduePayments');
    problems.badCredit.severity = problems.badCredit.severity === 'high' ? 'high' : 'medium';
  }

  // Enhanced Bad Income Analysis
  const income = parseFloat(customerData.income) || 0;
  const debt = parseFloat(customerData.debt) || 0;
  const job = customerData.job || '';
  const position = customerData.position || '';
  const businessOwnerType = customerData.businessOwnerType || '';

  if (income <= 15000) {
    problems.badIncome.indicators.push('criticallyLowIncome');
    problems.badIncome.severity = 'high';
  } else if (income <= 25000) {
    problems.badIncome.indicators.push('lowIncome');
    problems.badIncome.severity = problems.badIncome.severity === 'high' ? 'high' : 'medium';
  } else if (income <= 40000) {
    problems.badIncome.indicators.push('belowAverageIncome');
    problems.badIncome.severity = problems.badIncome.severity !== 'none' ? problems.badIncome.severity : 'low';
  }

  if (income > 0) {
    const dsr = (debt / income);
    if (dsr > 0.8) {
      problems.badIncome.indicators.push('excessiveDebtBurden');
      problems.badIncome.severity = 'high';
    } else if (dsr > 0.6) {
      problems.badIncome.indicators.push('highDebtBurden');
      problems.badIncome.severity = problems.badIncome.severity === 'high' ? 'high' : 'medium';
    } else if (dsr > 0.4) {
      problems.badIncome.indicators.push('moderateDebtBurden');
      problems.badIncome.severity = problems.badIncome.severity !== 'none' ? problems.badIncome.severity : 'low';
    }
  }

  if (job === 'ธุรกิจส่วนตัว' || job.includes('อิสระ') || job.includes('Freelance')) {
    problems.badIncome.indicators.push('unstableIncomeSource');
    problems.badIncome.severity = problems.badIncome.severity === 'high' ? 'high' :
                                 problems.badIncome.severity === 'medium' ? 'medium' : 'low';
  }

  if (businessOwnerType === 'เจ้าของธุรกิจส่วนตัว') {
    problems.badIncome.indicators.push('privateBusinessOwner');
    problems.badIncome.severity = problems.badIncome.severity === 'high' ? 'high' :
                                 problems.badIncome.severity === 'medium' ? 'medium' : 'low';
  }

  if (position && (position.includes('ชั่วคราว') || position.includes('สัญญาจ้าง') ||
                   position.includes('พาร์ทไทม์') || position.includes('ลูกจ้างรายวัน'))) {
    problems.badIncome.indicators.push('temporaryEmployment');
    problems.badIncome.severity = problems.badIncome.severity === 'high' ? 'high' : 'medium';
  }

  const propertyValue = parseFloat(customerData.propertyValue) || 0;
  if (propertyValue > 0 && income > 0) {
    const incomeToPropertyRatio = (income * 12) / propertyValue;
    if (incomeToPropertyRatio < 0.15) {
      problems.badIncome.indicators.push('insufficientIncomeForProperty');
      problems.badIncome.severity = problems.badIncome.severity === 'high' ? 'high' : 'medium';
    }
  }

  // Bad Confidence Analysis
  if (problems.badCredit.severity === 'high') {
    problems.badConfidence.indicators.push('pastCreditIssues');
    problems.badConfidence.severity = 'medium';
  }
  if (financialStatus === 'ต้องปรับปรุง') {
    problems.badConfidence.indicators.push('currentFinancialStress');
    problems.badConfidence.severity = problems.badConfidence.severity === 'medium' ? 'medium' : 'low';
  }

  // Generate recommendations
  if (problems.badCredit.severity !== 'none') {
    problems.badCredit.recommendations.push('เข้าโปรแกรม LivNex เพื่อปรับปรุงเครดิต');
    problems.badCredit.recommendations.push('ปรับปรุงประวัติการชำระเงิน');
  }
  if (problems.badIncome.severity !== 'none') {
    problems.badIncome.recommendations.push('จัดเตรียมเอกสารรายได้ที่ชัดเจนและครบถ้วน');
    if (problems.badIncome.indicators.includes('criticallyLowIncome') || problems.badIncome.indicators.includes('lowIncome')) {
      problems.badIncome.recommendations.push('หาแหล่งรายได้เสริมหรือเพิ่มรายได้หลัก');
      problems.badIncome.recommendations.push('พิจารณาพักการสมัครสินเชื่อจนกว่ารายได้จะเพิ่มขึ้น');
    }
    if (problems.badIncome.indicators.includes('excessiveDebtBurden') || problems.badIncome.indicators.includes('highDebtBurden')) {
      problems.badIncome.recommendations.push('ลดภาระหนี้ให้อยู่ในระดับที่เหมาะสม (DSR < 60%)');
      problems.badIncome.recommendations.push('ปรับโครงสร้างหนี้หรือรวมหนี้');
    }
    if (problems.badIncome.indicators.includes('unstableIncomeSource') || problems.badIncome.indicators.includes('privateBusinessOwner')) {
      problems.badIncome.recommendations.push('เตรียมเอกสารการเงินธุรกิจย้อนหลัง 2-3 ปี');
      problems.badIncome.recommendations.push('แสดงหลักฐานความมั่นคงของธุรกิจ');
    }
    if (problems.badIncome.indicators.includes('temporaryEmployment')) {
      problems.badIncome.recommendations.push('หางานประจำที่มั่นคงก่อนสมัครสินเชื่อ');
    }
    if (problems.badIncome.indicators.includes('insufficientIncomeForProperty')) {
      problems.badIncome.recommendations.push('พิจารณาทรัพย์สินที่มีราคาเหมาะสมกับรายได้');
      problems.badIncome.recommendations.push('เพิ่มเงินดาวน์เพื่อลดวงเงินกู้');
    }
  }
  if (problems.badConfidence.severity !== 'none') {
    problems.badConfidence.recommendations.push('สร้างความมั่นใจผ่านการวางแผนการเงิน');
    problems.badConfidence.recommendations.push('ให้คำปรึกษาด้านการเงิน');
  }

  return problems;
};

/** @param {Object} creditAnalysis - Result from interpretCreditScore */
const generateLivNexRecommendations = (creditAnalysis, problems3B) => {
  const recommendations = [];

  if (creditAnalysis.grade === 'HH' || creditAnalysis.grade === 'GG') {
    recommendations.push('ควรเข้าโปรแกรม LivNex ระยะยาว (36 เดือน)');
    recommendations.push('มุ่งเน้นการสร้างประวัติการชำระเงินที่ดี');
  } else if (creditAnalysis.grade === 'FF' || creditAnalysis.grade === 'EE') {
    recommendations.push('เข้าโปรแกรม LivNex ระยะกลาง (24 เดือน)');
    recommendations.push('ปรับปรุงการจัดการหนี้');
  } else {
    recommendations.push('เข้าโปรแกรม LivNex ระยะสั้น (12 เดือน)');
    recommendations.push('รักษาประวัติการชำระเงินที่ดี');
  }

  if (problems3B.badCredit.severity === 'high') {
    recommendations.push('แก้ไขปัญหาบัญชีที่มีปัญหาก่อน');
  }
  if (problems3B.badIncome.severity !== 'none') {
    recommendations.push('เตรียมเอกสารรายได้ที่ชัดเจน');
  }
  if (problems3B.badConfidence.severity !== 'none') {
    recommendations.push('รับคำปรึกษาการเงินเพิ่มเติม');
  }

  return recommendations;
};

/** @param {Object} customerData - Customer data object */
const calculateLivNexCompatibility = (customerData) => {
  const creditAnalysis = interpretCreditScore(customerData.creditScore);
  const accountStatuses = parseAccountStatuses(customerData.accountStatuses);
  const problems3B = classify3BProblems(customerData);

  const excludedStatuses = Object.keys(livnexEligibilityRules.statusExclusions);
  const hasExcludedStatus = accountStatuses.some(status => excludedStatuses.includes(status));

  if (hasExcludedStatus) {
    const excludedStatus = accountStatuses.find(status => excludedStatuses.includes(status));
    const exclusionInfo = livnexEligibilityRules.statusExclusions[excludedStatus];
    return {
      eligible: false, reason: exclusionInfo.reason, action: exclusionInfo.action,
      duration: null, priority: null, creditGrade: creditAnalysis.grade, problems3B
    };
  }

  const status42Count = accountStatuses.filter(status => status === '42').length;
  const hasRecentOverdue = accountStatuses.some(status => ['20', '21', '43'].includes(status));

  let duration = creditAnalysis.livnexDuration;
  let priority = creditAnalysis.priority;
  let specialCase = null;

  if (status42Count > 2) { duration = 24; specialCase = 'multipleStatus42'; }
  if (hasRecentOverdue) { priority = 'critical'; specialCase = 'recentOverdue'; }

  return {
    eligible: true, duration, priority,
    creditGrade: creditAnalysis.grade, creditStatus: creditAnalysis.status,
    specialCase, problems3B,
    recommendations: generateLivNexRecommendations(creditAnalysis, problems3B)
  };
};

/** @param {Object} customer - Customer record */
const hasValidCreditBureauData = (customer) => {
  const hasCreditScore = customer.creditScore && !isNaN(parseFloat(customer.creditScore));
  const hasAccountStatuses = customer.accountStatuses && (
    Array.isArray(customer.accountStatuses) ?
    customer.accountStatuses.length > 0 :
    customer.accountStatuses.trim().length > 0
  );
  const hasPaymentHistory = customer.paymentHistory &&
    customer.paymentHistory !== 'ไม่มีข้อมูล' && customer.paymentHistory.trim().length > 0;
  const hasFinancialStatus = customer.financialStatus &&
    customer.financialStatus !== 'ไม่มีข้อมูล' && customer.financialStatus.trim().length > 0;

  return hasCreditScore || hasAccountStatuses || hasPaymentHistory || hasFinancialStatus;
};

/** @param {Object} customer - Customer record */
const createCreditBureauAnalysis = (customer) => {
  if (!hasValidCreditBureauData(customer)) return null;
  return {
    creditInterpretation: interpretCreditScore(customer.creditScore),
    problems3B: classify3BProblems(customer),
    livnexCompatibility: calculateLivNexCompatibility(customer)
  };
};

module.exports = {
  interpretCreditScore,
  parseAccountStatuses,
  classify3BProblems,
  generateLivNexRecommendations,
  calculateLivNexCompatibility,
  hasValidCreditBureauData,
  createCreditBureauAnalysis
};
