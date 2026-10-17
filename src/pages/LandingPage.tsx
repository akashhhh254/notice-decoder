import React from 'react';
import { useRouter } from '../context/RouterContext';
import {
  FileText,
  Calendar,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  UploadCloud,
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { SAMPLE_NOTICES } from '../data/sampleNotices';

export const LandingPage: React.FC = () => {
  const { navigate } = useRouter();

  return (
    <div className="space-y-24 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-800">
              <span>Academic Notice Decoder</span>
              <span aria-hidden="true">·</span>
              <span>Phase 1 Intake & Resolution</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15]" style={{ textWrap: 'balance' }}>
              Turn confusing college notices into clear, actionable schedules.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              Universities publish circulars packed with legalistic jargon, buried deadlines, and clashing instructions. Notice Decoder extracts structured timetables, required document checklists, and flags ambiguous dates before they cost you an exam.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => navigate('/notices/new')}
                className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
              >
                <span>Decode Your First Notice</span>
                <ArrowRight className="w-4 h-4 text-sky-300" />
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs whitespace-nowrap"
              >
                <span>View Demo Dashboard</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-4 border-t border-slate-200">
              <span>PDF, PNG, JPG, and raw text supported</span>
              <span aria-hidden="true">·</span>
              <span>Zero-hallucination policy</span>
              <span aria-hidden="true">·</span>
              <span>Browser-local persistence</span>
            </div>
          </div>

          {/* Interactive Hero Comparison Preview */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Notice Transformation Sample</span>
                <span className="text-[11px] font-mono text-slate-500">SIET/COE/EXAM/2026/089</span>
              </div>

              <div className="p-5 space-y-4 text-sm">
                {/* Before: Raw notice excerpt */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs font-mono text-slate-700 space-y-1">
                  <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                    Raw Circular Excerpt
                  </div>
                  <p className="line-clamp-3 leading-relaxed text-slate-600">
                    &ldquo;All 3rd & 4th-yr B.Tech candidates are informed that Mid-Term exams commence 17-11-2026. Hall tickets available via proctors after dues clearance on or before 10th Nov 4 PM. Clashes reported to COE 104 on 14.11...&rdquo;
                  </p>
                </div>

                <div className="flex justify-center -my-1 text-slate-400">
                  <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    Decoded into Actionable Schedule
                  </span>
                </div>

                {/* After: Decoded output */}
                <div className="p-3.5 bg-sky-50/40 border border-sky-100 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-xs">
                      Mid-Term Examination Schedule
                    </span>
                    <span className="text-[11px] font-mono text-rose-700 font-semibold">
                      Deadline: Nov 10
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="font-medium text-slate-800">Clear Tuition Dues</span>
                      <span className="font-mono text-slate-500">Nov 10, 4:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="font-medium text-slate-800">Collect Stamped Admit Card</span>
                      <span className="font-mono text-slate-500">Nov 13, Faculty 304</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="font-medium text-slate-800">First Exam: Distributed Systems</span>
                      <span className="font-mono text-slate-500">Nov 17, 10:00 AM</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-sky-100/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>1 Uncertainty flagged for verification</span>
                    <button
                      onClick={() => navigate('/notices/sample_midterm_exam_2026')}
                      className="text-sky-700 hover:text-sky-900 font-semibold inline-flex items-center gap-1"
                    >
                      Inspect Notice <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Human Editorial Workflow */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-800">
            Systematic Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            How Notice Decoder Works
          </h2>
          <p className="text-sm text-slate-600 mt-3">
            Designed to bridge the gap between messy college communications and student day-to-day calendar schedules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Multimodal Intake
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Upload official administrative PDFs, scanned bulletin board photos, WhatsApp screenshots, or paste plain circular text directly into the studio.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Extraction & Ambiguity Audit
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              The engine structures dates, times, venues, and eligibility criteria. Crucially, it audits contradictory dates, missing room numbers, or unstated times so you can review them.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Action Plan & Verification
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Track deadlines with interactive checkboxes, inspect source quotes side-by-side, correct any anomalies, and confirm verified entries for your local dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Ready-to-Test Demo Fixtures Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-800">
              Try It Immediately
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Explore Realistic College Notice Fixtures
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Test each circular without needing your own files right now.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>Open All in Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SAMPLE_NOTICES.map((notice) => (
            <div
              key={notice.id}
              onClick={() => navigate(`/notices/${notice.id}`)}
              className="p-6 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-slate-800 capitalize">{notice.noticeType}</span>
                  <span aria-hidden="true">·</span>
                  <span>{notice.publicationDate}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-500">{notice.referenceNumber}</span>
                </div>

                <h3 className="text-base font-semibold text-slate-900 leading-snug hover:text-sky-800 transition-colors">
                  {notice.noticeTitle}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {notice.plainLanguageSummary}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-500 font-mono">
                  <span>{notice.events.length} events</span>
                  <span aria-hidden="true">·</span>
                  <span>{notice.checklist.length} actions</span>
                  {notice.uncertainties.length > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-amber-700 font-medium">
                        {notice.uncertainties.filter((u) => !u.resolved).length} flagged
                      </span>
                    </>
                  )}
                </div>
                <span className="text-sky-700 font-semibold inline-flex items-center gap-1">
                  Inspect Notice <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Capabilities */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12">
          <div className="max-w-3xl space-y-4 mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Engine Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Built Specifically for Academic Administrative Chaos
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Standard OCR and generic summaries lose critical details like registration prerequisites, fine deadlines, and room reassignments. Notice Decoder enforces structured data models designed around student reality.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div className="space-y-2">
              <div className="text-sky-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Multi-Event Timetables
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Separates multi-day examination schedules, paper codes, and multiple workshop tracks into distinct calendar records.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sky-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Conflict & Ambiguity Flags
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Flags vague deadlines like &quot;submit next Friday&quot; or missing room numbers before they cause exam hall panic.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sky-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Evidence Traceability
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Every extracted claim links directly to verbatim text snippets from the original document for quick confirmation.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sky-400 font-semibold flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Action Checklists
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automatically extracts required physical documents (RFID card, fee receipt, parent NOC) and submission desks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 text-center">
        <div className="p-8 sm:p-12 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Ready to decode a circular?
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Upload your notice file or paste text directly. Notice Decoder processes it in seconds with clear validation warnings.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/notices/new')}
              className="px-6 py-3 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              Start New Notice Intake
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
