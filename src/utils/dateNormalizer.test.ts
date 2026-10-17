import { describe, it, expect } from 'vitest';
import {
  normalizeDate,
  normalizeTimeRange,
  formatSingleTime,
  formatDisplayDate,
} from './dateNormalizer';

describe('Date & Time Normalizer', () => {
  describe('normalizeDate', () => {
    it('preserves standard ISO date format', () => {
      const res = normalizeDate('2026-11-14');
      expect(res.normalized).toBe('2026-11-14');
      expect(res.isAmbiguous).toBe(false);
    });

    it('normalizes day-month-year textual formats like "14th Nov 2026"', () => {
      const res = normalizeDate('14th Nov 2026');
      expect(res.normalized).toBe('2026-11-14');
      expect(res.isAmbiguous).toBe(false);
    });

    it('normalizes month-day-year textual formats like "Nov 14, 2026"', () => {
      const res = normalizeDate('Nov 14, 2026');
      expect(res.normalized).toBe('2026-11-14');
      expect(res.isAmbiguous).toBe(false);
    });

    it('flags ambiguous dates when day and month can be confused (e.g. 05/06/2026)', () => {
      const res = normalizeDate('05/06/2026');
      expect(res.normalized).toBe('2026-06-05');
      expect(res.isAmbiguous).toBe(true);
    });

    it('unambiguously parses DD/MM when day > 12 (e.g. 24/11/2026)', () => {
      const res = normalizeDate('24/11/2026');
      expect(res.normalized).toBe('2026-11-24');
      expect(res.isAmbiguous).toBe(false);
    });

    it('flags relative academic phrases like "next Friday" as ambiguous', () => {
      const res = normalizeDate('next Friday');
      expect(res.isAmbiguous).toBe(true);
    });

    it('handles empty input safely', () => {
      const res = normalizeDate('');
      expect(res.normalized).toBe('');
      expect(res.isAmbiguous).toBe(true);
    });
  });

  describe('normalizeTimeRange & formatSingleTime', () => {
    it('normalizes single time string "10:00 AM"', () => {
      expect(formatSingleTime('10:00 am')).toBe('10:00 AM');
      expect(formatSingleTime('2pm')).toBe('02:00 PM');
    });

    it('converts 24hr format "14:30" to 12hr "02:30 PM"', () => {
      expect(formatSingleTime('14:30')).toBe('02:30 PM');
      expect(formatSingleTime('09:00')).toBe('09:00 AM');
    });

    it('splits time range "10:00 AM to 1:00 PM"', () => {
      const res = normalizeTimeRange('10:00 AM to 1:00 PM');
      expect(res.startTime).toBe('10:00 AM');
      expect(res.endTime).toBe('01:00 PM');
    });

    it('splits time range with hyphen "10:00 - 12:30"', () => {
      const res = normalizeTimeRange('10:00 - 12:30');
      expect(res.startTime).toBe('10:00 AM');
      expect(res.endTime).toBe('12:30 PM');
    });
  });

  describe('formatDisplayDate', () => {
    it('converts ISO YYYY-MM-DD into human-readable string', () => {
      expect(formatDisplayDate('2026-11-14')).toBe('Nov 14, 2026');
      expect(formatDisplayDate('2026-05-01')).toBe('May 1, 2026');
    });

    it('returns original string if non-ISO', () => {
      expect(formatDisplayDate('TBD')).toBe('TBD');
    });
  });
});
