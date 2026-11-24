import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { OrganizerDashboard } from './OrganizerDashboard';

vi.mock('../../context/EventContext', () => ({
  useEvent: () => ({
    currentEvent: {
      id: 'evt-1',
      name: 'HackHive 2026',
      description: null,
      venue: 'Tech Innovation Centre, Bengaluru',
      start_time: '2026-10-10T09:00:00Z',
      end_time: '2026-10-12T18:00:00Z',
      status: 'active',
      created_at: '',
      updated_at: '',
    },
  }),
}));

vi.mock('../../hooks/useLivePolling', async () => {
  const React = await import('react');
  return {
    useLivePolling: (fn: () => void) => {
      // fire once, no interval
      // eslint-disable-next-line react-hooks/rules-of-hooks
      React.useEffect(() => { void fn(); }, [fn]);
    },
  };
});

vi.mock('../../api/client', () => ({
  api: {
    getEventAnalytics: vi.fn().mockResolvedValue({
      event_id: 'evt-1',
      total_registrations: 40,
      checked_in_count: 30,
      not_checked_in_count: 10,
      check_in_percentage: 75,
      teams_formed: 10,
      submissions_count: 10,
      evaluated_submissions: 8,
      average_score: 84.6,
      attendance_over_time: [{ hour: '08:00', count: 4 }],
      score_distribution: [{ range: '80-89', count: 4 }],
      announcement_stats: [],
      total_announcement_views: 99,
    }),
    getLeaderboard: vi.fn().mockResolvedValue([]),
    getAnnouncements: vi.fn().mockResolvedValue([]),
  },
}));

describe('OrganizerDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows event context (status, dates, venue) in the header and renders the new charts', async () => {
    render(
      <MemoryRouter>
        <OrganizerDashboard />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByText('Check-in Curve')).toBeInTheDocument()
    );
    expect(screen.getByText('Score Distribution')).toBeInTheDocument();
    expect(screen.getAllByText(/HackHive 2026/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Tech Innovation Centre, Bengaluru/)).toBeInTheDocument();
    expect(screen.getByText(/Oct 10 - Oct 12/)).toBeInTheDocument();
    // the old hardcoded "40 active hackathon participants" subtitle is gone
    expect(screen.queryByText(/40 active hackathon participants/)).not.toBeInTheDocument();
    expect(screen.getByText(/Registered for HackHive 2026/)).toBeInTheDocument();
  });
});
