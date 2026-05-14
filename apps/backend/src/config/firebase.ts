import * as admin from 'firebase-admin';

// Initialize the Firebase Admin App
if (!admin.apps.length) {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson) {
        try {
            const serviceAccount = JSON.parse(serviceAccountJson);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('Firebase Admin initialized via FIREBASE_SERVICE_ACCOUNT_JSON');
        } catch (error) {
            console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', error);
            // Fallback to default
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
            });
        }
    } else {
        // Fallback to GOOGLE_APPLICATION_CREDENTIALS path
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
    }
}

export const firebaseAdmin = admin;
export const authAdmin = admin.auth();
