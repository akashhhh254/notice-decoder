import { describe, it, expect } from 'vitest';
import { NoticeDecodedSchema, NoticeEventSchema, ActionItemSchema } from './noticeSchema';

describe('Notice Schema Validation (Zod)', () => {
  it('validates a complete valid NoticeDecoded payload', () => {
    const validNotice = {
      noticeTitle: 'Odd Semester Examination Timetable',
      noticeType: 'exam',
      urgency: 'high',
      institution: 'State Technical University',
      department: 'Examination Office',
      referenceNumber: 'STU/EXAM/2026/01',
      publicationDate: '2026-10-10',
      plainLanguageSummary: 'Exams run Nov 15-20. Dues must be cleared before Nov 10.',
      events: [
        {
          title: 'CS301 Data Structures',
          date: '2026-11-15',
          startTime: '10:00 AM',
          endTime: '12:30 PM',
          venue: 'Room 101',
          isMandatory: true,
        },
      ],
      checklist: [
        {
          task: 'Collect physical hall ticket',
          deadline: '2026-11-12',
          requiredDocuments: ['Identity Card'],
          completed: false,
        },
      ],
      eligibility: {
        eligibleBatches: ['2024-2028'],
        minimumRequirements: '75% attendance',
        prerequisites: [],
        notes: '',
      },
      organizer: {
        name: 'Dr. John Doe',
        designation: 'Controller of Examinations',
      },
      uncertainties: [],
      rawText: 'Full raw text of notice here',
      sourceEvidence: [
        { claim: 'Exams run Nov 15-20', snippet: 'Exams run Nov 15-20' },
      ],
      extractionSource: 'deterministic_parser',
      status: 'confirmed',
    };

    const parsed = NoticeDecodedSchema.safeParse(validNotice);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.noticeTitle).toBe('Odd Semester Examination Timetable');
      expect(parsed.data.events).toHaveLength(1);
      expect(parsed.data.checklist).toHaveLength(1);
    }
  });

  it('rejects notice when noticeTitle is empty', () => {
    const invalidNotice = {
      noticeTitle: '',
      plainLanguageSummary: 'Some summary',
    };

    const parsed = NoticeDecodedSchema.safeParse(invalidNotice);
    expect(parsed.success).toBe(false);
  });

  it('defaults optional fields safely', () => {
    const minimalEvent = {
      title: 'Workshop Opening',
    };
    const parsed = NoticeEventSchema.safeParse(minimalEvent);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.date).toBe('TBD');
      expect(parsed.data.isMandatory).toBe(false);
      expect(parsed.data.id).toBeDefined();
    }
  });

  it('validates action item schema defaults', () => {
    const minimalAction = {
      task: 'Submit project abstract',
    };
    const parsed = ActionItemSchema.safeParse(minimalAction);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.completed).toBe(false);
      expect(parsed.data.requiredDocuments).toEqual([]);
      expect(parsed.data.id).toBeDefined();
    }
  });
});
