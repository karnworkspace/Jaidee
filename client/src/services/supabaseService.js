// Frontend Supabase Service Layer
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

/**
 * Frontend service สำหรับเรียก Supabase APIs
 */
export class SupabaseFrontendService {
  
  /**
   * ดึงข้อมูลลูกค้าทั้งหมดจาก Supabase
   */
  static async getAllCustomers() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/supabase/customers`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch customers');
      }
      
      return data.customers;
    } catch (error) {
      throw error;
    }
  }

  /**
   * ดึงข้อมูลลูกค้าตาม ID
   */
  static async getCustomerById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/supabase/customers/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch customer');
      }
      
      return data.customer;
    } catch (error) {
      throw error;
    }
  }

  /**
   * ค้นหาลูกค้า
   */
  static async searchCustomers(searchTerm) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/supabase/search?q=${encodeURIComponent(searchTerm)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to search customers');
      }
      
      return data.customers;
    } catch (error) {
      throw error;
    }
  }

  /**
   * ดึงรายการโครงการ
   */
  static async getUniqueProjects() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/supabase/projects`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch projects');
      }
      
      return data.projects;
    } catch (error) {
      throw error;
    }
  }

  /**
   * ดึงสถิติ
   */
  static async getCustomerStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/supabase/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch stats');
      }
      
      return data.stats;
    } catch (error) {
      throw error;
    }
  }

  /**
   * ดึงข้อมูลแบบ Hybrid (SQLite + Supabase)
   */
  static async getHybridCustomers() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hybrid/customers`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch hybrid data');
      }
      
      return data.data;
    } catch (error) {
      throw error;
    }
  }
}

// Export default
export default SupabaseFrontendService;
