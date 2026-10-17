import {
  CoordinatorNotice,
  TargetAudience,
  PublicationStatus,
  NoticeVersion,
  CoordinatorMetrics,
} from '../types/phase3';
import { UserProfile } from '../types/phase2';
import { NoticeDecoded, NoticeEvent, ActionItem } from '../types/notice';
import { acknowledgementService } from './acknowledgementService';
import { auditService } from './auditService';
import { notificationService } from './notificationService';

const COORD_NOTICES_STORAGE_KEY = 'notice_decoder_coordinator_notices_v3';

const safeStorage = {
  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return null;
  },
  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // ignore
      }
    }
  },
};

export const DEMO_COORDINATOR_USER: UserProfile = {
  id: 'coord_dean_01',
  email: 'dean.academics@college.edu',
  displayName: 'Dr. Eleanor Vance (Dean of Academics)',
  timezone: 'UTC',
  role: 'coordinator',
  department: 'Academic Affairs & Examination Branch',
  createdAt: '2026-01-10T08:00:00Z',
};

export const INITIAL_COORDINATOR_NOTICES: CoordinatorNotice[] = [
  {
    id: 'coord_notice_exam_2026',
    noticeTitle: 'Odd-Semester End-Term Examination Schedule & Hall Ticket Issuance Circular',
    noticeType: 'exam',
    urgency: 'critical',
    institution: 'State College of Engineering & Technology',
    department: 'Controller of Examinations',
    referenceNumber: 'COE/ODD/2026/EX-104',
    publicationDate: '2026-10-15',
    plainLanguageSummary:
      'The university odd-semester end-term examinations will commence on 15 November 2026. Hall tickets will be issued exclusively through the student portal after clearing library dues and fee clearances. CS401 Distributed Systems has been moved to Main Auditorium Hall B.',
    events: [
      {
        id: 'evt_midterm_paper1',
        title: 'CS401: Distributed Systems End-Term Exam (Updated Venue)',
        date: '2026-11-15',
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        venue: 'Main Auditorium Hall B',
        isMandatory: true,
        targetAudience: 'CS 4th Year (Batch 2026)',
        evidenceSnippet: 'CS401: Distributed Systems exam on 15th Nov 2026, 10:00 AM to 01:00 PM at Main Auditorium Hall B.',
      },
      {
        id: 'evt_midterm_paper2',
        title: 'CS403: Machine Learning & Neural Networks End-Term Exam',
        date: '2026-11-18',
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        venue: 'Examination Complex Hall 3',
        isMandatory: true,
        targetAudience: 'CS 4th Year (Batch 2026)',
        evidenceSnippet: 'CS403: Machine Learning exam on 18th Nov 2026, 10:00 AM to 01:00 PM.',
      },
    ],
    checklist: [
      {
        id: 'chk_hall_ticket',
        task: 'Download official Examination Hall Ticket from ERP portal',
        deadline: '2026-11-10',
        requiredDocuments: ['Identity Card', 'Fee Clearance Slip'],
        submissionLinkOrPlace: 'https://erp.college.edu/halltickets',
        completed: true,
        evidenceSnippet: 'Hall tickets will be accessible upon clearing all pending academic dues by 10th November 2026.',
      },
      {
        id: 'chk_no_dues',
        task: 'Submit Department Library No-Dues Clearance Slip',
        deadline: '2026-11-08',
        requiredDocuments: ['Library Card'],
        submissionLinkOrPlace: 'Room 104, Central Library',
        completed: false,
        evidenceSnippet: 'Library no-dues must be submitted to Room 104 on or before 8th November 2026.',
      },
    ],
    eligibility: {
      eligibleBatches: ['B.Tech Computer Science 4th Year (Batch 2026)'],
      minimumRequirements: '75% aggregate semester attendance required',
      prerequisites: ['Full semester tuition fees cleared'],
      notes: 'No electronic gadgets, smartwatches, or programmable calculators permitted in examination hall.',
    },
    organizer: {
      name: 'Dr. Eleanor Vance',
      designation: 'Controller of Examinations',
      department: 'Examination Branch',
      email: 'dean.academics@college.edu',
      phone: '+1 (555) 019-4822',
      office: 'Admin Block Room 201',
    },
    uncertainties: [],
    rawText: 'OFFICE OF THE CONTROLLER OF EXAMINATIONS\nCIRCULAR: End-Term Examinations 2026...',
    sourceEvidence: [
      { claim: 'CS401 exam venue is Main Auditorium Hall B', snippet: 'Venue: Main Auditorium Hall B' },
      { claim: 'Mandatory minimum attendance 75%', snippet: 'Minimum 75% attendance criteria applies' },
    ],
    extractionSource: 'sample_fixture',
    status: 'confirmed',
    fileName: 'COE_EndTerm_Schedule_2026.pdf',
    fileType: 'application/pdf',
    fileSize: 421000,
    createdAt: '2026-10-15T09:00:00Z',
    updatedAt: '2026-10-16T14:30:00Z',
    isPublished: true,
    publicationStatus: 'published',
    targetAudience: {
      type: 'batch',
      department: 'Computer Science',
      batchYear: '2026',
    },
    publishedAt: '2026-10-15T09:00:00Z',
    publishedBy: 'coord_dean_01',
    publishedByName: 'Dr. Eleanor Vance (Dean of Academics)',
    expiryDate: '2026-11-25T23:59:59Z',
    currentVersion: 2,
    isCoordinatorCreated: true,
    versionHistory: [
      {
        id: 'ver_exam_1',
        noticeId: 'coord_notice_exam_2026',
        versionNumber: 1,
        changedBy: 'Dr. Eleanor Vance',
        changedByRole: 'coordinator',
        changedAt: '2026-10-15T09:00:00Z',
        changeSummary: 'Initial official publication to CS Batch 2026',
        materialChange: false,
        changesList: ['Initial publication'],
      },
      {
        id: 'ver_exam_2',
        noticeId: 'coord_notice_exam_2026',
        versionNumber: 2,
        changedBy: 'Dr. Eleanor Vance',
        changedByRole: 'coordinator',
        changedAt: '2026-10-16T14:30:00Z',
        changeSummary: 'Material Revision: Relocated CS401 exam venue from Academic Block B to Main Auditorium Hall B due to seating capacity expansion.',
        materialChange: true,
        changesList: ['Venue for CS401 exam updated to Main Auditorium Hall B', 'Re-acknowledgement requested from all enrolled students'],
      },
    ],
  },
  {
    id: 'coord_notice_placement_2026',
    noticeTitle: 'Mandatory Campus Placement & Final-Year Internship Registration Circular',
    noticeType: 'deadline',
    urgency: 'high',
    institution: 'State College of Engineering & Technology',
    department: 'Training & Placement Cell (T&P)',
    referenceNumber: 'TNP/2026/CY-08',
    publicationDate: '2026-10-12',
    plainLanguageSummary:
      'All final-year students (Batch of 2026) must finalize their verified academic profile and upload approved resumes by 25 October 2026 to be eligible for Tier-1 campus placement drives starting November.',
    events: [
      {
        id: 'evt_tnp_deadline',
        title: 'T&P Portal Registration & Resume Verification Deadline',
        date: '2026-10-25',
        startTime: '11:59 PM',
        endTime: '11:59 PM',
        venue: 'Online T&P Portal',
        isMandatory: true,
        targetAudience: 'All Final Year Engineering Batches',
      },
    ],
    checklist: [
      {
        id: 'chk_resume_upload',
        task: 'Upload single-page verified PDF resume to T&P portal',
        deadline: '2026-10-25',
        requiredDocuments: ['Resume PDF', 'Transcript'],
        submissionLinkOrPlace: 'https://placement.college.edu/register',
        completed: false,
      },
      {
        id: 'chk_tnp_noc',
        task: 'Submit Department HOD NOC for off-campus interview rounds',
        deadline: '2026-10-28',
        requiredDocuments: ['Signed NOC Form'],
        completed: false,
      },
    ],
    eligibility: {
      eligibleBatches: ['All B.Tech/M.Tech Final Year Students (2026)'],
      minimumRequirements: 'CGPA >= 6.5 with no active backlogs',
      prerequisites: [],
      notes: 'Late registrations will not be entertained after portal closes.',
    },
    organizer: {
      name: 'Prof. Marcus Brody',
      designation: 'Head, Training & Placement',
      department: 'T&P Cell',
      email: 'placements@college.edu',
      phone: '+1 (555) 019-3321',
      office: 'Placement Block Room 102',
    },
    uncertainties: [],
    rawText: 'TRAINING & PLACEMENT NOTIFICATION...',
    sourceEvidence: [],
    extractionSource: 'sample_fixture',
    status: 'confirmed',
    createdAt: '2026-10-12T10:00:00Z',
    updatedAt: '2026-10-12T10:00:00Z',
    isPublished: true,
    publicationStatus: 'published',
    targetAudience: {
      type: 'all_students',
      batchYear: '2026',
    },
    publishedAt: '2026-10-12T10:00:00Z',
    publishedBy: 'coord_dean_01',
    publishedByName: 'Dr. Eleanor Vance (Dean of Academics)',
    expiryDate: '2026-10-26T00:00:00Z',
    currentVersion: 1,
    isCoordinatorCreated: true,
    versionHistory: [
      {
        id: 'ver_tnp_1',
        noticeId: 'coord_notice_placement_2026',
        versionNumber: 1,
        changedBy: 'Prof. Marcus Brody',
        changedByRole: 'coordinator',
        changedAt: '2026-10-12T10:00:00Z',
        changeSummary: 'Initial publication for 2026 Campus Placement Registration',
        materialChange: false,
        changesList: ['Initial publication'],
      },
    ],
  },
  {
    id: 'coord_notice_hackathon_2026',
    noticeTitle: 'Annual Inter-Collegiate Engineering Hackathon & Project Symposium',
    noticeType: 'event',
    urgency: 'normal',
    institution: 'State College of Engineering & Technology',
    department: 'Innovation & Incubation Hub',
    referenceNumber: 'IIH/2026/HACK-03',
    publicationDate: '2026-10-10',
    plainLanguageSummary:
      '36-hour hackathon themed around AI for Social Good and Green Computing. Cash prizes of $10,000 for top 3 teams. Registration open for all engineering disciplines.',
    events: [
      {
        id: 'evt_hack_kickoff',
        title: 'Symposium Inauguration & Hackathon Kickoff',
        date: '2026-11-20',
        startTime: '09:00 AM',
        endTime: '11:00 AM',
        venue: 'Auditorium Hall A',
        isMandatory: false,
      },
    ],
    checklist: [
      {
        id: 'chk_team_reg',
        task: 'Register 3-4 person team with project abstract',
        deadline: '2026-11-05',
        requiredDocuments: ['Project Abstract PDF'],
        completed: false,
      },
    ],
    eligibility: {
      eligibleBatches: ['All Engineering Students (Years 1 to 4)'],
      minimumRequirements: 'Valid student ID card',
      prerequisites: [],
      notes: 'Mentors from top tech firms will be present on-site.',
    },
    organizer: {
      name: 'Dr. Sarah Jenkins',
      designation: 'Director, Incubation Center',
      department: 'Innovation Hub',
      email: 'innovate@college.edu',
      phone: '+1 (555) 019-9944',
      office: 'Innovation Center 3rd Floor',
    },
    uncertainties: [],
    rawText: 'INNOVATION HUB HACKATHON CIRCULAR...',
    sourceEvidence: [],
    extractionSource: 'sample_fixture',
    status: 'confirmed',
    createdAt: '2026-10-10T08:00:00Z',
    updatedAt: '2026-10-10T08:00:00Z',
    isPublished: true,
    publicationStatus: 'published',
    targetAudience: {
      type: 'all_students',
    },
    publishedAt: '2026-10-10T08:00:00Z',
    publishedBy: 'coord_dean_01',
    publishedByName: 'Dr. Eleanor Vance (Dean of Academics)',
    currentVersion: 1,
    isCoordinatorCreated: true,
    versionHistory: [
      {
        id: 'ver_hack_1',
        noticeId: 'coord_notice_hackathon_2026',
        versionNumber: 1,
        changedBy: 'Dr. Sarah Jenkins',
        changedByRole: 'coordinator',
        changedAt: '2026-10-10T08:00:00Z',
        changeSummary: 'Initial announcement of 2026 Hackathon & Project Symposium',
        materialChange: false,
        changesList: ['Initial publication'],
      },
    ],
  },
  {
    id: 'coord_notice_draft_fellowship',
    noticeTitle: 'Post-Graduate Research Fellowship & Teaching Assistantship Window (Draft)',
    noticeType: 'scholarship',
    urgency: 'normal',
    institution: 'State College of Engineering & Technology',
    department: 'Dean of Research & Sponsored Projects',
    referenceNumber: 'DOR/2026/TA-DRAFT',
    publicationDate: '2026-10-18',
    plainLanguageSummary:
      'Internal draft for upcoming full-tuition teaching assistantship stipends for qualifying graduate candidates. Under final review by academic council.',
    events: [],
    checklist: [],
    eligibility: {
      eligibleBatches: ['Incoming Masters and Pre-Doctoral Scholars'],
      minimumRequirements: 'Minimum 8.0 CGPA',
      prerequisites: [],
      notes: 'Draft stage only. Not visible to student body.',
    },
    organizer: {
      name: 'Dr. Eleanor Vance',
      designation: 'Dean of Academics',
      department: 'Dean Office',
      email: 'dean.academics@college.edu',
      phone: '+1 (555) 019-4822',
      office: 'Admin Block Room 201',
    },
    uncertainties: [],
    rawText: 'DRAFT TA FELLOWSHIP CIRCULAR...',
    sourceEvidence: [],
    extractionSource: 'sample_fixture',
    status: 'draft',
    createdAt: '2026-10-16T11:00:00Z',
    updatedAt: '2026-10-16T11:00:00Z',
    isPublished: false,
    publicationStatus: 'draft',
    targetAudience: {
      type: 'department',
      department: 'Computer Science',
    },
    currentVersion: 1,
    isCoordinatorCreated: true,
    versionHistory: [],
  },
];

class CoordinatorService {
  private notices: CoordinatorNotice[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const raw = safeStorage.getItem(COORD_NOTICES_STORAGE_KEY);
    if (raw) {
      try {
        this.notices = JSON.parse(raw);
      } catch {
        this.notices = [...INITIAL_COORDINATOR_NOTICES];
      }
    } else {
      this.notices = [...INITIAL_COORDINATOR_NOTICES];
      safeStorage.setItem(COORD_NOTICES_STORAGE_KEY, JSON.stringify(this.notices));
    }
  }

  private persist() {
    safeStorage.setItem(COORD_NOTICES_STORAGE_KEY, JSON.stringify(this.notices));
  }

  /**
   * Returns all notices visible to a coordinator
   */
  async getAllCoordinatorNotices(): Promise<CoordinatorNotice[]> {
    const list = [...this.notices];
    // Populate live acknowledgement stats for each
    for (const item of list) {
      item.acknowledgementStats = await acknowledgementService.getNoticeStats(item.id, item.currentVersion);
    }
    return list;
  }

  /**
   * Audience filter: returns notices that match a student's enrolled profile
   */
  async getPublishedNoticesForStudent(student: UserProfile): Promise<CoordinatorNotice[]> {
    const list = await this.getAllCoordinatorNotices();
    return list.filter((n) => {
      if (!n.isPublished || n.publicationStatus !== 'published') return false;
      const aud = n.targetAudience;
      if (!aud || aud.type === 'all_students') return true;
      if (aud.type === 'batch' && aud.batchYear) {
        return student.batchYear === aud.batchYear || !student.batchYear; // demo fallback
      }
      if (aud.type === 'department' && aud.department) {
        return (
          student.department?.toLowerCase().includes(aud.department.toLowerCase()) ||
          aud.department.toLowerCase().includes('computer')
        );
      }
      return true;
    });
  }

  async getNoticeById(id: string): Promise<CoordinatorNotice | null> {
    const match = this.notices.find((n) => n.id === id);
    if (!match) return null;
    match.acknowledgementStats = await acknowledgementService.getNoticeStats(match.id, match.currentVersion);
    return match;
  }

  /**
   * Create or publish a new official coordinator notice
   */
  async publishNotice(params: {
    noticeTitle: string;
    noticeType: any;
    urgency: any;
    institution: string;
    department: string;
    referenceNumber: string;
    plainLanguageSummary: string;
    events: NoticeEvent[];
    checklist: ActionItem[];
    eligibility: any;
    targetAudience: TargetAudience;
    coordinator: UserProfile;
    expiryDate?: string;
  }): Promise<CoordinatorNotice> {
    const newId = `coord_notice_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newNotice: CoordinatorNotice = {
      id: newId,
      noticeTitle: params.noticeTitle,
      noticeType: params.noticeType,
      urgency: params.urgency,
      institution: params.institution,
      department: params.department,
      referenceNumber: params.referenceNumber,
      publicationDate: now.substring(0, 10),
      plainLanguageSummary: params.plainLanguageSummary,
      events: params.events,
      checklist: params.checklist,
      eligibility: params.eligibility,
      organizer: {
        name: params.coordinator.displayName,
        designation: 'Academic Coordinator',
        department: params.department,
        email: params.coordinator.email,
        phone: '',
        office: '',
      },
      uncertainties: [],
      rawText: params.plainLanguageSummary,
      sourceEvidence: [],
      extractionSource: 'sample_fixture',
      status: 'confirmed',
      createdAt: now,
      updatedAt: now,
      isPublished: true,
      publicationStatus: 'published',
      targetAudience: params.targetAudience,
      publishedAt: now,
      publishedBy: params.coordinator.id,
      publishedByName: params.coordinator.displayName,
      expiryDate: params.expiryDate,
      currentVersion: 1,
      isCoordinatorCreated: true,
      versionHistory: [
        {
          id: `ver_${Date.now()}_1`,
          noticeId: newId,
          versionNumber: 1,
          changedBy: params.coordinator.displayName,
          changedByRole: 'coordinator',
          changedAt: now,
          changeSummary: 'Initial publication',
          materialChange: false,
          changesList: ['Notice published to ' + (params.targetAudience.department || params.targetAudience.type)],
        },
      ],
    };

    this.notices.unshift(newNotice);
    this.persist();

    // Log in audit trail
    await auditService.logAction({
      userId: params.coordinator.id,
      userDisplayName: params.coordinator.displayName,
      userRole: 'coordinator',
      action: 'NOTICE_PUBLISHED',
      targetType: 'notice',
      targetId: newId,
      summary: `Published "${newNotice.noticeTitle}" v1`,
      details: { targetAudience: params.targetAudience },
    });

    // Notify cohort
    await notificationService.sendNotification({
      userId: 'user_demo_student_01',
      title: `New Notice Published: ${newNotice.noticeTitle}`,
      message: `${params.coordinator.displayName} published an official circular: ${newNotice.plainLanguageSummary.substring(0, 100)}...`,
      type: 'notice_published',
      urgency: newNotice.urgency,
      targetUrl: `/notices/${newId}`,
      noticeId: newId,
    });

    return newNotice;
  }

  /**
   * Publish a material revision: updates version, detects changes, logs audit, and optionally requests re-acknowledgement
   */
  async reviseNotice(
    noticeId: string,
    updates: Partial<CoordinatorNotice>,
    changeSummary: string,
    coordinator: UserProfile,
    requestReAcknowledgement: boolean = false
  ): Promise<CoordinatorNotice> {
    const notice = this.notices.find((n) => n.id === noticeId);
    if (!notice) throw new Error('Notice not found.');

    const oldVersion = notice.currentVersion;
    const newVersion = oldVersion + 1;
    const now = new Date().toISOString();

    // Detect material differences (dates, venue, checklist deadlines)
    const changesList: string[] = [];
    if (updates.noticeTitle && updates.noticeTitle !== notice.noticeTitle) {
      changesList.push(`Title changed to: ${updates.noticeTitle}`);
    }
    if (updates.events && JSON.stringify(updates.events) !== JSON.stringify(notice.events)) {
      changesList.push('Event schedules or venues were modified');
    }
    if (updates.checklist && JSON.stringify(updates.checklist) !== JSON.stringify(notice.checklist)) {
      changesList.push('Action checklist deadlines or requirements updated');
    }
    if (changeSummary) {
      changesList.push(changeSummary);
    }

    const versionEntry: NoticeVersion = {
      id: `ver_${Date.now()}_${newVersion}`,
      noticeId,
      versionNumber: newVersion,
      changedBy: coordinator.displayName,
      changedByRole: 'coordinator',
      changedAt: now,
      changeSummary: changeSummary || 'Material revision issued by coordinator',
      materialChange: true,
      changesList,
      previousSnapshot: {
        noticeTitle: notice.noticeTitle,
        events: [...notice.events],
        checklist: [...notice.checklist],
        urgency: notice.urgency,
      },
    };

    const updated: CoordinatorNotice = {
      ...notice,
      ...updates,
      currentVersion: newVersion,
      updatedAt: now,
      versionHistory: [versionEntry, ...(notice.versionHistory || [])],
    };

    const index = this.notices.findIndex((n) => n.id === noticeId);
    this.notices[index] = updated;
    this.persist();

    // Log in audit trail
    await auditService.logAction({
      userId: coordinator.id,
      userDisplayName: coordinator.displayName,
      userRole: 'coordinator',
      action: 'NOTICE_REVISED',
      targetType: 'notice',
      targetId: noticeId,
      summary: `Revised "${notice.noticeTitle}" to v${newVersion}: ${changeSummary}`,
      details: { newVersion, materialChange: true, requestReAcknowledgement },
    });

    // Notify student cohort
    await notificationService.sendNotification({
      userId: 'user_demo_student_01',
      title: `Notice Revised (v${newVersion}): ${notice.noticeTitle}`,
      message: `Material updates posted: ${changeSummary}. Please review and re-confirm acknowledgement.`,
      type: 'notice_revised',
      urgency: 'high',
      targetUrl: `/notices/${noticeId}`,
      noticeId,
    });

    return updated;
  }

  /**
   * Archive a notice
   */
  async archiveNotice(noticeId: string, coordinator: UserProfile): Promise<void> {
    const notice = this.notices.find((n) => n.id === noticeId);
    if (!notice) return;
    notice.publicationStatus = 'archived';
    notice.updatedAt = new Date().toISOString();
    this.persist();

    await auditService.logAction({
      userId: coordinator.id,
      userDisplayName: coordinator.displayName,
      userRole: 'coordinator',
      action: 'NOTICE_ARCHIVED',
      targetType: 'notice',
      targetId: noticeId,
      summary: `Archived notice "${notice.noticeTitle}"`,
    });
  }

  /**
   * Withdraw a notice with formal withdrawal justification
   */
  async withdrawNotice(noticeId: string, reason: string, coordinator: UserProfile): Promise<void> {
    const notice = this.notices.find((n) => n.id === noticeId);
    if (!notice) return;
    notice.publicationStatus = 'withdrawn';
    notice.withdrawalReason = reason;
    notice.updatedAt = new Date().toISOString();
    this.persist();

    await auditService.logAction({
      userId: coordinator.id,
      userDisplayName: coordinator.displayName,
      userRole: 'coordinator',
      action: 'NOTICE_WITHDRAWN',
      targetType: 'notice',
      targetId: noticeId,
      summary: `Withdrew notice "${notice.noticeTitle}": ${reason}`,
      details: { withdrawalReason: reason },
    });

    await notificationService.sendNotification({
      userId: 'user_demo_student_01',
      title: `Notice Withdrawn: ${notice.noticeTitle}`,
      message: `The coordinator has withdrawn this circular: ${reason}`,
      type: 'system',
      urgency: 'high',
      targetUrl: `/notices/${noticeId}`,
      noticeId,
    });
  }

  /**
   * Compute live coordinator metrics
   */
  async getMetrics(): Promise<CoordinatorMetrics> {
    const list = await this.getAllCoordinatorNotices();
    const published = list.filter((n) => n.publicationStatus === 'published');
    const active = published.length;
    const archived = list.filter((n) => n.publicationStatus === 'archived').length;
    const withdrawn = list.filter((n) => n.publicationStatus === 'withdrawn').length;

    let totalEligible = 0;
    let totalAcked = 0;
    let overdueActions = 0;

    for (const n of published) {
      if (n.acknowledgementStats) {
        totalEligible += n.acknowledgementStats.totalEligible;
        totalAcked += n.acknowledgementStats.acknowledgedCount;
        overdueActions += n.acknowledgementStats.actionRequiredCount;
      }
    }

    const overallRate = totalEligible > 0 ? Math.round((totalAcked / totalEligible) * 100) : 0;
    const recentRevisions = list.filter((n) => n.currentVersion > 1).length;

    return {
      totalPublishedNotices: list.length,
      activeNotices: active,
      archivedNotices: archived,
      withdrawnNotices: withdrawn,
      totalEligibleStudents: totalEligible,
      overallAcknowledgementRate: overallRate,
      overdueActionsCount: overdueActions,
      noticesWithRecentRevisions: recentRevisions,
    };
  }

  async resetToDefaults(): Promise<void> {
    this.notices = [...INITIAL_COORDINATOR_NOTICES];
    safeStorage.setItem(COORD_NOTICES_STORAGE_KEY, JSON.stringify(this.notices));
  }
}

export const coordinatorService = new CoordinatorService();
