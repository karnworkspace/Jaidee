import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [filters, setFilters] = useState({
    status: 'all',
    potentialScore: 'all',
    financialStatus: 'all',
    officer: 'all'
  });
  const [importStatus, setImportStatus] = useState('');
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
    let filtered = customers.filter(customer => {
      // Search filter
      const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.unit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.officer?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      
      // Status filter
      if (filters.status !== 'all') {
        const statusBadge = getStatusBadge(customer);
        if (filters.status === 'urgent' && statusBadge.class !== 'pending') return false;
        if (filters.status === 'normal' && statusBadge.class !== 'active') return false;
      }
      
      // Potential Score filter
      if (filters.potentialScore !== 'all') {
        const score = customer.potentialScore || 0;
        if (filters.potentialScore === 'high' && score < 80) return false;
        if (filters.potentialScore === 'medium' && (score < 50 || score >= 80)) return false;
        if (filters.potentialScore === 'low' && score >= 50) return false;
      }
      
      // Financial Status filter
      if (filters.financialStatus !== 'all') {
        if (customer.financialStatus !== filters.financialStatus) return false;
      }
      
      // Officer filter
      if (filters.officer !== 'all') {
        if (customer.officer !== filters.officer) return false;
      }
      
      return true;
    });
    
    // Sort filtered results
    filtered.sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';
      
      // Handle numeric fields
      if (sortField === 'potentialScore' || sortField === 'income') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }
      
      // Handle date fields
      if (sortField === 'targetDate') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    setFilteredCustomers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, customers, filters, sortField, sortDirection]);

  const handleRowClick = (id) => {
    navigate(`/customer/${id}`);
  };
  
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };
  
  const clearFilters = () => {
    setFilters({
      status: 'all',
      potentialScore: 'all',
      financialStatus: 'all',
      officer: 'all'
    });
    setSearchTerm('');
  };
  
  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = filteredCustomers.slice(startIndex, endIndex);
  
  const goToPage = (page) => {
    setCurrentPage(page);
  };
  
  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  // Get unique values for filter options
  const getUniqueOfficers = () => {
    return [...new Set(customers.map(c => c.officer).filter(Boolean))];
  };
  
  const getUniqueFinancialStatuses = () => {
    return [...new Set(customers.map(c => c.financialStatus).filter(Boolean))];
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

  const handleImportCSV = async () => {
    if (!window.confirm('คุณต้องการนำเข้าข้อมูลจาก CSV หรือไม่?\n\nการดำเนินการนี้จะเพิ่มข้อมูลลูกค้าใหม่เข้าสู่ระบบ')) {
      return;
    }

    setImportStatus('🔄 กำลังนำเข้าข้อมูล...');
    
    try {
      const response = await fetch('http://localhost:3001/api/import-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (response.ok) {
        setImportStatus(`✅ นำเข้าสำเร็จ: ${result.summary.successful}/${result.summary.totalRows} รายการ`);
        
        // Refresh customer data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setImportStatus(`❌ เกิดข้อผิดพลาด: ${result.message}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportStatus(`❌ เกิดข้อผิดพลาด: ${error.message}`);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Customer Dashboard</h1>
          <div className={styles.headerActions}>
            <Link to="/admin/banks" className={styles.adminButton}>🏦 จัดการธนาคาร</Link>
            <button onClick={handleImportCSV} className={styles.importButton}>📁 นำเข้า CSV</button>
            <Link to="/add-customer" className={styles.addButton}>เพิ่มลูกค้าใหม่</Link>
          </div>
        </div>

        {/* Import Status */}
        {importStatus && (
          <div className={styles.importStatus}>
            {importStatus}
          </div>
        )}

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

        {/* Search and Filter Section */}
        <div className={styles.searchSection}>
          <div className={styles.searchRow}>
            <input
              type="text"
              placeholder="🔎 ค้นหาลูกค้า (ชื่อ, โครงการ, หมายเลขห้อง, เจ้าหน้าที่)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <button onClick={clearFilters} className={styles.clearButton}>
              🔄 ล้างตัวกรอง
            </button>
          </div>
          
          <div className={styles.filtersRow}>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">📋 สถานะทั้งหมด</option>
              <option value="urgent">⚠️ เร่งด่วน</option>
              <option value="normal">✅ ปกติ</option>
            </select>
            
            <select 
              value={filters.potentialScore} 
              onChange={(e) => handleFilterChange('potentialScore', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">📊 คะแนนทั้งหมด</option>
              <option value="high">🔥 สูง (80%+)</option>
              <option value="medium">⚡ ปานกลาง (50-79%)</option>
              <option value="low">📉 ต่ำ (น้อยกว่า 50%)</option>
            </select>
            
            <select 
              value={filters.financialStatus} 
              onChange={(e) => handleFilterChange('financialStatus', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">💰 สถานะการเงินทั้งหมด</option>
              {getUniqueFinancialStatuses().map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            
            <select 
              value={filters.officer} 
              onChange={(e) => handleFilterChange('officer', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">👤 เจ้าหน้าที่ทั้งหมด</option>
              {getUniqueOfficers().map(officer => (
                <option key={officer} value={officer}>{officer}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className={styles.resultsInfo}>
          <span className={styles.resultText}>
            แสดง {startIndex + 1}-{Math.min(endIndex, filteredCustomers.length)} จาก {filteredCustomers.length} รายการ
            {customers.length !== filteredCustomers.length && ` (กรองจากทั้งหมด ${customers.length} รายการ)`}
          </span>
        </div>

        {/* Customer Table */}
        <div className={styles.tableContainer}>
          {currentItems.length > 0 ? (
            <table className={styles.customerTable}>
              <thead>
                <tr>
                  <th onClick={() => handleSort('name')} className={styles.sortableHeader}>
                    👤 ชื่อลูกค้า
                    {sortField === 'name' && (
                      <span className={styles.sortIcon}>
                        {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th onClick={() => handleSort('projectName')} className={styles.sortableHeader}>
                    🏠 โครงการ
                    {sortField === 'projectName' && (
                      <span className={styles.sortIcon}>
                        {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th>🏢 ห้อง</th>
                  <th onClick={() => handleSort('income')} className={styles.sortableHeader}>
                    💰 รายได้
                    {sortField === 'income' && (
                      <span className={styles.sortIcon}>
                        {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th onClick={() => handleSort('potentialScore')} className={styles.sortableHeader}>
                    📊 คะแนน
                    {sortField === 'potentialScore' && (
                      <span className={styles.sortIcon}>
                        {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th>💼 สถานะการเงิน</th>
                  <th onClick={() => handleSort('officer')} className={styles.sortableHeader}>
                    👨‍💼 เจ้าหน้าที่
                    {sortField === 'officer' && (
                      <span className={styles.sortIcon}>
                        {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th onClick={() => handleSort('targetDate')} className={styles.sortableHeader}>
                    🎯 กำหนดการ
                    {sortField === 'targetDate' && (
                      <span className={styles.sortIcon}>
                        {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th>⚡ สถานะ</th>
                  <th>🔧 จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map(customer => {
                  const statusBadge = getStatusBadge(customer);
                  return (
                    <tr key={customer.id} className={styles.customerRow} onClick={() => handleRowClick(customer.id)}>
                      <td className={styles.nameCell}>
                        <div className={styles.customerName}>{customer.name}</div>
                      </td>
                      <td className={styles.projectCell}>
                        {customer.projectName || '-'}
                      </td>
                      <td>{customer.unit || '-'}</td>
                      <td className={styles.incomeCell}>
                        {formatNumber(customer.income)} ฿
                      </td>
                      <td className={styles.scoreCell}>
                        <div className={styles.scoreContainer}>
                          <div className={styles.scoreBar}>
                            <div 
                              className={styles.scoreProgress} 
                              style={{width: `${customer.potentialScore || 0}%`}}
                            ></div>
                          </div>
                          <span className={styles.scoreText}>{customer.potentialScore || 0}%</span>
                        </div>
                      </td>
                      <td className={styles.financialCell}>
                        <span className={`${styles.financialBadge} ${styles[customer.financialStatus?.replace(' ', '').toLowerCase() || 'default']}`}>
                          {customer.financialStatus || '-'}
                        </span>
                      </td>
                      <td>{customer.officer || '-'}</td>
                      <td className={styles.dateCell}>
                        {customer.targetDate ? new Date(customer.targetDate).toLocaleDateString('th-TH') : '-'}
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${styles[statusBadge.class]}`}>
                          {statusBadge.text}
                        </span>
                      </td>
                      <td className={styles.actionCell}>
                        <Link 
                          to={`/customer/${customer.id}`} 
                          className={styles.viewButton}
                          onClick={(e) => e.stopPropagation()}
                        >
                          📋
                        </Link>
                        <Link 
                          to={`/edit-customer/${customer.id}`} 
                          className={styles.editButton}
                          onClick={(e) => e.stopPropagation()}
                        >
                          ⚙️
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={styles.noCustomers}>
              <div className={styles.icon}>📋</div>
              <div>ไม่พบข้อมูลลูกค้าที่ตรงกับเงื่อนไข</div>
              <button onClick={clearFilters} className={styles.clearFiltersButton}>
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles.paginationContainer}>
            <div className={styles.paginationInfo}>
              หน้า {currentPage} จาก {totalPages} • รวม {filteredCustomers.length} รายการ
            </div>
            <div className={styles.paginationControls}>
              <button 
                onClick={goToPrevPage}
                disabled={currentPage === 1}
                className={`${styles.paginationButton} ${styles.prevButton}`}
              >
                ← ก่อนหน้า
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`${styles.paginationButton} ${currentPage === pageNum ? styles.active : ''}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button 
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className={`${styles.paginationButton} ${styles.nextButton}`}
              >
                ถัดไป →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
