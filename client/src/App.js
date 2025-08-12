import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import CustomerDetail from './components/CustomerDetail';
import CustomerForm from './components/CustomerForm';
import BankAdmin from './components/BankAdmin';

// Protected Route Component
function ProtectedRoute({ children, requiredRoles = [], requiredDepartments = [] }) {
  const { isAuthenticated, hasRole, hasDepartment, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        🔄 กำลังโหลด...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return (
      <div style={{ 
        padding: '50px', 
        textAlign: 'center',
        fontSize: '1.2rem',
        color: '#e53e3e'
      }}>
        ⚠️ คุณไม่มีสิทธิ์เข้าถึงหน้านี้
      </div>
    );
  }

  if (requiredDepartments.length > 0 && !hasDepartment(requiredDepartments)) {
    return (
      <div style={{ 
        padding: '50px', 
        textAlign: 'center',
        fontSize: '1.2rem',
        color: '#e53e3e'
      }}>
        ⚠️ แผนกของคุณไม่มีสิทธิ์เข้าถึงหน้านี้
      </div>
    );
  }

  return children;
}

// Main App Component
function AppContent() {
  const { isAuthenticated, loading, login } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        🔄 กำลังโหลด...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login onLogin={login} />;
  }

  return (
    <div className="App">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/customer/:customerId" 
          element={
            <ProtectedRoute>
              <CustomerDetail />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/add-customer" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'data_entry']}>
              <CustomerForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/edit-customer/:customerId" 
          element={
            <ProtectedRoute requiredRoles={['admin', 'data_entry']}>
              <CustomerForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/banks" 
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <BankAdmin />
            </ProtectedRoute>
          } 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
