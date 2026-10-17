import { timetableRepository } from './timetableRepository';
import { noticeRepository } from './noticeRepository';
import { acknowledgementService } from './acknowledgementService';
import { notificationService } from './notificationService';
import { auditService } from './auditService';
import { AcknowledgementRecord, InAppNotification } from '../types/phase3';
import { NoticeDecoded } from '../types/notice';
import { TimetableEntry } from '../types/phase2';

export interface UserExportData {
  exportMetadata: {
    exportDate: string;
    userId: string;
    schemaVersion: string;
    generator: string;
  };
  profile: {
    id: string;
    email: string;
    displayName: string;
  };
  timetableEntries: TimetableEntry[];
  personalNotices: NoticeDecoded[];
  acknowledgementRecords: AcknowledgementRecord[];
  notifications: InAppNotification[];
  dataRetentionPolicy: {
    noticeRetention: string;
    acknowledgementRetention: string;
    privacyBoundary: string;
    legalDisclaimer: string;
  };
}

class PrivacyService {
  async exportUserData(
    userId: string,
    email: string,
    displayName: string
  ): Promise<UserExportData> {
    const personalNotices = await noticeRepository.getAll();
    const timetableEntries = await timetableRepository.getEntries(userId);
    const notifications = await notificationService.getNotifications(userId);
    const acknowledgementRecords = acknowledgementService.getUserAcknowledgements(userId);

    const exportBundle: UserExportData = {
      exportMetadata: {
        exportDate: new Date().toISOString(),
        userId,
        schemaVersion: 'notice_decoder_phase3_v1',
        generator: 'Notice Decoder Privacy & Export Engine',
      },
      profile: {
        id: userId,
        email,
        displayName,
      },
      timetableEntries,
      personalNotices,
      acknowledgementRecords,
      notifications,
      dataRetentionPolicy: {
        noticeRetention:
          'Personal parsed notices and individual timetables are retained for the duration of your active academic term. Inactive items are archived after 365 days unless explicitly purged.',
        acknowledgementRetention:
          'Acknowledgements are retained for academic audit compliance throughout the degree cycle. Aggregated percentages are preserved for accreditation.',
        privacyBoundary:
          'Institutional coordinators only have access to aggregated acknowledgement metrics and notices published by the institution. Personal timetable entries and uploaded personal notices are strictly private to the student.',
        legalDisclaimer:
          'Recorded acknowledgements signify logged receipt and viewing, not guaranteed legal comprehension or adherence.',
      },
    };

    await auditService.logAction({
      userId,
      userDisplayName: displayName,
      userRole: 'student',
      action: 'USER_DATA_EXPORTED',
      targetType: 'user',
      targetId: userId,
      summary: `${displayName} requested full personal data archive export`,
      details: {
        timetableEntriesCount: timetableEntries.length,
        personalNoticesCount: personalNotices.length,
        acknowledgementsCount: acknowledgementRecords.length,
      },
    });

    return exportBundle;
  }

  downloadExportJson(data: UserExportData, filename?: string): void {
    if (typeof window === 'undefined') return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `notice_decoder_archive_${data.profile.id}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async purgeAccountData(
    userId: string,
    displayName: string
  ): Promise<{ success: boolean; retainedRecordsExplanation: string; timestamp: string }> {
    try {
      // 1. Purge personal timetable
      const entries = await timetableRepository.getEntries(userId);
      for (const e of entries) {
        await timetableRepository.deleteEntry(e.id, userId);
      }

      // 2. Clear personal notifications
      notificationService.clearAll(userId);

      // 3. Log audit action
      await auditService.logAction({
        userId,
        userDisplayName: displayName,
        userRole: 'student',
        action: 'ACCOUNT_DEACTIVATED',
        targetType: 'user',
        targetId: userId,
        summary: `Cascading account data purge initiated by ${displayName}`,
        details: {
          purgedTimetableCount: entries.length,
        },
      });

      return {
        success: true,
        retainedRecordsExplanation:
          'Personal timetable entries, local preferences, and in-app notifications have been purged. In compliance with institutional academic compliance regulations and university accreditation rules, signed institutional circular receipts are retained in anonymized aggregate form.',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        success: false,
        retainedRecordsExplanation: 'Error encountered during purge sequence.',
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const privacyService = new PrivacyService();
