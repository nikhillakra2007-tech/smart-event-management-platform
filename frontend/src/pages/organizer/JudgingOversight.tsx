import React, { useState, useEffect, useCallback } from 'react';
import { useEvent } from '../../context/EventContext';
import { useLivePolling } from '../../hooks/useLivePolling';
import { api } from '../../api/client';
import { User, Submission, Rubric } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import {
  Award,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  Sliders,
  Scale,
} from 'lucide-react';

export const JudgingOversight: React.FC = () => {
  const { currentEvent } = useEvent();

  const [judges, setJudges] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentEvent) return;
    try {
      const [judgesData, subsData] = await Promise.all([
        api.getUsers('judge'),
        api.getEventSubmissions(currentEvent.id),
      ]);
      setJudges(judgesData);
      setSubmissions(subsData);

      if (subsData.length > 0) {
        try {
          const rubricData = await api.getSubmissionRubric(subsData[0].id);
          setRubric(rubricData);
        } catch (e) {
          console.warn('No rubric loaded for submission', e);
        }
      }
    } catch (err) {
      console.error('Failed to load judging oversight data', err);
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  useLivePolling(fetchData, 6000, Boolean(currentEvent));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            <span>Judging Portal & Rubric Oversight</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review event scoring rubrics, weights, criteria, and judge evaluations.
          </p>
        </div>

        <Badge variant="purple" size="lg">
          {judges.length} Certified Judges
        </Badge>
      </div>

      {loading ? (
        <CardSkeleton rows={4} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rubric Criteria Specification */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-tight">
                      {rubric?.name || 'Event Judging Rubric'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {rubric?.description || 'Weighted criteria evaluated across all hackathon submissions'}
                    </p>
                  </div>
                </div>

                <Badge variant="cyan" size="sm">
                  {rubric?.criteria.length || 4} Criteria
                </Badge>
              </div>

              <div className="space-y-3 pt-2">
                {rubric?.criteria.map((criterion, idx) => (
                  <div
                    key={criterion.id}
                    className="p-4 rounded-xl bg-surface-lighter/50 border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-surface border border-slate-700 text-[10px] font-mono font-bold text-indigo-300 flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-sm text-white">{criterion.name}</span>
                      </div>
                      <p className="text-xs text-slate-400 pl-7">{criterion.description}</p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0 font-mono text-xs">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-800/40 font-semibold">
                        Multiplier: {criterion.weight}x
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-surface text-slate-200 border border-surface-border font-bold">
                        Max: {criterion.max_score} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Judges Roster */}
          <div className="space-y-4">
            <Card className="p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Judges Roster</h3>
              </div>

              <div className="space-y-2.5">
                {judges.map((judge) => (
                  <div
                    key={judge.id}
                    className="p-3 rounded-xl bg-surface-lighter/50 border border-surface-border flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-white">{judge.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{judge.email}</p>
                    </div>
                    <Badge variant="purple" size="sm">
                      Judge
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
