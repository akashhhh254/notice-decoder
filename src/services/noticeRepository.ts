import { NoticeDecoded } from '../types/notice';
import { SAMPLE_NOTICES } from '../data/sampleNotices';
import { NoticeDecodedSchema } from '../types/noticeSchema';
import { authService } from './authService';

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
    // If authenticated, also try to fetch from server
    const idToken = await authService.getIdToken();
    if (idToken) {
      try {
        const res = await fetch('/api/notices', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            this.setLocalList(json.data, userId);
            return json.data;
          }
        }
      } catch (err) {
        console.warn('Server notices fetch fallback to local:', err);
      }
    }

    return this.getLocalList(userId);
  }

  async getById(id: string, userId?: string): Promise<NoticeDecoded | null> {
    const list = await this.getAll(userId);
    const found = list.find((n) => n.id === id);
    return found ? { ...found } : null;
  }

  async save(notice: NoticeDecoded, userId?: string): Promise<NoticeDecoded> {
    const validated = NoticeDecodedSchema.parse({
      ...notice,
      userId: userId || notice.userId,
      updatedAt: new Date().toISOString(),
    }) as NoticeDecoded;

    const list = this.getLocalList(userId);
    const index = list.findIndex((n) => n.id === validated.id);

    if (index >= 0) {
      list[index] = validated;
    } else {
      list.unshift(validated);
    }

    this.setLocalList(list, userId);

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
    const list = this.getLocalList(userId);
    const initialLen = list.length;
    const filtered = list.filter((n) => n.id !== id);
    this.setLocalList(filtered, userId);

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
