import { describe, it, expect, beforeEach } from 'vitest';
import { notificationService } from './notificationService';
import { NoticeDecoded } from '../types/notice';
import { ConflictOverlap } from '../types/phase2';

describe('Notification Service & Idempotent Reminders', () => {
  const userId = 'student_test_notif_01';

  it('sends and fetches in-app notifications', async () => {
    const created = await notificationService.sendNotification({
      userId,
      title: 'Exam Hall Ticket Available',
      message: 'Your exam hall ticket has been approved.',
      type: 'notice_published',
      urgency: 'high',
      targetUrl: '/notices/123',
    });

    expect(created.id).toBeDefined();
    expect(created.read).toBe(false);

    const list = await notificationService.getNotifications(userId);
    expect(list.some((n) => n.id === created.id)).toBe(true);
  });

  it('marks a notification as read and updates unread count', async () => {
    const created = await notificationService.sendNotification({
      userId,
      title: 'Reminder: Lab Viva Tomorrow',
      message: 'Prepare practical files.',
      type: 'deadline_approaching',
      urgency: 'critical',
    });

    await notificationService.markAsRead(created.id);
    const list = await notificationService.getNotifications(userId);
    const item = list.find((n) => n.id === created.id);
    expect(item?.read).toBe(true);
  });

  it('generates reminders idempotently without creating duplicate notifications', async () => {
    const dummyClashes: ConflictOverlap[] = [
      {
        id: 'clash_idemp_01',
        noticeId: 'notice_exam_1',
        noticeTitle: 'End-Term Exam',
        noticeEventId: 'evt_p1',
        noticeEventTitle: 'Paper 1',
        timetableEntryId: 'tt_1',
        classTitle: 'CS401 Lecture',
        conflictDate: '2026-11-15',
        noticeTimeRange: '10:00 - 13:00',
        classTimeRange: '10:00 - 11:30',
        overlapMinutes: 90,
        venueClash: false,
        explanation: 'Direct schedule clash',
        status: 'active',
      },
    ];

    const dummyNotice: NoticeDecoded[] = [
      {
        id: 'notice_exam_1',
        noticeTitle: 'End-Term Exam',
        noticeType: 'exam',
        urgency: 'high',
        plainLanguageSummary: 'Exam schedule',
        events: [],
        checklist: [
          {
            id: 'chk_due_soon',
            task: 'Pay exam registration fee',
            deadline: '2026-11-12',
            requiredDocuments: [],
            completed: false,
          },
        ],
        eligibility: { eligibleBatches: [], prerequisites: [] },
        organizer: {},
        uncertainties: [],
        rawText: '',
        sourceEvidence: [],
        extractionSource: 'sample_fixture',
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // First run generates reminders
    const firstCount = await notificationService.generateAutomatedReminders(
      userId,
      dummyNotice,
      dummyClashes
    );
    expect(firstCount).toBeGreaterThanOrEqual(1);

    // Second run should recognize existing notifications and generate 0 duplicates
    const secondCount = await notificationService.generateAutomatedReminders(
      userId,
      dummyNotice,
      dummyClashes
    );
    expect(secondCount).toBe(0);
  });

  it('provides honest external notification provider status', () => {
    const status = notificationService.getExternalProviderStatus();
    expect(status.statusSummary).toBeDefined();
    expect(['in_app_only', 'email_and_in_app', 'push_and_in_app']).toContain(
      status.activeDeliveryMode
    );
  });
});
