import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, firebaseAuth, googleAuthProvider, isFirebaseConfigured } from '../config/firebase';
import { UserProfile, AuthSession } from '../types/phase2';

export type AuthCallback = (session: AuthSession) => void;
const listeners: Set<AuthCallback> = new Set();

function formatFirebaseError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/popup-closed-by-user':
      return 'The Google sign-in window was closed before completing authentication. Please try again.';
    case 'auth/popup-blocked':
      return 'The Google sign-in popup was blocked by your browser. Please allow popups for this domain or try again.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in was cancelled due to another active request.';
    case 'auth/unauthorized-domain':
      return 'This web domain is not authorized in Firebase Console. Please add your domain to Firebase Console > Authentication > Settings > Authorized domains.';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection and try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact your campus administrator.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled in Firebase Console. Please enable Google under Authentication > Sign-in method.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
}

function mapFirebaseUser(user: FirebaseUser): UserProfile {
  return {
    id: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Student',
    photoURL: user.photoURL || undefined,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    role: 'student',
    createdAt: user.metadata.creationTime || new Date().toISOString(),
  };
}

let activeSession: AuthSession = {
  user: null,
  token: null,
  expiresAt: null,
};

let isInitialized = false;
let initPromise: Promise<AuthSession> | null = null;

function notifyListeners(session: AuthSession) {
  activeSession = session;
  listeners.forEach((cb) => {
    try {
      cb(session);
    } catch (err) {
      console.error('Error in auth state listener:', err);
    }
  });
}

// Set up Firebase auth state listener
if (typeof window !== 'undefined') {
  onAuthStateChanged(firebaseAuth, async (fbUser) => {
    if (fbUser) {
      try {
        const token = await fbUser.getIdToken();
        const profile = mapFirebaseUser(fbUser);
        const session: AuthSession = {
          user: profile,
          token,
          expiresAt: Date.now() + 60 * 60 * 1000,
        };
        notifyListeners(session);

        // Async write to Firestore users collection
        if (isFirebaseConfigured && profile.id) {
          try {
            await setDoc(doc(db, 'users', profile.id), profile, { merge: true });
          } catch (firestoreErr) {
            console.warn('Could not sync user profile to Firestore:', firestoreErr);
          }
        }
      } catch (err) {
        console.error('Failed to retrieve Firebase ID token:', err);
        notifyListeners({ user: null, token: null, expiresAt: null });
      }
    } else {
      notifyListeners({ user: null, token: null, expiresAt: null });
    }
    isInitialized = true;
  });
}

export const authService = {
  isConfigured(): boolean {
    return isFirebaseConfigured;
  },

  async getSession(): Promise<AuthSession> {
    if (!isFirebaseConfigured) {
      return { user: null, token: null, expiresAt: null };
    }

    if (isInitialized) {
      return activeSession;
    }

    if (!initPromise) {
      initPromise = new Promise<AuthSession>((resolve) => {
        const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
          unsubscribe();
          if (fbUser) {
            try {
              const token = await fbUser.getIdToken();
              const profile = mapFirebaseUser(fbUser);
              const session: AuthSession = {
                user: profile,
                token,
                expiresAt: Date.now() + 60 * 60 * 1000,
              };
              activeSession = session;
              resolve(session);
            } catch {
              resolve({ user: null, token: null, expiresAt: null });
            }
          } else {
            resolve({ user: null, token: null, expiresAt: null });
          }
          isInitialized = true;
        });
      });
    }

    return initPromise;
  },

  async signInWithGoogle(): Promise<UserProfile> {
    if (!isFirebaseConfigured) {
      throw new Error(
        'Firebase Google Authentication is not configured. Please supply VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID.'
      );
    }

    try {
      const result = await signInWithPopup(firebaseAuth, googleAuthProvider);
      if (!result.user) {
        throw new Error('Google sign-in did not return a valid user profile.');
      }
      const token = await result.user.getIdToken();
      const profile = mapFirebaseUser(result.user);
      notifyListeners({
        user: profile,
        token,
        expiresAt: Date.now() + 60 * 60 * 1000,
      });
      return profile;
    } catch (err: any) {
      // If popup was blocked, attempt redirect as a resilient fallback
      if (err?.code === 'auth/popup-blocked') {
        try {
          await signInWithRedirect(firebaseAuth, googleAuthProvider);
          // Execution halts on redirect
          throw new Error('Redirecting to Google Sign-In...');
        } catch (redirectErr: any) {
          throw new Error(formatFirebaseError(redirectErr));
        }
      }
      throw new Error(formatFirebaseError(err));
    }
  },

  async getIdToken(): Promise<string | null> {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) return null;
    try {
      return await currentUser.getIdToken(true);
    } catch (err) {
      console.error('Failed to refresh Firebase ID token:', err);
      return null;
    }
  },

  async signOut(): Promise<void> {
    try {
      if (isFirebaseConfigured) {
        await fbSignOut(firebaseAuth);
      }
    } catch (err) {
      console.warn('Firebase signOut encountered an error:', err);
    } finally {
      notifyListeners({ user: null, token: null, expiresAt: null });
    }
  },

  onAuthStateChange(callback: AuthCallback): () => void {
    listeners.add(callback);
    // Emit current state immediately if initialized
    if (isInitialized) {
      callback(activeSession);
    } else {
      this.getSession().then((session) => callback(session));
    }
    return () => {
      listeners.delete(callback);
    };
  },
};
