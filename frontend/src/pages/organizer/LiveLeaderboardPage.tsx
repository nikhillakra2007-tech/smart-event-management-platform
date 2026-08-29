import React, { useState, useEffect, useCallback } from 'react';
import { useEvent } from '../../context/EventContext';
import { useLivePolling } from '../../hooks/useLivePolling';
import { api } from '../../api/client';
import { LeaderboardEntry } from '../../types/api';
import { LeaderboardTable } from '../../components/leaderboard/LeaderboardTable';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { Badge } from '../../components/common/Badge';
import { Trophy, RefreshCw, Sparkles } from 'lucide-react';

export const LiveLeaderboardPage: React.FC = () => {
  const { currentEvent } = useEvent();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchLeaderboard = useCallback(async () => {
    if (!currentEvent) return;
    try {
      const data = await api.getLeaderboard(currentEvent.id);
      setLeaderboard(data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load live leaderboard', err);
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  useLivePolling(fetchLeaderboard, 5000, Boolean(currentEvent));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <span>Live Hackathon Leaderboard</span>
            </h1>
            <Badge variant="success" size="sm" dot>
              Live SQL View
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Calculated in real-time from judge rubric submissions for <span className="text-indigo-300 font-semibold">{currentEvent?.name}</span> • Refreshed at <span className="font-mono text-slate-300">{lastRefreshed.toLocaleTimeString()}</span>
          </p>
        </div>

        <button
          onClick={fetchLeaderboard}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-lighter hover:bg-surface-hover border border-surface-border text-slate-200 text-xs font-semibold transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Standings</span>
        </button>
      </div>

      {loading && leaderboard.length === 0 ? (
        <CardSkeleton rows={8} />
      ) : (
        <LeaderboardTable entries={leaderboard} showPodium={true} />
      )}
    </div>
  );
};
