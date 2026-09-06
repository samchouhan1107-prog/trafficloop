import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Flame, Lock, Mail, User, AlertCircle, ArrowRight, Gift, ShieldCheck, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';

interface RegisterPageProps {
  onNavigate: (path: string) => void;
}

export function RegisterPage({ onNavigate }: RegisterPageProps) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userPin, setUserPin] = useState('');
  const [challengePin, setChallengePin] = useState<string>('');
  const [pinToken, setPinToken] = useState<string>('');
  const [isPinLoading, setIsPinLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchSecurityPin = async () => {
    try {
      setIsPinLoading(true);
      const res = await api.getSignupPin();
      setChallengePin(res.pin);
      setPinToken(res.pinToken);
      setUserPin('');
    } catch {
      // Fallback local visual token if network hiccup
      const localPin = Math.floor(100000 + Math.random() * 900000).toString();
      setChallengePin(localPin);
    } finally {
      setIsPinLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityPin();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!userPin || userPin.trim().length !== 6) {
      setError('Please enter the exact 6-digit Human Verification PIN shown.');
      return;
    }

    try {
      setIsLoading(true);
      await register(email.trim(), password, name.trim(), userPin.trim(), pinToken);
      onNavigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
      // Refresh PIN on failure to prevent replay
      fetchSecurityPin();
    } finally {
      setIsLoading(false);
    }
  };

  const isPinMatched = userPin.trim().length === 6 && userPin.trim() === challengePin;

  return (
    <div className="flex min-h-[calc(100vh-14rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        {/* Brand header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/60 shadow-lg shadow-cyan-950">
            <Flame className="h-6 w-6 text-cyan-400" />
          </div>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-white">Create Your Account</h2>
          <p className="mt-1 text-xs text-slate-400">Join the WebZoneBW TrafficLoop network</p>
        </div>

        {/* Welcome Bonus Notice */}
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 text-xs text-amber-300 flex items-center gap-2.5 shadow-sm">
          <Gift className="h-5 w-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold">Instant +15.0 Starter Credits:</span>
            <p className="text-[11px] text-amber-200/80">Claim guaranteed visitor credits immediately upon account activation.</p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 backdrop-blur shadow-2xl space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-950/80 p-3 text-xs text-rose-300 border border-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-tight">{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Email Address</label>
                <span className="text-[10px] text-slate-400 font-medium">Permanent email required</span>
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com or name@gmail.com"
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
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3.5 py-2 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Anti-Spam Security Verification PIN Box */}
            <div className="rounded-xl border border-cyan-800/60 bg-gradient-to-br from-slate-950 via-cyan-950/30 to-slate-950 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                  <ShieldCheck className="h-4 w-4 text-cyan-400" />
                  <span>Human Verification PIN</span>
                </div>
                <button
                  type="button"
                  onClick={fetchSecurityPin}
                  disabled={isPinLoading}
                  className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
                  title="Generate new PIN"
                >
                  <RefreshCw className={`h-3 w-3 ${isPinLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh PIN</span>
                </button>
              </div>

              {/* PIN Display & Input */}
              <div className="grid grid-cols-2 gap-3 items-center">
                {/* Visual Security Code */}
                <div className="flex items-center justify-center rounded-lg border border-cyan-500/50 bg-slate-900/90 py-2.5 px-3 select-none tracking-[0.35em] font-mono text-lg font-black text-cyan-300 shadow-inner">
                  {isPinLoading ? (
                    <span className="text-xs tracking-normal text-slate-500">Loading...</span>
                  ) : (
                    <span>{challengePin}</span>
                  )}
                </div>

                {/* PIN Input Field */}
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    pattern="[0-9]{6}"
                    placeholder="Enter 6-digit PIN"
                    value={userPin}
                    onChange={(e) => setUserPin(e.target.value.replace(/\D/g, ''))}
                    className={`w-full rounded-lg border bg-slate-950 px-3 py-2 text-center font-mono text-sm tracking-widest text-white focus:outline-none transition-colors ${
                      isPinMatched
                        ? 'border-emerald-500 ring-1 ring-emerald-500/50'
                        : userPin.length === 6
                        ? 'border-rose-500 ring-1 ring-rose-500/50'
                        : 'border-slate-700 focus:border-cyan-500'
                    }`}
                  />
                  {isPinMatched && (
                    <CheckCircle2 className="absolute right-2.5 top-2.5 h-4 w-4 text-emerald-400 pointer-events-none" />
                  )}
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                🛡️ Enter the 6-digit verification security PIN above to verify you are a real member and prevent automated bot spam.
              </p>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={isLoading || !isPinMatched}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-cyan-950/60 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? 'Creating Account...' : 'Complete Registration'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-4 border-t border-slate-800 pt-3 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('/login')}
              className="font-semibold text-cyan-400 hover:underline"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

