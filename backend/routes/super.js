const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase');
const { verifyToken, isSuperAdmin } = require('../middleware/auth');

/**
 * GET /api/super/complaints
 * Fetch all complaints with identity mapping (SUPER HEAD ONLY)
 */
router.get('/complaints', verifyToken, isSuperAdmin, async (req, res) => {
    try {
        const complaintsSnapshot = await db.collection('complaints')
            .orderBy('createdAt', 'desc')
            .get();

        const combinedData = await Promise.all(
            complaintsSnapshot.docs.map(async (doc) => {
                const complaint = { id: doc.id, ...doc.data() };
                const trackingId = complaint.trackingId;

                // Join with identity_map
                const identitySnapshot = await db.collection('identity_map')
                    .where('trackingId', '==', trackingId)
                    .limit(1)
                    .get();

                if (!identitySnapshot.empty) {
                    const identity = identitySnapshot.docs[0].data();
                    return {
                        ...complaint,
                        name: identity.name || null,
                        email: identity.email || null,
                        phone: identity.phone || null,
                    };
                }

                return {
                    ...complaint,
                    name: null,
                    email: null,
                    phone: null,
                };
            })
        );

        res.status(200).json({ success: true, total: combinedData.length, data: combinedData });
    } catch (error) {
        console.error('Super Head fetch complaints error:', error.message);
        res.status(500).json({ error: 'Failed to fetch complaints with identity data.' });
    }
});

/**
 * GET /api/super/complaints/:trackingId
 * Fetch specific complaint by trackingId with identity mapping
 */
router.get('/complaints/:trackingId', verifyToken, isSuperAdmin, async (req, res) => {
    try {
        const trackingId = req.params.trackingId;

        // 1. Get complaint
        const compSnapshot = await db.collection('complaints')
            .where('trackingId', '==', trackingId)
            .limit(1)
            .get();

        if (compSnapshot.empty) {
            return res.status(404).json({ error: 'Complaint not found.' });
        }

        const complaint = compSnapshot.docs[0].data();

        // 2. Get identity
        const identSnapshot = await db.collection('identity_map')
            .where('trackingId', '==', trackingId)
            .limit(1)
            .get();

        const identity = !identSnapshot.empty ? identSnapshot.docs[0].data() : {};

        res.status(200).json({
            success: true,
            data: {
                ...complaint,
                name: identity.name || null,
                email: identity.email || null,
                phone: identity.phone || null,
            },
        });
    } catch (error) {
        console.error('Super Head fetch single complaint error:', error.message);
        res.status(500).json({ error: 'Failed to fetch complaint details.' });
    }
});

module.exports = router;
