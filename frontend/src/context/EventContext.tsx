import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { EventItem } from '../types/api';
import { api } from '../api/client';

interface EventContextType {
  events: EventItem[];
  currentEvent: EventItem | null;
  setCurrentEvent: (event: EventItem) => void;
  loading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [currentEvent, setCurrentEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getEvents();
      setEvents(data);
      if (data.length > 0 && !currentEvent) {
        // Default to the first active event or first event
        const active = data.find((e) => e.status === 'active') || data[0];
        setCurrentEvent(active);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <EventContext.Provider
      value={{
        events,
        currentEvent,
        setCurrentEvent,
        loading,
        error,
        refreshEvents: fetchEvents,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export const useEvent = (): EventContextType => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
};
