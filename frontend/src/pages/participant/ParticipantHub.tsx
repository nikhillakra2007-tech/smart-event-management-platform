import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useEvent } from '../../context/EventContext';
import { useUserRole } from '../../context/UserRoleContext';
import { useLivePolling } from '../../hooks/useLivePolling';
import { api } from '../../api/client';
import { Registration, Team, Announcement } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import {
  QrCode,
  Compass,
  Users2,
  FolderGit2,
  Megaphone,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
} from 'lucide-react';

export const ParticipantHub: React.FC = () => {
  const { currentEvent } = useEvent();
  const { currentUser, currentProfile } = useUserRole();

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentEvent || !currentUser) return;
    try {
      const [regs, teamsData, annData, checkinsData] = await Promise.all([
        api.getEventRegistrations(currentEvent.id),
        api.getEventTeams(currentEvent.id),
        api.getAnnouncements(currentEvent.id, false), // published only
        api.getEventCheckins(currentEvent.id),
      ]);

      const myReg = regs.find((r) => r.user_id === currentUser.id);
      setRegistration(myReg || null);

      const myCheckin = checkinsData.find((c) => c.user_id === currentUser.id);
      setIsCheckedIn(myCheckin?.checked_in ?? false);

      // Find user's team if in any
      // Teams endpoint returns teams with member counts; let's see if we can find team
      setAnnouncements(annData);
    } catch (err) {
      console.error('Failed to load participant hub data', err);
    } finally {
      setLoading(false);
    }
  }, [currentEvent, currentUser]);

  useLivePolling(fetchData, 6000, Boolean(currentEvent && currentUser));

  if (loading && !registration) {
    return (
      <div className="space-y-6 animate-fade-in">
        <CardSkeleton rows={3} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <Card className="p-6 bg-gradient-to-r from-indigo-950/60 via-surface to-cyan-950/40 border-indigo-500/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
                PARTICIPANT DASHBOARD
              </span>
              <Badge variant={isCheckedIn ? 'success' : 'warning'} size="sm" dot>
                {isCheckedIn ? 'Checked In Active' : 'Awaiting Check-in'}
              </Badge>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Welcome, {currentUser?.name}!
            </h1>
            <p className="text-xs text-slate-300">
              {currentEvent?.name} • Venue: {currentEvent?.venue}
            </p>
          </div>

          <Link
            to="/participant/badge"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-glow-indigo transition-all shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>Show Digital QR Pass</span>
          </Link>
        </div>
      </Card>

      {/* Action Items Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Step 1: Registration */}
        <Card className="p-4 space-y-2 border-emerald-500/30 bg-surface">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Step 1 • Register</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-sm font-bold text-white">Event Pass Issued</p>
          <p className="text-[11px] text-slate-400 font-mono">
            {registration?.registration_number || 'REG-HACK-0001'}
          </p>
        </Card>

        {/* Step 2: Check-in */}
        <Card className="p-4 space-y-2 border-surface-border hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Step 2 • Check-in</span>
            {isCheckedIn ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Clock className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <p className="text-sm font-bold text-white">
            {isCheckedIn ? 'Admitted to Venue' : 'Verify QR Token'}
          </p>
          <Link
            to="/participant/checkin"
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1"
          >
            <span>{isCheckedIn ? 'View check-in' : 'Check-in simulator →'}</span>
          </Link>
        </Card>

        {/* Step 3: Match Teammates */}
        <Card className="p-4 space-y-2 border-surface-border hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Step 3 • Teammates</span>
            <Compass className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-sm font-bold text-white">Rule Matcher</p>
          <Link
            to="/participant/discovery"
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1"
          >
            <span>Find matching peers →</span>
          </Link>
        </Card>

        {/* Step 4: Submission */}
        <Card className="p-4 space-y-2 border-surface-border hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Step 4 • Project</span>
            <FolderGit2 className="w-4 h-4 text-violet-400" />
          </div>
          <p className="text-sm font-bold text-white">Submit Deliverables</p>
          <Link
            to="/participant/submission"
            className="text-[11px] text-violet-400 hover:text-violet-300 font-semibold inline-flex items-center gap-1"
          >
            <span>Submit project →</span>
          </Link>
        </Card>
      </div>

      {/* Two Column Grid: My Profile & Recent Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Participant Profile & Skills Card */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              My Profile & Match Criteria
            </h3>
            <Badge variant="cyan" size="sm">
              Participant
            </Badge>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">Skills:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentProfile?.skills?.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-surface-lighter text-xs font-mono text-indigo-300 border border-indigo-900/40"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">Preferred Roles:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentProfile?.preferred_roles?.map((roleName, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-surface-lighter text-xs font-mono text-cyan-300 border border-cyan-900/40"
                  >
                    {roleName}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">Project Interests:</span>
              <div className="flex flex-wrap gap-1.5">
                {currentProfile?.project_interests?.map((interest, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-surface-lighter text-xs font-mono text-emerald-300 border border-emerald-900/40"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>

            {currentProfile?.bio && (
              <div className="pt-2 border-t border-surface-border">
                <span className="text-[11px] text-slate-400 font-semibold block mb-1">Bio:</span>
                <p className="text-xs text-slate-300 italic">{currentProfile.bio}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Right: Live Broadcasts Feed */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Event Broadcasts
              </h3>
            </div>
            <Link
              to="/participant/announcements"
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300"
            >
              View all →
            </Link>
          </div>

          <div className="space-y-3">
            {announcements.slice(0, 3).map((ann) => (
              <div
                key={ann.id}
                className="p-3.5 rounded-xl bg-surface-lighter/50 border border-surface-border space-y-1.5 text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate pr-2">
                    {ann.title}
                  </span>
                  <Badge
                    variant={
                      ann.type === 'critical'
                        ? 'critical'
                        : ann.type === 'venue'
                        ? 'purple'
                        : ann.type === 'schedule'
                        ? 'warning'
                        : 'cyan'
                    }
                    size="sm"
                  >
                    {ann.type}
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                  {ann.message}
                </p>
                <span className="text-[10px] font-mono text-slate-500 block pt-1">
                  {new Date(ann.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
