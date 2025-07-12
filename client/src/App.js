import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import CustomerDetail from './components/CustomerDetail';
import CustomerForm from './components/CustomerForm';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customer/:customerId" element={<CustomerDetail />} />
          <Route path="/add-customer" element={<CustomerForm />} />
          <Route path="/edit-customer/:customerId" element={<CustomerForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
