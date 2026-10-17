import {
  CoordinatorNotice,
  TargetAudience,
  PublicationStatus,
  NoticeVersion,
  CoordinatorMetrics,
} from '../types/phase3';
import { UserProfile } from '../types/phase2';
import { NoticeEvent, ActionItem } from '../types/notice';
import { auditService } from './auditService';
import { acknowledgementService } from './acknowledgementService';

const NOTICES_STORAGE_KEY = 'notice_decoder_coordinator_notices_v3';

export const DEMO_COORDINATOR_USER: UserProfile = {
  id: 'coord_dean_01',
  email: 'dean.academics@college.edu',
  displayName: 'Dr. Eleanor Vance (Dean of Academics)',
  timezone: 'UTC',
  role: 'coordinator',
  department: 'Academic Affairs & Examination Branch',
  createdAt: new Date().toISOString(),
};

const safeStorage = {
  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    return (memoryStore as any)[key] || null;
  },
  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // ignore
      }
    }
    (memoryStore as any)[key] = value;
  },
};

const memoryStore: Record<string, string> = {};

export const INITIAL_COORDINATOR_NOTICES: CoordinatorNotice[] = [
  {
    id: 'coord_notice_exam_2026',
    noticeTitle: 'University Odd-Semester End-Term Examination Schedule - 2026',
    noticeType: 'exam',
    urgency: 'critical',
    institution: 'State College of Engineering & Technology',
    department: 'Examination Branch',
    referenceNumber: 'COE/2026/EXAM-441',
    publicationDate: '2026-10-15',
    plainLanguageSummary:
      'Mandatory final examination schedule for all 4th year Computer Science & Engineering students (Batch 2026). Verification of hall tickets and clearance of pending lab records is required prior to entry.',
    events: [
      {
        id: 'evt_exam_cs401',
        title: 'CS401 Distributed Systems Final Paper',
        date: '2026-11-15',
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        venue: 'Main Auditorium Complex - Hall B',
        isMandatory: true,
        targetAudience: 'Batch 2026 CS Undergraduates',
      },
      {
        id: 'evt_exam_cs402',
        title: 'CS402 Machine Learning Architectures Final Paper',
        date: '2026-11-18',
        startTime: '02:00 PM',
        endTime: '05:00 PM',
        venue: 'Main Auditorium Complex - Hall B',
        isMandatory: true,
        targetAudience: 'Batch 2026 CS Undergraduates',
      },
    ],
    checklist: [
      {
        id: 'chk_hall_ticket',
        task: 'Download official printed hall ticket with photograph',
        deadline: '2026-11-10',
        requiredDocuments: ['College Photo ID Card'],
        completed: true,
      },
      {
        id: 'chk_no_dues',
        task: 'Obtain laboratory clearance certificate from Departmental Lab In-Charge',
        deadline: '2026-11-12',
        requiredDocuments: ['Signed Lab Record Book'],
        completed: false,
      },
    ],
    eligibility: {
      eligibleBatches: ['Batch 2026'],
      minimumRequirements: '75% mandatory attendance and cleared coursework prerequisites',
      prerequisites: ['CS301 Systems Programming', 'CS302 Algorithms'],
      notes: 'No electronic communication devices permitted inside the examination precinct.',
    },
    organizer: {
      name: 'Office of the Controller of Examinations',
      department: 'Academic Branch',
      email: 'exams@college.edu',
    },
    uncertainties: [],
    rawText: 'OFFICE OF CONTROLLER OF EXAMINATIONS: Circular COE/2026/EXAM-441...',
    sourceEvidence: [],
    extractionSource: 'official_circular',
    status: 'confirmed',
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
    currentVersion: 2,
    versionHistory: [
      {
        id: 'ver_exam_1',
        noticeId: 'coord_notice_exam_2026',
        versionNumber: 1,
        changedBy: 'coord_dean_01',
        changedByRole: 'coordinator',
        changedAt: '2026-10-15T09:00:00Z',
        changeSummary: 'Initial official circular publication of Fall 2026 examination schedule',
        materialChange: false,
        changesList: ['Initial publication'],
      },
      {
        id: 'ver_exam_2',
        noticeId: 'coord_notice_exam_2026',
        versionNumber: 2,
        changedBy: 'coord_dean_01',
        changedByRole: 'coordinator',
        changedAt: '2026-10-16T14:30:00Z',
        changeSummary:
          'Updated exam hall location from Wing C Classrooms to Main Auditorium Complex - Hall B due to acoustic and seating layout optimization.',
        materialChange: true,
        changesList: ['Exam hall changed to Hall B', 'Re-acknowledgement requested'],
      },
    ],
    isCoordinatorCreated: true,
    createdAt: '2026-10-15T09:00:00Z',
    updatedAt: '2026-10-16T14:30:00Z',
  },
  {
    id: 'coord_notice_placement_2026',
    noticeTitle: 'Campus Placement Drive & Pre-Placement Talk: Cloud Scale Systems',
    noticeType: 'placement',
    urgency: 'high',
    institution: 'State College of Engineering & Technology',
    department: 'Training & Placement Cell',
    referenceNumber: 'TPO/2026/DRIVE-108',
    publicationDate: '2026-10-14',
    plainLanguageSummary:
      'Campus hiring drive for Software Engineering and Site Reliability roles. All eligible students from Computer Science, Information Science, and Electronics & Communication must register their resume by the deadline.',
    events: [
      {
        id: 'evt_ppt_talk',
        title: 'Pre-Placement Talk & Technical Q&A with Lead Architects',
        date: '2026-11-20',
        startTime: '11:00 AM',
        endTime: '01:30 PM',
        venue: 'Seminar Hall 3',
        isMandatory: false,
        targetAudience: 'Final Year B.Tech Students',
      },
    ],
    checklist: [
      {
        id: 'chk_resume_upload',
        task: 'Upload single-page ATS-compliant resume to college placement portal',
        deadline: '2026-11-14',
        requiredDocuments: ['PDF Resume', 'Transcript of Grades (Sem 1-6)'],
        completed: false,
      },
    ],
    eligibility: {
      eligibleBatches: ['Batch 2026'],
      minimumRequirements: 'CGPA 7.5 and above with no active standing academic backlogs',
      prerequisites: ['Data Structures & Algorithms', 'Operating Systems'],
      notes: 'Formal business attire required during all interview rounds.',
    },
    organizer: {
      name: 'Training & Placement Office',
      department: 'Placement Cell',
      email: 'placements@college.edu',
    },
    uncertainties: [],
    rawText: 'TPO CIRCULAR 108: Cloud Scale Systems Drive 2026...',
    sourceEvidence: [],
    extractionSource: 'official_circular',
    status: 'confirmed',
    isPublished: true,
    publicationStatus: 'published',
    targetAudience: {
      type: 'department',
      department: 'Computer Science',
      batchYear: '2026',
    },
    publishedAt: '2026-10-14T10:00:00Z',
    publishedBy: 'coord_dean_01',
    publishedByName: 'Dr. Eleanor Vance (Dean of Academics)',
    currentVersion: 1,
    versionHistory: [
      {
        id: 'ver_place_1',
        noticeId: 'coord_notice_placement_2026',
        versionNumber: 1,
        changedBy: 'coord_dean_01',
        changedByRole: 'coordinator',
        changedAt: '2026-10-14T10:00:00Z',
        changeSummary: 'Official placement notification released for Cloud Scale Systems campus drive',
        materialChange: false,
        changesList: ['Initial release'],
      },
    ],
    isCoordinatorCreated: true,
    createdAt: '2026-10-14T10:00:00Z',
    updatedAt: '2026-10-14T10:00:00Z',
  },
  {
    id: 'coord_notice_hackathon_2026',
    noticeTitle: 'Annual Inter-Collegiate Engineering Hackathon 2026',
    noticeType: 'event',
    urgency: 'normal',
    institution: 'State College of Engineering & Technology',
    department: 'Student Affairs & Technical Societies',
    referenceNumber: 'SA/2026/HACK-09',
    publicationDate: '2026-10-12',
    plainLanguageSummary:
      '36-hour continuous build hackathon across Web3, Distributed AI, and Sustainable Energy tracks. Interdisciplinary teams of 3 to 4 students from all engineering branches are eligible to register.',
    events: [
      {
        id: 'evt_hack_kickoff',
        title: 'Hackathon Opening Ceremony & Problem Statement Unveiling',
        date: '2026-11-28',
        startTime: '09:00 AM',
        endTime: '11:00 AM',
        venue: 'Student Innovation Center - Arena A',
        isMandatory: false,
        targetAudience: 'All Registered Teams',
      },
    ],
    checklist: [
      {
        id: 'chk_team_reg',
        task: 'Register team composition and project track selection',
        deadline: '2026-11-20',
        requiredDocuments: ['Team Leader Consent'],
        completed: false,
      },
    ],
    eligibility: {
      eligibleBatches: ['All Enrolled Undergraduates & Postgraduates'],
      minimumRequirements: 'Valid institutional student credentials',
      prerequisites: [],
      notes: 'Meals, refreshments, and workspace connectivity provided throughout the event.',
    },
    organizer: {
      name: 'Hackathon Organizing Committee',
      department: 'Computer Science Society',
      email: 'hackathon@college.edu',
    },
    uncertainties: [],
    rawText: 'STUDENT AFFAIRS CIRCULAR: Annual Hackathon 2026 Announcement...',
    sourceEvidence: [],
    extractionSource: 'official_circular',
    status: 'reviewed',
    isPublished: true,
    publicationStatus: 'published',
    targetAudience: {
      type: 'all_students',
    },
    publishedAt: '2026-10-12T11:00:00Z',
    publishedBy: 'coord_dean_01',
    publishedByName: 'Dr. Eleanor Vance (Dean of Academics)',
    currentVersion: 1,
    versionHistory: [
      {
        id: 'ver_hack_1',
        noticeId: 'coord_notice_hackathon_2026',
        versionNumber: 1,
        changedBy: 'coord_dean_01',
        changedByRole: 'coordinator',
        changedAt: '2026-10-12T11:00:00Z',
        changeSummary: 'Announcement and team registration link for Hackathon 2026',
        materialChange: false,
        changesList: ['Initial publication'],
      },
    ],
    isCoordinatorCreated: true,
    createdAt: '2026-10-12T11:00:00Z',
    updatedAt: '2026-10-12T11:00:00Z',
  },
];

class CoordinatorService {
  private notices: CoordinatorNotice[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const raw = safeStorage.getItem(NOTICES_STORAGE_KEY);
    if (raw) {
      try {
        this.notices = JSON.parse(raw);
      } catch {
        this.notices = [...INITIAL_COORDINATOR_NOTICES];
      }
    } else {
      this.notices = [...INITIAL_COORDINATOR_NOTICES];
      safeStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(this.notices));
    }
  }

  private persist() {
    safeStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(this.notices));
  }

  async resetToDefaults(): Promise<void> {
    this.notices = JSON.parse(JSON.stringify(INITIAL_COORDINATOR_NOTICES));
    this.persist();
  }

  async getAllCoordinatorNotices(): Promise<CoordinatorNotice[]> {
    // Populate live aggregate stats on each notice
    for (const n of this.notices) {
      n.acknowledgementStats = await acknowledgementService.getNoticeStats(n.id, n.currentVersion);
    }
    return [...this.notices];
  }

  getAllCoordinatedNotices(): CoordinatorNotice[] {
    return [...this.notices];
  }

  async getNoticeById(id: string): Promise<CoordinatorNotice | null> {
    const match = this.notices.find((n) => n.id === id);
    if (!match) return null;
    match.acknowledgementStats = await acknowledgementService.getNoticeStats(match.id, match.currentVersion);
    return match;
  }

  async getPublishedNoticesForStudent(studentProfile: {
    id?: string;
    department?: string;
    batchYear?: string;
  }): Promise<CoordinatorNotice[]> {
    return this.notices.filter((notice) => {
      // Must be currently active and published
      if (notice.publicationStatus !== 'published' || !notice.isPublished) return false;

      // Audience evaluation
      const aud = notice.targetAudience;
      if (aud.type === 'all_students') return true;

      if (aud.type === 'department') {
        if (!studentProfile.department) return true;
        return aud.department?.toLowerCase().includes(studentProfile.department.toLowerCase()) ||
               studentProfile.department.toLowerCase().includes(aud.department?.toLowerCase() || '');
      }

      if (aud.type === 'batch') {
        const matchesBatch = !studentProfile.batchYear || aud.batchYear === studentProfile.batchYear;
        const matchesDept = !aud.department || !studentProfile.department ||
          studentProfile.department.toLowerCase().includes(aud.department.toLowerCase()) ||
          aud.department.toLowerCase().includes(studentProfile.department.toLowerCase());
        return matchesBatch && matchesDept;
      }

      return true;
    });
  }

  getNoticesForStudent(studentProfile: {
    id: string;
    department?: string;
    batchYear?: string;
  }): CoordinatorNotice[] {
    return this.notices.filter((n) => n.publicationStatus === 'published');
  }

  async publishNotice(data: {
    noticeTitle: string;
    noticeType: any;
    urgency: any;
    institution?: string;
    department?: string;
    referenceNumber?: string;
    plainLanguageSummary: string;
    events?: NoticeEvent[];
    checklist?: ActionItem[];
    eligibility?: any;
    targetAudience: TargetAudience;
    coordinator?: UserProfile;
  }): Promise<CoordinatorNotice> {
    const coord = data.coordinator || DEMO_COORDINATOR_USER;
    const noticeId = `coord_notice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newNotice: CoordinatorNotice = {
      id: noticeId,
      noticeTitle: data.noticeTitle,
      noticeType: data.noticeType || 'general',
      urgency: data.urgency || 'normal',
      institution: data.institution || 'State College of Engineering & Technology',
      department: data.department || coord.department || 'Academic Affairs',
      referenceNumber: data.referenceNumber || `COE/2026/NOTIF-${Math.floor(100 + Math.random() * 900)}`,
      publicationDate: new Date().toISOString().split('T')[0],
      plainLanguageSummary: data.plainLanguageSummary,
      events: data.events || [],
      checklist: data.checklist || [],
      eligibility: data.eligibility || {
        eligibleBatches: ['All Students'],
        minimumRequirements: '',
        prerequisites: [],
        notes: '',
      },
      organizer: {
        name: coord.displayName,
        department: coord.department,
        email: coord.email,
      },
      uncertainties: [],
      rawText: data.plainLanguageSummary,
      sourceEvidence: [],
      extractionSource: 'official_circular',
      status: 'confirmed',
      isPublished: true,
      publicationStatus: 'published',
      targetAudience: data.targetAudience,
      publishedAt: new Date().toISOString(),
      publishedBy: coord.id,
      publishedByName: coord.displayName,
      currentVersion: 1,
      versionHistory: [
        {
          id: `ver_${noticeId}_1`,
          noticeId,
          versionNumber: 1,
          changedBy: coord.id,
          changedByRole: 'coordinator',
          changedAt: new Date().toISOString(),
          changeSummary: 'Initial official publication to target student cohort',
          materialChange: false,
          changesList: ['Initial publication release'],
        },
      ],
      isCoordinatorCreated: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.notices.unshift(newNotice);
    this.persist();

    await auditService.logAction({
      userId: coord.id,
      userDisplayName: coord.displayName,
      userRole: 'coordinator',
      action: 'NOTICE_PUBLISHED',
      targetType: 'notice',
      targetId: noticeId,
      summary: `Published official circular: "${newNotice.noticeTitle}" (v1)`,
      details: {
        targetAudience: newNotice.targetAudience,
        eventsCount: newNotice.events.length,
        checklistCount: newNotice.checklist.length,
      },
    });

    return newNotice;
  }

  async reviseNotice(
    noticeId: string,
    updates: Partial<CoordinatorNotice>,
    changeSummary: string,
    user: UserProfile,
    isMaterial: boolean = true
  ): Promise<CoordinatorNotice> {
    const match = this.notices.find((n) => n.id === noticeId);
    if (!match) throw new Error(`Notice not found: ${noticeId}`);

    const newVersionNumber = match.currentVersion + 1;
    const versionRecord: NoticeVersion = {
      id: `ver_${noticeId}_${newVersionNumber}`,
      noticeId,
      versionNumber: newVersionNumber,
      changedBy: user.id,
      changedByRole: 'coordinator',
      changedAt: new Date().toISOString(),
      changeSummary,
      materialChange: isMaterial,
      changesList: [changeSummary],
      previousSnapshot: {
        noticeTitle: match.noticeTitle,
        events: [...match.events],
        checklist: [...match.checklist],
        urgency: match.urgency,
      },
    };

    Object.assign(match, updates, {
      currentVersion: newVersionNumber,
      updatedAt: new Date().toISOString(),
      versionHistory: [versionRecord, ...match.versionHistory],
    });

    this.persist();

    await auditService.logAction({
      userId: user.id,
      userDisplayName: user.displayName,
      userRole: 'coordinator',
      action: 'NOTICE_REVISED',
      targetType: 'notice',
      targetId: noticeId,
      summary: `Issued revision v${newVersionNumber} for "${match.noticeTitle}": ${changeSummary}`,
      details: {
        materialChange: isMaterial,
        version: newVersionNumber,
      },
    });

    return match;
  }

  async archiveNotice(noticeId: string, user: UserProfile): Promise<CoordinatorNotice | null> {
    const match = this.notices.find((n) => n.id === noticeId);
    if (!match) return null;

    match.publicationStatus = 'archived';
    match.isPublished = false;
    match.updatedAt = new Date().toISOString();
    this.persist();

    await auditService.logAction({
      userId: user.id,
      userDisplayName: user.displayName,
      userRole: 'coordinator',
      action: 'NOTICE_ARCHIVED',
      targetType: 'notice',
      targetId: noticeId,
      summary: `Archived notice "${match.noticeTitle}"`,
    });

    return match;
  }

  async withdrawNotice(
    noticeId: string,
    reason: string,
    user: UserProfile
  ): Promise<CoordinatorNotice | null> {
    const match = this.notices.find((n) => n.id === noticeId);
    if (!match) return null;

    match.publicationStatus = 'withdrawn';
    match.isPublished = false;
    match.withdrawalReason = reason;
    match.updatedAt = new Date().toISOString();
    this.persist();

    await auditService.logAction({
      userId: user.id,
      userDisplayName: user.displayName,
      userRole: 'coordinator',
      action: 'NOTICE_WITHDRAWN',
      targetType: 'notice',
      targetId: noticeId,
      summary: `Formally withdrew circular "${match.noticeTitle}": ${reason}`,
      details: { withdrawalReason: reason },
    });

    return match;
  }

  async getMetrics(): Promise<CoordinatorMetrics> {
    const all = this.notices;
    const published = all.filter((n) => n.publicationStatus === 'published');
    const archived = all.filter((n) => n.publicationStatus === 'archived');
    const withdrawn = all.filter((n) => n.publicationStatus === 'withdrawn');

    let totalEligible = 0;
    let totalAcked = 0;
    let overdueActions = 0;

    for (const n of published) {
      const stats = await acknowledgementService.getNoticeStats(n.id, n.currentVersion);
      totalEligible += stats.totalEligible;
      totalAcked += stats.acknowledgedCount;
      overdueActions += stats.actionRequiredCount;
    }

    const overallRate = totalEligible > 0 ? Math.round((totalAcked / totalEligible) * 100) : 0;
    const revisionsCount = all.filter((n) => n.currentVersion > 1).length;

    return {
      totalPublishedNotices: all.length,
      activeNotices: published.length,
      archivedNotices: archived.length,
      withdrawnNotices: withdrawn.length,
      totalEligibleStudents: totalEligible > 0 ? totalEligible : 120,
      overallAcknowledgementRate: overallRate,
      overdueActionsCount: overdueActions,
      noticesWithRecentRevisions: revisionsCount,
    };
  }

  getCoordinatorMetrics() {
    return this.getMetrics();
  }
}

export const coordinatorService = new CoordinatorService();
