import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { user, loading } = useAuth();
  const { path, navigate } = useRouter();
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Check if user prefers reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Guaranteed splash timeout: never block mobile users waiting on network
    const isReturningAuth = Boolean(user);
    const delay = prefersReducedMotion ? 200 : isReturningAuth ? 400 : 1000;

    const timer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => {
        onComplete();
        // Route returning authenticated user landing on root to dashboard
        if (user && path === '/') {
          navigate('/dashboard');
        }
      }, 250);
    }, delay);

    return () => clearTimeout(timer);
  }, [user, path, navigate, onComplete]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Notice Decoder"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white transition-opacity duration-300 ease-out select-none ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center px-6 max-w-sm">
        {/* Monogram ND Logo */}
        <div className="relative mb-5">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-sky-500/20 ring-1 ring-white/20">
            <span className="font-extrabold text-3xl tracking-tight text-white font-mono">
              ND
            </span>
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-sky-500/20 blur-md -z-10" />
        </div>

        {/* Wordmark */}
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Notice Decoder
        </h1>
        <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">
          Turn college circulars and memos into verified schedules, deadlines, and actionable checklists.
        </p>

        {/* Subtle progress indicator */}
        <div className="w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-sky-500 rounded-full animate-[progress_1.8s_ease-in-out_infinite]" />
        </div>

        {/* Accessible skip action */}
        <button
          onClick={() => {
            setFadingOut(true);
            setTimeout(() => {
              onComplete();
              if (user && path === '/') {
                navigate('/dashboard');
              }
            }, 80);
          }}
          className="mt-6 text-[11px] text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-4 cursor-pointer"
        >
          Skip to application
        </button>
      </div>
    </div>
  );
};
