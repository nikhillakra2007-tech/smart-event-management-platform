import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api, clearApiCache } from './client';
import { getDemoModeState, resetDemoMode } from './demoMode';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('api client offline fallback visibility', () => {
  beforeEach(() => {
    clearApiCache();
    resetDemoMode();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('serves sample events when the backend is unreachable and marks demo mode', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')));
    const events = await api.getEvents();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].name).toBe('HackHive 2026');
    expect(getDemoModeState().mockDataActive).toBe(true);
    expect(getDemoModeState().fallbackEndpoints).toContain('/events');
  });

  it('marks demo mode when the request times out (abort)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('The operation was aborted', 'AbortError'))
    );
    const leaderboard = await api.getLeaderboard('00000000-0000-0000-0000-000000000001');
    expect(leaderboard.length).toBeGreaterThan(0);
    expect(getDemoModeState().mockDataActive).toBe(true);
  });

  it('does not mark demo mode when the backend answers', async () => {
    const liveEvents = [
      {
        id: 'live-1',
        name: 'Real Event From Backend',
        description: null,
        venue: null,
        start_time: null,
        end_time: null,
        status: 'active',
        created_at: '2026-11-01T00:00:00Z',
        updated_at: '2026-11-01T00:00:00Z',
      },
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(liveEvents)));
    const events = await api.getEvents();
    expect(events[0].name).toBe('Real Event From Backend');
    expect(getDemoModeState().mockDataActive).toBe(false);
  });

  it('propagates API errors for endpoints without a sample-data fallback', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connection refused')));
    // /users has no mock fallback entry, so the error must surface.
    await expect(api.getUsers()).rejects.toThrow();
  });
});

describe('api client cold-start resilience', () => {
  beforeEach(() => {
    clearApiCache();
    resetDemoMode();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retries a GET once before serving sample data when the API is cold-starting', async () => {
    const liveEvents = [
      {
        id: 'live-1',
        name: 'Real Event After Wake',
        description: null,
        venue: null,
        start_time: null,
        end_time: null,
        status: 'active',
        created_at: '2026-11-01T00:00:00Z',
        updated_at: '2026-11-01T00:00:00Z',
      },
    ];
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new DOMException('The operation was aborted', 'AbortError'))
      .mockResolvedValueOnce(jsonResponse(liveEvents));
    vi.stubGlobal('fetch', fetchMock);
    const events = await api.getEvents();
    expect(events[0].name).toBe('Real Event After Wake');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getDemoModeState().mockDataActive).toBe(false);
  });

  it('serves labeled sample data only after the patient GET retry also fails', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('connection refused'));
    vi.stubGlobal('fetch', fetchMock);
    const teams = await api.getEventTeams('00000000-0000-0000-0000-000000000001');
    expect(teams.length).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(getDemoModeState().mockDataActive).toBe(true);
  });

  it('never fakes a failed write as sample data and reports the change was not saved', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('connection refused'));
    vi.stubGlobal('fetch', fetchMock);
    // POST /events/{id}/announcements previously returned MOCK_ANNOUNCEMENTS
    // as if the announcement had been created.
    await expect(
      api.createAnnouncement('00000000-0000-0000-0000-000000000001', {
        title: 'Test',
        message: 'Hello',
        type: 'general',
        created_by: 'Tester',
      })
    ).rejects.toThrow(/not saved/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getDemoModeState().mockDataActive).toBe(false);
  });

  it('fails a write fast with a clear error even when the endpoint has sample data', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('connection refused'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(
      api.createEvent({ name: 'Should Not Save' })
    ).rejects.toThrow(/not saved/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
