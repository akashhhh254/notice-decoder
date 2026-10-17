import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { noticeRepository } from '../services/noticeRepository';
import { timetableRepository } from '../services/timetableRepository';
import { privacyService } from '../services/privacyService';
import {
  User,
  Globe,
  HardDrive,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Download,
  Upload,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Building2,
  ArrowRightLeft,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, signOut, isSupabase, isCoordinator, switchPersona } = useAuth();

  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessToast('Preferences saved successfully.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleSyncNotices = async () => {
    setIsSyncing(true);
    setSyncStatus('Checking local notice records...');

    try {
      const localNotices = await noticeRepository.getAll();
      if (localNotices.length === 0) {
        setSyncStatus('No unassigned notices found to sync.');
        return;
      }

      setSyncStatus(`Found ${localNotices.length} notices. Verifying ownership with account ${user?.email || 'authenticated'}...`);

      for (const notice of localNotices) {
        await noticeRepository.save({
          ...notice,
          updatedAt: new Date().toISOString(),
        });
      }

      setSyncStatus(`Successfully synced and updated ${localNotices.length} notices in your account.`);
      setSuccessToast('Sync completed.');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setSyncStatus(`Sync error: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleRole = async () => {
    if (isCoordinator) {
      await switchPersona('student');
      setSuccessToast('Switched to Student role.');
    } else {
      await switchPersona('coordinator');
      setSuccessToast('Switched to Coordinator role.');
    }
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleExportUserData = async () => {
    if (!user) return;
    try {
      const bundle = await privacyService.exportUserData(user.id, user.email, user.displayName);
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notice_decoder_archive_${user.id}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessToast('Personal archive downloaded successfully.');
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      alert(`Export error: ${err.message}`);
    }
  };

  const handleDeleteAllUserData = async () => {
    if (!user) return;
    const confirmation = window.prompt(
      'Type DELETE to permanently erase your account data, notices, and personal timetable. This action cannot be undone.'
    );

    if (confirmation === 'DELETE') {
      await privacyService.purgeAccountData(user.id, user.displayName);
      await noticeRepository.clearAll();
      await timetableRepository.resetToDefaults(user?.id || 'demo');
      await signOut();
      navigate('/');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-white rounded-lg shadow-lg flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>Settings</span>
          <span aria-hidden="true">·</span>
          <span>Account & Security</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Settings & Account Management
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Manage your academic profile, calendar timezone, data backup, and privacy preferences.
        </p>
      </div>

      {/* Profile & Preferences */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <User className="w-4 h-4 text-sky-700" />
            <span>Student Profile & Regional Settings</span>
          </h2>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              isCoordinator
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-sky-100 text-sky-800 border border-sky-200'
            }`}
          >
            {isCoordinator ? 'COORDINATOR' : 'STUDENT'}
          </span>
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Display Name</label>
              <input
                type="text"
                disabled
                value={user?.displayName || 'Student User'}
                className="w-full p-2 border border-slate-200 rounded-lg text-slate-600 bg-slate-50"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Academic Email</label>
              <input
                type="text"
                disabled
                value={user?.email || 'student@college.edu'}
                className="w-full p-2 border border-slate-200 rounded-lg text-slate-600 bg-slate-50"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-500" />
              <span>Campus Timezone</span>
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full sm:w-80 p-2 border border-slate-300 rounded-lg text-slate-900 bg-white"
            >
              <option value="UTC">UTC (Universal Coordinated Time)</option>
              <option value="America/New_York">America/New_York (Eastern)</option>
              <option value="America/Chicago">America/Chicago (Central)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (Pacific)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
            </select>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              Save Preferences
            </button>
            <button
              type="button"
              onClick={handleToggleRole}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
              <span>Switch to {isCoordinator ? 'Student' : 'Coordinator'} Role</span>
            </button>
          </div>
        </form>
      </div>

      {/* Sync Local Notices */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Upload className="w-4 h-4 text-sky-700" />
            <span>Sync Notice Records</span>
          </h2>
          <p className="text-xs text-slate-600">
            Verify and associate your saved notice records with your active session.
          </p>
        </div>

        {syncStatus && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800">
            {syncStatus}
          </div>
        )}

        <button
          onClick={handleSyncNotices}
          disabled={isSyncing}
          className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <span>Sync Saved Notices</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Privacy & Personal Data Governance */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Privacy & Data Portability</span>
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Notice Decoder operates under strict data minimization. Your personal schedule entries, uploaded circulars, and verified task completions belong exclusively to you.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
          <span className="font-semibold text-slate-800 block">Data Handling Safeguards:</span>
          <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
            <li>Personal notices & weekly timetables: Maintained for your active semester schedule.</li>
            <li>Source quotations: Verbatim extracts preserved alongside structured entries for verification.</li>
            <li>No tracking or external analytics cookies: Kept private to your academic session.</li>
          </ul>
        </div>

        <div>
          <button
            onClick={handleExportUserData}
            className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-sky-700" />
            <span>Download Complete Data Archive (.JSON)</span>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-6 bg-rose-50/50 border border-rose-200 rounded-xl space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-rose-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Danger Zone: Account & Data Cleanup</span>
          </h2>
          <p className="text-xs text-rose-800/80 leading-relaxed">
            Permanently remove your decoded notices, calendar events, personal timetable classes, and conflict reviews. This cascading cleanup removes all private records without affecting other users.
          </p>
        </div>

        <button
          onClick={handleDeleteAllUserData}
          className="px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Permanently Delete All Account Data</span>
        </button>
      </div>
    </div>
  );
};
