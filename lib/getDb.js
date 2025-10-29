// app/lib/getDb.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'

import admin from 'firebase-admin';

const HARD_DB_URL =
    'https://buckingham-secret-santa-default-rtdb.europe-west1.firebasedatabase.app';

function resolveDatabaseURL() {
    console.log(process.env.FIREBASE_DATABASE_URL);
    console.log(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL);

    // Prefer server-only var → public var → FIREBASE_CONFIG → final hardcoded fallback
    const fromServer = process.env.FIREBASE_DATABASE_URL;
    const fromPublic = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

    let fromConfig;
    try {
        if (process.env.FIREBASE_CONFIG) {
            const cfg = JSON.parse(process.env.FIREBASE_CONFIG);
            fromConfig = cfg.databaseURL;
        }
    } catch (_) {
        // ignore parse errors
    }

    return fromServer || fromPublic || fromConfig || HARD_DB_URL;
}

export function getDb() {
    if (!admin.apps.length) {
        const databaseURL = resolveDatabaseURL();

        // Use ADC so you don't need Secret Manager for a private key
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            databaseURL,
        });
    }
    return admin.database();
}
