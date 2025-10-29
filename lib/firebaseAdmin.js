import admin from 'firebase-admin';


let app;
if (!admin.apps.length) {
    app = admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
} else {
    app = admin.app();
}


export const dbAdmin = admin.database();
export const FieldValue = admin.firestore?.FieldValue; // not used but handy