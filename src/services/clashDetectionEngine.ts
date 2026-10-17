import { NoticeDecoded, NoticeEvent } from '../types/notice';
import { TimetableEntry, ConflictOverlap, ConflictReview, WeekdayNumber } from '../types/phase2';

/**
 * Parses diverse time strings ("10:00 AM", "14:30", "1:00 PM", "09:30")
 * into minutes from midnight (0 to 1439).
 * Returns null if string is missing, invalid, or unparseable.
 */
export function parseTimeToMinutes(timeStr?: string): number | null {
  if (!timeStr || !timeStr.trim()) return null;

  const trimmed = timeStr.trim().toLowerCase();

  // 12-hr format with AM/PM (e.g. "10:30 am", "2:00 pm", "12:15 pm", "12:00 am")
  const ampmMatch = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = ampmMatch[2] ? parseInt(ampmMatch[2], 10) : 0;
    const isPM = ampmMatch[3].toLowerCase() === 'pm';

    if (hours === 12) {
      hours = isPM ? 12 : 0;
    } else if (isPM) {
      hours += 12;
    }

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return hours * 60 + minutes;
    }
  }

  // 24-hr format (e.g. "14:30", "09:15", "10:00")
  const hr24Match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*hrs)?$/i);
  if (hr24Match) {
    const hours = parseInt(hr24Match[1], 10);
    const minutes = parseInt(hr24Match[2], 10);

    if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
      return hours * 60 + minutes;
    }
  }

  return null;
}

/**
 * Mathematical interval overlap check between two intervals [startA, endA] and [startB, endB].
 * Strict theorem: Two intervals on the same date overlap if and only if:
 *   startA < endB AND startB < endA
 * Adjacent intervals where startA == endB or endA == startB DO NOT overlap (0 minutes).
 */
export function checkIntervalOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): { overlaps: boolean; overlapMinutes: number } {
  // Validate interval order
  if (startA >= endA || startB >= endB) {
    return { overlaps: false, overlapMinutes: 0 };
  }

  const overlaps = startA < endB && startB < endA;
  if (!overlaps) {
    return { overlaps: false, overlapMinutes: 0 };
  }

  const overlapStart = Math.max(startA, startB);
  const overlapEnd = Math.min(endA, endB);
  const overlapMinutes = Math.max(0, overlapEnd - overlapStart);

  return {
    overlaps: overlapMinutes > 0,
    overlapMinutes,
  };
}

/**
 * Extracts weekday number from ISO date "YYYY-MM-DD"
 * Returns 1 for Monday through 7 for Sunday (ISO standard)
 */
export function getWeekdayFromDate(isoDate: string): WeekdayNumber | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;

  const [year, month, day] = isoDate.split('-').map((v) => parseInt(v, 10));
  // Create UTC date to avoid local timezone off-by-one errors
  const d = new Date(Date.UTC(year, month - 1, day));
  if (isNaN(d.getTime())) return null;

  const dayOfWeek = d.getUTCDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  return dayOfWeek === 0 ? 7 : (dayOfWeek as WeekdayNumber);
}

/**
 * Checks whether an event date falls within an optional semester start/end range
 */
export function isDateWithinSemester(
  eventDate: string,
  startDate?: string,
  endDate?: string
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate)) return true; // Can't rule out if non-standard

  if (startDate && startDate <= eventDate === false) return false;
  if (endDate && eventDate <= endDate === false) return false;

  return true;
}

/**
 * Primary Clash Detection Engine
 * Compares notice events with recurring timetable entries and returns:
 * - Verified time-bound clashes
 * - Uncertain timing warnings (e.g. notice event date matches class weekday but notice time is missing)
 */
export function detectClashes(
  notices: NoticeDecoded[],
  timetable: TimetableEntry[],
  reviews: ConflictReview[] = []
): {
  conflicts: ConflictOverlap[];
  uncertainTimingWarnings: ConflictOverlap[];
} {
  const conflicts: ConflictOverlap[] = [];
  const uncertainTimingWarnings: ConflictOverlap[] = [];

  // Index reviews for fast status lookup
  const reviewMap = new Map<string, 'active' | 'dismissed' | 'resolved'>();
  reviews.forEach((r) => {
    reviewMap.set(`${r.eventId}_${r.timetableEntryId}`, r.status);
  });

  for (const notice of notices) {
    // Only examine active or confirmed notices
    if (notice.status === 'archived') continue;

    for (const evt of notice.events) {
      if (!evt.date || evt.date === 'TBD') continue;

      const eventWeekday = getWeekdayFromDate(evt.date);
      if (!eventWeekday) continue;

      // Find timetable classes that occur on this weekday
      const matchingClasses = timetable.filter((c) => c.weekday === eventWeekday);

      for (const cls of matchingClasses) {
        // Check if event date falls within the semester bounds of the class
        if (!isDateWithinSemester(evt.date, cls.semesterStartDate, cls.semesterEndDate)) {
          continue;
        }

        const reviewKey = `${evt.id}_${cls.id}`;
        const userReviewStatus = reviewMap.get(reviewKey) || 'active';

        const eventStartMins = parseTimeToMinutes(evt.startTime);
        const eventEndMins = parseTimeToMinutes(evt.endTime);
        const classStartMins = parseTimeToMinutes(cls.startTime);
        const classEndMins = parseTimeToMinutes(cls.endTime);

        // Case A: Both event and class have verified times
        if (
          eventStartMins !== null &&
          eventEndMins !== null &&
          classStartMins !== null &&
          classEndMins !== null
        ) {
          const { overlaps, overlapMinutes } = checkIntervalOverlap(
            eventStartMins,
            eventEndMins,
            classStartMins,
            classEndMins
          );

          if (overlaps) {
            const venueClash = Boolean(
              evt.venue &&
              cls.venue &&
              evt.venue.toLowerCase().trim() !== cls.venue.toLowerCase().trim()
            );

            conflicts.push({
              id: `conflict_${evt.id}_${cls.id}`,
              noticeId: notice.id,
              noticeTitle: notice.noticeTitle,
              noticeEventId: evt.id,
              noticeEventTitle: evt.title,
              timetableEntryId: cls.id,
              classTitle: cls.subjectTitle,
              conflictDate: evt.date,
              noticeTimeRange: `${evt.startTime} - ${evt.endTime}`,
              classTimeRange: `${cls.startTime} - ${cls.endTime}`,
              overlapMinutes,
              venueClash,
              evidenceSnippet: evt.evidenceSnippet,
              explanation: `Notice event "${evt.title}" (${evt.startTime} - ${evt.endTime}) overlaps with regular class "${cls.subjectTitle}" (${cls.startTime} - ${cls.endTime}) by ${overlapMinutes} minutes on ${evt.date}.`,
              status: userReviewStatus,
              isUncertainTiming: false,
            });
          }
        }
        // Case B: Event is on the same day as class, but event start or end time is missing
        else if (eventStartMins === null || eventEndMins === null) {
          uncertainTimingWarnings.push({
            id: `uncertain_${evt.id}_${cls.id}`,
            noticeId: notice.id,
            noticeTitle: notice.noticeTitle,
            noticeEventId: evt.id,
            noticeEventTitle: evt.title,
            timetableEntryId: cls.id,
            classTitle: cls.subjectTitle,
            conflictDate: evt.date,
            noticeTimeRange: evt.startTime ? `${evt.startTime} (end time unstated)` : 'Time unstated in circular',
            classTimeRange: `${cls.startTime} - ${cls.endTime}`,
            overlapMinutes: 0,
            venueClash: false,
            evidenceSnippet: evt.evidenceSnippet,
            explanation: `Notice event "${evt.title}" takes place on ${evt.date} (same day as "${cls.subjectTitle}"), but the notice does not state a complete time window. Verify timing to prevent clash.`,
            status: userReviewStatus,
            isUncertainTiming: true,
          });
        }
      }
    }
  }

  return { conflicts, uncertainTimingWarnings };
}
