import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AuthSession } from '../types/phase2';
import { authService } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  session: AuthSession | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: () => Promise<UserProfile>;
  signInAsStudent: (name?: string, email?: string) => UserProfile;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  signInWithGoogle: async () => {
    throw new Error('Auth not initialized');
  },
  signInAsStudent: () => {
    throw new Error('Auth not initialized');
  },
  signOut: async () => {},
  getIdToken: async () => null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch from Firebase
    authService.getSession().then((s) => {
      setSession(s);
      setLoading(false);
    });

    const unsubscribe = authService.onAuthStateChange((newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const profile = await authService.signInWithGoogle();
    const curr = await authService.getSession();
    setSession(curr);
    return profile;
  };

  const signInAsStudent = (name?: string, email?: string) => {
    const profile = authService.signInAsStudent(name, email);
    setSession({
      user: profile,
      token: 'local_token_' + Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    return profile;
  };

  const signOut = async () => {
    await authService.signOut();
    setSession({ user: null, token: null, expiresAt: null });
  };

  const getIdToken = async () => {
    return authService.getIdToken();
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        session,
        loading,
        isConfigured: authService.isConfigured(),
        signInWithGoogle,
        signInAsStudent,
        signOut,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
