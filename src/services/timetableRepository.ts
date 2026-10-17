import { TimetableEntry, ConflictReview } from '../types/phase2';

const TIMETABLE_STORAGE_KEY = 'notice_decoder_timetable_v2';
const CONFLICT_REVIEWS_KEY = 'notice_decoder_conflict_reviews_v2';

export const DEFAULT_STUDENT_TIMETABLE: TimetableEntry[] = [
  {
    id: 'tt_cs401_tue',
    userId: 'user_demo_student_01',
    subjectTitle: 'CS401: Distributed Systems Lecture',
    weekday: 2, // Tuesday
    startTime: '10:00',
    endTime: '11:30',
    venue: 'Academic Block B, Room 204',
    timezone: 'UTC',
    semesterStartDate: '2026-08-01',
    semesterEndDate: '2026-12-20',
    recurrenceRule: 'FREQ=WEEKLY',
    color: '#0369a1',
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-01T08:00:00Z',
  },
  {
    id: 'tt_cs403_thu',
    userId: 'user_demo_student_01',
    subjectTitle: 'CS403: Machine Learning & Neural Networks',
    weekday: 4, // Thursday
    startTime: '10:00',
    endTime: '12:00',
    venue: 'Academic Block B, Room 208',
    timezone: 'UTC',
    semesterStartDate: '2026-08-01',
    semesterEndDate: '2026-12-20',
    recurrenceRule: 'FREQ=WEEKLY',
    color: '#0284c7',
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-01T08:00:00Z',
  },
  {
    id: 'tt_lab_wed',
    userId: 'user_demo_student_01',
    subjectTitle: 'CS405: Cloud Computing Practical Lab',
    weekday: 3, // Wednesday
    startTime: '14:00',
    endTime: '17:00',
    venue: 'Central Computing Lab 3',
    timezone: 'UTC',
    semesterStartDate: '2026-08-01',
    semesterEndDate: '2026-12-20',
    recurrenceRule: 'FREQ=WEEKLY',
    color: '#4f46e5',
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-01T08:00:00Z',
  },
  {
    id: 'tt_elec_mon',
    userId: 'user_demo_student_01',
    subjectTitle: 'HS302: Professional Ethics & IP Law',
    weekday: 1, // Monday
    startTime: '11:00',
    endTime: '12:30',
    venue: 'Humanities Wing, Room 102',
    timezone: 'UTC',
    semesterStartDate: '2026-08-01',
    semesterEndDate: '2026-12-20',
    recurrenceRule: 'FREQ=WEEKLY',
    color: '#0d9488',
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-01T08:00:00Z',
  },
];

class TimetableRepository {
  private cache: TimetableEntry[] | null = null;
  private reviewsCache: ConflictReview[] | null = null;

  private init() {
    if (typeof window === 'undefined') {
      this.cache = [...DEFAULT_STUDENT_TIMETABLE];
      this.reviewsCache = [];
      return;
    }

    try {
      const raw = window.localStorage.getItem(TIMETABLE_STORAGE_KEY);
      if (!raw) {
        window.localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(DEFAULT_STUDENT_TIMETABLE));
        this.cache = [...DEFAULT_STUDENT_TIMETABLE];
      } else {
        this.cache = JSON.parse(raw);
      }

      const rawReviews = window.localStorage.getItem(CONFLICT_REVIEWS_KEY);
      this.reviewsCache = rawReviews ? JSON.parse(rawReviews) : [];
    } catch {
      this.cache = [...DEFAULT_STUDENT_TIMETABLE];
      this.reviewsCache = [];
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(TIMETABLE_STORAGE_KEY, JSON.stringify(this.cache || []));
      window.localStorage.setItem(CONFLICT_REVIEWS_KEY, JSON.stringify(this.reviewsCache || []));
    } catch (e) {
      console.error('Error persisting timetable repository:', e);
    }
  }

  async getEntries(userId?: string): Promise<TimetableEntry[]> {
    if (!this.cache) this.init();
    const list = this.cache || [];
    if (!userId) return [];
    return list.filter((e) => e.userId === userId);
  }

  async saveEntry(entry: TimetableEntry): Promise<TimetableEntry> {
    if (!this.cache) this.init();
    const list = this.cache || [];
    const index = list.findIndex((e) => e.id === entry.id);

    const updated = {
      ...entry,
      updatedAt: new Date().toISOString(),
    };

    if (index >= 0) {
      list[index] = updated;
    } else {
      list.push(updated);
    }

    this.cache = list;
    this.persist();
    return updated;
  }

  async deleteEntry(id: string, userId?: string): Promise<boolean> {
    if (!this.cache) this.init();
    const initialLen = (this.cache || []).length;
    this.cache = (this.cache || []).filter((e) => e.id !== id);
    this.persist();
    return (this.cache || []).length < initialLen;
  }

  async getConflictReviews(userId?: string): Promise<ConflictReview[]> {
    if (!this.reviewsCache) this.init();
    const list = this.reviewsCache || [];
    if (!userId) return [...list];
    return list.filter((r) => r.userId === userId);
  }

  async setConflictReview(review: ConflictReview): Promise<void> {
    if (!this.reviewsCache) this.init();
    const list = this.reviewsCache || [];
    const index = list.findIndex(
      (r) => r.eventId === review.eventId && r.timetableEntryId === review.timetableEntryId && r.userId === review.userId
    );

    if (index >= 0) {
      list[index] = review;
    } else {
      list.push(review);
    }

    this.reviewsCache = list;
    this.persist();
  }

  async resetToDefaults(userId: string): Promise<TimetableEntry[]> {
    const list = DEFAULT_STUDENT_TIMETABLE.map((e) => ({
      ...e,
      id: `tt_${Math.random().toString(36).substring(2, 9)}`,
      userId,
    }));
    this.cache = list;
    this.persist();
    return list;
  }
}

export const timetableRepository = new TimetableRepository();
