import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useEvent } from '../../context/EventContext';
import {
  LayoutDashboard,
  QrCode,
  Users2,
  Megaphone,
  Award,
  Trophy,
  BarChart3,
  UserCheck,
  Compass,
  FileCode2,
  FolderGit2,
  History,
  Sparkles,
  Zap,
  Activity,
  PlusCircle,
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { user, isOrganizer, isParticipant, isJudge } = useAuth();
  const { currentEvent } = useEvent();
  const location = useLocation();

  const role = user?.role || 'organizer';

  const organizerNav = [
    { label: 'Command Center', path: '/organizer', icon: LayoutDashboard, exact: true },
    { label: 'Check-in Monitor', path: '/organizer/checkins', icon: UserCheck },
    { label: 'Teams & Submissions', path: '/organizer/teams', icon: Users2 },
    { label: 'Announcements Studio', path: '/organizer/announcements', icon: Megaphone },
    { label: 'Judging Oversight', path: '/organizer/judging', icon: Award },
    { label: 'Live Leaderboard', path: '/organizer/leaderboard', icon: Trophy },
    { label: 'Deep Analytics', path: '/organizer/analytics', icon: BarChart3 },
  ];

  const participantNav = [
    { label: 'Participant Hub', path: '/participant', icon: LayoutDashboard, exact: true },
    { label: 'My Pass / QR Badge', path: '/participant/badge', icon: QrCode },
    { label: 'Check-in Simulator', path: '/participant/checkin', icon: Zap },
    { label: 'Teammate Matcher', path: '/participant/discovery', icon: Compass },
    { label: 'My Team', path: '/participant/team', icon: Users2 },
    { label: 'Project Submission', path: '/participant/submission', icon: FolderGit2 },
    { label: 'Broadcasts Feed', path: '/participant/announcements', icon: Megaphone },
  ];

  const judgeNav = [
    { label: 'Judge Portal', path: '/judge', icon: LayoutDashboard, exact: true },
    { label: 'Scoring History', path: '/judge/history', icon: History },
    { label: 'Live Leaderboard', path: '/organizer/leaderboard', icon: Trophy },
  ];

  const currentNav = isOrganizer ? organizerNav : isParticipant ? participantNav : judgeNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed lg:sticky top-0 lg:top-16 left-0 z-50 h-screen lg:h-[calc(100vh-4rem)] w-64 border-r border-surface-border bg-surface flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 shadow-xl lg:shadow-none',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full overflow-y-auto p-4 space-y-6">
          {/* Logo & Brand Header */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-glow-indigo font-bold text-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block">
                Smart Event
              </span>
              <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase block">
                Command Platform
              </span>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-extrabold tracking-widest text-slate-500 uppercase">
              {role.toUpperCase()} NAVIGATION
            </div>

            {currentNav.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact 
                ? location.pathname === item.path 
                : location.pathname.startsWith(item.path);

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group',
                    isActive
                      ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-surface-lighter/60'
                  )}
                >
                  <Icon
                    className={clsx(
                      'w-4 h-4 transition-colors',
                      isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                    )}
                  />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Mini Event Info Card */}
          <div className="mt-auto pt-4">
            <div className="p-3.5 rounded-xl bg-surface-lighter/50 border border-surface-border space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-slate-400">Current Event</span>
                <span className="flex items-center gap-1 text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Active
                </span>
              </div>
              <p className="text-xs font-bold text-slate-200 truncate">
                {currentEvent?.name || 'HackHive 2026'}
              </p>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                {currentEvent?.venue || 'Tech Innovation Centre, Bengaluru'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
