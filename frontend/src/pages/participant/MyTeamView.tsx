import React, { useState, useEffect, useCallback } from 'react';
import { useEvent } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Team } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Users2,
  Plus,
  UserPlus,
  CheckCircle2,
  AlertCircle,
  FolderGit2,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';


export const MyTeamView: React.FC = () => {
  const { currentEvent } = useEvent();
  const { user } = useAuth();

  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  // Create Team Form
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamTrack, setNewTeamTrack] = useState('');
  const [creating, setCreating] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Join Team State
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    if (!currentEvent) return;
    try {
      const data = await api.getEventTeams(currentEvent.id);
      setTeams(data);
    } catch (err) {
      console.error('Failed to load teams', err);
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !user || !newTeamName.trim()) return;

    try {
      setCreating(true);
      setActionMessage(null);

      const created = await api.createTeam(currentEvent.id, {
        name: newTeamName.trim(),
        project_interest: newTeamTrack.trim() || undefined,
      });

      // Auto join created team as leader
      await api.joinTeam(currentEvent.id, created.id, {
        user_id: user.id,
        role: 'Team Lead',
      });

      setActionMessage({ type: 'success', text: `Team '${created.name}' created and joined successfully!` });
      setNewTeamName('');
      setNewTeamTrack('');
      fetchTeams();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to create team' });
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTeam = async (teamId: string) => {
    if (!currentEvent || !user) return;

    try {
      setJoiningTeamId(teamId);
      setActionMessage(null);

      await api.joinTeam(currentEvent.id, teamId, {
        user_id: user.id,
        role: 'Member',
      });

      setActionMessage({ type: 'success', text: 'Joined team successfully!' });
      fetchTeams();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to join team' });
    } finally {
      setJoiningTeamId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users2 className="w-6 h-6 text-cyan-400" />
            <span>Team Formation & Roster</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create a new hackathon squad or join an existing open team.
          </p>
        </div>

        <Badge variant="cyan" size="lg">
          {teams.length} Teams Registered
        </Badge>
      </div>

      {actionMessage && (
        <div
          className={clsx(
            'p-4 rounded-xl text-xs flex items-center gap-2 animate-fade-in',
            actionMessage.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
          )}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Create Team Form */}
        <Card className="p-5 sm:p-6 space-y-4 h-fit">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight">Form a New Team</h2>
          </div>

          <form onSubmit={handleCreateTeam} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Team Name
              </label>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="e.g., Code Crafters"
                required
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter border border-surface-border text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Project Track / Interest
              </label>
              <input
                type="text"
                value={newTeamTrack}
                onChange={(e) => setNewTeamTrack(e.target.value)}
                placeholder="e.g., HealthTech, FinTech, EdTech"
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter border border-surface-border text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={creating || !newTeamName.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-glow-cyan transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{creating ? 'Forming Team...' : 'Create & Join Team'}</span>
            </button>
          </form>
        </Card>

        {/* Right: Existing Teams Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Available Event Teams
            </h2>
          </div>

          {loading ? (
            <CardSkeleton rows={4} />
          ) : teams.length === 0 ? (
            <EmptyState
              icon={Users2}
              title="No Teams Created"
              description="Be the first to form a team using the form on the left!"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {teams.map((team) => (
                <Card key={team.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{team.name}</h3>
                      {team.project_interest && (
                        <span className="inline-block mt-1 text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                          {team.project_interest}
                        </span>
                      )}
                    </div>
                    <Badge variant="cyan" size="sm">
                      {team.member_count} Members
                    </Badge>
                  </div>

                  <div className="pt-2 border-t border-surface-border flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 capitalize">
                      Status: <span className="text-slate-200 font-semibold">{team.status}</span>
                    </span>

                    <button
                      onClick={() => handleJoinTeam(team.id)}
                      disabled={joiningTeamId === team.id}
                      className="px-3 py-1 rounded-lg bg-surface-lighter hover:bg-surface-hover border border-surface-border text-xs font-semibold text-slate-200 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{joiningTeamId === team.id ? 'Joining...' : 'Join Team'}</span>
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
