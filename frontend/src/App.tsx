import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EventProvider } from './context/EventContext';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, OrganizerRoute, ParticipantRoute, JudgeRoute } from './components/auth/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { Loader2 } from 'lucide-react';

// Code-split Lazy Loaded Organizer Pages
const OrganizerDashboard = lazy(() =>
  import('./pages/organizer/OrganizerDashboard').then((m) => ({ default: m.OrganizerDashboard }))
);
const EventPlanner = lazy(() =>
  import('./pages/organizer/EventPlanner').then((m) => ({ default: m.EventPlanner }))
);
const CheckinManager = lazy(() =>
  import('./pages/organizer/CheckinManager').then((m) => ({ default: m.CheckinManager }))
);
const TeamsSubmissions = lazy(() =>
  import('./pages/organizer/TeamsSubmissions').then((m) => ({ default: m.TeamsSubmissions }))
);
const AnnouncementStudio = lazy(() =>
  import('./pages/organizer/AnnouncementStudio').then((m) => ({ default: m.AnnouncementStudio }))
);
const JudgingOversight = lazy(() =>
  import('./pages/organizer/JudgingOversight').then((m) => ({ default: m.JudgingOversight }))
);
const LiveLeaderboardPage = lazy(() =>
  import('./pages/organizer/LiveLeaderboardPage').then((m) => ({ default: m.LiveLeaderboardPage }))
);
const AnalyticsDashboard = lazy(() =>
  import('./pages/organizer/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard }))
);

// Code-split Lazy Loaded Participant Pages
const ParticipantHub = lazy(() =>
  import('./pages/participant/ParticipantHub').then((m) => ({ default: m.ParticipantHub }))
);
const MyPassBadge = lazy(() =>
  import('./pages/participant/MyPassBadge').then((m) => ({ default: m.MyPassBadge }))
);
const CheckinStation = lazy(() =>
  import('./pages/participant/CheckinStation').then((m) => ({ default: m.CheckinStation }))
);
const TeammateDiscovery = lazy(() =>
  import('./pages/participant/TeammateDiscovery').then((m) => ({ default: m.TeammateDiscovery }))
);
const MyTeamView = lazy(() =>
  import('./pages/participant/MyTeamView').then((m) => ({ default: m.MyTeamView }))
);
const ProjectSubmission = lazy(() =>
  import('./pages/participant/ProjectSubmission').then((m) => ({ default: m.ProjectSubmission }))
);
const AnnouncementsFeed = lazy(() =>
  import('./pages/participant/AnnouncementsFeed').then((m) => ({ default: m.AnnouncementsFeed }))
);

// Code-split Lazy Loaded Judge Pages
const JudgeDashboard = lazy(() =>
  import('./pages/judge/JudgeDashboard').then((m) => ({ default: m.JudgeDashboard }))
);
const EvaluateSubmission = lazy(() =>
  import('./pages/judge/EvaluateSubmission').then((m) => ({ default: m.EvaluateSubmission }))
);
const EvaluationHistory = lazy(() =>
  import('./pages/judge/EvaluationHistory').then((m) => ({ default: m.EvaluationHistory }))
);

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px] w-full">
    <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-surface/80 border border-surface-border backdrop-blur-sm shadow-xl">
      <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
      <span className="text-xs font-semibold text-slate-300 tracking-wide">Loading Command Station...</span>
    </div>
  </div>
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <EventProvider>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes with AppLayout */}
              <Route element={<AppLayout />}>
                {/* Default Redirect */}
                <Route path="/" element={<Navigate to="/organizer" replace />} />

                {/* Organizer Routes */}
                <Route element={<OrganizerRoute />}>
                  <Route path="/organizer" element={<OrganizerDashboard />} />
                  <Route path="/organizer/planner" element={<EventPlanner />} />
                  <Route path="/organizer/checkins" element={<CheckinManager />} />
                  <Route path="/organizer/teams" element={<TeamsSubmissions />} />
                  <Route path="/organizer/announcements" element={<AnnouncementStudio />} />
                  <Route path="/organizer/judging" element={<JudgingOversight />} />
                  <Route path="/organizer/leaderboard" element={<LiveLeaderboardPage />} />
                  <Route path="/organizer/analytics" element={<AnalyticsDashboard />} />
                </Route>

                {/* Participant Routes */}
                <Route element={<ParticipantRoute />}>
                  <Route path="/participant" element={<ParticipantHub />} />
                  <Route path="/participant/badge" element={<MyPassBadge />} />
                  <Route path="/participant/checkin" element={<CheckinStation />} />
                  <Route path="/participant/discovery" element={<TeammateDiscovery />} />
                  <Route path="/participant/team" element={<MyTeamView />} />
                  <Route path="/participant/submission" element={<ProjectSubmission />} />
                  <Route path="/participant/announcements" element={<AnnouncementsFeed />} />
                </Route>

                {/* Judge Routes */}
                <Route element={<JudgeRoute />}>
                  <Route path="/judge" element={<JudgeDashboard />} />
                  <Route path="/judge/evaluate/:submissionId" element={<EvaluateSubmission />} />
                  <Route path="/judge/history" element={<EvaluationHistory />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<Navigate to="/organizer" replace />} />
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </EventProvider>
    </BrowserRouter>
  );
};

export default App;
