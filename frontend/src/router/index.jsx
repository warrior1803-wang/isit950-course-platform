import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../lib/auth';
import { Navbar, StudentSidebar, InstructorSidebar, LoadingSpinner } from '../components/shared';

// Pages
import LoginPage from '../pages/auth/LoginPage';
import CourseList from '../pages/CourseList';
import CourseDetail from '../pages/CourseDetail';
import AssignmentSubmission from '../pages/AssignmentSubmission';
import AssignmentQuiz from '../pages/AssignmentQuiz';
import AssignmentReview from '../pages/AssignmentReview';
import Forum from '../pages/Forum';
// import Assignments from '../pages/Assignments';
import AssignmentList from '../pages/AssignmentList';
import Announcements from '../pages/Announcements';
import InstructorGrading from '../pages/InstructorGrading';
import InstructorCoursesPage from '../pages/instructor/InstructorCoursesPage';
import InstructorCourseStudentsPage from '../pages/instructor/InstructorCourseStudentsPage';
import InstructorDiscussionsPage from '../pages/instructor/InstructorDiscussionsPage';
import InstructorProfilePage from '../pages/instructor/InstructorProfilePage';
import InstructorAnnouncementsPage from '../pages/instructor/InstructorAnnouncementsPage';
import InstructorDashboardPage from '../pages/instructor/InstructorDashboardPage';
import InstructorAnalyticsPage from '../pages/instructor/InstructorAnalyticsPage';
import BrowseCourses from '../pages/BrowseCourses';
import Profile from '../pages/Profile';
import Membership from '../pages/Membership';

// Temporary placeholder for pages not yet implemented
function Soon({ page }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <span className="material-symbols-rounded" style={{ fontSize: 48, color: '#ddd0d4' }}>
          construction
        </span>
        <p style={{ marginTop: 12, color: '#9c8a8e', fontSize: 14, fontFamily: "'Gowun Batang', serif" }}>
          {page} — coming soon
        </p>
      </div>
    </div>
  );
}

// ── Route guards ────────────────────────────────────────────────────────────

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullPage />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

/** Only accessible by students; instructors are redirected to /dashboard. */
export function StudentRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullPage />;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'STUDENT' ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

/** Only accessible by instructors; students are redirected to /courses. */
export function InstructorRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullPage />;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'INSTRUCTOR' ? <Outlet /> : <Navigate to="/courses" replace />;
}

// ── Layout wrappers ─────────────────────────────────────────────────────────

function StudentLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <StudentSidebar />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 36px',
            background: '#f0e8e2',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function InstructorLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <InstructorSidebar />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '28px 36px',
            background: '#f0e8e2',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ── App router ──────────────────────────────────────────────────────────────

export default function AppRouter() {
  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* ── Student routes ── */}
      <Route element={<StudentRoute />}>
        <Route element={<StudentLayout />}>
          <Route path="/courses" element={<CourseList />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
          <Route path="/courses/:id/posts" element={<CourseDetail />} />
          <Route path="/courses/:id/announcements" element={<CourseDetail />} />
          <Route path="/courses/:id/assignments" element={<CourseDetail />} />
          <Route
            path="/courses/:id/assignments/:asgId/submit"
            element={<AssignmentSubmission />}
          />
          <Route
            path="/courses/:id/assignments/:asgId/quiz"
            element={<AssignmentQuiz />}
          />
          <Route
            path="/courses/:id/assignments/:asgId/review"
            element={<AssignmentReview />}
          />
          <Route path="/discussions" element={<Forum />} />
          <Route path="/assignments" element={<AssignmentList/>} />
          <Route path="/announcements" element={<Announcements />} />
          <Route path="/browsecourses" element={<BrowseCourses />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* ── Instructor routes ── */}
      <Route element={<InstructorRoute />}>
        <Route element={<InstructorLayout />}>
          <Route path="/dashboard" element={<InstructorDashboardPage />} />
          <Route path="/instructor/courses" element={<InstructorCoursesPage />} />
          <Route path="/instructor/courses/:id/students" element={<InstructorCourseStudentsPage />} />
          <Route path="/instructor/grading" element={<InstructorGrading />} />
          <Route path="/instructor/discussions" element={<InstructorDiscussionsPage />} />
          <Route path="/instructor/announcements" element={<InstructorAnnouncementsPage />} />
          <Route path="/instructor/analytics" element={<InstructorAnalyticsPage />} />
          <Route path="/instructor/profile" element={<InstructorProfilePage />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
