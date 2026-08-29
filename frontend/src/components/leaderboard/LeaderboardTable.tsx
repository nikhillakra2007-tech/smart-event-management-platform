import React from 'react';
import { LeaderboardEntry } from '../../types/api';
import { Badge } from '../common/Badge';
import { Trophy, Medal, ExternalLink, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  highlightTeamId?: string;
  showPodium?: boolean;
}

export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
  highlightTeamId,
  showPodium = true,
}) => {
  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold text-xs shadow-sm">
          <Trophy className="w-3.5 h-3.5 text-amber-400" /> #1 Gold
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-300/20 border border-slate-300/40 text-slate-200 font-extrabold text-xs">
          <Medal className="w-3.5 h-3.5 text-slate-300" /> #2 Silver
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-700/20 border border-amber-700/40 text-amber-500 font-extrabold text-xs">
          <Medal className="w-3.5 h-3.5 text-amber-600" /> #3 Bronze
        </span>
      );
    }
    return (
      <span className="font-mono font-bold text-slate-400 text-xs px-2">
        #{rank}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Optional Podium Summary for Top 3 */}
      {showPodium && entries.length >= 3 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 pb-4">
          {/* Rank 2 (Silver) */}
          <div className="order-2 md:order-1 p-4 rounded-xl bg-surface-lighter/50 border border-slate-400/30 flex flex-col items-center text-center relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-400/20 border border-slate-400/40 flex items-center justify-center text-slate-200 font-bold text-xs mb-2">
              2
            </div>
            <p className="font-bold text-sm text-white truncate w-full">{entries[1].team_name}</p>
            <p className="text-[11px] text-slate-400 truncate w-full">{entries[1].submission_title || 'No submission'}</p>
            <div className="mt-2 text-xl font-extrabold text-slate-200 font-mono">
              {entries[1].average_score.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Avg Score ({entries[1].evaluation_count} reviews)</span>
          </div>

          {/* Rank 1 (Gold) */}
          <div className="order-1 md:order-2 p-5 rounded-xl bg-gradient-to-b from-amber-950/40 to-surface border border-amber-500/50 flex flex-col items-center text-center relative overflow-hidden shadow-lg shadow-amber-950/20 -translate-y-1">
            <div className="absolute top-2 right-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/30 border border-amber-400 flex items-center justify-center text-amber-300 font-extrabold text-sm mb-2 shadow-glow-amber">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <p className="font-extrabold text-base text-amber-200 truncate w-full">{entries[0].team_name}</p>
            <p className="text-xs text-slate-300 truncate w-full">{entries[0].submission_title || 'Project'}</p>
            <div className="mt-2 text-2xl font-black text-amber-400 font-mono">
              {entries[0].average_score.toFixed(2)}
            </div>
            <span className="text-[10px] text-amber-300/80 font-mono font-semibold">1st Place • {entries[0].evaluation_count} reviews</span>
          </div>

          {/* Rank 3 (Bronze) */}
          <div className="order-3 md:order-3 p-4 rounded-xl bg-surface-lighter/50 border border-amber-700/30 flex flex-col items-center text-center relative overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-amber-700/20 border border-amber-700/40 flex items-center justify-center text-amber-500 font-bold text-xs mb-2">
              3
            </div>
            <p className="font-bold text-sm text-white truncate w-full">{entries[2].team_name}</p>
            <p className="text-[11px] text-slate-400 truncate w-full">{entries[2].submission_title || 'No submission'}</p>
            <div className="mt-2 text-xl font-extrabold text-amber-500 font-mono">
              {entries[2].average_score.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Avg Score ({entries[2].evaluation_count} reviews)</span>
          </div>
        </div>
      )}

      {/* Main Leaderboard Table */}
      <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-surface-border bg-surface-lighter/70 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3.5 px-4">Rank</th>
              <th className="py-3.5 px-4">Team</th>
              <th className="py-3.5 px-4 hidden sm:table-cell">Project Title</th>
              <th className="py-3.5 px-4 text-center">Evaluations</th>
              <th className="py-3.5 px-4 text-right">Average Score</th>
              <th className="py-3.5 px-4 text-right hidden md:table-cell">Total Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {entries.map((entry) => {
              const isHighlighted = highlightTeamId === entry.team_id;
              return (
                <tr
                  key={entry.team_id}
                  className={clsx(
                    'transition-colors',
                    isHighlighted
                      ? 'bg-indigo-950/40 font-semibold'
                      : 'hover:bg-surface-lighter/40'
                  )}
                >
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getRankBadge(entry.rank)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-100 whitespace-nowrap">
                    {entry.team_name}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300 hidden sm:table-cell truncate max-w-xs">
                    {entry.submission_title || <span className="text-slate-500 italic">Pending</span>}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap font-mono text-slate-400">
                    <Badge variant={entry.evaluation_count > 0 ? 'info' : 'neutral'} size="sm">
                      {entry.evaluation_count}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2 justify-end">
                      <div className="w-16 h-2 rounded-full bg-slate-800 hidden lg:block overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, entry.average_score))}%` }}
                        />
                      </div>
                      <span className="font-mono font-extrabold text-sm text-white">
                        {entry.average_score.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap font-mono text-slate-400 hidden md:table-cell">
                    {entry.aggregate_score.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
