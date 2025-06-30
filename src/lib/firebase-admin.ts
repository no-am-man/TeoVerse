import * as admin from 'firebase-admin';

// This guard prevents re-initialization in development environments (hot-reloading).
if (!admin.apps.length) {
  // In a managed environment like App Hosting, initializeApp() with no arguments
  // automatically discovers service credentials and project configuration.
  // This is the recommended approach.
  admin.initializeApp();
}

// Export the initialized services for use in other server-side modules.
export const adminStorage = admin.storage();
export const adminRtdb = admin.database();
