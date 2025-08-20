import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import styles from './Navbar.module.css';

function Navbar() {
  const { user, logout, isAdmin, canEditData } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    if (window.confirm('คุณต้องการออกจากระบบหรือไม่?')) {
      await logout();
    }
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <div className={styles.navLeft}>
          <Link to="/" className={styles.logo}>
            🏛️ <span>Jaidee System</span>
          </Link>
          
          <div className={styles.navLinks}>
            <Link 
              to="/" 
              className={`${styles.navLink} ${isActive('/') ? styles.active : ''}`}
            >
              📊 Dashboard
            </Link>
            
            {canEditData() && (
              <Link 
                to="/add-customer" 
                className={`${styles.navLink} ${isActive('/add-customer') ? styles.active : ''}`}
              >
                👥 เพิ่มลูกค้า
              </Link>
            )}
            
            {/* Temporarily hidden - Supabase customers menu
            <Link 
              to="/supabase-customers" 
              className={`${styles.navLink} ${isActive('/supabase-customers') ? styles.active : ''}`}
            >
              🌐 ข้อมูลลูกค้าเดิม
            </Link>
            */}
            
            {isAdmin() && (
              <Link 
                to="/admin/banks" 
                className={`${styles.navLink} ${isActive('/admin/banks') ? styles.active : ''}`}
              >
                🏦 จัดการธนาคาร
              </Link>
            )}
          </div>
        </div>

        <div className={styles.navRight}>
          <div className={styles.userInfo}>
            <div className={styles.userDetails}>
              <span className={styles.userName}>{user.full_name}</span>
              <span className={styles.userRole}>
                {user.department} • {user.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                  user.role === 'data_entry' ? 'บันทึกข้อมูล' : 'ใช้งานข้อมูล'}
              </span>
            </div>
            <div className={styles.userAvatar}>
              {user.role === 'admin' ? '👑' : user.role === 'data_entry' ? '📝' : '👁️'}
            </div>
          </div>
          
          <button onClick={handleLogout} className={styles.logoutButton}>
            🚪 ออกจากระบบ
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;