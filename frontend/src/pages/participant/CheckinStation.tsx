import React, { useState, useEffect } from 'react';
import { useEvent } from '../../context/EventContext';
import { useUserRole } from '../../context/UserRoleContext';
import { api } from '../../api/client';
import { Registration, CheckInVerificationResult } from '../../types/api';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import {
  Zap,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const CheckinStation: React.FC = () => {
  const { currentEvent } = useEvent();
  const { currentUser } = useUserRole();

  const [registration, setRegistration] = useState<Registration | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    data?: CheckInVerificationResult;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (!currentEvent || !currentUser) return;
    api.getEventRegistrations(currentEvent.id)
      .then((regs) => {
        const myReg = regs.find((r) => r.user_id === currentUser.id);
        if (myReg) {
          setRegistration(myReg);
          setTokenInput(myReg.qr_token);
        }
      })
      .catch(console.error);
  }, [currentEvent, currentUser]);

  const handleSelfVerify = async () => {
    if (!currentEvent || !tokenInput.trim()) return;

    try {
      setVerifying(true);
      setResult(null);

      const res = await api.verifyCheckin({
        event_id: currentEvent.id,
        qr_token: tokenInput.trim(),
        checked_in_by: currentUser?.id,
      });

      setResult({ success: true, data: res });
    } catch (err: any) {
      setResult({
        success: false,
        error: err.message || 'Check-in verification failed',
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
          <Zap className="w-6 h-6 text-emerald-400" />
          <span>Self-Check-in & QR Verification Station</span>
        </h1>
        <p className="text-xs text-slate-400">
          Simulate on-site QR scanner check-in directly against the FastAPI backend verification engine.
        </p>
      </div>

      <Card className="p-6 space-y-5 bg-gradient-to-br from-surface via-surface to-emerald-950/20 border-emerald-500/30">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
            QR Token to Verify
          </label>
          <div className="relative">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="QR-..."
              className="w-full px-4 py-3 rounded-xl bg-surface-lighter border border-surface-border font-mono text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          {registration && (
            <p className="text-[11px] text-slate-400">
              Auto-filled with active participant ({currentUser?.name}) pass token.
            </p>
          )}
        </div>

        <button
          onClick={handleSelfVerify}
          disabled={verifying || !tokenInput.trim()}
          className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-extrabold text-sm shadow-glow-emerald disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {verifying ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-5 h-5" />
          )}
          <span>Execute QR Check-in Verification</span>
        </button>

        {/* Result Message */}
        {result && (
          <div className="mt-4 animate-fade-in">
            {result.success && result.data ? (
              <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500 text-emerald-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Check-in Verified & Attendance Recorded!</span>
                </div>
                <p className="text-slate-300 pl-7">
                  Participant: <span className="font-semibold text-white">{result.data.participant_name}</span> ({result.data.registration_number})
                </p>
                <p className="text-[11px] text-emerald-400 font-mono pl-7">
                  Timestamp: {new Date(result.data.check_in.checked_in_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-500 text-rose-300 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <p className="font-bold text-white">Check-in Rejected</p>
                  <p className="text-rose-200">{result.error}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
