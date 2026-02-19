const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase');
const { generateTrackingId } = require('../services/tracking');

/**
 * ============================================
 * GET /api/complaints
 * (Optional: For admin/debug — no auth for now)
 * ============================================
 */
router.get('/', async (req, res) => {
    try {
        const snapshot = await db
            .collection('complaints')
            .orderBy('createdAt', 'desc')
            .get();

        const complaints = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));

        res.status(200).json({ success: true, data: complaints });
    } catch (error) {
        console.error('Error fetching complaints:', error.message);
        res.status(500).json({ error: 'Failed to fetch complaints.' });
    }
});

/**
 * ============================================
 * GET /api/complaints/:id
 * Fetch complaint by tracking ID (PUBLIC)
 * ============================================
 */
router.get('/:id', async (req, res) => {
    try {
        const trackingId = req.params.id;

        const snapshot = await db
            .collection('complaints')
            .where('trackingId', '==', trackingId)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ error: 'Complaint not found.' });
        }

        const doc = snapshot.docs[0];
        const data = doc.data();

        // Remove sensitive fields
        const { userId, email, phone, name, ...safeData } = data;

        res.status(200).json({
            success: true,
            data: { id: doc.id, ...safeData },
        });
    } catch (error) {
        console.error('Error fetching complaint:', error.message);
        res.status(500).json({ error: 'Failed to fetch complaint.' });
    }
});

/**
 * ============================================
 * POST /api/complaints
 * Submit complaint (NO AUTH — anonymous)
 * ============================================
 */
router.post('/', async (req, res) => {
    try {
        const { title, description, category, name, email, phone } = req.body;

        if (!title || !description || !category) {
            return res.status(400).json({
                error: 'title, description, and category are required.',
            });
        }

        const trackingId = generateTrackingId();
        const timestamp = new Date().toISOString();

        // 1. Complaint data (NO identity fields)
        const newComplaint = {
            title,
            description,
            category,
            trackingId,
            status: 'Pending',
            createdAt: timestamp,
            updatedAt: timestamp,
        };

        // 2. Identity data (PRIVATE)
        const identityData = {
            trackingId,
            name: name || null,
            email: email || null,
            phone: phone || null,
            createdAt: timestamp,
        };

        // Use a batch to ensure both are saved or neither
        const batch = db.batch();

        const complaintRef = db.collection('complaints').doc();
        const identityRef = db.collection('identity_map').doc();

        batch.set(complaintRef, newComplaint);
        batch.set(identityRef, identityData);

        await batch.commit();

        res.status(201).json({
            success: true,
            message: 'Complaint submitted successfully.',
            data: { trackingId },
        });
    } catch (error) {
        console.error('Error submitting complaint:', error.message);
        res.status(500).json({ error: 'Failed to submit complaint.' });
    }
});

/**
 * ============================================
 * PATCH /api/complaints/:id/status
 * Update status (ADMIN — no auth for now)
 * ============================================
 */
router.patch('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            'Pending',
            'In Progress',
            'Resolved',
            'Rejected',
            'Cancelled',
        ];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                error: `Status must be one of: ${allowedStatuses.join(', ')}`,
            });
        }

        const docRef = db.collection('complaints').doc(req.params.id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Complaint not found.' });
        }

        await docRef.update({
            status,
            updatedAt: new Date().toISOString(),
        });

        res.status(200).json({
            success: true,
            message: 'Complaint status updated.',
        });
    } catch (error) {
        console.error('Error updating status:', error.message);
        res.status(500).json({ error: 'Failed to update status.' });
    }
});

/**
 * ============================================
 * DELETE /api/complaints/:id
 * (Optional — no auth for hackathon)
 * ============================================
 */
router.delete('/:id', async (req, res) => {
    try {
        const docRef = db.collection('complaints').doc(req.params.id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Complaint not found.' });
        }

        await docRef.delete();

        res.status(200).json({
            success: true,
            message: 'Complaint deleted successfully.',
        });
    } catch (error) {
        console.error('Error deleting complaint:', error.message);
        res.status(500).json({ error: 'Failed to delete complaint.' });
    }
});

module.exports = router;
