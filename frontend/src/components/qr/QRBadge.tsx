import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Registration, User, ParticipantProfile } from '../../types/api';
import { Badge } from '../common/Badge';
import { Check, Copy, QrCode, ShieldCheck, Sparkles } from 'lucide-react';
import clsx from 'clsx';

interface QRBadgeProps {
  registration: Registration;
  user: User;
  profile?: ParticipantProfile | null;
  isCheckedIn?: boolean;
}

export const QRBadge: React.FC<QRBadgeProps> = ({
  registration,
  user,
  profile,
  isCheckedIn = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(registration.qr_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-sm mx-auto rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 via-surface to-surface border border-slate-700/60 shadow-2xl relative">
      {/* Badge Top Header */}
      <div className="bg-gradient-to-r from-indigo-900/80 via-indigo-600/50 to-cyan-900/80 p-4 border-b border-indigo-500/30 text-center relative">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono tracking-widest text-indigo-300 uppercase font-bold">
            HACKHIVE 2026 PASS
          </span>
          <Badge variant={isCheckedIn ? 'success' : 'warning'} size="sm" dot>
            {isCheckedIn ? 'Checked In' : 'Confirmed'}
          </Badge>
        </div>
      </div>

      {/* Main Badge Body */}
      <div className="p-6 flex flex-col items-center text-center space-y-4">
        {/* User Info */}
        <div className="space-y-1">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 shadow-lg mx-auto mb-2">
            <div className="w-full h-full rounded-full bg-surface flex items-center justify-center text-xl font-bold text-white">
              {user.name.charAt(0)}
            </div>
          </div>
          <h2 className="text-lg font-extrabold text-white tracking-tight">{user.name}</h2>
          <p className="text-xs text-slate-400 font-mono">{user.email}</p>
          <div className="pt-1">
            <span className="text-[11px] font-mono font-bold text-indigo-400 bg-indigo-950/60 px-2.5 py-1 rounded-md border border-indigo-800/50">
              {registration.registration_number}
            </span>
          </div>
        </div>

        {/* QR Code Canvas */}
        <div className="p-3.5 bg-white rounded-xl shadow-inner border border-slate-300 my-1">
          <QRCodeSVG
            value={registration.qr_token}
            size={160}
            level="H"
            includeMargin={false}
          />
        </div>

        {/* QR Token copy snippet */}
        <div className="w-full space-y-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
            Verification Token
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-[11px] text-slate-300">
            <span className="truncate pr-2">{registration.qr_token}</span>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
              title="Copy token to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Skills Tags */}
        {profile && profile.skills && profile.skills.length > 0 && (
          <div className="w-full pt-2 border-t border-surface-border">
            <div className="text-[10px] text-slate-400 uppercase font-semibold mb-2">Participant Skills</div>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {profile.skills.slice(0, 4).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 text-[10px] rounded-md bg-surface-lighter text-slate-300 border border-surface-border"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Badge Bottom Security Stripe */}
      <div className="px-4 py-2.5 bg-surface-lighter/50 border-t border-surface-border flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span>Cryptographically Verified QR</span>
      </div>
    </div>
  );
};
