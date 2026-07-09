import React from 'react';
import './ProgressPage.css';

const MOCK_WEIGHT_DATA = [168, 167.5, 166.8, 166.2, 165.8, 165.1, 164.5, 164.2];
const MOCK_BODY_FAT_DATA = [18.0, 18.1, 18.2, 18.3, 18.4, 18.4, 18.5, 18.5];
const MOCK_CALORIE_DATA = [
  { day: 'Mon', planned: 2200, actual: 2150 },
  { day: 'Tue', planned: 2200, actual: 2450 }, // over
  { day: 'Wed', planned: 2200, actual: 1950 },
  { day: 'Thu', planned: 2200, actual: 2100 },
  { day: 'Fri', planned: 2200, actual: 2300 },
  { day: 'Sat', planned: 2200, actual: 2200 },
  { day: 'Sun', planned: 2200, actual: 2080 },
];

const ProgressPage = () => {
  // Simple helpers for SVG generation
  const getPoints = (data, width, height, min, max) => {
    const range = max - min;
    return data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');
  };

  const weightPoints = getPoints(MOCK_WEIGHT_DATA, 300, 100, 163, 169);
  const bodyFatPoints = getPoints(MOCK_BODY_FAT_DATA, 300, 100, 17.5, 18.8);
  const bodyFatArea = `${bodyFatPoints} 300,100 0,100`;

  return (
    <div className="progress-container">
      <div className="progress-header">
        <div>
          <h2>Progress</h2>
          <p>Review your historical data and trends over time.</p>
        </div>
        <div className="progress-actions">
          <select className="form-input filter-dropdown">
            <option>Last 30 Days</option>
            <option>Last 3 Months</option>
            <option>Last Year</option>
          </select>
          <button className="btn-outline">Export</button>
        </div>
      </div>

      <div className="charts-top-row">
        {/* Weight Trend */}
        <div className="chart-card card">
          <div className="chart-header">
            <h3>Weight Trend</h3>
          </div>
          <div className="chart-stats">
            <span className="current-stat">164.2 lbs</span>
            <span className="trend-badge down">-2.4%</span>
          </div>
          <div className="svg-container">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="line-chart weight">
              <polyline points={weightPoints} fill="none" stroke="var(--color-primary-dark)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="x-axis">
              <span>W1</span><span>W2</span><span>W3</span><span>W4</span><span>Today</span>
            </div>
          </div>
        </div>

        {/* Body Fat % */}
        <div className="chart-card card">
          <div className="chart-header">
            <h3>Body Fat %</h3>
          </div>
          <div className="chart-stats">
            <span className="current-stat">18.5%</span>
            <span className="trend-badge up">+0.8%</span>
          </div>
          <div className="svg-container">
            <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="line-chart body-fat">
              <polygon points={bodyFatArea} fill="rgba(139, 123, 200, 0.2)" />
              <polyline points={bodyFatPoints} fill="none" stroke="var(--color-purple)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="x-axis">
              <span>W1</span><span>W2</span><span>W3</span><span>W4</span><span>Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calorie Intake */}
      <div className="chart-card card full-width">
        <div className="chart-header">
          <h3>Calorie Intake: Planned vs Actual</h3>
          <div className="chart-legend">
            <div className="legend-item"><div className="legend-box planned"></div><span>PLANNED</span></div>
            <div className="legend-item"><div className="legend-box actual"></div><span>ACTUAL</span></div>
          </div>
        </div>
        
        <div className="bar-chart-container">
          {MOCK_CALORIE_DATA.map((data, idx) => {
            const maxVal = 3000; // arbitrary max for scale
            const plannedHeight = (data.planned / maxVal) * 100;
            const actualHeight = (data.actual / maxVal) * 100;
            const isOver = data.actual > data.planned;

            return (
              <div key={idx} className="bar-group">
                <div className="bars">
                  <div className="bar planned" style={{ height: `${plannedHeight}%` }}></div>
                  <div className={`bar actual ${isOver ? 'over' : ''}`} style={{ height: `${actualHeight}%` }}></div>
                </div>
                <span className="bar-label">{data.day}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;
