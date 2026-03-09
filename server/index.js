const express = require('express');
const cors = require('cors');
const session = require('express-session');
const { initializeDatabase } = require('./database');
const { initializeDefaultUsers } = require('./auth');

// Route modules
const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const bankRulesRoutes = require('./routes/bankRules');
const problemsRoutes = require('./routes/problems');
const csvImportRoutes = require('./routes/csvImport');
const rentToOwnRoutes = require('./routes/rentToOwn');
const reportsRoutes = require('./routes/reports');

// DOC2026 route modules
const loanApplicationRoutes = require('./routes/loanApplications');
const bureauRequestRoutes = require('./routes/bureauRequests');
const debtItemRoutes = require('./routes/debtItems');
const livnexTrackingRoutes = require('./routes/livnexTracking');
const caRecommendationRoutes = require('./routes/caRecommendations');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'jaidee-backend'
  });
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'jaidee-session-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// Initialize database on startup
initializeDatabase()
  .then(() => {
    console.log('Database initialized successfully');
    return initializeDefaultUsers();
  })
  .then(() => {
    console.log('Default users initialized');
    console.log('Running in SQLite-only mode');
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/bank-rules', bankRulesRoutes);
app.use('/api/problems', problemsRoutes);
app.use('/api', csvImportRoutes);
app.use('/api', rentToOwnRoutes);
app.use('/api/reports', reportsRoutes);

// DOC2026 routes
app.use('/api/loan-applications', loanApplicationRoutes);
app.use('/api/bureau-requests', bureauRequestRoutes);
app.use('/api/debt-items', debtItemRoutes);
app.use('/api/livnex-tracking', livnexTrackingRoutes);
app.use('/api/ca-recommendations', caRecommendationRoutes);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
