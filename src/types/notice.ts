/**
 * Notice Decoder - Domain Types
 * Phase 1 Architecture (Designed to extend cleanly to Phase 2/3)
 */

export type NoticeType =
  | 'exam'
  | 'circular'
  | 'event'
  | 'deadline'
  | 'scholarship'
  | 'placement'
  | 'administrative'
  | 'general';

export type UrgencyLevel = 'normal' | 'high' | 'critical';

export type IssueType =
  | 'missing_time'
  | 'ambiguous_date'
  | 'unclear_venue'
  | 'contradictory_info'
  | 'low_confidence'
  | 'missing_deadline';

export type ExtractionSource =
  | 'gemini_multimodal'
  | 'gemini_text'
  | 'deterministic_parser'
  | 'sample_fixture'
  | 'official_circular';

export type NoticeStatus = 'draft' | 'reviewed' | 'confirmed' | 'archived';

export interface NoticeEvent {
  id: string;
  title: string;
  date: string; // ISO date YYYY-MM-DD or standard readable date
  startTime?: string;
  endTime?: string;
  venue?: string;
  isMandatory: boolean;
  targetAudience?: string;
  evidenceSnippet?: string;
}

export interface ActionItem {
  id: string;
  task: string;
  deadline?: string;
  requiredDocuments: string[];
  submissionLinkOrPlace?: string;
  completed: boolean;
  evidenceSnippet?: string;
}

export interface UncertaintyWarning {
  id: string;
  field: string;
  issueType: IssueType;
  explanation: string;
  resolved: boolean;
  userCorrection?: string;
}

export interface NoticeOrganizer {
  name?: string;
  designation?: string;
  department?: string;
  email?: string;
  phone?: string;
  office?: string;
}

export interface NoticeEligibility {
  eligibleBatches: string[];
  minimumRequirements?: string;
  prerequisites: string[];
  notes?: string;
}

export interface EvidencePair {
  claim: string;
  snippet: string;
}

export interface NoticeDecoded {
  id: string;
  noticeTitle: string;
  noticeType: NoticeType;
  urgency: UrgencyLevel;
  institution?: string;
  department?: string;
  referenceNumber?: string;
  publicationDate?: string;
  plainLanguageSummary: string;
  events: NoticeEvent[];
  checklist: ActionItem[];
  eligibility: NoticeEligibility;
  organizer: NoticeOrganizer;
  uncertainties: UncertaintyWarning[];
  rawText: string;
  sourceEvidence: EvidencePair[];
  extractionSource: ExtractionSource;
  status: NoticeStatus;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExtractionRequest {
  text?: string;
  fileData?: string; // base64 encoded
  mimeType?: string;
  fileName?: string;
}

export interface ExtractionResponse {
  success: boolean;
  data: NoticeDecoded;
  source: ExtractionSource;
  message?: string;
  warningNotice?: string;
}
