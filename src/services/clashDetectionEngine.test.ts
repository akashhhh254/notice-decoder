import { describe, it, expect } from 'vitest';
import {
  parseTimeToMinutes,
  checkIntervalOverlap,
  getWeekdayFromDate,
  isDateWithinSemester,
  detectClashes,
} from './clashDetectionEngine';
import { TimetableEntry } from '../types/phase2';
import { NoticeDecoded } from '../types/notice';

describe('Clash Detection Engine', () => {
  describe('parseTimeToMinutes', () => {
    it('converts 12-hr AM/PM times to minutes correctly', () => {
      expect(parseTimeToMinutes('10:00 AM')).toBe(600);
      expect(parseTimeToMinutes('12:00 PM')).toBe(720);
      expect(parseTimeToMinutes('12:30 AM')).toBe(30);
      expect(parseTimeToMinutes('02:30 PM')).toBe(870);
    });

    it('converts 24-hr format to minutes correctly', () => {
      expect(parseTimeToMinutes('14:30')).toBe(870);
      expect(parseTimeToMinutes('09:00')).toBe(540);
      expect(parseTimeToMinutes('10:15 hrs')).toBe(615);
    });

    it('returns null on invalid or empty times', () => {
      expect(parseTimeToMinutes('')).toBeNull();
      expect(parseTimeToMinutes('TBD')).toBeNull();
      expect(parseTimeToMinutes('afternoon')).toBeNull();
    });
  });

  describe('checkIntervalOverlap math', () => {
    it('detects overlap when interval A is inside interval B', () => {
      // 10:00 - 11:30 (600 - 690) inside 09:30 - 12:30 (570 - 750)
      const res = checkIntervalOverlap(600, 690, 570, 750);
      expect(res.overlaps).toBe(true);
      expect(res.overlapMinutes).toBe(90);
    });

    it('detects overlap when intervals partially intersect', () => {
      // 10:00 - 12:00 (600 - 720) and 11:00 - 13:00 (660 - 780)
      const res = checkIntervalOverlap(600, 720, 660, 780);
      expect(res.overlaps).toBe(true);
      expect(res.overlapMinutes).toBe(60);
    });

    it('confirms adjacent intervals (back-to-back) DO NOT overlap', () => {
      // Class 1 ends at 11:00 (660), Class 2 starts at 11:00 (660)
      const res1 = checkIntervalOverlap(600, 660, 660, 720);
      expect(res1.overlaps).toBe(false);
      expect(res1.overlapMinutes).toBe(0);

      // Class 2 starts at 12:00 (720), Exam ends at 12:00 (720)
      const res2 = checkIntervalOverlap(720, 780, 600, 720);
      expect(res2.overlaps).toBe(false);
      expect(res2.overlapMinutes).toBe(0);
    });

    it('returns false for completely disjoint intervals', () => {
      // 09:00 - 10:00 (540 - 600) and 14:00 - 15:00 (840 - 900)
      const res = checkIntervalOverlap(540, 600, 840, 900);
      expect(res.overlaps).toBe(false);
      expect(res.overlapMinutes).toBe(0);
    });
  });

  describe('getWeekdayFromDate', () => {
    it('accurately identifies weekday numbers for standard ISO dates', () => {
      // 2026-11-17 is a Tuesday (Weekday 2)
      expect(getWeekdayFromDate('2026-11-17')).toBe(2);
      // 2026-11-16 is a Monday (Weekday 1)
      expect(getWeekdayFromDate('2026-11-16')).toBe(1);
      // 2026-11-22 is a Sunday (Weekday 7)
      expect(getWeekdayFromDate('2026-11-22')).toBe(7);
    });
  });

  describe('isDateWithinSemester', () => {
    it('returns true when event falls within bounds', () => {
      expect(isDateWithinSemester('2026-11-17', '2026-08-01', '2026-12-20')).toBe(true);
    });

    it('returns false when event is outside bounds', () => {
      expect(isDateWithinSemester('2027-01-10', '2026-08-01', '2026-12-20')).toBe(false);
      expect(isDateWithinSemester('2026-07-15', '2026-08-01', '2026-12-20')).toBe(false);
    });
  });

  describe('detectClashes end-to-end', () => {
    const mockClass: TimetableEntry = {
      id: 'tt_lecture_1',
      userId: 'user_1',
      subjectTitle: 'CS401 Distributed Systems',
      weekday: 2, // Tuesday
      startTime: '10:00',
      endTime: '11:30',
      venue: 'Room 204',
      timezone: 'UTC',
      semesterStartDate: '2026-08-01',
      semesterEndDate: '2026-12-20',
      recurrenceRule: 'FREQ=WEEKLY',
      color: '#0369a1',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    };

    const mockNotice: NoticeDecoded = {
      id: 'notice_exam_1',
      noticeTitle: 'Odd Semester Midterms',
      noticeType: 'exam',
      urgency: 'critical',
      institution: 'State Engineering College',
      plainLanguageSummary: 'Exam notice',
      events: [
        {
          id: 'evt_exam_tue',
          title: 'Distributed Systems & Cloud Computing Exam',
          date: '2026-11-17', // Tuesday!
          startTime: '10:00 AM',
          endTime: '12:30 PM',
          venue: 'Block B Hall',
          isMandatory: true,
          evidenceSnippet: 'Exam held on 17/11/2026 from 10:00 to 12:30 hrs',
        },
      ],
      checklist: [],
      eligibility: { eligibleBatches: [], prerequisites: [] },
      organizer: {},
      uncertainties: [],
      rawText: 'Exam raw text',
      sourceEvidence: [],
      extractionSource: 'deterministic_parser',
      status: 'confirmed',
      createdAt: '2026-10-12T00:00:00Z',
      updatedAt: '2026-10-12T00:00:00Z',
    };

    it('flags conflict between notice exam and enrolled Tuesday class', () => {
      const { conflicts } = detectClashes([mockNotice], [mockClass]);
      expect(conflicts).toHaveLength(1);

      const conflict = conflicts[0];
      expect(conflict.classTitle).toBe('CS401 Distributed Systems');
      expect(conflict.noticeEventTitle).toBe('Distributed Systems & Cloud Computing Exam');
      expect(conflict.conflictDate).toBe('2026-11-17');
      expect(conflict.overlapMinutes).toBe(90);
    });

    it('flags uncertain timing warning if notice event lacks end time', () => {
      const noticeWithoutEndTime: NoticeDecoded = {
        ...mockNotice,
        events: [
          {
            id: 'evt_no_end',
            title: 'Campus Seminar',
            date: '2026-11-17',
            startTime: '10:00 AM',
            endTime: '', // Missing end time!
            isMandatory: false,
          },
        ],
      };

      const { conflicts, uncertainTimingWarnings } = detectClashes([noticeWithoutEndTime], [mockClass]);
      expect(conflicts).toHaveLength(0);
      expect(uncertainTimingWarnings).toHaveLength(1);
      expect(uncertainTimingWarnings[0].isUncertainTiming).toBe(true);
    });

    it('respects user dismissal of false positives', () => {
      const { conflicts } = detectClashes([mockNotice], [mockClass], [
        {
          id: 'rev_1',
          userId: 'user_1',
          eventId: 'evt_exam_tue',
          timetableEntryId: 'tt_lecture_1',
          status: 'dismissed',
          updatedAt: new Date().toISOString(),
        },
      ]);

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].status).toBe('dismissed');
    });
  });
});
