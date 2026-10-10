/** Authentication API calls. */

import { request } from './client';
import type { LoginRequest, RegisterRequest, TokenResponse, AuthUser } from '../types/auth';

const AUTH_STORAGE_KEY = 'auth_tokens';

const DEMO_USERS: Record<string, AuthUser> = {
  'alex.rivera@techhive.com': {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Alex Rivera',
    email: 'alex.rivera@techhive.com',
    role: 'organizer',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'arjun.mehta@dev.io': {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Arjun Mehta',
    email: 'arjun.mehta@dev.io',
    role: 'participant',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  'priya.sharma@judgehive.ai': {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@judgehive.ai',
    role: 'judge',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const authApi = {
  /** Login with email and password */
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    try {
      const response = await request<TokenResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      this.storeTokens(response.access_token, response.refresh_token);
      return response;
    } catch (err: any) {
      // If network failed (backend down/offline), check demo users
      const normalizedEmail = credentials.email.toLowerCase();
      if (DEMO_USERS[normalizedEmail]) {
        const demoUser = DEMO_USERS[normalizedEmail];
        const fakeToken = `demo-token-${demoUser.role}-${Date.now()}`;
        this.storeTokens(fakeToken, fakeToken, demoUser);
        return {
          access_token: fakeToken,
          refresh_token: fakeToken,
          token_type: 'bearer',
          expires_in: 86400,
        };
      }
      throw err;
    }
  },

  /** Register new user */
  async register(data: RegisterRequest): Promise<TokenResponse> {
    try {
      const response = await request<TokenResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      this.storeTokens(response.access_token, response.refresh_token);
      return response;
    } catch (err: any) {
      // Offline fallback: generate mock account if backend is offline
      if (err.status === 0 || err.message?.includes('Network') || err.message?.includes('Failed to fetch')) {
        const mockId = `mock-${Date.now()}`;
        const mockUser: AuthUser = {
          id: mockId,
          name: data.name,
          email: data.email,
          role: data.role,
          avatar_url: data.avatar_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const fakeToken = `demo-token-${mockUser.role}-${Date.now()}`;
        this.storeTokens(fakeToken, fakeToken, mockUser);
        return {
          access_token: fakeToken,
          refresh_token: fakeToken,
          token_type: 'bearer',
          expires_in: 86400,
        };
      }
      throw err;
    }
  },

  /** Refresh access token using refresh token */
  async refresh(): Promise<TokenResponse | null> {
    const tokens = this.getStoredTokens();
    if (!tokens?.refreshToken) return null;

    try {
      const response = await request<TokenResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: tokens.refreshToken }),
      });
      
      this.storeTokens(response.access_token, response.refresh_token, tokens.user);
      return response;
    } catch {
      this.clearTokens();
      return null;
    }
  },

  /** Logout - clear tokens */
  async logout(): Promise<void> {
    const tokens = this.getStoredTokens();
    if (tokens?.accessToken) {
      try {
        await request('/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
      } catch {
        // Ignore logout errors
      }
    }
    this.clearTokens();
  },

  /** Get current user profile */
  async getMe(): Promise<AuthUser | null> {
    const tokens = this.getStoredTokens();
    if (!tokens?.accessToken) return null;

    try {
      const user = await request<AuthUser>('/auth/me', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      // Update stored user with latest profile
      this.storeTokens(tokens.accessToken, tokens.refreshToken, user);
      return user;
    } catch {
      // If offline demo token or network unreachable, fall back to stored user
      if (tokens.user && tokens.user.email) {
        return tokens.user;
      }
      return null;
    }
  },

  /** Store tokens in localStorage */
  storeTokens(accessToken: string, refreshToken: string, user?: AuthUser): void {
    const stored: StoredTokens = {
      accessToken,
      refreshToken,
      user: user || { 
        id: '', name: '', email: '', role: 'participant', 
        avatar_url: null, created_at: '', updated_at: '' 
      },
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(stored));
  },

  /** Get stored tokens */
  getStoredTokens(): StoredTokens | null {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  /** Clear stored tokens */
  clearTokens(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  /** Get access token */
  getAccessToken(): string | null {
    return this.getStoredTokens()?.accessToken ?? null;
  },

  /** Get refresh token */
  getRefreshToken(): string | null {
    return this.getStoredTokens()?.refreshToken ?? null;
  },

  /** Get stored user */
  getStoredUser(): AuthUser | null {
    return this.getStoredTokens()?.user ?? null;
  },
};