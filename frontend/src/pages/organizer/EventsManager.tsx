import React, { useState } from 'react';
import { useEvent } from '../../context/EventContext';
import { api } from '../../api/client';
import { EventItem } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { CreateEventModal } from '../../components/organizer/CreateEventModal';
import {
  CalendarDays,
  MapPin,
  PlusCircle,
  CheckCircle2,
  Layers,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';

const STATUS_OPTIONS = ['draft', 'active', 'completed', 'cancelled'] as const;
type EventStatus = (typeof STATUS_OPTIONS)[number];

const statusVariant = (status: string) =>
  status === 'active'
    ? 'success'
    : status === 'completed'
    ? 'purple'
    : status === 'cancelled'
    ? 'critical'
    : 'warning';

const formatDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : null;

export const EventsManager: React.FC = () => {
  const { events, currentEvent, setCurrentEvent, loading, refreshEvents } = useEvent();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleStatusChange = async (event: EventItem, status: EventStatus) => {
    if (status === event.status) return;
    setActionError(null);
    setUpdatingId(event.id);
    try {
      const updated = await api.updateEvent(event.id, { status });
      if (currentEvent?.id === event.id) {
        setCurrentEvent(updated);
      }
      await refreshEvents();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update event status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSetCurrent = (event: EventItem) => {
    setCurrentEvent(event);
  };

  if (loading && events.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            <span>Events Manager</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {events.length} event{events.length === 1 ? '' : 's'} on this platform. The selected event drives
            every dashboard, planner and leaderboard view.
          </p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-bold shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Event</span>
        </button>
      </div>

      {actionError && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((event) => {
          const isCurrent = currentEvent?.id === event.id;
          const start = formatDate(event.start_time);
          const end = formatDate(event.end_time);
          return (
            <Card
              key={event.id}
              className={clsx(
                'p-5 space-y-3 transition-colors',
                isCurrent && 'border-indigo-500/60 ring-1 ring-indigo-500/30'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white truncate">{event.name}</h2>
                  {event.description && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {event.description}
                    </p>
                  )}
                </div>
                <Badge variant={statusVariant(event.status)} size="sm" dot>
                  {event.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                {(start || end) && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-slate-500" />
                    {start}
                    {end && end !== start ? ` - ${end}` : ''}
                  </span>
                )}
                {event.venue && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-500" />
                    {event.venue}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-surface-border">
                <div className="flex items-center gap-2">
                  <label htmlFor={`status-${event.id}`} className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Status
                  </label>
                  <select
                    id={`status-${event.id}`}
                    value={event.status}
                    disabled={updatingId === event.id}
                    onChange={(e) => handleStatusChange(event, e.target.value as EventStatus)}
                    className="px-2 py-1 rounded-lg bg-surface-lighter border border-surface-border text-xs text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {updatingId === event.id && (
                    <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  )}
                </div>

                {isCurrent ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Current event
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetCurrent(event)}
                    className="px-2.5 py-1 rounded-lg bg-surface-lighter hover:bg-surface-hover border border-surface-border text-[11px] font-semibold text-slate-200 transition-colors"
                  >
                    Set as current
                  </button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <CreateEventModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
};
