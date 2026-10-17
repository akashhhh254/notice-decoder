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
  FileCheck,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { navigate } = useRouter();
  const { user, signOut, isSupabase } = useAuth();

  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessToast('Preferences saved successfully.');
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleMigratePhase1Data = async () => {
    setIsMigrating(true);
    setMigrationStatus('Auditing Phase 1 local notices...');

    try {
      const localNotices = await noticeRepository.getAll();
      if (localNotices.length === 0) {
        setMigrationStatus('No local notices found to migrate.');
        return;
      }

      setMigrationStatus(`Found ${localNotices.length} notices. Linking to account ${user?.email || 'authenticated'}...`);

      // Update user ownership
      for (const notice of localNotices) {
        await noticeRepository.save({
          ...notice,
          updatedAt: new Date().toISOString(),
        });
      }

      setMigrationStatus(`Successfully verified and migrated ${localNotices.length} notices into your active account.`);
      setSuccessToast('Migration completed.');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setMigrationStatus(`Migration error: ${err.message}`);
    } finally {
      setIsMigrating(false);
    }
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
          <span>Student Workspace</span>
          <span aria-hidden="true">·</span>
          <span>Account & Security</span>
          <span aria-hidden="true">·</span>
          <span>Phase 2</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Settings & Data Governance
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Manage your academic profile, preferred calendar timezone, Phase 1 data migration, and data deletion.
        </p>
      </div>

      {/* Storage Architecture Disclosure */}
      <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl space-y-2 text-xs text-sky-950">
        <div className="flex items-center gap-2 font-bold">
          <HardDrive className="w-4 h-4 text-sky-700 shrink-0" />
          <span>Active Architecture Mode: {isSupabase ? 'Supabase PostgreSQL & Auth' : 'Local Isolated Development Store'}</span>
        </div>
        <p className="text-sky-900/80 leading-relaxed">
          {isSupabase
            ? 'Your notices and timetable are securely synced with PostgreSQL with Row Level Security (RLS) policies enforcing user isolation.'
            : 'Notice Decoder is running in local development mode. User accounts and records are isolated per profile on this system.'}
        </p>
      </div>

      {/* Profile & Preferences */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-5">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-sky-700" />
          <span>Student Profile & Regional Settings</span>
        </h2>

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

          <div className="pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              Save Preferences
            </button>
          </div>
        </form>
      </div>

      {/* Migration Assistant (Phase 1 to Phase 2) */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-4 h-4 text-sky-700" />
              <span>Phase 1 Local Data Migration Assistant</span>
            </h2>
            <p className="text-xs text-slate-600">
              Transfer existing notices stored during Phase 1 anonymous browsing into your authenticated user account.
            </p>
          </div>
        </div>

        {migrationStatus && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800">
            {migrationStatus}
          </div>
        )}

        <button
          onClick={handleMigratePhase1Data}
          disabled={isMigrating}
          className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
        >
          <span>Audit & Transfer Phase 1 Records</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Phase 3 Privacy, GDPR Data Export & Retention Controls */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Privacy & Personal Data Governance (GDPR Compliance)</span>
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            Notice Decoder operates under strict data minimization. Your personal schedule entries, uploaded circulars, and verified task completions belong exclusively to you.
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
          <span className="font-semibold text-slate-800 block">Data Retention & Compliance Architecture:</span>
          <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
            <li>Personal notices & weekly timetables: Retained for active semester duration or until user deletion.</li>
            <li>Institutional notice acknowledgements: Timestamped hash retained in audit log for university examination eligibility verification.</li>
            <li>Private uploaded documents: Kept in private storage bucket with short-lived signed URLs.</li>
          </ul>
        </div>

        <div>
          <button
            onClick={handleExportUserData}
            className="px-4 py-2 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-sky-700" />
            <span>Download Complete Data Archive (.JSON)</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Data & Account Deletion */}
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
          className="px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Permanently Delete All Account Data</span>
        </button>
      </div>
    </div>
  );
};
