import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, ArrowLeft, Loader2, ShieldCheck, Info } from 'lucide-react';

export const SignupPage: React.FC = () => {
  const { navigate, params } = useRouter();
  const { signInWithGoogle, isConfigured } = useAuth();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleSignUp = async () => {
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
          Create Student Account
        </h1>
        <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
          Authenticate with your Google account to get started with Notice Decoder.
        </p>
      </div>

      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-5">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block">Authentication Error</span>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {!isConfigured && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-amber-900">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Firebase Configuration Required</span>
            </div>
            <p className="text-amber-800/90 leading-relaxed text-[11px]">
              Firebase Google Authentication credentials have not been configured yet in your environment variables.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleGoogleSignUp}
            disabled={loading || !isConfigured}
            className="w-full py-3 px-4 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-3 shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-sky-700" />
                <span>Connecting with Google...</span>
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
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Authenticated via Google Identity Services</span>
        </div>
      </div>
    </div>
  );
};
