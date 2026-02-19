const express = require('express');
const router = express.Router();
const { db } = require('../services/firebase');

// POST /api/messages/:trackingId - Send a message in a complaint thread
router.post('/:trackingId', async (req, res) => {
    try {
        const { trackingId } = req.params;
        const { sender, text } = req.body;

        // 1. Validate required fields
        if (!sender || !text) {
            return res.status(400).json({ error: 'sender and text are required.' });
        }

        const allowedSenders = ['admin', 'user', 'super'];
        if (!allowedSenders.includes(sender)) {
            return res.status(400).json({
                error: `sender must be one of: ${allowedSenders.join(', ')}.`,
            });
        }

        if (text.trim() === '') {
            return res.status(400).json({ error: 'Message text cannot be empty.' });
        }

        // 2. Verify the complaint exists using trackingId
        const complaintSnapshot = await db.collection('complaints')
            .where('trackingId', '==', trackingId)
            .limit(1)
            .get();

        if (complaintSnapshot.empty) {
            return res.status(404).json({ error: 'Complaint not found.' });
        }

        // 3. Persist the message
        const newMessage = {
            complaintId: trackingId, // Use trackingId as the link
            sender,
            text: text.trim(),
            timestamp: new Date().toISOString(),
        };

        const docRef = await db.collection('messages').add(newMessage);

        res.status(201).json({
            success: true,
            message: 'Message sent.',
            data: { id: docRef.id, ...newMessage },
        });
    } catch (error) {
        console.error('Error sending message:', error.message);
        res.status(500).json({ error: 'Failed to send message.' });
    }
});

// GET /api/messages/:trackingId - Get all messages for a complaint (oldest first)
router.get('/:trackingId', async (req, res) => {
    try {
        const { trackingId } = req.params;

        // 1. Fetch messages for the trackingId
        const snapshot = await db
            .collection('messages')
            .where('complaintId', '==', trackingId)
            .get();

        const messages = snapshot.docs
            .map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }))
            .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));

        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        console.error('Error fetching messages:', error.message);
        res.status(500).json({ error: 'Failed to fetch messages.' });
    }
});

module.exports = router;
