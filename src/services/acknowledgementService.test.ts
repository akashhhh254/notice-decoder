import { describe, it, expect, beforeEach } from 'vitest';
import { acknowledgementService } from './acknowledgementService';

describe('Acknowledgement Service & Recipient Tracking', () => {
  const testNoticeId = 'coord_notice_exam_2026';
  const testUserId = 'student_test_ack_99';

  it('records student view when opening an official notice', async () => {
    const record = await acknowledgementService.recordView(
      testNoticeId,
      testUserId,
      'test99@college.edu',
      'Test Student 99',
      2
    );

    expect(record).toBeDefined();
    expect(record.state).toBe('viewed');
    expect(record.viewedAt).toBeDefined();
  });

  it('submits student acknowledgement and prevents duplicate records for same user', async () => {
    const firstSubmission = await acknowledgementService.submitAcknowledgement({
      noticeId: testNoticeId,
      userId: testUserId,
      userEmail: 'test99@college.edu',
      displayName: 'Test Student 99',
      noticeVersion: 2,
      completedActionIds: ['chk_1'],
      hasPendingActions: false,
      notes: 'All documents verified and submitted.',
    });

    expect(firstSubmission.state).toBe('acknowledged');
    expect(firstSubmission.notes).toBe('All documents verified and submitted.');

    // Second submission by same user updates rather than creates duplicate
    const secondSubmission = await acknowledgementService.submitAcknowledgement({
      noticeId: testNoticeId,
      userId: testUserId,
      userEmail: 'test99@college.edu',
      displayName: 'Test Student 99',
      noticeVersion: 2,
      completedActionIds: ['chk_1', 'chk_2'],
      hasPendingActions: false,
      notes: 'Updated: Both tasks completed.',
    });

    expect(secondSubmission.id).toBe(firstSubmission.id);
    expect(secondSubmission.actionItemsCompleted).toEqual(['chk_1', 'chk_2']);
  });

  it('marks state as action_required when pending checklist items remain', async () => {
    const actionRequired = await acknowledgementService.submitAcknowledgement({
      noticeId: 'coord_notice_placement_2026',
      userId: 'student_pending_01',
      userEmail: 'pending@college.edu',
      displayName: 'Pending Student',
      noticeVersion: 1,
      completedActionIds: [],
      hasPendingActions: true,
      notes: 'Resume uploaded; NOC signature pending.',
    });

    expect(actionRequired.state).toBe('action_required');
  });

  it('detects notice revision and sets reAcknowledgementRequested', async () => {
    // Student initially acknowledges version 1
    await acknowledgementService.submitAcknowledgement({
      noticeId: 'notice_version_test',
      userId: 'student_ver_01',
      userEmail: 'ver@college.edu',
      displayName: 'Version Tester',
      noticeVersion: 1,
      completedActionIds: [],
      hasPendingActions: false,
    });

    // Notice is bumped to version 2; student views notice again
    const viewedAgain = await acknowledgementService.recordView(
      'notice_version_test',
      'student_ver_01',
      'ver@college.edu',
      'Version Tester',
      2 // Higher version
    );

    expect(viewedAgain.reAcknowledgementRequested).toBe(true);
  });

  it('calculates exact aggregate stats without percentage rounding anomalies', async () => {
    const stats = await acknowledgementService.getNoticeStats(testNoticeId, 2);
    expect(stats.totalEligible).toBeGreaterThan(0);
    expect(stats.acknowledgedCount).toBeGreaterThanOrEqual(0);
    expect(stats.acknowledgementPercentage).toBe(
      Math.round((stats.acknowledgedCount / stats.totalEligible) * 100)
    );
  });
});
