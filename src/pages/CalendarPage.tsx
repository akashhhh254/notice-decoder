import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { NoticeDecoded, NoticeEvent } from '../types/notice';
import { TimetableEntry, ConflictOverlap, ConflictReview, CalendarItem } from '../types/phase2';
import { noticeRepository } from '../services/noticeRepository';
import { timetableRepository } from '../services/timetableRepository';
import { detectClashes, getWeekdayFromDate } from '../services/clashDetectionEngine';
import { generateIcsCalendar, downloadIcsFile } from '../services/icsExport';
import { formatDisplayDate } from '../utils/dateNormalizer';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertTriangle,
  Clock,
  MapPin,
  CheckCircle2,
  Filter,
  CheckSquare,
  Square,
  X,
  FileText,
  AlertCircle,
} from 'lucide-react';

export const CalendarPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const [notices, setNotices] = useState<NoticeDecoded[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [reviews, setReviews] = useState<ConflictReview[]>([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'list'>('month');
  const [currentDate, setCurrentDate] = useState(() => new Date('2026-11-15T00:00:00Z')); // Centered around academic semester

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'conflicts_only' | 'exams' | 'deadlines'>('all');

  // .ICS Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());

  // Conflict review modal
  const [activeConflict, setActiveConflict] = useState<ConflictOverlap | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const nList = await noticeRepository.getAll();
      const ttList = await timetableRepository.getEntries(user?.id);
      const rList = await timetableRepository.getConflictReviews(user?.id);

      setNotices(nList);
      setTimetable(ttList);
      setReviews(rList);

      // Pre-select confirmed events for export
      const initialSelected = new Set<string>();
      nList.forEach((n) => {
        n.events.forEach((e) => initialSelected.add(e.id));
      });
      setSelectedEventIds(initialSelected);
    } catch (e) {
      console.error('Failed to load calendar data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  // Real clash detection
  const { conflicts } = useMemo(() => {
    return detectClashes(notices, timetable, reviews);
  }, [notices, timetable, reviews]);

  // Build calendar items
  const calendarItems: CalendarItem[] = useMemo(() => {
    const items: CalendarItem[] = [];

    // 1. Notice Events
    notices.forEach((n) => {
      n.events.forEach((evt) => {
        if (!evt.date || evt.date === 'TBD') return;

        const clash = conflicts.find((c) => c.noticeEventId === evt.id);
        items.push({
          id: `evt_${evt.id}`,
          type: 'notice_event',
          title: evt.title,
          date: evt.date,
          startTime: evt.startTime,
          endTime: evt.endTime,
          venue: evt.venue,
          hasConflict: Boolean(clash && clash.status !== 'dismissed'),
          conflictDetails: clash,
          noticeId: n.id,
          color: n.noticeType === 'exam' ? '#b45309' : '#0369a1',
          status: n.status,
          originalEvent: evt,
        });
      });

      // 2. Deadlines
      n.checklist.forEach((chk) => {
        if (!chk.deadline || !/^\d{4}-\d{2}-\d{2}/.test(chk.deadline)) return;
        const cleanDate = chk.deadline.substring(0, 10);
        items.push({
          id: `dl_${chk.id}`,
          type: 'deadline',
          title: `Due: ${chk.task}`,
          date: cleanDate,
          venue: chk.submissionLinkOrPlace,
          hasConflict: false,
          noticeId: n.id,
          color: '#be123c',
          status: chk.completed ? 'completed' : 'pending',
          originalAction: chk,
        });
      });
    });

    // 3. Timetable classes expanded for the visible 60 days
    const baseTime = currentDate.getTime();
    for (let offset = -30; offset <= 30; offset++) {
      const d = new Date(baseTime + offset * 86400000);
      const isoDate = d.toISOString().split('T')[0];
      const weekday = getWeekdayFromDate(isoDate);

      if (weekday) {
        const classes = timetable.filter((c) => c.weekday === weekday);
        classes.forEach((cls) => {
          if (cls.semesterStartDate && cls.semesterStartDate > isoDate) return;
          if (cls.semesterEndDate && cls.semesterEndDate < isoDate) return;

          const clash = conflicts.find((c) => c.timetableEntryId === cls.id && c.conflictDate === isoDate);

          items.push({
            id: `cls_${cls.id}_${isoDate}`,
            type: 'class',
            title: cls.subjectTitle,
            date: isoDate,
            startTime: cls.startTime,
            endTime: cls.endTime,
            venue: cls.venue,
            hasConflict: Boolean(clash && clash.status !== 'dismissed'),
            conflictDetails: clash,
            color: cls.color || '#4f46e5',
            originalClass: cls,
          });
        });
      }
    }

    return items;
  }, [notices, timetable, conflicts, currentDate]);

  // Filter items
  const filteredItems = useMemo(() => {
    return calendarItems.filter((item) => {
      if (filterType === 'all') return true;
      if (filterType === 'conflicts_only') return item.hasConflict;
      if (filterType === 'exams') return item.type === 'notice_event';
      if (filterType === 'deadlines') return item.type === 'deadline';
      return true;
    });
  }, [calendarItems, filterType]);

  // Month navigation
  const prevMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() - 1);
    setCurrentDate(next);
  };

  const nextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const setToday = () => {
    setCurrentDate(new Date('2026-11-15T00:00:00Z'));
  };

  // Month Grid Days computation
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(Date.UTC(year, month, 1));
    const lastDayOfMonth = new Date(Date.UTC(year, month + 1, 0));

    // Pad beginning to Monday
    let startDayOfWeek = firstDayOfMonth.getUTCDay();
    if (startDayOfWeek === 0) startDayOfWeek = 7; // Sunday

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Previous month padding
    for (let i = startDayOfWeek - 1; i > 0; i--) {
      const d = new Date(Date.UTC(year, month, 1 - i));
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayNum: d.getUTCDate(),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getUTCDate(); i++) {
      const d = new Date(Date.UTC(year, month, i));
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayNum: i,
        isCurrentMonth: true,
      });
    }

    // Next month padding to complete 35 or 42 cells
    while (days.length % 7 !== 0) {
      const nextDate = new Date(Date.UTC(year, month + 1, days.length - lastDayOfMonth.getUTCDate() - (startDayOfWeek - 2)));
      days.push({
        dateStr: nextDate.toISOString().split('T')[0],
        dayNum: nextDate.getUTCDate(),
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentDate]);

  // Conflict review handler
  const handleReviewStatus = async (status: 'dismissed' | 'resolved') => {
    if (!activeConflict) return;
    const review: ConflictReview = {
      id: `rev_${activeConflict.noticeEventId}_${activeConflict.timetableEntryId}`,
      userId: user?.id || 'user_demo_student_01',
      eventId: activeConflict.noticeEventId,
      timetableEntryId: activeConflict.timetableEntryId,
      status,
      updatedAt: new Date().toISOString(),
    };

    await timetableRepository.setConflictReview(review);
    setActiveConflict(null);
    loadAll();
  };

  // .ICS Export Handler
  const handleExportIcs = () => {
    const exportList: {
      event: NoticeEvent;
      noticeTitle: string;
      institution?: string;
    }[] = [];

    notices.forEach((n) => {
      n.events.forEach((e) => {
        if (selectedEventIds.has(e.id)) {
          exportList.push({
            event: e,
            noticeTitle: n.noticeTitle,
            institution: n.institution,
          });
        }
      });
    });

    if (exportList.length === 0) {
      alert('Please select at least one confirmed event to export.');
      return;
    }

    const icsString = generateIcsCalendar(exportList);
    downloadIcsFile(icsString, 'notice_decoder_verified_schedule.ics');
    setIsExportModalOpen(false);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Academic Schedule</span>
            <span aria-hidden="true">·</span>
            <span>Integrated Calendar</span>
            <span aria-hidden="true">·</span>
            <span>Clash Synchronized</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Academic Schedule & Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Unified view of regular weekly classes, confirmed circular events, and upcoming submission deadlines with real-time clash highlighting.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-300" />
            <span>Export Valid .ICS</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={prevMonth}
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={setToday}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-x border-slate-200"
            >
              Nov 2026 Focus
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-slate-100 text-slate-600 transition-colors"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <span className="text-base font-bold text-slate-900">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </span>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'all' ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Items
          </button>
          <button
            onClick={() => setFilterType('conflicts_only')}
            className={`px-2.5 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1 ${
              filterType === 'conflicts_only' ? 'bg-amber-600 text-white font-semibold' : 'bg-amber-50 text-amber-900 border border-amber-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Clashes ({conflicts.filter((c) => c.status !== 'dismissed').length})</span>
          </button>
          <button
            onClick={() => setFilterType('exams')}
            className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'exams' ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Notice Events
          </button>
          <button
            onClick={() => setFilterType('deadlines')}
            className={`px-2.5 py-1.5 rounded-md font-medium transition-colors ${
              filterType === 'deadlines' ? 'bg-slate-900 text-white font-semibold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Deadlines
          </button>
        </div>
      </div>

      {/* Month Calendar Grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {/* Days of week header */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2 text-xs font-semibold text-slate-600">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div className="text-slate-400">Sat</div>
          <div className="text-slate-400">Sun</div>
        </div>

        {/* Days cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
          {monthDays.map((day, idx) => {
            const dayItems = filteredItems.filter((i) => i.date === day.dateStr);

            return (
              <div
                key={idx}
                className={`min-h-[110px] p-1.5 flex flex-col justify-between transition-colors ${
                  day.isCurrentMonth ? 'bg-white' : 'bg-slate-50/50 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold px-1 rounded ${
                      day.dateStr === '2026-11-17'
                        ? 'bg-sky-700 text-white font-bold'
                        : 'text-slate-700'
                    }`}
                  >
                    {day.dayNum}
                  </span>
                  {dayItems.some((i) => i.hasConflict) && (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  )}
                </div>

                <div className="space-y-1 my-1 overflow-y-auto max-h-24">
                  {dayItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (item.hasConflict && item.conflictDetails) {
                          setActiveConflict(item.conflictDetails);
                        } else if (item.noticeId) {
                          navigate(`/notices/${item.noticeId}`);
                        }
                      }}
                      title={`${item.title} (${item.startTime || 'All day'})`}
                      className={`px-1.5 py-0.5 rounded text-[10px] truncate font-medium cursor-pointer transition-all ${
                        item.hasConflict
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                          : item.type === 'deadline'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : item.type === 'notice_event'
                          ? 'bg-sky-50 text-sky-900 border border-sky-200 font-semibold'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.startTime ? `${item.startTime.split(' ')[0]} ` : ''}
                      {item.title}
                    </div>
                  ))}
                  {dayItems.length > 3 && (
                    <span className="text-[9px] text-slate-400 font-mono block pl-1">
                      +{dayItems.length - 3} more
                    </span>
                  )}
                </div>

                <div />
              </div>
            );
          })}
        </div>
      </div>

      {/* Conflict Review Modal */}
      {activeConflict && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <span>Timetable & Notice Event Conflict</span>
              </div>
              <button
                onClick={() => setActiveConflict(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-2 text-xs text-amber-950">
              <div className="font-semibold text-sm">{activeConflict.explanation}</div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200/80 font-mono text-[11px]">
                <div>
                  <span className="text-slate-500 block">Notice Event:</span>
                  <span className="font-bold">{activeConflict.noticeEventTitle}</span>
                  <span className="block text-slate-600">{activeConflict.noticeTimeRange}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Conflicting Class:</span>
                  <span className="font-bold">{activeConflict.classTitle}</span>
                  <span className="block text-slate-600">{activeConflict.classTimeRange}</span>
                </div>
              </div>
            </div>

            {activeConflict.evidenceSnippet && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded text-xs text-slate-600 space-y-1">
                <span className="font-semibold text-slate-700 block text-[11px]">Verbatim Notice Proof:</span>
                <p className="font-mono text-[11px]">&ldquo;{activeConflict.evidenceSnippet}&rdquo;</p>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between gap-3 text-xs">
              <button
                onClick={() => handleReviewStatus('dismissed')}
                className="px-3 py-2 text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
              >
                Dismiss False Positive
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigate(`/notices/${activeConflict.noticeId}`);
                  }}
                  className="px-3 py-2 text-sky-800 bg-sky-50 hover:bg-sky-100 rounded-lg font-semibold"
                >
                  Edit Notice Details
                </button>
                <button
                  onClick={() => handleReviewStatus('resolved')}
                  className="px-4 py-2 text-white bg-slate-900 hover:bg-slate-800 rounded-lg font-semibold shadow-xs"
                >
                  Mark as Reviewed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RFC 5545 .ICS Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Download className="w-5 h-5 text-sky-700" />
                <span>Export RFC-5545 iCalendar (.ics)</span>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Select verified circular events to export into Apple Calendar, Google Calendar, or Microsoft Outlook. The generated <code>.ics</code> file includes verified UIDs, fold limits, and proper timezone definitions.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {notices.flatMap((n) =>
                n.events.map((e) => {
                  const isChecked = selectedEventIds.has(e.id);
                  return (
                    <div
                      key={e.id}
                      onClick={() => {
                        const updated = new Set(selectedEventIds);
                        if (isChecked) updated.delete(e.id);
                        else updated.add(e.id);
                        setSelectedEventIds(updated);
                      }}
                      className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 flex items-start gap-3 cursor-pointer text-xs"
                    >
                      <button className="mt-0.5 text-sky-700 focus:outline-hidden">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-sky-700" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <div className="space-y-0.5 flex-1">
                        <span className="font-semibold text-slate-900 block">{e.title}</span>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {formatDisplayDate(e.date)} {e.startTime ? `· ${e.startTime}` : ''} {e.venue ? `· ${e.venue}` : ''}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-500">
                {selectedEventIds.size} events selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-3 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExportIcs}
                  className="px-4 py-2 text-white bg-slate-900 hover:bg-slate-800 rounded-lg font-semibold flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-sky-300" />
                  <span>Download .ICS File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
