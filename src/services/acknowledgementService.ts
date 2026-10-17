import {
  AcknowledgementRecord,
  AcknowledgementState,
  NoticeAcknowledgementStats,
} from '../types/phase3';
import { auditService } from './auditService';

const ACK_STORAGE_KEY = 'notice_decoder_acknowledgements_v3';

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

// Demo recipient cohort size for CS 2026 Batch
export const DEFAULT_COHORT_SIZE = 120;

// Pre-seeded acknowledgement entries representing real cohort students
const INITIAL_ACKNOWLEDGEMENTS: AcknowledgementRecord[] = [
  {
    id: 'ack_demo_01',
    noticeId: 'coord_notice_exam_2026',
    noticeVersion: 2,
    userId: 'user_demo_student_01',
    userEmail: 'student@college.edu',
    userDisplayName: 'Alex Rivera (CS 4th Yr)',
    state: 'acknowledged',
    actionItemsCompleted: ['chk_hall_ticket', 'chk_no_dues'],
    viewedAt: '2026-10-16T14:40:00Z',
    acknowledgedAt: '2026-10-16T15:10:00Z',
    notes: 'Confirmed attendance and downloaded hall ticket requisition.',
    reAcknowledgementRequested: false,
  },
  {
    id: 'ack_demo_02',
    noticeId: 'coord_notice_placement_2026',
    noticeVersion: 1,
    userId: 'user_demo_student_01',
    userEmail: 'student@college.edu',
    userDisplayName: 'Alex Rivera (CS 4th Yr)',
    state: 'action_required',
    actionItemsCompleted: ['chk_resume_upload'],
    viewedAt: '2026-10-16T10:00:00Z',
    notes: 'Resume uploaded; NOC signature pending from HOD.',
    reAcknowledgementRequested: false,
  },
];

// Helper to simulate realistic aggregate stats for pre-seeded notices
const SEEDED_AGGREGATES: Record<string, { viewed: number; acked: number; actionReq: number; total: number }> = {
  coord_notice_exam_2026: { viewed: 114, acked: 108, actionReq: 6, total: 120 },
  coord_notice_placement_2026: { viewed: 96, acked: 84, actionReq: 12, total: 120 },
  coord_notice_hackathon_2026: { viewed: 78, acked: 62, actionReq: 16, total: 150 },
};

class AcknowledgementService {
  private records: AcknowledgementRecord[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const raw = safeStorage.getItem(ACK_STORAGE_KEY);
    if (raw) {
      try {
        this.records = JSON.parse(raw);
      } catch {
        this.records = [...INITIAL_ACKNOWLEDGEMENTS];
      }
    } else {
      this.records = [...INITIAL_ACKNOWLEDGEMENTS];
      safeStorage.setItem(ACK_STORAGE_KEY, JSON.stringify(this.records));
    }
  }

  private persist() {
    safeStorage.setItem(ACK_STORAGE_KEY, JSON.stringify(this.records));
  }

  async getStudentAcknowledgement(
    noticeId: string,
    userId: string
  ): Promise<AcknowledgementRecord | null> {
    const match = this.records.find(
      (r) => r.noticeId === noticeId && (r.userId === userId || (!r.userId && userId === 'user_demo_student_01'))
    );
    return match || null;
  }

  async recordView(
    noticeId: string,
    userId: string,
    userEmail: string,
    displayName: string,
    currentNoticeVersion: number
  ): Promise<AcknowledgementRecord> {
    let match = this.records.find(
      (r) => r.noticeId === noticeId && (r.userId === userId || (!r.userId && userId === 'user_demo_student_01'))
    );

    if (!match) {
      match = {
        id: `ack_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        noticeId,
        noticeVersion: currentNoticeVersion,
        userId,
        userEmail,
        userDisplayName: displayName,
        state: 'viewed',
        actionItemsCompleted: [],
        viewedAt: new Date().toISOString(),
        reAcknowledgementRequested: false,
      };
      this.records.push(match);
      this.persist();
    } else {
      // Check if notice version increased since student last acknowledged
      if (currentNoticeVersion > match.noticeVersion && match.state === 'acknowledged') {
        match.reAcknowledgementRequested = true;
        this.persist();
      }
    }

    return match;
  }

  async submitAcknowledgement(params: {
    noticeId: string;
    userId: string;
    userEmail: string;
    displayName: string;
    noticeVersion: number;
    completedActionIds: string[];
    hasPendingActions: boolean;
    notes?: string;
  }): Promise<AcknowledgementRecord> {
    let matchIndex = this.records.findIndex(
      (r) => r.noticeId === params.noticeId && (r.userId === params.userId || (!r.userId && params.userId === 'user_demo_student_01'))
    );

    const newState: AcknowledgementState = params.hasPendingActions ? 'action_required' : 'acknowledged';

    const updatedRecord: AcknowledgementRecord = {
      id: matchIndex >= 0 ? this.records[matchIndex].id : `ack_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      noticeId: params.noticeId,
      noticeVersion: params.noticeVersion,
      userId: params.userId,
      userEmail: params.userEmail,
      userDisplayName: params.displayName,
      state: newState,
      actionItemsCompleted: params.completedActionIds,
      viewedAt: matchIndex >= 0 && this.records[matchIndex].viewedAt ? this.records[matchIndex].viewedAt : new Date().toISOString(),
      acknowledgedAt: new Date().toISOString(),
      notes: params.notes || '',
      reAcknowledgementRequested: false,
    };

    if (matchIndex >= 0) {
      this.records[matchIndex] = updatedRecord;
    } else {
      this.records.push(updatedRecord);
    }

    this.persist();

    // Log in tamper-resistant audit trail
    await auditService.logAction({
      userId: params.userId,
      userDisplayName: params.displayName,
      userRole: 'student',
      action: 'ACKNOWLEDGEMENT_RECORDED',
      targetType: 'acknowledgement',
      targetId: params.noticeId,
      summary: `${params.displayName} marked notice as ${newState} (version ${params.noticeVersion})`,
      details: {
        completedActions: params.completedActionIds,
        notes: params.notes,
      },
    });

    return updatedRecord;
  }

  async getNoticeStats(noticeId: string, currentVersion: number): Promise<NoticeAcknowledgementStats> {
    const seeded = SEEDED_AGGREGATES[noticeId] || { viewed: 1, acked: 1, actionReq: 0, total: 100 };
    const userRec = await this.getStudentAcknowledgement(noticeId, 'user_demo_student_01');

    // Account for current student's state dynamically
    let totalEligible = seeded.total;
    let acknowledgedCount = seeded.acked;
    let viewedCount = seeded.viewed;
    let actionRequiredCount = seeded.actionReq;

    if (userRec) {
      if (userRec.state === 'acknowledged') {
        acknowledgedCount = Math.min(totalEligible, Math.max(acknowledgedCount, 1));
      } else if (userRec.state === 'action_required') {
        actionRequiredCount = Math.min(totalEligible, Math.max(actionRequiredCount, 1));
      }
    }

    const notViewedCount = Math.max(0, totalEligible - viewedCount);
    const acknowledgementPercentage = totalEligible > 0 ? Math.round((acknowledgedCount / totalEligible) * 100) : 0;
    const viewedPercentage = totalEligible > 0 ? Math.round((viewedCount / totalEligible) * 100) : 0;

    return {
      noticeId,
      totalEligible,
      viewedCount,
      acknowledgedCount,
      actionRequiredCount,
      notViewedCount,
      acknowledgementPercentage,
      viewedPercentage,
    };
  }

  async getAllAcknowledgementsForNotice(noticeId: string): Promise<AcknowledgementRecord[]> {
    return this.records.filter((r) => r.noticeId === noticeId);
  }

  getUserAcknowledgements(userId: string): AcknowledgementRecord[] {
    return this.records.filter(
      (r) => r.userId === userId || (!r.userId && userId === 'user_demo_student_01')
    );
  }
}

export const acknowledgementService = new AcknowledgementService();
