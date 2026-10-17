import { NoticeDecoded, NoticeEvent } from '../types/notice';
import { parseTimeToMinutes } from './clashDetectionEngine';

/**
 * Escapes characters according to RFC 5545 Section 3.3.11:
 * Backslash, semicolon, comma, and newline characters must be escaped.
 */
export function escapeIcsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Folds lines longer than 75 octets per RFC 5545 Section 3.1:
 * A line is folded by inserting a CRLF followed by a single whitespace character (space or tab).
 */
export function foldIcsLine(line: string): string {
  if (line.length <= 75) return line;

  const chunks: string[] = [];
  let remaining = line;

  // First line can have up to 75 chars
  chunks.push(remaining.substring(0, 75));
  remaining = remaining.substring(75);

  // Subsequent lines have 1 space indent + up to 74 chars
  while (remaining.length > 0) {
    chunks.push(' ' + remaining.substring(0, 74));
    remaining = remaining.substring(74);
  }

  return chunks.join('\r\n');
}

/**
 * Formats date and time into RFC 5545 iCalendar values:
 * - All-day: "VALUE=DATE:YYYYMMDD"
 * - Local timed: "DTSTART:YYYYMMDDTHHMMSS"
 */
export function formatIcsDateTime(dateStr: string, timeStr?: string): {
  isAllDay: boolean;
  dateTimeIcs: string;
} {
  const cleanDate = dateStr.replace(/-/g, '');
  const minutes = parseTimeToMinutes(timeStr);

  if (minutes === null) {
    // All-day date format
    return {
      isAllDay: true,
      dateTimeIcs: cleanDate,
    };
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const timeFormatted = `${String(hours).padStart(2, '0')}${String(mins).padStart(2, '0')}00`;

  return {
    isAllDay: false,
    dateTimeIcs: `${cleanDate}T${timeFormatted}`,
  };
}

/**
 * Generates RFC-5545 compliant .ics content from selected confirmed notice events
 */
export function generateIcsCalendar(
  events: {
    event: NoticeEvent;
    noticeTitle: string;
    institution?: string;
  }[]
): string {
  const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Notice Decoder//Academic Schedule Engine//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  for (const item of events) {
    const { event, noticeTitle, institution } = item;
    if (!event.date || event.date === 'TBD') continue;

    const start = formatIcsDateTime(event.date, event.startTime);
    let end = formatIcsDateTime(event.date, event.endTime);

    // If start is timed but end is missing, default to start + 1 hour
    if (!start.isAllDay && end.isAllDay) {
      const startMins = parseTimeToMinutes(event.startTime) || 600;
      const endMins = Math.min(1439, startMins + 60);
      const hours = Math.floor(endMins / 60);
      const mins = endMins % 60;
      const cleanDate = event.date.replace(/-/g, '');
      end = {
        isAllDay: false,
        dateTimeIcs: `${cleanDate}T${String(hours).padStart(2, '0')}${String(mins).padStart(2, '0')}00`,
      };
    }

    const uid = `${event.id}_${event.date.replace(/-/g, '')}@noticedecoder.internal`;
    const summary = escapeIcsText(event.title);
    const location = escapeIcsText(event.venue || 'Campus / See Notice');

    const descParts: string[] = [
      `Official Notice: ${noticeTitle}`,
      institution ? `Institution: ${institution}` : '',
      event.targetAudience ? `Target Audience: ${event.targetAudience}` : '',
      event.isMandatory ? 'Attendance: Compulsory / Mandatory' : '',
      event.evidenceSnippet ? `Source Evidence: "${event.evidenceSnippet}"` : '',
    ].filter(Boolean);

    const description = escapeIcsText(descParts.join('\n'));

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtStamp}`);

    if (start.isAllDay) {
      lines.push(`DTSTART;VALUE=DATE:${start.dateTimeIcs}`);
      lines.push(`DTEND;VALUE=DATE:${end.dateTimeIcs}`);
    } else {
      lines.push(`DTSTART:${start.dateTimeIcs}`);
      lines.push(`DTEND:${end.dateTimeIcs}`);
    }

    lines.push(`SUMMARY:${summary}`);
    if (description) lines.push(`DESCRIPTION:${description}`);
    if (location) lines.push(`LOCATION:${location}`);
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  // Fold lines exceeding 75 chars and join with standard CRLF
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

/**
 * Triggers browser download of generated .ics content
 */
export function downloadIcsFile(icsContent: string, fileName = 'academic_schedule.ics'): void {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
