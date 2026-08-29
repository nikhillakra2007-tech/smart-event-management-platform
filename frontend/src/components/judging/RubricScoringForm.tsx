import React, { useState, useMemo } from 'react';
import { Rubric, Submission, EvaluationSubmitPayload } from '../../types/api';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { api } from '../../api/client';
import { CheckCircle2, AlertCircle, Sparkles, Send, Calculator } from 'lucide-react';
import clsx from 'clsx';

interface RubricScoringFormProps {
  submission: Submission;
  rubric: Rubric;
  judgeId: string;
  onSuccess: () => void;
  alreadyEvaluated?: boolean;
}

export const RubricScoringForm: React.FC<RubricScoringFormProps> = ({
  submission,
  rubric,
  judgeId,
  onSuccess,
  alreadyEvaluated = false,
}) => {
  // Initialize scores map with default 80% of max score for smooth judge UX
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    rubric.criteria.forEach((c) => {
      init[c.id] = Math.round(c.max_score * 0.8);
    });
    return init;
  });

  const [feedback, setFeedback] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Live calculation of weighted total score matching backend judging_service formula
  const calculatedTotal = useMemo(() => {
    const totalWeight = rubric.criteria.reduce((sum, c) => sum + c.weight, 0) || 1.0;
    const weightedSum = rubric.criteria.reduce((sum, c) => {
      const score = scores[c.id] ?? 0;
      return sum + (score / c.max_score) * c.weight * 100;
    }, 0);
    return Math.min(100, Math.max(0, weightedSum / totalWeight));
  }, [rubric, scores]);

  const handleScoreChange = (criterionId: string, value: number, maxScore: number) => {
    const sanitized = Math.min(maxScore, Math.max(0, isNaN(value) ? 0 : value));
    setScores((prev) => ({
      ...prev,
      [criterionId]: sanitized,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (alreadyEvaluated) return;

    try {
      setSubmitting(true);
      setError(null);

      const payload: EvaluationSubmitPayload = {
        submission_id: submission.id,
        judge_id: judgeId,
        feedback: feedback.trim() || undefined,
        scores: rubric.criteria.map((c) => ({
          criterion_id: c.id,
          score: scores[c.id] ?? 0,
        })),
      };

      await api.submitEvaluation(payload);
      setSubmittedSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedSuccess) {
    return (
      <Card className="p-8 text-center bg-emerald-950/40 border-emerald-500/50 space-y-3 animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Evaluation Recorded Successfully!</h3>
        <p className="text-xs text-slate-300">
          The calculated score <span className="font-mono font-bold text-emerald-400">{calculatedTotal.toFixed(2)} / 100</span> has been saved and the leaderboard updated.
        </p>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-surface-lighter/60 border border-surface-border">
        <div>
          <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider font-bold">
            {rubric.name}
          </span>
          <p className="text-xs text-slate-400 mt-0.5">{rubric.description || 'Standard Hackathon Rubric'}</p>
        </div>

        {/* Live Total Pill */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-950/70 border border-indigo-500/40 shadow-sm">
          <Calculator className="w-4 h-4 text-indigo-400" />
          <div>
            <span className="text-[10px] text-slate-400 block font-semibold">Weighted Total</span>
            <span className="text-lg font-black text-white font-mono leading-none">
              {calculatedTotal.toFixed(2)} <span className="text-xs text-indigo-300 font-normal">/ 100</span>
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Rubric Criteria List */}
      <div className="space-y-4">
        {rubric.criteria.map((criterion, idx) => {
          const currentScore = scores[criterion.id] ?? 0;
          const scorePercent = (currentScore / criterion.max_score) * 100;

          return (
            <Card key={criterion.id} className="p-4 sm:p-5 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-[11px] font-bold flex items-center justify-center font-mono">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-white">{criterion.name}</h4>
                  </div>
                  {criterion.description && (
                    <p className="text-xs text-slate-400 mt-1 pl-7">{criterion.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 font-mono">
                  <Badge variant="cyan" size="sm">
                    Weight: {criterion.weight}x
                  </Badge>
                  <span className="text-xs font-bold text-slate-300 bg-surface-lighter px-2.5 py-1 rounded-lg border border-surface-border">
                    Max: {criterion.max_score} pts
                  </span>
                </div>
              </div>

              {/* Slider & Input Row */}
              <div className="flex items-center gap-4 pt-2">
                <input
                  type="range"
                  min="0"
                  max={criterion.max_score}
                  step="0.5"
                  value={currentScore}
                  disabled={alreadyEvaluated}
                  onChange={(e) =>
                    handleScoreChange(criterion.id, parseFloat(e.target.value), criterion.max_score)
                  }
                  className="flex-1 accent-indigo-500 h-2 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-50"
                />

                <div className="flex items-center gap-1 shrink-0">
                  <input
                    type="number"
                    min="0"
                    max={criterion.max_score}
                    step="0.5"
                    value={currentScore}
                    disabled={alreadyEvaluated}
                    onChange={(e) =>
                      handleScoreChange(criterion.id, parseFloat(e.target.value), criterion.max_score)
                    }
                    className="w-16 px-2 py-1 rounded-lg bg-surface-lighter border border-surface-border text-right font-mono font-bold text-sm text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                  <span className="text-xs text-slate-500 font-mono">/ {criterion.max_score}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Qualitative Feedback */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
          Judge Feedback & Comments (Optional)
        </label>
        <textarea
          rows={3}
          value={feedback}
          disabled={alreadyEvaluated}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Provide constructive feedback for the team regarding architecture, execution, and potential improvements..."
          className="w-full p-3 rounded-xl bg-surface border border-surface-border text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50 resize-none"
        />
      </div>

      {/* Submit Action */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting || alreadyEvaluated}
          className={clsx(
            'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white transition-all shadow-lg',
            alreadyEvaluated
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 shadow-glow-indigo active:scale-[0.99]'
          )}
        >
          {submitting ? (
            <span>Submitting Evaluation...</span>
          ) : alreadyEvaluated ? (
            <span>Evaluation Already Submitted</span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit Evaluation ({calculatedTotal.toFixed(2)} pts)</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};
