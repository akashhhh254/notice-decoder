import React from 'react';
import { useRouter } from '../context/RouterContext';
import { ShieldCheck, HardDrive, Cpu, Layers } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigate } = useRouter();

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
              <span>Phase 1 Architecture</span>
              <span aria-hidden="true">·</span>
              <span>Client-side repository</span>
              <span aria-hidden="true">·</span>
              <span>Gemini 3.8 Flash & Deterministic Parsing</span>
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
                  className="hover:text-slate-900 transition-colors"
                >
                  Product Overview
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="hover:text-slate-900 transition-colors"
                >
                  Student Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/notices/new')}
                  className="hover:text-slate-900 transition-colors"
                >
                  Intake & Upload Studio
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900 tracking-wider uppercase mb-3">
              Phase Roadmap
            </h4>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-start gap-1.5">
                <span className="font-semibold text-sky-800 shrink-0">Phase 1:</span>
                <span>Responsive intake, extraction schema, conflict audits & local storage.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-semibold text-slate-700 shrink-0">Phase 2:</span>
                <span>User accounts, PostgreSQL, clash detector & .ics export.</span>
              </div>
              <div className="flex items-start gap-1.5">
                <span className="font-semibold text-slate-700 shrink-0">Phase 3:</span>
                <span>Coordinator tools, batch acknowledgements & institutional portal.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} Notice Decoder. Built for student academic clarity.
          </p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-slate-400" />
              Browser-local development storage
            </span>
            <span aria-hidden="true">·</span>
            <span>WCAG 2.2 AA compliant</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
