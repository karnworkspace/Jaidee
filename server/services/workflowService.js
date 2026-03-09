/**
 * Workflow State Machine Service
 * Controls loan_status transitions per DOC2026 flow
 */

/**
 * Valid status transitions map
 * Key = current status, Value = array of allowed next statuses
 */
const ALLOWED_TRANSITIONS = {
  new:                     ['document_check', 'cancelled'],
  document_check:          ['document_incomplete', 'bureau_check', 'cancelled'],
  document_incomplete:     ['document_check', 'cancelled'],
  bureau_check:            ['analyzing', 'cancelled'],
  analyzing:               ['approved', 'rejected', 'cancelled'],
  approved:                ['transferred', 'cancelled_after_approval'],
  rejected:                ['new'],
  transferred:             [],
  cancelled:               ['new'],
  cancelled_after_approval:['new']
};

/** All valid statuses */
const ALL_STATUSES = Object.keys(ALLOWED_TRANSITIONS);

/**
 * Check if a status transition is allowed
 * @param {string} currentStatus
 * @param {string} newStatus
 * @returns {{ valid: boolean, message: string }}
 */
const validateTransition = (currentStatus, newStatus) => {
  if (!ALL_STATUSES.includes(currentStatus)) {
    return { valid: false, message: `Invalid current status: ${currentStatus}` };
  }
  if (!ALL_STATUSES.includes(newStatus)) {
    return { valid: false, message: `Invalid target status: ${newStatus}` };
  }
  if (currentStatus === newStatus) {
    return { valid: true, message: 'No change' };
  }

  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed.includes(newStatus)) {
    return {
      valid: false,
      message: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: [${allowed.join(', ')}]`
    };
  }
  return { valid: true, message: 'OK' };
};

/**
 * Get allowed next statuses for a given status
 * @param {string} currentStatus
 * @returns {string[]}
 */
const getNextStatuses = (currentStatus) => {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
};

module.exports = {
  ALLOWED_TRANSITIONS,
  ALL_STATUSES,
  validateTransition,
  getNextStatuses
};
