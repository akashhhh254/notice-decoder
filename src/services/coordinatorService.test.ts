import { describe, it, expect, beforeEach } from 'vitest';
import { coordinatorService, DEMO_COORDINATOR_USER } from './coordinatorService';
import { UserProfile } from '../types/phase2';

describe('Coordinator Service & Notice Lifecycle', () => {
  beforeEach(async () => {
    await coordinatorService.resetToDefaults();
  });

  it('retrieves pre-seeded institutional coordinator notices', async () => {
    const list = await coordinatorService.getAllCoordinatorNotices();
    expect(list.length).toBeGreaterThanOrEqual(3);
    const examNotice = list.find((n) => n.id === 'coord_notice_exam_2026');
    expect(examNotice).toBeDefined();
    expect(examNotice?.isPublished).toBe(true);
    expect(examNotice?.currentVersion).toBe(2);
  });

  it('filters published notices based on student audience cohort', async () => {
    const csStudent: UserProfile = {
      id: 'student_cs_01',
      email: 'student@college.edu',
      displayName: 'Alex Rivera',
      timezone: 'UTC',
      department: 'Computer Science',
      batchYear: '2026',
      createdAt: new Date().toISOString(),
    };

    const notices = await coordinatorService.getPublishedNoticesForStudent(csStudent);
    expect(notices.length).toBeGreaterThanOrEqual(2);
    // Draft notices should not be visible to students
    const draftNotice = notices.find((n) => n.publicationStatus === 'draft');
    expect(draftNotice).toBeUndefined();
  });

  it('publishes a new official circular with target audience', async () => {
    const created = await coordinatorService.publishNotice({
      noticeTitle: 'Autonomous Robotics Workshop & Contest',
      noticeType: 'event',
      urgency: 'normal',
      institution: 'State College of Engineering',
      department: 'Robotics Club',
      referenceNumber: 'ROBO/2026/01',
      plainLanguageSummary: 'Workshop on ROS and autonomous navigation.',
      events: [
        {
          id: 'evt_robo',
          title: 'Robotics Workshop Day 1',
          date: '2026-11-25',
          startTime: '09:00 AM',
          endTime: '04:00 PM',
          venue: 'Robotics Lab',
          isMandatory: false,
        },
      ],
      checklist: [],
      eligibility: { eligibleBatches: ['All'], minimumRequirements: '', prerequisites: [], notes: '' },
      targetAudience: { type: 'all_students' },
      coordinator: DEMO_COORDINATOR_USER,
    });

    expect(created.id).toBeDefined();
    expect(created.isPublished).toBe(true);
    expect(created.currentVersion).toBe(1);

    const fetched = await coordinatorService.getNoticeById(created.id);
    expect(fetched?.noticeTitle).toBe('Autonomous Robotics Workshop & Contest');
  });

  it('issues a material revision and increments version number', async () => {
    const noticeId = 'coord_notice_placement_2026';
    const revised = await coordinatorService.reviseNotice(
      noticeId,
      {
        plainLanguageSummary: 'Updated: Deadline extended by 3 days for all departments.',
      },
      'Extended registration deadline due to server maintenance window',
      DEMO_COORDINATOR_USER,
      true
    );

    expect(revised.currentVersion).toBe(2);
    expect(revised.versionHistory.length).toBeGreaterThanOrEqual(2);
    expect(revised.versionHistory[0].materialChange).toBe(true);
    expect(revised.versionHistory[0].changeSummary).toContain('Extended registration deadline');
  });

  it('archives a notice safely without deleting historical records', async () => {
    const noticeId = 'coord_notice_hackathon_2026';
    await coordinatorService.archiveNotice(noticeId, DEMO_COORDINATOR_USER);

    const fetched = await coordinatorService.getNoticeById(noticeId);
    expect(fetched?.publicationStatus).toBe('archived');
  });

  it('withdraws an official circular with mandatory reason', async () => {
    const noticeId = 'coord_notice_hackathon_2026';
    await coordinatorService.withdrawNotice(
      noticeId,
      'Postponed to spring semester due to venue renovations',
      DEMO_COORDINATOR_USER
    );

    const fetched = await coordinatorService.getNoticeById(noticeId);
    expect(fetched?.publicationStatus).toBe('withdrawn');
    expect(fetched?.withdrawalReason).toContain('Postponed to spring semester');
  });

  it('computes factual aggregate coordinator metrics without fabricated numbers', async () => {
    const metrics = await coordinatorService.getMetrics();
    expect(metrics.totalPublishedNotices).toBeGreaterThanOrEqual(3);
    expect(metrics.totalEligibleStudents).toBeGreaterThan(0);
    expect(metrics.overallAcknowledgementRate).toBeGreaterThanOrEqual(0);
    expect(metrics.overallAcknowledgementRate).toBeLessThanOrEqual(100);
  });
});
