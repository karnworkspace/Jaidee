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
        throw new Error(`Failed to fetch customers: ${error.message}`);
      }
      
      console.log(`✅ Retrieved ${data.length} customers from Supabase`);
      return data;
    } catch (err) {
      console.error('getAllCustomers service error:', err);
      throw err;
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
      
      console.log(`✅ Retrieved customer ID ${id} from Supabase`);
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
      
      console.log(`✅ Found ${data.length} customers matching "${searchTerm}"`);
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
        throw new Error(`Failed to fetch projects: ${error.message}`);
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
      
      console.log(`✅ Retrieved ${uniqueProjects.length} unique projects from Supabase`);
      return uniqueProjects;
    } catch (err) {
      console.error('getUniqueProjects service error:', err);
      throw err;
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
        throw new Error(`Failed to get stats: ${error.message}`);
      }
      
      const stats = {
        totalCustomers: count,
        lastUpdated: new Date().toISOString()
      };
      
      console.log(`✅ Retrieved customer stats: ${count} total customers`);
      return stats;
    } catch (err) {
      console.error('getCustomerStats service error:', err);
      throw err;
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
          console.log('🔄 Real-time change detected:', payload);
          callback(payload);
        }
      )
      .subscribe();

    console.log('📡 Subscribed to real-time changes for', this.tableName);
    return subscription;
  }

  /**
   * Unsubscribe from real-time changes
   */
  unsubscribeFromChanges(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription);
      console.log('📡 Unsubscribed from real-time changes');
    }
  }
}

// Export singleton instance
const supabaseCustomerService = new SupabaseCustomerService();

module.exports = {
  supabaseCustomerService,
  SupabaseCustomerService
};
