'use server';
import * as admin from 'firebase-admin';

// This file is only ever imported on the server, so we can use the admin SDK.

let app: admin.app.App;

if (admin.apps.length === 0) {
  try {
    // In a managed environment like App Hosting, initializeApp() with no arguments
    // automatically discovers service credentials and project configuration.
    app = admin.initializeApp();
  } catch (error) {
    console.error('CRITICAL: Firebase admin initialization failed.', error);
    // Re-throwing the original error is important to prevent the app from
    // continuing in a broken state.
    throw error;
  }
} else {
  // Get the default app if it has already been initialized.
  app = admin.app();
}

// These lines will now use the correctly initialized app instance.
export const adminStorage = app.storage();
export const adminRtdb = app.database();
