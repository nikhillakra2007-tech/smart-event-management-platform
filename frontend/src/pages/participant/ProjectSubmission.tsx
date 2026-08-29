import React, { useState, useEffect, useCallback } from 'react';
import { useEvent } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Team, Submission } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  FolderGit2,
  GitBranch,
  Globe,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

import clsx from 'clsx';

export const ProjectSubmission: React.FC = () => {
  const { currentEvent } = useEvent();
  const { user } = useAuth();

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTeamAndSubmission = useCallback(async () => {
    if (!currentEvent) return;
    try {
      const [teamsData, subsData] = await Promise.all([
        api.getEventTeams(currentEvent.id),
        api.getEventSubmissions(currentEvent.id),
      ]);
      setTeams(teamsData);

      if (teamsData.length > 0) {
        const teamToUse = teamsData[0];
        setSelectedTeamId(teamToUse.id);

        const sub = subsData.find((s) => s.team_id === teamToUse.id);
        if (sub) {
          setExistingSubmission(sub);
          setTitle(sub.title);
          setDescription(sub.description || '');
          setRepoUrl(sub.repository_url || '');
          setDemoUrl(sub.demo_url || '');
        }
      }
    } catch (err) {
      console.error('Failed to load team submissions', err);
    }
  }, [currentEvent]);

  useEffect(() => {
    fetchTeamAndSubmission();
  }, [fetchTeamAndSubmission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !selectedTeamId || !title.trim()) return;

    try {
      setSubmitting(true);
      setStatusMessage(null);

      const sub = await api.createOrUpdateSubmission(currentEvent.id, {
        team_id: selectedTeamId,
        title: title.trim(),
        description: description.trim() || undefined,
        repository_url: repoUrl.trim() || undefined,
        demo_url: demoUrl.trim() || undefined,
      });

      setExistingSubmission(sub);
      setStatusMessage({ type: 'success', text: 'Project submitted successfully for judging!' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to submit project' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FolderGit2 className="w-6 h-6 text-violet-400" />
            <span>Project Submission Portal</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Submit your GitHub repository, live web demo, and project documentation for judging.
          </p>
        </div>

        {existingSubmission && (
          <Badge variant="success" size="lg" dot>
            Submission Active
          </Badge>
        )}
      </div>

      {statusMessage && (
        <div
          className={clsx(
            'p-4 rounded-xl text-xs flex items-center gap-2 animate-fade-in',
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-500/50 text-rose-300'
          )}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Submission Form */}
        <Card className="lg:col-span-2 p-5 sm:p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Submitting Team
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => {
                  setSelectedTeamId(e.target.value);
                  // refresh existing submission for chosen team
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-surface-lighter border border-surface-border text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.project_interest || 'General'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Project Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., MediTrack, FintechFlow, HarvestAI"
                required
                className="w-full px-3 py-2.5 rounded-xl bg-surface-lighter border border-surface-border text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1">
                Project Description & Architecture
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe problem solved, technologies utilized, and key differentiators..."
                className="w-full p-3 rounded-xl bg-surface-lighter border border-surface-border text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1 flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>GitHub Repository URL</span>
                </label>

                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/org/repo"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-lighter border border-surface-border text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Live Demo URL</span>
                </label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://demo.hackhive.io/app"
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-lighter border border-surface-border text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-extrabold text-xs shadow-glow-indigo transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Save & Submit Project for Evaluation'}</span>
            </button>
          </form>
        </Card>

        {/* Right 1 Col: Active Submission Summary */}
        <Card className="p-5 space-y-4 h-fit">
          <div className="flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-violet-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Submission Deliverables
            </h2>
          </div>

          {existingSubmission ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Status</span>
                <Badge variant="success" size="sm">
                  {existingSubmission.status}
                </Badge>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Project Title</span>
                <p className="font-bold text-white text-sm">{existingSubmission.title}</p>
              </div>

              {existingSubmission.repository_url && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Source Code</span>
                  <a
                    href={existingSubmission.repository_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 font-mono truncate block"
                  >
                    {existingSubmission.repository_url}
                  </a>
                </div>
              )}

              {existingSubmission.demo_url && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Deployment</span>
                  <a
                    href={existingSubmission.demo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 font-mono truncate block"
                  >
                    {existingSubmission.demo_url}
                  </a>
                </div>
              )}

              {existingSubmission.submitted_at && (
                <div className="pt-2 border-t border-surface-border text-[11px] text-slate-500 font-mono">
                  Timestamp: {new Date(existingSubmission.submitted_at).toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              No project deliverables submitted yet. Use the form to enter your repository and deployment URL.
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};
