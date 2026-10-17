import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseAppletConfig from '../../firebase-applet-config.json';

// Support both AI Studio automatic provisioned config and environment variables
const appletCfg: Record<string, any> = firebaseAppletConfig || {};

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || appletCfg.apiKey || '';
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletCfg.authDomain || '';
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || appletCfg.projectId || '';
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletCfg.storageBucket || '';
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletCfg.messagingSenderId || '';
const appId = import.meta.env.VITE_FIREBASE_APP_ID || appletCfg.appId || '';
const firestoreDatabaseId = appletCfg.firestoreDatabaseId || undefined;

export const isFirebaseConfigured = Boolean(
  apiKey &&
  apiKey !== 'YOUR_FIREBASE_API_KEY' &&
  apiKey !== 'unconfigured' &&
  projectId
);

const firebaseConfig = {
  apiKey: apiKey || 'unconfigured',
  authDomain: authDomain || undefined,
  projectId: projectId || undefined,
  storageBucket: storageBucket || undefined,
  messagingSenderId: messagingSenderId || undefined,
  appId: appId || undefined,
};

let appInstance: FirebaseApp;
if (getApps().length > 0) {
  appInstance = getApp();
} else {
  appInstance = initializeApp(firebaseConfig);
}

export const firebaseApp = appInstance;
export const firebaseAuth: Auth = getAuth(firebaseApp);
export const db: Firestore = getFirestore(firebaseApp, firestoreDatabaseId);

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

// Standard Firestore error handler per security specification
export enum FirestoreOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: FirestoreOperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: FirestoreOperationType, path: string | null) {
  const current = firebaseAuth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: current?.uid,
      email: current?.email,
      emailVerified: current?.emailVerified,
      isAnonymous: current?.isAnonymous,
      tenantId: current?.tenantId,
      providerInfo: current?.providerData?.map((p) => ({
        providerId: p.providerId,
        email: p.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Optional connection test to verify Firestore availability
export async function testFirestoreConnection() {
  if (!isFirebaseConfigured) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline status:', error.message);
    }
  }
}
