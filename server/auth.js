const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('./database');

const JWT_SECRET = 'jaidee-secret-key-2025'; // In production, use environment variable

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      department: user.department 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware to check authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  req.user = user;
  next();
};

// Middleware to check role permissions
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }
    next();
  };
};

// Middleware to check department permissions
const requireDepartment = (allowedDepartments) => {
  return (req, res, next) => {
    if (!allowedDepartments.includes(req.user.department)) {
      return res.status(403).json({ message: 'Department access denied' });
    }
    next();
  };
};

// Helper function to create user
const createUser = async (userData) => {
  const { username, password, full_name, role, department } = userData;
  
  return new Promise(async (resolve, reject) => {
    try {
      const hashedPassword = await hashPassword(password);
      
      const sql = `
        INSERT INTO users (username, password, full_name, role, department)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      db.run(sql, [username, hashedPassword, full_name, role, department], function(err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      });
    } catch (error) {
      reject(error);
    }
  });
};

// Helper function to get user by username
const getUserByUsername = (username) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM users WHERE username = ? AND is_active = 1';
    
    db.get(sql, [username], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
};

// Helper function to get user by ID
const getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id, username, full_name, role, department, is_active, created_at FROM users WHERE id = ?';
    
    db.get(sql, [id], (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
};

// Initialize default admin user
const initializeDefaultUsers = async () => {
  try {
    // Check if admin exists
    const adminExists = await getUserByUsername('admin');
    if (!adminExists) {
      await createUser({
        username: 'admin',
        password: 'admin123',
        full_name: 'System Administrator',
        role: 'admin',
        department: 'CO'
      });
      console.log('Default admin user created');
    }

    // Create demo users for testing
    const dataEntryExists = await getUserByUsername('data_entry');
    if (!dataEntryExists) {
      await createUser({
        username: 'data_entry',
        password: 'data123',
        full_name: 'เจ้าหน้าที่บันทึกข้อมูล',
        role: 'data_entry',
        department: 'เงินสดใจดี'
      });
      console.log('Demo data entry user created');
    }

    const dataUserExists = await getUserByUsername('data_user');
    if (!dataUserExists) {
      await createUser({
        username: 'data_user',
        password: 'user123',
        full_name: 'เจ้าหน้าที่ใช้งานข้อมูล',
        role: 'data_user',
        department: 'CO'
      });
      console.log('Demo data user created');
    }

  } catch (error) {
    console.error('Error initializing default users:', error);
  }
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  authenticateToken,
  requireRole,
  requireDepartment,
  createUser,
  getUserByUsername,
  getUserById,
  initializeDefaultUsers
};