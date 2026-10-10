import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  Sparkles,
  ArrowRight,
  Zap,
  CheckCircle2,
  LockKeyhole,
} from 'lucide-react';
import clsx from 'clsx';

export const Login: React.FC = () => {
  const { login, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('alex.rivera@techhive.com');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    const emailToUse = customEmail || email;
    const passToUse = customPass || password;

    try {
      await login(emailToUse, passToUse);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demo123');
    handleSubmit(undefined, demoEmail, 'demo123');
  };

  const roleConfigs = [
    { 
      role: 'organizer', 
      label: 'Organizer', 
      name: 'Alex Rivera', 
      icon: ShieldCheck, 
      color: 'text-indigo-400', 
      border: 'hover:border-indigo-500/60 hover:bg-indigo-950/30', 
      email: 'alex.rivera@techhive.com' 
    },
    { 
      role: 'participant', 
      label: 'Participant', 
      name: 'Arjun Mehta', 
      icon: Users, 
      color: 'text-cyan-400', 
      border: 'hover:border-cyan-500/60 hover:bg-cyan-950/30', 
      email: 'arjun.mehta@dev.io' 
    },
    { 
      role: 'judge', 
      label: 'Judge', 
      name: 'Dr. Priya Sharma', 
      icon: Award, 
      color: 'text-amber-400', 
      border: 'hover:border-amber-500/60 hover:bg-amber-950/30', 
      email: 'priya.sharma@judgehive.ai' 
    },
  ];

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      </div>

      <div className="relative w-full max-w-5xl rounded-3xl bg-surface/90 border border-surface-border shadow-2xl backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10">
        
        {/* Left Form Section */}
        <div className="p-6 sm:p-10 lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Logo & Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-glow-indigo font-bold text-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block">
                  Smart Event Platform
                </span>
                <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase block font-semibold">
                  Command Access Portal
                </span>
              </div>
            </div>

            {/* Tab switch */}
            <div className="flex items-center p-1 rounded-xl bg-surface-lighter/60 border border-surface-border mb-8 max-w-xs">
              <div className="flex-1 py-1.5 text-center text-xs font-bold text-white bg-indigo-600 rounded-lg shadow-sm">
                Sign In
              </div>
              <Link
                to="/register"
                className="flex-1 py-1.5 text-center text-xs font-semibold text-slate-400 hover:text-white transition-colors rounded-lg"
              >
                Create Account
              </Link>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome back
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Authenticate with your corporate credentials or choose a 1-click demo persona.
              </p>
            </div>

            {/* 1-Click Demo Persona Pills */}
            <div className="mb-6 p-3.5 rounded-2xl bg-surface-lighter/40 border border-surface-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  Instant 1-Click Demo Personas
                </span>
                <span className="text-[10px] font-mono text-slate-400">Password: demo123</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {roleConfigs.map((config) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={config.role}
                      type="button"
                      onClick={() => handleQuickLogin(config.email)}
                      className={clsx(
                        'flex flex-col text-left p-2.5 rounded-xl border border-surface-border bg-surface/60 transition-all group',
                        config.border
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={clsx('w-4 h-4', config.color)} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{config.label}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                        {config.name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 truncate">
                        {config.email.split('@')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-center gap-2.5 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Corporate / Registered Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-lighter/40 border border-surface-border text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    required
                    autoComplete="email"
                    disabled={isLoading || authLoading}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-500">Default demo: demo123</span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-surface-lighter/40 border border-surface-border text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    required
                    autoComplete="current-password"
                    disabled={isLoading || authLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || authLoading}
                className={clsx(
                  'w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-2 mt-2',
                  isLoading || authLoading
                    ? 'bg-indigo-600/50 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/25 active:scale-[0.99]'
                )}
              >
                {isLoading || authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authorizing Command Session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Station</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-4 border-t border-surface-border text-center text-[11px] text-slate-500">
            Don't have an enterprise account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2">
              Create an account here
            </Link>
          </div>
        </div>

        {/* Right Feature Showcase Column */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-indigo-950/40 via-surface to-[#0d121f] p-8 sm:p-10 flex-col justify-between border-t lg:border-t-0 lg:border-l border-surface-border">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>Unified Operations Architecture</span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight leading-snug">
              Smart Event Command & Intelligence
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Real-time synchronization for check-ins, multi-criterion judging, algorithmic matchmaking, and operational analytics.
            </p>

            <div className="mt-8 space-y-4">
              <div className="p-3.5 rounded-2xl bg-surface-lighter/40 border border-surface-border flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Sub-Second Check-Ins</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    HMAC-SHA256 encrypted digital QR passes with instant station attendance verification.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-lighter/40 border border-surface-border flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Weighted Rubric Judging</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Configurable criterion weights (Innovation, Technical, Impact) with real-time audit trails.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-lighter/40 border border-surface-border flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <LockKeyhole className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Enterprise Role Isolation</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Strict RBAC guarding Organizer, Participant, and Judge workspaces with encrypted JWT sessions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-surface-border/60">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono">Smart Event Management Platform</span>
              <span className="text-slate-500">© 2026 Enterprise</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;