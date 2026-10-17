import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { NoticeDecoded, NoticeEvent, ActionItem, UncertaintyWarning } from '../types/notice';
import { ConflictOverlap, ConflictReview, TimetableEntry } from '../types/phase2';
import { noticeRepository } from '../services/noticeRepository';
import { timetableRepository } from '../services/timetableRepository';
import { detectClashes } from '../services/clashDetectionEngine';
import { generateIcsCalendar, downloadIcsFile } from '../services/icsExport';
import { coordinatorService } from '../services/coordinatorService';
import { acknowledgementService } from '../services/acknowledgementService';
import { CoordinatorNotice, AcknowledgementRecord } from '../types/phase3';
import { formatDisplayDate } from '../utils/dateNormalizer';
import {
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  FileText,
  User,
  Mail,
  Phone,
  Edit3,
  Save,
  CheckSquare,
  Square,
  ArrowLeft,
  Share2,
  Download,
  Trash2,
  Info,
  ShieldAlert,
  HelpCircle,
  Plus,
  X,
  ExternalLink,
} from 'lucide-react';

export const NoticeDetailPage: React.FC = () => {
  const { params, navigate } = useRouter();
  const noticeId = params.id;

  const [notice, setNotice] = useState<NoticeDecoded | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'schedule' | 'checklist' | 'eligibility' | 'source' | 'versions'>('schedule');
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Editable copy state
  const [editForm, setEditForm] = useState<NoticeDecoded | null>(null);

  // Phase 3 Coordinator & Acknowledgement State
  const [coordinatorNotice, setCoordinatorNotice] = useState<CoordinatorNotice | null>(null);
  const [studentAck, setStudentAck] = useState<AcknowledgementRecord | null>(null);
  const [ackNotes, setAckNotes] = useState('');
  const [isSubmittingAck, setIsSubmittingAck] = useState(false);

  const { user } = useAuth();
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [conflictReviews, setConflictReviews] = useState<ConflictReview[]>([]);

  // Inline resolution for uncertainties
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');

  const loadNotice = async () => {
    setLoading(true);
    try {
      if (noticeId) {
        let data: NoticeDecoded | null = await noticeRepository.getById(noticeId, user?.id);
        let coordData: CoordinatorNotice | null = null;

        if (!data) {
          coordData = await coordinatorService.getNoticeById(noticeId);
          if (coordData) {
            data = coordData;
            setCoordinatorNotice(coordData);
          }
        } else if ((data as any).isCoordinatorCreated) {
          coordData = await coordinatorService.getNoticeById(noticeId);
          if (coordData) setCoordinatorNotice(coordData);
        }

        setNotice(data);
        setEditForm(data ? JSON.parse(JSON.stringify(data)) : null);

        // Record student view and retrieve acknowledgement state
        if (data && user) {
          const version = (data as any).currentVersion || 1;
          const ack = await acknowledgementService.recordView(
            data.id,
            user.id,
            user.email,
            user.displayName,
            version
          );
          setStudentAck(ack);
          if (ack.notes) setAckNotes(ack.notes);
        }
      }
      const ttList = await timetableRepository.getEntries(user?.id);
      const revList = await timetableRepository.getConflictReviews(user?.id);
      setTimetable(ttList);
      setConflictReviews(revList);
    } catch (e) {
      console.error('Failed to load notice:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotice();
  }, [noticeId, user]);

  const handleStudentAcknowledge = async () => {
    if (!notice || !user) return;
    setIsSubmittingAck(true);
    try {
      const version = (notice as any).currentVersion || 1;
      const completedIds = notice.checklist.filter((c) => c.completed).map((c) => c.id);
      const hasPending = notice.checklist.some((c) => !c.completed);

      const ack = await acknowledgementService.submitAcknowledgement({
        noticeId: notice.id,
        userId: user.id,
        userEmail: user.email,
        displayName: user.displayName,
        noticeVersion: version,
        completedActionIds: completedIds,
        hasPendingActions: hasPending,
        notes: ackNotes,
      });
      setStudentAck(ack);
      triggerSuccess();
    } finally {
      setIsSubmittingAck(false);
    }
  };

  const { conflicts: noticeClashes } = useMemo(() => {
    if (!notice) return { conflicts: [] };
    return detectClashes([notice], timetable, conflictReviews);
  }, [notice, timetable, conflictReviews]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-pulse">
        <div className="h-4 bg-slate-200 rounded w-1/5" />
        <div className="h-8 bg-slate-200 rounded w-3/5" />
        <div className="h-32 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  if (!notice || !editForm) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Notice Record Not Found</h2>
        <p className="text-xs text-slate-600">
          The requested circular ID could not be located in local development storage.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Toggle Action Item completion
  const handleToggleChecklist = async (actionId: string) => {
    const updatedChecklist = notice.checklist.map((item) =>
      item.id === actionId ? { ...item, completed: !item.completed } : item
    );
    const updated = { ...notice, checklist: updatedChecklist };
    setNotice(updated);
    setEditForm(updated);
    await noticeRepository.save(updated);
  };

  // Mark notice as confirmed
  const handleConfirmNotice = async () => {
    const updated: NoticeDecoded = {
      ...notice,
      status: 'confirmed',
      updatedAt: new Date().toISOString(),
    };
    setNotice(updated);
    setEditForm(updated);
    await noticeRepository.save(updated, user?.id);
    triggerSuccess();
  };

  // Save all edits
  const handleSaveEdits = async () => {
    if (!editForm) return;
    setNotice(editForm);
    await noticeRepository.save(editForm, user?.id);
    setIsEditing(false);
    triggerSuccess();
  };

  const triggerSuccess = () => {
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  // Resolve an uncertainty warning
  const handleResolveUncertainty = async (uId: string) => {
    const updatedUncertainties = notice.uncertainties.map((u) => {
      if (u.id === uId) {
        return {
          ...u,
          resolved: true,
          userCorrection: resolutionText || 'Verified by student',
        };
      }
      return u;
    });

    const updated = { ...notice, uncertainties: updatedUncertainties };
    setNotice(updated);
    setEditForm(updated);
    await noticeRepository.save(updated, user?.id);
    setResolvingId(null);
    setResolutionText('');
    triggerSuccess();
  };

  const handleDeleteNotice = async () => {
    if (window.confirm('Delete this decoded notice from your account?')) {
      await noticeRepository.delete(notice.id, user?.id);
      navigate('/dashboard');
    }
  };

  const unresolvedUncertainties = notice.uncertainties.filter((u) => !u.resolved);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {saveSuccessNotice && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white rounded-lg shadow-lg flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Notice changes saved successfully to local repository</span>
        </div>
      )}

      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setEditForm(JSON.parse(JSON.stringify(notice)));
                  setIsEditing(false);
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSaveEdits}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save All Edits</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Fields</span>
              </button>

              <button
                onClick={() => setShowCalendarModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Calendar</span>
              </button>

              {notice.status !== 'confirmed' && (
                <button
                  onClick={handleConfirmNotice}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mark as Confirmed</span>
                </button>
              )}

              <button
                onClick={handleDeleteNotice}
                title="Delete this notice"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Notice Header Section */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Zero-Pill Unboxed Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
            <span className="font-semibold text-slate-900 capitalize">
              {notice.noticeType} Circular
            </span>
            <span aria-hidden="true">·</span>
            <span>{notice.department || 'Department Office'}</span>
            <span aria-hidden="true">·</span>
            <span>{notice.institution || 'University'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-500">
              Ref: {notice.referenceNumber || 'Pending'}
            </span>
            <span aria-hidden="true">·</span>
            <span>Issued: {notice.publicationDate ? formatDisplayDate(notice.publicationDate) : 'Not specified'}</span>
          </div>

          {/* Status & Provider Disclosures */}
          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded border ${
                notice.status === 'confirmed'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {notice.status === 'confirmed' ? 'Verified & Confirmed' : 'Under Student Review'}
            </span>

            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {notice.extractionSource === 'gemini_multimodal'
                ? 'Gemini 3.8 Flash (Multimodal)'
                : notice.extractionSource === 'gemini_text'
                ? 'Gemini 3.8 Flash (Text)'
                : notice.extractionSource === 'deterministic_parser'
                ? 'Deterministic Local Parser'
                : 'Sample Notice Fixture'}
            </span>
          </div>
        </div>

        {/* Title */}
        {isEditing ? (
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Notice Title</label>
            <input
              type="text"
              value={editForm.noticeTitle}
              onChange={(e) => setEditForm({ ...editForm, noticeTitle: e.target.value })}
              className="w-full p-2 text-base font-bold text-slate-900 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600"
            />
          </div>
        ) : (
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
            {notice.noticeTitle}
          </h1>
        )}

        {/* Plain-Language Summary Box */}
        <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-lg space-y-1.5">
          <div className="text-xs font-semibold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-sky-700" />
            <span>Plain-Language Summary for Students</span>
          </div>

          {isEditing ? (
            <textarea
              rows={3}
              value={editForm.plainLanguageSummary}
              onChange={(e) => setEditForm({ ...editForm, plainLanguageSummary: e.target.value })}
              className="w-full p-2 text-xs text-slate-800 bg-white border border-slate-300 rounded focus:ring-2 focus:ring-sky-600 leading-relaxed font-sans"
            />
          ) : (
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {notice.plainLanguageSummary}
            </p>
          )}
        </div>

        {/* Phase 3 Coordinator Audience & Publication Disclosure */}
        {coordinatorNotice && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Official Institutional Circular · v{coordinatorNotice.currentVersion}
            </span>
            <span className="text-slate-500">
              Published to:{' '}
              <strong className="text-slate-800">
                {coordinatorNotice.targetAudience.type === 'batch'
                  ? `Batch ${coordinatorNotice.targetAudience.batchYear} (${coordinatorNotice.targetAudience.department || 'All Departments'})`
                  : coordinatorNotice.targetAudience.type === 'department'
                  ? coordinatorNotice.targetAudience.department
                  : 'All Enrolled College Students'}
              </strong>
            </span>
            {coordinatorNotice.publishedByName && (
              <span className="text-slate-400">· By {coordinatorNotice.publishedByName}</span>
            )}
          </div>
        )}
      </div>

      {/* Phase 3 Student Acknowledgement & Verification Section */}
      {user && (
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-sky-700" />
                <h2 className="text-sm font-bold text-slate-900">Student Acknowledgement & Action Verification</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Acknowledge this circular and record your verified progress directly to the academic coordinator.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Acknowledgement:</span>
              <span
                className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                  studentAck?.state === 'acknowledged'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : studentAck?.state === 'action_required'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {studentAck?.state ? studentAck.state.replace('_', ' ') : 'VIEWED'}
              </span>
            </div>
          </div>

          {/* Material Revision Notice Alert */}
          {studentAck?.reAcknowledgementRequested && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-lg flex items-start gap-3 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Material Revision Notice Issued</strong>
                <p className="mt-0.5 leading-relaxed">
                  The coordinator issued an updated schedule or venue for this circular. Please review the revisions and submit updated acknowledgement.
                </p>
              </div>
            </div>
          )}

          {/* Optional notes & submit acknowledgement */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Optional notes for coordinator (e.g., 'Fees cleared; hall ticket verified')"
                value={ackNotes}
                onChange={(e) => setAckNotes(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <button
              onClick={handleStudentAcknowledge}
              disabled={isSubmittingAck}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs shrink-0 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>
                {isSubmittingAck
                  ? 'Recording...'
                  : studentAck?.state === 'acknowledged'
                  ? 'Update Acknowledgement'
                  : 'Submit Verified Acknowledgement'}
              </span>
            </button>
          </div>

          {studentAck?.acknowledgedAt && (
            <p className="text-[11px] text-slate-400 pt-1">
              Confirmed by {user.displayName} on{' '}
              {new Date(studentAck.acknowledgedAt).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
          )}
        </div>
      )}

      {/* Uncertainty & Ambiguity Audit Banner (CRITICAL FOR TRUST) */}
      {unresolvedUncertainties.length > 0 && (
        <div className="p-5 bg-amber-50/90 border border-amber-200 rounded-xl space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>
                {unresolvedUncertainties.length} Ambiguities Flagged in this Notice
              </span>
            </div>
            <span className="text-[11px] text-amber-800">
              Please verify with class coordinator or proctor before assuming final dates
            </span>
          </div>

          <div className="space-y-3">
            {unresolvedUncertainties.map((u) => (
              <div
                key={u.id}
                className="p-3 bg-white rounded-lg border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="text-amber-800 font-mono text-[11px] uppercase">
                      [{u.issueType.replace('_', ' ')}]
                    </span>
                    <span>{u.field}</span>
                  </div>
                  <p className="text-slate-600">{u.explanation}</p>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {resolvingId === u.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Verified: 10:00 AM in Room 201"
                        value={resolutionText}
                        onChange={(e) => setResolutionText(e.target.value)}
                        className="p-1.5 text-xs border border-slate-300 rounded focus:ring-2 focus:ring-sky-600 w-48 sm:w-64"
                      />
                      <button
                        onClick={() => handleResolveUncertainty(u.id)}
                        className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setResolvingId(null)}
                        className="p-1 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setResolvingId(u.id);
                        setResolutionText('');
                      }}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold text-xs transition-colors"
                    >
                      Resolve / Add Correction
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timetable Clash Panel (Phase 2 Real Clash Detection Engine) */}
      {noticeClashes.length > 0 && (
        <div className="p-5 bg-rose-50/90 border border-rose-200 rounded-xl space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-rose-700" />
              <span>
                {noticeClashes.filter((c) => c.status !== 'dismissed').length} Class Schedule {noticeClashes.length === 1 ? 'Clash' : 'Clashes'} Detected
              </span>
            </div>
            <span className="text-[11px] text-rose-800">
              This notice event directly overlaps with your enrolled weekly classes
            </span>
          </div>

          <div className="space-y-3">
            {noticeClashes.map((c) => (
              <div
                key={c.id}
                className="p-3.5 bg-white rounded-lg border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <span className="text-rose-800 font-bold">[{c.overlapMinutes} min overlap]</span>
                    <span>&ldquo;{c.noticeEventTitle}&rdquo; clashes with &ldquo;{c.classTitle}&rdquo;</span>
                  </div>
                  <p className="text-slate-600 font-mono text-[11px]">
                    Date: {formatDisplayDate(c.conflictDate)} · Notice Time: {c.noticeTimeRange} · Class Time: {c.classTimeRange}
                  </p>
                  {c.evidenceSnippet && (
                    <p className="text-slate-500 text-[11px] italic">
                      Notice Quote: &ldquo;{c.evidenceSnippet}&rdquo;
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {c.status === 'dismissed' ? (
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      False Positive Dismissed
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={async () => {
                          await timetableRepository.setConflictReview({
                            id: `rev_${c.noticeEventId}_${c.timetableEntryId}`,
                            userId: user?.id || 'user_demo_student_01',
                            eventId: c.noticeEventId,
                            timetableEntryId: c.timetableEntryId,
                            status: 'dismissed',
                            updatedAt: new Date().toISOString(),
                          });
                          loadNotice();
                        }}
                        className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded font-medium text-[11px]"
                      >
                        Dismiss False Positive
                      </button>
                      <button
                        onClick={async () => {
                          await timetableRepository.setConflictReview({
                            id: `rev_${c.noticeEventId}_${c.timetableEntryId}`,
                            userId: user?.id || 'user_demo_student_01',
                            eventId: c.noticeEventId,
                            timetableEntryId: c.timetableEntryId,
                            status: 'resolved',
                            updatedAt: new Date().toISOString(),
                          });
                          loadNotice();
                        }}
                        className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded font-semibold text-[11px]"
                      >
                        Mark Reviewed
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs for Notice Views */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-xs font-semibold text-slate-600 overflow-x-auto">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`py-3 relative whitespace-nowrap cursor-pointer ${
            activeTab === 'schedule'
              ? 'text-sky-800 font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <span>Schedule & Timetable ({notice.events.length})</span>
          {activeTab === 'schedule' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-700" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('checklist')}
          className={`py-3 relative whitespace-nowrap cursor-pointer ${
            activeTab === 'checklist'
              ? 'text-sky-800 font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <span>Action Checklist & Documents ({notice.checklist.length})</span>
          {activeTab === 'checklist' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-700" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('eligibility')}
          className={`py-3 relative whitespace-nowrap cursor-pointer ${
            activeTab === 'eligibility'
              ? 'text-sky-800 font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <span>Eligibility & Coordinator</span>
          {activeTab === 'eligibility' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-700" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('source')}
          className={`py-3 relative whitespace-nowrap cursor-pointer ${
            activeTab === 'source'
              ? 'text-sky-800 font-bold'
              : 'hover:text-slate-900'
          }`}
        >
          <span>Source Notice & Evidence Quotes</span>
          {activeTab === 'source' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-700" />
          )}
        </button>

        {coordinatorNotice?.versionHistory && coordinatorNotice.versionHistory.length > 0 && (
          <button
            onClick={() => setActiveTab('versions')}
            className={`py-3 relative whitespace-nowrap cursor-pointer ${
              activeTab === 'versions'
                ? 'text-sky-800 font-bold'
                : 'hover:text-slate-900'
            }`}
          >
            <span>Revision History ({coordinatorNotice.versionHistory.length})</span>
            {activeTab === 'versions' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-700" />
            )}
          </button>
        )}
      </div>

      {/* Tab 1: Schedule & Timetable */}
      {activeTab === 'schedule' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Chronological schedule entries extracted from notice</span>
            {isEditing && (
              <button
                onClick={() => {
                  const newEvt: NoticeEvent = {
                    id: `evt_custom_${Date.now()}`,
                    title: 'New Event Session',
                    date: new Date().toISOString().split('T')[0],
                    startTime: '10:00 AM',
                    endTime: '12:00 PM',
                    venue: 'Campus Room',
                    isMandatory: true,
                    targetAudience: 'All students',
                  };
                  setEditForm({
                    ...editForm,
                    events: [...editForm.events, newEvt],
                  });
                }}
                className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Timetable Row</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(isEditing ? editForm.events : notice.events).map((evt, idx) => (
              <div
                key={evt.id || idx}
                className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-1">
                    {isEditing ? (
                      <input
                        type="text"
                        value={evt.title}
                        onChange={(e) => {
                          const updated = [...editForm.events];
                          updated[idx].title = e.target.value;
                          setEditForm({ ...editForm, events: updated });
                        }}
                        className="w-full sm:w-96 p-1.5 text-sm font-semibold border border-slate-300 rounded"
                      />
                    ) : (
                      <h3 className="text-base font-semibold text-slate-900">
                        {evt.title}
                      </h3>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {isEditing ? (
                          <input
                            type="text"
                            value={evt.date}
                            onChange={(e) => {
                              const updated = [...editForm.events];
                              updated[idx].date = e.target.value;
                              setEditForm({ ...editForm, events: updated });
                            }}
                            className="p-1 border border-slate-300 rounded text-xs"
                          />
                        ) : (
                          formatDisplayDate(evt.date)
                        )}
                      </span>

                      <span aria-hidden="true">·</span>

                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              placeholder="Start"
                              value={evt.startTime || ''}
                              onChange={(e) => {
                                const updated = [...editForm.events];
                                updated[idx].startTime = e.target.value;
                                setEditForm({ ...editForm, events: updated });
                              }}
                              className="p-1 border border-slate-300 rounded text-xs w-20"
                            />
                            <span>-</span>
                            <input
                              type="text"
                              placeholder="End"
                              value={evt.endTime || ''}
                              onChange={(e) => {
                                const updated = [...editForm.events];
                                updated[idx].endTime = e.target.value;
                                setEditForm({ ...editForm, events: updated });
                              }}
                              className="p-1 border border-slate-300 rounded text-xs w-20"
                            />
                          </div>
                        ) : (
                          evt.startTime
                            ? `${evt.startTime} ${evt.endTime ? `- ${evt.endTime}` : ''}`
                            : 'Time unstated'
                        )}
                      </span>

                      <span aria-hidden="true">·</span>

                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {isEditing ? (
                          <input
                            type="text"
                            value={evt.venue || ''}
                            onChange={(e) => {
                              const updated = [...editForm.events];
                              updated[idx].venue = e.target.value;
                              setEditForm({ ...editForm, events: updated });
                            }}
                            className="p-1 border border-slate-300 rounded text-xs"
                          />
                        ) : (
                          evt.venue || 'Venue TBD'
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {evt.isMandatory && (
                      <span className="text-[11px] font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        Compulsory Attendance
                      </span>
                    )}
                    {isEditing && (
                      <button
                        onClick={() => {
                          const updated = editForm.events.filter((_, i) => i !== idx);
                          setEditForm({ ...editForm, events: updated });
                        }}
                        className="p-1 text-rose-500 hover:text-rose-700"
                        title="Remove event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {evt.targetAudience && (
                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Target Group:</span>{' '}
                    {evt.targetAudience}
                  </div>
                )}

                {evt.evidenceSnippet && (
                  <div className="p-2 bg-slate-50 border border-slate-100 rounded text-[11px] font-mono text-slate-600 flex items-start gap-2">
                    <span className="text-slate-400 font-semibold shrink-0">Source Quote:</span>
                    <span className="line-clamp-2">{evt.evidenceSnippet}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Action Checklist */}
      {activeTab === 'checklist' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Interactive checklist of tasks, required documents, and submission counters</span>
            {isEditing && (
              <button
                onClick={() => {
                  const newAct: ActionItem = {
                    id: `act_custom_${Date.now()}`,
                    task: 'New required task',
                    deadline: 'Immediate',
                    requiredDocuments: ['College ID Card'],
                    submissionLinkOrPlace: 'Department Counter',
                    completed: false,
                  };
                  setEditForm({
                    ...editForm,
                    checklist: [...editForm.checklist, newAct],
                  });
                }}
                className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-900 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Checklist Item</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {(isEditing ? editForm.checklist : notice.checklist).map((item, idx) => (
              <div
                key={item.id || idx}
                className={`p-4 rounded-xl border transition-all ${
                  item.completed
                    ? 'bg-slate-50/80 border-slate-200 opacity-80'
                    : 'bg-white border-slate-200 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  {!isEditing && (
                    <button
                      onClick={() => handleToggleChecklist(item.id)}
                      className="mt-0.5 text-slate-400 hover:text-sky-700 focus:outline-hidden"
                      aria-label="Toggle task completion"
                    >
                      {item.completed ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  )}

                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {isEditing ? (
                        <input
                          type="text"
                          value={item.task}
                          onChange={(e) => {
                            const updated = [...editForm.checklist];
                            updated[idx].task = e.target.value;
                            setEditForm({ ...editForm, checklist: updated });
                          }}
                          className="w-full sm:w-96 p-1.5 text-xs font-medium border border-slate-300 rounded"
                        />
                      ) : (
                        <span
                          className={`text-sm font-semibold ${
                            item.completed
                              ? 'line-through text-slate-500'
                              : 'text-slate-900'
                          }`}
                        >
                          {item.task}
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-rose-700">
                          Due: {item.deadline ? formatDisplayDate(item.deadline) : 'Immediate'}
                        </span>
                        {isEditing && (
                          <button
                            onClick={() => {
                              const updated = editForm.checklist.filter((_, i) => i !== idx);
                              setEditForm({ ...editForm, checklist: updated });
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700"
                            title="Remove action item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Required Documents */}
                    {item.requiredDocuments && item.requiredDocuments.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="font-semibold text-slate-700">Documents:</span>
                        {item.requiredDocuments.map((doc, dIdx) => (
                          <span
                            key={dIdx}
                            className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]"
                          >
                            {doc}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Submission Desk / URL */}
                    {item.submissionLinkOrPlace && (
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <span className="font-medium text-slate-700">Submit To / Location:</span>
                        <span>{item.submissionLinkOrPlace}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Eligibility & Coordinator Contacts */}
      {activeTab === 'eligibility' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Student Eligibility Criteria
            </h3>

            <div className="space-y-3 text-xs text-slate-700">
              <div>
                <span className="font-semibold text-slate-900 block mb-1">
                  Applicable Batches:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {notice.eligibility.eligibleBatches.map((b, i) => (
                    <span key={i} className="bg-sky-50 text-sky-900 border border-sky-100 px-2 py-0.5 rounded">
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {notice.eligibility.minimumRequirements && (
                <div>
                  <span className="font-semibold text-slate-900 block mb-0.5">
                    Attendance / Minimum Bar:
                  </span>
                  <p className="text-slate-600 leading-relaxed">
                    {notice.eligibility.minimumRequirements}
                  </p>
                </div>
              )}

              {notice.eligibility.prerequisites && notice.eligibility.prerequisites.length > 0 && (
                <div>
                  <span className="font-semibold text-slate-900 block mb-0.5">
                    Prerequisites:
                  </span>
                  <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                    {notice.eligibility.prerequisites.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {notice.eligibility.notes && (
                <div className="pt-2 border-t border-slate-100 text-slate-500 italic">
                  Note: {notice.eligibility.notes}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Coordinator & Inquiries
            </h3>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-900 block">
                    {notice.organizer.name || 'Department Academic Coordinator'}
                  </span>
                  <span className="text-slate-500">
                    {notice.organizer.designation || 'Faculty Administrator'}
                  </span>
                </div>
              </div>

              {notice.organizer.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <a
                    href={`mailto:${notice.organizer.email}`}
                    className="text-sky-700 hover:underline"
                  >
                    {notice.organizer.email}
                  </a>
                </div>
              )}

              {notice.organizer.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-mono">{notice.organizer.phone}</span>
                </div>
              )}

              {notice.organizer.office && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{notice.organizer.office}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Original Notice & Source Evidence Quotes */}
      {activeTab === 'source' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Original Notice Raw Content</span>
              <span className="font-mono text-slate-400">
                {notice.fileName || 'Direct Text Input'}
              </span>
            </div>

            <pre className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {notice.rawText || 'No raw text attached'}
            </pre>
          </div>

          <div className="lg:col-span-5 p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="text-xs font-semibold text-slate-700">
              Evidence Quotes Extracted for Claims
            </div>
            <p className="text-xs text-slate-500">
              Each structured claim is grounded directly in document passages:
            </p>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {notice.sourceEvidence && notice.sourceEvidence.length > 0 ? (
                notice.sourceEvidence.map((ev, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 border border-slate-100 rounded text-xs space-y-1">
                    <div className="font-semibold text-slate-900">{ev.claim}</div>
                    <div className="font-mono text-[11px] text-slate-600 pl-2 border-l-2 border-sky-400">
                      &ldquo;{ev.snippet}&rdquo;
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No explicit quotes mapped.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Version History & Changelog (Phase 3) */}
      {activeTab === 'versions' && coordinatorNotice && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-2xs">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Notice Revision History & Changelog</h3>
            <p className="text-xs text-slate-500">
              Verifiable log of official publication versions, schedule adjustments, and venue updates.
            </p>
          </div>

          <div className="space-y-4 divide-y divide-slate-100">
            {coordinatorNotice.versionHistory.map((ver) => (
              <div key={ver.id} className="pt-3 first:pt-0 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      Version {ver.versionNumber}
                    </span>
                    {ver.materialChange && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                        Material Revision
                      </span>
                    )}
                    <span className="text-slate-700 font-medium">By {ver.changedBy}</span>
                  </div>
                  <span className="text-slate-400 text-[11px]">
                    {new Date(ver.changedAt).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-slate-700 leading-relaxed font-medium">{ver.changeSummary}</p>

                {ver.changesList && ver.changesList.length > 0 && (
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {ver.changesList.map((ch, idx) => (
                      <li key={idx}>{ch}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase 2 Calendar Sync Modal */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-700" />
                <span>Calendar Export & Sync</span>
              </h3>
              <button
                onClick={() => setShowCalendarModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Export verified notice events directly into Apple Calendar, Google Calendar, or Microsoft Outlook as an RFC-5545 compliant <code>.ics</code> file.
              </p>
              <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg text-sky-950 space-y-1">
                <span className="font-semibold block">Exported Calendar Properties:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Standard RFC-5545 <code>VCALENDAR</code> &amp; <code>VEVENT</code> structure</li>
                  <li>Proper timezone handling &amp; 75-character folded lines</li>
                  <li>Verbatim notice evidence included in event descriptions</li>
                </ul>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(notice, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `notice_${notice.id}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Download JSON
              </button>
              <button
                onClick={() => {
                  const icsContent = generateIcsCalendar(
                    notice.events.map((e) => ({
                      event: e,
                      noticeTitle: notice.noticeTitle,
                      institution: notice.institution,
                    }))
                  );
                  downloadIcsFile(icsContent, `notice_${notice.id}.ics`);
                  setShowCalendarModal(false);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-sky-300" />
                <span>Download Valid .ICS</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
