import { describe, it, expect } from 'vitest';
import { parseNoticeDeterministically } from './deterministicParser';

describe('Deterministic Notice Parser', () => {
  const sampleCircularText = `STATE TECHNICAL UNIVERSITY
Ref No: STU/CIRCULAR/2026/45                                  Date: 14-10-2026

NOTICE: END SEMESTER PRACTICAL VIVA EXAMINATIONS

All 4th-Year B.Tech CSE students are informed that external viva will be held on 24th Nov 2026 in Central Computing Lab 3 from 09:30 AM to 04:30 PM.

Instructions:
1. Submit signed lab manual and project report by 20th Nov 2026, 4:00 PM at Department Counter.
2. Mandatory to carry college identity card and hall ticket.
3. Attendance is compulsory for all candidates.

Dr. S. Sharma
Head of Department
Email: hod.cse@stu.edu`;

  it('correctly extracts reference number and publication date', () => {
    const result = parseNoticeDeterministically(sampleCircularText);
    expect(result.referenceNumber).toBe('STU/CIRCULAR/2026/45');
    expect(result.publicationDate).toBe('2026-10-14');
  });

  it('classifies notice type as exam or circular', () => {
    const result = parseNoticeDeterministically(sampleCircularText);
    expect(result.noticeType).toBe('exam');
  });

  it('extracts event details and timetable', () => {
    const result = parseNoticeDeterministically(sampleCircularText);
    expect(result.events.length).toBeGreaterThanOrEqual(1);

    const vivaEvent = result.events[0];
    expect(vivaEvent.date).toBe('2026-11-24');
    expect(vivaEvent.startTime).toBe('09:30 AM');
    expect(vivaEvent.endTime).toBe('04:30 PM');
    expect(vivaEvent.venue).toContain('Central Computing Lab');
  });

  it('extracts actionable checklist items and required documents', () => {
    const result = parseNoticeDeterministically(sampleCircularText);
    expect(result.checklist.length).toBeGreaterThanOrEqual(1);

    const hasIdCardDoc = result.checklist.some((item) =>
      item.requiredDocuments.some((d) => d.includes('Identity Card') || d.includes('Hall Ticket'))
    );
    expect(hasIdCardDoc).toBe(true);
  });

  it('extracts coordinator contact information', () => {
    const result = parseNoticeDeterministically(sampleCircularText);
    expect(result.organizer.email).toBe('hod.cse@stu.edu');
  });

  it('flags uncertainties when an event has a date but missing time', () => {
    const textWithoutTime = `COLLEGE NOTICE
Event scheduled on 18th Nov 2026 in Auditorium. All must attend.`;
    const result = parseNoticeDeterministically(textWithoutTime);
    const hasTimeWarning = result.uncertainties.some((u) => u.issueType === 'missing_time');
    expect(hasTimeWarning).toBe(true);
  });
});
