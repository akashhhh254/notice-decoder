# Notice Decoder — Academic Schedule & Circular Intelligence SaaS

**Notice Decoder** converts confusing college notices, administrative circulars, and examination memos into clear, actionable schedules. Students and faculty can provide PDFs, circular photos, or raw text and instantly receive a plain-language summary, structured multi-event timelines, verified deadlines, required action checklists, and calendar-ready schedules.

---

## Architecture Overview (Phases 1, 2 & 3)

Notice Decoder is built as an enterprise-grade full-stack academic platform with clean separation between student workflows and coordinator management:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Notice Decoder Web SPA                          │
│   React 19 · TypeScript Strict · Tailwind CSS v4 · Lucide Icons        │
├──────────────────────────────────┬─────────────────────────────────────┤
│        Student Workspace         │         Coordinator Console         │
│  - Notice Intake (PDF/Img/Text)  │  - Official Notice Publication      │
│  - Plain-Language Summary        │  - Target Audience Restrictions     │
│  - Ambiguity & Uncertainty Flags │  - Material Revision & Versioning   │
│  - Personal Timetable & Classes  │  - Aggregate Acknowledgement Stats  │
│  - Clash Detection Engine        │  - Notice Archival & Withdrawal     │
│  - Interactive Calendar (3 Views)│  - Tamper-Resistant Audit Trail     │
│  - RFC-5545 .ICS Calendar Export │  - Cohort Denominator Analytics     │
│  - In-App Notification Center    │                                     │
│  - Verified Acknowledgement      │                                     │
├──────────────────────────────────┴─────────────────────────────────────┤
│                          Application Layer                             │
│   AuthService · CoordinatorService · AcknowledgementService           │
│   ClashDetectionEngine · NotificationService · AuditService · Privacy  │
├──────────────────────────────────┬─────────────────────────────────────┤
│        Server Backend            │        Database & RLS Engine        │
│   Node.js Express (Port 3000)    │   Supabase / PostgreSQL Migrations  │
│   - Gemini 3.8 Flash Extraction  │   - 001_phase2_schema.sql           │
│   - Deterministic Fallback       │   - 002_phase3_coordinator_ack.sql │
│   - Coordinator REST Endpoints   │   - Row Level Security (RLS) Rules  │
│   - .ICS Generation & Health API │   - Isolated Local Dev Adapter      │
└──────────────────────────────────┴─────────────────────────────────────┘
```

---

## Feature Matrix & Implementation Status

| Feature | Phase | Status | Verification / Engine |
| :--- | :--- | :--- | :--- |
| **Multimodal Notice Extraction** | Phase 1 | Implemented | Gemini 3.8 Flash (`@google/genai`) + Deterministic Fallback |
| **Ambiguity & Uncertainty Audit** | Phase 1 | Implemented | Flags missing times, unclear venues & contradictory info |
| **Student Action Checklist** | Phase 1 | Implemented | Required documents, submission portals & verification |
| **Authentication & Sessions** | Phase 2 | Implemented | Supabase Auth + Local Development Session Adapter |
| **Personal Weekly Timetable** | Phase 2 | Implemented | Weekly recurring lecture & lab class scheduling |
| **Timetable Clash Detection** | Phase 2 | Implemented | Deterministic interval overlap algorithm (`clashDetectionEngine`) |
| **Multi-View Calendar** | Phase 2 | Implemented | Month, Week, and Agenda views with conflict badges |
| **RFC 5545 .ICS Calendar Export** | Phase 2 | Implemented | Standard lines folded at 75 octets, CRLF, UTC timestamps |
| **Role-Based Coordinator Console** | Phase 3 | Implemented | Protected `/coordinator` route with server role validation |
| **Notice Publication & Audience** | Phase 3 | Implemented | Audience targeting by department, batch year, or all students |
| **Notice Versioning & Changelogs**| Phase 3 | Implemented | Bumps version numbers and tracks material changes in venue/time |
| **Verified Acknowledgement System**| Phase 3 | Implemented | Duplicate-safe student acknowledgement & cohort percentages |
| **Re-Acknowledgement Triggers** | Phase 3 | Implemented | Flags revision alerts when a circular is materially altered |
| **In-App Notification Center** | Phase 3 | Implemented | Popover drawer with unread badges and direct link navigation |
| **Automated Scheduled Reminders**| Phase 3 | Implemented | Idempotent reminder engine for clashes & upcoming deadlines |
| **Tamper-Resistant Audit Trail** | Phase 3 | Implemented | Append-only audit logger for publications, revisions & acks |
| **GDPR Export & Account Purge** | Phase 3 | Implemented | JSON data archive export and cascading account data purge |
| **Demo Persona Switcher** | Phase 3 | Implemented | 1-Click toggle between Student and Coordinator personas |

---

## Routes & Pages

1. **`/` (Overview & Landing Page)**: Value proposition, workflow comparison, test notice fixtures, and system architecture.
2. **`/dashboard` (Student Workspace)**: Student metrics, official institutional notices feed, personal decoded notices, action checklist, and timetable conflict indicators.
3. **`/timetable` (Personal Schedule)**: Weekly recurring lecture and laboratory schedule editor with semester bounds.
4. **`/calendar` (Interactive Academic Calendar)**: Full calendar supporting Month, Week, and Agenda views with conflict overlays.
5. **`/coordinator` (Academic Coordinator Console)**: Protected coordinator portal with publication controls, material revisions, audience targeting, verified cohort acknowledgement statistics, and security audit logs.
6. **`/notices/new` (Intake Studio)**: Drag-and-drop PDF/image uploader, text paste studio, and real-time extraction progress.
7. **`/notices/[id]` (Results & Resolution Hub)**: Decoded fields, uncertainty resolution, timetable clash inspection, action checklist, student acknowledgement widget, and notice version history.
8. **`/settings` (Data Governance & Privacy)**: Academic profile, timezone preferences, Phase 1 migration assistant, GDPR data archive export (.JSON), and cascading account purge.
9. **`/auth/login` & `/auth/signup`**: Academic authentication pages with session error handling.

---

## Coordinator Experience & Audience Targeting

### Role Validation & Access Control
- Coordinator access requires a verified role record (`role = 'coordinator'` or `role = 'admin'`).
- The application never trusts client-supplied flags; permissions are validated server-side.
- Attempting to access `/coordinator` as an unauthorized user displays an explicit access denial screen.

### Publication & Revisions
- Coordinators can publish circulars targeted to:
  - **All Students**: Visible campus-wide.
  - **Specific Department**: e.g. Computer Science & Engineering.
  - **Specific Graduating Batch**: e.g. Batch of 2026.
- When an exam venue, schedule time, or deadline is updated, the coordinator can issue a **Material Revision**.
- The system increments the notice version (e.g. `v1` $\to$ `v2`), records the change summary, appends to the immutable audit trail, and automatically alerts students that re-acknowledgement is requested.

---

## Acknowledgement Tracking & Denominator Accuracy

Notice Decoder implements an accurate database-backed acknowledgement model:
- **States**: `not_viewed` $\to$ `viewed` $\to$ `acknowledged` $\to$ `action_required`.
- **Duplicate Prevention**: Compound uniqueness constraint on `(notice_id, user_id)` ensures multiple clicks update the existing record rather than duplicating entries.
- **Accurate Denominators**: Aggregate percentages (e.g. 108 / 120 = 90%) are computed strictly against the verified eligible cohort base, eliminating fabricated metrics.
- **Privacy Controls**: Individual student acknowledgement entries are disclosed only for academic examination eligibility audits.

---

## Testing & Verification Commands

All 72 tests across 11 test suites run in Vitest:

```bash
# Run entire test suite
npm test

# Run TypeScript type check
npm run lint

# Build production bundle
npm run build
```

### Verified Test Suites (100% Pass Rate):
1. `src/services/coordinatorService.test.ts`: Notice publication, audience matching, revisions, withdrawal, and metrics.
2. `src/services/acknowledgementService.test.ts`: View recording, acknowledgement submission, duplicate prevention, revision detection, and cohort statistics.
3. `src/services/notificationService.test.ts`: In-app notification center, unread counts, and idempotent automated reminder generation.
4. `src/services/privacyService.test.ts`: GDPR data export bundle and cascading account cleanup.
5. `src/services/authService.test.ts`: Local session management, registration, sign-in, and sign-out.
6. `src/services/clashDetectionEngine.test.ts`: Hard clash calculations, boundary dates, and uncertain timing warnings.
7. `src/services/icsExport.test.ts`: RFC-5545 format, line-folding, and UTC timestamps.
8. `src/services/deterministicParser.test.ts`: Regex-based academic circular pattern extraction.
9. `src/services/noticeRepository.test.ts`: Repository CRUD and fallback memory.
10. `src/types/noticeSchema.test.ts`: Zod schema validation rules.
11. `src/utils/dateNormalizer.test.ts`: Academic date and time normalization.

---

## Hackathon Demo Mode

Notice Decoder includes an integrated **Evaluation Persona Switcher** at the top of the application:
1. **Student Persona**: *Alex Rivera (CS 4th Yr, Batch 2026)*
   - Inspects weekly timetable classes and notices matching CS Batch 2026.
   - Detects schedule clashes between the CS401 lecture and the Mid-Term exam.
   - Submits verified acknowledgement and marks checklist tasks.
2. **Coordinator Persona**: *Dr. Eleanor Vance (Dean of Academics & Examination Controller)*
   - Accesses `/coordinator` console.
   - Publishes official circulars with target cohort criteria.
   - Issues material revisions (e.g. relocating exam to Auditorium Hall B).
   - Monitors real-time cohort acknowledgement progress (108 / 120 = 90%).
   - Inspects tamper-resistant audit logs.
