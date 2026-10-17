import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { NoticeDecoded } from '../types/notice';
import { TimetableEntry, ConflictOverlap } from '../types/phase2';
import { noticeRepository } from '../services/noticeRepository';
import { timetableRepository } from '../services/timetableRepository';
import { detectClashes } from '../services/clashDetectionEngine';
import { coordinatorService } from '../services/coordinatorService';
import { acknowledgementService } from '../services/acknowledgementService';
import { notificationService } from '../services/notificationService';
import { CoordinatorNotice, AcknowledgementRecord } from '../types/phase3';
import { formatDisplayDate } from '../utils/dateNormalizer';
import {
  PlusCircle,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Trash2,
  ChevronRight,
  Inbox,
  CheckSquare,
  Square,
  Search,
  BookOpen,
  Building2,
  UploadCloud,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();
  const [notices, setNotices] = useState<NoticeDecoded[]>([]);
  const [coordinatorNotices, setCoordinatorNotices] = useState<CoordinatorNotice[]>([]);
  const [userAcks, setUserAcks] = useState<Record<string, AcknowledgementRecord>>({});
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'needs_review' | 'confirmed' | 'exam' | 'event'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [resetting, setResetting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await noticeRepository.getAll();
      const tt = await timetableRepository.getEntries(user?.id);
      setNotices(data);
      setTimetable(tt);

      if (user) {
        const published = await coordinatorService.getPublishedNoticesForStudent(user);
        setCoordinatorNotices(published);

        const acksMap: Record<string, AcknowledgementRecord> = {};
        for (const p of published) {
          const a = await acknowledgementService.getStudentAcknowledgement(p.id, user.id);
          if (a) acksMap[p.id] = a;
        }
        setUserAcks(acksMap);

        // Generate automated reminders
        const clashList = detectClashes([...data, ...published], tt);
        await notificationService.generateAutomatedReminders(
          user.id,
          [...data, ...published],
          clashList.conflicts
        );
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleResetToSamples = async () => {
    if (window.confirm('Reset notices to standard realistic college notice samples? Any custom edits will be restored to defaults.')) {
      setResetting(true);
      try {
        const restored = await noticeRepository.resetToSamples();
        setNotices(restored);
      } finally {
        setResetting(false);
      }
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this notice record?')) {
      await noticeRepository.delete(id);
      loadData();
    }
  };

  const handleToggleTask = async (noticeId: string, taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const targetNotice = notices.find((n) => n.id === noticeId);
    if (!targetNotice) return;

    const updatedChecklist = targetNotice.checklist.map((item) =>
      item.id === taskId ? { ...item, completed: !item.completed } : item
    );

    const updatedNotice = {
      ...targetNotice,
      checklist: updatedChecklist,
      updatedAt: new Date().toISOString(),
    };

    await noticeRepository.save(updatedNotice);
    setNotices((prev) => prev.map((n) => (n.id === noticeId ? updatedNotice : n)));
  };

  // Filter notices by category and search query
  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      // Category filter
      if (selectedFilter === 'needs_review' && !n.uncertainties.some((u) => !u.resolved)) return false;
      if (selectedFilter === 'confirmed' && n.status !== 'confirmed') return false;
      if (selectedFilter === 'exam' && n.noticeType !== 'exam') return false;
      if (selectedFilter === 'event' && n.noticeType !== 'event') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = n.noticeTitle.toLowerCase().includes(q);
        const matchesSummary = n.plainLanguageSummary.toLowerCase().includes(q);
        const matchesDept = n.department?.toLowerCase().includes(q);
        const matchesRef = n.referenceNumber?.toLowerCase().includes(q);
        return matchesTitle || matchesSummary || matchesDept || matchesRef;
      }

      return true;
    });
  }, [notices, selectedFilter, searchQuery]);

  // Aggregate upcoming deadlines from all notices
  const upcomingDeadlines = useMemo(() => {
    const list: {
      id: string;
      noticeId: string;
      noticeTitle: string;
      task: string;
      deadline: string;
      completed: boolean;
      urgency: string;
    }[] = [];

    notices.forEach((n) => {
      n.checklist.forEach((item) => {
        if (item.deadline) {
          list.push({
            id: item.id,
            noticeId: n.id,
            noticeTitle: n.noticeTitle,
            task: item.task,
            deadline: item.deadline,
            completed: item.completed,
            urgency: n.urgency,
          });
        }
      });
    });

    return list.sort((a, b) => a.deadline.localeCompare(b.deadline)).slice(0, 5);
  }, [notices]);

  const { conflicts: activeClashes } = useMemo(() => {
    return detectClashes(notices, timetable);
  }, [notices, timetable]);

  const totalUnresolved = notices.reduce(
    (acc, n) => acc + n.uncertainties.filter((u) => !u.resolved).length,
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Student Dashboard</span>
            <span aria-hidden="true">·</span>
            <span>{user ? user.displayName : 'Alex Rivera'}</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-600 font-medium">CS Batch 2026</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Academic Schedule & Notices
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review decoded circulars, monitor schedule clashes with your weekly timetable, and track verified task deadlines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/timetable')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-700" />
            <span>My Timetable</span>
          </button>

          <button
            onClick={() => navigate('/calendar')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-sky-700" />
            <span>Calendar</span>
          </button>

          <button
            onClick={handleResetToSamples}
            disabled={resetting}
            title="Reset repository to realistic college notice samples"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${resetting ? 'animate-spin' : ''}`} />
            <span>Reset Demo</span>
          </button>

          <button
            onClick={() => navigate('/notices/new')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 text-sky-300" />
            <span>Decode New Notice</span>
          </button>
        </div>
      </div>

      {/* Metrics Row (4-column factual count grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-600">Total Decoded Notices</span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {notices.length}
          </div>
          <p className="text-xs text-slate-500">
            {notices.filter((n) => n.status === 'confirmed').length} verified & confirmed
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-600">Active Action Tasks</span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
            {upcomingDeadlines.length}
          </div>
          <p className="text-xs text-slate-500">
            {upcomingDeadlines.filter((d) => d.completed).length} completed tasks
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-600">Uncertainties to Verify</span>
          <div className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
            {totalUnresolved}
          </div>
          <p className="text-xs text-slate-500">
            Items requiring student verification
          </p>
        </div>

        <div
          onClick={() => navigate('/calendar')}
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-amber-300 shadow-2xs space-y-1 cursor-pointer transition-colors"
        >
          <span className="text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Schedule Clashes</span>
            <AlertTriangle className={`w-3.5 h-3.5 ${activeClashes.length > 0 ? 'text-amber-600' : 'text-slate-300'}`} />
          </span>
          <div className={`text-2xl font-bold font-mono tabular-nums ${activeClashes.length > 0 ? 'text-amber-800' : 'text-slate-900'}`}>
            {activeClashes.length}
          </div>
          <p className="text-xs text-slate-500">
            {activeClashes.length > 0 ? 'Click to inspect in calendar' : 'No conflicts detected'}
          </p>
        </div>
      </div>

      {/* Main Grid: Notice Cards & Upcoming Deadlines Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Notices List & Filters (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Official Institutional Circulars & Cohort Feed */}
          {coordinatorNotices.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-700" />
                  <h2 className="text-sm font-bold text-slate-900">
                    Official Institutional Circulars ({coordinatorNotices.length})
                  </h2>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  Targeted to your academic cohort
                </span>
              </div>

              <div className="space-y-3">
                {coordinatorNotices.map((cn) => {
                  const ack = userAcks[cn.id];
                  const isAcked = ack?.state === 'acknowledged';
                  const isActionReq = ack?.state === 'action_required';

                  return (
                    <div
                      key={cn.id}
                      onClick={() => navigate(`/notices/${cn.id}`)}
                      className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer bg-slate-50/40 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="px-2 py-0.2 rounded-md bg-amber-100 text-amber-900 font-bold">
                              OFFICIAL
                            </span>
                            <span className="font-semibold text-slate-800">
                              {cn.targetAudience.type === 'batch'
                                ? `Batch ${cn.targetAudience.batchYear}`
                                : cn.targetAudience.type === 'department'
                                ? cn.targetAudience.department
                                : 'All Students'}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span className="font-mono text-slate-500">v{cn.currentVersion}</span>
                            {cn.currentVersion > 1 && (
                              <span className="px-1.5 py-0.2 rounded-xs bg-amber-50 text-amber-700 font-medium text-[10px] border border-amber-200">
                                Revised
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                            {cn.noticeTitle}
                          </h3>
                        </div>

                        <span
                          className={`shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            isAcked
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : isActionReq
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isAcked ? 'ACKNOWLEDGED' : isActionReq ? 'ACTION REQUIRED' : 'VIEWED'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {cn.plainLanguageSummary}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100/80">
                        <span>Issued by {cn.department}</span>
                        <span className="font-semibold text-sky-700 flex items-center gap-1">
                          Review & Acknowledge <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <h2 className="text-sm font-bold text-slate-900">Your Decoded Notices</h2>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search notices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:border-transparent text-slate-900 bg-white"
              />
            </div>
          </div>

          {/* Filter Bar (Segmented Controls) */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Notices ({notices.length})
            </button>
            <button
              onClick={() => setSelectedFilter('needs_review')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedFilter === 'needs_review'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Needs Review ({notices.filter((n) => n.uncertainties.some((u) => !u.resolved)).length})
            </button>
            <button
              onClick={() => setSelectedFilter('confirmed')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedFilter === 'confirmed'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Confirmed ({notices.filter((n) => n.status === 'confirmed').length})
            </button>
            <button
              onClick={() => setSelectedFilter('exam')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedFilter === 'exam'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Exams ({notices.filter((n) => n.noticeType === 'exam').length})
            </button>
            <button
              onClick={() => setSelectedFilter('event')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedFilter === 'event'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Events ({notices.filter((n) => n.noticeType === 'event').length})
            </button>
          </div>

          {/* Notices Grid / Empty State */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-6 bg-white rounded-xl border border-slate-200 animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                </div>
              ))}
            </div>
          ) : filteredNotices.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-xl border border-slate-200 space-y-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                {searchQuery ? 'No notices matching your search' : 'No notices in this view'}
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                {notices.length === 0
                  ? 'You have not uploaded any college notices yet. Upload your first circular PDF, image, or text to extract deadlines.'
                  : searchQuery
                  ? 'Try clearing your search query or choosing a different filter.'
                  : 'No notices match the selected category filter.'}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => navigate('/notices/new')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  Decode a Notice
                </button>
                {notices.length === 0 && (
                  <button
                    onClick={handleResetToSamples}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
                  >
                    Load Sample Notices
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotices.map((notice) => {
                const unres = notice.uncertainties.filter((u) => !u.resolved);
                return (
                  <div
                    key={notice.id}
                    onClick={() => navigate(`/notices/${notice.id}`)}
                    className="p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-xs transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-semibold text-slate-800 capitalize">
                            {notice.noticeType}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{notice.publicationDate ? formatDisplayDate(notice.publicationDate) : 'Date unstated'}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-slate-500">
                            {notice.referenceNumber || 'Ref pending'}
                          </span>
                        </div>

                        <h3 className="text-base font-semibold text-slate-900 leading-snug hover:text-sky-800 transition-colors">
                          {notice.noticeTitle}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {notice.status === 'confirmed' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Confirmed
                          </span>
                        ) : unres.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertTriangle className="w-3 h-3" /> {unres.length} to verify
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            Reviewed
                          </span>
                        )}

                        <button
                          onClick={(e) => handleDelete(notice.id, e)}
                          title="Delete notice record"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {notice.plainLanguageSummary}
                    </p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-3 font-mono">
                        <span>{notice.events.length} timetable entries</span>
                        <span aria-hidden="true">·</span>
                        <span>{notice.checklist.length} actions</span>
                      </div>
                      <span className="text-sky-700 font-semibold inline-flex items-center gap-1 hover:underline">
                        Open Analysis <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Upcoming Deadlines Timeline Preview (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-700" />
                <span>Upcoming Deadlines</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">Chronological</span>
            </div>

            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-slate-500 py-3">No upcoming deadlines found in current notices.</p>
            ) : (
              <div className="space-y-3">
                {upcomingDeadlines.map((dl) => (
                  <div
                    key={dl.id}
                    className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-sky-50/50 hover:border-sky-200 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-rose-800 font-semibold">
                        Due: {formatDisplayDate(dl.deadline)}
                      </span>
                      <button
                        onClick={(e) => handleToggleTask(dl.noticeId, dl.id, e)}
                        className={`text-[11px] font-medium flex items-center gap-1 cursor-pointer ${
                          dl.completed ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-800'
                        }`}
                        title={dl.completed ? 'Mark as incomplete' : 'Mark as completed'}
                      >
                        {dl.completed ? (
                          <>
                            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Done</span>
                          </>
                        ) : (
                          <>
                            <Square className="w-3.5 h-3.5 text-slate-400" />
                            <span>Mark done</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p
                      onClick={() => navigate(`/notices/${dl.noticeId}`)}
                      className={`text-xs font-medium cursor-pointer hover:text-sky-800 line-clamp-2 ${
                        dl.completed ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {dl.task}
                    </p>
                    <div
                      onClick={() => navigate(`/notices/${dl.noticeId}`)}
                      className="text-[11px] text-slate-500 truncate pt-0.5 cursor-pointer hover:underline"
                    >
                      {dl.noticeTitle}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Notice Intake Card */}
          <div className="p-5 bg-sky-50/60 border border-sky-200/80 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-sky-950 uppercase tracking-wider flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-sky-700" />
              <span>Decode New Circular</span>
            </h4>
            <p className="text-xs text-sky-900/80 leading-relaxed">
              Have a fresh college circular or PDF? Upload or paste it directly to extract structured events and deadlines.
            </p>
            <button
              onClick={() => navigate('/notices/new')}
              className="w-full py-2.5 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors text-center shadow-xs cursor-pointer"
            >
              Upload Notice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
