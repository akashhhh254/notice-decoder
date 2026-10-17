import { NoticeDecoded, NoticeEvent, ActionItem } from './notice';

export type UserRole = 'student' | 'coordinator' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  timezone: string;
  role?: UserRole;
  department?: string;
  batchYear?: string;
  createdAt: string;
}

export interface AuthSession {
  user: UserProfile | null;
  token: string | null;
  expiresAt: number | null;
}

export type WeekdayNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = Monday ... 7 = Sunday

export interface TimetableEntry {
  id: string;
  userId: string;
  subjectTitle: string;
  weekday: WeekdayNumber;
  startTime: string; // HH:MM (24-hr) e.g. '10:00'
  endTime: string;   // HH:MM (24-hr) e.g. '11:30'
  venue: string;
  timezone: string;
  semesterStartDate?: string; // YYYY-MM-DD
  semesterEndDate?: string;   // YYYY-MM-DD
  recurrenceRule?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConflictOverlap {
  id: string;
  noticeId: string;
  noticeTitle: string;
  noticeEventId: string;
  noticeEventTitle: string;
  timetableEntryId: string;
  classTitle: string;
  conflictDate: string; // YYYY-MM-DD
  noticeTimeRange: string;
  classTimeRange: string;
  overlapMinutes: number;
  venueClash: boolean;
  evidenceSnippet?: string;
  explanation: string;
  status: 'active' | 'dismissed' | 'resolved';
  isUncertainTiming?: boolean;
}

export interface ConflictReview {
  id: string;
  userId: string;
  eventId: string;
  timetableEntryId: string;
  status: 'active' | 'dismissed' | 'resolved';
  notes?: string;
  updatedAt: string;
}

export interface CalendarItem {
  id: string;
  type: 'class' | 'notice_event' | 'deadline';
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  venue?: string;
  hasConflict: boolean;
  conflictDetails?: ConflictOverlap;
  noticeId?: string;
  color?: string;
  status?: string;
  originalEvent?: NoticeEvent;
  originalClass?: TimetableEntry;
  originalAction?: ActionItem;
}

export interface IcsExportOptions {
  eventIds: string[];
  includeClasses?: boolean;
  includeDeadlines?: boolean;
  timezone?: string;
}
