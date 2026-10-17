/**
 * Date and Time Normalization Utilities for Notice Decoder
 * Handles irregular academic circular formats, time ranges, and ambiguities.
 */

const MONTHS_MAP: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', sept: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

/**
 * Normalizes irregular date strings like "14th Nov 2026", "14-11-2026", "November 14, 2026"
 * into standard ISO format "YYYY-MM-DD" when identifiable.
 */
export function normalizeDate(input: string, referenceYear = 2026): {
  normalized: string;
  isAmbiguous: boolean;
  raw: string;
} {
  if (!input || !input.trim()) {
    return { normalized: '', isAmbiguous: true, raw: '' };
  }

  const raw = input.trim();

  // Already standard ISO: 2026-11-14
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { normalized: raw, isAmbiguous: false, raw };
  }

  // Pattern: "14th Nov 2026" or "14 November 2026" or "Nov 14, 2026"
  const wordMonthRegex = /(?:(\d{1,2})(?:st|nd|rd|th)?[\s,-]+([a-zA-Z]{3,9})[\s,-]+(\d{4}))|(?:([a-zA-Z]{3,9})[\s,-]+(\d{1,2})(?:st|nd|rd|th)?(?:[\s,-]+(\d{4}))?)/i;
  const wordMatch = raw.match(wordMonthRegex);

  if (wordMatch) {
    let day = '';
    let monthName = '';
    let year = '';

    if (wordMatch[1] && wordMatch[2]) {
      // 14th Nov 2026
      day = wordMatch[1].padStart(2, '0');
      monthName = wordMatch[2].toLowerCase();
      year = wordMatch[3] || String(referenceYear);
    } else if (wordMatch[4] && wordMatch[5]) {
      // Nov 14, 2026
      monthName = wordMatch[4].toLowerCase();
      day = wordMatch[5].padStart(2, '0');
      year = wordMatch[6] || String(referenceYear);
    }

    const monthNum = MONTHS_MAP[monthName];
    if (monthNum && day && year) {
      return {
        normalized: `${year}-${monthNum}-${day}`,
        isAmbiguous: !wordMatch[3] && !wordMatch[6], // Ambiguous if year was inferred
        raw,
      };
    }
  }

  // Pattern: "14/11/2026" or "14-11-2026" or "14.11.2026" (DD/MM/YYYY)
  const numericMatch = raw.match(/(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/);
  if (numericMatch) {
    let partA = parseInt(numericMatch[1], 10);
    let partB = parseInt(numericMatch[2], 10);
    let partC = numericMatch[3];
    let year = partC.length === 2 ? `20${partC}` : partC;

    // Determine DD/MM vs MM/DD
    let day: number;
    let month: number;
    let ambiguous = false;

    if (partA > 12) {
      // Must be DD/MM
      day = partA;
      month = partB;
    } else if (partB > 12) {
      // Must be MM/DD
      month = partA;
      day = partB;
    } else {
      // Ambiguous between DD/MM and MM/DD, default to international DD/MM for universities
      day = partA;
      month = partB;
      ambiguous = true;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return {
        normalized: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        isAmbiguous: ambiguous,
        raw,
      };
    }
  }

  // Check for relative phrases like "tomorrow", "next Friday"
  if (/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(raw) ||
      /coming\s+week/i.test(raw) ||
      /tentatively/i.test(raw)) {
    return {
      normalized: raw,
      isAmbiguous: true,
      raw,
    };
  }

  return { normalized: raw, isAmbiguous: true, raw };
}

/**
 * Normalizes time strings like "10:00 AM", "10 AM", "14:30", "10:00 AM - 1:00 PM"
 */
export function normalizeTimeRange(input: string): {
  startTime: string;
  endTime: string;
  raw: string;
} {
  if (!input || !input.trim()) {
    return { startTime: '', endTime: '', raw: '' };
  }

  const raw = input.trim();
  // Splits by to, -, –, ~
  const parts = raw.split(/\s+(?:to|-|–|until|till)\s+/i);

  if (parts.length >= 2) {
    return {
      startTime: formatSingleTime(parts[0]),
      endTime: formatSingleTime(parts[1]),
      raw,
    };
  }

  // If single time
  return {
    startTime: formatSingleTime(raw),
    endTime: '',
    raw,
  };
}

export function formatSingleTime(str: string): string {
  const trimmed = str.trim();
  // 10:00 AM / 10am
  const ampmMatch = trimmed.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (ampmMatch) {
    const hours = ampmMatch[1];
    const mins = ampmMatch[2] || '00';
    const ampm = ampmMatch[3].toUpperCase();
    return `${hours.padStart(2, '0')}:${mins} ${ampm}`;
  }

  // 24-hr format: 14:30 or 09:00 hrs
  const hr24Match = trimmed.match(/(\d{1,2}):(\d{2})/);
  if (hr24Match) {
    let hour = parseInt(hr24Match[1], 10);
    const mins = hr24Match[2];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    if (hour > 12) hour -= 12;
    if (hour === 0) hour = 12;
    return `${String(hour).padStart(2, '0')}:${mins} ${ampm}`;
  }

  return trimmed;
}

/**
 * Formats standard ISO YYYY-MM-DD into a human-readable academic display string
 * e.g. "2026-11-14" -> "Nov 14, 2026"
 */
export function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return 'TBD';
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return isoDate;

  const year = match[1];
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  return `${monthNames[month - 1]} ${day}, ${year}`;
}
