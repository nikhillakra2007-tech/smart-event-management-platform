/**
 * Centralized Type-Safe API Client for Smart Event Management Platform.
 * All HTTP requests flow through this module.
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

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

/** Get valid access token, refreshing if needed */
async function getValidAccessToken(): Promise<string | null> {
  const accessToken = authApi.getAccessToken();
  if (!accessToken) return null;

  // For now, return the token as-is. Refresh logic can be added later if needed.
  return accessToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const accessToken = await getValidAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    // Handle 401 - token expired or invalid
    if (response.status === 401 && accessToken) {
      // Try to refresh token once
      const newToken = await authApi.refresh();
      if (newToken) {
        // Retry with new token
        const retryHeaders: HeadersInit = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken.access_token}`,
          ...(options.headers || {}),
        };
        const retryResponse = await fetch(url, { ...options, headers: retryHeaders });
        if (retryResponse.ok) {
          return (await retryResponse.json()) as T;
        }
      }
      // Refresh failed or retry failed - clear auth and throw
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
    return (await response.json()) as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Network connection failed', 0);
  }
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
};

export { ApiError, request };