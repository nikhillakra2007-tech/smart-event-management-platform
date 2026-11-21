/**
 * Demo-data visibility state.
 *
 * When the backend is unreachable the API client silently served built-in
 * sample data (the "HackHive 2026" dataset), so screens looked live while
 * showing fictional events, registrations, leaderboards and analytics. This
 * module records whenever that fallback fires so the UI can label it.
 *
 * The fallback itself stays: it keeps the deployed demo explorable without a
 * running backend. What changes is that it is no longer invisible — the app
 * shows a persistent "sample data" banner whenever any response on screen
 * came from the fallback instead of the backend.
 */

export interface DemoModeState {
  /** True once any API response has been served from the offline fallback. */
  mockDataActive: boolean;
  /** Endpoints that fell back to sample data (for diagnostics). */
  fallbackEndpoints: string[];
}

type Listener = (state: DemoModeState) => void;

let state: DemoModeState = { mockDataActive: false, fallbackEndpoints: [] };
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) {
    listener(state);
  }
}

/** Record that a response was served from the offline sample-data fallback. */
export function markMockDataServed(endpoint: string): void {
  if (state.fallbackEndpoints.includes(endpoint)) {
    return;
  }
  state = {
    mockDataActive: true,
    fallbackEndpoints: [...state.fallbackEndpoints, endpoint],
  };
  emit();
}

/** Current demo-mode state (immutable snapshot). */
export function getDemoModeState(): DemoModeState {
  return state;
}

/** Subscribe to demo-mode changes. Returns an unsubscribe function. */
export function subscribeDemoMode(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Reset demo-mode state. Used when the user retries the connection, and by
 * tests.
 */
export function resetDemoMode(): void {
  state = { mockDataActive: false, fallbackEndpoints: [] };
  emit();
}
