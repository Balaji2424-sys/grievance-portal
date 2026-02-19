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
    const { FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL } = process.env;

    if (FIREBASE_PROJECT_ID && FIREBASE_PRIVATE_KEY && FIREBASE_CLIENT_EMAIL) {
        // Vercel sometimes wraps the key in quotes or escapes the newlines differently
        let privateKey = FIREBASE_PRIVATE_KEY;
        if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.substring(1, privateKey.length - 1);
        }
        privateKey = privateKey.replace(/\\n/g, '\n');

        serviceAccount = {
            projectId: FIREBASE_PROJECT_ID,
            privateKey: privateKey,
            clientEmail: FIREBASE_CLIENT_EMAIL,
        };
        console.log('[Firebase] Initializing with environment variables for Project:', FIREBASE_PROJECT_ID);
    } else {
        console.error('[Firebase] ERROR: Environment variables are missing:', {
            hasProjectId: !!FIREBASE_PROJECT_ID,
            hasPrivateKey: !!FIREBASE_PRIVATE_KEY,
            hasClientEmail: !!FIREBASE_CLIENT_EMAIL
        });
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
