/**
 * Unit Tests: Workflow State Machine (workflowService.js)
 */
const { validateTransition, getNextStatuses, ALL_STATUSES, ALLOWED_TRANSITIONS } = require('../services/workflowService');

describe('workflowService', () => {
  describe('ALL_STATUSES', () => {
    it('should contain all 10 statuses', () => {
      expect(ALL_STATUSES).toHaveLength(10);
      expect(ALL_STATUSES).toContain('new');
      expect(ALL_STATUSES).toContain('transferred');
      expect(ALL_STATUSES).toContain('cancelled_after_approval');
    });
  });

  describe('validateTransition', () => {
    // Happy path transitions
    const validTransitions = [
      ['new', 'document_check'],
      ['new', 'cancelled'],
      ['document_check', 'bureau_check'],
      ['document_check', 'document_incomplete'],
      ['document_incomplete', 'document_check'],
      ['bureau_check', 'analyzing'],
      ['analyzing', 'approved'],
      ['analyzing', 'rejected'],
      ['approved', 'transferred'],
      ['approved', 'cancelled_after_approval'],
      ['rejected', 'new'],
      ['cancelled', 'new'],
      ['cancelled_after_approval', 'new'],
    ];

    test.each(validTransitions)(
      '%s → %s should be valid',
      (from, to) => {
        const result = validateTransition(from, to);
        expect(result.valid).toBe(true);
      }
    );

    // Invalid transitions
    const invalidTransitions = [
      ['new', 'approved'],
      ['new', 'analyzing'],
      ['document_check', 'approved'],
      ['bureau_check', 'approved'],
      ['analyzing', 'transferred'],
      ['approved', 'analyzing'],
      ['rejected', 'approved'],
      ['transferred', 'new'],
      ['transferred', 'cancelled'],
    ];

    test.each(invalidTransitions)(
      '%s → %s should be invalid',
      (from, to) => {
        const result = validateTransition(from, to);
        expect(result.valid).toBe(false);
        expect(result.message).toContain('Cannot transition');
      }
    );

    it('same status → same status should be valid (no change)', () => {
      const result = validateTransition('analyzing', 'analyzing');
      expect(result.valid).toBe(true);
      expect(result.message).toBe('No change');
    });

    it('invalid current status should return error', () => {
      const result = validateTransition('nonexistent', 'new');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Invalid current status');
    });

    it('invalid target status should return error', () => {
      const result = validateTransition('new', 'nonexistent');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Invalid target status');
    });
  });

  describe('getNextStatuses', () => {
    it('new → [document_check, cancelled]', () => {
      expect(getNextStatuses('new')).toEqual(['document_check', 'cancelled']);
    });

    it('transferred → [] (terminal state)', () => {
      expect(getNextStatuses('transferred')).toEqual([]);
    });

    it('unknown status → []', () => {
      expect(getNextStatuses('nonexistent')).toEqual([]);
    });

    it('analyzing → [approved, rejected, cancelled]', () => {
      expect(getNextStatuses('analyzing')).toEqual(['approved', 'rejected', 'cancelled']);
    });
  });

  describe('Terminal states', () => {
    it('transferred should have no transitions', () => {
      expect(ALLOWED_TRANSITIONS.transferred).toEqual([]);
    });

    it('all terminal transitions should be defined', () => {
      for (const status of ALL_STATUSES) {
        expect(ALLOWED_TRANSITIONS).toHaveProperty(status);
        expect(Array.isArray(ALLOWED_TRANSITIONS[status])).toBe(true);
      }
    });
  });
});
