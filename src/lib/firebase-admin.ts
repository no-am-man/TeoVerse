import * as admin from 'firebase-admin';

// This file is only ever imported on the server, so we can use the admin SDK.

try {
  if (!admin.apps.length) {
    // Initialize the app with Application Default Credentials
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  }
} catch (error: any) {
  // In a development environment with hot-reloading, the app may already exist.
  if (!/already exists/u.test(error.message)) {
    console.error('Firebase admin initialization error', error.stack);
  }
}

export const adminStorage = admin.storage();
export const adminRtdb = admin.database();
