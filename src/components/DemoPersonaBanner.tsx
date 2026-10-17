import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';
import { UserCheck, Shield, ArrowRightLeft, Sparkles, Building2, GraduationCap } from 'lucide-react';

export const DemoPersonaBanner: React.FC = () => {
  const { user, isCoordinator, switchPersona } = useAuth();
  const { navigate, path } = useRouter();

  const handleTogglePersona = async () => {
    if (isCoordinator) {
      await switchPersona('student');
      navigate('/dashboard');
    } else {
      await switchPersona('coordinator');
      navigate('/coordinator');
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 text-xs py-1.5 px-4 border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center gap-1 font-semibold text-sky-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Evaluation Persona:</span>
          </span>

          <div className="flex items-center gap-2 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
            {isCoordinator ? (
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
            )}
            <span className="font-medium text-slate-200">
              {user?.displayName || (isCoordinator ? 'Dr. Eleanor Vance' : 'Alex Rivera')}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded-xs text-[10px] font-bold ${
                isCoordinator
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
              }`}
            >
              {isCoordinator ? 'COORDINATOR' : 'STUDENT'}
            </span>
          </div>

          <span className="text-[11px] text-slate-400 hidden md:inline">
            {isCoordinator
              ? 'Authorized to publish circulars, target cohorts, issue revisions & inspect metrics'
              : 'Enrolled in CS Batch 2026; subject to timetable clash detection & acknowledgements'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePersona}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-medium text-[11px] transition-colors shadow-xs active:scale-95"
            title="Switch between Student and Coordinator experience"
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>Switch to {isCoordinator ? 'Student' : 'Coordinator'} View</span>
          </button>
        </div>
      </div>
    </div>
  );
};
