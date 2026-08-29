import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, ShieldCheck, Users, Award } from 'lucide-react';
import clsx from 'clsx';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRoles?: ('organizer' | 'participant' | 'judge')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { isAuthenticated, isLoading, user, isOrganizer, isParticipant, isJudge } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
          <p className="text-slate-400 text-sm">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role authorization
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = allowedRoles.some(role => {
      if (role === 'organizer') return isOrganizer;
      if (role === 'participant') return isParticipant;
      if (role === 'judge') return isJudge;
      return false;
    });

    if (!hasAccess) {
      // Redirect to appropriate dashboard based on user's role
      const defaultPath = isOrganizer ? '/organizer' : isParticipant ? '/participant' : '/judge';
      return <Navigate to={defaultPath} replace />;
    }
  }

  return <>{children ?? <Outlet />}</>;
};

/** Helper component for role-specific routes */
export const OrganizerRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['organizer']}>{children}</ProtectedRoute>
);

export const ParticipantRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['participant']}>{children}</ProtectedRoute>
);

export const JudgeRoute: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['judge']}>{children}</ProtectedRoute>
);

/** Role badge component for UI */
export const RoleBadge: React.FC<{ role: 'organizer' | 'participant' | 'judge' }> = ({ role }) => {
  const configs = {
    organizer: { label: 'Organizer', icon: ShieldCheck, color: 'bg-indigo-950/80 border-indigo-700/60 text-indigo-300' },
    participant: { label: 'Participant', icon: Users, color: 'bg-cyan-950/80 border-cyan-700/60 text-cyan-300' },
    judge: { label: 'Judge', icon: Award, color: 'bg-amber-950/80 border-amber-700/60 text-amber-300' },
  };
  
  const config = configs[role];
  const Icon = config.icon;
  
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold',
      config.color
    )}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};