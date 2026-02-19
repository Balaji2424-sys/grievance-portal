/**
 * Status workflow for grievance complaints.
 *
 * Allowed progression (strictly forward only):
 *
 *   submitted → under_review → investigation → resolved
 *
 * No skipping, no going backwards.
 */

// Ordered list of all valid statuses
const STATUSES = Object.freeze([
    'Pending',
    'Under Review',
    'Investigation',
    'Resolved',
    'Rejected',
]);

// Allowed transitions: maps each status to the statuses it can move to.
const TRANSITIONS = Object.freeze({
    'Pending': ['Under Review', 'Rejected'],
    'Under Review': ['Investigation', 'Resolved', 'Rejected'],
    'Investigation': ['Resolved', 'Rejected'],
    'Resolved': [],   // terminal
    'Rejected': [],   // terminal
});

/**
 * Returns true if the given string is a recognised status.
 * @param {string} status
 * @returns {boolean}
 */
function isValidStatus(status) {
    return STATUSES.includes(status);
}

/**
 * Validates whether a transition from `currentStatus` to `nextStatus` is allowed.
 *
 * @param {string} currentStatus - The complaint's present status
 * @param {string} nextStatus    - The requested new status
 * @returns {{ allowed: boolean, reason?: string }}
 *
 * @example
 *   validateTransition('submitted', 'under_review')
 *   // → { allowed: true }
 *
 *   validateTransition('resolved', 'submitted')
 *   // → { allowed: false, reason: '"resolved" is a terminal status and cannot be changed.' }
 */
function validateTransition(currentStatus, nextStatus) {
    if (!isValidStatus(currentStatus)) {
        return {
            allowed: false,
            reason: `Current status "${currentStatus}" is not a recognised status.`,
        };
    }

    if (!isValidStatus(nextStatus)) {
        return {
            allowed: false,
            reason: `"${nextStatus}" is not a valid status. Valid statuses: ${STATUSES.join(', ')}.`,
        };
    }

    if (currentStatus === nextStatus) {
        return {
            allowed: false,
            reason: `Complaint is already "${currentStatus}".`,
        };
    }

    const allowed = TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(nextStatus)) {
        const terminal = allowed.length === 0;
        return {
            allowed: false,
            reason: terminal
                ? `"${currentStatus}" is a terminal status and cannot be changed.`
                : `Cannot transition from "${currentStatus}" to "${nextStatus}". Allowed: "${allowed.join('", "')}".`,
        };
    }

    return { allowed: true };
}

module.exports = { STATUSES, TRANSITIONS, isValidStatus, validateTransition };
