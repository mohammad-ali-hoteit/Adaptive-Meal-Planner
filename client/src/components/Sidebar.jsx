import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/foods', label: 'Foods', icon: '🍽️' },
  { path: '/my-meals', label: 'My Meals', icon: '🍳' },
  { path: '/community', label: 'Community', icon: '👥' },
  { path: '/history', label: 'History', icon: '📜' },
  { path: '/progress', label: 'Progress', icon: '📊' },
];

const bottomItems = [
  { path: '/settings', label: 'Settings', icon: '⚙️' },
  { path: '/profile', label: 'Profile', icon: '👤' },
];

const Sidebar = () => {
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">🌿</span>
        <span className="sidebar-logo-text">NutriPlan</span>
      </div>

      {/* Main navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-group">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-divider"></div>

        {/* Bottom navigation */}
        <div className="sidebar-nav-group">
          {bottomItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
            </NavLink>
          ))}
          <button className="sidebar-nav-item sidebar-logout" onClick={logout}>
            <span className="sidebar-nav-icon">🚪</span>
            <span className="sidebar-nav-label">Logout</span>
          </button>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
