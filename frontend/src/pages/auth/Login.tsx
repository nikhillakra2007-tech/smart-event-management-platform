import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Loader2,
  ShieldCheck,
  Users,
  Award,
} from 'lucide-react';
import clsx from 'clsx';

export const Login: React.FC = () => {
  const { login, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const roleConfigs = [
    { role: 'organizer', label: 'Organizer', icon: ShieldCheck, color: 'text-indigo-400', bg: 'bg-indigo-950/30 border-indigo-700/50', email: 'alex.rivera@techhive.com' },
    { role: 'participant', label: 'Participant', icon: Users, color: 'text-cyan-400', bg: 'bg-cyan-950/30 border-cyan-700/50', email: 'arjun.mehta@dev.io' },
    { role: 'judge', label: 'Judge', icon: Award, color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-700/50', email: 'priya.sharma@judgehive.ai' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#090d16]">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="rounded-2xl bg-surface border border-surface-border p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white mx-auto mb-6 shadow-glow-indigo">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h1>
            <p className="text-slate-400 mt-2">Sign in to access your dashboard</p>
          </div>

          {/* Demo Credentials Hint */}
          <div className="mb-6 p-3 rounded-xl bg-surface-lighter/50 border border-surface-border">
            <p className="text-xs font-semibold text-slate-300 mb-2">Demo Credentials (Password: demo123)</p>
            <div className="space-y-1">
              {roleConfigs.map((config) => (
                <div key={config.role} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs">
                  <config.icon className={clsx('w-4 h-4', config.color)} />
                  <span className="font-mono text-slate-200">{config.email}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-950/30 border border-rose-700/50 text-rose-300 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-lighter/50 border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  required
                  autoComplete="email"
                  disabled={isLoading || authLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-surface-lighter/50 border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  required
                  autoComplete="current-password"
                  disabled={isLoading || authLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || authLoading}
              className={clsx(
                'w-full py-3.5 rounded-xl font-semibold text-sm transition-all',
                isLoading || authLoading
                  ? 'bg-indigo-600/50 text-slate-300 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/25'
              )}
            >
              {isLoading || authLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Smart Event Management Platform &copy; 2026
        </p>
      </div>
    </div>
  );
};