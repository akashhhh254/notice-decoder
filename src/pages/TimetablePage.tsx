import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { TimetableEntry, WeekdayNumber, ConflictOverlap } from '../types/phase2';
import { timetableRepository } from '../services/timetableRepository';
import { noticeRepository } from '../services/noticeRepository';
import { detectClashes, parseTimeToMinutes } from '../services/clashDetectionEngine';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  X,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

const WEEKDAYS: { num: WeekdayNumber; label: string; short: string }[] = [
  { num: 1, label: 'Monday', short: 'Mon' },
  { num: 2, label: 'Tuesday', short: 'Tue' },
  { num: 3, label: 'Wednesday', short: 'Wed' },
  { num: 4, label: 'Thursday', short: 'Thu' },
  { num: 5, label: 'Friday', short: 'Fri' },
  { num: 6, label: 'Saturday', short: 'Sat' },
  { num: 7, label: 'Sunday', short: 'Sun' },
];

const PRESET_COLORS = ['#0369a1', '#0284c7', '#4f46e5', '#0d9488', '#b45309', '#be123c'];

export const TimetablePage: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();

  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState<WeekdayNumber>(1);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');

  // Clash state
  const [clashes, setClashes] = useState<ConflictOverlap[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields
  const [subjectTitle, setSubjectTitle] = useState('');
  const [weekday, setWeekday] = useState<WeekdayNumber>(1);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:30');
  const [venue, setVenue] = useState('');
  const [semesterStart, setSemesterStart] = useState('2026-08-01');
  const [semesterEnd, setSemesterEnd] = useState('2026-12-20');
  const [color, setColor] = useState('#0369a1');

  const loadData = async () => {
    setLoading(true);
    try {
      const ttList = await timetableRepository.getEntries(user?.id);
      const notices = await noticeRepository.getAll(user?.id);
      const reviews = await timetableRepository.getConflictReviews(user?.id);

      setEntries(ttList);

      const { conflicts } = detectClashes(notices, ttList, reviews);
      setClashes(conflicts);
    } catch (e) {
      console.error('Error loading timetable:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const openAddModal = (defaultWeekday?: WeekdayNumber) => {
    setEditingEntry(null);
    setSubjectTitle('');
    setWeekday(defaultWeekday || activeDay);
    setStartTime('10:00');
    setEndTime('11:30');
    setVenue('');
    setSemesterStart('2026-08-01');
    setSemesterEnd('2026-12-20');
    setColor(PRESET_COLORS[0]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setSubjectTitle(entry.subjectTitle);
    setWeekday(entry.weekday);
    setStartTime(entry.startTime);
    setEndTime(entry.endTime);
    setVenue(entry.venue || '');
    setSemesterStart(entry.semesterStartDate || '2026-08-01');
    setSemesterEnd(entry.semesterEndDate || '2026-12-20');
    setColor(entry.color || PRESET_COLORS[0]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const startMins = parseTimeToMinutes(startTime);
    const endMins = parseTimeToMinutes(endTime);

    if (startMins === null || endMins === null) {
      setFormError('Please enter valid start and end times in HH:MM format.');
      return;
    }

    if (startMins >= endMins) {
      setFormError('Class start time must be strictly earlier than end time. Overnight intervals are not supported.');
      return;
    }

    if (!subjectTitle.trim()) {
      setFormError('Subject title is required.');
      return;
    }

    const payload: TimetableEntry = {
      id: editingEntry ? editingEntry.id : `tt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user?.id || 'user_demo_student_01',
      subjectTitle: subjectTitle.trim(),
      weekday,
      startTime,
      endTime,
      venue: venue.trim(),
      timezone: user?.timezone || 'UTC',
      semesterStartDate: semesterStart,
      semesterEndDate: semesterEnd,
      recurrenceRule: 'FREQ=WEEKLY',
      color,
      createdAt: editingEntry ? editingEntry.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await timetableRepository.saveEntry(payload);
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Delete class "${title}" from your weekly schedule?`)) {
      await timetableRepository.deleteEntry(id, user?.id);
      loadData();
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Reset timetable to standard college computer science course load?')) {
      await timetableRepository.resetToDefaults(user?.id || 'user_demo_student_01');
      loadData();
    }
  };

  // Check if a timetable entry has clashes
  const getClashesForEntry = (entryId: string) => {
    return clashes.filter((c) => c.timetableEntryId === entryId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Academic Schedule</span>
            <span aria-hidden="true">·</span>
            <span>Personal Timetable</span>
            <span aria-hidden="true">·</span>
            <span>Weekly Recurring</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Personal Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Maintain your weekly class schedule. Notice Decoder automatically cross-references your classes against incoming exam and event notices to detect schedule clashes.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Demo Classes</span>
          </button>

          <button
            onClick={() => openAddModal()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-sky-300" />
            <span>Add Class Entry</span>
          </button>
        </div>
      </div>

      {/* Clash Alert Summary Bar */}
      {clashes.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start justify-between gap-4 text-xs text-amber-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-sm block">
                {clashes.length} Schedule {clashes.length === 1 ? 'Clash' : 'Clashes'} Detected with Notice Events!
              </span>
              <p className="text-amber-800 leading-relaxed">
                One or more recurring weekly classes directly overlap with upcoming official exams or event dates. Review the highlighted cards below or inspect the Notice Resolution Hub.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/calendar')}
            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded-lg shrink-0"
          >
            Open in Calendar
          </button>
        </div>
      )}

      {/* View Switcher: Week vs Day */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium">
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'week' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Full Week Grid
          </button>
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
              viewMode === 'day' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily View
          </button>
        </div>

        {viewMode === 'day' && (
          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            {WEEKDAYS.map((day) => (
              <button
                key={day.num}
                onClick={() => setActiveDay(day.num)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  activeDay === day.num
                    ? 'bg-sky-800 text-white font-semibold'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {day.short}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Week Grid Layout */}
      {viewMode === 'week' ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {WEEKDAYS.slice(0, 5).map((day) => {
            const dayEntries = entries
              .filter((e) => e.weekday === day.num)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div
                key={day.num}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-bold text-slate-900 text-sm">{day.label}</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {dayEntries.length} {dayEntries.length === 1 ? 'class' : 'classes'}
                    </span>
                  </div>

                  {dayEntries.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      No classes scheduled
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {dayEntries.map((entry) => {
                        const entryClashes = getClashesForEntry(entry.id);
                        const hasClash = entryClashes.length > 0;

                        return (
                          <div
                            key={entry.id}
                            className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${
                              hasClash
                                ? 'bg-amber-50/90 border-amber-300 ring-1 ring-amber-400'
                                : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-semibold text-slate-900 leading-snug">
                                {entry.subjectTitle}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => openEditModal(entry)}
                                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                                  title="Edit class"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(entry.id, entry.subjectTitle)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                  title="Delete class"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 font-mono text-slate-600 text-[11px]">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{entry.startTime} - {entry.endTime}</span>
                            </div>

                            {entry.venue && (
                              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{entry.venue}</span>
                              </div>
                            )}

                            {hasClash && (
                              <div className="pt-1 border-t border-amber-200 text-[10px] text-amber-900 font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                                <span>Clash with {entryClashes[0].noticeTitle.substring(0, 24)}...</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => openAddModal(day.num)}
                  className="w-full py-1.5 text-xs font-semibold text-slate-600 hover:text-sky-800 bg-slate-50 hover:bg-sky-50 rounded-lg transition-colors flex items-center justify-center gap-1 border border-dashed border-slate-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Class</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* Daily Single Column View */
        <div className="max-w-xl mx-auto space-y-4">
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {WEEKDAYS.find((d) => d.num === activeDay)?.label} Classes
              </h2>
              <button
                onClick={() => openAddModal(activeDay)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Class
              </button>
            </div>

            {entries.filter((e) => e.weekday === activeDay).length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No classes registered for this weekday.
              </p>
            ) : (
              <div className="space-y-3">
                {entries
                  .filter((e) => e.weekday === activeDay)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((entry) => {
                    const entryClashes = getClashesForEntry(entry.id);
                    return (
                      <div
                        key={entry.id}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <span className="font-semibold text-sm text-slate-900 block">
                            {entry.subjectTitle}
                          </span>
                          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                            <span>{entry.startTime} - {entry.endTime}</span>
                            {entry.venue && <span>· {entry.venue}</span>}
                          </div>
                          {entryClashes.length > 0 && (
                            <div className="text-xs text-amber-800 font-semibold flex items-center gap-1 pt-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                              <span>Overlaps with official notice event on {entryClashes[0].conflictDate}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(entry)}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id, entry.subjectTitle)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Class Modal (Create / Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-700" />
                <span>{editingEntry ? 'Edit Class Entry' : 'Add Weekly Class'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Course / Subject Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS401 Distributed Systems Lecture"
                  value={subjectTitle}
                  onChange={(e) => setSubjectTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-sky-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Day of Week</label>
                  <select
                    value={weekday}
                    onChange={(e) => setWeekday(parseInt(e.target.value, 10) as WeekdayNumber)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
                  >
                    {WEEKDAYS.map((d) => (
                      <option key={d.num} value={d.num}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Venue / Room</label>
                  <input
                    type="text"
                    placeholder="e.g. Block B Room 204"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Start Time (24h)</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">End Time (24h)</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Semester Start</label>
                  <input
                    type="date"
                    value={semesterStart}
                    onChange={(e) => setSemesterStart(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 text-[11px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Semester End</label>
                  <input
                    type="date"
                    value={semesterEnd}
                    onChange={(e) => setSemesterEnd(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-slate-900 text-[11px]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-slate-900 hover:bg-slate-800 rounded-lg font-semibold shadow-xs"
                >
                  {editingEntry ? 'Update Class' : 'Save Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
