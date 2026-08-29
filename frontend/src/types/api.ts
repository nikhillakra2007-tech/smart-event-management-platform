/**
 * TypeScript definitions matching backend FastAPI / Pydantic schemas exactly.
 */

export type UserRole = 'organizer' | 'participant' | 'judge';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ParticipantProfile {
  id: string;
  user_id: string;
  skills: string[];
  preferred_roles: string[];
  project_interests: string[];
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventItem {
  id: string;
  name: string;
  description?: string | null;
  venue?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  registration_number: string;
  qr_token: string;
  registration_status: 'pending' | 'confirmed' | 'cancelled';
  registered_at: string;
}

export interface CheckInItem {
  registration_id: string;
  registration_number: string;
  user_id: string;
  participant_name: string;
  checked_in: boolean;
  checked_in_at?: string | null;
}

export interface CheckInResponse {
  id: string;
  registration_id: string;
  checked_in_by?: string | null;
  checked_in_at: string;
  status: 'active' | 'cancelled';
}

export interface CheckInVerificationResult {
  check_in: CheckInResponse;
  participant_name: string;
  participant_email: string;
  registration_number: string;
  event_id: string;
}

export interface Team {
  id: string;
  event_id: string;
  name: string;
  project_interest?: string | null;
  status: 'forming' | 'active' | 'submitted';
  created_at: string;
  updated_at: string;
  member_count: number;
}

export interface TeamDiscoveryResult {
  user_id: string;
  name: string;
  email: string;
  skills: string[];
  preferred_roles: string[];
  project_interests: string[];
  bio?: string | null;
  matching_skills: string[];
  matching_interests: string[];
  compatible_roles: string[];
  match_score: number; // 0-100
}

export interface Submission {
  id: string;
  event_id: string;
  team_id: string;
  title: string;
  description?: string | null;
  repository_url?: string | null;
  demo_url?: string | null;
  status: 'draft' | 'submitted' | 'withdrawn';
  submitted_at?: string | null;
  updated_at: string;
}

export interface RubricCriterion {
  id: string;
  rubric_id: string;
  name: string;
  description?: string | null;
  max_score: number;
  weight: number;
  sort_order: number;
}

export interface Rubric {
  id: string;
  event_id: string;
  name: string;
  description?: string | null;
  criteria: RubricCriterion[];
  created_at: string;
  updated_at: string;
}

export interface JudgeAssignment {
  id: string;
  judge_id: string;
  submission_id: string;
  assigned_at: string;
}

export interface EvaluationScoreInput {
  criterion_id: string;
  score: number;
}

export interface EvaluationSubmitPayload {
  submission_id: string;
  judge_id: string;
  feedback?: string | null;
  scores: EvaluationScoreInput[];
}

export interface EvaluationScoreResponse {
  id: string;
  evaluation_id: string;
  criterion_id: string;
  score: number;
}

export interface Evaluation {
  id: string;
  submission_id: string;
  judge_id: string;
  feedback?: string | null;
  total_score?: number | null;
  status: 'draft' | 'submitted';
  submitted_at?: string | null;
  updated_at: string;
  scores?: EvaluationScoreResponse[];
}

export interface Announcement {
  id: string;
  event_id: string;
  title: string;
  message: string;
  type: 'general' | 'schedule' | 'venue' | 'critical';
  created_by?: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  view_count: number;
}

export interface LeaderboardEntry {
  rank: number;
  team_id: string;
  team_name: string;
  event_id: string;
  submission_id?: string | null;
  submission_title?: string | null;
  evaluation_count: number;
  average_score: number;
  aggregate_score: number;
}

export interface AttendanceTimePoint {
  hour: string;
  count: number;
}

export interface ScoreDistributionBucket {
  range: string;
  count: number;
}

export interface AnnouncementViewStat {
  title: string;
  view_count: number;
  type: string;
}

export interface EventAnalytics {
  event_id: string;
  total_registrations: number;
  checked_in_count: number;
  not_checked_in_count: number;
  check_in_percentage: number;
  teams_formed: number;
  submissions_count: number;
  evaluated_submissions: number;
  average_score?: number | null;
  score_distribution: ScoreDistributionBucket[];
  attendance_over_time: AttendanceTimePoint[];
  announcement_stats: AnnouncementViewStat[];
  total_announcement_views: number;
}
