import { NoticeDecoded } from '../types/notice';
import { SAMPLE_NOTICES } from '../data/sampleNotices';
import { NoticeDecodedSchema } from '../types/noticeSchema';

const STORAGE_KEY = 'notice_decoder_records_v1';

/**
 * Notice Repository Interface
 * Clean architectural abstraction for Phase 1 (Local Storage)
 * Allows seamless drop-in replacement by PostgreSQL / authenticated API in Phase 2.
 */
export interface INoticeRepository {
  getAll(): Promise<NoticeDecoded[]>;
  getById(id: string): Promise<NoticeDecoded | null>;
  save(notice: NoticeDecoded): Promise<NoticeDecoded>;
  delete(id: string): Promise<boolean>;
  resetToSamples(): Promise<NoticeDecoded[]>;
  clearAll(): Promise<void>;
  isUsingFallbackMemory(): boolean;
}

class LocalStorageNoticeRepository implements INoticeRepository {
  private memoryCache: NoticeDecoded[] | null = null;
  private memoryOnly = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        this.memoryOnly = true;
        this.memoryCache = [...SAMPLE_NOTICES];
        return;
      }

      const existing = window.localStorage.getItem(STORAGE_KEY);
      if (!existing) {
        // Seed with realistic demo notices on first run
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_NOTICES));
        this.memoryCache = [...SAMPLE_NOTICES];
      } else {
        const parsed = JSON.parse(existing);
        if (Array.isArray(parsed)) {
          // Validate stored records
          const validated: NoticeDecoded[] = [];
          for (const item of parsed) {
            const check = NoticeDecodedSchema.safeParse(item);
            if (check.success) {
              validated.push(check.data as NoticeDecoded);
            }
          }
          this.memoryCache = validated.length > 0 ? validated : [...SAMPLE_NOTICES];
        } else {
          this.memoryCache = [...SAMPLE_NOTICES];
        }
      }
    } catch (e) {
      console.warn('LocalStorage unavailable or corrupt, falling back to in-memory repository:', e);
      this.memoryOnly = true;
      this.memoryCache = [...SAMPLE_NOTICES];
    }
  }

  isUsingFallbackMemory(): boolean {
    return this.memoryOnly;
  }

  private persist() {
    if (this.memoryOnly || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryCache || []));
    } catch (e) {
      console.error('Failed to persist notices to localStorage:', e);
    }
  }

  async getAll(): Promise<NoticeDecoded[]> {
    if (!this.memoryCache) this.init();
    return [...(this.memoryCache || [])];
  }

  async getById(id: string): Promise<NoticeDecoded | null> {
    if (!this.memoryCache) this.init();
    const found = this.memoryCache?.find((n) => n.id === id);
    return found ? { ...found } : null;
  }

  async save(notice: NoticeDecoded): Promise<NoticeDecoded> {
    if (!this.memoryCache) this.init();
    const validated = NoticeDecodedSchema.parse({
      ...notice,
      updatedAt: new Date().toISOString(),
    }) as NoticeDecoded;

    const list = this.memoryCache || [];
    const index = list.findIndex((n) => n.id === validated.id);

    if (index >= 0) {
      list[index] = validated;
    } else {
      list.unshift(validated);
    }

    this.memoryCache = list;
    this.persist();
    return validated;
  }

  async delete(id: string): Promise<boolean> {
    if (!this.memoryCache) this.init();
    const list = this.memoryCache || [];
    const initialLen = list.length;
    this.memoryCache = list.filter((n) => n.id !== id);
    this.persist();
    return this.memoryCache.length < initialLen;
  }

  async resetToSamples(): Promise<NoticeDecoded[]> {
    this.memoryCache = JSON.parse(JSON.stringify(SAMPLE_NOTICES));
    this.persist();
    return [...(this.memoryCache || [])];
  }

  async clearAll(): Promise<void> {
    this.memoryCache = [];
    this.persist();
  }
}

export const noticeRepository: INoticeRepository = new LocalStorageNoticeRepository();
