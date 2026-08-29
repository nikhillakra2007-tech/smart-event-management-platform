import React, { useState, useEffect, useCallback } from 'react';
import { useEvent } from '../../context/EventContext';
import { useUserRole } from '../../context/UserRoleContext';
import { useLivePolling } from '../../hooks/useLivePolling';
import { api } from '../../api/client';
import { Announcement } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Megaphone,
  Send,
  Radio,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Info,
  Plus,
} from 'lucide-react';
import clsx from 'clsx';

export const AnnouncementStudio: React.FC = () => {
  const { currentEvent } = useEvent();
  const { currentUser } = useUserRole();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'published' | 'drafts'>('published');

  // New Announcement Form
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'general' | 'schedule' | 'venue' | 'critical'>('general');
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    if (!currentEvent) return;
    try {
      const data = await api.getAnnouncements(currentEvent.id, true);
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to load announcements', err);
    } finally {
      setLoading(false);
    }
  }, [currentEvent]);

  useLivePolling(fetchAnnouncements, 5000, Boolean(currentEvent));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent || !currentUser || !title.trim() || !message.trim()) return;

    try {
      setCreating(true);
      setActionError(null);

      await api.createAnnouncement(currentEvent.id, {
        title: title.trim(),
        message: message.trim(),
        type,
        created_by: currentUser.id,
      });

      setTitle('');
      setMessage('');
      setActiveTab('drafts');
      fetchAnnouncements();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create announcement');
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async (announcementId: string) => {
    try {
      await api.publishAnnouncement(announcementId);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Failed to publish announcement');
    }
  };

  const published = announcements.filter((a) => a.is_published);
  const drafts = announcements.filter((a) => !a.is_published);
  const displayedList = activeTab === 'published' ? published : drafts;

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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-surface-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-400" />
            <span>Broadcast Studio & Announcements</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Publish event alerts, venue updates, and schedule announcements directly to attendee dashboards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="cyan" size="lg">
            {published.length} Published
          </Badge>
          <Badge variant="warning" size="lg">
            {drafts.length} Drafts
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create Broadcast Form */}
        <Card className="lg:col-span-1 p-5 sm:p-6 space-y-4 h-fit">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Plus className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white tracking-tight">Compose Announcement</h2>
          </div>

          {actionError && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              {actionError}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Headline Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Workshop moved to Room C"
                required
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter border border-surface-border text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Broadcast Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-surface-lighter border border-surface-border text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="general">General Broadcast</option>
                <option value="schedule">Schedule Update</option>
                <option value="venue">Venue Notice</option>
                <option value="critical">Critical Urgent Alert</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Message Body
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Details of the announcement..."
                required
                className="w-full p-3 rounded-xl bg-surface-lighter border border-surface-border text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={creating || !title.trim() || !message.trim()}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-glow-indigo transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{creating ? 'Saving Draft...' : 'Save Draft Announcement'}</span>
            </button>
          </form>
        </Card>

        {/* Right Column: Broadcasts Feed & Publish Actions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 p-1 rounded-xl bg-surface border border-surface-border w-fit">
            <button
              onClick={() => setActiveTab('published')}
              className={clsx(
                'px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                activeTab === 'published'
                  ? 'bg-surface-lighter text-white shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Published Feed ({published.length})
            </button>
            <button
              onClick={() => setActiveTab('drafts')}
              className={clsx(
                'px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                activeTab === 'drafts'
                  ? 'bg-surface-lighter text-white shadow-sm border border-white/10'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              Drafts Awaiting Approval ({drafts.length})
            </button>
          </div>

          {/* List */}
          {loading ? (
            <CardSkeleton rows={4} />
          ) : displayedList.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title={activeTab === 'published' ? 'No Published Announcements' : 'No Drafts Available'}
              description={
                activeTab === 'published'
                  ? 'Publish drafts to make them visible to all participants and judges.'
                  : 'Create a new draft using the studio on the left.'
              }
            />
          ) : (
            <div className="space-y-3">
              {displayedList.map((ann) => (
                <Card
                  key={ann.id}
                  className={clsx(
                    'p-5 space-y-3 transition-colors',
                    ann.type === 'critical' ? 'border-rose-900/60 bg-rose-950/20' : ''
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 rounded-lg bg-surface-lighter border border-surface-border mt-0.5">
                        {getTypeIcon(ann.type)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">{ann.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              ann.type === 'critical'
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
                          <span className="text-[11px] font-mono text-slate-500">
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

                    {/* Publish Action if Draft */}
                    {!ann.is_published ? (
                      <button
                        onClick={() => handlePublish(ann.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-glow-emerald transition-all shrink-0"
                      >
                        Publish Now
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-surface-lighter px-2.5 py-1 rounded-lg border border-surface-border">
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{ann.view_count} views</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed pl-10">
                    {ann.message}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
