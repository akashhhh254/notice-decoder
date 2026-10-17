import React from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Calendar,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  UploadCloud,
  Clock,
  ChevronRight,
  CheckCircle2,
  LogIn,
} from 'lucide-react';
import { SAMPLE_NOTICES } from '../data/sampleNotices';

export const LandingPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();

  return (
    <div className="space-y-20 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-800">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-600 animate-pulse" />
              <span>Smart Academic Document Assistant</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 leading-[1.15]" style={{ textWrap: 'balance' }}>
              Turn College Notices Into Clear Actions
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              College circulars often hide critical deadlines, exam venues, and mandatory documents in dense walls of text. Notice Decoder extracts structured timetables, verifies submission deadlines, and detects clashes with your classes.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => navigate(user ? '/dashboard' : '/auth/login?redirect=/dashboard')}
                className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
              >
                <span>{user ? 'Go to Dashboard' : 'Get Started'}</span>
                <ArrowRight className="w-4 h-4 text-sky-300" />
              </button>

              {!user ? (
                <button
                  onClick={() => navigate('/auth/login')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                >
                  <LogIn className="w-4 h-4 text-slate-500" />
                  <span>Sign In</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/notices/new')}
                  className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-sky-700" />
                  <span>Upload Notice</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-4 border-t border-slate-200">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                PDFs, photos & text supported
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Timetable clash detection
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Export to calendar (.ics)
              </span>
            </div>
          </div>

          {/* Realistic Product Preview */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-sky-700 text-white flex items-center justify-center font-bold text-[10px]">
                    ND
                  </span>
                  <span className="text-xs font-semibold text-slate-800">Decoded Circular Preview</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">COE/2026/EXAM-089</span>
              </div>

              <div className="p-5 space-y-4 text-sm">
                {/* Before: Raw notice excerpt */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs font-mono text-slate-700 space-y-1">
                  <div className="text-[10px] font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-amber-700" />
                    Raw Circular Text
                  </div>
                  <p className="line-clamp-3 leading-relaxed text-slate-600 text-[11px]">
                    &ldquo;All 3rd & 4th-yr B.Tech candidates are informed that Mid-Term exams commence 17-11-2026. Hall tickets available via proctors after dues clearance on or before 10th Nov 4 PM. Clashes reported to COE 104 on 14.11...&rdquo;
                  </p>
                </div>

                <div className="flex justify-center -my-1 text-slate-400">
                  <span className="text-xs font-semibold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 flex items-center gap-1">
                    <span>Decoded Structured Result</span>
                  </span>
                </div>

                {/* After: Decoded output */}
                <div className="p-3.5 bg-sky-50/40 border border-sky-100 rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 text-xs">
                      Mid-Term Examination Schedule
                    </span>
                    <span className="text-[11px] font-mono text-rose-700 font-semibold px-1.5 py-0.5 bg-rose-50 rounded border border-rose-200">
                      Deadline: Nov 10, 4:00 PM
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="font-medium text-slate-800 flex items-center gap-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
                        Clear Tuition Dues & Collect Admit Slip
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">Accounts Desk</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="font-medium text-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-600" />
                        CS401 Distributed Systems Paper
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">Nov 17, 10:00 AM</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-sky-100/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-amber-700 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      1 Uncertainty flagged for verification
                    </span>
                    <button
                      onClick={() => navigate('/notices/sample_midterm_exam_2026')}
                      className="text-sky-700 hover:text-sky-900 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      Inspect <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Concise 3-Step Process */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-800">
            How It Works
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
            Three Simple Steps to Clarity
          </h2>
          <p className="text-sm text-slate-600 mt-3">
            Go from an ambiguous college circular to an organized schedule in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm">
              01
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Upload Notice
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Upload administrative circular PDFs, photos from college notice boards, mobile screenshots, or paste plain circular text directly.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm">
              02
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Review Important Details
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Inspect extracted dates, venues, deadlines, and prerequisites. Review any flagged ambiguities or missing details directly against verbatim source quotes.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm">
              03
            </div>
            <h3 className="text-lg font-semibold text-slate-900">
              Manage Events
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Detect overlaps with your weekly class timetable, check off completed action items, and export confirmed dates to your calendar app via standard .ics format.
            </p>
          </div>
        </div>
      </section>

      {/* Realistic Sample Notices */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-800">
              Sample College Notices
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Explore Real Decoded Circulars
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Test how real campus circulars are decoded with actionable event checklists.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-semibold text-sky-700 hover:text-sky-900 inline-flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <span>Open Dashboard</span>
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
                  <span>{notice.checklist.length} tasks</span>
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

      {/* Real Product Value Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-2xl p-8 sm:p-12">
          <div className="max-w-3xl space-y-4 mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Genuine Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Built for Real Academic Schedules
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Notice Decoder prevents missed exams and forgotten paperwork by turning dense text into structured items you can verify.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
            <div className="space-y-2">
              <div className="text-sky-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Multi-Event Schedules
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Separates multi-day exam schedules and subject paper dates into individual calendar entries.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sky-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Clash Detection
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Automatically checks upcoming events against your weekly class schedule and warns you of conflicts.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sky-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Source Evidence
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Review exact quotes from the original notice alongside extracted dates and venues for complete verification.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-sky-400 font-semibold flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Action Checklist
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tracks mandatory documents, fee clearance receipts, and submission deadlines with interactive check-offs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 text-center">
        <div className="p-8 sm:p-12 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Have a college circular to decode?
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            Upload your notice or paste its text. Notice Decoder extracts the dates, flags uncertainties, and updates your checklist.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate(user ? '/notices/new' : '/auth/login?redirect=/notices/new')}
              className="px-6 py-3 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
            >
              Upload Notice Now
            </button>
            <button
              onClick={() => navigate(user ? '/dashboard' : '/auth/login')}
              className="px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            >
              {user ? 'View Dashboard' : 'Sign In to Account'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
