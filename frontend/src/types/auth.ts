/** Authentication types for frontend. */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'organizer' | 'participant' | 'judge';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}