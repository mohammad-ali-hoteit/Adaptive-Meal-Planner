import React, { useState, useEffect } from 'react';
import './ProgressPage.css';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

const ProgressPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    streak: 0,
    totalMeals: 0,
    fatMass: { current: '--', target: '--' }
  });
  
  const [weeklyData, setWeeklyData] = useState([]);
  const [macroAvgs, setMacroAvgs] = useState({ cal: 0, pro: 0, carb: 0, fat: 0 });
  const [consistencyMap, setConsistencyMap] = useState([]);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        // Fetch all 3 endpoints in parallel
        const [weeklyRes, streakRes, heatmapRes] = await Promise.all([
          API.get('/progress/weekly'),
          API.get('/progress/streak'),
          API.get('/progress/heatmap')
        ]);

        // Weekly data
        if (weeklyRes.data.success) {
          setWeeklyData(weeklyRes.data.weeklyData);
          setMacroAvgs(weeklyRes.data.macroAvgs);
        }

        // Streak & stats
        if (streakRes.data.success) {
          setStats({
            streak: streakRes.data.streak,
            totalMeals: streakRes.data.totalMeals,
            fatMass: streakRes.data.fatMass
          });
        }

        // Heatmap
        if (heatmapRes.data.success) {
          setConsistencyMap(heatmapRes.data.heatmap);
        }
      } catch (err) {
        console.error('Failed to load progress data:', err);
      }
    };

    fetchProgress();
  }, []);

  const renderRing = (val, target, color, unit) => {
    const pct = target > 0 ? Math.min((val / target) * 100, 100) : 0;
    const isExceeded = val > target;
    const radius = 45;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (pct / 100) * circ;

    return (
      <div className="macro-avg-ring">
        <svg width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} className="ring-bg" />
          <circle 
            cx="50" cy="50" r={radius} 
            className="ring-fill" 
            style={{ stroke: color, strokeDasharray: circ, strokeDashoffset: offset }}
          />
        </svg>
        <div className="ring-content">
          <span className="val" style={{ color: isExceeded ? '#e53935' : 'inherit' }}>
            {val}<span className="unit" style={{ color: isExceeded ? '#e53935' : 'inherit' }}>{unit}</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="progress-container">
      <header className="progress-header">
        <h1>Your Progress</h1>
        <p className="subtitle">Track your consistency and milestones over time.</p>
      </header>

      {/* Top Stats Row */}
      <div className="stats-row">
        <div className="stat-card glass-panel bounce-in" style={{ animationDelay: '0.1s' }}>
          <div className="stat-icon fire">🔥</div>
          <div className="stat-info">
            <h3>{stats.streak} Days</h3>
            <p>Active Streak</p>
          </div>
        </div>
        <div className="stat-card glass-panel bounce-in" style={{ animationDelay: '0.2s' }}>
          <div className="stat-icon bento">🍱</div>
          <div className="stat-info">
            <h3>{stats.totalMeals} Meals</h3>
            <p>Total Tracked</p>
          </div>
        </div>
        <div className="stat-card glass-panel bounce-in" style={{ animationDelay: '0.3s' }}>
          <div className="stat-icon scale">⚖️</div>
          <div className="stat-info">
            <h3>{stats.fatMass?.current} <span className="target-text">➔ {stats.fatMass?.target} kg</span></h3>
            <p>Current Fat Mass</p>
          </div>
        </div>
      </div>

      <div className="progress-grid">
        
        {/* Left Col: Weekly Chart */}
        <div className="bento-left">
          <div className="bento-card glass-panel fade-up">
            <h3 className="card-title">7-Day Calorie History</h3>
            <div className="bar-chart-container">
              {weeklyData.map((d, i) => {
                const isOver = d.cals > d.target * 1.1;
                const isPerfect = d.cals >= d.target * 0.9 && d.cals <= d.target * 1.1;
                let barClass = 'bar-fill';
                if (isOver) barClass += ' red';
                else if (isPerfect) barClass += ' green';
                else barClass += ' yellow';
                
                return (
                  <div key={i} className="bar-wrapper" title={`${Math.round(d.cals)} kcal`}>
                    <div className="bar-track">
                      <div className={barClass} style={{ height: `${d.pct}%` }}></div>
                    </div>
                    <span className="bar-label">{d.dayName}</span>
                  </div>
                );
              })}
              <div className="target-line" style={{ bottom: '100%' }}>
                <span className="target-lbl">Goal</span>
              </div>
            </div>
          </div>

          <div className="bento-card glass-panel fade-up" style={{ marginTop: '24px' }}>
            <h3 className="card-title">Consistency Heatmap (30 Days)</h3>
            <div className="heatmap-container">
              {consistencyMap.map((d, i) => (
                <div 
                  key={i} 
                  className={`heat-block level-${d.intensity}`}
                  title={`${d.date}: ${d.intensity > 0 ? (d.intensity === 2 ? 'All tracked!' : 'Partially tracked') : 'No data'}`}
                ></div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Macro Averages */}
        <div className="bento-right">
          <div className="bento-card glass-panel fade-up" style={{ animationDelay: '0.2s', height: '100%' }}>
            <h3 className="card-title">7-Day Macro Averages</h3>
            
            {/* Macro Exceeded Warning */}
            {((macroAvgs.cal || 0) > (macroAvgs.calTarget || 2000) || 
              macroAvgs.pro > macroAvgs.proTarget || 
              macroAvgs.carb > macroAvgs.carbTarget || 
              macroAvgs.fat > macroAvgs.fatTarget) && (
              <div style={{ marginBottom: '24px', padding: '12px', background: 'var(--color-surface-low)', color: '#e53935', borderRadius: 'var(--radius-card)', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'flex-start', gap: '8px', border: '1px solid #ef9a9a' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>warning</span>
                <span>Your 7-day average exceeded one or more of your daily macro targets.</span>
              </div>
            )}

            <div className="macro-averages">
              
              <div className="macro-avg-item">
                {renderRing(macroAvgs.cal || 0, macroAvgs.calTarget || 2000, 'var(--color-primary)', '')}
                <div className="avg-labels">
                  <h4>Calories</h4>
                  <span>Target: {macroAvgs.calTarget || 2000} kcal</span>
                </div>
              </div>

              <div className="macro-avg-item">
                {renderRing(macroAvgs.pro, macroAvgs.proTarget, 'var(--macro-pro)', 'g')}
                <div className="avg-labels">
                  <h4>Protein</h4>
                  <span>Target: {macroAvgs.proTarget}g</span>
                </div>
              </div>

              <div className="macro-avg-item">
                {renderRing(macroAvgs.carb, macroAvgs.carbTarget, 'var(--macro-carb)', 'g')}
                <div className="avg-labels">
                  <h4>Carbs</h4>
                  <span>Target: {macroAvgs.carbTarget}g</span>
                </div>
              </div>

              <div className="macro-avg-item">
                {renderRing(macroAvgs.fat, macroAvgs.fatTarget, 'var(--macro-fat)', 'g')}
                <div className="avg-labels">
                  <h4>Fats</h4>
                  <span>Target: {macroAvgs.fatTarget}g</span>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProgressPage;
