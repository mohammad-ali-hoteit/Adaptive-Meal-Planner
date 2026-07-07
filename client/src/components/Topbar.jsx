import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Topbar.css';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/foods': 'Foods',
  '/my-meals': 'My Meals',
  '/community': 'Community',
  '/history': 'History',
  '/progress': 'Progress',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

const Topbar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const pageTitle = pageTitles[location.pathname] || 'Dashboard';

  // Get user initials for avatar
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{pageTitle}</h1>
      </div>
      <div className="topbar-right">
        <span className="topbar-user-name">{user?.name || 'User'}</span>
        <div className="topbar-avatar">{initials}</div>
      </div>
    </header>
  );
};

export default Topbar;
