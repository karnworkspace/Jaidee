// API Configuration
// Use /jaidee/api for production deployment with Nginx path-based routing
const API_BASE_URL = "/jaidee";

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  ME: `${API_BASE_URL}/api/auth/me`,

  // Customer endpoints
  CUSTOMERS: `${API_BASE_URL}/api/customers`,
  CUSTOMER_BY_ID: (id) => `${API_BASE_URL}/api/customers/${id}`,

  // Bank rules endpoints
  BANK_RULES: `${API_BASE_URL}/api/bank-rules`,
  BANK_RULE_BY_CODE: (code) => `${API_BASE_URL}/api/bank-rules/${code}`,

  // Problems endpoints
  PROBLEMS_CATEGORIES: `${API_BASE_URL}/api/problems/categories`,
  PROBLEMS_OTHER: `${API_BASE_URL}/api/problems/other`,
  PROBLEMS_DETAILS: (category) =>
    `${API_BASE_URL}/api/problems/details/${encodeURIComponent(category)}`,
  PROBLEMS_SOLUTION: (category, detail) =>
    `${API_BASE_URL}/api/problems/solution/${encodeURIComponent(category)}/${encodeURIComponent(detail)}`,
  PROBLEMS_OTHER_SOLUTION: (problem) =>
    `${API_BASE_URL}/api/problems/other-solution/${encodeURIComponent(problem)}`,

  // Reports endpoints
  REPORTS: `${API_BASE_URL}/api/reports`,
  REPORT_BY_CUSTOMER: (customerId) =>
    `${API_BASE_URL}/api/reports/${customerId}`,

  // DOC2026: Loan Applications (APP-IN)
  LOAN_APPLICATIONS_BY_CUSTOMER: (customerId) =>
    `${API_BASE_URL}/api/loan-applications/customer/${customerId}`,
  LOAN_APPLICATION_BY_ID: (id) =>
    `${API_BASE_URL}/api/loan-applications/${id}`,
  LOAN_APPLICATIONS: `${API_BASE_URL}/api/loan-applications`,
  LOAN_APPLICATION_NEXT_STATUSES: (id) =>
    `${API_BASE_URL}/api/loan-applications/${id}/next-statuses`,

  // DOC2026: Bureau Requests
  BUREAU_REQUESTS_BY_CUSTOMER: (customerId) =>
    `${API_BASE_URL}/api/bureau-requests/customer/${customerId}`,
  BUREAU_RECENT_CHECK: (customerId) =>
    `${API_BASE_URL}/api/bureau-requests/customer/${customerId}/recent`,
  BUREAU_REQUESTS: `${API_BASE_URL}/api/bureau-requests`,
  BUREAU_REQUEST_BY_ID: (id) =>
    `${API_BASE_URL}/api/bureau-requests/${id}`,

  // DOC2026: Debt Items
  DEBT_ITEMS_BY_CUSTOMER: (customerId) =>
    `${API_BASE_URL}/api/debt-items/customer/${customerId}`,
  DEBT_SUMMARY: (customerId) =>
    `${API_BASE_URL}/api/debt-items/customer/${customerId}/summary`,
  DEBT_DSR: (customerId) =>
    `${API_BASE_URL}/api/debt-items/customer/${customerId}/dsr`,
  DEBT_ITEMS: `${API_BASE_URL}/api/debt-items`,
  DEBT_ITEM_BY_ID: (id) =>
    `${API_BASE_URL}/api/debt-items/${id}`,

  // DOC2026: LivNex Tracking
  LIVNEX_TRACKING_BY_CUSTOMER: (customerId) =>
    `${API_BASE_URL}/api/livnex-tracking/customer/${customerId}`,
  LIVNEX_TRACKING: `${API_BASE_URL}/api/livnex-tracking`,
  LIVNEX_TRACKING_BY_ID: (id) =>
    `${API_BASE_URL}/api/livnex-tracking/${id}`,

  // DOC2026: CA Recommendations
  CA_RECOMMENDATIONS_BY_CUSTOMER: (customerId) =>
    `${API_BASE_URL}/api/ca-recommendations/customer/${customerId}`,
  CA_RECOMMENDATIONS: `${API_BASE_URL}/api/ca-recommendations`,
  CA_RECOMMENDATION_BY_ID: (id) =>
    `${API_BASE_URL}/api/ca-recommendations/${id}`,
};

export default API_BASE_URL;
