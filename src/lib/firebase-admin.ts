
'use server';
import * as admin from 'firebase-admin';

let app: admin.app.App;

try {
  if (admin.apps.length) {
    app = admin.app();
  } else {
    // Explicitly provide the configuration that the SDK is failing to auto-discover.
    // It will still use Application Default Credentials for authentication in a managed environment.
    app = admin.initializeApp({
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
  }
} catch (error: any) {
  console.error('CRITICAL: Firebase admin initialization failed.', error);
  // Re-throwing the original error is important to prevent the app from
  // starting in a broken state where downstream services would also fail.
  throw error;
}

export const adminStorage = app.storage();
export const adminRtdb = app.database();
