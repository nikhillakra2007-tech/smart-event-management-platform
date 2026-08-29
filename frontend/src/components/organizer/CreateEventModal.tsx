import React, { useState } from 'react';
import { api } from '../../api/client';
import { useEvent } from '../../context/EventContext';
import { Modal } from '../common/Modal';
import { PlusCircle, Calendar, MapPin, FileText, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose }) => {
  const { refreshEvents } = useEvent();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [status, setStatus] = useState<'draft' | 'active' | 'completed' | 'cancelled'>('draft');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Event name is required');
      return;
    }
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      setError('End time must be after start time');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        name: name.trim(),
        status,
      };
      if (description.trim()) payload.description = description.trim();
      if (venue.trim()) payload.venue = venue.trim();
      if (startTime) payload.start_time = new Date(startTime).toISOString();
      if (endTime) payload.end_time = new Date(endTime).toISOString();

      await api.createEvent(payload);
      await refreshEvents();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        // reset form
        setName('');
        setDescription('');
        setVenue('');
        setStartTime('');
        setEndTime('');
        setStatus('draft');
      }, 800);
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Event">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-700/50 text-rose-300 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-700/50 text-emerald-300 flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Event created successfully!</span>
          </div>
        )}

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Event Name <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TechSprint 2027"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-lighter/50 border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
              required
              disabled={isSubmitting || success}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the event..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-lighter/50 border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm resize-none"
            disabled={isSubmitting || success}
          />
        </div>

        {/* Venue */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Venue
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Innovation Hub, Bengaluru"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-lighter/50 border border-surface-border text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
              disabled={isSubmitting || success}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Start Date & Time
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-lighter/50 border border-surface-border text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
                disabled={isSubmitting || success}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              End Date & Time
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-lighter/50 border border-surface-border text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
                disabled={isSubmitting || success}
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="w-full px-3 py-2.5 rounded-xl bg-surface-lighter/50 border border-surface-border text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 text-sm"
            disabled={isSubmitting || success}
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-surface-border text-slate-300 text-sm font-semibold hover:bg-surface-lighter transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || success}
            className={clsx(
              'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all',
              isSubmitting || success
                ? 'bg-indigo-600/50 text-slate-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white hover:from-indigo-500 hover:to-cyan-400 shadow-lg shadow-indigo-500/25'
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Created
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                Create Event
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
