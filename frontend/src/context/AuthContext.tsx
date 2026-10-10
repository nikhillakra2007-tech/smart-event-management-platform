import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth';
import { api } from '../api/client';
import type { AuthUser, AuthState, RegisterRequest } from '../types/auth';
import type { ParticipantProfile } from '../types/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  isOrganizer: boolean;
  isParticipant: boolean;
  isJudge: boolean;
  currentProfile: ParticipantProfile | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [currentProfile, setCurrentProfile] = useState<ParticipantProfile | null>(null);

  const checkAuth = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    const storedUser = authApi.getStoredUser();
    const accessToken = authApi.getAccessToken();
    
    if (storedUser && accessToken) {
      try {
        // Verify token is still valid by calling /me
        const user = await authApi.getMe();
        if (user) {
          setState({
            user,
            accessToken,
            refreshToken: authApi.getRefreshToken(),
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      } catch {
        // Token invalid, will try refresh
      }
    }

    // Try to refresh if we have a refresh token
    const refreshToken = authApi.getRefreshToken();
    if (refreshToken) {
      try {
        const tokens = await authApi.refresh();
        if (tokens) {
          const user = await authApi.getMe();
          if (user) {
            setState({
              user,
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          }
        }
      } catch {
        // Refresh failed
      }
    }

    // No valid auth
    authApi.clearTokens();
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const tokens = await authApi.login({ email, password });
      const user = await authApi.getMe();
      
      if (user) {
        setState({
          user,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error('Failed to get user profile after login');
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const tokens = await authApi.register(data);
      const user = await authApi.getMe();

      if (user) {
        setState({
          user,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        throw new Error('Failed to load user profile after registration');
      }
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setCurrentProfile(null);
    setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Load participant profile if authenticated user is a participant
  useEffect(() => {
    if (state.user && state.user.role === 'participant') {
      api.getUserProfile(state.user.id)
        .then(setCurrentProfile)
        .catch(() => setCurrentProfile(null));
    } else {
      setCurrentProfile(null);
    }
  }, [state.user]);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    checkAuth,
    isOrganizer: state.user?.role === 'organizer',
    isParticipant: state.user?.role === 'participant',
    isJudge: state.user?.role === 'judge',
    currentProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};