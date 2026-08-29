import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useEvent } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { useLivePolling } from '../../hooks/useLivePolling';
import { api } from '../../api/client';
import { JudgeAssignment, Submission, Evaluation } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Award,
  CheckCircle2,
  Clock,
  ExternalLink,
  ArrowRight,
  FolderGit2,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import clsx from 'clsx';

export const JudgeDashboard: React.FC = () => {
  const { currentEvent } = useEvent();
  const { user } = useAuth();

  const [assignments, setAssignments] = useState<JudgeAssignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [assignData, evalsData] = await Promise.all([
        api.getJudgeAssignments(user.id),
        api.getJudgeEvaluations(user.id),
      ]);
      setAssignments(assignData);
      setEvaluations(evalsData);

      if (currentEvent) {
        const subs = await api.getEventSubmissions(currentEvent.id);
        setSubmissions(subs);
      }
    } catch (err) {
      console.error('Failed to load judge dashboard', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentEvent]);

  useLivePolling(fetchData, 6000, Boolean(user));

  const subsMap = new Map<string, Submission>();
  submissions.forEach((s) => subsMap.set(s.id, s));

  const evalsMap = new Map<string, Evaluation>();
  evaluations.forEach((e) => evalsMap.set(e.submission_id, e));

  const totalAssigned = assignments.length;
  const completedCount = assignments.filter((a) => evalsMap.has(a.submission_id)).length;
  const pendingCount = totalAssigned - completedCount;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Award className="w-6 h-6 text-amber-400" />
              <span>Judge Scoring Portal</span>
            </h1>
            <Badge variant="purple" size="sm">
              Official Evaluator
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Evaluating as <span className="text-amber-300 font-semibold">{user?.name}</span> ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="success" size="lg">
            {completedCount} Completed
          </Badge>
          <Badge variant="warning" size="lg">
            {pendingCount} Pending Review
          </Badge>
        </div>
      </div>

      {/* Assigned Submissions List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Assigned Hackathon Submissions ({totalAssigned})
          </h2>
          <Link
            to="/judge/history"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300"
          >
            Review Past Evaluations →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            <CardSkeleton rows={3} />
            <CardSkeleton rows={3} />
          </div>
        ) : assignments.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No Submissions Assigned"
            description="You currently have no project submissions assigned for evaluation."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((assignment) => {
              const submission = subsMap.get(assignment.submission_id);
              const evaluation = evalsMap.get(assignment.submission_id);
              const isEvaluated = Boolean(evaluation);

              return (
                <Card
                  key={assignment.id}
                  className={clsx(
                    'p-5 space-y-4 transition-all flex flex-col justify-between',
                    isEvaluated ? 'border-emerald-800/40 bg-surface' : 'border-amber-500/30 bg-surface hover:border-amber-400/60'
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-extrabold text-white">
                          {submission?.title || 'Project Submission'}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono">
                          ID: {assignment.submission_id.slice(0, 8)}...
                        </p>
                      </div>

                      <Badge variant={isEvaluated ? 'success' : 'warning'} size="sm" dot>
                        {isEvaluated ? 'Evaluated' : 'Needs Score'}
                      </Badge>
                    </div>

                    {submission?.description && (
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {submission.description}
                      </p>
                    )}

                    {isEvaluated && evaluation && (
                      <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-300">Total Score Awarded</span>
                        <span className="text-sm font-black text-emerald-400">
                          {evaluation.total_score ? evaluation.total_score.toFixed(2) : 0} / 100
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-surface-border flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                    </span>

                    <Link
                      to={`/judge/evaluate/${assignment.submission_id}`}
                      className={clsx(
                        'px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5',
                        isEvaluated
                          ? 'bg-surface-lighter text-slate-300 hover:text-white border border-surface-border'
                          : 'bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white shadow-glow-amber'
                      )}
                    >
                      <span>{isEvaluated ? 'View Rubric Scores' : 'Evaluate Project'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
