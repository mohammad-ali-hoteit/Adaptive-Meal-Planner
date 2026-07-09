import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Topbar.css';

const pageTitles = {
  '/dashboard':       { title: 'Dashboard',       subtitle: 'Your daily nutrition overview' },
  '/todays-meals':    { title: "Today's Meals",   subtitle: 'Track your food intake today' },
  '/add-custom-meal': { title: 'Add Custom Meal', subtitle: 'Log a meal manually' },
  '/weekly-plan':     { title: 'Weekly Plan',     subtitle: 'View and manage your meal schedule' },
  '/progress':        { title: 'Progress',        subtitle: 'Track your fitness milestones' },
  '/history':         { title: 'History',         subtitle: 'Past meals and nutrition logs' },
  '/profile':         { title: 'Profile',         subtitle: 'Manage your personal information' },
  '/settings':        { title: 'Settings',        subtitle: 'App preferences and configuration' },
};

const Topbar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const pageInfo = pageTitles[location.pathname] || { title: 'Dashboard', subtitle: '' };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="topbar">
      {/* Left: Search */}
      <div className="topbar-search-wrap">
        <span className="topbar-search-icon" aria-hidden="true">🔍</span>
        <input
          className="topbar-search"
          type="text"
          placeholder="Search meals, ingredients..."
          aria-label="Search meals and ingredients"
        />
      </div>

      {/* Right: Bell + Divider + User */}
      <div className="topbar-right">
        {/* Notification Bell */}
        <button className="topbar-bell" aria-label="Notifications">
          <span className="topbar-bell-icon">🔔</span>
          <span className="topbar-bell-dot" aria-hidden="true" />
        </button>

        <div className="topbar-sep" aria-hidden="true" />

        {/* User */}
        <div className="topbar-user">
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user?.name || 'User'}</span>
            <span className="topbar-user-sub">{pageInfo.subtitle}</span>
          </div>
          <div className="topbar-avatar" aria-label={`User avatar for ${user?.name}`}>
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
