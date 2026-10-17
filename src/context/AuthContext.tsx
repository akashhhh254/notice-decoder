import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AuthSession } from '../types/phase2';
import { authService, isSupabaseConfigured } from '../services/authService';

interface AuthContextType {
  user: UserProfile | null;
  session: AuthSession | null;
  loading: boolean;
  isSupabase: boolean;
  isCoordinator: boolean;
  signIn: (email: string, pass: string) => Promise<UserProfile>;
  signUp: (email: string, pass: string, name: string) => Promise<UserProfile>;
  signOut: () => Promise<void>;
  switchPersona: (role: 'student' | 'coordinator') => Promise<UserProfile>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isSupabase: false,
  isCoordinator: false,
  signIn: async () => { throw new Error('Not initialized'); },
  signUp: async () => { throw new Error('Not initialized'); },
  signOut: async () => {},
  switchPersona: async () => { throw new Error('Not initialized'); },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
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

  const signIn = async (email: string, pass: string) => {
    const profile = await authService.signIn(email, pass);
    const curr = await authService.getSession();
    setSession(curr);
    return profile;
  };

  const signUp = async (email: string, pass: string, name: string) => {
    const profile = await authService.signUp(email, pass, name);
    const curr = await authService.getSession();
    setSession(curr);
    return profile;
  };

  const signOut = async () => {
    await authService.signOut();
    setSession({ user: null, token: null, expiresAt: null });
  };

  const switchPersona = async (role: 'student' | 'coordinator') => {
    const profile = await authService.switchPersona(role);
    const curr = await authService.getSession();
    setSession(curr);
    return profile;
  };

  const isCoordinator = Boolean(session?.user?.role === 'coordinator' || session?.user?.role === 'admin');

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        session,
        loading,
        isSupabase: isSupabaseConfigured(),
        isCoordinator,
        signIn,
        signUp,
        signOut,
        switchPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
