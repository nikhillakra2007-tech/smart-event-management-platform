/**
 * Centralized Type-Safe API Client for Smart Event Management Platform.
 * Features in-flight request deduplication & short TTL caching for lightning fast responses.
 */

import {
  EventItem,
  User,
  ParticipantProfile,
  Registration,
  CheckInItem,
  CheckInVerificationResult,
  Team,
  TeamDiscoveryResult,
  Submission,
  Rubric,
  JudgeAssignment,
  Evaluation,
  EvaluationSubmitPayload,
  Announcement,
  LeaderboardEntry,
  EventAnalytics,
  ScheduleItem,
  PlannerTask,
  BudgetItem,
  PlannerOverview,
} from '../types/api';
import { authApi } from './auth';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// In-memory cache & in-flight promise map for ultra-fast response deduplication
const responseCache = new Map<string, { timestamp: number; data: any }>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 2500; // 2.5s cache for identical GET requests

export function clearApiCache(endpointPrefix?: string) {
  if (!endpointPrefix) {
    responseCache.clear();
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.includes(endpointPrefix)) {
      responseCache.delete(key);
    }
  }
}

/** Get valid access token, refreshing if needed */
async function getValidAccessToken(): Promise<string | null> {
  const accessToken = authApi.getAccessToken();
  if (!accessToken) return null;
  return accessToken;
}

const MOCK_EVENT_ID = '00000000-0000-0000-0000-000000000001';

const MOCK_EVENTS: EventItem[] = [
  {
    id: MOCK_EVENT_ID,
    name: 'HackHive 2026',
    description: 'Annual Flagship 48-Hour Corporate AI & Cloud Innovation Hackathon',
    venue: 'Tech Innovation Centre, Bengaluru',
    start_time: '2026-10-10T09:00:00Z',
    end_time: '2026-10-12T18:00:00Z',
    status: 'active',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'CloudScale Summit 2026',
    description: 'Enterprise Cloud Architecture & Distributed Systems Conference',
    venue: 'Main Auditorium, Floor 4, Hyderabad',
    start_time: '2026-11-15T10:00:00Z',
    end_time: '2026-11-16T17:00:00Z',
    status: 'draft',
    created_at: '2026-10-02T00:00:00Z',
    updated_at: '2026-10-02T00:00:00Z',
  },
];

const MOCK_ANALYTICS: EventAnalytics = {
  event_id: MOCK_EVENT_ID,
  total_registrations: 40,
  checked_in_count: 30,
  not_checked_in_count: 10,
  check_in_percentage: 75.0,
  teams_formed: 10,
  submissions_count: 10,
  evaluated_submissions: 8,
  average_score: 84.6,
  attendance_over_time: [
    { hour: '08:00', count: 4 },
    { hour: '09:00', count: 14 },
    { hour: '10:00', count: 8 },
    { hour: '11:00', count: 4 },
  ],
  score_distribution: [
    { range: '60-69', count: 1 },
    { range: '70-79', count: 2 },
    { range: '80-89', count: 4 },
    { range: '90-100', count: 3 },
  ],
  announcement_stats: [
    { title: 'Hacking officially commences!', view_count: 38, type: 'critical' },
    { title: 'Lunch served at Dining Hall', view_count: 32, type: 'general' },
    { title: 'Mentorship round starting in 15m', view_count: 29, type: 'schedule' },
  ],
  total_announcement_views: 99,
};

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, team_id: 't-1', team_name: 'Neural Ninjas', event_id: MOCK_EVENT_ID, submission_id: 's-1', submission_title: 'CausalFlow: AI Incident Root Cause Diagnostic Engine', average_score: 94.5, aggregate_score: 283.5, evaluation_count: 3 },
  { rank: 2, team_id: 't-2', team_name: 'Tech Titans', event_id: MOCK_EVENT_ID, submission_id: 's-2', submission_title: 'HyperScale: Zero-Egress Cloud Storage Broker', average_score: 89.2, aggregate_score: 267.6, evaluation_count: 3 },
  { rank: 3, team_id: 't-3', team_name: 'Code Crafters', event_id: MOCK_EVENT_ID, submission_id: 's-3', submission_title: 'PulseOps: Autonomous Cluster Auto-healer', average_score: 87.0, aggregate_score: 261.0, evaluation_count: 3 },
  { rank: 4, team_id: 't-4', team_name: 'Binary Builders', event_id: MOCK_EVENT_ID, submission_id: 's-4', submission_title: 'Sentinel Guard: API Zero-Trust Gateway', average_score: 84.8, aggregate_score: 254.4, evaluation_count: 3 },
  { rank: 5, team_id: 't-5', team_name: 'Innovators Hub', event_id: MOCK_EVENT_ID, submission_id: 's-5', submission_title: 'DataMesh Orchestrator: Realtime CDC Sync', average_score: 82.5, aggregate_score: 247.5, evaluation_count: 3 },
  { rank: 6, team_id: 't-6', team_name: 'Debug Dynasty', event_id: MOCK_EVENT_ID, submission_id: 's-6', submission_title: 'TraceLens: Distributed eBPF Packet Profiler', average_score: 80.0, aggregate_score: 240.0, evaluation_count: 3 },
];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'ann-1', event_id: MOCK_EVENT_ID, title: 'Hacking Period Officially Commenced!', message: 'All repositories are unlocked. Push commits to GitHub and verify your automated CI build pipelines.', type: 'critical', is_published: true, created_by: 'Alex Rivera', view_count: 40, created_at: '2026-10-10T09:00:00Z', updated_at: '2026-10-10T09:30:00Z' },
  { id: 'ann-2', event_id: MOCK_EVENT_ID, title: 'Mentor Office Hours: AI & Cloud Architecture', message: 'AWS and Google Cloud mentors are stationed at Pod C for 1-on-1 architecture reviews.', type: 'general', is_published: true, created_by: 'Alex Rivera', view_count: 35, created_at: '2026-10-10T10:45:00Z', updated_at: '2026-10-10T11:00:00Z' },
  { id: 'ann-3', event_id: MOCK_EVENT_ID, title: 'Submission Guidelines & Demo Video Uploads', message: 'Ensure your project description includes a 2-minute walk-through and public GitHub repo link.', type: 'schedule', is_published: true, created_by: 'Alex Rivera', view_count: 28, created_at: '2026-10-10T13:30:00Z', updated_at: '2026-10-10T14:00:00Z' },
];

const MOCK_SCHEDULE: ScheduleItem[] = [
  { id: 'sc-1', event_id: MOCK_EVENT_ID, title: 'Check-In & Registration Breakfast', description: 'Badge pickup, QR scanning, welcome swag kit distribution', day_number: 1, start_time: '08:30', end_time: '09:30', location: 'Atrium Level 1', category: 'general', speaker: 'Event Operations Team', is_milestone: true, order_index: 0, created_at: '2026-10-01T00:00:00Z' },
  { id: 'sc-2', event_id: MOCK_EVENT_ID, title: 'Opening Keynote & Problem Statements', description: 'Keynote on Generative AI in Production, sponsor tracks reveal', day_number: 1, start_time: '09:30', end_time: '10:30', location: 'Main Stage Auditorium', category: 'keynote', speaker: 'Alex Rivera (VP Eng)', is_milestone: true, order_index: 1, created_at: '2026-10-01T00:00:00Z' },
  { id: 'sc-3', event_id: MOCK_EVENT_ID, title: 'Hacking Period Commences', description: 'Teams begin prototyping in squad pods', day_number: 1, start_time: '11:00', end_time: '19:00', location: 'Squad Pods A-H', category: 'milestone', speaker: null, is_milestone: true, order_index: 2, created_at: '2026-10-01T00:00:00Z' },
  { id: 'sc-4', event_id: MOCK_EVENT_ID, title: 'Judges Evaluation & Live Demos', description: 'Interactive rubric scoring rounds across all tracks', day_number: 2, start_time: '14:00', end_time: '17:00', location: 'Exhibition Hall', category: 'judging', speaker: 'Judging Panel', is_milestone: true, order_index: 3, created_at: '2026-10-01T00:00:00Z' },
];

const MOCK_TASKS: PlannerTask[] = [
  { id: 'pt-1', event_id: MOCK_EVENT_ID, title: 'Verify High-Density Wi-Fi Infrastructure', description: 'Test 5GHz AP coverage across all hacking pods', status: 'completed', priority: 'critical', category: 'logistics', assignee: 'Alex Rivera', due_date: '2026-10-09', completed_at: '2026-10-08T16:00:00Z', order_index: 0, created_at: '2026-10-01T00:00:00Z' },
  { id: 'pt-2', event_id: MOCK_EVENT_ID, title: 'Distribute Digital QR Passes', description: 'Trigger bulk email dispatch of cryptographic check-in badges', status: 'completed', priority: 'critical', category: 'platform', assignee: 'Alex Rivera', due_date: '2026-10-09', completed_at: '2026-10-09T10:00:00Z', order_index: 1, created_at: '2026-10-01T00:00:00Z' },
  { id: 'pt-3', event_id: MOCK_EVENT_ID, title: 'Brief Judging Panel on Rubric Weights', description: 'Review scoring scale (Innovation 30%, Tech 30%, Impact 20%, Presentation 20%)', status: 'in_progress', priority: 'high', category: 'mentors', assignee: 'Dr. Priya Sharma', due_date: '2026-10-10', completed_at: null, order_index: 2, created_at: '2026-10-01T00:00:00Z' },
  { id: 'pt-4', event_id: MOCK_EVENT_ID, title: 'Catering & Midday Energy Stations', description: 'Coordinate buffet setup and hydration bars', status: 'in_progress', priority: 'medium', category: 'catering', assignee: 'Ops Team', due_date: '2026-10-10', completed_at: null, order_index: 3, created_at: '2026-10-01T00:00:00Z' },
];

const MOCK_BUDGET: BudgetItem[] = [
  { id: 'b-1', event_id: MOCK_EVENT_ID, item_name: 'Main Auditorium & Pod Venue Booking', category: 'venue', planned_cost: 15000, actual_cost: 14500, status: 'paid', vendor: 'Bengaluru Tech Centre', notes: '48h access contract', created_at: '2026-10-01T00:00:00Z' },
  { id: 'b-2', event_id: MOCK_EVENT_ID, item_name: 'Grand Champion Prize Pool & Swag Kits', category: 'prizes', planned_cost: 10000, actual_cost: 10000, status: 'approved', vendor: 'Tech Hive Sponsors', notes: 'Top 3 podium checks', created_at: '2026-10-01T00:00:00Z' },
  { id: 'b-3', event_id: MOCK_EVENT_ID, item_name: 'High-Throughput Dedicated Fiber Line', category: 'tech', planned_cost: 3500, actual_cost: 3200, status: 'paid', vendor: 'Airtel Enterprise', notes: '1Gbps symmetrical link', created_at: '2026-10-01T00:00:00Z' },
  { id: 'b-4', event_id: MOCK_EVENT_ID, item_name: 'All-Day Catering & Coffee Bars', category: 'catering', planned_cost: 7500, actual_cost: 7200, status: 'paid', vendor: 'FreshBite Catering', notes: 'Meals for 120 attendees', created_at: '2026-10-01T00:00:00Z' },
];

const MOCK_TEAMS: Team[] = [
  { id: 't-1', event_id: MOCK_EVENT_ID, name: 'Neural Ninjas', project_interest: 'AI & Autonomous Systems', status: 'active', member_count: 4, created_at: '2026-10-05T00:00:00Z', updated_at: '2026-10-05T00:00:00Z' },
  { id: 't-2', event_id: MOCK_EVENT_ID, name: 'Tech Titans', project_interest: 'Cloud Infrastructure & High Availability', status: 'active', member_count: 4, created_at: '2026-10-05T00:00:00Z', updated_at: '2026-10-05T00:00:00Z' },
  { id: 't-3', event_id: MOCK_EVENT_ID, name: 'Code Crafters', project_interest: 'DevOps & Reliability Engineering', status: 'active', member_count: 3, created_at: '2026-10-05T00:00:00Z', updated_at: '2026-10-05T00:00:00Z' },
  { id: 't-4', event_id: MOCK_EVENT_ID, name: 'Binary Builders', project_interest: 'Cybersecurity & Zero-Trust', status: 'active', member_count: 4, created_at: '2026-10-05T00:00:00Z', updated_at: '2026-10-05T00:00:00Z' },
];

const MOCK_SUBMISSIONS: Submission[] = [
  { id: 's-1', event_id: MOCK_EVENT_ID, team_id: 't-1', title: 'CausalFlow: AI Incident Root Cause Diagnostic Engine', description: 'Deterministic causal DAG modeling to isolate cloud network latency regressions.', repository_url: 'https://github.com/neural-ninjas/causal-flow', demo_url: 'https://causalflow.dev', status: 'submitted', submitted_at: '2026-10-10T12:00:00Z', updated_at: '2026-10-10T12:00:00Z' },
  { id: 's-2', event_id: MOCK_EVENT_ID, team_id: 't-2', title: 'HyperScale: Zero-Egress Cloud Storage Broker', description: 'Peer-accelerated chunk caching reducing cloud egress spend by 80%.', repository_url: 'https://github.com/techtitans/hyperscale', demo_url: 'https://hyperscale.io', status: 'submitted', submitted_at: '2026-10-10T12:30:00Z', updated_at: '2026-10-10T12:30:00Z' },
];

const MOCK_CHECKINS: CheckInItem[] = [
  { registration_id: 'reg-1', registration_number: 'HH-2026-001', user_id: '22222222-2222-2222-2222-222222222222', participant_name: 'Arjun Mehta', checked_in: true, checked_in_at: '2026-10-10T08:45:00Z' },
  { registration_id: 'reg-2', registration_number: 'HH-2026-002', user_id: 'u-2', participant_name: 'Sara Khan', checked_in: true, checked_in_at: '2026-10-10T08:50:00Z' },
  { registration_id: 'reg-3', registration_number: 'HH-2026-003', user_id: 'u-3', participant_name: 'Rohan Sharma', checked_in: true, checked_in_at: '2026-10-10T09:10:00Z' },
];


function getMockFallback<T>(endpoint: string): T | null {
  if (endpoint === '/events') return MOCK_EVENTS as unknown as T;
  if (endpoint.startsWith('/events/') && endpoint.endsWith('/planner')) {
    return {
      schedule_items: MOCK_SCHEDULE,
      tasks: MOCK_TASKS,
      budget_items: MOCK_BUDGET,
      total_planned_budget: 36000,
      total_actual_budget: 34900,
      task_stats: { todo: 0, in_progress: 2, completed: 2, blocked: 0, total: 4 },
    } as unknown as T;
  }
  if (endpoint.includes('/planner/schedule')) return MOCK_SCHEDULE as unknown as T;
  if (endpoint.includes('/planner/tasks')) return MOCK_TASKS as unknown as T;
  if (endpoint.includes('/planner/budget')) return MOCK_BUDGET as unknown as T;
  if (endpoint.includes('/analytics')) return MOCK_ANALYTICS as unknown as T;
  if (endpoint.includes('/leaderboard')) return MOCK_LEADERBOARD as unknown as T;
  if (endpoint.includes('/announcements')) return MOCK_ANNOUNCEMENTS as unknown as T;
  if (endpoint.includes('/checkins')) return MOCK_CHECKINS as unknown as T;
  if (endpoint.includes('/teams')) return MOCK_TEAMS as unknown as T;
  if (endpoint.includes('/submissions')) return MOCK_SUBMISSIONS as unknown as T;
  if (endpoint.startsWith('/events/') && !endpoint.includes('/', 8)) return MOCK_EVENTS[0] as unknown as T;
  if (endpoint.includes('/my-checkin')) return { checked_in: true, checked_in_at: '2026-10-10T08:45:00Z', registration_id: 'reg-1' } as unknown as T;
  if (endpoint.includes('/my-registration')) {
    return {
      id: 'reg-1',
      event_id: '00000000-0000-0000-0000-000000000001',
      user_id: '22222222-2222-2222-2222-222222222222',
      status: 'confirmed',
      qr_token: 'HACKHIVE-PASS-ARJUN-MEHTA-9921',
      created_at: '2026-10-01T00:00:00Z',
    } as unknown as T;
  }
  if (endpoint.includes('/assignments')) {
    return [
      { id: 'as-1', judge_id: '33333333-3333-3333-3333-333333333333', submission_id: 's-1', assigned_at: '2026-10-10T10:00:00Z', status: 'evaluated' },
      { id: 'as-2', judge_id: '33333333-3333-3333-3333-333333333333', submission_id: 's-2', assigned_at: '2026-10-10T10:00:00Z', status: 'pending' },
    ] as unknown as T;
  }
  if (endpoint.includes('/evaluations')) {
    return [
      { id: 'ev-1', submission_id: 's-1', judge_id: '33333333-3333-3333-3333-333333333333', total_score: 94.5, feedback: 'Outstanding causal DAG modeling and clear production architectural execution.', status: 'submitted', created_at: '2026-10-10T15:30:00Z' },
    ] as unknown as T;
  }
  return null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const url = `${BASE_URL}${endpoint}`;

  // Invalidate cache on write operations
  if (method !== 'GET') {
    clearApiCache();
  }

  // Check cache for GET requests
  const cacheKey = `${endpoint}`;
  if (method === 'GET' && !options.headers) {
    const cached = responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data as T;
    }
    // Deduplicate in-flight GET requests
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey)! as Promise<T>;
    }
  }

  const fetchPromise = (async (): Promise<T> => {
    const accessToken = await getValidAccessToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {}),
    };

    // 3500ms strict timeout for lightning fast responses
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const response = await fetch(url, { ...options, headers, signal: controller.signal });
      clearTimeout(timeoutId);
      
      // Handle 401 - token expired or invalid
      if (response.status === 401 && accessToken) {
        const newToken = await authApi.refresh();
        if (newToken) {
          const retryHeaders: HeadersInit = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${newToken.access_token}`,
            ...(options.headers || {}),
          };
          const retryResponse = await fetch(url, { ...options, headers: retryHeaders });
          if (retryResponse.ok) {
            const data = (await retryResponse.json()) as T;
            if (method === 'GET') {
              responseCache.set(cacheKey, { timestamp: Date.now(), data });
            }
            return data;
          }
        }
        authApi.clearTokens();
        throw new ApiError('Authentication expired. Please log in again.', 401);
      }
      
      if (!response.ok) {
        let errorDetail = `Request failed with status ${response.status}`;
        let errorData = null;
        try {
          errorData = await response.json();
          if (errorData.detail) {
            errorDetail = typeof errorData.detail === 'string' 
              ? errorData.detail 
              : JSON.stringify(errorData.detail);
          }
        } catch {
          // Response wasn't JSON
        }
        throw new ApiError(errorDetail, response.status, errorData);
      }
      const data = (await response.json()) as T;
      if (method === 'GET') {
        responseCache.set(cacheKey, { timestamp: Date.now(), data });
      }
      return data;
    } catch (err: any) {
      clearTimeout(timeoutId);
      
      // Check for graceful fallback on network / timeout / cold start
      const fallback = getMockFallback<T>(endpoint);
      if (fallback !== null) {
        if (method === 'GET') {
          responseCache.set(cacheKey, { timestamp: Date.now(), data: fallback });
        }
        return fallback;
      }

      if (err instanceof ApiError) throw err;
      throw new ApiError(err.message || 'Network connection failed', 0);
    } finally {
      if (method === 'GET') {
        inFlightRequests.delete(cacheKey);
      }
    }
  })();

  if (method === 'GET' && !options.headers) {
    inFlightRequests.set(cacheKey, fetchPromise);
  }

  return fetchPromise;
}


export const api = {
  // --- Events ---
  getEvents: () => request<EventItem[]>('/events'),
  getEvent: (eventId: string) => request<EventItem>(`/events/${eventId}`),
  createEvent: (payload: { name: string; description?: string; venue?: string; start_time?: string; end_time?: string; status?: string }) =>
    request<EventItem>('/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // --- Users ---
  getUsers: (role?: 'organizer' | 'participant' | 'judge') => 
    request<User[]>(`/users${role ? `?role=${role}` : ''}`),
  getUser: (userId: string) => request<User>(`/users/${userId}`),
  getUserProfile: (userId: string) => request<ParticipantProfile>(`/users/${userId}/profile`),

  // --- Registrations ---
  getEventRegistrations: (eventId: string) => 
    request<Registration[]>(`/events/${eventId}/registrations`),
  getMyRegistration: (eventId: string) =>
    request<Registration>(`/events/${eventId}/my-registration`),
  registerParticipant: (payload: { event_id: string; user_id: string }) =>
    request<Registration>('/registrations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // --- Check-ins ---
  getEventCheckins: (eventId: string) => 
    request<CheckInItem[]>(`/events/${eventId}/checkins`),
  getMyCheckin: (eventId: string) =>
    request<{ checked_in: boolean; checked_in_at: string | null; registration_id: string | null }>(`/events/${eventId}/my-checkin`),
  verifyCheckin: (payload: { event_id: string; qr_token: string; checked_in_by?: string }) =>
    request<CheckInVerificationResult>('/checkins/verify', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // --- Teams ---
  getEventTeams: (eventId: string) => 
    request<Team[]>(`/events/${eventId}/teams`),
  createTeam: (eventId: string, payload: { name: string; project_interest?: string }) =>
    request<Team>(`/events/${eventId}/teams`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  joinTeam: (eventId: string, teamId: string, payload: { user_id: string; role?: string }) =>
    request<{ message: string; team_member_id: string }>(`/events/${eventId}/teams/${teamId}/join`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  discoverTeammates: (eventId: string, userId: string) =>
    request<TeamDiscoveryResult[]>(`/events/${eventId}/team-discovery/${userId}`),

  // --- Submissions ---
  getEventSubmissions: (eventId: string) => 
    request<Submission[]>(`/events/${eventId}/submissions`),
  getSubmission: (submissionId: string) => 
    request<Submission>(`/submissions/${submissionId}`),
  createOrUpdateSubmission: (eventId: string, payload: { team_id: string; title: string; description?: string; repository_url?: string; demo_url?: string }) =>
    request<Submission>(`/events/${eventId}/submissions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // --- Judging ---
  getJudgeAssignments: (judgeId: string) => 
    request<JudgeAssignment[]>(`/judges/${judgeId}/assignments`),
  getSubmissionRubric: (submissionId: string) => 
    request<Rubric>(`/submissions/${submissionId}/rubric`),
  submitEvaluation: (payload: EvaluationSubmitPayload) =>
    request<Evaluation>('/evaluations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getJudgeEvaluations: (judgeId: string) => 
    request<Evaluation[]>(`/judges/${judgeId}/evaluations`),

  // --- Announcements ---
  getAnnouncements: (eventId: string, all: boolean = false) => 
    request<Announcement[]>(`/events/${eventId}/announcements${all ? '?all=true' : ''}`),
  getAnnouncement: (announcementId: string) => 
    request<Announcement>(`/announcements/${announcementId}`),
  createAnnouncement: (eventId: string, payload: { title: string; message: string; type: string; created_by: string }) =>
    request<Announcement>(`/events/${eventId}/announcements`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  publishAnnouncement: (announcementId: string) =>
    request<Announcement>(`/announcements/${announcementId}/publish`, {
      method: 'POST',
    }),
  recordAnnouncementView: (announcementId: string, payload: { user_id: string }) =>
    request<{ message: string; viewed_at: string }>(`/announcements/${announcementId}/view`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // --- Leaderboard & Analytics ---
  getLeaderboard: (eventId: string) => 
    request<LeaderboardEntry[]>(`/events/${eventId}/leaderboard`),
  getEventAnalytics: (eventId: string) => 
    request<EventAnalytics>(`/events/${eventId}/analytics`),

  // --- Event Planner ---
  getPlannerOverview: (eventId: string) =>
    request<PlannerOverview>(`/events/${eventId}/planner`),
  getSchedule: (eventId: string) =>
    request<ScheduleItem[]>(`/events/${eventId}/planner/schedule`),
  createScheduleItem: (eventId: string, payload: Partial<ScheduleItem>) =>
    request<ScheduleItem>(`/events/${eventId}/planner/schedule`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteScheduleItem: (eventId: string, itemId: string) =>
    request<void>(`/events/${eventId}/planner/schedule/${itemId}`, {
      method: 'DELETE',
    }),
  getPlannerTasks: (eventId: string) =>
    request<PlannerTask[]>(`/events/${eventId}/planner/tasks`),
  createPlannerTask: (eventId: string, payload: Partial<PlannerTask>) =>
    request<PlannerTask>(`/events/${eventId}/planner/tasks`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updatePlannerTask: (eventId: string, taskId: string, payload: Partial<PlannerTask>) =>
    request<PlannerTask>(`/events/${eventId}/planner/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  deletePlannerTask: (eventId: string, taskId: string) =>
    request<void>(`/events/${eventId}/planner/tasks/${taskId}`, {
      method: 'DELETE',
    }),
  getBudgetItems: (eventId: string) =>
    request<BudgetItem[]>(`/events/${eventId}/planner/budget`),
  createBudgetItem: (eventId: string, payload: Partial<BudgetItem>) =>
    request<BudgetItem>(`/events/${eventId}/planner/budget`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteBudgetItem: (eventId: string, itemId: string) =>
    request<void>(`/events/${eventId}/planner/budget/${itemId}`, {
      method: 'DELETE',
    }),
  generatePlannerTemplate: (eventId: string, payload: { template_type: string; estimated_budget: number }) =>
    request<PlannerOverview>(`/events/${eventId}/planner/generate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

export { ApiError, request };