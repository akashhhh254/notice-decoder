import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, ShieldCheck, Info, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { navigate, params } = useRouter();
  const { signInWithGoogle, signInAsStudent, isConfigured } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);

    try {
      await signInWithGoogle();
      const destination = params?.redirect ? decodeURIComponent(params.redirect) : '/dashboard';
      navigate(destination);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Home</span>
      </button>

      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-sky-700 text-white flex items-center justify-center font-bold text-lg mx-auto shadow-xs font-mono">
          ND
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Sign In to Notice Decoder
        </h1>
        <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
          Sign in with your Google account to decode circulars, manage deadlines, and audit your timetable.
        </p>
      </div>

      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-5">
        {errorMessage && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block text-rose-800">Authentication Error</span>
                <p className="text-rose-700 leading-relaxed">{errorMessage}</p>
              </div>
            </div>

            {errorMessage.includes('Authorized domains') && typeof window !== 'undefined' && (
              <div className="mt-2 pt-2 border-t border-rose-200/60 space-y-2">
                <div className="text-[11px] font-medium text-rose-950">
                  Domain to add in Firebase Console:
                </div>
                <div className="flex items-center gap-2 bg-white p-1.5 px-2.5 rounded border border-rose-300">
                  <span className="font-mono text-[11px] text-slate-800 flex-1 truncate select-all">
                    {window.location.hostname}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.hostname);
                      alert('Domain copied: ' + window.location.hostname);
                    }}
                    className="text-[10px] bg-slate-900 hover:bg-slate-800 text-white font-semibold px-2 py-1 rounded cursor-pointer transition-colors shrink-0"
                  >
                    Copy Domain
                  </button>
                </div>
                <div className="text-[11px] text-rose-800 space-y-1 pt-1">
                  <p>1. Open <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</strong></p>
                  <p>2. Click <strong>Add domain</strong> and paste <code>{window.location.hostname}</code></p>
                </div>
                <a
                  href="https://console.firebase.google.com/project/gen-lang-client-0920691490/authentication/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 hover:text-sky-900 underline underline-offset-2 pt-1"
                >
                  <span>Open Firebase Auth Settings</span>
                  <ArrowRight className="w-3 h-3" />
                </a>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      signInAsStudent('Akash Thakare', 'akashthakare157@gmail.com');
                      const destination = params?.redirect ? decodeURIComponent(params.redirect) : '/dashboard';
                      navigate(destination);
                    }}
                    className="w-full py-2 px-3 text-xs font-semibold text-white bg-sky-700 hover:bg-sky-800 rounded-lg shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-200" />
                    <span>Continue as Student (Bypass & Open App)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!isConfigured && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Firebase Configuration Required</span>
            </div>
            <p className="text-amber-800/90 leading-relaxed text-[11px]">
              Firebase Google Authentication credentials have not been configured yet in your environment variables:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono text-amber-900">
              <li>VITE_FIREBASE_API_KEY</li>
              <li>VITE_FIREBASE_AUTH_DOMAIN</li>
              <li>VITE_FIREBASE_PROJECT_ID</li>
            </ul>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading || !isConfigured}
            className="w-full py-3 px-4 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-3 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-sky-700" />
                <span>Signing in with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.13C3.27 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.28c-.25-.72-.38-1.49-.38-2.28s.13-1.56.38-2.28V6.59H1.27C.46 8.2.01 10.05.01 12s.45 3.8 1.26 5.41l4.01-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.64 1.27 6.59l4.01 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="relative py-1 flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2 text-[11px] text-slate-400 uppercase tracking-wider shrink-0 font-medium">
              or instant access
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              signInAsStudent('Akash Thakare', 'akashthakare157@gmail.com');
              const destination = params?.redirect ? decodeURIComponent(params.redirect) : '/dashboard';
              navigate(destination);
            }}
            className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Continue as Student (Instant Access)</span>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Notice Decoder Academic Privacy Protected</span>
        </div>
      </div>
    </div>
  );
};
