import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Flame, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

interface LoginPageProps {
  onNavigate: (path: string) => void;
}

export function LoginPage({ onNavigate }: LoginPageProps) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsLoading(true);
      await login(email.trim(), password);
      onNavigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    try {
      setIsLoading(true);
      await login(demoEmail, demoPass);
      onNavigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/60 shadow-lg shadow-cyan-950">
            <Flame className="h-6 w-6 text-cyan-400" />
          </div>
          <h2 className="mt-4 text-2xl font-black tracking-tight text-white">Sign In to TrafficLoop</h2>
          <p className="mt-1 text-xs text-slate-400">Access your traffic exchange campaigns and credit balance</p>
        </div>

        {/* Quick Demo Credentials Panel */}
        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-cyan-300 mb-2">
            <UserCheck className="h-4 w-4" />
            <span>Fast One-Click Demo Access:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('demo@webzonebw.com', 'demo123456')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/90 py-2 font-semibold text-slate-200 hover:border-cyan-400 hover:text-white transition-all text-[11px]"
            >
              <span>Demo Surfer</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo('admin@trafficloop.webzonebw.com', 'admin123456')}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-800/80 bg-indigo-950/60 py-2 font-semibold text-indigo-300 hover:border-indigo-400 hover:text-white transition-all text-[11px]"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Admin Portal</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-rose-950/80 p-3 text-xs text-rose-300 border border-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-950/60 hover:bg-cyan-500 disabled:opacity-50 transition-all"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-5 border-t border-slate-800 pt-4 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <button
              onClick={() => onNavigate('/register')}
              className="font-semibold text-cyan-400 hover:underline"
            >
              Register here (+15 Bonus)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
