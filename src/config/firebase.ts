import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '';
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '';
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '';
const appId = import.meta.env.VITE_FIREBASE_APP_ID || '';

export const isFirebaseConfigured = Boolean(
  apiKey &&
  apiKey !== 'YOUR_FIREBASE_API_KEY' &&
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

export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});
