import React from 'react';
import './ProgressPage.css';

const MOCK_WEIGHT_DATA = [
  { day: 'Mon', weight: 75.5 },
  { day: 'Tue', weight: 75.3 },
  { day: 'Wed', weight: 75.0 },
  { day: 'Thu', weight: 75.2 },
  { day: 'Fri', weight: 74.8 },
  { day: 'Sat', weight: 74.5 },
  { day: 'Sun', weight: 74.4 },
];

import { useAuth } from '../context/AuthContext';

const ProgressPage = () => {
  const { user } = useAuth();
  
  const currentWeight = user?.metrics?.weight || 74.4;
  const targetWeight = user?.metrics?.targetWeight || 70.0;
  // Assume start weight is 2kg more if no history, or fetch from history
  const startWeight = user?.metrics?.startWeight || currentWeight + 2;
  
  const progressPct = startWeight !== targetWeight 
    ? Math.max(0, Math.min(100, ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100))
    : 100;

  return (
    <div className="progress-container fade-in">
      <div className="progress-header">
        <p>Track your transformation journey and adherence.</p>
      </div>

      {/* Top Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card glass-panel">
          <span className="material-symbols-outlined metric-icon text-teal">monitor_weight</span>
          <div className="metric-info">
            <span className="metric-label">Current Weight</span>
            <span className="metric-value">{currentWeight} kg</span>
            <span className="metric-sub positive">↓ 1.6kg from start</span>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <span className="material-symbols-outlined metric-icon text-purple">fitness_center</span>
          <div className="metric-info">
            <span className="metric-label">Muscle Mass Target</span>
            <span className="metric-value">42.5 kg</span>
            <span className="metric-sub">On track</span>
          </div>
        </div>

        <div className="metric-card glass-panel">
          <span className="material-symbols-outlined metric-icon text-accent">local_fire_department</span>
          <div className="metric-info">
            <span className="metric-label">Adherence Streak</span>
            <span className="metric-value">4 Days</span>
            <span className="metric-sub">Keep it up!</span>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="charts-grid">
        
        {/* Weight Trend (CSS Bar Chart) */}
        <div className="chart-card glass-panel">
          <h3 className="chart-title">Weekly Weight Trend</h3>
          <div className="css-bar-chart">
            {MOCK_WEIGHT_DATA.map((d, i) => {
              // Calculate height relative to the min/max of the week for visual variance
              const heightPct = Math.max(10, ((d.weight - 74) / (76 - 74)) * 100);
              return (
                <div key={i} className="bar-column">
                  <div className="bar-val">{d.weight}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ height: `${heightPct}%` }}></div>
                  </div>
                  <div className="bar-lbl">{d.day}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Goal Progress (Ring) */}
        <div className="chart-card glass-panel goal-progress-card">
          <h3 className="chart-title">Goal Completion</h3>
          
          <div className="goal-ring-wrap">
            <div 
              className="goal-ring"
              style={{ background: `conic-gradient(var(--color-teal) 0% ${progressPct}%, var(--color-border) ${progressPct}% 100%)` }}
            >
              <div className="goal-ring-inner">
                <span className="goal-ring-val">{Math.round(progressPct)}%</span>
                <span className="goal-ring-lbl">Completed</span>
              </div>
            </div>
          </div>

          <div className="goal-details">
            <div className="goal-detail-row">
              <span>Start</span>
              <strong>{startWeight} kg</strong>
            </div>
            <div className="goal-detail-row">
              <span>Current</span>
              <strong>{currentWeight} kg</strong>
            </div>
            <div className="goal-detail-row">
              <span>Target</span>
              <strong>{targetWeight} kg</strong>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ProgressPage;
