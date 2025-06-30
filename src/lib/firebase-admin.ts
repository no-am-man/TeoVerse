
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// This file ensures the Firebase Admin SDK is initialized only once.
// In a managed environment like App Hosting, it discovers credentials automatically.
// For local development, you must set the GOOGLE_APPLICATION_CREDENTIALS
// environment variable to point to your service account key file.

if (!getApps().length) {
    admin.initializeApp({
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export default admin;
