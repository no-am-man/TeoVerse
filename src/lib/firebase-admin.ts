import * as admin from 'firebase-admin';

// This file is only ever imported on the server, so we can use the admin SDK.

try {
  if (!admin.apps.length) {
    // In a managed environment like App Hosting, initializeApp() with no arguments
    // automatically discovers service credentials and project configuration.
    admin.initializeApp();
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

// These lines will now throw if initialization still fails for a critical reason.
export const adminStorage = admin.storage();
export const adminRtdb = admin.database();
