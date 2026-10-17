import React, { useState } from 'react';
import { useRouter } from '../context/RouterContext';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { navigate, params } = useRouter();
  const { signIn, isSupabase } = useAuth();

  const [email, setEmail] = useState('student@college.edu');
  const [password, setPassword] = useState('Academic2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your academic email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      await signIn(cleanEmail, password);
      // If there's a redirect query parameter or saved destination
      const destination = params?.redirect ? decodeURIComponent(params.redirect) : '/dashboard';
      navigate(destination);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Invalid email or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 rounded-lg bg-sky-700 text-white flex items-center justify-center font-bold text-sm mx-auto shadow-xs font-mono">
          ND
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Sign In to Notice Decoder
        </h1>
        <p className="text-xs text-slate-600">
          Access your verified notices, clash detection, and personal academic timetable.
        </p>
      </div>

      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-5">
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Academic Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@college.edu"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:border-transparent text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:border-transparent text-slate-900 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 text-sky-300" />
              </>
            )}
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Don&apos;t have an account?</span>
          <button
            onClick={() => navigate('/auth/signup')}
            className="font-semibold text-sky-700 hover:text-sky-900 hover:underline cursor-pointer"
          >
            Create Student Account
          </button>
        </div>
      </div>

      <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg text-[11px] text-sky-900 flex items-center gap-2">
        <UserCheck className="w-4 h-4 text-sky-700 shrink-0" />
        <span>
          <strong>Fast Demo Evaluation:</strong> Pre-filled with demo credentials <code>student@college.edu</code> / <code>Academic2026!</code>
        </span>
      </div>
    </div>
  );
};
