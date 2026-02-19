const { admin } = require('../services/firebase');

// ─── Config ─────────────────────────────────────────────
// Set to false for hackathon (no auth required)
// Set to true later when you implement Firebase login
const AUTH_ENABLED = false;

// ─── Roles ─────────────────────────────────────────────
const ROLES = Object.freeze(['student', 'committee', 'admin', 'super_admin']);

// ─── 1. verifyToken ─────────────────────────────────────
const verifyToken = async (req, res, next) => {

    // 🚀 HACKATHON MODE (Auth Disabled)
    if (!AUTH_ENABLED) {
        req.user = {
            uid: "demo-user",
            role: "super_admin" // give highest privilege for demo
        };
        return next();
    }

    // 🔐 PRODUCTION MODE
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided.' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    try {
        req.user = await admin.auth().verifyIdToken(idToken);
        next();
    } catch (error) {
        console.error('[Auth] Token verification failed:', error.message);
        return res.status(403).json({ error: 'Forbidden: Invalid or expired token.' });
    }
};

// ─── 2. requireRole ─────────────────────────────────────
const requireRole = (...allowedRoles) => {

    // Validate roles
    const unknown = allowedRoles.filter(r => !ROLES.includes(r));
    if (unknown.length) {
        throw new Error(`[Auth] Unknown role(s): ${unknown.join(', ')}`);
    }

    return (req, res, next) => {

        // 🚀 HACKATHON MODE
        if (!AUTH_ENABLED) return next();

        const userRole = req.user && req.user.role;

        if (!userRole) {
            return res.status(403).json({
                error: 'Forbidden: No role assigned.',
            });
        }

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: `Forbidden: Requires role ${allowedRoles.join(', ')}`,
            });
        }

        next();
    };
};

// ─── 3. Role Helpers ────────────────────────────────────
const isStudent = requireRole('student', 'committee', 'admin', 'super_admin');
const isCommittee = requireRole('committee', 'admin', 'super_admin');
const isAdmin = requireRole('admin', 'super_admin');
const isSuperAdmin = requireRole('super_admin');

// ─── 4. verifyAdmin ─────────────────────────────────────
const verifyAdmin = async (req, res, next) => {

    // 🚀 HACKATHON MODE
    if (!AUTH_ENABLED) return next();

    try {
        const userRecord = await admin.auth().getUser(req.user.uid);

        const hasAdminClaim =
            userRecord.customClaims &&
            userRecord.customClaims.admin === true;

        if (!hasAdminClaim) {
            return res.status(403).json({
                error: 'Forbidden: Admin access required.'
            });
        }

        next();
    } catch (error) {
        console.error('[Auth] Admin verification failed:', error.message);
        return res.status(500).json({
            error: 'Failed to verify admin status.'
        });
    }
};

module.exports = {
    ROLES,
    verifyToken,
    requireRole,
    isStudent,
    isCommittee,
    isAdmin,
    isSuperAdmin,
    verifyAdmin,
};
