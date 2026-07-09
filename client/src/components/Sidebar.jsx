import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard',       label: 'Dashboard',       icon: '📊' },
  { path: '/todays-meals',    label: "Today's Meals",   icon: '🍽️' },
  { path: '/add-custom-meal', label: 'Add Custom Meal', icon: '➕' },
  { path: '/weekly-plan',     label: 'Weekly Plan',     icon: '📅' },
  { path: '/progress',        label: 'Progress',        icon: '📈' },
  { path: '/history',         label: 'History',         icon: '📜' },
];

const bottomItems = [
  { path: '/profile',  label: 'Profile',  icon: '👤' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon-wrap">
          <span className="sidebar-logo-fork">🍴</span>
        </div>
        <div className="sidebar-logo-text-wrap">
          <span className="sidebar-logo-text">Adaptive Planner</span>
          <span className="sidebar-logo-sub">Nutrition System</span>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-group">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="sidebar-nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-divider" />

        {/* Bottom navigation */}
        <div className="sidebar-nav-group sidebar-nav-bottom">
          {bottomItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="sidebar-nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
            </NavLink>
          ))}
          <button
            className="sidebar-nav-item sidebar-logout"
            onClick={logout}
            aria-label="Logout"
          >
            <span className="sidebar-nav-icon" aria-hidden="true">🚪</span>
            <span className="sidebar-nav-label">Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
