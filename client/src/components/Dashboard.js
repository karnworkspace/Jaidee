import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:3001/api/customers')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log('Fetched customers:', data);
        setCustomers(data);
        setFilteredCustomers(data);
      })
      .catch(error => {
        console.error('Error fetching customers:', error);
        // Set empty array as fallback
        setCustomers([]);
        setFilteredCustomers([]);
      });
  }, []);

  useEffect(() => {
    const filtered = customers.filter(customer => 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.unit?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const handleCardClick = (id) => {
    navigate(`/customer/${id}`);
  };

  const formatNumber = (num) => {
    if (!num) return '-';
    return parseFloat(num).toLocaleString('en-US');
  };

  const getStatusBadge = (customer) => {
    const today = new Date();
    const targetDate = new Date(customer.targetDate);
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { class: 'pending', text: 'เกินกำหนด' };
    } else if (diffDays <= 30) {
      return { class: 'pending', text: 'เร่งด่วน' };
    } else {
      return { class: 'active', text: 'ปกติ' };
    }
  };

  const getStats = () => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => {
      const today = new Date();
      const targetDate = new Date(c.targetDate);
      return targetDate > today;
    }).length;
    
    const avgPotentialScore = customers.length > 0 
      ? Math.round(customers.reduce((sum, c) => sum + (c.potentialScore || 0), 0) / customers.length)
      : 0;
    
    const urgentCustomers = customers.filter(c => {
      const today = new Date();
      const targetDate = new Date(c.targetDate);
      const diffTime = targetDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30 && diffDays >= 0;
    }).length;
    
    return { totalCustomers, activeCustomers, avgPotentialScore, urgentCustomers };
  };

  const stats = getStats();

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Customer Dashboard</h1>
          <div className={styles.headerActions}>
            <Link to="/admin/banks" className={styles.adminButton}>🏦 จัดการธนาคาร</Link>
            <Link to="/add-customer" className={styles.addButton}>เพิ่มลูกค้าใหม่</Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className={styles.statsSection}>
          <div className={styles.statCard}>
            <h3>ลูกค้าทั้งหมด</h3>
            <div className={styles.statValue}>{stats.totalCustomers}</div>
            <div className={styles.statLabel}>รายการ</div>
          </div>
          <div className={styles.statCard}>
            <h3>ลูกค้าที่ใช้งาน</h3>
            <div className={styles.statValue}>{stats.activeCustomers}</div>
            <div className={styles.statLabel}>รายการ</div>
          </div>
          <div className={styles.statCard}>
            <h3>คะแนนเฉลี่ย</h3>
            <div className={styles.statValue}>{stats.avgPotentialScore}%</div>
            <div className={styles.statLabel}>Potential Score</div>
          </div>
          <div className={styles.statCard}>
            <h3>เร่งด่วน</h3>
            <div className={styles.statValue}>{stats.urgentCustomers}</div>
            <div className={styles.statLabel}>รายการ</div>
          </div>
        </div>

        {/* Search Section */}
        <div className={styles.searchSection}>
          <input
            type="text"
            placeholder="🔍 ค้นหาลูกค้า (ชื่อ, โครงการ, หมายเลขห้อง)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Customer Cards */}
        <div className={styles.customerGrid}>
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(customer => {
              const statusBadge = getStatusBadge(customer);
              return (
                <div key={customer.id} className={styles.customerCard} onClick={() => handleCardClick(customer.id)}>
                  <div className={styles.cardHeader}>
                    <div>
                      <div className={styles.customerName}>{customer.name}</div>
                      <div className={styles.customerProject}>{customer.projectName || '-'}</div>
                    </div>
                    <span className={`${styles.statusBadge} ${styles[statusBadge.class]}`}>
                      {statusBadge.text}
                    </span>
                  </div>
                  
                  <div className={styles.cardBody}>
                    <div className={styles.cardInfo}>
                      <div className={styles.label}>หมายเลขห้อง</div>
                      <div className={styles.value}>{customer.unit || '-'}</div>
                    </div>
                    <div className={styles.cardInfo}>
                      <div className={styles.label}>รายได้</div>
                      <div className={styles.value}>{formatNumber(customer.income)} บาท</div>
                    </div>
                    <div className={styles.cardInfo}>
                      <div className={styles.label}>Potential Score</div>
                      <div className={styles.value}>{customer.potentialScore || 0}%</div>
                    </div>
                    <div className={styles.cardInfo}>
                      <div className={styles.label}>สถานะการเงิน</div>
                      <div className={styles.value}>{customer.financialStatus || '-'}</div>
                    </div>
                  </div>
                  
                  <div className={styles.cardFooter}>
                    <div className={styles.targetDate}>
                      {customer.targetDate ? new Date(customer.targetDate).toLocaleDateString('th-TH') : '-'}
                    </div>
                    <Link to={`/customer/${customer.id}`} className={styles.viewButton} onClick={(e) => e.stopPropagation()}>
                      👁️ ดูรายละเอียด
                    </Link>
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.noCustomers}>
              <div className={styles.icon}>📋</div>
              <div>ไม่พบข้อมูลลูกค้า</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
