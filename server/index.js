const express = require('express');
const cors = require('cors');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const { 
  initializeDatabase, 
  getCustomerWithDetails, 
  insertCustomerWithDetails, 
  updateCustomerWithDetails, 
  getAllCustomers,
  deleteCustomer,
  getAllBankRules,
  getBankRuleByCode,
  insertBankRule,
  updateBankRule,
  insertReport,
  getReportsByCustomerId
} = require('./database');
const {
  comparePassword,
  generateToken,
  authenticateToken,
  requireRole,
  requireDepartment,
  getUserByUsername,
  getUserById,
  initializeDefaultUsers
} = require('./auth');
const {
  getProblemCategories,
  getProblemDetails,
  getSolution,
  getAllOtherProblems,
  getOtherProblemSolution,
  getAllProblemsFlat
} = require('./problemsData');
const { supabaseCustomerService } = require('./supabaseService');
const { testConnection } = require('./supabaseClient');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Session configuration
app.use(session({
  secret: 'jaidee-session-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Initialize database on startup
initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully');
    // Initialize default users
    return initializeDefaultUsers();
  })
  .then(() => {
    console.log('Default users initialized');
    // Test Supabase connection
    return testConnection();
  })
  .then((connected) => {
    if (connected) {
      console.log('🔗 Supabase connection established');
    } else {
      console.log('⚠️  Supabase connection failed, running in SQLite-only mode');
    }
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

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

// Credit Bureau Analysis System
const creditGradeRanges = {
  'AA': { min: 753, max: 900, status: 'Excellent', livnexDuration: 12, priority: 'standard' },
  'BB': { min: 725, max: 752, status: 'Very Good', livnexDuration: 12, priority: 'standard' },
  'CC': { min: 699, max: 724, status: 'Good', livnexDuration: 12, priority: 'standard' },
  'DD': { min: 681, max: 698, status: 'Fair', livnexDuration: 12, priority: 'standard' },
  'EE': { min: 666, max: 680, status: 'Poor', livnexDuration: 24, priority: 'high' },
  'FF': { min: 646, max: 665, status: 'Very Poor', livnexDuration: 24, priority: 'high' },
  'GG': { min: 616, max: 645, status: 'Bad', livnexDuration: 36, priority: 'critical' },
  'HH': { min: 300, max: 615, status: 'Very Bad', livnexDuration: 36, priority: 'critical' }
};

const accountStatusMapping = {
  '01': { description: 'ปกติ', riskLevel: 'Low', livnexAction: 'eligible', bankApprovalImpact: 'positive' },
  '11': { description: 'ปิดบัญชี', riskLevel: 'Low', livnexAction: 'eligible', bankApprovalImpact: 'neutral' },
  '12': { description: 'ปิดบัญชี (ชำระเต็มจำนวน)', riskLevel: 'Low', livnexAction: 'eligible', bankApprovalImpact: 'positive' },
  '20': { description: 'ค้างชำระ 1-89 วัน', riskLevel: 'Medium', livnexAction: 'eligible_with_plan', bankApprovalImpact: 'negative' },
  '21': { description: 'ค้างชำระ 90-179 วัน', riskLevel: 'High', livnexAction: 'resolve_first', bankApprovalImpact: 'very_negative' },
  '30': { description: 'หนี้สูญ/โอนหนี้', riskLevel: 'Very High', livnexAction: 'wait_legal_resolution', bankApprovalImpact: 'excluded' },
  '31': { description: 'ศาลสั่งชำระ', riskLevel: 'Very High', livnexAction: 'wait_court_payment', bankApprovalImpact: 'excluded' },
  '32': { description: 'ศาลสั่งชำระ (ชำระแล้ว)', riskLevel: 'Medium', livnexAction: 'eligible_with_plan', bankApprovalImpact: 'negative' },
  '33': { description: 'ตั้งหนี้สูญ', riskLevel: 'Very High', livnexAction: 'wait_legal_resolution', bankApprovalImpact: 'excluded' },
  '40': { description: 'ไม่มีข้อมูล', riskLevel: 'Medium', livnexAction: 'case_by_case', bankApprovalImpact: 'neutral' },
  '41': { description: 'กำลังสืบหา', riskLevel: 'High', livnexAction: 'wait_investigation', bankApprovalImpact: 'negative' },
  '42': { description: 'เงินกู้ปกติ', riskLevel: 'Low', livnexAction: 'eligible', bankApprovalImpact: 'positive' },
  '43': { description: 'เงินกู้ค้างชำระ', riskLevel: 'High', livnexAction: 'resolve_first', bankApprovalImpact: 'very_negative' },
  '44': { description: 'เงินกู้หนี้สูญ', riskLevel: 'Very High', livnexAction: 'wait_legal_resolution', bankApprovalImpact: 'excluded' }
};

const livnexEligibilityRules = {
  creditScoreRules: {
    'AA': { eligible: true, duration: 12, priority: 'standard' },
    'BB': { eligible: true, duration: 12, priority: 'standard' },
    'CC': { eligible: true, duration: 12, priority: 'standard' },
    'DD': { eligible: true, duration: 12, priority: 'standard' },
    'EE': { eligible: true, duration: 24, priority: 'high' },
    'FF': { eligible: true, duration: 24, priority: 'high' },
    'GG': { eligible: true, duration: 36, priority: 'critical' },
    'HH': { eligible: true, duration: 36, priority: 'critical' }
  },
  
  statusExclusions: {
    '30': { action: 'wait_legal_resolution', reason: 'หนี้สูญ/โอนหนี้' },
    '31': { action: 'wait_court_payment', reason: 'ศาลสั่งชำระ' },
    '33': { action: 'wait_legal_resolution', reason: 'ตั้งหนี้สูญ' },
    '44': { action: 'wait_legal_resolution', reason: 'เงินกู้หนี้สูญ' }
  },
  
  specialCases: {
    multipleStatus42: { duration: 'extend_to_24_months', reason: 'เงินกู้หลายรายการ' },
    recentOverdue: { action: 'resolve_first', reason: 'มีหนี้ค้างชำระล่าสุด' },
    activeLeasing: { assessment: 'case_by_case', reason: 'มีสัญญาลีสซิ่งที่ยังใช้อยู่' }
  }
};

// Enhanced Bank Matching Rules
const bankMatchingRules = {
  "GSU_BANK": {
    partnership: "LivNex_Primary",
    loanCriteria: {
      minIncome: 15000,
      maxDSR: 60,
      flexibleCredit: true
    },
    rentToOwnTerms: {
      maxLTV: 90,
      preferredInterestRate: 3.5,
      maxTerm: 30,
      specialProgram: "LivNex_GSU_Partnership"
    },
    creditRequirements: {
      minCreditScore: 300, // Very flexible
      livnexBonus: 100,
      excludeStatus: ["30", "31"],
      acceptableGrades: ["AA", "BB", "CC", "DD", "EE", "FF", "GG", "HH"]
    },
    scoring: {
      loanWeight: 0.3,
      rentToOwnWeight: 0.4,
      creditWeight: 0.3
    }
  },
  "GSB": {
    partnership: "Government_Backing",
    loanCriteria: {
      minIncome: 12000,
      maxDSR: 70,
      stableIncome: true
    },
    rentToOwnTerms: {
      maxLTV: 85,
      preferredInterestRate: 4.0,
      maxTerm: 25,
      governmentRate: true
    },
    creditRequirements: {
      minCreditScore: 600,
      livnexBonus: 50,
      excludeStatus: ["20", "30", "31", "33"],
      acceptableGrades: ["AA", "BB", "CC", "DD", "EE"]
    },
    scoring: {
      loanWeight: 0.4,
      rentToOwnWeight: 0.3,
      creditWeight: 0.3
    }
  },
  "KTB": {
    partnership: "Standard_Commercial",
    loanCriteria: {
      minIncome: 20000,
      maxDSR: 50,
      regularEmployee: true
    },
    rentToOwnTerms: {
      maxLTV: 80,
      preferredInterestRate: 4.5,
      maxTerm: 20,
      premiumRate: true
    },
    creditRequirements: {
      minCreditScore: 650,
      livnexBonus: 25,
      excludeStatus: ["20", "30", "31", "33", "42"],
      acceptableGrades: ["AA", "BB", "CC", "DD"]
    },
    scoring: {
      loanWeight: 0.5,
      rentToOwnWeight: 0.3,
      creditWeight: 0.2
    }
  },
  "BBL": {
    partnership: "Premium_Commercial",
    loanCriteria: {
      minIncome: 25000,
      maxDSR: 45,
      regularEmployee: true
    },
    rentToOwnTerms: {
      maxLTV: 75,
      preferredInterestRate: 4.8,
      maxTerm: 20,
      premiumRate: true
    },
    creditRequirements: {
      minCreditScore: 700,
      livnexBonus: 20,
      excludeStatus: ["20", "30", "31", "33", "42"],
      acceptableGrades: ["AA", "BB", "CC"]
    },
    scoring: {
      loanWeight: 0.5,
      rentToOwnWeight: 0.3,
      creditWeight: 0.2
    }
  },
  "KBANK": {
    partnership: "Premium_Commercial",
    loanCriteria: {
      minIncome: 25000,
      maxDSR: 45,
      regularEmployee: true
    },
    rentToOwnTerms: {
      maxLTV: 75,
      preferredInterestRate: 4.7,
      maxTerm: 20,
      premiumRate: true
    },
    creditRequirements: {
      minCreditScore: 700,
      livnexBonus: 20,
      excludeStatus: ["20", "30", "31", "33", "42"],
      acceptableGrades: ["AA", "BB", "CC"]
    },
    scoring: {
      loanWeight: 0.5,
      rentToOwnWeight: 0.3,
      creditWeight: 0.2
    }
  }
};

// Credit Bureau Analysis Functions
const interpretCreditScore = (score) => {
  const creditScore = parseFloat(score) || null;
  
  // Return null interpretation if no score available
  if (creditScore === null || isNaN(creditScore)) {
    return {
      score: null,
      grade: null,
      status: 'ไม่มีข้อมูล',
      livnexDuration: null,
      priority: 'unknown'
    };
  }
  
  for (const [grade, range] of Object.entries(creditGradeRanges)) {
    if (creditScore >= range.min && creditScore <= range.max) {
      return {
        score: creditScore,
        grade: grade,
        status: range.status,
        livnexDuration: range.livnexDuration,
        priority: range.priority
      };
    }
  }
  
  // Default to HH if score is too low
  return {
    score: creditScore,
    grade: 'HH',
    status: 'Very Bad',
    livnexDuration: 36,
    priority: 'critical'
  };
};

const classify3BProblems = (customerData) => {
  const creditScore = parseFloat(customerData.creditScore) || null;
  const accountStatuses = customerData.accountStatuses ? 
    (Array.isArray(customerData.accountStatuses) ? 
      customerData.accountStatuses : 
      customerData.accountStatuses.split(',').map(s => s.trim()).filter(s => s)) : [];
  const paymentHistory = customerData.paymentHistory || 'ไม่มีข้อมูล';
  const financialStatus = customerData.financialStatus || 'ไม่มีข้อมูล';
  
  const problems = {
    badCredit: {
      indicators: [],
      severity: 'none',
      recommendations: []
    },
    badIncome: {
      indicators: [],
      severity: 'none',
      recommendations: []
    },
    badConfidence: {
      indicators: [],
      severity: 'none',
      recommendations: []
    }
  };
  
  // Bad Credit Analysis
  if (creditScore !== null && !isNaN(creditScore) && creditScore < 680) {
    problems.badCredit.indicators.push('creditScore < 680');
    problems.badCredit.severity = creditScore < 600 ? 'high' : 'medium';
  }
  
  // Check for problematic account statuses
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
  
  // 1. Income Level Analysis
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
  
  // 2. Debt-to-Income Ratio Analysis
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
  
  // 3. Employment Stability Analysis
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
  
  // 4. Job Position Analysis
  if (position && (position.includes('ชั่วคราว') || position.includes('สัญญาจ้าง') || 
                   position.includes('พาร์ทไทม์') || position.includes('ลูกจ้างรายวัน'))) {
    problems.badIncome.indicators.push('temporaryEmployment');
    problems.badIncome.severity = problems.badIncome.severity === 'high' ? 'high' : 'medium';
  }
  
  // 5. Income Adequacy for Property Purchase
  const propertyValue = parseFloat(customerData.propertyValue) || 0;
  if (propertyValue > 0 && income > 0) {
    const incomeToPropertyRatio = (income * 12) / propertyValue;
    if (incomeToPropertyRatio < 0.15) { // รายได้ต่อปีน้อยกว่า 15% ของมูลค่าทรัพย์
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
    // General recommendations
    problems.badIncome.recommendations.push('จัดเตรียมเอกสารรายได้ที่ชัดเจนและครบถ้วน');
    
    // Specific recommendations based on indicators
    if (problems.badIncome.indicators.includes('criticallyLowIncome') || 
        problems.badIncome.indicators.includes('lowIncome')) {
      problems.badIncome.recommendations.push('หาแหล่งรายได้เสริมหรือเพิ่มรายได้หลัก');
      problems.badIncome.recommendations.push('พิจารณาพักการสมัครสินเชื่อจนกว่ารายได้จะเพิ่มขึ้น');
    }
    
    if (problems.badIncome.indicators.includes('excessiveDebtBurden') || 
        problems.badIncome.indicators.includes('highDebtBurden')) {
      problems.badIncome.recommendations.push('ลดภาระหนี้ให้อยู่ในระดับที่เหมาะสม (DSR < 60%)');
      problems.badIncome.recommendations.push('ปรับโครงสร้างหนี้หรือรวมหนี้');
    }
    
    if (problems.badIncome.indicators.includes('unstableIncomeSource') || 
        problems.badIncome.indicators.includes('privateBusinessOwner')) {
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

const calculateLivNexCompatibility = (customerData) => {
  const creditAnalysis = interpretCreditScore(customerData.creditScore);
  const accountStatuses = customerData.accountStatuses ? 
    (Array.isArray(customerData.accountStatuses) ? 
      customerData.accountStatuses : 
      customerData.accountStatuses.split(',').map(s => s.trim()).filter(s => s)) : [];
  const problems3B = classify3BProblems(customerData);
  
  // Check for exclusions
  const excludedStatuses = Object.keys(livnexEligibilityRules.statusExclusions);
  const hasExcludedStatus = accountStatuses.some(status => excludedStatuses.includes(status));
  
  if (hasExcludedStatus) {
    const excludedStatus = accountStatuses.find(status => excludedStatuses.includes(status));
    const exclusionInfo = livnexEligibilityRules.statusExclusions[excludedStatus];
    
    return {
      eligible: false,
      reason: exclusionInfo.reason,
      action: exclusionInfo.action,
      duration: null,
      priority: null,
      creditGrade: creditAnalysis.grade,
      problems3B: problems3B
    };
  }
  
  // Check for special cases
  const status42Count = accountStatuses.filter(status => status === '42').length;
  const hasRecentOverdue = accountStatuses.some(status => ['20', '21', '43'].includes(status));
  
  let duration = creditAnalysis.livnexDuration;
  let priority = creditAnalysis.priority;
  let specialCase = null;
  
  if (status42Count > 2) {
    duration = 24;
    specialCase = 'multipleStatus42';
  }
  
  if (hasRecentOverdue) {
    priority = 'critical';
    specialCase = 'recentOverdue';
  }
  
  return {
    eligible: true,
    duration: duration,
    priority: priority,
    creditGrade: creditAnalysis.grade,
    creditStatus: creditAnalysis.status,
    specialCase: specialCase,
    problems3B: problems3B,
    recommendations: generateLivNexRecommendations(creditAnalysis, problems3B)
  };
};

const generateLivNexRecommendations = (creditAnalysis, problems3B) => {
  const recommendations = [];
  
  // Credit-based recommendations
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
  
  // 3B-based recommendations
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

const calculateBankMatchingWithCreditBureau = async (customerData) => {
  const livnexCompatibility = calculateLivNexCompatibility(customerData);
  const enhancedBankMatching = await calculateEnhancedBankMatching(customerData);
  
  // Adjust bank matching based on credit bureau analysis
  Object.keys(enhancedBankMatching).forEach(bankName => {
    const bankData = enhancedBankMatching[bankName];
    
    // Apply credit bureau adjustments
    if (!livnexCompatibility.eligible) {
      bankData.eligibility = 'not_eligible';
      bankData.reason = livnexCompatibility.reason;
      bankData.totalScore = Math.max(0, bankData.totalScore - 50);
    } else if (livnexCompatibility.problems3B.badCredit.severity === 'high') {
      bankData.totalScore = Math.max(0, bankData.totalScore - 20);
      bankData.approvalProbability = calculateApprovalProbability(bankData.totalScore);
    }
    
    // Add credit bureau insights
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

const calculateApprovalProbability = (totalScore) => {
  if (totalScore >= 80) return 'สูงมาก';
  if (totalScore >= 65) return 'สูง';
  if (totalScore >= 50) return 'ปานกลาง';
  if (totalScore >= 35) return 'ต่ำ';
  return 'ต่ำมาก';
};

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
    financialStatus: financialStatus,
    actionPlanProgress: Math.round(actionPlanProgress),
    paymentHistory: customerData.paymentHistory || 'ไม่มีข้อมูล',
  };
};

const calculateLoanEstimationAllBanks = (income, currentDebt, propertyPrice, discount, ltv) => {
  const allBanksResults = {};
  const loanTerms = [40, 30, 20, 10];
  const debtReductionSteps = [0, -0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.7, -1]; // -1 represents "ไม่มีหนี้"

  const propertyAfterDiscount = (parseFloat(propertyPrice) || 0) - (parseFloat(discount) || 0);
  let ltvValue = parseFloat(ltv) || 1.0;
  let ltvLimit;
  
  // ตีความค่า LTV ตามหลักการที่ถูกต้อง:
  // 1 = 100% (บ้านหลังที่ 1)
  // 0.9 = 90% (บ้านหลังที่ 2 มากกว่า 2 ปี)
  // 0.8 = 80% (บ้านหลังที่ 2 น้อยกว่า 2 ปี)  
  // 0.7 = 70% (บ้านหลังที่ 3+)
  if (ltvValue >= 0.5 && ltvValue <= 1.0) {
    // ค่าระหว่าง 0.5-1.0 ถือว่าเป็นเปอร์เซ็นต์ในรูป decimal
    ltvLimit = propertyAfterDiscount * ltvValue;
  } else if (ltvValue > 1 && ltvValue <= 100) {
    // ค่ามากกว่า 1 แต่ไม่เกิน 100 ถือว่าเป็นเปอร์เซ็นต์
    ltvLimit = propertyAfterDiscount * (ltvValue / 100);
  } else {
    // ค่าผิดปกติ ใช้ค่าเริ่มต้น 100%
    ltvLimit = propertyAfterDiscount * 1.0;
  }

  // Calculate for all banks
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

const calculateLoanEstimation = (income, currentDebt, propertyPrice, discount, ltv, targetBank) => {
  const results = [];
  const loanTerms = [40, 30, 20, 10];
  const debtReductionSteps = [0, -0.1, -0.2, -0.3, -0.4, -0.5, -0.6, -0.7, -1]; // -1 represents "ไม่มีหนี้"

  const propertyAfterDiscount = (parseFloat(propertyPrice) || 0) - (parseFloat(discount) || 0);
  let ltvValue = parseFloat(ltv) || 1.0;
  let ltvLimit;
  
  // ตีความค่า LTV ตามหลักการที่ถูกต้อง:
  // 1 = 100% (บ้านหลังที่ 1)
  // 0.9 = 90% (บ้านหลังที่ 2 มากกว่า 2 ปี)
  // 0.8 = 80% (บ้านหลังที่ 2 น้อยกว่า 2 ปี)  
  // 0.7 = 70% (บ้านหลังที่ 3+)
  if (ltvValue >= 0.5 && ltvValue <= 1.0) {
    // ค่าระหว่าง 0.5-1.0 ถือว่าเป็นเปอร์เซ็นต์ในรูป decimal
    ltvLimit = propertyAfterDiscount * ltvValue;
  } else if (ltvValue > 1 && ltvValue <= 100) {
    // ค่ามากกว่า 1 แต่ไม่เกิน 100 ถือว่าเป็นเปอร์เซ็นต์
    ltvLimit = propertyAfterDiscount * (ltvValue / 100);
  } else {
    // ค่าผิดปกติ ใช้ค่าเริ่มต้น 100%
    ltvLimit = propertyAfterDiscount * 1.0;
  }

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

// Helper function to check if customer has valid credit bureau data
const hasValidCreditBureauData = (customer) => {
  const hasCreditScore = customer.creditScore && !isNaN(parseFloat(customer.creditScore));
  const hasAccountStatuses = customer.accountStatuses && (
    Array.isArray(customer.accountStatuses) ? 
    customer.accountStatuses.length > 0 : 
    customer.accountStatuses.trim().length > 0
  );
  const hasPaymentHistory = customer.paymentHistory && 
    customer.paymentHistory !== 'ไม่มีข้อมูล' && 
    customer.paymentHistory.trim().length > 0;
  const hasFinancialStatus = customer.financialStatus && 
    customer.financialStatus !== 'ไม่มีข้อมูล' && 
    customer.financialStatus.trim().length > 0;
  
  return hasCreditScore || hasAccountStatuses || hasPaymentHistory || hasFinancialStatus;
};

// Updated function to create credit bureau analysis only when data exists
const createCreditBureauAnalysis = (customer) => {
  if (!hasValidCreditBureauData(customer)) {
    return null;
  }
  
  return {
    creditInterpretation: interpretCreditScore(customer.creditScore),
    problems3B: classify3BProblems(customer),
    livnexCompatibility: calculateLivNexCompatibility(customer)
  };
};

// Enhanced Bank Matching Algorithm - Updated to use database
const calculateEnhancedBankMatching = async (customerData) => {
  try {
    // Get all active bank rules from database
    const bankRules = await getAllBankRules();
    const bankResults = {};
  
  // Helper functions for scoring

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
      // Optimal age range gets full points
      const ageRange = bankCriteria.ageMax - bankCriteria.ageMin;
      const agePosition = (age - bankCriteria.ageMin) / ageRange;
      // Peak score at middle age range
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
    let ltvValue = parseFloat(customerData.ltv) || 1.0;
    
    // แปลง LTV ของลูกค้าให้เป็นทศนิยมเพื่อเปรียบเทียบกับ bankCriteria.maxLTV
    let customerLtvDecimal;
    if (ltvValue >= 0.5 && ltvValue <= 1.0) {
      customerLtvDecimal = ltvValue;
    } else if (ltvValue > 1 && ltvValue <= 100) {
      customerLtvDecimal = ltvValue / 100;
    } else {
      customerLtvDecimal = 1.0;
    }
    
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
      if (affordabilityRatio <= 30) {
        score += 40;
      } else if (affordabilityRatio <= 40) {
        score += 25;
      } else if (affordabilityRatio <= 50) {
        score += 10;
      }
    }
    
    // Property Value Score (0-30 points)
    if (propertyValue >= 1000000) {
      score += 30;
    } else if (propertyValue >= 500000) {
      score += 20;
    } else if (propertyValue >= 200000) {
      score += 10;
    }
    
    return Math.min(100, score);
  };
  
  const calculateCreditBureauScore = (customerData, bankCriteria) => {
    // Use enhanced credit scoring with Credit Bureau data
    const creditScore = parseFloat(customerData.creditScore) || null;
    const financialStatus = customerData.financialStatus || 'ไม่มีข้อมูล';
    const livnexCompleted = customerData.livnexCompleted || false;
    const accountStatuses = customerData.accountStatuses ? 
      (Array.isArray(customerData.accountStatuses) ? 
        customerData.accountStatuses : 
        customerData.accountStatuses.split(',').map(s => s.trim()).filter(s => s)) : [];
    
    let score = 0;
    
    // Credit Score (0-50 points)
    if (creditScore !== null && !isNaN(creditScore)) {
      if (creditScore >= bankCriteria.minCreditScore) {
        // Progressive scoring based on credit score ranges
        if (creditScore >= 750) {
          score += 50;
        } else if (creditScore >= 700) {
          score += 45;
        } else if (creditScore >= 650) {
          score += 40;
        } else if (creditScore >= 600) {
          score += 30;
        } else {
          score += 20;
        }
      } else {
        // Penalty for below minimum credit score
        score += Math.max(0, 10 - ((bankCriteria.minCreditScore - creditScore) / 10));
      }
    } else {
      // No credit score available - neutral scoring
      score += 25; // Give a neutral score when no data is available
    }
    
    // Account Status Penalty/Bonus (0-25 points)
    let statusScore = 25;
    accountStatuses.forEach(status => {
      if (['30', '31', '33', '44'].includes(status)) {
        statusScore -= 10; // Heavy penalty for bad statuses
      } else if (['20', '21', '43'].includes(status)) {
        statusScore -= 5; // Medium penalty for overdue
      } else if (['01', '11', '12', '42'].includes(status)) {
        statusScore = Math.max(statusScore, 20); // Good status maintains score
      }
    });
    score += Math.max(0, statusScore);
    
    // Financial Status Score (0-15 points)
    if (financialStatus === 'ดีเยี่ยม') {
      score += 15;
    } else if (financialStatus === 'เฝ้าระวัง') {
      score += 10;
    } else if (financialStatus === 'ต้องปรับปรุง') {
      score += 5;
    }
    
    // LivNex Bonus (0-10 points)
    if (livnexCompleted) {
      score += Math.min(10, bankCriteria.livnexBonus / 10);
    }
    
    return Math.min(100, score);
  };
  
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
    } else {
      return totalScore >= 70 ? '7-14 วัน' : '14-30 วัน';
    }
  };
  
    // Calculate for each bank from database
    bankRules.forEach(bankRule => {
      // Map database fields to expected format using actual bank data
      const loanCriteria = {
        minIncome: bankRule.min_income || 12000, // Use actual minimum income from database
        maxDSR: (bankRule.dsr_high || bankRule.dsr_low) * 100, // Convert to percentage
        stableIncome: bankRule.partnership_type !== 'LivNex_Primary',
        ageMin: bankRule.age_min || 18,
        ageMax: bankRule.age_max || 65,
        maxTerm: bankRule.max_term || 30
      };
      
      const rentToOwnTerms = {
        maxLTV: parseFloat(bankRule.max_ltv_rent_to_own) || 80, // เก็บเป็นเปอร์เซ็นต์ตามฐานข้อมูล
        maxLTVDecimal: (parseFloat(bankRule.max_ltv_rent_to_own) || 80) / 100, // แปลงเป็นทศนิยมสำหรับการคำนวณ
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
      
      // Calculate weighted total score
      const totalScore = (
        loanBandScore * scoring.loanWeight +
        rentToOwnScore * scoring.rentToOwnWeight +
        creditBureauScore * scoring.creditWeight
      );
      
      // Determine eligibility - ต้องผ่านทั้ง totalScore และเงื่อนไขสำคัญ
      const basicEligible = totalScore >= 40; // Minimum threshold
      
      // ตรวจสอบเงื่อนไขสำคัญ (DSR, LTV, Age)
      const income = parseFloat(customerData.income) || 0;
      const debt = parseFloat(customerData.debt) || 0;
      const age = parseInt(customerData.age) || 0;
      const ltvValue = parseFloat(customerData.ltv) || 1.0;
      
      let dsrPassed = true;
      if (income > 0) {
        const dsr = (debt / income) * 100;
        const dsrHigh = (parseFloat(bankRule.dsr_high) || 0.5) * 100;
        dsrPassed = dsr <= dsrHigh;
      }
      
      let ltvPassed = true;
      let customerLtvDecimal;
      if (ltvValue >= 0.5 && ltvValue <= 1.0) {
        customerLtvDecimal = ltvValue;
      } else if (ltvValue > 1 && ltvValue <= 100) {
        customerLtvDecimal = ltvValue / 100;
      } else {
        customerLtvDecimal = 1.0;
      }
      const maxLtvDecimal = parseFloat(bankRule.ltv_type1) || 0.9;
      ltvPassed = customerLtvDecimal <= maxLtvDecimal;
      
      const agePassed = age >= (bankRule.age_min || 18) && age <= (bankRule.age_max || 65);
      
      const isEligible = basicEligible && dsrPassed && ltvPassed && agePassed;
      
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
          maxLTV: Math.round(rentToOwnTerms.maxLTV), // ใช้ค่าเปอร์เซ็นต์ตรงจากฐานข้อมูล
          maxTerm: rentToOwnTerms.maxTerm,
          dsrHigh: parseFloat(bankRule.dsr_high) || 0.5,
          dsrLow: parseFloat(bankRule.dsr_low) || 0.5,
          ageRange: `${bankRule.age_min || 18}-${bankRule.age_max || 65}`,
          ltvType1: parseFloat(bankRule.ltv_type1) || 0.9,
          ltvType2Over2Years: parseFloat(bankRule.ltv_type2_over_2years) || 0.8,
          ltvType2Under2Years: parseFloat(bankRule.ltv_type2_under_2years) || 0.7,
          ltvType3: parseFloat(bankRule.ltv_type3) || 0.6
        },
        
        // Add customer DSR/LTV analysis
        customerAnalysis: {
          currentDSR: (() => {
            const income = parseFloat(customerData.income) || 0;
            const debt = parseFloat(customerData.debt) || 0;
            if (income === 0) return 'N/A';
            return ((debt / income) * 100).toFixed(1);
          })(),
          requestedLTV: (() => {
            const ltvValue = parseFloat(customerData.ltv) || 1.0;
            if (ltvValue >= 0.5 && ltvValue <= 1.0) {
              return Math.round(ltvValue * 100);
            } else if (ltvValue > 1 && ltvValue <= 100) {
              return Math.round(ltvValue);
            } else {
              return 100;
            }
          })(),
          customerAge: parseInt(customerData.age) || 0,
          dsrStatus: (() => {
            const income = parseFloat(customerData.income) || 0;
            const debt = parseFloat(customerData.debt) || 0;
            if (income === 0) return 'ไม่สามารถคำนวณได้';
            const dsr = (debt / income) * 100;
            const dsrHigh = (parseFloat(bankRule.dsr_high) || 0.5) * 100;
            const dsrLow = (parseFloat(bankRule.dsr_low) || 0.5) * 100;
            if (dsr <= dsrLow) return 'ผ่านเกณฑ์ (DSR ต่ำ)';
            if (dsr <= dsrHigh) return 'ผ่านเกณฑ์ (DSR สูง)';
            return 'ไม่ผ่านเกณฑ์';
          })(),
          ltvStatus: (() => {
            const ltvValue = parseFloat(customerData.ltv) || 1.0;
            let customerLtvDecimal;
            if (ltvValue >= 0.5 && ltvValue <= 1.0) {
              customerLtvDecimal = ltvValue;
            } else if (ltvValue > 1 && ltvValue <= 100) {
              customerLtvDecimal = ltvValue / 100;
            } else {
              customerLtvDecimal = 1.0;
            }
            
            const maxLtvDecimal = parseFloat(bankRule.ltv_type1) || 0.9;
            if (ltvValue === 0) return 'ไม่มีข้อมูล';
            if (customerLtvDecimal <= maxLtvDecimal) return 'ผ่านเกณฑ์';
            return 'ไม่ผ่านเกณฑ์';
          })(),
          ageStatus: (() => {
            const age = parseInt(customerData.age) || 0;
            const ageMin = bankRule.age_min || 18;
            const ageMax = bankRule.age_max || 65;
            if (age === 0) return 'ไม่มีข้อมูล';
            if (age >= ageMin && age <= ageMax) return 'ผ่านเกณฑ์';
            return 'ไม่ผ่านเกณฑ์';
          })()
        },
        partnership: bankRule.partnership_type,
        bankName: bankRule.bank_name,
        creditBureauInsights: {
          creditGrade: interpretCreditScore(customerData.creditScore).grade,
          creditStatus: interpretCreditScore(customerData.creditScore).status,
          livnexRecommendation: `${interpretCreditScore(customerData.creditScore).livnexDuration} เดือน (${interpretCreditScore(customerData.creditScore).priority})`,
          problems3B: classify3BProblems(customerData)
        }
      };
    });
    
    // Sort by total score (highest first) and show top 4 banks
    let sortedResults = Object.entries(bankResults)
      .sort((a, b) => b[1].totalScore - a[1].totalScore)
      .slice(0, 4) // Show top 4 banks
      .reduce((acc, [bank, data]) => {
        acc[bank] = data;
        return acc;
      }, {});
    
    // Always include target bank if it exists and not already in results
    if (customerData.targetBank && bankResults[customerData.targetBank] && !sortedResults[customerData.targetBank]) {
      sortedResults[customerData.targetBank] = bankResults[customerData.targetBank];
    }
    
    return sortedResults;
  } catch (error) {
    // Return empty results if database query fails
    return {};
  }
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
  const transferYear = parseInt(data.transferYear) || 1;

  // Step 1: Pre-Calculation
  const propertyAfterDiscount = propertyPrice - discount;
  
  // Validation: Ensure propertyAfterDiscount is positive
  if (propertyAfterDiscount <= 0) {
    return {
      error: true,
      message: 'Property price after discount must be greater than 0',
      propertyAfterDiscount: propertyAfterDiscount,
      amortizationTable: []
    };
  }
  
  const rawMonthlyRent = (propertyAfterDiscount * rentRatePerMillion) / 1000000;
  const monthlyRent = Math.ceil(rawMonthlyRent / 100) * 100; // Round up to nearest hundred

  const guarantee = monthlyRent * guaranteeMultiplier;
  const prepaidRent = monthlyRent * prepaidMultiplier;
  const totalRequired = guarantee + prepaidRent;
  const initialPayment = Math.max(0, totalRequired - overpaidRent); // Ensure payment is not negative
  const actualOverpayment = Math.max(0, overpaidRent - totalRequired); // Calculate actual overpayment

  // Step 2: Initialize Result Array
  const amortizationTable = [];
  let remainingPrincipal = propertyAfterDiscount;

  // Step 3: Loop to Build Table
  for (let month = 1; month <= installmentMonths; month++) {
    let payment, interest, principalPaid;

    if (month === 1) {
      payment = Math.max(initialPayment, 0); // ชำระเพิ่มเติมในงวดแรก (หากมี)
      interest = 0; // งวดแรกยังไม่มีดอกเบี้ย
      
      // คำนวณเงินต้นที่จ่ายในงวดแรก
      // เงินต้น = จำนวนที่จ่ายจริงทั้งหมด - ค่าประกัน - ค่าเช่าล่วงหน้า
      const totalAmountPaid = initialPayment + overpaidRent;
      principalPaid = totalAmountPaid - guarantee - prepaidRent;
      
      // ตรวจสอบให้แน่ใจว่า principalPaid ไม่เป็นค่าติดลบ
      principalPaid = Math.max(0, principalPaid);
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
        // สิ้นงวด rows should show only interest payment, no principal payment
        const principalFinal = 0; // No principal payment in end-of-period summary
        const remainingFinal = previousRemaining; // Principal remains the same

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
  const additionalPayment = initialPayment; // Use the corrected initialPayment instead
  
  // Calculate transfer fee based on transfer year
  let transferFeeRate = 0;
  if (transferYear === 1) {
    transferFeeRate = 0.01; // 1%
  } else if (transferYear === 2) {
    transferFeeRate = 0.015; // 1.5%
  } else if (transferYear === 3) {
    transferFeeRate = 0.02; // 2%
  }
  const transferFee = Math.max(0, propertyAfterDiscount * transferFeeRate); // Ensure positive value
  
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

// ===============================
// AUTHENTICATION ROUTES
// ===============================

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Get user from database
    const user = await getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Generate token
    const token = generateToken(user);

    // Return user info and token
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        department: user.department
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user endpoint
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role,
        department: user.department
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, (req, res) => {
  // For JWT, we can't really "logout" server-side
  // The client should remove the token
  res.json({ message: 'Logout successful' });
});

// ===============================
// CUSTOMER ROUTES (Protected)
// ===============================

app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const customers = await getAllCustomers();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customers', error: error.message });
  }
});

// API endpoint สำหรับบันทึกรายงาน
app.post('/api/reports', authenticateToken, async (req, res) => {
  try {
    
    const reportData = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!reportData.customerId || !reportData.customerName) {
      return res.status(400).json({
        message: 'Missing required fields: customerId and customerName'
      });
    }
    
    // บันทึกรายงานลงฐานข้อมูล
    const reportId = await insertReport(reportData);
    
    
    res.status(201).json({ 
      message: 'Report saved successfully', 
      reportId: reportId 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error saving report', 
      error: error.message 
    });
  }
});

// API endpoint สำหรับดึงข้อมูลรายงานที่บันทึกไว้
app.get('/api/reports/:customerId', authenticateToken, async (req, res) => {
  try {
    
    const customerId = parseInt(req.params.customerId);
    
    // ดึงข้อมูลรายงานที่บันทึกไว้
    const reports = await getReportsByCustomerId(customerId);
    
    
    res.json(reports);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching reports', 
      error: error.message 
    });
  }
});

app.get('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    const customer = await getCustomerWithDetails(customerId);
    
    if (customer) {
      // Calculate loan estimations for all banks
      const propertyPrice = parseFloat(customer.propertyPrice) || parseFloat(customer.propertyValue) || 0;
      const loanEstimation = calculateLoanEstimation(
        parseFloat(customer.income) || 0,
        parseFloat(customer.debt) || 0,
        propertyPrice,
        parseFloat(customer.discount) || 0,
        parseFloat(customer.ltv) || 0,
        customer.targetBank || 'KTB'
      );
      const allBanksLoanEstimation = calculateLoanEstimationAllBanks(
        parseFloat(customer.income) || 0,
        parseFloat(customer.debt) || 0,
        propertyPrice,
        parseFloat(customer.discount) || 0,
        parseFloat(customer.ltv) || 0
      );
      const enhancedBankMatching = await calculateBankMatchingWithCreditBureau(customer);
      const creditBureauAnalysis = createCreditBureauAnalysis(customer);
      const rentToOwnEstimation = calculateRentToOwnEstimation(
        parseFloat(customer.rentToOwnValue) || 0,
        parseFloat(customer.monthlyRentToOwnRate) || 0
      );
      const detailedRentToOwnEstimation = calculateRentToOwnAmortizationTable(customer);
      
      // Add calculated data
      customer.loanEstimation = loanEstimation;
      customer.allBanksLoanEstimation = allBanksLoanEstimation;
      customer.enhancedBankMatching = enhancedBankMatching;
      customer.creditBureauAnalysis = creditBureauAnalysis;
      customer.rentToOwnEstimation = rentToOwnEstimation;
      customer.detailedRentToOwnEstimation = detailedRentToOwnEstimation;
      
      res.json(customer);
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching customer', error: error.message });
  }
});

app.post('/api/customers', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  try {
    const kpis = calculateKPIs(req.body);
    const loanEstimation = calculateLoanEstimation(
      parseFloat(req.body.income) || 0,
      parseFloat(req.body.debt) || 0,
      parseFloat(req.body.propertyPrice) || 0,
      parseFloat(req.body.discount) || 0,
      parseFloat(req.body.ltv) || 0,
      req.body.targetBank || 'KTB'
    );
    const allBanksLoanEstimation = calculateLoanEstimationAllBanks(
      parseFloat(req.body.income) || 0,
      parseFloat(req.body.debt) || 0,
      parseFloat(req.body.propertyPrice) || 0,
      parseFloat(req.body.discount) || 0,
      parseFloat(req.body.ltv) || 0
    );
    const enhancedBankMatching = await calculateBankMatchingWithCreditBureau(req.body);
    const creditBureauAnalysis = createCreditBureauAnalysis(req.body);
    const rentToOwnEstimation = calculateRentToOwnEstimation(
      parseFloat(req.body.rentToOwnValue) || 0,
      parseFloat(req.body.monthlyRentToOwnRate) || 0
    );
    const detailedRentToOwnEstimation = calculateRentToOwnAmortizationTable(req.body);
    
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
    
    // Add calculated data that's not stored in DB
    newCustomer.loanEstimation = loanEstimation;
    newCustomer.allBanksLoanEstimation = allBanksLoanEstimation;
    newCustomer.enhancedBankMatching = enhancedBankMatching;
    newCustomer.creditBureauAnalysis = creditBureauAnalysis;
    newCustomer.rentToOwnEstimation = rentToOwnEstimation;
    newCustomer.detailedRentToOwnEstimation = detailedRentToOwnEstimation;
    
    res.status(201).json({ message: 'Customer added successfully', customer: newCustomer });
  } catch (error) {
    res.status(500).json({ message: 'Error adding customer', error: error.message });
  }
});

app.put('/api/customers/:id', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  try {
    const customerId = parseInt(req.params.id);
    
    // Check if customer exists
    const existingCustomer = await getCustomerWithDetails(customerId);
    if (!existingCustomer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const updatedCustomerData = { ...existingCustomer, ...req.body };
    const kpis = calculateKPIs(updatedCustomerData);
    const loanEstimation = calculateLoanEstimation(
      parseFloat(updatedCustomerData.income) || 0,
      parseFloat(updatedCustomerData.debt) || 0,
      parseFloat(updatedCustomerData.propertyPrice) || 0,
      parseFloat(updatedCustomerData.discount) || 0,
      parseFloat(updatedCustomerData.ltv) || 0,
      updatedCustomerData.targetBank || 'KTB'
    );
    const allBanksLoanEstimation = calculateLoanEstimationAllBanks(
      parseFloat(updatedCustomerData.income) || 0,
      parseFloat(updatedCustomerData.debt) || 0,
      parseFloat(updatedCustomerData.propertyPrice) || 0,
      parseFloat(updatedCustomerData.discount) || 0,
      parseFloat(updatedCustomerData.ltv) || 0
    );
    const enhancedBankMatching = await calculateBankMatchingWithCreditBureau(updatedCustomerData);
    const creditBureauAnalysis = createCreditBureauAnalysis(updatedCustomerData);
    const rentToOwnEstimation = calculateRentToOwnEstimation(
      parseFloat(updatedCustomerData.rentToOwnValue) || 0,
      parseFloat(updatedCustomerData.monthlyRentToOwnRate) || 0
    );
    const detailedRentToOwnEstimation = calculateRentToOwnAmortizationTable(updatedCustomerData);
    
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
    
    // Add calculated data that's not stored in DB
    updatedCustomer.loanEstimation = loanEstimation;
    updatedCustomer.allBanksLoanEstimation = allBanksLoanEstimation;
    updatedCustomer.enhancedBankMatching = enhancedBankMatching;
    updatedCustomer.creditBureauAnalysis = creditBureauAnalysis;
    updatedCustomer.rentToOwnEstimation = rentToOwnEstimation;
    updatedCustomer.detailedRentToOwnEstimation = detailedRentToOwnEstimation;
    
    res.json({ message: 'Customer updated successfully', customer: updatedCustomer });
  } catch (error) {
    res.status(500).json({ message: 'Error updating customer', error: error.message });
  }
});

// Bank Rules API Endpoints
app.get('/api/bank-rules', authenticateToken, async (req, res) => {
  try {
    const bankRules = await getAllBankRules();
    res.json(bankRules);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bank rules', error: error.message });
  }
});

app.get('/api/bank-rules/:bankCode', authenticateToken, async (req, res) => {
  try {
    const bankCode = req.params.bankCode.toUpperCase();
    const bankRule = await getBankRuleByCode(bankCode);
    
    if (!bankRule) {
      return res.status(404).json({ message: 'Bank rule not found' });
    }
    
    res.json(bankRule);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bank rule', error: error.message });
  }
});

app.post('/api/bank-rules', async (req, res) => {
  try {
    const bankRuleId = await insertBankRule(req.body);
    const newBankRule = await getBankRuleByCode(req.body.bank_code);
    
    res.status(201).json({ 
      message: 'Bank rule added successfully', 
      bankRule: newBankRule,
      id: bankRuleId 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding bank rule', error: error.message });
  }
});

app.put('/api/bank-rules/:bankCode', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const bankCode = req.params.bankCode.toUpperCase();
    
    // Check if bank rule exists
    const existingBankRule = await getBankRuleByCode(bankCode);
    if (!existingBankRule) {
      return res.status(404).json({ message: 'Bank rule not found' });
    }

    const success = await updateBankRule(bankCode, req.body);
    if (!success) {
      return res.status(400).json({ message: 'Failed to update bank rule' });
    }
    
    const updatedBankRule = await getBankRuleByCode(bankCode);
    res.json({ 
      message: 'Bank rule updated successfully', 
      bankRule: updatedBankRule 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating bank rule', error: error.message });
  }
});

// CSV Import Functions
const parseCSVProblems = (problemsData) => {
  const problems = [];
  for (let i = 1; i <= 6; i++) {
    const problem = problemsData[`ปัญหาที่ทำให้ขอสินเชื่อไม่ได้ ปัญหาที่ ${i}`];
    if (problem && problem.trim() && problem.trim() !== '') {
      problems.push(problem.trim());
    }
  }
  return problems;
};

const parseCSVActionPlans = (actionPlansData) => {
  const plans = [];
  for (let i = 1; i <= 6; i++) {
    const planNote = actionPlansData[`แผนแกเคส รายการที่ ${i}`];
    if (planNote && planNote.trim() && planNote.trim() !== '') {
      plans.push(planNote.trim());
    }
  }
  return plans;
};

const convertCSVToCustomerData = (csvRow) => {
  // Parse basic information
  const basicData = {
    date: csvRow['วันที่ CA'] || new Date().toISOString().split('T')[0],
    name: `${csvRow['คำนำหน้า'] || ''} ${csvRow['ชื่อ'] || ''} ${csvRow['สกุล'] || ''}`.trim(),
    age: parseInt(csvRow['อายุ']) || null,
    phone: csvRow['เบอร์โทร'] || '',
    job: csvRow['อาชีพ'] || '',
    position: csvRow['ตำแหน่ง'] || '',
    businessOwnerType: csvRow['เจ้าของธุรกิจ'] ? 'เจ้าของธุรกิจ' : 'ไม่ใช่เจ้าของธุรกิจ',
    privateBusinessType: csvRow['เจ้าของธุรกิจ'] || '',
    projectName: csvRow['โครงการ'] || '',
    unit: csvRow['เลขห้อง'] || '',
    propertyValue: parseFloat(csvRow['มูลค่าเช่าออม']) || 0,
    monthlyRentToOwnRate: parseFloat(csvRow['อัตราเช่าออม']) || 0,
          officer: csvRow['ผู้วิเคราะห์'] || 'นายพิชญ์ สุดทัน'
  };

  // Parse financial data using correct column names from CSV structure
  const financialData = {
    income: parseFloat(csvRow['รายได้ ติดตาม 0']) || 0,
    debt: parseFloat(csvRow['ภาระหนี้ ติดตาม 0']) || 0,
    maxDebtAllowed: parseFloat(csvRow['หนี้ไม่ควรเกิน']) || 0,
    loanTerm: parseFloat(csvRow['ระยะเวลาขอสินเชื่อ ติดตาม 0']) || 0,
    ltv: parseFloat(csvRow['LTV ติดตาม 0']) || 0,
    ltvNote: csvRow['LTV เหตผล ติดตาม 0'] || '',
    selectedBank: csvRow['ธนาคารที่ควรยื่นขอสินเชื่อ ติดตาม 0'] || '',
    targetBank: csvRow['ธนาคารที่ควรยื่นขอสินเชื่อ ติดตาม 0'] || '',
    targetDate: csvRow['ระยะเวลากู้ Target'] || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]
  };

  // Parse problems and action plans
  const loanProblem = parseCSVProblems(csvRow);
  const actionPlan = parseCSVActionPlans(csvRow);

  // Calculate KPIs (simplified version)
  const actionPlanProgress = Math.min(100, loanProblem.length > 0 ? (actionPlan.length / loanProblem.length) * 100 : 100);
  const dsr = financialData.income > 0 ? (financialData.debt / financialData.income) * 100 : 0;
  let dsrScore = 50;
  let financialStatus = 'ต้องปรับปรุง';
  
  if (dsr < 40) { 
    financialStatus = 'ดีเยี่ยม'; 
    dsrScore = 100; 
  } else if (dsr < 60) { 
    financialStatus = 'เฝ้าระวัง'; 
    dsrScore = 75; 
  }

  const potentialScore = Math.round((actionPlanProgress * 0.5) + (dsrScore * 0.5));

  const kpiData = {
    potentialScore,
    financialStatus,
    actionPlanProgress: Math.round(actionPlanProgress),
    paymentHistory: 'นำเข้าจาก CSV'
  };

  return {
    ...basicData,
    ...financialData,
    ...kpiData,
    loanProblem,
    actionPlan
  };
};

// ===============================
// LOAN PROBLEMS API ENDPOINTS
// ===============================

// Get problem categories (ระดับ 1)
app.get('/api/problems/categories', authenticateToken, (req, res) => {
  try {
    const categories = getProblemCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error getting problem categories' });
  }
});

// Get problem details for a category (ระดับ 2)
app.get('/api/problems/details/:category', authenticateToken, (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category);
    const details = getProblemDetails(category);
    res.json(details);
  } catch (error) {
    res.status(500).json({ message: 'Error getting problem details' });
  }
});

// Get solution for a specific problem (ระดับ 3)
app.get('/api/problems/solution/:category/:detail', authenticateToken, (req, res) => {
  try {
    const category = decodeURIComponent(req.params.category);
    const detail = decodeURIComponent(req.params.detail);
    const solution = getSolution(category, detail);
    res.json({ solution });
  } catch (error) {
    res.status(500).json({ message: 'Error getting solution' });
  }
});

// Get other problems (ปัญหาอื่น ๆ)
app.get('/api/problems/other', authenticateToken, (req, res) => {
  try {
    const otherProblems = getAllOtherProblems();
    res.json(otherProblems);
  } catch (error) {
    res.status(500).json({ message: 'Error getting other problems' });
  }
});

// Get solution for other problem
app.get('/api/problems/other-solution/:problem', authenticateToken, (req, res) => {
  try {
    const problem = decodeURIComponent(req.params.problem);
    const solution = getOtherProblemSolution(problem);
    res.json({ solution });
  } catch (error) {
    res.status(500).json({ message: 'Error getting other problem solution' });
  }
});

// Get all problems as flat list (for compatibility)
app.get('/api/problems/all', authenticateToken, (req, res) => {
  try {
    const problems = getAllProblemsFlat();
    res.json(problems);
  } catch (error) {
    res.status(500).json({ message: 'Error getting all problems' });
  }
});

// ===============================
// CSV IMPORT API ENDPOINTS
// ===============================

// CSV Import API Endpoint
app.post('/api/import-csv', authenticateToken, requireRole(['admin', 'data_entry']), async (req, res) => {
  try {
    const csvPath = path.join(__dirname, '../CV/database from ca cl fixed.csv');
    
    if (!fs.existsSync(csvPath)) {
      return res.status(404).json({ message: 'CSV file not found' });
    }

    const results = [];
    const errors = [];
    let processedCount = 0;
    let successCount = 0;

    // Read and parse CSV
    const csvData = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv({ 
        skipEmptyLines: true,
        skipLinesWithError: true
      }))
      .on('data', (data) => {
        csvData.push(data);
      })
      .on('end', async () => {
        
        // Skip header rows (first 3 rows are headers)
        const dataRows = csvData.slice(3);
        
        for (const row of dataRows) {
          try {
            processedCount++;
            
            // Skip empty rows
            if (!row['ชื่อ'] || !row['สกุล']) {
              continue;
            }

            const customerData = convertCSVToCustomerData(row);
            const customerId = await insertCustomerWithDetails(customerData);
            
            results.push({
              id: customerId,
              name: customerData.name,
              status: 'success'
            });
            successCount++;
            
          } catch (error) {
            errors.push({
              row: processedCount,
              name: `${row['ชื่อ']} ${row['สกุล']}`,
              error: error.message
            });
          }
        }

        res.json({
          message: 'CSV import completed',
          summary: {
            totalRows: dataRows.length,
            processed: processedCount,
            successful: successCount,
            errors: errors.length
          },
          results,
          errors
        });
      })
      .on('error', (error) => {
        res.status(500).json({ message: 'Error reading CSV file', error: error.message });
      });

  } catch (error) {
    res.status(500).json({ message: 'Error importing CSV', error: error.message });
  }
});

// Debug CSV parsing endpoint  
app.get('/api/debug-csv-parsing', (req, res) => {
  try {
    const fs = require('fs');
    const csv = require('csv-parser');
    const csvPath = path.join(__dirname, '../CV/database from ca cl fixed.csv');
    
    const results = [];
    let rowCount = 0;
    
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        if (rowCount < 5) { // Only process first 5 rows for debugging
          const problems = parseCSVProblems(row);
          const plans = parseCSVActionPlans(row);
          
          results.push({
            row: rowCount,
            name: `${row['คำนำหน้า'] || ''} ${row['ชื่อ'] || ''} ${row['สกุล'] || ''}`.trim(),
            problems: problems,
            plans: plans,
            sampleColumns: {
              'ปัญหาที่ทำให้ขอสินเชื่อไม่ได้ ปัญหาที่ 1': row['ปัญหาที่ทำให้ขอสินเชื่อไม่ได้ ปัญหาที่ 1'],
              'ปัญหาที่ทำให้ขอสินเชื่อไม่ได้ ปัญหาที่ 2': row['ปัญหาที่ทำให้ขอสินเชื่อไม่ได้ ปัญหาที่ 2'],
              'แผนแกเคส รายการที่ 1': row['แผนแกเคส รายการที่ 1'],
              'แผนแกเคส รายการที่ 2': row['แผนแกเคส รายการที่ 2']
            }
          });
        }
        rowCount++;
      })
      .on('end', () => {
        res.json({
          totalRows: rowCount,
          debugResults: results
        });
      })
      .on('error', (error) => {
        res.status(500).json({ message: 'Error reading CSV file', error: error.message });
      });

  } catch (error) {
    res.status(500).json({ message: 'Error debugging CSV', error: error.message });
  }
});

// Clear all customers API
app.post('/api/clear-customers', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { db } = require('./database');
    
    // Clear all customer-related data
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('DELETE FROM loan_problems', (err) => {
          if (err) reject(err);
        });
        db.run('DELETE FROM action_plans', (err) => {
          if (err) reject(err);
        });
        db.run('DELETE FROM customers', (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
    
    res.json({ message: 'All customer data cleared successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing customer data', error: error.message });
  }
});

// Test API to debug CSV structure
app.get('/api/test-csv', async (req, res) => {
  try {
    const csvPath = path.join(__dirname, '../CV/database from ca cl fixed.csv');
    const csvData = [];
    
    fs.createReadStream(csvPath)
      .pipe(csv({ 
        skipEmptyLines: true,
        skipLinesWithError: true
      }))
      .on('data', (data) => {
        csvData.push(data);
      })
      .on('end', () => {
        const firstRow = csvData[3]; // Skip header rows
        
        // Get column names and their values
        const columnInfo = {};
        Object.keys(firstRow).forEach(key => {
          columnInfo[key] = firstRow[key];
        });
        
        res.json({
          totalRows: csvData.length,
          columnCount: Object.keys(firstRow).length,
          sampleRow: columnInfo,
          problemColumns: {
            'ปัญหา 1': firstRow['ปัญหา 1'],
            'ปัญหา 2': firstRow['ปัญหา 2'],
            'รายได้ 0': firstRow['รายได้ 0'],
            'หนี้ 0': firstRow['หนี้ 0'],
            'CA แผน หมายเหตุ 1': firstRow['CA แผน หมายเหตุ 1']
          }
        });
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// SUPABASE API ENDPOINTS
// ==========================================

// GET /api/supabase/customers - ดึงข้อมูลลูกค้าทั้งหมดจาก Supabase
app.get('/api/supabase/customers', async (req, res) => {
  try {
    const customers = await supabaseCustomerService.getAllCustomers();
    res.json({ 
      success: true, 
      customers, 
      count: customers.length,
      source: 'supabase'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      source: 'supabase'
    });
  }
});

// GET /api/supabase/customers/:id - ดึงข้อมูลลูกค้าตาม ID จาก Supabase
app.get('/api/supabase/customers/:id', async (req, res) => {
  try {
    const customer = await supabaseCustomerService.getCustomerById(req.params.id);
    if (!customer) {
      return res.status(404).json({ 
        success: false, 
        error: 'Customer not found',
        source: 'supabase'
      });
    }
    res.json({ 
      success: true, 
      customer,
      source: 'supabase'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      source: 'supabase'
    });
  }
});

// GET /api/supabase/search - ค้นหาลูกค้าใน Supabase
app.get('/api/supabase/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ 
        success: false, 
        error: 'Search query is required',
        source: 'supabase'
      });
    }
    
    const customers = await supabaseCustomerService.searchCustomers(q);
    res.json({ 
      success: true, 
      customers, 
      count: customers.length,
      searchTerm: q,
      source: 'supabase'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      source: 'supabase'
    });
  }
});

// GET /api/supabase/projects - ดึงรายการโครงการที่ไม่ซ้ำจาก Supabase
app.get('/api/supabase/projects', async (req, res) => {
  try {
    const projects = await supabaseCustomerService.getUniqueProjects();
    res.json({ 
      success: true, 
      projects, 
      count: projects.length,
      source: 'supabase'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      source: 'supabase'
    });
  }
});

// GET /api/supabase/stats - สถิติข้อมูลลูกค้าจาก Supabase
app.get('/api/supabase/stats', async (req, res) => {
  try {
    const stats = await supabaseCustomerService.getCustomerStats();
    res.json({ 
      success: true, 
      stats,
      source: 'supabase'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      source: 'supabase'
    });
  }
});

// GET /api/hybrid/customers - รวมข้อมูลจากทั้ง SQLite และ Supabase
app.get('/api/hybrid/customers', async (req, res) => {
  try {
    // ดึงข้อมูลจาก SQLite
    const sqliteCustomers = await getAllCustomers();
    
    // ดึงข้อมูลจาก Supabase
    let supabaseCustomers = [];
    try {
      supabaseCustomers = await supabaseCustomerService.getAllCustomers();
    } catch (supabaseError) {
    }
    
    res.json({ 
      success: true, 
      data: {
        sqlite: {
          customers: sqliteCustomers,
          count: sqliteCustomers.length
        },
        supabase: {
          customers: supabaseCustomers,
          count: supabaseCustomers.length
        }
      },
      totalCount: sqliteCustomers.length + supabaseCustomers.length,
      source: 'hybrid'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      source: 'hybrid'
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
