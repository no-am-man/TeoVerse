import * as admin from 'firebase-admin';

let app: admin.app.App | undefined;

/**
 * Initializes the Firebase Admin SDK, ensuring it only happens once.
 * This lazy initialization is safer for serverless environments like Next.js.
 * @returns The initialized Firebase App instance.
 */
function getAdminApp(): admin.app.App {
  if (app) {
    return app;
  }

  // Check if the app is already initialized by another process
  if (admin.apps.length > 0 && admin.apps[0]) {
    app = admin.apps[0];
    return app;
  }
  
  // In a managed environment like App Hosting, initializeApp() with no arguments
  // automatically discovers service credentials and project configuration.
  app = admin.initializeApp();
  return app;
}

/**
 * Gets the initialized Firebase Storage service.
 * @returns The Firebase Storage service instance.
 */
export function getAdminStorage() {
  return getAdminApp().storage();
}

/**
 * Gets the initialized Firebase Realtime Database service.
 * @returns The Firebase Realtime Database service instance.
 */
export function getAdminRtdb() {
  return getAdminApp().database();
}
