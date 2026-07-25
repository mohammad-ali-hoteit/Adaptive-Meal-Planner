import React, { useState, useEffect } from 'react';
import './HistoryPage.css';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

const HistoryPage = () => {
  const { user } = useAuth();
  
  // States
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [userMacros, setUserMacros] = useState({ totalCal: 2000, totalPro: 150, totalCarb: 200, totalFat: 65 });

  // Load user macros from context
  useEffect(() => {
    if (user) {
      setUserMacros({
        totalCal: user.totalCal || 2000,
        totalPro: user.totalPro || 150,
        totalCarb: user.totalCarb || 200,
        totalFat: user.totalFat || 65
      });
    }
  }, [user]);

  // Fetch logs for current month from backend
  useEffect(() => {
    const fetchMonthLogs = async () => {
      try {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const res = await API.get(`/progress/history/${year}/${month}`);
        if (res.data.success) {
          setLogs(res.data.logs);
        }
      } catch (err) {
        console.error('Failed to fetch history logs:', err);
      }
    };
    fetchMonthLogs();
  }, [currentDate]);

  // Sync selected day log
  useEffect(() => {
    const iso = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const log = logs.find(l => l.date === iso);
    setSelectedLog(log || null);
  }, [selectedDate, logs]);

  // Calendar Helpers
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty slots
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="cal-day empty"></div>);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const hasLog = logs.some(l => l.date === iso && l.mealsCompleted?.length > 0);
      const isSelected = selectedDate.toDateString() === d.toDateString();
      const isToday = new Date().toDateString() === d.toDateString();

      days.push(
        <div 
          key={i} 
          className={`cal-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${hasLog ? 'has-data' : ''}`}
          onClick={() => setSelectedDate(d)}
        >
          <span className="day-num">{i}</span>
          {hasLog && <div className="data-dot"></div>}
        </div>
      );
    }

    return days;
  };

  // Render Snapshot computations
  let snapCals = 0, snapPro = 0, snapCarb = 0, snapFat = 0;
  
  // Deduplicate mealsCompleted (cleans up any bugged duplicate logs)
  const uniqueCompleted = [];
  if (selectedLog && selectedLog.mealsCompleted) {
    selectedLog.mealsCompleted.forEach(mc => {
      const sIdx = mc.snackIndex ?? 0;
      const exists = uniqueCompleted.find(u => u.mealType === mc.mealType && (u.snackIndex ?? 0) === sIdx);
      if (!exists) uniqueCompleted.push({ ...mc, snackIndex: sIdx });
    });

    // Sort meals chronologically
    const orderMap = { 'breakfast': 1, 'lunch': 3, 'dinner': 5 };
    uniqueCompleted.sort((a, b) => {
      let orderA = orderMap[a.mealType.toLowerCase()] || 10;
      if (a.mealType.toLowerCase() === 'snack') orderA = (a.snackIndex === 0) ? 2 : 4;
      
      let orderB = orderMap[b.mealType.toLowerCase()] || 10;
      if (b.mealType.toLowerCase() === 'snack') orderB = (b.snackIndex === 0) ? 2 : 4;
      
      return orderA - orderB;
    });

    uniqueCompleted.forEach(mc => {
      const assigned = selectedLog.mealsAssigned?.find(ma => ma.mealType === mc.mealType && (mc.mealType !== 'snack' || (ma.snackIndex ?? 0) === (mc.snackIndex ?? 0)));
      if (assigned?.snapshotMacros) {
        snapCals += assigned.snapshotMacros.kcal || 0;
        snapPro += assigned.snapshotMacros.pro || 0;
        snapCarb += assigned.snapshotMacros.carb || 0;
        snapFat += assigned.snapshotMacros.fat || 0;
      } else if (assigned?.customMealId) {
        snapCals += assigned.customMealId.kcal || 0;
        snapPro += assigned.customMealId.pro || 0;
        snapCarb += assigned.customMealId.carb || 0;
        snapFat += assigned.customMealId.fat || 0;
      } else if (assigned?.foodId?.nutrition) {
        snapCals += assigned.foodId.nutrition.calories || 0;
        snapPro += assigned.foodId.nutrition.protein_g || 0;
        snapCarb += assigned.foodId.nutrition.carbs_g || 0;
        snapFat += assigned.foodId.nutrition.fat_g || 0;
      }
    });
  }

  const renderProgressBar = (val, target, color) => {
    const pct = Math.min((val / target) * 100, 100) || 0;
    const isExceeded = val > target;
    return (
      <div className="macro-bar">
        <div className="macro-bar-labels">
          <span style={{ color: isExceeded ? '#e53935' : 'inherit' }}>{Math.round(val)}g</span>
          <span>{target}g</span>
        </div>
        <div className="macro-bar-track">
          <div className="macro-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }}></div>
        </div>
      </div>
    );
  };

  return (
    <div className="history-container">
      <header className="history-header">
        <div>
          <h1>History</h1>
          <p className="subtitle">Review your past performance and reflect.</p>
        </div>
      </header>

      <div className="history-grid">
        
        {/* Left Col: Calendar */}
        <div className="bento-card glass-panel fade-up">
          <div className="cal-header">
            <button onClick={prevMonth} className="cal-nav-btn"><span className="material-symbols-outlined">chevron_left</span></button>
            <h2 className="cal-month">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={nextMonth} className="cal-nav-btn"><span className="material-symbols-outlined">chevron_right</span></button>
          </div>
          
          <div className="cal-weekdays">
            <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
          </div>
          
          <div className="cal-grid">
            {renderCalendar()}
          </div>
        </div>

        {/* Right Col: Daily Snapshot */}
        <div className="bento-card glass-panel fade-up" style={{ animationDelay: '0.2s', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="snapshot-header">
            <h3 className="card-title">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
            {selectedDate.toDateString() === new Date().toDateString() && <span className="badge">Today</span>}
          </div>

          {!selectedLog ? (
            <div className="empty-snapshot">
              <span className="material-symbols-outlined empty-icon">event_busy</span>
              <p>No data logged for this date.</p>
            </div>
          ) : (
            <div className="snapshot-content">
              
              {/* Macro Exceeded Warning */}
              {(snapCals > userMacros.totalCal || 
                snapPro > userMacros.totalPro || 
                snapCarb > userMacros.totalCarb || 
                snapFat > userMacros.totalFat) && (
                <div style={{ marginBottom: '24px', padding: '12px', background: 'var(--color-surface-low)', color: '#e53935', borderRadius: 'var(--radius-card)', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'flex-start', gap: '8px', border: '1px solid #ef9a9a' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>warning</span>
                  <span>You exceeded one or more of your daily macro targets on this day.</span>
                </div>
              )}

              <div className="snapshot-macros">
                <div className="macro-row">
                  <h4>Calories</h4>
                  <div className="macro-bar">
                    <div className="macro-bar-labels">
                      <span style={{ color: snapCals > userMacros.totalCal ? '#e53935' : 'inherit' }}>{Math.round(snapCals)} kcal</span>
                      <span>{userMacros.totalCal} kcal</span>
                    </div>
                    <div className="macro-bar-track">
                      <div className="macro-bar-fill" style={{ width: `${Math.min((snapCals/userMacros.totalCal)*100, 100)}%`, backgroundColor: 'var(--color-primary)' }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="macro-row">
                  <h4>Protein</h4>
                  {renderProgressBar(snapPro, userMacros.totalPro, 'var(--macro-pro)')}
                </div>
                <div className="macro-row">
                  <h4>Carbs</h4>
                  {renderProgressBar(snapCarb, userMacros.totalCarb, 'var(--macro-carb)')}
                </div>
                <div className="macro-row">
                  <h4>Fats</h4>
                  {renderProgressBar(snapFat, userMacros.totalFat, 'var(--macro-fat)')}
                </div>
              </div>

              <div className="snapshot-meals">
                <h4>Meals Logged ({uniqueCompleted.length})</h4>
                <div className="meals-list">
                  {uniqueCompleted.map((mc, idx) => {
                    const assigned = selectedLog.mealsAssigned?.find(ma => ma.mealType === mc.mealType && (mc.mealType !== 'snack' || (ma.snackIndex ?? 0) === (mc.snackIndex ?? 0)));
                    let name = 'Logged Meal';
                    let k = 0;
                    if (assigned?.customMealId) { name = assigned.customMealId.name; k = assigned.customMealId.kcal; }
                    else if (assigned?.foodId) { name = assigned.foodId.name?.en || 'Food'; k = assigned.foodId.nutrition?.calories || 0; }
                    
                    return (
                      <div key={idx} className="snapshot-meal-item">
                        <div className="meal-dot"></div>
                        <div className="meal-details">
                          <span className="meal-type">{mc.mealType}</span>
                          <span className="meal-name">{name}</span>
                        </div>
                        <span className="meal-cals">{Math.round(k)} kcal</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default HistoryPage;
