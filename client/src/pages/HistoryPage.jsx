import React, { useState } from 'react';
import './HistoryPage.css';

const MOCK_HISTORY = [
  { 
    id: 1, date: 'Oct 24', day: 'Tuesday', consumed: 2150, target: 2200, status: 'on-target', 
    meals: [
      { slot: 'Breakfast', name: 'Avocado Toast', kcal: 420 },
      { slot: 'Lunch', name: 'Caesar Salad', kcal: 520 },
      { slot: 'Dinner', name: 'Grilled Chicken', kcal: 650 },
      { slot: 'Snack', name: 'Protein Bar', kcal: 200 }
    ] 
  },
  { id: 2, date: 'Oct 23', day: 'Monday', consumed: 2650, target: 2200, status: 'over', meals: [] },
  { id: 3, date: 'Oct 22', day: 'Sunday', consumed: 1800, target: 2200, status: 'under', meals: [] },
  { id: 4, date: 'Oct 21', day: 'Saturday', consumed: 2180, target: 2200, status: 'on-target', meals: [] },
  { id: 5, date: 'Oct 20', day: 'Friday', consumed: 2300, target: 2200, status: 'over', meals: [] },
  { id: 6, date: 'Oct 19', day: 'Thursday', consumed: 2100, target: 2200, status: 'on-target', meals: [] },
  { id: 7, date: 'Oct 18', day: 'Wednesday', consumed: 1950, target: 2200, status: 'under', meals: [] },
];

const HistoryPage = () => {
  const [expandedId, setExpandedId] = useState(1);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getStatusLabel = (status) => {
    if (status === 'on-target') return 'On Target';
    if (status === 'over') return 'Over';
    return 'Under';
  };

  return (
    <div className="history-container">
      <div className="history-header">
        <div>
          <h2>History</h2>
          <p>Review your past meals and track your daily targets.</p>
        </div>
      </div>

      <div className="history-filters">
        <div className="summary-pill">
          <span className="summary-icon">⭐</span>
          <span><strong>THIS WEEK</strong> — 5 Days On Target</span>
        </div>
        <div className="month-filter">
          <span>Filter by Month — Currently viewing <strong>October 2023</strong></span>
          <button className="btn-outline-small">Change</button>
        </div>
      </div>

      <div className="history-list">
        {MOCK_HISTORY.map((entry) => {
          const isExpanded = expandedId === entry.id;
          return (
            <div key={entry.id} className={`history-accordion-card card ${isExpanded ? 'expanded' : ''}`}>
              <div 
                className="accordion-header"
                onClick={() => toggleExpand(entry.id)}
              >
                <div className="accordion-date">
                  <h3>{entry.date}</h3>
                  <span>{entry.day}</span>
                </div>
                
                <div className="accordion-stats">
                  <div className="kcal-info">
                    <span className="kcal-consumed">{entry.consumed} kcal</span>
                    <span className="kcal-target">/ {entry.target}</span>
                  </div>
                  <div className={`status-badge ${entry.status}`}>
                    {entry.status === 'over' && <span className="status-icon">⚠️</span>}
                    {getStatusLabel(entry.status)}
                  </div>
                  <span className={`chevron ${isExpanded ? 'up' : 'down'}`}>▼</span>
                </div>
              </div>

              {isExpanded && (
                <div className="accordion-body">
                  <h4>Meals Logged</h4>
                  {entry.meals.length > 0 ? (
                    <div className="logged-meals-grid">
                      {entry.meals.map((meal, idx) => (
                        <div key={idx} className="logged-meal-item">
                          <div className="logged-meal-info">
                            <span className="logged-slot">{meal.slot}</span>
                            <span className="logged-name">{meal.name}</span>
                          </div>
                          <span className="logged-kcal">{meal.kcal} kcal</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-meals-text">No detailed meals logged for this day.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryPage;
