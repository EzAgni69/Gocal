import * as admin from 'firebase-admin';

// Initialize the Firebase Admin App
// Make sure to provide GOOGLE_APPLICATION_CREDENTIALS in your environment
// or set the corresponding variables if using explicit initialization
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(), // Uses GOOGLE_APPLICATION_CREDENTIALS
    });
}

export const firebaseAdmin = admin;
export const authAdmin = admin.auth();
