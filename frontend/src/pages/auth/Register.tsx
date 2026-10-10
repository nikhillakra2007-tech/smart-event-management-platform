import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Users,
  Award,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Check,
} from 'lucide-react';
import clsx from 'clsx';

export const Register: React.FC = () => {
  const { register, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'participant' | 'judge' | 'organizer'>('participant');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['React', 'TypeScript']);

  const skillsOptions = ['React', 'TypeScript', 'Python', 'FastAPI', 'AI/ML', 'Cloud & DevOps', 'UI/UX Design', 'PostgreSQL'];

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await register({
        name,
        email,
        password,
        role,
      });
      // Redirect based on selected role
      if (role === 'organizer') navigate('/organizer');
      else if (role === 'judge') navigate('/judge');
      else navigate('/participant');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative w-full max-w-5xl rounded-3xl bg-surface/90 border border-surface-border shadow-2xl backdrop-blur-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10">
        
        {/* Left Form Column */}
        <div className="p-6 sm:p-10 lg:col-span-7 flex flex-col justify-between">
          <div>
            {/* Header / Brand */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-glow-indigo font-bold text-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block">
                  Smart Event Platform
                </span>
                <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase block font-semibold">
                  Enterprise Onboarding
                </span>
              </div>
            </div>

            {/* Tab switch */}
            <div className="flex items-center p-1 rounded-xl bg-surface-lighter/60 border border-surface-border mb-8 max-w-xs">
              <Link
                to="/login"
                className="flex-1 py-1.5 text-center text-xs font-semibold text-slate-400 hover:text-white transition-colors rounded-lg"
              >
                Sign In
              </Link>
              <div className="flex-1 py-1.5 text-center text-xs font-bold text-white bg-indigo-600 rounded-lg shadow-sm">
                Create Account
              </div>
            </div>

            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Get started today
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Join thousands of builders, organizers, and judges worldwide.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-center gap-2.5 text-xs animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-lighter/40 border border-surface-border text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Corporate / Personal Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@company.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-lighter/40 border border-surface-border text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-surface-lighter/40 border border-surface-border text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
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

              {/* Role Selector Cards */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Your Platform Role
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRole('participant')}
                    className={clsx(
                      'p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between',
                      role === 'participant'
                        ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-sm ring-1 ring-cyan-500/50'
                        : 'bg-surface-lighter/30 border-surface-border text-slate-400 hover:border-slate-600'
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Users className={clsx('w-4 h-4', role === 'participant' ? 'text-cyan-400' : 'text-slate-500')} />
                      {role === 'participant' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                    </div>
                    <span className="text-xs font-bold block text-slate-200">Participant</span>
                    <span className="text-[10px] text-slate-500">Build & submit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('judge')}
                    className={clsx(
                      'p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between',
                      role === 'judge'
                        ? 'bg-amber-950/40 border-amber-500 text-white shadow-sm ring-1 ring-amber-500/50'
                        : 'bg-surface-lighter/30 border-surface-border text-slate-400 hover:border-slate-600'
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Award className={clsx('w-4 h-4', role === 'judge' ? 'text-amber-400' : 'text-slate-500')} />
                      {role === 'judge' && <Check className="w-3.5 h-3.5 text-amber-400" />}
                    </div>
                    <span className="text-xs font-bold block text-slate-200">Judge</span>
                    <span className="text-[10px] text-slate-500">Score rubrics</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('organizer')}
                    className={clsx(
                      'p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between',
                      role === 'organizer'
                        ? 'bg-indigo-950/40 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500/50'
                        : 'bg-surface-lighter/30 border-surface-border text-slate-400 hover:border-slate-600'
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <ShieldCheck className={clsx('w-4 h-4', role === 'organizer' ? 'text-indigo-400' : 'text-slate-500')} />
                      {role === 'organizer' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <span className="text-xs font-bold block text-slate-200">Organizer</span>
                    <span className="text-[10px] text-slate-500">Command operations</span>
                  </button>
                </div>
              </div>

              {/* Skills tags for participant */}
              {role === 'participant' && (
                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                    Your Core Technical Skills
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {skillsOptions.map((skill) => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={clsx(
                          'px-2 py-1 rounded-lg text-[11px] font-medium transition-colors',
                          selectedSkills.includes(skill)
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-surface-lighter/40 text-slate-400 border border-surface-border hover:text-slate-200'
                        )}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || authLoading}
                className={clsx(
                  'w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-150 flex items-center justify-center gap-2 mt-4',
                  isLoading || authLoading
                    ? 'bg-indigo-600/50 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 text-white hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/25 active:scale-[0.99]'
                )}
              >
                {isLoading || authLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Enterprise Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-surface-border text-center text-[11px] text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2">
              Sign In here
            </Link>
          </div>
        </div>

        {/* Right Info Showcase Column */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-indigo-950/40 via-surface to-[#0d121f] p-8 sm:p-10 flex-col justify-between border-t lg:border-t-0 lg:border-l border-surface-border">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[11px] font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span>Smart Event Ecosystem</span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight leading-snug">
              Architected for Enterprise Hackathons & Summits
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Consolidate operations across every stakeholder with high-concurrency event pipelines.
            </p>

            <div className="mt-8 space-y-4">
              <div className="p-3.5 rounded-2xl bg-surface-lighter/40 border border-surface-border flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Instant QR Admissions</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Cryptographic attendee passes with automated collision checks and real-time headcounts.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-lighter/40 border border-surface-border flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Algorithmic Matchmaking</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Rule-based deterministic pairing calculating score affinities across skills, roles, and focus areas.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface-lighter/40 border border-surface-border flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Real-Time Leaderboard</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    PostgreSQL view computation with dynamic weights across Innovation, Tech, and Presentation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-surface-border/60">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono">v2.4.0 Production</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                SOC2 Ready Security
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Register;
