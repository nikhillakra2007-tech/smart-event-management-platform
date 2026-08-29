import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { useUserRole } from '../../context/UserRoleContext';
import { api } from '../../api/client';
import { Registration } from '../../types/api';
import { QRBadge } from '../../components/qr/QRBadge';
import { CardSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { QrCode, ShieldCheck, Info } from 'lucide-react';
import { Card } from '../../components/common/Card';

export const MyPassBadge: React.FC = () => {
  const { currentEvent } = useEvent();
  const { currentUser, currentProfile } = useUserRole();

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentEvent || !currentUser) return;
    const fetchPass = async () => {
      try {
        setLoading(true);
        const [regs, checkins] = await Promise.all([
          api.getEventRegistrations(currentEvent.id),
          api.getEventCheckins(currentEvent.id),
        ]);
        const myReg = regs.find((r) => r.user_id === currentUser.id);
        setRegistration(myReg || null);

        const myCheckin = checkins.find((c) => c.user_id === currentUser.id);
        setIsCheckedIn(myCheckin?.checked_in ?? false);
      } catch (err) {
        console.error('Failed to load pass badge', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPass();
  }, [currentEvent, currentUser]);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
          <QrCode className="w-6 h-6 text-indigo-400" />
          <span>Official Event Attendee Pass</span>
        </h1>
        <p className="text-xs text-slate-400">
          Present this verified QR code at registration check-in desks for venue admission.
        </p>
      </div>

      {loading ? (
        <CardSkeleton rows={6} />
      ) : !registration || !currentUser ? (
        <EmptyState
          icon={QrCode}
          title="No Registration Found"
          description="You are not registered for this event yet."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {/* Badge Preview */}
          <div className="md:col-span-2">
            <QRBadge
              registration={registration}
              user={currentUser}
              profile={currentProfile}
              isCheckedIn={isCheckedIn}
            />
          </div>

          {/* Instructions Card */}
          <Card className="p-5 space-y-4 text-xs">
            <div className="flex items-center gap-2 font-bold text-white uppercase tracking-wider text-[11px]">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Badge Information</span>
            </div>

            <div className="space-y-3 text-slate-300">
              <p>
                • Your QR code encodes a unique, cryptographically generated token (<span className="font-mono text-indigo-300">{registration.qr_token.slice(0, 10)}...</span>).
              </p>
              <p>
                • Once verified by an organizer, attendance status automatically switches from <span className="text-amber-400 font-semibold">Confirmed</span> to <span className="text-emerald-400 font-semibold">Checked In</span>.
              </p>
              <p>
                • You can test on-site verification yourself using the <span className="text-indigo-400 font-semibold">Check-in Simulator</span> in the sidebar.
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
