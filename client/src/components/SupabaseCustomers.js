import React, { useState, useEffect, useCallback } from 'react';
// import { Link } from 'react-router-dom'; // eslint-disable-next-line no-unused-vars
import SupabaseFrontendService from '../services/supabaseService';
import styles from './SupabaseCustomers.module.css';

function SupabaseCustomers() {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState([]);


  // ดึงข้อมูลลูกค้าจาก Supabase
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [customersData, statsData, projectsData] = await Promise.all([
        SupabaseFrontendService.getAllCustomers(),
        SupabaseFrontendService.getCustomerStats(),
        SupabaseFrontendService.getUniqueProjects()
      ]);
      
      setCustomers(customersData || []);
      setFilteredCustomers(customersData || []);
      setStats(statsData);
      setProjects(projectsData || []);
      
    } catch (err) {
      console.error('Error fetching Supabase data:', err);
      setError(err.message || 'ไม่สามารถดึงข้อมูลจาก Supabase ได้');
    } finally {
      setLoading(false);
    }
  }, []);

  // ฟังก์ชันค้นหาและกรองข้อมูล
  const handleSearch = useCallback(() => {
    let filtered = customers;

    // กรองตามคำค้นหา (ใช้ชื่อ columns ใหม่)
    if (searchTerm.trim()) {
      filtered = filtered.filter(customer => 
        (customer['customer_name'] && customer['customer_name'].toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer['project_name'] && customer['project_name'].toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer['project_code'] && customer['project_code'].toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer['house_number'] && customer['house_number'].toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // กรองตามโครงการที่เลือก
    if (selectedProject) {
      filtered = filtered.filter(customer => 
        customer['project_name'] === selectedProject
      );
    }

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, selectedProject]);

  // เรียกใช้เมื่อ component mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // เรียกใช้เมื่อมีการค้นหาหรือกรอง
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>กำลังโหลดข้อมูลจาก Supabase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>❌ เกิดข้อผิดพลาด</h2>
          <p>{error}</p>
          <button onClick={fetchCustomers} className={styles.retryButton}>
            🔄 ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>🌐 ข้อมูลลูกค้าเดิม (Supabase)</h1>
          <p>ข้อมูลลูกค้าที่มีอยู่ในระบบเดิม</p>
        </div>
        
        {/* Stats Cards */}
        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statContent}>
                <h3>ลูกค้าทั้งหมด</h3>
                <p>{stats.totalCustomers?.toLocaleString() || 0}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📊</div>
              <div className={styles.statContent}>
                <h3>แสดงผล</h3>
                <p>{filteredCustomers.length.toLocaleString()}</p>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>🏗️</div>
              <div className={styles.statContent}>
                <h3>โครงการ</h3>
                <p>{projects.length}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className={styles.searchSection}>
        <div className={styles.searchControls}>
          <div className={styles.searchGroup}>
            <input
              type="text"
              placeholder="🔍 ค้นหาชื่อลูกค้า, โครงการ, รหัส หรือบ้านเลขที่..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">🏗️ ทุกโครงการ</option>
              {projects.map((project, index) => (
                <option key={index} value={project['project_name']}>
                  {project['project_name']} ({project['project_code']})
                </option>
              ))}
            </select>
          </div>
          
          <button onClick={fetchCustomers} className={styles.refreshButton}>
            🔄 รีเฟรช
          </button>
        </div>
      </div>

      {/* Customer Table */}
      <div className={styles.tableSection}>
        {filteredCustomers.length === 0 ? (
          <div className={styles.noData}>
            <h3>📭 ไม่พบข้อมูล</h3>
            <p>ไม่มีลูกค้าที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.customerTable}>
              <thead>
                <tr>
                  <th>ลำดับ</th>
                  <th>ชื่อลูกค้า</th>
                  <th>ชื่อโครงการ</th>
                  <th>รหัสโครงการ</th>
                  <th>บ้านเลขที่</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer, index) => (
                  <tr key={customer.id || index} className={styles.customerRow}>
                    <td className={styles.indexCell}>
                      {index + 1}
                    </td>
                    <td className={styles.nameCell}>
                      <div className={styles.customerName}>
                        👤 {customer['customer_name'] || 'ไม่ระบุ'}
                      </div>
                    </td>
                    <td className={styles.projectCell}>
                      <div className={styles.projectName}>
                        🏗️ {customer['project_name'] || 'ไม่ระบุ'}
                      </div>
                    </td>
                    <td className={styles.codeCell}>
                      <div className={styles.projectCode}>
                        📋 {customer['project_code'] || 'ไม่ระบุ'}
                      </div>
                    </td>
                    <td className={styles.addressCell}>
                      <div className={styles.houseNumber}>
                        🏠 {customer['house_number'] || 'ไม่ระบุ'}
                      </div>
                    </td>
                    <td className={styles.actionCell}>
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.viewButton} 
                          title="ดูรายละเอียด"
                        >
                          👁️ ดู
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <p>
          📊 แสดงข้อมูล {filteredCustomers.length} รายการ จากทั้งหมด {customers.length} รายการ
          {stats?.lastUpdated && (
            <span> | อัพเดทล่าสุด: {new Date(stats.lastUpdated).toLocaleString('th-TH')}</span>
          )}
        </p>
      </div>


    </div>
  );
}

export default SupabaseCustomers;
