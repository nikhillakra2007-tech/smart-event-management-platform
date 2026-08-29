import React, { useState, useEffect, useCallback } from 'react';
import { useEvent } from '../../context/EventContext';
import { useLivePolling } from '../../hooks/useLivePolling';
import { api } from '../../api/client';
import { EventAnalytics } from '../../types/api';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Award,
  Eye,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { currentEvent } = useEvent();

  const [analytics, setAnalytics] = useState<EventAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!currentEvent) return;
    try {
      const data = await api.getEventAnalytics(currentEvent.id);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load event analytics', err);
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  useLivePolling(fetchAnalytics, 8000, Boolean(currentEvent));

  if (loading && !analytics) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton rows={8} />
      </div>
    );
  }

  const attendanceData = analytics?.attendance_over_time || [];
  const scoreData = analytics?.score_distribution || [];
  const announcementData = analytics?.announcement_stats || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-400" />
            <span>Event Operations & Deep Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Telemetry derived natively from check-ins, rubric evaluations, and attendee broadcast views.
          </p>
        </div>

        <Badge variant="cyan" size="lg">
          Live SQL Aggregations
        </Badge>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Attendance Conversion"
          value={`${analytics?.check_in_percentage ?? 0}%`}
          subtitle={`${analytics?.checked_in_count} of ${analytics?.total_registrations} participants checked in`}
          icon={<UserCheck className="w-5 h-5" />}
          accentColor="emerald"
        />

        <StatCard
          title="Judging Average"
          value={analytics?.average_score ? `${analytics.average_score.toFixed(1)} / 100` : 'Pending'}
          subtitle={`${analytics?.evaluated_submissions} of ${analytics?.submissions_count} projects evaluated`}
          icon={<Award className="w-5 h-5" />}
          accentColor="amber"
        />

        <StatCard
          title="Broadcast Engagement"
          value={analytics?.total_announcement_views ?? 0}
          subtitle="Cumulative announcement impressions"
          icon={<Eye className="w-5 h-5" />}
          accentColor="cyan"
        />
      </div>

      {/* Two Column Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Hourly Attendance Curve */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">Attendance Over Time</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Hourly Admissions</span>
          </div>

          <div className="h-64 w-full pt-2">
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData}>
                  <defs>
                    <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Admissions"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#attendanceGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                No hourly data available yet
              </div>
            )}
          </div>
        </Card>

        {/* Chart 2: Score Distribution Histogram */}
        <Card className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white tracking-tight">Score Distribution Histogram</h2>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Evaluation Ranges</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" name="Submissions" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Broadcast Views Breakdown */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">Announcement Impressions & Readership</h2>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Total Views: {analytics?.total_announcement_views}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {announcementData.map((stat, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-surface-lighter/50 border border-surface-border space-y-2"
            >
              <div className="flex items-center justify-between">
                <Badge variant={stat.type === 'critical' ? 'critical' : 'cyan'} size="sm">
                  {stat.type}
                </Badge>
                <span className="font-mono text-xs font-bold text-cyan-400">
                  {stat.view_count} views
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200 truncate">{stat.title}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
