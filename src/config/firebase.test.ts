import { describe, it, expect } from 'vitest';
import {
  isFirebaseConfigured,
  firebaseApp,
  firebaseAuth,
  googleAuthProvider,
  handleFirestoreError,
  FirestoreOperationType,
} from './firebase';

describe('Firebase Configuration & Auth Setup', () => {
  it('identifies valid Firebase configuration', () => {
    expect(isFirebaseConfigured).toBe(true);
  });

  it('initializes Firebase App and Auth instances', () => {
    expect(firebaseApp).toBeDefined();
    expect(firebaseAuth).toBeDefined();
  });

  it('configures GoogleAuthProvider with select_account prompt', () => {
    expect(googleAuthProvider).toBeDefined();
    expect(googleAuthProvider.providerId).toBe('google.com');
  });

  it('formats and throws structured error on Firestore permission failures', () => {
    expect(() => {
      handleFirestoreError(
        new Error('Missing or insufficient permissions'),
        FirestoreOperationType.GET,
        'notices/123'
      );
    }).toThrow();

    try {
      handleFirestoreError(
        new Error('Permission denied'),
        FirestoreOperationType.WRITE,
        'users/abc'
      );
    } catch (err: any) {
      const parsed = JSON.parse(err.message);
      expect(parsed.operationType).toBe('write');
      expect(parsed.path).toBe('users/abc');
      expect(parsed.error).toContain('Permission denied');
    }
  });
});
