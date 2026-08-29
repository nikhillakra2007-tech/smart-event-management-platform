import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEvent } from '../../context/EventContext';
import { useUserRole } from '../../context/UserRoleContext';
import { Badge } from '../common/Badge';
import { UserRole } from '../../types/api';
import { 
  ShieldCheck, 
  Users, 
  Award, 
  Radio, 
  ChevronDown, 
  Calendar, 
  Check, 
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import clsx from 'clsx';

interface TopbarProps {
  onToggleMobileSidebar: () => void;
  isMobileSidebarOpen: boolean;
}

export const Topbar: React.FC<TopbarProps> = ({ 
  onToggleMobileSidebar, 
  isMobileSidebarOpen 
}) => {
  const { currentEvent, events, setCurrentEvent } = useEvent();
  const { role, setRole, currentUser, setCurrentUser, getUsersByRole } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  const roleConfigs: Record<UserRole, { label: string; icon: React.ReactNode; color: string; defaultPath: string }> = {
    organizer: {
      label: 'Organizer',
      icon: <ShieldCheck className="w-4 h-4 text-indigo-400" />,
      color: 'bg-indigo-950/80 border-indigo-700/60 text-indigo-300',
      defaultPath: '/organizer',
    },
    participant: {
      label: 'Participant',
      icon: <Users className="w-4 h-4 text-cyan-400" />,
      color: 'bg-cyan-950/80 border-cyan-700/60 text-cyan-300',
      defaultPath: '/participant',
    },
    judge: {
      label: 'Judge',
      icon: <Award className="w-4 h-4 text-amber-400" />,
      color: 'bg-amber-950/80 border-amber-700/60 text-amber-300',
      defaultPath: '/judge',
    },
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    navigate(roleConfigs[newRole].defaultPath);
  };

  const currentRoleUsers = getUsersByRole(role);

  return (
    <header className="sticky top-0 z-40 h-16 w-full border-b border-surface-border bg-surface/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shadow-sm">
      {/* Left: Mobile Toggle & Event Context */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-lighter transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Event Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-lighter/70 border border-surface-border hover:border-slate-600 transition-colors text-left"
          >
            <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-white block leading-tight">
                {currentEvent ? currentEvent.name : 'Loading Event...'}
              </span>
              <span className="text-[10px] text-slate-400 block leading-none capitalize">
                {currentEvent?.status || 'Active'} Hackathon
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isEventDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsEventDropdownOpen(false)}
              />
              <div className="absolute left-0 mt-2 w-64 rounded-xl bg-surface border border-surface-border shadow-2xl p-1.5 z-50 animate-fade-in">
                <div className="px-2.5 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Event
                </div>
                {events.map((evt) => (
                  <button
                    key={evt.id}
                    onClick={() => {
                      setCurrentEvent(evt);
                      setIsEventDropdownOpen(false);
                    }}
                    className={clsx(
                      'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors text-left',
                      currentEvent?.id === evt.id
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-surface-lighter'
                    )}
                  >
                    <span className="truncate">{evt.name}</span>
                    {currentEvent?.id === evt.id && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Live Status indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse glow-pill-live" />
          <span>Live Sync</span>
        </div>
      </div>

      {/* Right: Role Switcher & Demo User Persona */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Role Toggle Button Group */}
        <div className="flex items-center p-1 rounded-xl bg-surface-lighter/80 border border-surface-border">
          {(['organizer', 'participant', 'judge'] as UserRole[]).map((r) => {
            const isActive = role === r;
            const config = roleConfigs[r];
            return (
              <button
                key={r}
                onClick={() => handleRoleChange(r)}
                className={clsx(
                  'flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150',
                  isActive
                    ? 'bg-surface text-white shadow-sm border border-white/10'
                    : 'text-slate-400 hover:text-slate-200'
                )}
                title={`Switch to ${config.label} View`}
              >
                {config.icon}
                <span className="hidden sm:inline">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Demo User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface-lighter/60 border border-surface-border hover:border-slate-600 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div className="hidden xl:block text-left">
              <span className="text-xs font-semibold text-slate-200 block truncate max-w-[120px]">
                {currentUser?.name || 'User'}
              </span>
              <span className="text-[10px] text-slate-400 block truncate max-w-[120px]">
                {currentUser?.email || ''}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isUserDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsUserDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-surface border border-surface-border shadow-2xl p-2 z-50 animate-fade-in max-h-80 overflow-y-auto">
                <div className="px-2.5 py-1.5 border-b border-surface-border mb-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Demo Personas ({roleConfigs[role].label})
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Switch persona to test role data
                  </span>
                </div>

                <div className="space-y-0.5 mt-1">
                  {currentRoleUsers.map((u) => {
                    const isSelected = currentUser?.id === u.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u);
                          setIsUserDropdownOpen(false);
                        }}
                        className={clsx(
                          'w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left',
                          isSelected
                            ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                            : 'text-slate-300 hover:bg-surface-lighter'
                        )}
                      >
                        <div className="truncate pr-2">
                          <span className="font-semibold block truncate text-slate-200">{u.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{u.email}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
