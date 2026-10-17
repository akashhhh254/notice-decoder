import { AuditLogEntry, UserRole } from '../types/phase3';

const AUDIT_STORAGE_KEY = 'notice_decoder_audit_logs_v3';

const memoryLogs: AuditLogEntry[] = [];

const safeStorage = {
  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return null;
  },
  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // ignore
      }
    }
  },
};

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud_init_01',
    timestamp: '2026-10-15T09:00:00Z',
    userId: 'coord_dean_01',
    userDisplayName: 'Dr. Eleanor Vance (Dean of Academics)',
    userRole: 'coordinator',
    action: 'NOTICE_PUBLISHED',
    targetType: 'notice',
    targetId: 'coord_notice_exam_2026',
    summary: 'Published University Odd-Semester End-Term Examination Schedule v1 to CS Batch 2026',
    details: { targetAudience: 'batch', batchYear: '2026', department: 'Computer Science' },
  },
  {
    id: 'aud_init_02',
    timestamp: '2026-10-16T14:30:00Z',
    userId: 'coord_dean_01',
    userDisplayName: 'Dr. Eleanor Vance (Dean of Academics)',
    userRole: 'coordinator',
    action: 'NOTICE_REVISED',
    targetType: 'notice',
    targetId: 'coord_notice_exam_2026',
    summary: 'Issued Material Revision v2: Changed CS401 examination venue to Main Auditorium Hall B. Re-acknowledgement requested.',
    details: { materialChange: true, venueUpdate: 'Main Auditorium Hall B', version: 2 },
  },
  {
    id: 'aud_init_03',
    timestamp: '2026-10-16T15:10:00Z',
    userId: 'user_demo_student_01',
    userDisplayName: 'Alex Rivera (CS 4th Yr)',
    userRole: 'student',
    action: 'ACKNOWLEDGEMENT_RECORDED',
    targetType: 'acknowledgement',
    targetId: 'coord_notice_exam_2026',
    summary: 'Alex Rivera acknowledged revised notice v2 and checked 2/2 action items',
    details: { noticeVersion: 2, completedTasksCount: 2 },
  },
];

class AuditService {
  private logs: AuditLogEntry[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const raw = safeStorage.getItem(AUDIT_STORAGE_KEY);
    if (raw) {
      try {
        this.logs = JSON.parse(raw);
      } catch {
        this.logs = [...INITIAL_AUDIT_LOGS];
      }
    } else {
      this.logs = [...INITIAL_AUDIT_LOGS];
      safeStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.logs));
    }
  }

  private persist() {
    safeStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(this.logs));
  }

  async logAction(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<AuditLogEntry> {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    this.logs.unshift(newEntry);
    // Keep bounded history (last 500 actions)
    if (this.logs.length > 500) {
      this.logs = this.logs.slice(0, 500);
    }
    this.persist();
    return newEntry;
  }

  async getLogs(options?: {
    targetId?: string;
    action?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    let result = [...this.logs];
    if (options?.targetId) {
      result = result.filter((l) => l.targetId === options.targetId);
    }
    if (options?.action) {
      result = result.filter((l) => l.action === options.action);
    }
    if (options?.limit) {
      result = result.slice(0, options.limit);
    }
    return result;
  }
}

export const auditService = new AuditService();
