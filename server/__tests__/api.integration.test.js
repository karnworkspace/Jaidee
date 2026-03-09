/**
 * Integration Tests: DOC2026 API Routes
 *
 * Tests the actual HTTP endpoints with a real DB.
 * Uses the existing development database (read-only queries + temporary writes).
 */
const request = require('supertest');
const express = require('express');
const { getTestToken, waitForDb } = require('./testSetup');

// Build a minimal Express app with DOC2026 routes
const app = express();
app.use(express.json());

const loanApplicationRoutes = require('../routes/loanApplications');
const debtItemRoutes = require('../routes/debtItems');
const bureauRequestRoutes = require('../routes/bureauRequests');
const livnexTrackingRoutes = require('../routes/livnexTracking');
const caRecommendationRoutes = require('../routes/caRecommendations');

app.use('/api/loan-applications', loanApplicationRoutes);
app.use('/api/bureau-requests', bureauRequestRoutes);
app.use('/api/debt-items', debtItemRoutes);
app.use('/api/livnex-tracking', livnexTrackingRoutes);
app.use('/api/ca-recommendations', caRecommendationRoutes);

const adminToken = getTestToken('admin');
const viewerToken = getTestToken('data_user');

// Wait for DB init before running tests
beforeAll(async () => {
  await waitForDb(1500);
});

describe('DOC2026 API Integration Tests', () => {
  // =============================================
  // AUTH: ทดสอบ authentication
  // =============================================
  describe('Authentication', () => {
    it('should reject requests without token', async () => {
      const res = await request(app).get('/api/loan-applications/customer/1');
      expect(res.status).toBe(401);
    });

    it('should reject requests with invalid token', async () => {
      const res = await request(app)
        .get('/api/loan-applications/customer/1')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.status).toBe(403);
    });

    it('should accept requests with valid token', async () => {
      const res = await request(app)
        .get('/api/loan-applications/customer/99999')
        .set('Authorization', `Bearer ${adminToken}`);
      // 200 with empty array (customer doesn't exist but query succeeds)
      expect(res.status).toBe(200);
    });
  });

  // =============================================
  // LOAN APPLICATIONS
  // =============================================
  describe('Loan Applications API', () => {
    let createdAppId;

    it('GET /customer/:id - should return array', async () => {
      const res = await request(app)
        .get('/api/loan-applications/customer/99999')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /customer/:id - should reject invalid id', async () => {
      const res = await request(app)
        .get('/api/loan-applications/customer/abc')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
    });

    it('POST / - should create loan application with auto APP-IN', async () => {
      const res = await request(app)
        .post('/api/loan-applications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ customer_id: 4117, application_date: '2026-03-09' });
      expect(res.status).toBe(201);
      expect(res.body.application).toBeDefined();
      expect(res.body.application.app_in_number).toMatch(/^APPIN-\d{4}-\d{4}$/);
      createdAppId = res.body.application.id;
    });

    it('POST / - should reject without customer_id', async () => {
      const res = await request(app)
        .post('/api/loan-applications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('POST / - data_user should not be able to create', async () => {
      const res = await request(app)
        .post('/api/loan-applications')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ customer_id: 4117 });
      expect(res.status).toBe(403);
    });

    it('GET /:id/next-statuses - should return allowed transitions', async () => {
      if (!createdAppId) return;
      const res = await request(app)
        .get(`/api/loan-applications/${createdAppId}/next-statuses`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.currentStatus).toBe('new');
      expect(res.body.allowedTransitions).toContain('document_check');
      expect(res.body.allowedTransitions).toContain('cancelled');
    });

    it('PUT /:id - should update status with valid transition', async () => {
      if (!createdAppId) return;
      const res = await request(app)
        .put(`/api/loan-applications/${createdAppId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ loan_status: 'document_check' });
      expect(res.status).toBe(200);
    });

    it('PUT /:id - should reject invalid status transition', async () => {
      if (!createdAppId) return;
      const res = await request(app)
        .put(`/api/loan-applications/${createdAppId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ loan_status: 'approved' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot transition');
    });

    // Cleanup
    afterAll(async () => {
      if (createdAppId) {
        const { db } = require('../database');
        await new Promise((resolve) => {
          db.run('DELETE FROM loan_applications WHERE id = ?', [createdAppId], resolve);
        });
      }
    });
  });

  // =============================================
  // DEBT ITEMS
  // =============================================
  describe('Debt Items API', () => {
    let createdDebtId;

    it('GET /customer/:id - should return array', async () => {
      const res = await request(app)
        .get('/api/debt-items/customer/4117')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST / - should create debt item with auto-calculation', async () => {
      const res = await request(app)
        .post('/api/debt-items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer_id: 4117,
          debt_type: 'revolving_credit_card',
          creditor_name: 'Test Bank',
          outstanding_balance: 100000,
          monthly_payment: 5000,
        });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      createdDebtId = res.body.id;
    });

    it('POST / - should reject invalid debt_type', async () => {
      const res = await request(app)
        .post('/api/debt-items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          customer_id: 4117,
          debt_type: 'invalid_type',
          outstanding_balance: 100000,
        });
      expect(res.status).toBe(400);
    });

    it('POST / - should reject missing customer_id', async () => {
      const res = await request(app)
        .post('/api/debt-items')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ debt_type: 'installment', outstanding_balance: 100000 });
      expect(res.status).toBe(400);
    });

    it('GET /customer/:id/summary - should return total', async () => {
      const res = await request(app)
        .get('/api/debt-items/customer/4117/summary')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalDebt');
      expect(typeof res.body.totalDebt).toBe('number');
    });

    it('GET /customer/:id/dsr - should return DSR data', async () => {
      const res = await request(app)
        .get('/api/debt-items/customer/4117/dsr')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('dsr');
      expect(res.body).toHaveProperty('totalDebt');
      expect(res.body).toHaveProperty('income');
    });

    it('DELETE /:id - should require admin role', async () => {
      if (!createdDebtId) return;
      const res = await request(app)
        .delete(`/api/debt-items/${createdDebtId}`)
        .set('Authorization', `Bearer ${viewerToken}`);
      expect(res.status).toBe(403);
    });

    // Cleanup
    afterAll(async () => {
      if (createdDebtId) {
        const { db } = require('../database');
        await new Promise((resolve) => {
          db.run('DELETE FROM debt_items WHERE id = ?', [createdDebtId], resolve);
        });
      }
    });
  });

  // =============================================
  // BUREAU REQUESTS
  // =============================================
  describe('Bureau Requests API', () => {
    it('GET /customer/:id - should return array', async () => {
      const res = await request(app)
        .get('/api/bureau-requests/customer/4117')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /customer/:id/recent - should check 3-month duplicate', async () => {
      const res = await request(app)
        .get('/api/bureau-requests/customer/4117/recent')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('hasDuplicate');
    });

    it('POST / - should reject without customer_id', async () => {
      const res = await request(app)
        .post('/api/bureau-requests')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // =============================================
  // LIVNEX TRACKING
  // =============================================
  describe('LivNex Tracking API', () => {
    it('GET /customer/:id - should return array', async () => {
      const res = await request(app)
        .get('/api/livnex-tracking/customer/4117')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST / - should reject without customer_id', async () => {
      const res = await request(app)
        .post('/api/livnex-tracking')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // =============================================
  // CA RECOMMENDATIONS
  // =============================================
  describe('CA Recommendations API', () => {
    it('GET /customer/:id - should return array', async () => {
      const res = await request(app)
        .get('/api/ca-recommendations/customer/4117')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST / - should reject without customer_id', async () => {
      const res = await request(app)
        .post('/api/ca-recommendations')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('PUT /:id - should reject invalid id', async () => {
      const res = await request(app)
        .put('/api/ca-recommendations/abc')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ problem_description: 'test' });
      expect(res.status).toBe(400);
    });
  });
});
