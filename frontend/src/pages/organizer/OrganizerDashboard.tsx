import React, { useState, useEffect, useCallback } from 'react';
import { useEvent } from '../../context/EventContext';
import { useLivePolling } from '../../hooks/useLivePolling';
import { api } from '../../api/client';
import { EventAnalytics, LeaderboardEntry, Announcement } from '../../types/api';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LeaderboardTable } from '../../components/leaderboard/LeaderboardTable';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Users,
  UserCheck,
  Users2,
  FolderGit2,
  Trophy,
  Megaphone,
  Award,
  ArrowUpRight,
  Sparkles,
  Radio,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const OrganizerDashboard: React.FC = () => {
  const { currentEvent } = useEvent();

  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    if (!currentEvent) return;
    try {
      const [analyticsData, leaderboardData, announcementsData] = await Promise.all([
        api.getEventAnalytics(currentEvent.id),
        api.getLeaderboard(currentEvent.id),
        api.getAnnouncements(currentEvent.id, true), // include drafts for organizer
      ]);
      setAnalytics(analyticsData);
      setLeaderboard(leaderboardData);
      setAnnouncements(announcementsData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load organizer dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  // Live polling every 6 seconds
  useLivePolling(fetchData, 6000, Boolean(currentEvent));

  if (loading && !analytics) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton rows={6} />
      </div>
    );
  }

  const judgingPercent =
    analytics && analytics.submissions_count > 0
      ? Math.round((analytics.evaluated_submissions / analytics.submissions_count) * 100)
      : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Event Command Center
            </h1>
            <Badge variant="success" size="sm" dot>
              Live
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time event overview for <span className="text-indigo-300 font-semibold">{currentEvent?.name}</span> • 
            Last updated <span className="font-mono text-slate-300">{lastUpdated.toLocaleTimeString()}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/organizer/checkins"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            <span>Check-in Station</span>
          </Link>
          <Link
            to="/organizer/announcements"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-lighter hover:bg-surface-hover border border-surface-border text-slate-200 text-xs font-semibold transition-colors"
          >
            <Megaphone className="w-4 h-4 text-cyan-400" />
            <span>Broadcast</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Registrations"
          value={analytics?.total_registrations ?? 0}
          subtitle="40 active hackathon participants"
          icon={<Users className="w-5 h-5" />}
          accentColor="indigo"
        />

        <StatCard
          title="Checked In Attendance"
          value={`${analytics?.checked_in_count ?? 0} (${analytics?.check_in_percentage ?? 0}%)`}
          subtitle={`${analytics?.not_checked_in_count ?? 0} awaiting on-site check-in`}
          icon={<UserCheck className="w-5 h-5" />}
          accentColor="emerald"
        />

        <StatCard
          title="Teams Formed"
          value={analytics?.teams_formed ?? 0}
          subtitle="Rule-matched & self-formed"
          icon={<Users2 className="w-5 h-5" />}
          accentColor="cyan"
        />

        <StatCard
          title="Submissions"
          value={analytics?.submissions_count ?? 0}
          subtitle={`${analytics?.evaluated_submissions ?? 0} evaluated by judges`}
          icon={<FolderGit2 className="w-5 h-5" />}
          accentColor="violet"
        />
      </div>

      {/* Two Column Grid: Left Leaderboard & Right Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Leaderboard Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white tracking-tight">Live Leaderboard</h2>
                  <p className="text-[11px] text-slate-400">Dynamically queried from PostgreSQL leaderboard VIEW</p>
                </div>
              </div>

              <Link
                to="/organizer/leaderboard"
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <span>View Full Standings</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <LeaderboardTable
              entries={leaderboard.slice(0, 5)}
              showPodium={false}
            />
          </Card>

          {/* Attendance Breakdown Bar */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>Attendance Fill Rate</span>
              </h3>
              <span className="font-mono text-xs font-extrabold text-emerald-400">
                {analytics?.checked_in_count} / {analytics?.total_registrations} ({analytics?.check_in_percentage}%)
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-emerald-600 to-cyan-500 transition-all duration-500 rounded-full"
                style={{ width: `${analytics?.check_in_percentage ?? 0}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Verified Active ({analytics?.checked_in_count})
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-600" />
                Unchecked ({analytics?.not_checked_in_count})
              </span>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Judging Status & Recent Broadcasts */}
        <div className="space-y-6">
          {/* Judging Matrix Progress */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Judging Progress</h3>
              </div>
              <Badge variant="purple" size="sm">
                {judgingPercent}% Complete
              </Badge>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-lighter/50 border border-surface-border space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Evaluated Submissions</span>
                <span className="font-mono font-bold text-white">
                  {analytics?.evaluated_submissions} / {analytics?.submissions_count}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${judgingPercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                <span>Average Event Score</span>
                <span className="font-mono font-bold text-amber-400">
                  {analytics?.average_score ? analytics.average_score.toFixed(2) : 'N/A'} / 100
                </span>
              </div>
            </div>

            <Link
              to="/organizer/judging"
              className="w-full py-2 px-3 rounded-lg bg-surface-lighter hover:bg-surface-hover border border-surface-border text-center text-xs font-semibold text-slate-200 block transition-colors"
            >
              Manage Judges & Assignments
            </Link>
          </Card>

          {/* Broadcasts Bulletin Card */}
          <Card className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Latest Broadcasts</h3>
              </div>
              <Link
                to="/organizer/announcements"
                className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300"
              >
                Studio →
              </Link>
            </div>

            <div className="space-y-2.5 pt-1">
              {announcements.slice(0, 3).map((ann) => (
                <div
                  key={ann.id}
                  className="p-3 rounded-xl bg-surface-lighter/50 border border-surface-border space-y-1.5 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200 truncate pr-2">
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
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {ann.message}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-mono">
                    <span>{new Date(ann.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>{ann.view_count} views</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
