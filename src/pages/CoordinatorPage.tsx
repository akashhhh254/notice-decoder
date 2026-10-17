import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { coordinatorService } from '../services/coordinatorService';
import { acknowledgementService } from '../services/acknowledgementService';
import { auditService } from '../services/auditService';
import {
  CoordinatorNotice,
  TargetAudience,
  CoordinatorMetrics,
  AuditLogEntry,
  AcknowledgementRecord,
} from '../types/phase3';
import { NoticeEvent, ActionItem } from '../types/notice';
import {
  Building2,
  PlusCircle,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  Archive,
  Ban,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckSquare,
  AlertCircle,
  X,
  Send,
  HelpCircle,
} from 'lucide-react';

export const CoordinatorPage: React.FC = () => {
  const { user, isCoordinator, switchPersona } = useAuth();
  const { navigate } = useRouter();

  const [notices, setNotices] = useState<CoordinatorNotice[]>([]);
  const [metrics, setMetrics] = useState<CoordinatorMetrics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notices' | 'audit' | 'analytics'>('notices');

  // Modals
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [showAckModal, setShowAckModal] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<CoordinatorNotice | null>(null);
  const [noticeAcks, setNoticeAcks] = useState<AcknowledgementRecord[]>([]);

  // Publish Form State
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<any>('exam');
  const [newUrgency, setNewUrgency] = useState<any>('high');
  const [newDept, setNewDept] = useState('Computer Science & Engineering');
  const [newRef, setNewRef] = useState(`COE/2026/NOTIF-${Math.floor(100 + Math.random() * 900)}`);
  const [newSummary, setNewSummary] = useState('');
  const [audienceType, setAudienceType] = useState<'all_students' | 'department' | 'batch'>('batch');
  const [audienceBatch, setAudienceBatch] = useState('2026');
  const [audienceDept, setAudienceDept] = useState('Computer Science & Engineering');
  const [eventDate, setEventDate] = useState('2026-11-28');
  const [eventTime, setEventTime] = useState('10:00 AM to 01:00 PM');
  const [eventVenue, setEventVenue] = useState('Central Examination Hall');
  const [actionTask, setActionTask] = useState('Submit examination registration receipt');
  const [actionDeadline, setActionDeadline] = useState('2026-11-20');

  // Revision Form State
  const [revisedTitle, setRevisedTitle] = useState('');
  const [revisedVenue, setRevisedVenue] = useState('');
  const [revisionSummary, setRevisionSummary] = useState('');
  const [requestReAck, setRequestReAck] = useState(true);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const data = await coordinatorService.getAllCoordinatorNotices();
      const mets = await coordinatorService.getMetrics();
      const logs = await auditService.getLogs({ limit: 50 });
      setNotices(data);
      setMetrics(mets);
      setAuditLogs(logs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [user, isCoordinator]);

  // Access Control Guard
  if (!isCoordinator) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-4 border border-amber-200">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Coordinator Access Restricted</h1>
        <p className="text-sm text-slate-600 mb-6 max-w-lg mx-auto">
          The Coordinator Portal is restricted to verified academic administrators, department heads, and examination controllers. Your active session is currently authenticated as a student.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => switchPersona('coordinator')}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Switch to Dr. Eleanor Vance (Coordinator Persona)</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
          >
            Return to Student Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleOpenRevise = (n: CoordinatorNotice) => {
    setSelectedNotice(n);
    setRevisedTitle(n.noticeTitle);
    setRevisedVenue(n.events[0]?.venue || '');
    setRevisionSummary('');
    setRequestReAck(true);
    setShowReviseModal(true);
  };

  const handleOpenAckDetails = async (n: CoordinatorNotice) => {
    setSelectedNotice(n);
    const acks = await acknowledgementService.getAllAcknowledgementsForNotice(n.id);
    setNoticeAcks(acks);
    setShowAckModal(true);
  };

  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newSummary || !user) return;

    const targetAudience: TargetAudience = {
      type: audienceType,
      department: audienceType === 'department' ? audienceDept : undefined,
      batchYear: audienceType === 'batch' ? audienceBatch : undefined,
    };

    const events: NoticeEvent[] = eventDate
      ? [
          {
            id: `evt_${Date.now()}`,
            title: newTitle,
            date: eventDate,
            startTime: eventTime.split('to')[0]?.trim() || '10:00 AM',
            endTime: eventTime.split('to')[1]?.trim() || '01:00 PM',
            venue: eventVenue,
            isMandatory: true,
            targetAudience: audienceType === 'batch' ? `Batch ${audienceBatch}` : 'All Enrolled',
          },
        ]
      : [];

    const checklist: ActionItem[] = actionTask
      ? [
          {
            id: `chk_${Date.now()}`,
            task: actionTask,
            deadline: actionDeadline,
            requiredDocuments: [],
            completed: false,
          },
        ]
      : [];

    await coordinatorService.publishNotice({
      noticeTitle: newTitle,
      noticeType: newType,
      urgency: newUrgency,
      institution: 'State College of Engineering & Technology',
      department: newDept,
      referenceNumber: newRef,
      plainLanguageSummary: newSummary,
      events,
      checklist,
      eligibility: {
        eligibleBatches: [audienceType === 'batch' ? `Batch ${audienceBatch}` : 'All Eligible Students'],
        minimumRequirements: 'Standard academic enrollment',
        prerequisites: [],
        notes: '',
      },
      targetAudience,
      coordinator: user,
    });

    setShowPublishModal(false);
    // Reset form
    setNewTitle('');
    setNewSummary('');
    await loadAllData();
  };

  const handleReviseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotice || !revisionSummary || !user) return;

    const updatedEvents = selectedNotice.events.map((evt, idx) => {
      if (idx === 0 && revisedVenue) {
        return { ...evt, venue: revisedVenue };
      }
      return evt;
    });

    await coordinatorService.reviseNotice(
      selectedNotice.id,
      {
        noticeTitle: revisedTitle || selectedNotice.noticeTitle,
        events: updatedEvents,
      },
      revisionSummary,
      user,
      requestReAck
    );

    setShowReviseModal(false);
    await loadAllData();
  };

  const handleArchive = async (id: string) => {
    if (!user) return;
    if (window.confirm('Archive this circular? It will remain accessible for historical audit.')) {
      await coordinatorService.archiveNotice(id, user);
      await loadAllData();
    }
  };

  const handleWithdraw = async (n: CoordinatorNotice) => {
    if (!user) return;
    const reason = window.prompt(`Provide formal withdrawal reason for "${n.noticeTitle}":`, 'Superseded by revised academic council directive');
    if (reason) {
      await coordinatorService.withdrawNotice(n.id, reason, user);
      await loadAllData();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-700" />
              COORDINATOR CONSOLE
            </span>
            <span className="text-xs text-slate-500">Academic Year 2026-27</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Institutional Notices & Acknowledgements
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Publish official circulars, target authorized student cohorts, issue material revisions, and track verified acknowledgements.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowPublishModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-sky-300" />
            <span>Publish New Notice</span>
          </button>

          <button
            onClick={loadAllData}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh coordinator dashboard"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Coordinator KPI Metrics Strip */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Published Circulars</span>
              <FileText className="w-4 h-4 text-sky-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{metrics.activeNotices}</span>
              <span className="text-xs text-slate-400">active of {metrics.totalPublishedNotices}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {metrics.archivedNotices} archived · {metrics.withdrawnNotices} withdrawn
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Eligible Cohort Base</span>
              <Users className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{metrics.totalEligibleStudents}</span>
              <span className="text-xs text-slate-400">recipients</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Verified denominator across active circulars</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Overall Acknowledgement Rate</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">{metrics.overallAcknowledgementRate}%</span>
              <span className="text-xs text-emerald-600 font-medium">verified</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${metrics.overallAcknowledgementRate}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Action Pending & Revisions</span>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-700">{metrics.overdueActionsCount}</span>
              <span className="text-xs text-amber-600 font-medium">pending actions</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {metrics.noticesWithRecentRevisions} notice with material revisions
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('notices')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'notices'
              ? 'border-sky-700 text-sky-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Institutional Notices ({notices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-sky-700 text-sky-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Security & Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* Tab 1: Notices Table */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Notice Title & Reference</th>
                  <th className="py-3.5 px-4">Target Audience</th>
                  <th className="py-3.5 px-4">Status & Version</th>
                  <th className="py-3.5 px-4 min-w-[180px]">Cohort Acknowledgement</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {notices.map((n) => {
                  const stats = n.acknowledgementStats;
                  const isPublished = n.publicationStatus === 'published';
                  const isArchived = n.publicationStatus === 'archived';
                  const isWithdrawn = n.publicationStatus === 'withdrawn';
                  const isDraft = n.publicationStatus === 'draft';

                  return (
                    <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 max-w-sm">
                        <div className="font-bold text-slate-900 text-sm mb-0.5 line-clamp-1">
                          {n.noticeTitle}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>Ref: {n.referenceNumber || 'N/A'}</span>
                          <span>·</span>
                          <span>{n.department}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-medium">
                          <Users className="w-3 h-3 text-slate-500" />
                          <span>
                            {n.targetAudience.type === 'batch'
                              ? `Batch ${n.targetAudience.batchYear} (${n.targetAudience.department || 'All'})`
                              : n.targetAudience.type === 'department'
                              ? n.targetAudience.department
                              : 'All Enrolled Students'}
                          </span>
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              isPublished
                                ? 'bg-emerald-100 text-emerald-800'
                                : isArchived
                                ? 'bg-slate-100 text-slate-700'
                                : isWithdrawn
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {n.publicationStatus}
                          </span>
                          <span className="font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                            v{n.currentVersion}
                          </span>
                        </div>
                        {n.currentVersion > 1 && (
                          <span className="text-[10px] text-amber-700 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3" />
                            Material Revision
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {stats && isPublished ? (
                          <div>
                            <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
                              <span className="text-slate-700">
                                {stats.acknowledgedCount} of {stats.totalEligible} acked
                              </span>
                              <span className="font-bold text-sky-800">{stats.acknowledgementPercentage}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-sky-600 h-1.5 rounded-full transition-all"
                                style={{ width: `${stats.acknowledgementPercentage}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {stats.viewedCount} viewed · {stats.actionRequiredCount} action required
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            {isDraft ? 'Not published' : isWithdrawn ? 'Withdrawn' : 'Archived'}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenAckDetails(n)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                            title="Inspect Acknowledgements"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>

                          {isPublished && (
                            <button
                              onClick={() => handleOpenRevise(n)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sky-800 font-semibold text-[11px] transition-colors"
                            >
                              Revise
                            </button>
                          )}

                          {isPublished && (
                            <button
                              onClick={() => handleWithdraw(n)}
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors"
                              title="Withdraw Notice"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => navigate(`/notices/${n.id}`)}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                            title="View Public Notice Page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Security & Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Immutable Audit Trail</h2>
              <p className="text-xs text-slate-500">
                Tamper-resistant log recording all notice publications, material revisions, withdrawals, and student acknowledgements.
              </p>
            </div>
            <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
              RLS Write Protection Enforced
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                      {log.action}
                    </span>
                    <span className="font-medium text-slate-700">{log.userDisplayName}</span>
                    <span className="text-[10px] text-slate-400">({log.userRole})</span>
                  </div>
                  <p className="text-slate-600">{log.summary}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-slate-400 block">
                    {new Date(log.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-700" />
                <h3 className="font-bold text-slate-900 text-sm">Publish Official Circular</h3>
              </div>
              <button
                onClick={() => setShowPublishModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Circular Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule of Practical Laboratory Viva & Project Submission"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Notice Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="exam">Examination</option>
                    <option value="deadline">Deadline</option>
                    <option value="circular">Administrative Circular</option>
                    <option value="event">Symposium / Event</option>
                    <option value="scholarship">Scholarship</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Urgency</label>
                  <select
                    value={newUrgency}
                    onChange={(e) => setNewUrgency(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reference Number</label>
                  <input
                    type="text"
                    value={newRef}
                    onChange={(e) => setNewRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Target Audience Selector */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block font-semibold text-slate-800">Target Cohort / Audience Restriction</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="audType"
                      checked={audienceType === 'batch'}
                      onChange={() => setAudienceType('batch')}
                    />
                    <span>Specific Batch (Year)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="audType"
                      checked={audienceType === 'department'}
                      onChange={() => setAudienceType('department')}
                    />
                    <span>Specific Department</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="audType"
                      checked={audienceType === 'all_students'}
                      onChange={() => setAudienceType('all_students')}
                    />
                    <span>All College Students</span>
                  </label>
                </div>

                {audienceType === 'batch' && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-slate-500">Graduating Batch Year:</span>
                    <input
                      type="text"
                      value={audienceBatch}
                      onChange={(e) => setAudienceBatch(e.target.value)}
                      className="px-2.5 py-1 rounded border border-slate-300 w-24 bg-white"
                    />
                    <span className="text-[11px] text-slate-400">(e.g. 2026 for 4th year)</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plain-Language Summary for Students</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain clearly what students need to know, attend, or submit..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-sky-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Range</label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Venue</label>
                  <input
                    type="text"
                    value={eventVenue}
                    onChange={(e) => setEventVenue(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Required Action Task</label>
                  <input
                    type="text"
                    value={actionTask}
                    onChange={(e) => setActionTask(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Action Deadline</label>
                  <input
                    type="date"
                    value={actionDeadline}
                    onChange={(e) => setActionDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-sky-300" />
                  <span>Publish Circular to Cohort</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revision Modal */}
      {showReviseModal && selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50/60">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Issue Material Revision (v{selectedNotice.currentVersion} → v{selectedNotice.currentVersion + 1})
                </h3>
              </div>
              <button onClick={() => setShowReviseModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReviseSubmit} className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900">
                <p className="font-semibold mb-0.5">Material Changes & Audit Guarantee</p>
                <p className="text-[11px] leading-relaxed">
                  Modifying exam schedules, venues, or deadlines creates a new numbered version and automatically logs an audit trail entry.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Updated Notice Title</label>
                <input
                  type="text"
                  value={revisedTitle}
                  onChange={(e) => setRevisedTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Updated Venue</label>
                <input
                  type="text"
                  value={revisedVenue}
                  onChange={(e) => setRevisedVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Change Summary / Revision Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Relocated CS401 exam venue to Main Auditorium Hall B due to capacity expansion."
                  value={revisionSummary}
                  onChange={(e) => setRevisionSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={requestReAck}
                  onChange={(e) => setRequestReAck(e.target.checked)}
                  className="rounded text-sky-600"
                />
                <span>Request re-acknowledgement from all students who already acknowledged v{selectedNotice.currentVersion}</span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowReviseModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  Publish Revision v{selectedNotice.currentVersion + 1}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Acknowledgements Detail Modal */}
      {showAckModal && selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{selectedNotice.noticeTitle}</h3>
                <span className="text-[11px] text-slate-500">Verified Recipient Acknowledgement Log</span>
              </div>
              <button onClick={() => setShowAckModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Total Eligible:</span>{' '}
                <strong className="text-slate-900">{selectedNotice.acknowledgementStats?.totalEligible || 120} students</strong>
              </div>
              <div>
                <span className="text-slate-500">Acknowledged:</span>{' '}
                <strong className="text-emerald-700">
                  {selectedNotice.acknowledgementStats?.acknowledgedCount || 108} (
                  {selectedNotice.acknowledgementStats?.acknowledgementPercentage || 90}%)
                </strong>
              </div>
            </div>

            <div className="p-4 overflow-y-auto divide-y divide-slate-100 text-xs">
              {noticeAcks.map((ack) => (
                <div key={ack.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-slate-900">{ack.userDisplayName}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          ack.state === 'acknowledged'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ack.state === 'action_required'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {ack.state.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-400">Notice v{ack.noticeVersion}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{ack.userEmail}</p>
                    {ack.notes && <p className="text-[11px] text-slate-600 mt-1 italic">"{ack.notes}"</p>}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-slate-400 block">
                      {ack.acknowledgedAt
                        ? new Date(ack.acknowledgedAt).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Viewed only'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 text-center">
              Student privacy protected. Individual entries are disclosed exclusively for academic audit verification.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
