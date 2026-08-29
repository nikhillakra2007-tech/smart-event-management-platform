import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useUserRole } from '../../context/UserRoleContext';
import { api } from '../../api/client';
import { Submission, Rubric, Evaluation } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { RubricScoringForm } from '../../components/judging/RubricScoringForm';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Award,
  ArrowLeft,
  GitBranch,
  Globe,
  FolderGit2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';


export const EvaluateSubmission: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { currentUser } = useUserRole();
  const navigate = useNavigate();

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [existingEvaluation, setExistingEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submissionId || !currentUser) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [subData, rubricData, evalsData] = await Promise.all([
          api.getSubmission(submissionId),
          api.getSubmissionRubric(submissionId),
          api.getJudgeEvaluations(currentUser.id),
        ]);

        setSubmission(subData);
        setRubric(rubricData);

        const existing = evalsData.find((e) => e.submission_id === submissionId);
        setExistingEvaluation(existing || null);
      } catch (err: any) {
        setError(err.message || 'Failed to load submission evaluation sheet');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [submissionId, currentUser]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <CardSkeleton rows={3} />
        <CardSkeleton rows={6} />
      </div>
    );
  }

  if (error || !submission || !rubric || !currentUser) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <Link
          to="/judge"
          className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Judge Portal</span>
        </Link>
        <EmptyState
          icon={Award}
          title="Submission Not Available"
          description={error || 'The requested project submission or rubric could not be found.'}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/judge"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assigned Submissions</span>
        </Link>

        {existingEvaluation && (
          <Badge variant="success" size="md" dot>
            Score Submitted: {existingEvaluation.total_score?.toFixed(2)} pts
          </Badge>
        )}
      </div>

      {/* Submission Brief Card */}
      <Card className="p-6 space-y-4 bg-gradient-to-r from-surface via-surface to-indigo-950/20 border-indigo-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold tracking-widest block">
              PROJECT DELIVERABLE UNDER EVALUATION
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              {submission.title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {submission.repository_url && (
              <a
                href={submission.repository_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-lighter hover:bg-surface-hover border border-surface-border text-xs font-semibold text-white transition-colors"
              >
                <GitBranch className="w-4 h-4" />
                <span>GitHub</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

            )}

            {submission.demo_url && (
              <a
                href={submission.demo_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span>Live Demo</span>
                <ExternalLink className="w-3 h-3 text-cyan-200" />
              </a>
            )}
          </div>
        </div>

        {submission.description && (
          <p className="text-xs text-slate-300 leading-relaxed border-t border-surface-border pt-3">
            {submission.description}
          </p>
        )}
      </Card>

      {/* Rubric Evaluation Form */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Interactive Rubric Scoring Matrix</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Judge: {currentUser.name}
          </span>
        </div>

        <RubricScoringForm
          submission={submission}
          rubric={rubric}
          judgeId={currentUser.id}
          alreadyEvaluated={Boolean(existingEvaluation)}
          onSuccess={() => navigate('/judge')}
        />
      </div>
    </div>
  );
};
