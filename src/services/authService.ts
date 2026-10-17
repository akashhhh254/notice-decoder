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

const LOCAL_SESSION_KEY = 'notice_decoder_local_session_v2';

function getStoredLocalSession(): AuthSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.user && parsed.user.id) {
      return parsed as AuthSession;
    }
  } catch {
    return null;
  }
  return null;
}

let activeSession: AuthSession = getStoredLocalSession() || {
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
        try {
          localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
        } catch {}
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
        const local = getStoredLocalSession();
        notifyListeners(local || { user: null, token: null, expiresAt: null });
      }
    } else {
      const local = getStoredLocalSession();
      if (local) {
        notifyListeners(local);
      } else {
        notifyListeners({ user: null, token: null, expiresAt: null });
      }
    }
    isInitialized = true;
  });

  // Automatically process mobile redirect results when returning to the app
  if (isFirebaseConfigured) {
    getRedirectResult(firebaseAuth)
      .then(async (result) => {
        if (result && result.user) {
          try {
            const token = await result.user.getIdToken();
            const profile = mapFirebaseUser(result.user);
            const session: AuthSession = {
              user: profile,
              token,
              expiresAt: Date.now() + 60 * 60 * 1000,
            };
            try {
              localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
            } catch {}
            notifyListeners(session);
            if (profile.id) {
              setDoc(doc(db, 'users', profile.id), profile, { merge: true }).catch(() => {});
            }
          } catch (e) {
            console.warn('Error processing redirect user:', e);
          }
        }
      })
      .catch((err) => {
        console.warn('Firebase getRedirectResult error:', err);
      });
  }
}

export const authService = {
  isConfigured(): boolean {
    return isFirebaseConfigured;
  },

  async getSession(): Promise<AuthSession> {
    const local = getStoredLocalSession();
    if (local && !firebaseAuth?.currentUser) {
      activeSession = local;
      return local;
    }

    if (!isFirebaseConfigured) {
      return local || { user: null, token: null, expiresAt: null };
    }

    if (isInitialized) {
      return activeSession;
    }

    if (!initPromise) {
      initPromise = new Promise<AuthSession>((resolve) => {
        // Guaranteed safety timeout (1200ms) for slow cellular networks or restricted IndexedDB on mobile devices
        const fallbackTimer = setTimeout(() => {
          isInitialized = true;
          resolve(activeSession);
        }, 1200);

        const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser) => {
          clearTimeout(fallbackTimer);
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

    const isMobileDevice =
      typeof window !== 'undefined' &&
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    try {
      if (isMobileDevice) {
        // On mobile browsers, signInWithRedirect avoids popup blocker restrictions
        try {
          await signInWithRedirect(firebaseAuth, googleAuthProvider);
          // Redirect in progress
          return {
            id: 'pending',
            email: '',
            displayName: 'Redirecting...',
            role: 'student',
            timezone: 'UTC',
            createdAt: new Date().toISOString(),
          };
        } catch (redirectErr) {
          console.warn('signInWithRedirect fallback to popup:', redirectErr);
        }
      }

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
      // If popup was blocked on desktop or mobile, attempt redirect as resilient fallback
      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/cancelled-popup-request') {
        try {
          await signInWithRedirect(firebaseAuth, googleAuthProvider);
          return {
            id: 'pending',
            email: '',
            displayName: 'Redirecting...',
            role: 'student',
            timezone: 'UTC',
            createdAt: new Date().toISOString(),
          };
        } catch (redirectErr: any) {
          throw new Error(formatFirebaseError(redirectErr));
        }
      }
      throw new Error(formatFirebaseError(err));
    }
  },

  signInAsStudent(name = 'Akash Thakare', email = 'akashthakare157@gmail.com'): UserProfile {
    const profile: UserProfile = {
      id: 'student_' + (email.split('@')[0] || 'demo'),
      email: email,
      displayName: name,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      role: 'student',
      createdAt: new Date().toISOString(),
    };
    const session: AuthSession = {
      user: profile,
      token: 'local_token_' + Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(session));
      } catch (e) {
        console.warn('Could not store local session:', e);
      }
    }
    notifyListeners(session);
    return profile;
  },

  async getIdToken(): Promise<string | null> {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser) {
      return activeSession.token || null;
    }
    try {
      return await currentUser.getIdToken(true);
    } catch (err) {
      console.error('Failed to refresh Firebase ID token:', err);
      return activeSession.token || null;
    }
  },

  async signOut(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(LOCAL_SESSION_KEY);
        } catch {}
      }
      if (isFirebaseConfigured && firebaseAuth?.currentUser) {
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
