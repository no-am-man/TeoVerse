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
  // If the app already exists, that's fine. Any other error is a critical failure.
  if (!/already exists/u.test(error.message)) {
    // Re-throwing the original error will give a much more informative stack trace
    // than the subsequent "app does not exist" error.
    console.error('CRITICAL: Firebase admin initialization failed.', error);
    throw error;
  }
}

export const adminStorage = admin.storage();
export const adminRtdb = admin.database();
