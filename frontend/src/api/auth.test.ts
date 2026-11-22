import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authApi } from './auth';
import { clearApiCache } from './client';

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('authApi session robustness', () => {
  beforeEach(() => {
    localStorage.clear();
    clearApiCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('demo login falls back to a named demo persona when the backend is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')));
    await authApi.login({ email: 'alex.rivera@techhive.com', password: 'demo123' });
    const user = authApi.getStoredUser();
    expect(user?.name).toBe('Alex Rivera');
    expect(user?.role).toBe('organizer');
  });

  it('never recurses on refresh: a rejected demo token fails in bounded time', async () => {
    // Backend is up and rejects the demo token with 401 everywhere. Before
    // the fix, /auth/me -> 401 -> refresh -> /auth/refresh 401 -> refresh ->
    // ... recursed forever and hung the page on a loading spinner.
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/auth/login')) {
        return jsonResponse({ detail: 'Invalid email or password' }, 401);
      }
      return jsonResponse({ detail: 'Invalid token' }, 401);
    });
    vi.stubGlobal('fetch', fetchMock);

    await authApi.login({ email: 'alex.rivera@techhive.com', password: 'demo123' });
    const user = await Promise.race([
      authApi.getMe(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('getMe hung')), 2000)),
    ]);

    // The demo session survives via the stored-user fallback.
    expect((user as any)?.email).toBe('alex.rivera@techhive.com');
    // No unbounded refresh loop: bounded number of backend calls.
    expect(fetchMock.mock.calls.length).toBeLessThan(10);
  });

  it('clears the session when refresh is rejected instead of looping', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ detail: 'Invalid token' }, 401))
    );
    authApi.storeTokens('stale-access', 'stale-refresh', {
      id: 'u-1',
      name: 'Stale User',
      email: 'stale@example.com',
      role: 'participant',
      avatar_url: null,
      created_at: '',
      updated_at: '',
    });

    const result = await authApi.refresh();
    expect(result).toBeNull();
    expect(authApi.getAccessToken()).toBeNull();
    expect(authApi.getStoredUser()).toBeNull();
  });

  it('does not write a phantom blank user when storing tokens without a user', () => {
    authApi.storeTokens('a', 'b');
    expect(authApi.getStoredUser()).toBeNull();
  });

  it('keeps the existing user when tokens are stored without one', () => {
    const user = {
      id: 'u-1',
      name: 'Alex Rivera',
      email: 'alex.rivera@techhive.com',
      role: 'organizer' as const,
      avatar_url: null,
      created_at: '',
      updated_at: '',
    };
    authApi.storeTokens('a', 'b', user);
    authApi.storeTokens('c', 'd');
    expect(authApi.getStoredUser()?.name).toBe('Alex Rivera');
    expect(authApi.getAccessToken()).toBe('c');
  });
});

describe('authApi.isDemoSession', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('is false without a session and true for an offline demo session', () => {
    expect(authApi.isDemoSession()).toBe(false);
    authApi.storeTokens('demo-token-organizer-123', 'demo-token-organizer-123', {
      id: 'u-1',
      name: 'Alex Rivera',
      email: 'alex.rivera@techhive.com',
      role: 'organizer',
      avatar_url: null,
      created_at: '',
      updated_at: '',
    });
    expect(authApi.isDemoSession()).toBe(true);
    authApi.storeTokens('real-jwt', 'real-refresh');
    expect(authApi.isDemoSession()).toBe(false);
  });
});
