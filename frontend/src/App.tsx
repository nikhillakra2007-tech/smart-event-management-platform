import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { EventProvider } from './context/EventContext';
import { UserRoleProvider } from './context/UserRoleContext';
import { AppLayout } from './components/layout/AppLayout';

// Organizer Pages
import { OrganizerDashboard } from './pages/organizer/OrganizerDashboard';
import { CheckinManager } from './pages/organizer/CheckinManager';
import { TeamsSubmissions } from './pages/organizer/TeamsSubmissions';
import { AnnouncementStudio } from './pages/organizer/AnnouncementStudio';
import { JudgingOversight } from './pages/organizer/JudgingOversight';
import { LiveLeaderboardPage } from './pages/organizer/LiveLeaderboardPage';
import { AnalyticsDashboard } from './pages/organizer/AnalyticsDashboard';

// Participant Pages
import { ParticipantHub } from './pages/participant/ParticipantHub';
import { MyPassBadge } from './pages/participant/MyPassBadge';
import { CheckinStation } from './pages/participant/CheckinStation';
import { TeammateDiscovery } from './pages/participant/TeammateDiscovery';
import { MyTeamView } from './pages/participant/MyTeamView';
import { ProjectSubmission } from './pages/participant/ProjectSubmission';
import { AnnouncementsFeed } from './pages/participant/AnnouncementsFeed';

// Judge Pages
import { JudgeDashboard } from './pages/judge/JudgeDashboard';
import { EvaluateSubmission } from './pages/judge/EvaluateSubmission';
import { EvaluationHistory } from './pages/judge/EvaluationHistory';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <EventProvider>
        <UserRoleProvider>
          <Routes>
            <Route element={<AppLayout />}>
              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/organizer" replace />} />

              {/* Organizer Routes */}
              <Route path="/organizer" element={<OrganizerDashboard />} />
              <Route path="/organizer/checkins" element={<CheckinManager />} />
              <Route path="/organizer/teams" element={<TeamsSubmissions />} />
              <Route path="/organizer/announcements" element={<AnnouncementStudio />} />
              <Route path="/organizer/judging" element={<JudgingOversight />} />
              <Route path="/organizer/leaderboard" element={<LiveLeaderboardPage />} />
              <Route path="/organizer/analytics" element={<AnalyticsDashboard />} />

              {/* Participant Routes */}
              <Route path="/participant" element={<ParticipantHub />} />
              <Route path="/participant/badge" element={<MyPassBadge />} />
              <Route path="/participant/checkin" element={<CheckinStation />} />
              <Route path="/participant/discovery" element={<TeammateDiscovery />} />
              <Route path="/participant/team" element={<MyTeamView />} />
              <Route path="/participant/submission" element={<ProjectSubmission />} />
              <Route path="/participant/announcements" element={<AnnouncementsFeed />} />

              {/* Judge Routes */}
              <Route path="/judge" element={<JudgeDashboard />} />
              <Route path="/judge/evaluate/:submissionId" element={<EvaluateSubmission />} />
              <Route path="/judge/history" element={<EvaluationHistory />} />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/organizer" replace />} />
            </Route>
          </Routes>
        </UserRoleProvider>
      </EventProvider>
    </BrowserRouter>
  );
};

export default App;
