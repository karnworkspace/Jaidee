import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

function Dashboard() {
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:3001/api/customers')
      .then(response => response.json())
      .then(data => setCustomers(data))
      .catch(error => console.error('Error fetching customers:', error));
  }, []);

  const handleRowClick = (id) => {
    navigate(`/customer/${id}`);
  };

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Customer Dashboard</h1>
        <Link to="/add-customer" className={styles.addButton}>+ เพิ่มลูกค้าใหม่</Link>
      </div>

      <div className={styles.customerTableContainer}>
        <table className={styles.customerTable}>
          <thead>
            <tr>
              <th>ชื่อ-สกุล</th>
              <th>โครงการ</th>
              <th>ห้อง</th>
              <th>เป้าหมายยื่นกู้</th>
            </tr>
          </thead>
          <tbody>
            {customers.length > 0 ? (
              customers.map(customer => (
                <tr key={customer.id} onClick={() => handleRowClick(customer.id)} className={styles.customerRow}>
                  <td>{customer.name}</td>
                  <td>{customer.projectName || '-'}</td>
                  <td>{customer.unit || '-'}</td>
                  <td>{customer.targetDate ? new Date(customer.targetDate).toLocaleDateString('th-TH') : '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className={styles.noCustomers}>ไม่พบข้อมูลลูกค้า</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
