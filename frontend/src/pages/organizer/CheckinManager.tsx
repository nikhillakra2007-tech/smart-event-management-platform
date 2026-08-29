import React, { useState, useEffect, useCallback } from 'react';
import { useEvent } from '../../context/EventContext';
import { useUserRole } from '../../context/UserRoleContext';
import { useLivePolling } from '../../hooks/useLivePolling';
import { api } from '../../api/client';
import { CheckInItem, CheckInVerificationResult } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  UserCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Clock,
} from 'lucide-react';
import clsx from 'clsx';

export const CheckinManager: React.FC = () => {
  const { currentEvent } = useEvent();
  const { currentUser } = useUserRole();

  const [checkins, setCheckins] = useState<CheckInItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'checked_in' | 'pending'>('all');

  // Token Verification Form State
  const [inputToken, setInputToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{
    success: boolean;
    data?: CheckInVerificationResult;
    error?: string;
  } | null>(null);

  const fetchCheckins = useCallback(async () => {
    if (!currentEvent) return;
    try {
      const data = await api.getEventCheckins(currentEvent.id);
      setCheckins(data);
    } catch (err) {
      console.error('Failed to load check-ins', err);
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  useLivePolling(fetchCheckins, 5000, Boolean(currentEvent));

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !inputToken.trim()) return;

    try {
      setVerifying(true);
      setVerifyResult(null);

      const result = await api.verifyCheckin({
        event_id: currentEvent.id,
        qr_token: inputToken.trim(),
        checked_in_by: currentUser?.id,
      });

      setVerifyResult({ success: true, data: result });
      setInputToken('');
      fetchCheckins(); // Refresh list immediately
    } catch (err: any) {
      setVerifyResult({
        success: false,
        error: err.message || 'QR Verification failed',
      });
    } finally {
      setVerifying(false);
    }
  };

  const filteredCheckins = checkins.filter((item) => {
    const matchesSearch =
      item.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.registration_number.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (statusFilter === 'checked_in') return item.checked_in;
    if (statusFilter === 'pending') return !item.checked_in;
    return true;
  });

  const checkedInCount = checkins.filter((c) => c.checked_in).length;
  const totalCount = checkins.length;
  const percentage = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-emerald-400" />
            <span>Attendance & QR Check-in Monitor</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Verify participant QR tokens on-site and track real-time attendee admissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="success" size="lg" dot>
            {checkedInCount} / {totalCount} Checked In ({percentage}%)
          </Badge>
        </div>
      </div>

      {/* Verification Action Card */}
      <Card className="p-5 sm:p-6 bg-gradient-to-br from-surface via-surface to-indigo-950/20 border-indigo-500/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">On-site Verification Station</h2>
            <p className="text-xs text-slate-400">Enter or scan participant's QR Token to record attendance</p>
          </div>
        </div>

        <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="Enter QR Token (e.g., QR-7C38FB9D...)"
              className="w-full pl-3 pr-4 py-2.5 rounded-xl bg-surface-lighter border border-surface-border font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={verifying || !inputToken.trim()}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-glow-emerald disabled:opacity-50 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            {verifying ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Verify & Admit</span>
          </button>
        </form>

        {/* Verification Result Feedback */}
        {verifyResult && (
          <div className="mt-4 animate-fade-in">
            {verifyResult.success && verifyResult.data ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/50 flex items-start gap-3 text-emerald-300 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-sm text-white">
                    Admitted: {verifyResult.data.participant_name}
                  </p>
                  <p className="text-slate-300">
                    Registration No: <span className="font-mono text-emerald-400">{verifyResult.data.registration_number}</span> • Email: {verifyResult.data.participant_email}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-mono">
                    Check-in recorded at {new Date(verifyResult.data.check_in.checked_in_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-center gap-3 text-rose-300 text-xs">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <p className="font-bold text-white">Verification Failed</p>
                  <p className="text-rose-300">{verifyResult.error}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by participant or reg #..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-surface border border-surface-border w-full sm:w-auto self-end">
          {(['all', 'checked_in', 'pending'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={clsx(
                'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors',
                statusFilter === filter
                  ? 'bg-surface-lighter text-white border border-white/10 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              {filter.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Attendee Data Grid */}
      {loading ? (
        <CardSkeleton rows={6} />
      ) : filteredCheckins.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title="No Participants Found"
          description="No participants match the search query or filter selection."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface shadow-card">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-border bg-surface-lighter/70 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Participant</th>
                <th className="py-3.5 px-4">Registration #</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Check-in Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border font-sans">
              {filteredCheckins.map((item) => (
                <tr key={item.registration_id} className="hover:bg-surface-lighter/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-100">{item.participant_name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{item.registration_id.slice(0, 8)}...</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-indigo-300">
                    {item.registration_number}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Badge variant={item.checked_in ? 'success' : 'warning'} size="sm" dot>
                      {item.checked_in ? 'Active Check-in' : 'Awaiting Admission'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                    {item.checked_in_at ? (
                      <span className="text-slate-300">
                        {new Date(item.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
