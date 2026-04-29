import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

const NAV_ITEMS = [
  { to: '/courses', icon: 'menu_book', label: 'My Courses' },
  { to: '/assignments', icon: 'assignment', label: 'Assignments' },
  { to: '/discussions', icon: 'forum', label: 'Discussions' },
  { to: '/announcements', icon: 'campaign', label: 'Announcements' },
  { to: '/browsecourses', icon: 'explore', label: 'Browse Courses' },
];

const ACCOUNT_ITEMS = [
  { to: '/membership', icon: 'star', label: 'Membership' },
  { to: '/profile', icon: 'manage_accounts', label: 'Profile' },
];

function NavSection({ label, style }) {
  return (
    <div className="ccp-nav-section" style={style}>
      {label}
    </div>
  );
}

function SidebarLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `ccp-nav-item${isActive ? ' active' : ''}`}
    >
      <span className="material-symbols-rounded">{icon}</span>
      {label}
    </NavLink>
  );
}

export default function StudentSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className="ccp-sidebar-student"
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
      <NavSection label="Student" />

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
