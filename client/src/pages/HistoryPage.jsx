import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './HistoryPage.css';

const HistoryPage = () => {
  const { user } = useAuth();
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await API.get('/history');
        if (res.data.success) {
          const formatted = res.data.history.map(log => {
            const d = new Date(log.date);
            const dateStr = d.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', month: 'short', day: 'numeric' });
            
            // Calculate total kcal from assigned/completed meals
            // Assuming if completed, we add its kcal
            let totalKcal = 0;
            const mealsList = [];

            log.mealsCompleted.forEach(mc => {
              const assigned = log.mealsAssigned.find(a => a.mealType === mc.mealType);
              if (assigned) {
                if (assigned.customMealId) {
                  totalKcal += assigned.customMealId.kcal;
                  mealsList.push(assigned.customMealId.name);
                } else if (assigned.foodId) {
                  totalKcal += assigned.foodId.nutrition?.calories || 0;
                  mealsList.push(assigned.foodId.name?.en || 'Food');
                }
              }
            });

            // Mock target
            const targetKcal = 2000; 
            const score = Math.max(0, 100 - Math.abs((totalKcal - targetKcal) / targetKcal * 100));

            return {
              id: log._id,
              date: dateStr,
              score: Math.round(score),
              status: score >= 90 ? 'Excellent' : score >= 70 ? 'Good' : 'Needs Work',
              kcal: totalKcal,
              targetKcal,
              meals: mealsList
            };
          });
          setHistoryLogs(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>Loading...</div>;

  return (
    <div className="history-container fade-in">
      <div className="history-header">
        <p>Review your past daily scores and meal logs.</p>
      </div>

      <div className="history-timeline">
        {historyLogs.map((day, index) => (
          <div key={day.id} className="history-day-card glass-panel">
            <div className="history-day-date">
              <span className="material-symbols-outlined date-icon">calendar_today</span>
              <h3>{day.date}</h3>
            </div>

            <div className="history-day-stats">
              <div className="score-badge">
                <div 
                  className="score-ring" 
                  style={{ background: `conic-gradient(var(--color-teal) 0% ${day.score}%, transparent ${day.score}% 100%)` }}
                >
                  <div className="score-inner">{day.score}</div>
                </div>
                <span className="score-status">{day.status}</span>
              </div>

              <div className="history-macros">
                <div className="macro-row">
                  <span className="macro-label">Calories Consumed</span>
                  <span className={`macro-val ${day.kcal > day.targetKcal ? 'text-red' : 'text-teal'}`}>
                    {day.kcal} / {day.targetKcal} kcal
                  </span>
                </div>
                <div className="macro-row">
                  <span className="macro-label">Meals Logged</span>
                  <span className="macro-val">{day.meals.length}</span>
                </div>
              </div>
            </div>

            <div className="history-meals-list">
              <h4>Meals</h4>
              <div className="meals-tags">
                {day.meals.map((meal, i) => (
                  <span key={i} className="meal-tag">{meal}</span>
                ))}
              </div>
            </div>
            
            {index !== historyLogs.length - 1 && (
              <div className="timeline-connector"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPage;
