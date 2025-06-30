'use server';
import * as admin from 'firebase-admin';

// This file is only ever imported on the server, so we can use the admin SDK.

const app = admin.apps.length ? admin.app() : admin.initializeApp();

export const adminStorage = app.storage();
export const adminRtdb = app.database();
