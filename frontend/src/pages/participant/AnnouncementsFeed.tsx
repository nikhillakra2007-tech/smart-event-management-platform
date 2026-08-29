import React, { useState, useEffect, useCallback } from 'react';
import { useEvent } from '../../context/EventContext';
import { useAuth } from '../../context/AuthContext';
import { useLivePolling } from '../../hooks/useLivePolling';
import { api } from '../../api/client';
import { Announcement } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Megaphone,
  AlertTriangle,
  Clock,
  MapPin,
  Info,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';

export const AnnouncementsFeed: React.FC = () => {
  const { currentEvent } = useEvent();
  const { user } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    if (!currentEvent) return;
    try {
      const data = await api.getAnnouncements(currentEvent.id, false); // published only
      setAnnouncements(data);

      // Record views for active participant
      if (user) {
        data.forEach((ann) => {
          api.recordAnnouncementView(ann.id, { user_id: user.id }).catch(() => {});
        });
      }
    } catch (err) {
      console.error('Failed to load announcements', err);
    } finally {
      setLoading(false);
    }
  }, [currentEvent, user]);

  useLivePolling(fetchAnnouncements, 6000, Boolean(currentEvent));

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'schedule':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'venue':
        return <MapPin className="w-4 h-4 text-violet-400" />;
      default:
        return <Info className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-cyan-400" />
            <span>Event Broadcast Bulletin</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time notifications, schedule adjustments, and critical organizer announcements.
          </p>
        </div>

        <Badge variant="cyan" size="lg" dot>
          {announcements.length} Live Broadcasts
        </Badge>
      </div>

      {loading && announcements.length === 0 ? (
        <CardSkeleton rows={5} />
      ) : announcements.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No Announcements Yet"
          description="Check back later for event updates and schedule alerts."
        />
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const isCritical = ann.type === 'critical';
            return (
              <Card
                key={ann.id}
                className={clsx(
                  'p-5 space-y-3 transition-all',
                  isCritical
                    ? 'border-rose-700/60 bg-gradient-to-r from-rose-950/30 via-surface to-surface'
                    : 'hover:border-slate-600'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-surface-lighter border border-surface-border mt-0.5">
                      {getTypeIcon(ann.type)}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">{ann.title}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={
                            isCritical
                              ? 'critical'
                              : ann.type === 'venue'
                              ? 'purple'
                              : ann.type === 'schedule'
                              ? 'warning'
                              : 'cyan'
                          }
                          size="sm"
                        >
                          {ann.type}
                        </Badge>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(ann.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pl-11">
                  {ann.message}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
