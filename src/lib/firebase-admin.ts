import * as admin from 'firebase-admin';

// This check prevents the app from being initialized multiple times,
// which can happen in development environments with hot-reloading.
if (!admin.apps.length) {
  // In a managed environment like App Hosting, initializeApp() with no arguments
  // automatically discovers service credentials and project configuration.
  admin.initializeApp();
}

// Directly export the initialized services. This is a more robust pattern
// that avoids potential race conditions or module loading issues in some
// server environments.
const adminStorage = admin.storage();
const adminRtdb = admin.database();

export { adminStorage, adminRtdb };
