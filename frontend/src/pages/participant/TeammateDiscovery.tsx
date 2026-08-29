import React, { useState, useEffect, useCallback } from 'react';
import { useEvent } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { TeamDiscoveryResult } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Compass,
  Sparkles,
  Search,
  Check,
  UserPlus,
  Info,
  Layers,
  Tag,
} from 'lucide-react';
import clsx from 'clsx';

export const TeammateDiscovery: React.FC = () => {
  const { currentEvent } = useEvent();
  const { user, currentProfile } = useAuth();

  const [matches, setMatches] = useState<TeamDiscoveryResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterestFilter, setSelectedInterestFilter] = useState<string>('all');

  const fetchMatches = useCallback(async () => {
    if (!currentEvent || !user) return;
    try {
      setLoading(true);
      const data = await api.discoverTeammates(currentEvent.id, user.id);
      setMatches(data);
    } catch (err) {
      console.error('Failed to load teammate discovery', err);
    } finally {
      setLoading(false);
    }
  }, [currentEvent, user]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Extract unique interests for filtering
  const allInterests = Array.from(
    new Set(matches.flatMap((m) => m.project_interests))
  );

  const filteredMatches = matches.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.project_interests.some((i) => i.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedInterestFilter !== 'all') {
      return m.project_interests.includes(selectedInterestFilter);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-400" />
            <span>Smart Teammate Discovery</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Rule-based matchmaking calculated from your profile skills, project interests, and role synergies.
          </p>
        </div>

        <Badge variant="cyan" size="lg">
          {matches.length} Candidates Available
        </Badge>
      </div>

      {/* Explainer Banner */}
      <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3 text-xs text-indigo-200">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white block">Deterministic Matchmaking Algorithm</span>
          <p className="text-slate-300 leading-relaxed">
            Candidates are ranked by: <span className="text-emerald-300 font-semibold">+2 pts</span> per shared skill, <span className="text-cyan-300 font-semibold">+3 pts</span> per shared project interest, and <span className="text-violet-300 font-semibold">+1 pt</span> per complementary role. Excludes candidates already in teams.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by skill, interest, or name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Interest Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto self-end">
          <span className="text-xs text-slate-400 shrink-0">Track:</span>
          <select
            value={selectedInterestFilter}
            onChange={(e) => setSelectedInterestFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Project Tracks</option>
            {allInterests.map((interest) => (
              <option key={interest} value={interest}>
                {interest}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Candidate Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton rows={5} />
          <CardSkeleton rows={5} />
        </div>
      ) : filteredMatches.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="No Teammates Match Filter"
          description="Try broadening your search term or selecting 'All Tracks'."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMatches.map((candidate) => {
            const scoreColor =
              candidate.match_score >= 80
                ? 'emerald'
                : candidate.match_score >= 50
                ? 'cyan'
                : 'amber';

            return (
              <Card
                key={candidate.user_id}
                className="p-5 space-y-4 hover:border-indigo-500/50 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top: Name & Match Score Badge */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-white">{candidate.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">{candidate.email}</p>
                    </div>

                    <div className="text-right">
                      <Badge
                        variant={
                          candidate.match_score >= 70
                            ? 'success'
                            : candidate.match_score >= 40
                            ? 'cyan'
                            : 'warning'
                        }
                        size="md"
                      >
                        {candidate.match_score.toFixed(0)}% Match
                      </Badge>
                    </div>
                  </div>

                  {/* Bio */}
                  {candidate.bio && (
                    <p className="text-xs text-slate-300 italic line-clamp-2 leading-relaxed">
                      "{candidate.bio}"
                    </p>
                  )}

                  {/* Matching Skills */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Matching Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.matching_skills.length > 0 ? (
                        candidate.matching_skills.map((skill, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 text-[11px] font-mono font-semibold"
                          >
                            ✓ {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No direct skill overlap</span>
                      )}
                    </div>
                  </div>

                  {/* Matching Interests */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Shared Project Interests
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.matching_interests.length > 0 ? (
                        candidate.matching_interests.map((interest, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 text-[11px] font-mono font-semibold"
                          >
                            ★ {interest}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Different project track</span>
                      )}
                    </div>
                  </div>

                  {/* Preferred Roles */}
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Role Synergies
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.preferred_roles.map((roleName, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-surface-lighter text-slate-300 border border-surface-border text-[11px]"
                        >
                          {roleName}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-surface-border flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Available to join teams</span>
                  <a
                    href={`mailto:${candidate.email}`}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <span>Connect via Email</span>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
