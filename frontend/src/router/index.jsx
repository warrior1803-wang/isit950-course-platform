import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Navbar, StudentSidebar, InstructorSidebar, LoadingSpinner } from '../components/shared';

// Pages
import LoginPage from '../pages/auth/LoginPage';
import CourseList from '../pages/CourseList';
import CourseDetail from '../pages/CourseDetail';
import AssignmentSubmission from '../pages/AssignmentSubmission';

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
  return user.role === 'student' ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

/** Only accessible by instructors; students are redirected to /courses. */
export function InstructorRoute() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullPage />;
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'instructor' ? <Outlet /> : <Navigate to="/courses" replace />;
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
          <Route
            path="/courses/:id/assignments/:asgId/submit"
            element={<AssignmentSubmission />}
          />
          <Route
            path="/courses/:id/assignments/:asgId/review"
            element={<Soon page="Assignment Review" />}
          />
          <Route path="/assignments" element={<Soon page="Assignments" />} />
          <Route path="/discussions" element={<Soon page="Discussions" />} />
          <Route path="/announcements" element={<Soon page="Announcements" />} />
          <Route path="/profile" element={<Soon page="Profile" />} />
        </Route>
      </Route>

      {/* ── Instructor routes ── */}
      <Route element={<InstructorRoute />}>
        <Route element={<InstructorLayout />}>
          <Route path="/dashboard" element={<Soon page="Instructor Dashboard" />} />
          <Route path="/instructor/courses" element={<Soon page="Course Management" />} />
          <Route path="/instructor/grading" element={<Soon page="Grading" />} />
          <Route path="/instructor/discussions" element={<Soon page="Discussions Inbox" />} />
          <Route path="/instructor/announcements" element={<Soon page="Announcements" />} />
          <Route path="/instructor/analytics" element={<Soon page="Student Analytics" />} />
          <Route path="/instructor/profile" element={<Soon page="Instructor Profile" />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
