/**
 * Bank Constants & Configuration
 * Reference bank rates, credit bureau grades, and matching rules
 */

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

const bankMatchingRules = {
  "GSU_BANK": {
    partnership: "LivNex_Primary",
    loanCriteria: { minIncome: 15000, maxDSR: 60, flexibleCredit: true },
    rentToOwnTerms: { maxLTV: 90, preferredInterestRate: 3.5, maxTerm: 30, specialProgram: "LivNex_GSU_Partnership" },
    creditRequirements: { minCreditScore: 300, livnexBonus: 100, excludeStatus: ["30", "31"], acceptableGrades: ["AA", "BB", "CC", "DD", "EE", "FF", "GG", "HH"] },
    scoring: { loanWeight: 0.3, rentToOwnWeight: 0.4, creditWeight: 0.3 }
  },
  "GSB": {
    partnership: "Government_Backing",
    loanCriteria: { minIncome: 12000, maxDSR: 70, stableIncome: true },
    rentToOwnTerms: { maxLTV: 85, preferredInterestRate: 4.0, maxTerm: 25, governmentRate: true },
    creditRequirements: { minCreditScore: 600, livnexBonus: 50, excludeStatus: ["20", "30", "31", "33"], acceptableGrades: ["AA", "BB", "CC", "DD", "EE"] },
    scoring: { loanWeight: 0.4, rentToOwnWeight: 0.3, creditWeight: 0.3 }
  },
  "KTB": {
    partnership: "Standard_Commercial",
    loanCriteria: { minIncome: 20000, maxDSR: 50, regularEmployee: true },
    rentToOwnTerms: { maxLTV: 80, preferredInterestRate: 4.5, maxTerm: 20, premiumRate: true },
    creditRequirements: { minCreditScore: 650, livnexBonus: 25, excludeStatus: ["20", "30", "31", "33", "42"], acceptableGrades: ["AA", "BB", "CC", "DD"] },
    scoring: { loanWeight: 0.5, rentToOwnWeight: 0.3, creditWeight: 0.2 }
  },
  "BBL": {
    partnership: "Premium_Commercial",
    loanCriteria: { minIncome: 25000, maxDSR: 45, regularEmployee: true },
    rentToOwnTerms: { maxLTV: 75, preferredInterestRate: 4.8, maxTerm: 20, premiumRate: true },
    creditRequirements: { minCreditScore: 700, livnexBonus: 20, excludeStatus: ["20", "30", "31", "33", "42"], acceptableGrades: ["AA", "BB", "CC"] },
    scoring: { loanWeight: 0.5, rentToOwnWeight: 0.3, creditWeight: 0.2 }
  },
  "KBANK": {
    partnership: "Premium_Commercial",
    loanCriteria: { minIncome: 25000, maxDSR: 45, regularEmployee: true },
    rentToOwnTerms: { maxLTV: 75, preferredInterestRate: 4.7, maxTerm: 20, premiumRate: true },
    creditRequirements: { minCreditScore: 700, livnexBonus: 20, excludeStatus: ["20", "30", "31", "33", "42"], acceptableGrades: ["AA", "BB", "CC"] },
    scoring: { loanWeight: 0.5, rentToOwnWeight: 0.3, creditWeight: 0.2 }
  }
};

module.exports = {
  refbank,
  INCOME_PERCENTAGE_FOR_LOAN,
  creditGradeRanges,
  accountStatusMapping,
  livnexEligibilityRules,
  bankMatchingRules
};
