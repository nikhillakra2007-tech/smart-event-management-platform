import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDemoModeState,
  markMockDataServed,
  resetDemoMode,
  subscribeDemoMode,
} from './demoMode';

describe('demoMode store', () => {
  beforeEach(() => {
    resetDemoMode();
  });

  it('starts inactive', () => {
    expect(getDemoModeState().mockDataActive).toBe(false);
    expect(getDemoModeState().fallbackEndpoints).toEqual([]);
  });

  it('activates when sample data is served and records the endpoint', () => {
    markMockDataServed('/events');
    const state = getDemoModeState();
    expect(state.mockDataActive).toBe(true);
    expect(state.fallbackEndpoints).toEqual(['/events']);
  });

  it('dedupes repeated fallbacks for the same endpoint', () => {
    markMockDataServed('/events');
    markMockDataServed('/events');
    markMockDataServed('/events/e-1/analytics');
    expect(getDemoModeState().fallbackEndpoints).toEqual([
      '/events',
      '/events/e-1/analytics',
    ]);
  });

  it('notifies subscribers and stops after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeDemoMode(listener);
    markMockDataServed('/events');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].mockDataActive).toBe(true);
    unsubscribe();
    markMockDataServed('/events/e-1/teams');
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('resets to inactive', () => {
    markMockDataServed('/events');
    resetDemoMode();
    expect(getDemoModeState().mockDataActive).toBe(false);
    expect(getDemoModeState().fallbackEndpoints).toEqual([]);
  });
});
