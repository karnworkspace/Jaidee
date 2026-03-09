/**
 * Unit Tests: Debt Calculation Logic (DOC2026 rules)
 *
 * Tests the auto-calculation rules extracted from database.js insertDebtItem/updateDebtItem.
 * We test the pure calculation logic without DB dependency.
 */

/**
 * Calculate payment per DOC2026 rules (extracted from database.js)
 * @param {string} debtType
 * @param {number} outstandingBalance
 * @param {number} monthlyPayment
 * @returns {number}
 */
function calculateDebtPayment(debtType, outstandingBalance, monthlyPayment) {
  switch (debtType) {
    case 'revolving_personal':
    case 'revolving_other':
      return outstandingBalance * 0.05;
    case 'revolving_credit_card':
      return outstandingBalance * 0.08;
    case 'installment':
      return monthlyPayment > outstandingBalance ? outstandingBalance : monthlyPayment;
    case 'joint_loan':
      return monthlyPayment / 2;
    default:
      return monthlyPayment;
  }
}

/**
 * Calculate DSR (Debt Service Ratio)
 * @param {number} totalDebt
 * @param {number} income
 * @returns {number}
 */
function calculateDSR(totalDebt, income) {
  if (!income || income <= 0) return 0;
  return Math.round((totalDebt / income) * 10000) / 100;
}

describe('Debt Calculation (DOC2026)', () => {
  describe('revolving_personal (5%)', () => {
    it('should calculate 5% of outstanding balance', () => {
      expect(calculateDebtPayment('revolving_personal', 100000, 5000)).toBe(5000);
    });

    it('should handle zero balance', () => {
      expect(calculateDebtPayment('revolving_personal', 0, 5000)).toBe(0);
    });

    it('should ignore monthly_payment', () => {
      expect(calculateDebtPayment('revolving_personal', 200000, 999)).toBe(10000);
    });
  });

  describe('revolving_other (5%)', () => {
    it('should calculate 5% of outstanding balance', () => {
      expect(calculateDebtPayment('revolving_other', 50000, 3000)).toBe(2500);
    });
  });

  describe('revolving_credit_card (8%)', () => {
    it('should calculate 8% of outstanding balance', () => {
      expect(calculateDebtPayment('revolving_credit_card', 100000, 5000)).toBe(8000);
    });

    it('should handle small balance', () => {
      expect(calculateDebtPayment('revolving_credit_card', 1000, 500)).toBe(80);
    });
  });

  describe('installment', () => {
    it('should use monthly_payment when less than balance', () => {
      expect(calculateDebtPayment('installment', 500000, 10000)).toBe(10000);
    });

    it('should cap at outstanding_balance when payment exceeds it', () => {
      expect(calculateDebtPayment('installment', 5000, 10000)).toBe(5000);
    });

    it('should equal when payment equals balance', () => {
      expect(calculateDebtPayment('installment', 10000, 10000)).toBe(10000);
    });
  });

  describe('joint_loan (÷2)', () => {
    it('should halve monthly_payment', () => {
      expect(calculateDebtPayment('joint_loan', 500000, 20000)).toBe(10000);
    });

    it('should handle odd numbers', () => {
      expect(calculateDebtPayment('joint_loan', 500000, 15001)).toBe(7500.5);
    });
  });

  describe('legacy/default', () => {
    it('should use monthly_payment as-is for legacy type', () => {
      expect(calculateDebtPayment('legacy', 100000, 3000)).toBe(3000);
    });

    it('should use monthly_payment for unknown types', () => {
      expect(calculateDebtPayment('unknown_type', 100000, 7777)).toBe(7777);
    });
  });

  describe('DSR Calculation', () => {
    it('should calculate DSR correctly', () => {
      // totalDebt=15000, income=50000 → 30%
      expect(calculateDSR(15000, 50000)).toBe(30);
    });

    it('should round to 2 decimal places', () => {
      // 10000/30000 = 33.3333... → 33.33
      expect(calculateDSR(10000, 30000)).toBe(33.33);
    });

    it('should return 0 for zero income', () => {
      expect(calculateDSR(10000, 0)).toBe(0);
    });

    it('should return 0 for negative income', () => {
      expect(calculateDSR(10000, -5000)).toBe(0);
    });

    it('should handle zero debt', () => {
      expect(calculateDSR(0, 50000)).toBe(0);
    });

    it('DSR > 40% should indicate high risk', () => {
      const dsr = calculateDSR(25000, 50000);
      expect(dsr).toBe(50);
      expect(dsr).toBeGreaterThan(40);
    });
  });

  describe('Multi-debt DSR scenario', () => {
    it('should calculate combined DSR from multiple debt items', () => {
      const debts = [
        { type: 'revolving_personal', balance: 100000, monthly: 0 },
        { type: 'revolving_credit_card', balance: 50000, monthly: 0 },
        { type: 'installment', balance: 500000, monthly: 12000 },
        { type: 'joint_loan', balance: 300000, monthly: 8000 },
      ];

      const totalCalculated = debts.reduce((sum, d) => {
        return sum + calculateDebtPayment(d.type, d.balance, d.monthly);
      }, 0);

      // 5000 + 4000 + 12000 + 4000 = 25000
      expect(totalCalculated).toBe(25000);

      const income = 60000;
      const dsr = calculateDSR(totalCalculated, income);
      // 25000/60000*100 = 41.67%
      expect(dsr).toBe(41.67);
    });
  });
});
