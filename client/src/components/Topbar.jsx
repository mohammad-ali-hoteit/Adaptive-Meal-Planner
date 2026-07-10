import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Topbar.css';


const Topbar = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  // Streak Animation State
  const [streak, setStreak] = useState(3);
  const [animateStreak, setAnimateStreak] = useState(false);

  useEffect(() => {
    // 1) Initial state is Day 3.
    // 2) After 800ms, increase to 4 and trigger pop animation.
    const timer1 = setTimeout(() => {
      setStreak(4);
      setAnimateStreak(true);
    }, 800);

    // 3) Remove animation class after it completes (approx 600ms)
    const timer2 = setTimeout(() => {
      setAnimateStreak(false);
    }, 1400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
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
        <button className="topbar-bell" aria-label="Notifications">
          <span className="material-symbols-outlined topbar-bell-icon">notifications</span>
          <span className="topbar-bell-dot" aria-hidden="true" />
        </button>

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
