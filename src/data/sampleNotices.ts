import { NoticeDecoded } from '../types/notice';

export const SAMPLE_NOTICES: NoticeDecoded[] = [
  {
    id: 'sample_midterm_exam_2026',
    noticeTitle: 'Odd Semester Mid-Term Examination Schedule & Hall Ticket Issuance Circular',
    noticeType: 'exam',
    urgency: 'critical',
    institution: 'State Institute of Engineering & Technology (Autonomous)',
    department: 'Office of the Controller of Examinations',
    referenceNumber: 'SIET/COE/EXAM/2026/089',
    publicationDate: '2026-10-12',
    plainLanguageSummary:
      'Mid-term examinations for 3rd and 4th-year B.Tech students will run from November 17 to November 20, 2026. Students must clear library and tuition fee dues before November 10 to receive physical hall tickets. No student will be admitted to examination halls without a stamped hall ticket and college RFID card.',
    events: [
      {
        id: 'evt_sample_1',
        title: 'Distributed Systems & Cloud Computing (CS401)',
        date: '2026-11-17',
        startTime: '10:00 AM',
        endTime: '12:30 PM',
        venue: 'Examination Hall Block B (Rooms 201-208)',
        isMandatory: true,
        targetAudience: '4th Year CSE & IT Students',
        evidenceSnippet: '17/11/2026 | 10:00 - 12:30 hrs | CS401 Distributed Systems | Block B Rooms 201-208',
      },
      {
        id: 'evt_sample_2',
        title: 'Machine Learning & Neural Architectures (CS403)',
        date: '2026-11-19',
        startTime: '10:00 AM',
        endTime: '12:30 PM',
        venue: 'Examination Hall Block B (Rooms 201-208)',
        isMandatory: true,
        targetAudience: '4th Year CSE & AI-DS Students',
        evidenceSnippet: '19/11/2026 | 10:00 - 12:30 hrs | CS403 Machine Learning | Block B Rooms 201-208',
      },
      {
        id: 'evt_sample_3',
        title: 'Clash Resolution Session for Dual-Degree Electives',
        date: '2026-11-14',
        startTime: '02:00 PM',
        endTime: '04:00 PM',
        venue: 'COE Conference Room 104',
        isMandatory: false,
        targetAudience: 'Students with overlapping open elective codes',
        evidenceSnippet: 'Clash representations must be registered at COE Room 104 on 14.11.2026 between 2:00 PM and 4:00 PM.',
      },
    ],
    checklist: [
      {
        id: 'act_sample_1',
        task: 'Clear outstanding semester tuition dues at Accounts Section counter',
        deadline: '2026-11-10',
        requiredDocuments: ['Fee Bank Challan / NetBanking Transaction UTR Slip'],
        submissionLinkOrPlace: 'Ground Floor Accounts Counter 3',
        completed: true,
        evidenceSnippet: 'Dues clearance must be concluded on or before 10th November 2026, 4:00 PM.',
      },
      {
        id: 'act_sample_2',
        task: 'Collect physical embossed Hall Ticket from Proctor / Class Coordinator',
        deadline: '2026-11-13',
        requiredDocuments: ['No-Dues Clearance Slip', 'Original College RFID Identity Card'],
        submissionLinkOrPlace: 'Department Faculty Cabin 304',
        completed: false,
        evidenceSnippet: 'Hall tickets will be distributed by respective proctors starting 11th Nov through 13th Nov 2026.',
      },
      {
        id: 'act_sample_3',
        task: 'Submit medical fitness certificate in case of hospitalization or approved absence',
        deadline: '2026-11-16',
        requiredDocuments: ['Medical Officer Attested Certificate', 'Parent Consent Letter'],
        submissionLinkOrPlace: 'COE Office Dispatch Desk',
        completed: false,
        evidenceSnippet: 'Genuine medical cases must submit certified documentation prior to 16.11.2026.',
      },
    ],
    eligibility: {
      eligibleBatches: ['B.Tech 3rd Year (Batch 2024-28)', 'B.Tech 4th Year (Batch 2023-27)'],
      minimumRequirements: 'Strict minimum 75% attendance aggregate across theory and laboratory subjects.',
      prerequisites: ['Valid examination registration code on student portal', 'No active disciplinary debarment'],
      notes: 'Students falling below 65% aggregate attendance will NOT be permitted without Dean Academic approval.',
    },
    organizer: {
      name: 'Dr. V. K. Ramanathan',
      designation: 'Controller of Examinations',
      department: 'Examination Branch',
      email: 'coe@siet-autonomous.edu',
      phone: '+91 (0) 44 2839 4001',
      office: 'COE Block, First Floor, SIET Main Campus',
    },
    uncertainties: [
      {
        id: 'unc_sample_1',
        field: 'Seating Chart Allocation',
        issueType: 'unclear_venue',
        explanation: 'Individual desk seat numbers will be posted outside Room 201 only 45 minutes before commencement.',
        resolved: true,
        userCorrection: 'Verified with department proctor: roll number 1 to 40 in Room 201, 41 to 80 in Room 202.',
      },
      {
        id: 'unc_sample_2',
        field: 'Open Elective Timetable',
        issueType: 'missing_time',
        explanation: 'The notice refers students to a secondary departmental Annexure B for Humanities elective timings.',
        resolved: false,
      },
    ],
    rawText: `STATE INSTITUTE OF ENGINEERING & TECHNOLOGY (AUTONOMOUS)
OFFICE OF THE CONTROLLER OF EXAMINATIONS
Ref No: SIET/COE/EXAM/2026/089                                  Date: 12-10-2026

CIRCULAR: ODD SEMESTER MID-TERM EXAMINATIONS NOVEMBER 2026

It is hereby notified to all 3rd and 4th-Year B.Tech students (CSE, IT, AI-DS, ECE, MECH) that Odd Semester Mid-Term Examinations will be conducted from 17th November to 20th November 2026 in offline pen-and-paper mode.

EXAMINATION TIMETABLE (CSE/IT CORE):
- 17/11/2026 (Tuesday): CS401 Distributed Systems & Cloud Computing | 10:00 AM - 12:30 PM | Block B Rooms 201-208
- 19/11/2026 (Thursday): CS403 Machine Learning & Neural Architectures | 10:00 AM - 12:30 PM | Block B Rooms 201-208

INSTRUCTIONS & MANDATORY REQUIREMENTS:
1. Students must clear all pending tuition and hostel fees by 10th November 2026, 4:00 PM.
2. Stamped Hall Tickets will be issued by designated Class Proctors between 11th Nov and 13th Nov 2026 upon showing the No-Dues clearance slip and college RFID card.
3. Minimum attendance requirement is 75% in aggregate. Students detained on attendance grounds will not be permitted to sit for the examination.
4. Any clashes with dual-degree open electives must be reported in writing to COE Room 104 on 14.11.2026 between 2:00 PM and 4:00 PM.
5. Electronic smartwatches, programmable calculators, and mobile phones are strictly barred.

By Order,
Dr. V. K. Ramanathan
Controller of Examinations
Email: coe@siet-autonomous.edu`,
    sourceEvidence: [
      {
        claim: 'Exam dates run from Nov 17 to Nov 20, 2026',
        snippet: 'Mid-Term Examinations will be conducted from 17th November to 20th November 2026',
      },
      {
        claim: 'Fee clearance deadline is Nov 10, 2026',
        snippet: 'clear all pending tuition and hostel fees by 10th November 2026, 4:00 PM',
      },
      {
        claim: '75% attendance threshold strictly enforced',
        snippet: 'Minimum attendance requirement is 75% in aggregate.',
      },
    ],
    extractionSource: 'sample_fixture',
    status: 'confirmed',
    fileName: 'siet_midterm_schedule_2026.txt',
    fileType: 'text/plain',
    fileSize: 1840,
    createdAt: '2026-10-12T09:30:00.000Z',
    updatedAt: '2026-10-12T10:15:00.000Z',
  },
  {
    id: 'sample_hackathon_innovatex_2026',
    noticeTitle: 'InnovateX 2026 National Inter-College Hackathon & Prototype Grant Call',
    noticeType: 'event',
    urgency: 'high',
    institution: 'Centre for Innovation, Incubation & Entrepreneurship (CIIE)',
    department: 'Department of Computer Science & Engineering in association with IEEE',
    referenceNumber: 'CIIE/HACK/2026/NOV-11',
    publicationDate: '2026-10-15',
    plainLanguageSummary:
      'Registrations are open for the 36-hour InnovateX 2026 National Hackathon taking place on December 5-6, 2026. Teams of 2 to 4 students must submit a 2-page project proposal by November 22. Shortlisted teams will receive a $500 hardware prototype stipend and compete for grand prizes worth $5,000.',
    events: [
      {
        id: 'evt_hack_1',
        title: 'Problem Statements & Track Reveal Webinar',
        date: '2026-11-05',
        startTime: '05:00 PM',
        endTime: '06:30 PM',
        venue: 'YouTube Live & IEEE Student Chapter Discord',
        isMandatory: false,
        targetAudience: 'All registered and prospective teams',
        evidenceSnippet: 'Track reveal live stream on 5th Nov 2026 at 5:00 PM via official Discord channel.',
      },
      {
        id: 'evt_hack_2',
        title: '36-Hour Hackathon Sprint & Code-Freeze',
        date: '2026-12-05',
        startTime: '08:00 AM',
        endTime: '08:00 PM (Next Day Dec 6)',
        venue: 'Central Incubation Centre, Tech Park 4th Floor',
        isMandatory: true,
        targetAudience: 'Top 30 Shortlisted Finalist Teams',
        evidenceSnippet: 'Physical hackathon commences 8:00 AM on 5th Dec 2026 through 6th Dec 8:00 PM.',
      },
    ],
    checklist: [
      {
        id: 'act_hack_1',
        task: 'Form multidisciplinary team (2-4 students) and register on portal',
        deadline: '2026-11-18',
        requiredDocuments: ['Valid College Student IDs', 'GitHub Profile Links of all members'],
        submissionLinkOrPlace: 'https://innovatex2026.university.edu/register',
        completed: false,
        evidenceSnippet: 'Early bird registration closes 18th November 2026 at 11:59 PM IST.',
      },
      {
        id: 'act_hack_2',
        task: 'Submit 2-Page Abstract & Architecture Deck (PDF format under 10MB)',
        deadline: '2026-11-22',
        requiredDocuments: ['Project Abstract PDF', 'System Architecture Diagram'],
        submissionLinkOrPlace: 'CIIE Portal Project Upload Section',
        completed: false,
        evidenceSnippet: 'Proposal submission deadline is 22nd Nov 2026. No late uploads accepted.',
      },
      {
        id: 'act_hack_3',
        task: 'Sign and upload Parent & Faculty Mentor No-Objection Certificate (NOC) for overnight stay',
        deadline: '2026-11-28',
        requiredDocuments: ['Signed Physical NOC Scan', 'Hostel Warden Leave Slip (if hosteller)'],
        submissionLinkOrPlace: 'CIIE Office or upload on portal',
        completed: false,
        evidenceSnippet: 'Mandatory NOC signed by Head of Department and Parents required by 28.11.2026.',
      },
    ],
    eligibility: {
      eligibleBatches: ['B.Tech / B.E. (All Years & Branches)', 'BCA / MCA / B.Sc Computer Science'],
      minimumRequirements: 'Must have at least one female team member for diversity grant points.',
      prerequisites: ['Active GitHub profile', 'College bonafide verification'],
      notes: 'Teams can select themes: AI for Healthcare, Smart Mobility, Climate Tech, or Open Innovation.',
    },
    organizer: {
      name: 'Prof. Ananya Sen & Student Convenor Team',
      designation: 'Faculty Lead, Incubation Cell',
      department: 'Department of Computer Science',
      email: 'innovatex@college.edu',
      phone: '+91 (0) 11 4982 7100',
      office: 'Tech Park Block C, Room 412',
    },
    uncertainties: [
      {
        id: 'unc_hack_1',
        field: 'Hardware Component Requisition',
        issueType: 'missing_deadline',
        explanation: 'Hardware kit request form link opens after proposal acceptance; date for hardware dispatch not specified.',
        resolved: false,
      },
    ],
    rawText: `CENTRE FOR INNOVATION, INCUBATION & ENTREPRENEURSHIP (CIIE)
DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
Ref: CIIE/HACK/2026/NOV-11                                      Date: 15-10-2026

CALL FOR PARTICIPATION: INNOVATEX 2026 (NATIONAL STUDENT HACKATHON)

We are thrilled to announce INNOVATEX 2026, our annual 36-hour national hackathon scheduled for December 5th and 6th, 2026.

Key Stages & Milestones:
- 05/11/2026: Problem statement and track reveal stream at 5:00 PM IST.
- 18/11/2026: Team registration deadline (teams of 2 to 4 members).
- 22/11/2026: 2-page project proposal & architecture submission deadline via portal.
- 28/11/2026: Announcement of shortlisted 30 finalist teams and NOC upload deadline.
- 05/12/2026: On-campus physical hackathon begins 8:00 AM at Incubation Centre, Tech Park 4th Floor.

Prizes:
- 1st Prize: $3,000 cash + Direct entry into Summer Incubation Cohort
- 2nd Prize: $1,500 cash
- Track Winners: $500 each

Eligible: B.Tech, BCA, MCA, and M.Tech students. All teams must submit faculty mentor endorsement before the offline round.

Contact: innovatex@college.edu | Prof. Ananya Sen (Faculty Lead)`,
    sourceEvidence: [
      {
        claim: 'Hackathon date is Dec 5-6, 2026',
        snippet: 'annual 36-hour national hackathon scheduled for December 5th and 6th, 2026',
      },
      {
        claim: 'Proposal submission deadline is Nov 22, 2026',
        snippet: '22/11/2026: 2-page project proposal & architecture submission deadline via portal.',
      },
    ],
    extractionSource: 'sample_fixture',
    status: 'reviewed',
    fileName: 'innovatex_hackathon_announcement.pdf',
    fileType: 'application/pdf',
    fileSize: 42100,
    createdAt: '2026-10-15T11:00:00.000Z',
    updatedAt: '2026-10-15T11:45:00.000Z',
  },
  {
    id: 'sample_scholarship_concession_2026',
    noticeTitle: 'Post-Matric National Merit & Institutional Tuition Fee Concession Verification Notice',
    noticeType: 'scholarship',
    urgency: 'high',
    institution: 'Government Engineering College & Directorate of Technical Education',
    department: 'Scholarship & Social Welfare Division',
    referenceNumber: 'DTE/SCH/2026/224-B',
    publicationDate: '2026-10-08',
    plainLanguageSummary:
      'Eligible students seeking state or institutional tuition fee waivers for Academic Year 2026-27 must submit certified income affidavits, caste certificates (where applicable), and Aadhaar-seeded bank statements to Counter 4 by November 25, 2026. Incomplete dossiers will be rejected without further notice.',
    events: [
      {
        id: 'evt_sch_1',
        title: 'Document Physical Verification Camp - Batches 2024 & 2025',
        date: '2026-11-20',
        startTime: '10:00 AM',
        endTime: '04:00 PM',
        venue: 'Auditorium Seminar Hall 2',
        isMandatory: true,
        targetAudience: '1st & 2nd Year Scholarship Applicants',
        evidenceSnippet: 'Verification camp for 1st and 2nd year applicants will be conducted on 20.11.2026 from 10:00 to 16:00 hrs.',
      },
      {
        id: 'evt_sch_2',
        title: 'Document Physical Verification Camp - Batches 2022 & 2023',
        date: '2026-11-21',
        startTime: '10:00 AM',
        endTime: '04:00 PM',
        venue: 'Auditorium Seminar Hall 2',
        isMandatory: true,
        targetAudience: '3rd & 4th Year Scholarship Applicants',
        evidenceSnippet: 'Verification camp for senior batches on 21.11.2026 from 10:00 to 16:00 hrs.',
      },
    ],
    checklist: [
      {
        id: 'act_sch_1',
        task: 'Obtain Revenue Authority Tahsildar Income Certificate (Valid for FY 2025-26)',
        deadline: '2026-11-15',
        requiredDocuments: ['Original Income Certificate with QR/Digital Signature'],
        submissionLinkOrPlace: 'Local District Revenue Office',
        completed: true,
        evidenceSnippet: 'Annual family income must not exceed INR 2,50,000 as per Competent Authority Certificate.',
      },
      {
        id: 'act_sch_2',
        task: 'Submit physical dossier with self-attested document copies and bank passbook',
        deadline: '2026-11-25',
        requiredDocuments: [
          'Income Certificate',
          'Aadhaar Card Copy',
          'Nationalized Bank Passbook first page with IFSC & DBT enabled',
          'Previous Semester Marksheets',
          'College Fee Receipt',
        ],
        submissionLinkOrPlace: 'Administrative Block Counter 4',
        completed: false,
        evidenceSnippet: 'Hard copy dossier with original stamps must reach Counter 4 latest by 25-11-2026.',
      },
    ],
    eligibility: {
      eligibleBatches: ['All Undergraduate & Postgraduate Batches (AY 2026-27)'],
      minimumRequirements: 'Annual parental income strictly under INR 2.50 Lakhs (or 8 Lakhs for EWS category with valid certificate).',
      prerequisites: ['Bank account must be Aadhaar-seeded for Direct Benefit Transfer (DBT)', 'Zero year-back backlogs in preceding semester'],
      notes: 'Private bank accounts are NOT accepted by the state treasury portal; use SBI, Canara, PNB, or Union Bank.',
    },
    organizer: {
      name: 'Shri R. M. Deshmukh',
      designation: 'Nodal Scholarship Officer',
      department: 'Welfare & Student Affairs',
      email: 'scholarships@gec-dte.ac.in',
      phone: '+91 (0) 20 2550 7820',
      office: 'Admin Wing Room 12, Ground Floor',
    },
    uncertainties: [
      {
        id: 'unc_sch_1',
        field: 'Portal Confirmation Printout Requirement',
        issueType: 'contradictory_info',
        explanation: 'Section 3 states online acknowledgment must be submitted, but the national portal server maintenance window is listed as pending.',
        resolved: false,
      },
    ],
    rawText: `DIRECTORATE OF TECHNICAL EDUCATION & GOVERNMENT ENGINEERING COLLEGE
Ref No: DTE/SCH/2026/224-B                                       Date: 08-10-2026

NOTICE: SCHOLARSHIP & TUITION FEE CONCESSION AY 2026-27

All eligible SC/ST/OBC/EBC/SEBC/Minority students admitted to B.Tech, M.Tech, and MCA programs are hereby informed that the verification of application forms for State and Central Merit Scholarships will commence shortly.

Verification Schedule at Auditorium Seminar Hall 2:
- 20.11.2026 (10:00 AM - 4:00 PM): 1st & 2nd Year Students
- 21.11.2026 (10:00 AM - 4:00 PM): 3rd & Final Year Students

Final Date of Submission at Counter 4: 25th November 2026.

Checklist of Documents (Self-Attested in duplicate):
1. Competent Authority Income Certificate for FY 2025-26 (Parental income <= 2.5 Lakhs / 8 Lakhs for EWS)
2. Caste Certificate and Caste Validity Certificate (mandatory for reserved categories)
3. Nationalized Bank Passbook copy showing active Aadhaar-DBT linking
4. Current Academic Year College Fee Receipt and Previous Marksheet
5. Domicile / Residential Certificate

Note: Delayed or incomplete applications will not be forwarded to the State Treasury.

R. M. Deshmukh
Nodal Scholarship Officer`,
    sourceEvidence: [
      {
        claim: 'Final submission deadline is Nov 25, 2026',
        snippet: 'Final Date of Submission at Counter 4: 25th November 2026.',
      },
      {
        claim: 'Verification on Nov 20 and Nov 21',
        snippet: '20.11.2026 and 21.11.2026 in Auditorium Seminar Hall 2',
      },
    ],
    extractionSource: 'sample_fixture',
    status: 'reviewed',
    fileName: 'scholarship_verification_notice.txt',
    fileType: 'text/plain',
    fileSize: 1540,
    createdAt: '2026-10-08T08:00:00.000Z',
    updatedAt: '2026-10-08T08:30:00.000Z',
  },
  {
    id: 'sample_lab_viva_project_2026',
    noticeTitle: 'Final Year Major Project Dissertation Submission & External Viva Guidelines',
    noticeType: 'deadline',
    urgency: 'high',
    institution: 'Department of Electrical & Computer Engineering',
    department: 'Final Year Capstone Project Committee',
    referenceNumber: 'ECE/PROJ/FINAL/2026/04',
    publicationDate: '2026-10-14',
    plainLanguageSummary:
      'Final year ECE students must submit two spiral-bound copies of their major project report and an IEEE-formatted paper by November 30, 2026. Plagiarism similarity must not exceed 15%. External viva examinations will be conducted by university examiners between December 8 and December 11, 2026 in the ECE Embedded Systems Lab.',
    events: [
      {
        id: 'evt_viva_1',
        title: 'Plagiarism & Turnitin Similarity Clearance Window',
        date: '2026-11-26',
        startTime: '10:00 AM',
        endTime: '01:00 PM',
        venue: 'ECE Central Computer Lab 204',
        isMandatory: true,
        targetAudience: 'All Final Year Project Batches',
        evidenceSnippet: 'Turnitin similarity screening will take place on 26/11/2026 in Lab 204.',
      },
      {
        id: 'evt_viva_2',
        title: 'External Viva Voce & Live Hardware Demo',
        date: '2026-12-08',
        startTime: '09:00 AM',
        endTime: '05:00 PM',
        venue: 'Embedded Systems & VLSI Testing Lab',
        isMandatory: true,
        targetAudience: 'All Final Year Project Batches (Group 1-15)',
        evidenceSnippet: 'External examiner viva scheduled for 8th December to 11th December 2026.',
      },
    ],
    checklist: [
      {
        id: 'act_viva_1',
        task: 'Submit project report soft copy to Turnitin and obtain supervisor signoff certificate',
        deadline: '2026-11-26',
        requiredDocuments: ['Turnitin Similarity Report (<15%)', 'Supervisor Approval Form'],
        submissionLinkOrPlace: 'Department Portal & Faculty Guide Cabin',
        completed: false,
        evidenceSnippet: 'Reports with similarity exceeding 15% will be summarily rejected.',
      },
      {
        id: 'act_viva_2',
        task: 'Submit 2 spiral-bound report copies and IEEE paper reprint to Department Library',
        deadline: '2026-11-30',
        requiredDocuments: ['Two spiral bound copies', 'One CD/Pendrive with source code & dataset', 'Camera-ready IEEE paper'],
        submissionLinkOrPlace: 'ECE Department Office Staff Desk',
        completed: false,
        evidenceSnippet: 'Hard copies must be submitted to staff desk by 30th November 2026, 5:00 PM.',
      },
      {
        id: 'act_viva_3',
        task: 'Prepare working hardware prototype / software deployment for live demo',
        deadline: '2026-12-07',
        requiredDocuments: ['Project Poster A2 size', 'Live working prototype / laptop demo'],
        submissionLinkOrPlace: 'Embedded Systems Lab workbench',
        completed: false,
        evidenceSnippet: 'All test benches must be configured one day prior to external viva.',
      },
    ],
    eligibility: {
      eligibleBatches: ['B.Tech 8th Semester ECE & EEE Batches (2023-27)'],
      minimumRequirements: 'Completion of 100% project milestones signed off in student logbook.',
      prerequisites: ['Guide progress report score >= 7/10', 'No pending lab vivas'],
      notes: 'Formal departmental dress code (college blazer / formal shirts) is mandatory during viva.',
    },
    organizer: {
      name: 'Dr. S. K. Mahapatra',
      designation: 'Project Committee Convenor & Professor',
      department: 'Department of Electrical & Computer Engineering',
      email: 'eceprojects@university.edu',
      phone: '+91 (0) 33 2414 6644',
      office: 'Room 310, ECE Building',
    },
    uncertainties: [
      {
        id: 'unc_viva_1',
        field: 'External Examiner Identity',
        issueType: 'unclear_venue',
        explanation: 'Individual batch time slots (Groups 1-15 vs 16-30) will be revealed on the department notice board 2 days prior.',
        resolved: false,
      },
    ],
    rawText: `DEPARTMENT OF ELECTRICAL & COMPUTER ENGINEERING
Ref: ECE/PROJ/FINAL/2026/04                                      Date: 14-10-2026

CIRCULAR: FINAL YEAR CAPSTONE DISSERTATION & EXTERNAL VIVA

All 8th-semester B.Tech ECE and EEE students are informed of the deadlines regarding the final project submission and external examination:

1. Plagiarism Check: Reports must be submitted to the project coordinator on 26/11/2026 in Lab 204. Similarity index must be below 15%.
2. Final Spiral Copy Submission: Two spiral-bound copies along with IEEE conference format paper must be deposited at the department office by 30th November 2026 before 5:00 PM.
3. External Viva Voce: External assessment will take place between 8th December and 11th December 2026, from 9:00 AM onwards in the Embedded Systems Lab.
4. Dress Code: Strictly formal attire. Bring project logbook and poster.

Dr. S. K. Mahapatra
Project Committee Convenor`,
    sourceEvidence: [
      {
        claim: 'Dissertation report deadline is Nov 30, 2026',
        snippet: 'Final Spiral Copy Submission... deposited at the department office by 30th November 2026 before 5:00 PM',
      },
      {
        claim: 'External viva begins Dec 8, 2026',
        snippet: 'External assessment will take place between 8th December and 11th December 2026',
      },
    ],
    extractionSource: 'sample_fixture',
    status: 'confirmed',
    fileName: 'ece_project_viva_circular.txt',
    fileType: 'text/plain',
    fileSize: 1280,
    createdAt: '2026-10-14T14:00:00.000Z',
    updatedAt: '2026-10-14T15:00:00.000Z',
  },
];
