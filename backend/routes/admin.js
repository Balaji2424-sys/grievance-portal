const express = require('express');
const router = express.Router();
const { db, admin } = require('../services/firebase');
const { verifyToken, verifyAdmin, isAdmin } = require('../middleware/auth');
const { isValidStatus, validateTransition, STATUSES } = require('../services/statusWorkflow');

// GET /api/admin/complaints - Get all complaints (admin only)
router.get('/complaints', verifyToken, isAdmin, async (req, res) => {
    try {
        const snapshot = await db.collection('complaints')
            .orderBy('createdAt', 'desc')
            .get();

        const complaints = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        res.status(200).json({ success: true, total: complaints.length, data: complaints });
    } catch (error) {
        console.error('Admin fetch complaints error:', error.message);
        res.status(500).json({ error: 'Failed to fetch complaints.' });
    }
});

// PATCH /api/admin/complaints/:id - Update complaint status (admin only)
router.patch('/complaints/:id', verifyToken, isAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        if (!status || !isValidStatus(status)) {
            return res.status(400).json({
                error: `Invalid status. Allowed: ${STATUSES.join(', ')}`,
            });
        }

        const docRef = db.collection('complaints').doc(req.params.id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Complaint not found.' });
        }

        const currentStatus = doc.data().status;

        const transition = validateTransition(currentStatus, status);
        if (!transition.allowed) {
            return res.status(400).json({
                error: transition.reason,
            });
        }

        await docRef.update({
            status,
            updatedAt: new Date().toISOString(),
        });

        res.status(200).json({ success: true, message: `Complaint status updated to "${status}".` });
    } catch (error) {
        console.error('Admin update complaint error:', error.message);
        res.status(500).json({ error: 'Failed to update complaint.' });
    }
});

// GET /api/admin/users - Get all registered users (admin only)
router.get('/users', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const listUsersResult = await admin.auth().listUsers(1000);
        const users = listUsersResult.users.map((user) => ({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || null,
            disabled: user.disabled,
            createdAt: user.metadata.creationTime,
        }));

        res.status(200).json({ success: true, total: users.length, data: users });
    } catch (error) {
        console.error('Admin list users error:', error.message);
        res.status(500).json({ error: 'Failed to fetch users.' });
    }
});

// POST /api/admin/users/:uid/set-admin - Grant or revoke admin role
router.post('/users/:uid/set-admin', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const { isAdmin } = req.body;

        if (typeof isAdmin !== 'boolean') {
            return res.status(400).json({ error: '`isAdmin` must be a boolean (true or false).' });
        }

        await admin.auth().setCustomUserClaims(req.params.uid, { admin: isAdmin });

        res.status(200).json({
            success: true,
            message: `User ${req.params.uid} admin status set to ${isAdmin}.`,
        });
    } catch (error) {
        console.error('Set admin claim error:', error.message);
        res.status(500).json({ error: 'Failed to update user claims.' });
    }
});

// GET /api/admin/stats - Dashboard statistics (admin only)
router.get('/stats', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const snapshot = await db.collection('complaints').get();
        const complaints = snapshot.docs.map((doc) => doc.data());

        const stats = {
            total: complaints.length,
            pending: complaints.filter((c) => c.status === 'Pending').length,
            underReview: complaints.filter((c) => c.status === 'Under Review').length,
            investigation: complaints.filter((c) => c.status === 'Investigation').length,
            resolved: complaints.filter((c) => c.status === 'Resolved').length,
            rejected: complaints.filter((c) => c.status === 'Rejected').length,
        };

        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('Admin stats error:', error.message);
        res.status(500).json({ error: 'Failed to fetch stats.' });
    }
});

module.exports = router;
