import { describe, it, expect } from 'vitest';
import {
  escapeIcsText,
  foldIcsLine,
  formatIcsDateTime,
  generateIcsCalendar,
} from './icsExport';

describe('RFC 5545 iCalendar Exporter', () => {
  describe('escapeIcsText', () => {
    it('escapes commas, semicolons, backslashes, and newlines', () => {
      const input = 'Bring ID card, fee receipt; check\\verify\nNext line';
      const output = escapeIcsText(input);
      expect(output).toBe('Bring ID card\\, fee receipt\\; check\\\\verify\\nNext line');
    });

    it('handles empty input gracefully', () => {
      expect(escapeIcsText('')).toBe('');
    });
  });

  describe('foldIcsLine', () => {
    it('does not fold lines shorter than or equal to 75 octets', () => {
      const line = 'SUMMARY:Distributed Systems Midterm Exam';
      expect(foldIcsLine(line)).toBe(line);
    });

    it('folds long content lines at 75 octets with CRLF and single space indent', () => {
      const longLine = 'DESCRIPTION:This is an extremely long academic circular description that exceeds seventy-five octets and therefore must be properly folded by the iCalendar generator.';
      const folded = foldIcsLine(longLine);
      expect(folded).toContain('\r\n ');

      const lines = folded.split('\r\n');
      expect(lines[0].length).toBeLessThanOrEqual(75);
      expect(lines[1].startsWith(' ')).toBe(true);
    });
  });

  describe('formatIcsDateTime', () => {
    it('formats timed events into local YYYYMMDDTHHMMSS', () => {
      const res = formatIcsDateTime('2026-11-17', '10:00 AM');
      expect(res.isAllDay).toBe(false);
      expect(res.dateTimeIcs).toBe('20261117T100000');
    });

    it('formats all-day events into YYYYMMDD without time suffix', () => {
      const res = formatIcsDateTime('2026-11-17', '');
      expect(res.isAllDay).toBe(true);
      expect(res.dateTimeIcs).toBe('20261117');
    });
  });

  describe('generateIcsCalendar', () => {
    it('generates a strictly compliant VCALENDAR with VEVENT items', () => {
      const events = [
        {
          event: {
            id: 'evt_test_1',
            title: 'Neural Networks Final Exam',
            date: '2026-11-19',
            startTime: '10:00 AM',
            endTime: '12:30 PM',
            venue: 'Block B Room 201',
            isMandatory: true,
            evidenceSnippet: '19/11/2026 | 10:00 - 12:30 hrs',
          },
          noticeTitle: 'Odd Semester Exam Notice 2026',
          institution: 'State Institute of Engineering',
        },
      ];

      const ics = generateIcsCalendar(events);
      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('PRODID:-//Notice Decoder//Academic Schedule Engine//EN');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('UID:evt_test_1_20261119@noticedecoder.internal');
      expect(ics).toContain('DTSTART:20261119T100000');
      expect(ics).toContain('DTEND:20261119T123000');
      expect(ics).toContain('SUMMARY:Neural Networks Final Exam');
      expect(ics).toContain('LOCATION:Block B Room 201');
      expect(ics).toContain('STATUS:CONFIRMED');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });
  });
});
