import { NoticeDecoded } from '../types/notice';
import { SAMPLE_NOTICES } from '../data/sampleNotices';
import { NoticeDecodedSchema } from '../types/noticeSchema';
import { authService } from './authService';
import { db, firebaseAuth, isFirebaseConfigured } from '../config/firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, query, where } from 'firebase/firestore';

export interface INoticeRepository {
  getAll(userId?: string): Promise<NoticeDecoded[]>;
  getById(id: string, userId?: string): Promise<NoticeDecoded | null>;
  save(notice: NoticeDecoded, userId?: string): Promise<NoticeDecoded>;
  delete(id: string, userId?: string): Promise<boolean>;
  resetToSamples(userId?: string): Promise<NoticeDecoded[]>;
  clearAll(userId?: string): Promise<void>;
}

// In-memory fallback for SSR and Node test environments
const inMemoryFallback: Map<string, NoticeDecoded[]> = new Map();

class UserScopedNoticeRepository implements INoticeRepository {
  private getStorageKey(userId?: string): string {
    return userId ? `nd_user_notices_${userId}` : 'nd_guest_notices';
  }

  private getLocalList(userId?: string): NoticeDecoded[] {
    const key = this.getStorageKey(userId);
    if (typeof window === 'undefined') {
      return inMemoryFallback.get(key) || [];
    }
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      const validated: NoticeDecoded[] = [];
      for (const item of parsed) {
        const check = NoticeDecodedSchema.safeParse(item);
        if (check.success) {
          validated.push(check.data as NoticeDecoded);
        }
      }
      return validated;
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
      return [];
    }
  }

  private setLocalList(list: NoticeDecoded[], userId?: string): void {
    const key = this.getStorageKey(userId);
    if (typeof window === 'undefined') {
      inMemoryFallback.set(key, list);
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  async getAll(userId?: string): Promise<NoticeDecoded[]> {
    const currentUid = firebaseAuth?.currentUser?.uid || userId;

    // 1. If Firebase is active and user is signed in, query Firestore directly
    if (isFirebaseConfigured && currentUid && typeof window !== 'undefined') {
      try {
        const noticesCol = collection(db, 'notices');
        const q = query(noticesCol, where('userId', '==', currentUid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const remoteNotices: NoticeDecoded[] = [];
          snap.forEach((docSnap) => {
            const data = docSnap.data();
            const check = NoticeDecodedSchema.safeParse(data);
            if (check.success) {
              remoteNotices.push(check.data as NoticeDecoded);
            }
          });
          if (remoteNotices.length > 0) {
            this.setLocalList(remoteNotices, currentUid);
            return remoteNotices;
          }
        }
      } catch (err) {
        console.warn('Firestore notices fetch fallback to local/server:', err);
      }
    }

    // 2. If authenticated, also try to fetch from server proxy
    const idToken = await authService.getIdToken();
    if (idToken) {
      try {
        const res = await fetch('/api/notices', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            this.setLocalList(json.data, currentUid);
            return json.data;
          }
        }
      } catch (err) {
        console.warn('Server notices fetch fallback to local:', err);
      }
    }

    return this.getLocalList(currentUid);
  }

  async getById(id: string, userId?: string): Promise<NoticeDecoded | null> {
    const list = await this.getAll(userId);
    const found = list.find((n) => n.id === id);
    return found ? { ...found } : null;
  }

  async save(notice: NoticeDecoded, userId?: string): Promise<NoticeDecoded> {
    const effectiveUserId = userId || notice.userId || firebaseAuth?.currentUser?.uid || null;
    const validated = NoticeDecodedSchema.parse({
      ...notice,
      userId: effectiveUserId,
      updatedAt: new Date().toISOString(),
    }) as NoticeDecoded;

    const list = this.getLocalList(effectiveUserId || undefined);
    const index = list.findIndex((n) => n.id === validated.id);

    if (index >= 0) {
      list[index] = validated;
    } else {
      list.unshift(validated);
    }

    this.setLocalList(list, effectiveUserId || undefined);

    // Persist to Firestore if configured and user is signed in
    if (isFirebaseConfigured && effectiveUserId && firebaseAuth?.currentUser?.uid === effectiveUserId && typeof window !== 'undefined') {
      try {
        await setDoc(doc(db, 'notices', validated.id), validated);
      } catch (err) {
        console.warn('Could not sync notice save to Firestore:', err);
      }
    }

    // Sync to server if authenticated
    const idToken = await authService.getIdToken();
    if (idToken) {
      try {
        await fetch('/api/notices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(validated),
        });
      } catch (err) {
        console.warn('Could not sync notice save to server:', err);
      }
    }

    return validated;
  }

  async delete(id: string, userId?: string): Promise<boolean> {
    const effectiveUserId = userId || firebaseAuth?.currentUser?.uid || undefined;
    const list = this.getLocalList(effectiveUserId);
    const initialLen = list.length;
    const filtered = list.filter((n) => n.id !== id);
    this.setLocalList(filtered, effectiveUserId);

    // Delete from Firestore if configured and authenticated
    if (isFirebaseConfigured && effectiveUserId && typeof window !== 'undefined') {
      try {
        await deleteDoc(doc(db, 'notices', id));
      } catch (err) {
        console.warn('Could not sync notice delete to Firestore:', err);
      }
    }

    const idToken = await authService.getIdToken();
    if (idToken) {
      try {
        await fetch(`/api/notices/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${idToken}` },
        });
      } catch (err) {
        console.warn('Could not sync notice delete to server:', err);
      }
    }

    return filtered.length < initialLen;
  }

  async resetToSamples(userId?: string): Promise<NoticeDecoded[]> {
    const samples = JSON.parse(JSON.stringify(SAMPLE_NOTICES)).map((n: NoticeDecoded) => ({
      ...n,
      userId,
    }));
    this.setLocalList(samples, userId);
    return samples;
  }

  async clearAll(userId?: string): Promise<void> {
    const key = this.getStorageKey(userId);
    inMemoryFallback.delete(key);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
  }
}

export const noticeRepository: INoticeRepository = new UserScopedNoticeRepository();
