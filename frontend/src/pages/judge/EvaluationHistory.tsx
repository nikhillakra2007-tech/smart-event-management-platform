import React, { useState, useEffect, useCallback } from 'react';
import { useEvent } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { useLivePolling } from '../../hooks/useLivePolling';
import { api } from '../../api/client';
import { Evaluation, Submission } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { History, Award, CheckCircle2, MessageSquare, Calendar } from 'lucide-react';

export const EvaluationHistory: React.FC = () => {
  const { currentEvent } = useEvent();
  const { user } = useAuth();

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [evalsData, subsData] = await Promise.all([
        api.getJudgeEvaluations(user.id),
        currentEvent ? api.getEventSubmissions(currentEvent.id) : Promise.resolve([]),
      ]);
      setEvaluations(evalsData);
      setSubmissions(subsData);
    } catch (err) {
      console.error('Failed to load evaluation history', err);
    } finally {
      setLoading(false);
    }
  }, [user, currentEvent]);

  useLivePolling(fetchData, 8000, Boolean(user));

  const subsMap = new Map<string, Submission>();
  submissions.forEach((s) => subsMap.set(s.id, s));

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-amber-400" />
            <span>Judge Scoring History</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Historical rubric scores, feedback notes, and timestamps recorded by <span className="text-amber-300 font-semibold">{user?.name}</span>.
          </p>
        </div>

        <Badge variant="success" size="lg">
          {evaluations.length} Reviews Submitted
        </Badge>
      </div>

      {loading ? (
        <CardSkeleton rows={4} />
      ) : evaluations.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No Submitted Evaluations"
          description="You haven't submitted any project evaluations yet."
        />
      ) : (
        <div className="space-y-4">
          {evaluations.map((evaluation) => {
            const submission = subsMap.get(evaluation.submission_id);
            return (
              <Card key={evaluation.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {submission?.title || 'Project Submission'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Submission ID: {evaluation.submission_id.slice(0, 8)}...
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-amber-400 font-mono">
                      {evaluation.total_score ? evaluation.total_score.toFixed(2) : 0} <span className="text-xs text-slate-500 font-normal">/ 100</span>
                    </div>
                    <Badge variant="success" size="sm">
                      {evaluation.status}
                    </Badge>
                  </div>
                </div>

                {evaluation.feedback && (
                  <div className="p-3 rounded-xl bg-surface-lighter/60 border border-surface-border text-xs text-slate-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-indigo-300 text-[11px]">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Judge Qualitative Feedback</span>
                    </div>
                    <p className="italic pl-5 leading-relaxed">{evaluation.feedback}</p>
                  </div>
                )}

                <div className="pt-2 border-t border-surface-border flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Evaluation ID: {evaluation.id.slice(0, 8)}...</span>
                  <span>
                    Submitted: {evaluation.submitted_at ? new Date(evaluation.submitted_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
