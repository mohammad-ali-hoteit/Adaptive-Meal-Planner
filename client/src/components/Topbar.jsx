import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Topbar.css';


const Topbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  const [streak, setStreak] = useState(user?.currentStreak || 1);
  const [animateStreak, setAnimateStreak] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(true);

  // Sync state if user changes
  useEffect(() => {
    if (user && typeof user.currentStreak !== 'undefined') {
      setStreak(user.currentStreak);
    }
  }, [user]);

  // Optional: Pop animation on first load
  useEffect(() => {
    setAnimateStreak(true);
    const timer = setTimeout(() => {
      setAnimateStreak(false);
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="topbar">
      {/* Left: Static App Info */}
      <div className="topbar-page-info">
        <h2 className="topbar-page-title">Adaptive Planner</h2>
        <span className="topbar-page-subtitle">Fuel Your Body, Master Your Day.</span>
      </div>

      {/* Right: Bell + Divider + User */}
      <div className="topbar-right">
        {/* Streak Widget */}
        <div className={`topbar-streak-widget ${animateStreak ? 'streak-animate' : ''}`}>
          <div className="streak-icon">🔥</div>
          <div className="streak-info">
            <span className="streak-day">Day {streak}</span>
          </div>
        </div>

        <div className="topbar-sep" aria-hidden="true" />

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button 
            className="topbar-bell" 
            aria-label="Notifications" 
            onClick={() => {
              setShowNotifications(!showNotifications);
              setHasNewNotifications(false);
            }}
          >
            <span className="material-symbols-outlined topbar-bell-icon">notifications</span>
            {hasNewNotifications && <span className="topbar-bell-dot" aria-hidden="true" />}
          </button>
          
          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="notifications-dropdown glass-panel fade-in">
              <div className="notifications-header">
                <h3>Notifications</h3>
              </div>
              <div className="notifications-list">
                <div className="notification-item">
                  <div className="notification-icon" style={{ background: 'var(--color-teal)' }}>
                    <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '16px' }}>check_circle</span>
                  </div>
                  <div className="notification-content">
                    <p className="notification-title">Welcome to Adaptive Planner!</p>
                    <p className="notification-time">Just now</p>
                  </div>
                </div>
                <div className="notification-item">
                  <div className="notification-icon" style={{ background: 'var(--color-accent)' }}>
                    <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '16px' }}>local_fire_department</span>
                  </div>
                  <div className="notification-content">
                    <p className="notification-title">Your Day Streak started. Keep going!</p>
                    <p className="notification-time">Today</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="topbar-sep" aria-hidden="true" />

        {/* User */}
        <div className="topbar-user">
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user?.name || 'User'}</span>
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
