import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

const NAV_ITEMS = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/instructor/courses', icon: 'menu_book', label: 'My Courses' },
  { to: '/instructor/grading', icon: 'assignment_turned_in', label: 'Grading' },
  { to: '/instructor/discussions', icon: 'forum', label: 'Discussions' },
  { to: '/instructor/announcements', icon: 'campaign', label: 'Announcements' },
  { to: '/instructor/analytics', icon: 'bar_chart', label: 'Analytics' },
];

const ACCOUNT_ITEMS = [
  { to: '/instructor/profile', icon: 'manage_accounts', label: 'Profile' },
];

function NavSection({ label, style }) {
  return (
    <div className="ccp-nav-section" style={style}>
      {label}
    </div>
  );
}

function SidebarLink({ to, icon, label, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `ccp-nav-item${isActive ? ' active' : ''}`}
    >
      <span className="material-symbols-rounded">{icon}</span>
      {label}
    </NavLink>
  );
}

export default function InstructorSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="ccp-sidebar-instructor"
      style={{
        width: 210,
        flexShrink: 0,
        background: '#ece3dc',
        padding: '20px 0',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #ddd0d4',
        overflowY: 'auto',
      }}
    >
      <NavSection label="Instructor" />

      {NAV_ITEMS.map(item => (
        <SidebarLink key={item.to} {...item} />
      ))}

      <NavSection label="Account" style={{ marginTop: 8 }} />

      {ACCOUNT_ITEMS.map(item => (
        <SidebarLink key={item.to} {...item} />
      ))}

      <div style={{ flex: 1 }} />

      <button className="ccp-nav-item" onClick={handleLogout}>
        <span className="material-symbols-rounded">logout</span>
        Sign out
      </button>
    </aside>
  );
}
