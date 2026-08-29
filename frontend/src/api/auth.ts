/** Authentication API calls. */

import { request } from './client';
import type { LoginRequest, TokenResponse, AuthUser } from '../types/auth';

const AUTH_STORAGE_KEY = 'auth_tokens';

interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const authApi = {
  /** Login with email and password */
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store tokens
    this.storeTokens(response.access_token, response.refresh_token);
    return response;
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
      return await request<AuthUser>('/auth/me', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
    } catch {
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