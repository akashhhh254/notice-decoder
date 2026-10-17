import { describe, it, expect } from 'vitest';
import { detectClashes } from './clashDetectionEngine';
import { generateIcsCalendar } from './icsExport';
import { NoticeDecoded } from '../types/notice';
import { TimetableEntry } from '../types/phase2';
import { SAMPLE_NOTICES } from '../data/sampleNotices';

describe('App Experience & Data Invariants', () => {
  it('does not create false clash alarms when an event has missing times', () => {
    const noticeWithMissingTimes: NoticeDecoded = {
      ...SAMPLE_NOTICES[0],
      events: [
        {
          id: 'evt_no_time',
          title: 'Dean Orientation',
          date: '2026-11-17',
          startTime: '', // Missing time
          endTime: '',
          venue: 'Main Auditorium',
          isMandatory: true,
          targetAudience: 'All students',
          evidenceSnippet: 'Dean will speak on 17 Nov',
        },
      ],
    };

    const regularTimetable: TimetableEntry[] = [
      {
        id: 'tt_1',
        userId: 'student_1',
        subjectTitle: 'Operating Systems',
        weekday: 2, // Tuesday (2026-11-17 is Tuesday)
        startTime: '10:00',
        endTime: '11:30',
        venue: 'Room 204',
        timezone: 'UTC',
        semesterStartDate: '2026-08-01',
        semesterEndDate: '2026-12-20',
        createdAt: '2026-08-01T00:00:00Z',
        updatedAt: '2026-08-01T00:00:00Z',
      },
    ];

    const result = detectClashes([noticeWithMissingTimes], regularTimetable);
    // Should NOT report a direct time overlap collision since timing is unknown
    expect(result.conflicts).toHaveLength(0);
    // Should instead raise an uncertain timing warning
    expect(result.uncertainTimingWarnings.length).toBeGreaterThan(0);
  });

  it('generates standard RFC-5545 .ics calendars with proper headers and event delimiters', () => {
    const calendar = generateIcsCalendar([
      {
        event: SAMPLE_NOTICES[0].events[0],
        noticeTitle: SAMPLE_NOTICES[0].noticeTitle,
        institution: SAMPLE_NOTICES[0].institution,
      },
    ]);

    expect(calendar).toContain('BEGIN:VCALENDAR');
    expect(calendar).toContain('VERSION:2.0');
    expect(calendar).toContain('PRODID:-//Notice Decoder//Academic Schedule Engine//EN');
    expect(calendar).toContain('BEGIN:VEVENT');
    expect(calendar).toContain('SUMMARY:');
    expect(calendar).toContain('END:VEVENT');
    expect(calendar).toContain('END:VCALENDAR');
  });

  it('filters notices accurately by search query across title and department', () => {
    const notices = SAMPLE_NOTICES;
    const query = 'hackathon';
    const matches = notices.filter(
      (n) =>
        n.noticeTitle.toLowerCase().includes(query) ||
        n.department?.toLowerCase().includes(query) ||
        n.plainLanguageSummary.toLowerCase().includes(query)
    );

    expect(matches.length).toBeGreaterThan(0);
    expect(matches.some((m) => m.id === 'sample_hackathon_innovatex_2026')).toBe(true);
  });
});
