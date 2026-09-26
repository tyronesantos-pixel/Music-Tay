import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  query,
  where,
  orderBy,
  Firestore,
  disableNetwork,
  enableNetwork,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const resolvedConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  firestoreDatabaseId: (import.meta as any).env?.VITE_FIREBASE_DATABASE_ID || firebaseConfig.firestoreDatabaseId,
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(resolvedConfig) : getApp();

// Initialize Firestore with specific database ID if provided in config
export const db: Firestore = resolvedConfig.firestoreDatabaseId
  ? getFirestore(app, resolvedConfig.firestoreDatabaseId)
  : getFirestore(app);

const QUOTA_STORAGE_KEY = 'tyrone_firestore_quota_status_v3';

/**
 * Returns true if Firestore daily write quota limit was exceeded today.
 */
export function isFirestoreQuotaExceeded(): boolean {
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const today = new Date().toISOString().slice(0, 10);
      if (data?.dateStr === today && data?.exceeded) {
        return true;
      }
    }
  } catch {}
  return false;
}

/**
 * Marks Firestore quota as exceeded for today and disables network on Firestore client
 * to immediately abort exponential backoff retries and prevent console errors.
 */
export function recordFirestoreQuotaExceeded(): void {
  try {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(
      QUOTA_STORAGE_KEY,
      JSON.stringify({ exceeded: true, dateStr: today, timestamp: Date.now() })
    );
  } catch {}
  try {
    disableNetwork(db).catch(() => {});
  } catch {}
}

// On startup: if quota was already exceeded today, safely suspend network calls
// so the SDK does not queue writes or flood the console with backoff delay logs.
if (isFirestoreQuotaExceeded()) {
  try {
    disableNetwork(db).catch(() => {});
  } catch {}
} else {
  // If it's a new day, clear any old status and re-enable network
  try {
    const raw = localStorage.getItem(QUOTA_STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      const today = new Date().toISOString().slice(0, 10);
      if (data?.dateStr !== today) {
        localStorage.removeItem(QUOTA_STORAGE_KEY);
        enableNetwork(db).catch(() => {});
      }
    }
  } catch {}
}

// Connection verification as mandated by Firebase skill
async function testConnection() {
  if (isFirestoreQuotaExceeded()) {
    return;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    const msg = String(error?.message || error || '');
    if (msg.includes('the client is offline')) {
      console.warn('Firebase client is offline, using resilient local storage.');
    } else if (msg.includes('Quota limit exceeded') || msg.includes('resource-exhausted')) {
      recordFirestoreQuotaExceeded();
      console.warn('Firebase Firestore daily write/read quota reached. App operating seamlessly with resilient IndexedDB/LocalStorage.');
    }
  }
}
testConnection();

export {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  query,
  where,
  orderBy,
  disableNetwork,
  enableNetwork,
};
