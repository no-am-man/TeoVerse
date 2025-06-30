import * as admin from 'firebase-admin';

// This check prevents the app from being initialized multiple times,
// which can happen in development environments with hot-reloading.
if (!admin.apps.length) {
  // In a managed environment like App Hosting, initializeApp() with no arguments
  // should automatically discover service credentials. However, if project discovery
  // is failing, explicitly providing the projectId can resolve initialization issues.
  admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  });
}

// Directly export the initialized services. This is a more robust pattern
// that avoids potential race conditions or module loading issues in some
// server environments.
const adminStorage = admin.storage();
const adminRtdb = admin.database();

export { adminStorage, adminRtdb };
