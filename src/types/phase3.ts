import { NoticeDecoded, NoticeEvent, ActionItem } from './notice';
import { UserProfile } from './phase2';

export type UserRole = 'student' | 'coordinator' | 'admin';

export type AudienceType =
  | 'all_students'
  | 'department'
  | 'batch'
  | 'course'
  | 'custom_group';

export interface TargetAudience {
  type: AudienceType;
  department?: string; // e.g., 'Computer Science & Engineering'
  batchYear?: string;  // e.g., '2026'
  courseCode?: string; // e.g., 'CS401'
  groupName?: string;  // e.g., 'Final Year Capstone Project Leads'
}

export type PublicationStatus = 'draft' | 'published' | 'archived' | 'withdrawn';

export type AcknowledgementState =
  | 'not_viewed'
  | 'viewed'
  | 'acknowledged'
  | 'action_required';

export interface NoticeVersion {
  id: string;
  noticeId: string;
  versionNumber: number;
  changedBy: string;
  changedByRole: UserRole;
  changedAt: string;
  changeSummary: string;
  materialChange: boolean;
  changesList: string[];
  previousSnapshot?: {
    noticeTitle: string;
    events: NoticeEvent[];
    checklist: ActionItem[];
    urgency: string;
  };
}

export interface AcknowledgementRecord {
  id: string;
  noticeId: string;
  noticeVersion: number;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  state: AcknowledgementState;
  actionItemsCompleted: string[];
  acknowledgedAt?: string;
  viewedAt?: string;
  notes?: string;
  reAcknowledgementRequested?: boolean;
}

export interface NoticeAcknowledgementStats {
  noticeId: string;
  totalEligible: number;
  viewedCount: number;
  acknowledgedCount: number;
  actionRequiredCount: number;
  notViewedCount: number;
  acknowledgementPercentage: number;
  viewedPercentage: number;
}

export interface CoordinatorNotice extends NoticeDecoded {
  isPublished: boolean;
  publicationStatus: PublicationStatus;
  targetAudience: TargetAudience;
  publishedAt?: string;
  publishedBy?: string; // coordinator user id
  publishedByName?: string;
  expiryDate?: string;
  currentVersion: number;
  versionHistory: NoticeVersion[];
  acknowledgementStats?: NoticeAcknowledgementStats;
  withdrawalReason?: string;
  isCoordinatorCreated: boolean;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type:
    | 'notice_published'
    | 'notice_revised'
    | 'deadline_approaching'
    | 'clash_detected'
    | 'action_required'
    | 'system';
  urgency: 'normal' | 'high' | 'critical';
  targetUrl?: string;
  noticeId?: string;
  eventId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userDisplayName: string;
  userRole: UserRole;
  action:
    | 'NOTICE_CREATED'
    | 'NOTICE_PUBLISHED'
    | 'NOTICE_REVISED'
    | 'NOTICE_ARCHIVED'
    | 'NOTICE_WITHDRAWN'
    | 'ACKNOWLEDGEMENT_RECORDED'
    | 'RE_ACKNOWLEDGEMENT_REQUESTED'
    | 'ROLE_UPDATED'
    | 'USER_DATA_EXPORTED'
    | 'ACCOUNT_DEACTIVATED';
  targetType: 'notice' | 'user' | 'acknowledgement' | 'system';
  targetId: string;
  summary: string;
  details?: Record<string, any>;
}

export interface CoordinatorMetrics {
  totalPublishedNotices: number;
  activeNotices: number;
  archivedNotices: number;
  withdrawnNotices: number;
  totalEligibleStudents: number;
  overallAcknowledgementRate: number;
  overdueActionsCount: number;
  noticesWithRecentRevisions: number;
}

export interface UserPreferencesExtended {
  emailNotifications: boolean;
  inAppReminders: boolean;
  leadTimeHours: number; // e.g. 24 or 48 hours
  timezone: string;
  department?: string;
  batchYear?: string;
}
