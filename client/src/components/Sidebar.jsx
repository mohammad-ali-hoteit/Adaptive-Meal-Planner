import { NavLink } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import './Sidebar.css';

const navItems = [
  { path: '/dashboard',       label: 'Dashboard',       icon: 'dashboard' },
  { path: '/todays-meals',    label: 'Meal Discovery',  icon: 'restaurant' },
  { path: '/custom-meals',    label: 'Custom Meals',    icon: 'add_circle' },
  { path: '/pantry',          label: 'Pantry Gen',      icon: 'kitchen' },
  { path: '/weekly-plan',     label: 'Weekly Plan',     icon: 'calendar_month' },
  { path: '/progress',        label: 'Progress',        icon: 'monitoring' },
  { path: '/history',         label: 'History',         icon: 'history' },
];

const bottomItems = [
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Top Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-content">
          <img src={logoImg} alt="NutriSync Logo" className="sidebar-logo-img" />
          <div className="sidebar-logo-text-wrap">
            <span className="sidebar-logo-text">NutriSync</span>
            <span className="sidebar-logo-sub">Nutrition System</span>
          </div>
        </div>
        <button 
          className="sidebar-toggle-btn" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label="Toggle Sidebar"
        >
          <span className="material-symbols-outlined sidebar-nav-icon">
            {isCollapsed ? 'chevron_right' : 'chevron_left'}
          </span>
        </button>
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
              title={isCollapsed ? item.label : undefined}
            >
              <span className="material-symbols-outlined sidebar-nav-icon" aria-hidden="true">{item.icon}</span>
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
              title={isCollapsed ? item.label : undefined}
            >
              <span className="material-symbols-outlined sidebar-nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
