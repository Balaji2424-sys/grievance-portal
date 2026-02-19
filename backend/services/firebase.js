const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// ─── Load Service Account Key ──────────────────────────────────────────────────
const serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json');
let serviceAccount;

if (fs.existsSync(serviceAccountPath)) {
    try {
        serviceAccount = require(serviceAccountPath);
    } catch (error) {
        console.warn('[Firebase] Warning: Failed to parse serviceAccountKey.json:', error.message);
    }
}

// Fallback to environment variables if file is missing or invalid
if (!serviceAccount) {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
        serviceAccount = {
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        };
        console.log('[Firebase] Using environment variables for initialization.');
    } else {
        console.error(
            '[Firebase] ERROR: No serviceAccountKey.json found and environment variables are incomplete.\n' +
            'Please set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL.'
        );
        // Only exit in production-like environments or if explicitly needed. 
        // For local dev with the file, this block won't be reached.
    }
}

// ─── Initialize Firebase Admin SDK ────────────────────────────────────────────
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('[Firebase] Admin SDK initialized successfully.');
    } catch (error) {
        console.error('[Firebase] ERROR: Failed to initialize Admin SDK:', error.message);
        process.exit(1);
    }
}

// ─── Firestore Instance ───────────────────────────────────────────────────────
const db = admin.firestore();

// Optional: configure Firestore settings
db.settings({ ignoreUndefinedProperties: true });

module.exports = { admin, db };
