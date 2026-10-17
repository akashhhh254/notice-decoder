import { z } from 'zod';

export const NoticeEventSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  title: z.string().min(1, 'Event title is required'),
  date: z.string().default('TBD'),
  startTime: z.string().optional().default(''),
  endTime: z.string().optional().default(''),
  venue: z.string().optional().default(''),
  isMandatory: z.boolean().default(false),
  targetAudience: z.string().optional().default(''),
  evidenceSnippet: z.string().optional().default(''),
});

export const ActionItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  task: z.string().min(1, 'Task description is required'),
  deadline: z.string().optional().default(''),
  requiredDocuments: z.array(z.string()).default([]),
  submissionLinkOrPlace: z.string().optional().default(''),
  completed: z.boolean().default(false),
  evidenceSnippet: z.string().optional().default(''),
});

export const UncertaintyWarningSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  field: z.string(),
  issueType: z.enum([
    'missing_time',
    'ambiguous_date',
    'unclear_venue',
    'contradictory_info',
    'low_confidence',
    'missing_deadline',
  ]),
  explanation: z.string(),
  resolved: z.boolean().default(false),
  userCorrection: z.string().optional(),
});

export const NoticeOrganizerSchema = z.object({
  name: z.string().optional().default(''),
  designation: z.string().optional().default(''),
  department: z.string().optional().default(''),
  email: z.string().optional().default(''),
  phone: z.string().optional().default(''),
  office: z.string().optional().default(''),
});

export const NoticeEligibilitySchema = z.object({
  eligibleBatches: z.array(z.string()).default([]),
  minimumRequirements: z.string().optional().default(''),
  prerequisites: z.array(z.string()).default([]),
  notes: z.string().optional().default(''),
});

export const EvidencePairSchema = z.object({
  claim: z.string(),
  snippet: z.string(),
});

export const NoticeDecodedSchema = z.object({
  id: z.string().default(() => 'notice_' + Date.now().toString(36)),
  noticeTitle: z.string().min(1, 'Notice title is required'),
  noticeType: z.enum([
    'exam',
    'circular',
    'event',
    'deadline',
    'scholarship',
    'placement',
    'administrative',
    'general',
  ]).default('general'),
  urgency: z.enum(['normal', 'high', 'critical']).default('normal'),
  institution: z.string().optional().default(''),
  department: z.string().optional().default(''),
  referenceNumber: z.string().optional().default(''),
  publicationDate: z.string().optional().default(''),
  plainLanguageSummary: z.string().min(1, 'Summary is required'),
  events: z.array(NoticeEventSchema).default([]),
  checklist: z.array(ActionItemSchema).default([]),
  eligibility: NoticeEligibilitySchema.default(() => ({
    eligibleBatches: [],
    minimumRequirements: '',
    prerequisites: [],
    notes: '',
  })),
  organizer: NoticeOrganizerSchema.default(() => ({
    name: '',
    designation: '',
    department: '',
    email: '',
    phone: '',
    office: '',
  })),
  uncertainties: z.array(UncertaintyWarningSchema).default([]),
  rawText: z.string().default(''),
  sourceEvidence: z.array(EvidencePairSchema).default([]),
  extractionSource: z.enum([
    'gemini_multimodal',
    'gemini_text',
    'deterministic_parser',
    'sample_fixture',
    'official_circular',
  ]).default('sample_fixture'),
  status: z.enum(['draft', 'reviewed', 'confirmed', 'archived']).default('reviewed'),
  fileName: z.string().nullable().optional(),
  fileType: z.string().nullable().optional(),
  fileSize: z.number().nullable().optional(),
  createdAt: z.string().default(() => new Date().toISOString()),
  updatedAt: z.string().default(() => new Date().toISOString()),
});

export type NoticeDecodedInput = z.input<typeof NoticeDecodedSchema>;
