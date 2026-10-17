import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from './authService';

describe('Auth Service & Local Session Management', () => {
  beforeEach(async () => {
    await authService.signOut();
  });

  it('rejects signup with short password', async () => {
    await expect(
      authService.signUp('newstudent@college.edu', '123', 'Student Name')
    ).rejects.toThrow('Password must be at least 6 characters.');
  });

  it('signs up a new user and persists session', async () => {
    const email = `test_${Date.now()}@college.edu`;
    const user = await authService.signUp(email, 'SecurePass2026!', 'Dev Student');

    expect(user.email).toBe(email);
    expect(user.displayName).toBe('Dev Student');

    const session = await authService.getSession();
    expect(session.user?.email).toBe(email);
    expect(session.token).toBeDefined();
  });

  it('prevents duplicate account creation with same email', async () => {
    const email = `dup_${Date.now()}@college.edu`;
    await authService.signUp(email, 'SecurePass2026!', 'First User');

    await expect(
      authService.signUp(email, 'SecurePass2026!', 'Second User')
    ).rejects.toThrow('An account with this academic email already exists.');
  });

  it('signs in with valid credentials', async () => {
    // Default demo student
    const profile = await authService.signIn('student@college.edu', 'Academic2026!');
    expect(profile.email).toBe('student@college.edu');

    const session = await authService.getSession();
    expect(session.user).not.toBeNull();
  });

  it('rejects sign in with incorrect password', async () => {
    await expect(
      authService.signIn('student@college.edu', 'WrongPassword!')
    ).rejects.toThrow('Invalid email or password.');
  });

  it('signs out and destroys active session', async () => {
    await authService.signIn('student@college.edu', 'Academic2026!');
    let session = await authService.getSession();
    expect(session.user).not.toBeNull();

    await authService.signOut();
    session = await authService.getSession();
    expect(session.user).toBeNull();
    expect(session.token).toBeNull();
  });
});
