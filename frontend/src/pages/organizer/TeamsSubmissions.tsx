import React, { useState, useEffect, useCallback } from 'react';
import { useEvent } from '../../context/EventContext';
import { useLivePolling } from '../../hooks/useLivePolling';
import { api } from '../../api/client';
import { Team, Submission } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Users2,
  FolderGit2,
  ExternalLink,
  GitBranch,
  Globe,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';


export const TeamsSubmissions: React.FC = () => {
  const { currentEvent } = useEvent();

  const [teams, setTeams] = useState<Team[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    if (!currentEvent) return;
    try {
      const [teamsData, subsData] = await Promise.all([
        api.getEventTeams(currentEvent.id),
        api.getEventSubmissions(currentEvent.id),
      ]);
      setTeams(teamsData);
      setSubmissions(subsData);
    } catch (err) {
      console.error('Failed to load teams & submissions', err);
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  useLivePolling(fetchData, 6000, Boolean(currentEvent));

  const submissionsByTeam = new Map<string, Submission>();
  submissions.forEach((s) => submissionsByTeam.set(s.team_id, s));

  const filteredTeams = teams.filter((t) => {
    const sub = submissionsByTeam.get(t.id);
    return (
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.project_interest && t.project_interest.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sub && sub.title.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users2 className="w-6 h-6 text-cyan-400" />
            <span>Teams & Project Submissions</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track hackathon team rosters, project interests, code repositories, and demo deliverables.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="cyan" size="lg">
            {teams.length} Teams Formed
          </Badge>
          <Badge variant="purple" size="lg">
            {submissions.length} Submissions
          </Badge>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter by team, track, or project..."
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface border border-surface-border text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      {/* Grid of Teams */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton rows={4} />
          <CardSkeleton rows={4} />
        </div>
      ) : filteredTeams.length === 0 ? (
        <EmptyState
          icon={Users2}
          title="No Teams Found"
          description="No teams match your search term."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeams.map((team) => {
            const submission = submissionsByTeam.get(team.id);
            return (
              <Card key={team.id} className="p-5 space-y-4 hover:border-cyan-500/40 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-white">{team.name}</h3>
                      <Badge
                        variant={team.status === 'submitted' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {team.status}
                      </Badge>
                    </div>
                    {team.project_interest && (
                      <span className="inline-block mt-1 text-[11px] font-mono font-semibold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                        {team.project_interest}
                      </span>
                    )}
                  </div>
                  <Badge variant="cyan" size="sm">
                    {team.member_count} Members
                  </Badge>
                </div>

                {/* Submission Details */}
                <div className="p-3.5 rounded-xl bg-surface-lighter/50 border border-surface-border space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <FolderGit2 className="w-4 h-4 text-indigo-400" />
                      <span>Project: {submission?.title || 'Pending Submission'}</span>
                    </span>
                    {submission && (
                      <Badge variant="purple" size="sm">
                        Submitted
                      </Badge>
                    )}
                  </div>

                  {submission?.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {submission.description}
                    </p>
                  )}

                  {submission && (
                    <div className="flex items-center gap-3 pt-1 border-t border-surface-border text-xs">
                      {submission.repository_url && (
                        <a
                          href={submission.repository_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors"
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                          <span>Repo</span>

                        </a>
                      )}
                      {submission.demo_url && (
                        <a
                          href={submission.demo_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          <span>Live Demo</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
