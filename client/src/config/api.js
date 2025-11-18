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
};

export default API_BASE_URL;
