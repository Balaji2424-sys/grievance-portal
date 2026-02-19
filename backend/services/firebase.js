const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// ─── Load Service Account Key ──────────────────────────────────────────────────
// ─── Load Service Account Key ──────────────────────────────────────────────────
const serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error(
        '[Firebase] ERROR: serviceAccountKey.json not found at:',
        serviceAccountPath,
        '\nDownload it from Firebase Console → Project Settings → Service Accounts.'
    );
    process.exit(1);
}

let serviceAccount;
try {
    serviceAccount = require(serviceAccountPath);
} catch (error) {
    console.error('[Firebase] ERROR: Failed to parse serviceAccountKey.json:', error.message);
    process.exit(1);
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
