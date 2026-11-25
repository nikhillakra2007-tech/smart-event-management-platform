import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EventsManager } from './EventsManager';

const { setCurrentEvent, refreshEvents, demoEvents } = vi.hoisted(() => {
  const setCurrentEvent = vi.fn();
  const refreshEvents = vi.fn().mockResolvedValue(undefined);
  const demoEvents = [
  {
    id: 'evt-1',
    name: 'HackHive 2026',
    description: 'Flagship hackathon',
    venue: 'Bengaluru',
    start_time: '2026-10-10T09:00:00Z',
    end_time: '2026-10-12T18:00:00Z',
    status: 'active',
    created_at: '',
    updated_at: '',
  },
  {
    id: 'evt-2',
    name: 'CloudScale Summit 2026',
    description: null,
    venue: 'Hyderabad',
    start_time: null,
    end_time: null,
    status: 'draft',
    created_at: '',
    updated_at: '',
  },
  ];
  return { setCurrentEvent, refreshEvents, demoEvents };
});

vi.mock('../../context/EventContext', () => ({
  useEvent: () => ({
    events: demoEvents,
    currentEvent: demoEvents[0],
    setCurrentEvent,
    loading: false,
    refreshEvents,
  }),
}));

vi.mock('../../components/organizer/CreateEventModal', () => ({
  CreateEventModal: () => null,
}));

vi.mock('../../api/client', () => ({
  api: {
    updateEvent: vi.fn().mockResolvedValue({ ...demoEvents[1], status: 'active' }),
  },
}));

import { api } from '../../api/client';

describe('EventsManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists every event with status, dates and venue, and marks the current one', () => {
    render(
      <MemoryRouter>
        <EventsManager />
      </MemoryRouter>
    );
    expect(screen.getByText('HackHive 2026')).toBeInTheDocument();
    expect(screen.getByText('CloudScale Summit 2026')).toBeInTheDocument();
    expect(screen.getByText('Current event')).toBeInTheDocument();
    expect(screen.getByText(/Bengaluru/)).toBeInTheDocument();
    expect(screen.getByText(/2 events on this platform/)).toBeInTheDocument();
  });

  it('switches the current event without any network call', () => {
    render(
      <MemoryRouter>
        <EventsManager />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText('Set as current'));
    expect(setCurrentEvent).toHaveBeenCalledWith(demoEvents[1]);
    expect(api.updateEvent).not.toHaveBeenCalled();
  });

  it('updates an event status through the API and refreshes the list', async () => {
    render(
      <MemoryRouter>
        <EventsManager />
      </MemoryRouter>
    );
    const select = screen.getByLabelText('Status', { selector: '#status-evt-2' });
    fireEvent.change(select, { target: { value: 'active' } });
    await waitFor(() =>
      expect(api.updateEvent).toHaveBeenCalledWith('evt-2', { status: 'active' })
    );
    expect(refreshEvents).toHaveBeenCalled();
  });
});
