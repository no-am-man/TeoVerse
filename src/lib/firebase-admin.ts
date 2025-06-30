
import admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';

// This file ensures the Firebase Admin SDK is initialized only once.
// In a managed environment like App Hosting, it discovers credentials automatically.
// For local development, you must set the GOOGLE_APPLICATION_CREDENTIALS
// environment variable to point to your service account key file.

if (!getApps().length) {
    // Calling initializeApp() with no arguments relies on the SDK to
    // auto-discover credentials and configuration from the environment.
    // This is the most reliable method for managed environments like App Hosting.
    admin.initializeApp();
}

export const adminDb = admin.firestore();
export const adminStorage = admin.storage();
export default admin;
