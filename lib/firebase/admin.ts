import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not set. Copy the JSON from Firebase console > Project settings > Service accounts > Generate new private key, and paste it as a single-line env var."
    );
  }
  return JSON.parse(raw);
}

function getAdminApp(): App {
  const existing = getApps();
  if (existing.length > 0) return existing[0];
  return initializeApp({ credential: cert(loadServiceAccount()) });
}

export const adminAuth = () => getAuth(getAdminApp());
export const adminDb = () => getFirestore(getAdminApp());
