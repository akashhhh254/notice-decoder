import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from './authService';

describe('Firebase Google Auth Service', () => {
  beforeEach(async () => {
    await authService.signOut();
  });

  it('exposes configuration check for Firebase environment variables', () => {
    const configured = authService.isConfigured();
    expect(typeof configured).toBe('boolean');
  });

  it('initializes with unauthenticated session by default', async () => {
    const session = await authService.getSession();
    expect(session.user).toBeNull();
    expect(session.token).toBeNull();
  });

  it('signs out and destroys active session cleanly', async () => {
    await authService.signOut();
    const session = await authService.getSession();
    expect(session.user).toBeNull();
    expect(session.token).toBeNull();
  });

  it('rejects signInWithGoogle if Firebase configuration is missing', async () => {
    if (!authService.isConfigured()) {
      await expect(authService.signInWithGoogle()).rejects.toThrow(
        /Firebase Google Authentication is not configured/
      );
    }
  });

  it('registers and unregisters auth state change listeners', () => {
    let callCount = 0;
    const unsubscribe = authService.onAuthStateChange(() => {
      callCount++;
    });

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });
});
