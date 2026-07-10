import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import './SettingsPage.css';

const SettingsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(null);
  const [notifications, setNotifications] = useState(true);

  // Mock Form State
  const [formData, setFormData] = useState({
    name: user?.name || 'Alex Johnson',
    email: user?.email || 'alex@example.com',
    weight: user?.metrics?.weight || '75',
    height: user?.metrics?.height || '180',
    targetCalories: user?.metrics?.targetCalories || '2200'
  });

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await API.put('/settings', formData);
      alert('Settings updated successfully!');
      // Could also refresh user context here if needed
    } catch (err) {
      console.error(err);
      alert('Failed to update settings');
    }
  };

  return (
    <div className="settings-container fade-in">
      <div className="settings-layout">
        
        {/* Left Sidebar (Tabs) */}
        <div className="settings-sidebar card">
          <div className="settings-user-preview">
            <div className="settings-avatar">
              {formData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div className="settings-user-info">
              <h3>{formData.name}</h3>
              <p>{formData.email}</p>
            </div>
          </div>
          
          <nav className="settings-nav">
            <button 
              className={`settings-nav-btn ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              <span className="material-symbols-outlined">person</span> Account Profile
            </button>
            <button 
              className={`settings-nav-btn ${activeTab === 'body' ? 'active' : ''}`}
              onClick={() => setActiveTab('body')}
            >
              <span className="material-symbols-outlined">monitor_weight</span> Body Metrics
            </button>
            <button 
              className={`settings-nav-btn ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              <span className="material-symbols-outlined">tune</span> Preferences
            </button>
          </nav>
        </div>

        {/* Right Content Area */}
        <div className="settings-content card">
          {activeTab === null && (
            <div className="settings-empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--color-text-muted)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px' }}>settings</span>
              <h3>Select an option from the menu</h3>
              <p>Manage your account, metrics, and app preferences.</p>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-section">
              <h2 className="settings-section-title">Account Profile</h2>
              <p className="settings-section-desc">Update your basic personal information.</p>
              
              <form className="settings-form" onSubmit={handleUpdate}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="form-input"
                  />
                </div>
                <button type="submit" className="btn-primary">Save Changes</button>
              </form>
            </div>
          )}

          {activeTab === 'body' && (
            <div className="settings-section">
              <h2 className="settings-section-title">Body Metrics & Goals</h2>
              <p className="settings-section-desc">If your body has changed significantly, you can restart your onboarding process to recalculate all your goals perfectly.</p>
              
              <div style={{ marginTop: '24px' }}>
                <button 
                  className="btn-primary" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                  onClick={() => navigate('/onboarding')}
                >
                  <span className="material-symbols-outlined">restart_alt</span> Restart Onboarding
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="settings-section">
              <h2 className="settings-section-title">App Preferences</h2>
              <p className="settings-section-desc">Customize how Adaptive Meal Planner works for you.</p>
              
              <div className="preferences-list">
                <div className="preference-item">
                  <div className="preference-info">
                    <h4>Push Notifications</h4>
                    <p>Receive reminders for your scheduled meals.</p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={notifications} onChange={() => setNotifications(!notifications)} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              <hr className="danger-divider" />
              
              <div className="danger-zone">
                <h3 className="danger-title">Danger Zone</h3>
                <p>Log out of your account on this device.</p>
                <button className="btn-danger" onClick={logout}>
                  <span className="material-symbols-outlined">logout</span> Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
