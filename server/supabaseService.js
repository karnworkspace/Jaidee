const { supabase } = require('./supabaseClient');

/**
 * Supabase Service Layer สำหรับจัดการข้อมูลตาราง uat_Liv
 * โครงสร้างตาราง: ชื่อลูกค้า, ชื่อโครงการ, รหัสโครงการ, บ้านเลขที่
 */

class SupabaseCustomerService {
  constructor() {
    this.tableName = 'uat_Liv';
  }

  /**
   * ดึงข้อมูลลูกค้าทั้งหมดจาก Supabase
   */
  async getAllCustomers() {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase getAllCustomers error:', error);
        // Return empty array instead of throwing error for better UX
        return [];
      }
      
      return data;
    } catch (err) {
      console.error('getAllCustomers service error:', err);
      // Return empty array instead of throwing error
      return [];
    }
  }

  /**
   * ดึงข้อมูลลูกค้าตาม ID
   */
  async getCustomerById(id) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          return null; // ไม่พบข้อมูล
        }
        console.error('Supabase getCustomerById error:', error);
        throw new Error(`Failed to fetch customer: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('getCustomerById service error:', err);
      throw err;
    }
  }

  /**
   * ค้นหาลูกค้าตามชื่อหรือโครงการ
   */
  async searchCustomers(searchTerm) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .or(`customer_name.ilike.%${searchTerm}%,project_name.ilike.%${searchTerm}%,project_code.ilike.%${searchTerm}%,house_number.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase searchCustomers error:', error);
        throw new Error(`Failed to search customers: ${error.message}`);
      }
      
      return data;
    } catch (err) {
      console.error('searchCustomers service error:', err);
      throw err;
    }
  }

  /**
   * ดึงข้อมูลโครงการที่ไม่ซ้ำกัน
   */
  async getUniqueProjects() {
    try {
      // ใช้ * แทนการระบุชื่อ column เฉพาะ เพื่อหลีกเลี่ยงปัญหา encoding
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
                  .not('project_name', 'is', null)
          .not('project_code', 'is', null)
        .limit(1000); // จำกัดข้อมูลเพื่อประสิทธิภาพ
      
      if (error) {
        console.error('Supabase getUniqueProjects error:', error);
        // Return empty array instead of throwing error
        return [];
      }
      
      // กรองข้อมูลให้ไม่ซ้ำและเลือกเฉพาะ field ที่ต้องการ
      const uniqueProjects = [];
      const seenCodes = new Set();
      
      for (const item of data) {
        const projectCode = item['project_code'];
        const projectName = item['project_name'];
        
        if (projectCode && projectName && !seenCodes.has(projectCode)) {
          seenCodes.add(projectCode);
          uniqueProjects.push({
            'project_name': projectName,
            'project_code': projectCode
          });
        }
      }
      
      return uniqueProjects;
    } catch (err) {
      console.error('getUniqueProjects service error:', err);
      // Return empty array instead of throwing error
      return [];
    }
  }

  /**
   * สถิติข้อมูลลูกค้า
   */
  async getCustomerStats() {
    try {
      const { count, error } = await supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Supabase getCustomerStats error:', error);
        // Return default stats instead of throwing error
        return {
          totalCustomers: 0,
          lastUpdated: new Date().toISOString()
        };
      }
      
      const stats = {
        totalCustomers: count,
        lastUpdated: new Date().toISOString()
      };
      
      return stats;
    } catch (err) {
      console.error('getCustomerStats service error:', err);
      // Return default stats instead of throwing error
      return {
        totalCustomers: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Subscribe to real-time changes
   */
  subscribeToChanges(callback) {
    const subscription = supabase
      .channel('uat_Liv_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: this.tableName
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    return subscription;
  }

  /**
   * Unsubscribe from real-time changes
   */
  unsubscribeFromChanges(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
}

// Export singleton instance
const supabaseCustomerService = new SupabaseCustomerService();

module.exports = {
  supabaseCustomerService,
  SupabaseCustomerService
};
