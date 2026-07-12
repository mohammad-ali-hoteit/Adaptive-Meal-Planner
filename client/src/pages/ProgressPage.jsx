import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './ProgressPage.css';

const ProgressPage = () => {
  const { user } = useAuth();
  
  const [weeklyLogs, setWeeklyLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await API.get('/dashboard/weekly-logs');
        if (res.data.success) {
          setWeeklyLogs(res.data.logs || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Compute past 7 days dates
  const past7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  // Calculate Adherence Data
  const adherenceData = past7Days.map(dateObj => {
    const dateISO = dateObj.toISOString().split('T')[0];
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const log = weeklyLogs.find(l => {
      if (!l.date) return false;
      const logDateString = typeof l.date === 'string' ? l.date : new Date(l.date).toISOString();
      return logDateString.split('T')[0] === dateISO;
    });
    
    if (!log) return { day: dayName, date: dateISO, adherence: 0, assigned: 0, completed: 0 };
    
    const assigned = log.mealsAssigned?.length || 4;
    const completed = log.mealsCompleted?.length || 0;
    
    const adherence = assigned === 0 ? 0 : Math.min(100, Math.round((completed / assigned) * 100));
    return { day: dayName, date: dateISO, adherence, assigned, completed };
  });

  // User Metrics
  const currentWeight = user?.metrics?.weight || 75.0;
  const targetWeight = user?.metrics?.targetWeight || 70.0;
  const startWeight = currentWeight + 3.2;

  const bodyFat = user?.results?.bodyFatPercentage ? `${user.results.bodyFatPercentage.toFixed(1)}%` : '18.5%';
  const currentStreak = user?.currentStreak || 0;

  // Goal Progress
  const totalWeightToLose = Math.abs(startWeight - targetWeight);
  const weightLost = Math.abs(startWeight - currentWeight);
  const progressPct = startWeight !== targetWeight && totalWeightToLose > 0
    ? Math.max(0, Math.min(100, (weightLost / totalWeightToLose) * 100))
    : 100;

  // Mock Weight Trend
  const mockWeightTrend = past7Days.map((dateObj, i) => {
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const diff = startWeight - currentWeight;
    const step = diff / 6;
    let simulatedWeight = startWeight - (step * i);
    if (i > 0 && i < 6) {
      simulatedWeight += (Math.random() * 0.6 - 0.3);
    }
    return {
      day: dayName,
      weight: i === 6 ? currentWeight : Number(simulatedWeight.toFixed(1))
    };
  });

  const renderWeightLine = () => {
    const minW = Math.min(...mockWeightTrend.map(d => d.weight)) - 1;
    const maxW = Math.max(...mockWeightTrend.map(d => d.weight)) + 1;
    const range = maxW - minW;
    
    const pts = mockWeightTrend.map((d, i) => {
      const x = (i / 6) * 100;
      const y = 100 - (((d.weight - minW) / range) * 100);
      return `${x},${y}`;
    });
    
    return (
      <div className="svg-chart-container">
        <svg width="100%" height="100%" viewBox="0 -10 100 120" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
          <polygon points={`0,100 ${pts.join(' ')} 100,100`} fill="url(#lineGrad)" />
          
          <polyline points={pts.join(' ')} fill="none" stroke="var(--color-primary)" strokeWidth="4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
          
          {mockWeightTrend.map((d, i) => {
            const x = (i / 6) * 100;
            const y = 100 - (((d.weight - minW) / range) * 100);
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="6" fill="white" stroke="var(--color-primary)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
              </g>
            );
          })}
        </svg>
        <div className="weight-labels-overlay">
          {mockWeightTrend.map((d, i) => {
            const left = `${(i / 6) * 100}%`;
            const bottom = `${(((d.weight - minW) / range) * 100)}%`;
            return (
              <div key={i} className="weight-data-label" style={{ left, bottom, transform: 'translate(-50%, -24px)' }}>
                {d.weight.toFixed(1)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div style={{ padding: '60px', textAlign: 'center' }}><span className="spinner"></span></div>;
  }

  return (
    <div className="progress-container fade-in custom-scrollbar">
      <div className="progress-header">
        <h1 className="page-title">Your Progress</h1>
        <p className="page-subtitle">A clear view of your journey.</p>
      </div>

      <div className="metrics-grid">
        <div className="metric-card glass-panel slide-in-bottom" style={{ animationDelay: '0.1s' }}>
          <div className="metric-icon-wrap bg-teal-light">
            <span className="material-symbols-outlined metric-icon text-teal">monitor_weight</span>
          </div>
          <div className="metric-info">
            <span className="metric-label">Current Weight</span>
            <span className="metric-value">{currentWeight.toFixed(1)} <small>kg</small></span>
            <span className="metric-sub positive">↓ {(startWeight - currentWeight).toFixed(1)} kg lost</span>
          </div>
        </div>

        <div className="metric-card glass-panel slide-in-bottom" style={{ animationDelay: '0.2s' }}>
          <div className="metric-icon-wrap bg-gold-light">
            <span className="material-symbols-outlined metric-icon text-accent">local_fire_department</span>
          </div>
          <div className="metric-info">
            <span className="metric-label">Adherence Streak</span>
            <span className="metric-value">{currentStreak} <small>days</small></span>
            <span className="metric-sub">Keep it up!</span>
          </div>
        </div>

        <div className="metric-card glass-panel slide-in-bottom" style={{ animationDelay: '0.3s' }}>
          <div className="metric-icon-wrap bg-purple-light">
            <span className="material-symbols-outlined metric-icon text-purple">analytics</span>
          </div>
          <div className="metric-info">
            <span className="metric-label">Body Fat</span>
            <span className="metric-value">{bodyFat}</span>
            <span className="metric-sub">Latest Estimate</span>
          </div>
        </div>
      </div>

      <div className="charts-main-grid">
        {/* Goal Progress Section - Full Width Row */}
        <div className="chart-card goal-card glass-panel slide-in-right" style={{ animationDelay: '0.4s' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="chart-title">Goal Completion</h3>
              <p className="chart-subtitle" style={{ marginBottom: 0 }}>You are {Math.round(progressPct)}% of the way to your target weight.</p>
            </div>
            <div className="trend-badge" style={{ background: 'var(--color-primary)', color: 'white' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
              Great Pace
            </div>
          </div>
          
          <div className="goal-bar-wrapper">
            <div className="goal-bar-track">
              <div className="goal-bar-fill" style={{ width: `${progressPct}%` }}></div>
            </div>
            <div className="goal-bar-markers">
              <div className="marker text-muted">
                <strong>{startWeight.toFixed(1)} kg</strong>
                <span>Start</span>
              </div>
              <div className="marker text-primary" style={{ textAlign: 'center' }}>
                <strong>{currentWeight.toFixed(1)} kg</strong>
                <span>Current</span>
              </div>
              <div className="marker text-muted" style={{ textAlign: 'right' }}>
                <strong>{targetWeight.toFixed(1)} kg</strong>
                <span>Target</span>
              </div>
            </div>
          </div>
        </div>

        {/* Weight Trend Chart - Left Half */}
        <div className="chart-card trend-card glass-panel slide-in-right" style={{ animationDelay: '0.5s' }}>
          <h3 className="chart-title">Weight Trend</h3>
          <p className="chart-subtitle">Your weight over the last 7 days.</p>
          
          <div className="weight-trend-wrapper">
            {renderWeightLine()}
            <div className="x-axis-labels">
              {mockWeightTrend.map((d, i) => (
                <span key={i} className="x-lbl">{d.day}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Diet Adherence Chart - Right Half */}
        <div className="chart-card adherence-card glass-panel slide-in-right" style={{ animationDelay: '0.6s' }}>
          <h3 className="chart-title">Diet Adherence</h3>
          <p className="chart-subtitle">Percentage of meals logged over the last 7 days.</p>
          
          <div className="adherence-bars-wide">
            {adherenceData.map((d, i) => (
              <div key={i} className="wide-bar-column">
                <div className="wide-bar-val">{d.adherence}%</div>
                <div className="wide-bar-track">
                  <div 
                    className="wide-bar-fill" 
                    style={{ 
                      height: `${Math.max(4, d.adherence)}%`, 
                      background: d.adherence === 100 ? 'var(--color-success)' : (d.adherence >= 50 ? 'var(--color-teal)' : 'var(--color-accent)') 
                    }}
                  ></div>
                </div>
                <div className="wide-bar-lbl">{d.day}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default ProgressPage;
