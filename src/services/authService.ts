import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserProfile, AuthSession } from '../types/phase2';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

const LOCAL_AUTH_KEY = 'notice_decoder_auth_session_v2';
const LOCAL_USERS_KEY = 'notice_decoder_registered_users_v2';

// Universal safe storage adapter (falls back to memory store when window/localStorage is unavailable in Node/Vitest)
const memoryStore: Record<string, string> = {};

const safeStorage = {
  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return memoryStore[key] ?? null;
      }
    }
    return memoryStore[key] ?? null;
  },
  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // ignore
      }
    }
    memoryStore[key] = value;
  },
  removeItem(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    delete memoryStore[key];
  },
};

let supabaseClient: SupabaseClient | null = null;
if (SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('your-project')) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.warn('Could not initialize Supabase client:', err);
  }
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseClient);
}

type AuthCallback = (session: AuthSession) => void;
const listeners: Set<AuthCallback> = new Set();

function notifyListeners(session: AuthSession) {
  listeners.forEach((cb) => cb(session));
}

// In-memory or localStorage development adapter
function getLocalSession(): AuthSession {
  try {
    const raw = safeStorage.getItem(LOCAL_AUTH_KEY);
    if (!raw) return { user: null, token: null, expiresAt: null };
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      safeStorage.removeItem(LOCAL_AUTH_KEY);
      return { user: null, token: null, expiresAt: null };
    }
    return parsed;
  } catch {
    return { user: null, token: null, expiresAt: null };
  }
}

function setLocalSession(session: AuthSession) {
  if (!session.user) {
    safeStorage.removeItem(LOCAL_AUTH_KEY);
  } else {
    safeStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(session));
  }
  notifyListeners(session);
}

// Pre-seed default demo student and coordinator accounts for rapid local evaluation
function ensureDemoUserExists() {
  try {
    const rawUsers = safeStorage.getItem(LOCAL_USERS_KEY);
    const users: Record<string, { passwordHash: string; profile: UserProfile }> = rawUsers
      ? JSON.parse(rawUsers)
      : {};

    const demoEmail = 'student@college.edu';
    if (!users[demoEmail]) {
      users[demoEmail] = {
        passwordHash: 'Academic2026!',
        profile: {
          id: 'user_demo_student_01',
          email: demoEmail,
          displayName: 'Alex Rivera (CS 4th Yr)',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          role: 'student',
          department: 'Computer Science & Engineering',
          batchYear: '2026',
          createdAt: new Date().toISOString(),
        },
      };
    }

    const coordEmail = 'dean.academics@college.edu';
    if (!users[coordEmail]) {
      users[coordEmail] = {
        passwordHash: 'Academic2026!',
        profile: {
          id: 'coord_dean_01',
          email: coordEmail,
          displayName: 'Dr. Eleanor Vance (Dean of Academics)',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          role: 'coordinator',
          department: 'Academic Affairs & Examination Branch',
          createdAt: new Date().toISOString(),
        },
      };
    }

    safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.warn('Error seeding demo users:', err);
  }
}

ensureDemoUserExists();

export const authService = {
  isSupabaseConfigured,

  async getSession(): Promise<AuthSession> {
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      if (data.session) {
        return {
          user: {
            id: data.session.user.id,
            email: data.session.user.email || '',
            displayName: data.session.user.user_metadata?.display_name || data.session.user.email || 'User',
            timezone: data.session.user.user_metadata?.timezone || 'UTC',
            createdAt: data.session.user.created_at,
          },
          token: data.session.access_token,
          expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : null,
        };
      }
      return { user: null, token: null, expiresAt: null };
    }

    return getLocalSession();
  },

  async signUp(email: string, password: string, displayName: string): Promise<UserProfile> {
    if (!email || !password) throw new Error('Email and password are required.');
    if (password.length < 6) throw new Error('Password must be at least 6 characters.');

    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          },
        },
      });
      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Registration failed.');

      return {
        id: data.user.id,
        email: data.user.email || email,
        displayName: displayName || email.split('@')[0],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        createdAt: data.user.created_at,
      };
    }

    // Local development auth engine
    ensureDemoUserExists();
    const rawUsers = safeStorage.getItem(LOCAL_USERS_KEY);
    const users: Record<string, { passwordHash: string; profile: UserProfile }> = rawUsers
      ? JSON.parse(rawUsers)
      : {};

    const cleanEmail = email.trim().toLowerCase();
    if (users[cleanEmail]) {
      throw new Error('An account with this academic email already exists.');
    }

    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      displayName: displayName.trim() || cleanEmail.split('@')[0],
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      createdAt: new Date().toISOString(),
    };

    users[cleanEmail] = {
      passwordHash: password,
      profile: newUser,
    };
    safeStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));

    const session: AuthSession = {
      user: newUser,
      token: `dev_token_${newUser.id}_${Date.now()}`,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    setLocalSession(session);
    return newUser;
  },

  async signIn(email: string, password: string): Promise<UserProfile> {
    if (!email || !password) throw new Error('Email and password are required.');

    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(error.message);
      if (!data.user || !data.session) throw new Error('Sign-in failed.');

      const userProfile: UserProfile = {
        id: data.user.id,
        email: data.user.email || email,
        displayName: data.user.user_metadata?.display_name || email.split('@')[0],
        timezone: data.user.user_metadata?.timezone || 'UTC',
        createdAt: data.user.created_at,
      };

      notifyListeners({
        user: userProfile,
        token: data.session.access_token,
        expiresAt: data.session.expires_at ? data.session.expires_at * 1000 : null,
      });

      return userProfile;
    }

    // Local development authentication check
    ensureDemoUserExists();
    const rawUsers = safeStorage.getItem(LOCAL_USERS_KEY);
    const users: Record<string, { passwordHash: string; profile: UserProfile }> = rawUsers
      ? JSON.parse(rawUsers)
      : {};

    const cleanEmail = email.trim().toLowerCase();
    const match = users[cleanEmail];
    if (!match || match.passwordHash !== password) {
      throw new Error('Invalid email or password. Please verify credentials.');
    }

    const session: AuthSession = {
      user: match.profile,
      token: `dev_token_${match.profile.id}_${Date.now()}`,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    setLocalSession(session);
    return match.profile;
  },

  async switchPersona(role: 'student' | 'coordinator'): Promise<UserProfile> {
    ensureDemoUserExists();
    const email = role === 'coordinator' ? 'dean.academics@college.edu' : 'student@college.edu';
    return this.signIn(email, 'Academic2026!');
  },

  async signOut(): Promise<void> {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
    setLocalSession({ user: null, token: null, expiresAt: null });
  },

  onAuthStateChange(callback: AuthCallback): () => void {
    listeners.add(callback);
    // Trigger initial state
    this.getSession().then((s) => callback(s));

    let unsubscribeSupabase = () => {};
    if (supabaseClient) {
      const { data } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          callback({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              displayName: session.user.user_metadata?.display_name || session.user.email || 'User',
              timezone: session.user.user_metadata?.timezone || 'UTC',
              createdAt: session.user.created_at,
            },
            token: session.access_token,
            expiresAt: session.expires_at ? session.expires_at * 1000 : null,
          });
        } else {
          callback({ user: null, token: null, expiresAt: null });
        }
      });
      unsubscribeSupabase = () => data.subscription.unsubscribe();
    }

    return () => {
      listeners.delete(callback);
      unsubscribeSupabase();
    };
  },
};
