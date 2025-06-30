
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import 'dotenv/config';

// This file ensures the Firebase Admin SDK is initialized only once.
// In a managed environment like App Hosting, it discovers credentials automatically.
// For local development, you must set the GOOGLE_APPLICATION_CREDENTIALS
// environment variable to point to your service account key file.

if (!getApps().length) {
    // Explicitly using applicationDefault() can resolve authentication issues
    // in some environments by forcing the SDK to use the service account
    // credentials provided by the hosting environment (like App Hosting or Cloud Functions).
    // Also providing the projectId and storageBucket can help in cases where auto-discovery fails.
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export default admin;
