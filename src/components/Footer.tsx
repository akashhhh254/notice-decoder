import React from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, HardDrive, Calendar, FileText, CheckSquare } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();
  const { user } = useAuth();

  return (
    <footer className="border-t border-slate-200 bg-[#faf9f6] text-slate-600 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-sky-700 text-white flex items-center justify-center font-bold text-xs">
                ND
              </span>
              <span className="font-bold text-slate-900 text-base">Notice Decoder</span>
            </div>
            <p className="text-sm text-slate-600 max-w-md leading-relaxed">
              Transforms ambiguous university circulars, exam notifications, and academic memos into verified schedules, concrete deadlines, and actionable student checklists.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <span>Zero-hallucination policy</span>
              <span aria-hidden="true">·</span>
              <span>Evidence-backed extraction</span>
              <span aria-hidden="true">·</span>
              <span>Timetable clash audits</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 tracking-wider uppercase mb-3">
              Application
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => navigate('/')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate(user ? '/dashboard' : '/auth/login')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Student Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/notices/new')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Upload Notice
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/timetable')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  My Timetable
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 tracking-wider uppercase mb-3">
              Student Tools
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => navigate('/calendar')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Academic Calendar & Export
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/settings')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  Privacy & Settings
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate(user ? '/dashboard' : '/auth/login')}
                  className="hover:text-slate-900 transition-colors cursor-pointer"
                >
                  {user ? 'My Account' : 'Student Sign In'}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Notice Decoder. Built for student academic clarity.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              Verified source quotations
            </span>
            <span aria-hidden="true">·</span>
            <span>Accessible & responsive design</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
