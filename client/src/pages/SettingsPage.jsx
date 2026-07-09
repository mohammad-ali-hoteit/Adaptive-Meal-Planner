import React from 'react';
import { useAuth } from '../context/AuthContext';
import './SettingsPage.css';

const SettingsPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Settings</h2>
        <p>Manage your account preferences and application settings.</p>
      </div>

      <div className="settings-list">
        {/* Account */}
        <div className="settings-row card">
          <div className="settings-icon">👤</div>
          <div className="settings-info">
            <h3>Account</h3>
            <p>{user?.email || 'user@example.com'}</p>
          </div>
          <span className="chevron">➡️</span>
        </div>

        {/* Security */}
        <div className="settings-row card">
          <div className="settings-icon">🛡️</div>
          <div className="settings-info">
            <h3>Security</h3>
            <p>Password & login</p>
          </div>
          <span className="chevron">➡️</span>
        </div>

        {/* Appearance */}
        <div className="settings-row card">
          <div className="settings-icon">🎨</div>
          <div className="settings-info">
            <h3>Appearance</h3>
            <p>Units & display preferences</p>
          </div>
          <span className="chevron">➡️</span>
        </div>
      </div>

      <button className="logout-btn" onClick={logout}>
        <span className="logout-icon">🚪</span>
        Log Out
      </button>
    </div>
  );
};

export default SettingsPage;
