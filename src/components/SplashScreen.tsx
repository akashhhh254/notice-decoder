import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from '../context/RouterContext';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const { user } = useAuth();
  const { path, navigate } = useRouter();
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Check if reduced motion is requested
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // For returning authenticated users already on dashboard or navigating directly, fast dismiss
    const isReturningAuth = Boolean(user && path === '/dashboard');
    const delay = prefersReducedMotion ? 400 : isReturningAuth ? 600 : 1800;

    const timer = setTimeout(() => {
      setFadingOut(true);
      setTimeout(() => {
        onComplete();
        // If authenticated user landed on root, route to dashboard seamlessly
        if (user && path === '/') {
          navigate('/dashboard');
        }
      }, 350);
    }, delay);

    return () => clearTimeout(timer);
  }, [user, path, navigate, onComplete]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Notice Decoder"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white transition-opacity duration-350 ease-out select-none ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center text-center px-6 max-w-sm">
        {/* Monogram ND Logo */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-400 via-sky-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-sky-500/20 ring-1 ring-white/20 transform transition-transform duration-700 hover:scale-105">
            <span className="font-extrabold text-3xl tracking-tighter text-white font-mono drop-shadow-sm">
              ND
            </span>
          </div>
          {/* Subtle glowing halo */}
          <div className="absolute -inset-1 rounded-2xl bg-sky-500/20 blur-lg -z-10 animate-pulse" />
        </div>

        {/* Wordmark */}
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2 flex items-center gap-2">
          <span>Notice Decoder</span>
        </h1>
        <p className="text-xs font-medium text-slate-400 max-w-xs leading-relaxed mb-6">
          Converting college circulars into clear actions, verified schedules, and calendar events.
        </p>

        {/* Subtle loading indicator */}
        <div className="w-36 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-sky-400 to-indigo-400 rounded-full animate-[progress_1.8s_ease-in-out_infinite]" />
        </div>

        {/* Fast skip action for accessibility */}
        <button
          onClick={() => {
            setFadingOut(true);
            setTimeout(onComplete, 100);
          }}
          className="mt-6 text-[11px] text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-4"
        >
          Skip to application
        </button>
      </div>
    </div>
  );
};
