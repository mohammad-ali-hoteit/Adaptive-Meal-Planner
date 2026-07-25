import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [prefs, setPrefs] = useState({
    darkMode: user?.preferences?.darkMode || false,
    notifications: user?.preferences?.notifications ?? true
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user?.preferences) {
      setPrefs({
        darkMode: user.preferences.darkMode || false,
        notifications: user.preferences.notifications ?? true
      });
    }
  }, [user]);

  const handleTogglePref = async (key) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    try {
      await API.put('/user/profile', { preferences: newPrefs });
      refreshUser();
    } catch (err) {
      console.error('Failed to update preferences:', err);
      // Revert on error
      setPrefs(prefs);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    try {
      await API.delete('/user/delete');
      logout();
      navigate('/');
    } catch (err) {
      console.error('Failed to delete account:', err);
      alert('Failed to delete account. Please try again.');
    }
  };

  // Format join date
  const joinDate = user?.createdAt 
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'July 2026';

  return (
    <div className="profile-container">
      
      {/* Hero Banner */}
      <div className="profile-hero fade-up">
        <div className="hero-background"></div>
        <div className="hero-content">
          <div className="hero-avatar">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className="hero-text">
            <h1>{user?.name || 'User'}</h1>
            <p>{user?.email || 'user@example.com'}</p>
            <div className="hero-badges">
              <span className="badge pro-badge"><span className="material-symbols-outlined">star</span> Premium Member</span>
              <span className="badge date-badge">Joined {joinDate}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        
        {/* LEFT COLUMN: Actions */}
        <div className="profile-col fade-up" style={{ animationDelay: '0.1s' }}>
          
          <div className="profile-card glass-panel highlight-card">
            <div className="card-icon-header">
              <span className="material-symbols-outlined icon-large">vital_signs</span>
              <h3>Body Metrics & Goals</h3>
            </div>
            <p className="card-desc">Need to update your weight, height, or fitness goals? Re-take the onboarding flow to let the algorithm recalculate everything for you.</p>
            <button className="btn-primary-action" onClick={() => navigate('/onboarding')}>
              <span className="material-symbols-outlined">refresh</span> Redo Onboarding
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: Settings & Danger */}
        <div className="profile-col fade-up" style={{ animationDelay: '0.2s' }}>
          
          <div className="profile-card glass-panel">
            <h3><span className="material-symbols-outlined">settings</span> App Preferences</h3>
            <div className="toggles-list">
              <label className="toggle-row disabled" style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                <div className="toggle-info">
                  <span className="toggle-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Dark Mode 
                    <span className="badge badge-gold" style={{ fontSize: '10px', padding: '2px 6px' }}>Coming Soon</span>
                  </span>
                  <span className="toggle-sub">Switch to a darker theme</span>
                </div>
                <input type="checkbox" disabled checked={false} style={{ pointerEvents: 'none' }} />
                <span className="toggle-slider" style={{ filter: 'grayscale(1)' }}></span>
              </label>
              
              <label className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-label">Push Notifications</span>
                  <span className="toggle-sub">Get reminded to log your meals</span>
                </div>
                <input type="checkbox" checked={prefs.notifications} onChange={() => handleTogglePref('notifications')} />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="profile-card glass-panel danger-zone">
            <h3><span className="material-symbols-outlined">warning</span> Account Management</h3>
            <p className="card-desc">Log out of your account or permanently delete your data.</p>
            <div className="danger-actions">
              <button className="btn-logout" onClick={handleLogout}>
                <span className="material-symbols-outlined">logout</span> Log Out
              </button>
              <button className="btn-delete" onClick={() => setShowDeleteConfirm(true)}>
                <span className="material-symbols-outlined">delete_forever</span> Delete Account
              </button>
            </div>
          </div>

          {/* Delete Confirmation */}
          {showDeleteConfirm && (
            <div className="modal-overlay" style={{ zIndex: 9999 }}>
              <div className="modal-content glass-panel" style={{ maxWidth: '400px', textAlign: 'center', padding: '32px', border: '1px solid var(--color-border)' }}>
                <div style={{ marginBottom: '24px', color: 'var(--color-red)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>warning</span>
                </div>
                <h3 style={{ margin: '0 0 16px 0', color: 'var(--color-text)', fontSize: '20px' }}>Delete Account?</h3>
                <p style={{ margin: '0 0 32px 0', color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: '1.5' }}>
                  This action is permanent and cannot be undone. All your data, meal logs, and custom recipes will be deleted forever.
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    className="btn btn-outline" 
                    style={{ flex: 1, padding: '12px', fontSize: '16px', fontWeight: 'bold' }} 
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1, padding: '12px', fontSize: '16px', fontWeight: 'bold', background: 'var(--color-red)', borderColor: 'var(--color-red)', color: 'white' }} 
                    onClick={handleDeleteAccount}
                  >
                    Delete Forever
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
