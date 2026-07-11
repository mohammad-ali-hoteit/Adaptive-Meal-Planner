import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { generateMealSchedule, parseTimeStringToMinutes, parseBusyPeriods, toTimeStr } from '../utils/timeScheduleAlgorithm';
import ScheduleModal from '../components/ScheduleModal';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [hasConfiguredSchedule, setHasConfiguredSchedule] = useState(!!user?.schedule);
  const [scheduleConfig, setScheduleConfig] = useState(user?.schedule || {
    wakeTime: '07:00',
    sleepTime: '23:00',
    busyPeriods: []
  });
  
  // Daily Log State
  const [dailyLog, setDailyLog] = useState(null);
  const [waterGlasses, setWaterGlasses] = useState(0);

  // Validation States
  const [busyError, setBusyError] = useState('');
  const [scheduleError, setScheduleError] = useState('');

  // Fetch Daily Log
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        const res = await API.get(`/dashboard/daily-meals?date=${todayStr}`);
        if (res.data.success) {
          setDailyLog(res.data.log);
          setWaterGlasses(res.data.log.waterGlasses || 0);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      }
    };
    fetchDashboard();
  }, []);

  // Auto-open modal if coming from Onboarding
  useEffect(() => {
    if (location.state?.autoOpenSchedule) {
      setShowScheduleModal(true);
      // Clear state so it doesn't reopen on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSaveModal = async (config) => {
    try {
      await API.put('/settings', config);
      setHasConfiguredSchedule(true);
      setShowScheduleModal(false);
      setScheduleConfig(config); // Update local state too
    } catch (err) {
      console.error(err);
      // We can't easily setScheduleError here anymore because the error state is inside ScheduleModal.
      // But the modal will close, so we can just alert or ignore for now.
      alert('Failed to save settings.');
    }
  };

  const maxWater = 8;

  const handleWaterClick = async (index) => {
    let newAmount = index === waterGlasses - 1 ? index : index + 1;
    setWaterGlasses(newAmount);
    try {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      await API.post('/dashboard/water', { waterGlasses: newAmount, date: todayStr });
    } catch (err) {
      console.error('Failed to update water', err);
    }
  };

  const handleCompleteMeal = async (e, slot) => {
    e.stopPropagation();
    try {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const res = await API.post('/dashboard/complete-meal', { mealType: slot.toLowerCase(), date: todayStr });
      if (res.data.success) {
        setDailyLog(res.data.log);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const activeScheduleConfig = dailyLog?.scheduleOverride || scheduleConfig;

  // Process Schedule Config
  const wakeMin = parseTimeStringToMinutes(activeScheduleConfig.wakeTime) || 7 * 60;
  const sleepMin = parseTimeStringToMinutes(activeScheduleConfig.sleepTime) || 22 * 60;
  const busyIntervals = parseBusyPeriods(activeScheduleConfig.busyPeriods);
  const totalCal = 2000;
  
  const scheduleData = generateMealSchedule(wakeMin, sleepMin, busyIntervals, totalCal);
  
  // Transform algorithm meals for UI
  const timelineMeals = scheduleData.meals.map((meal) => {
    const assigned = dailyLog?.mealsAssigned?.find(m => m.mealType.toLowerCase() === meal.name.toLowerCase());
    const isCompleted = dailyLog?.mealsCompleted?.find(m => m.mealType.toLowerCase() === meal.name.toLowerCase());
    
    let kcal = meal.calories;
    let protein = Math.round(meal.calories * 0.25 / 4);
    let name = '';
    
    if (assigned && assigned.customMealId) {
      name = assigned.customMealId.name;
      kcal = assigned.customMealId.kcal;
      protein = assigned.customMealId.pro;
    } else if (assigned && assigned.foodId) {
      name = assigned.foodId.name?.en || 'Food';
      kcal = assigned.foodId.nutrition?.calories || 0;
      protein = assigned.foodId.nutrition?.protein_g || 0;
    }

    return {
      slot: meal.name,
      time: meal.timeStr,
      logged: !!isCompleted,
      assigned: !!name,
      name,
      kcal,
      protein,
      recommended: meal.calories
    };
  });

  // Calculate actual consumed macros
  const consumed = timelineMeals.filter(m => m.logged).reduce((acc, curr) => {
    acc.kcal += curr.kcal;
    acc.pro += curr.protein;
    return acc;
  }, { kcal: 0, pro: 0, carb: 0, fat: 0 });

  const mockMacros = { 
    calories: consumed.kcal, 
    caloriesTarget: totalCal, 
    protein: consumed.pro, 
    proteinTarget: 160, 
    carbs: consumed.carb, carbsTarget: 250, 
    fat: consumed.fat, fatTarget: 70 
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // Calorie Ring calculations
  const calPct = Math.min((mockMacros.calories / mockMacros.caloriesTarget) * 100, 100);
  const circleRadius = 70;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circleCircumference - (calPct / 100) * circleCircumference;

  return (
    <div className="dashboard-container">
      {/* Top Section: Greeting */}
      <header className="dashboard-header">
        <div className="dashboard-greeting">
          <p className="dashboard-subtitle">{today} • Let's hit those goals.</p>
        </div>
      </header>

      {/* Main Grid: Schedule is now the primary focus (Left), Stats on the Right */}
      <div className="dashboard-bento-grid">
        
        {/* Left Column: Vertical Timeline (Primary Focus) */}
        <div className="bento-left">
          <div className="bento-card timeline-card glass-panel h-full">
            <div className="timeline-header" style={{ marginBottom: '16px' }}>
              <h3 className="bento-card-title" style={{ fontSize: '24px', marginBottom: 0 }}>Today's Schedule</h3>
              <div className="schedule-actions">
                {!hasConfiguredSchedule && (
                  <div className="schedule-pointer-tooltip prominent-tooltip">
                    <strong>Important:</strong> Please set your daily schedule! <span className="pointer-arrow">↓</span>
                  </div>
                )}
                <button className="btn-configure-schedule" onClick={() => setShowScheduleModal(true)}>
                  <span className="material-symbols-outlined">settings</span> Configure Today
                </button>
              </div>
            </div>
            
            <div className="timeline-container prominent" style={{ marginTop: '24px' }}>
              {timelineMeals.map((meal, idx) => (
                <div key={idx} className={`timeline-item ${meal.logged ? 'is-logged' : meal.assigned ? 'is-planned' : 'is-upcoming'}`}>
                  <div className="timeline-time prominent-time">{meal.time}</div>
                  <div className="timeline-node">
                    <div className="node-dot"></div>
                    {idx !== timelineMeals.length - 1 && <div className="node-line"></div>}
                  </div>
                  <div className="timeline-content prominent-content" onClick={() => !meal.logged && !meal.assigned && navigate(`/pantry?slot=${meal.slot}`)}>
                    {meal.logged ? (
                      <div className="meal-box logged prominent-box">
                        <div className="meal-box-header">
                          <h4>{meal.slot}</h4>
                          <span className="status-badge">Logged</span>
                        </div>
                        <p className="meal-name">{meal.name}</p>
                        <div className="meal-macros">
                          <span className="macro-chip kcal">🔥 {meal.kcal} kcal</span>
                          <span className="macro-chip pro">💪 {meal.protein}g P</span>
                        </div>
                      </div>
                    ) : meal.assigned ? (
                      <div className="meal-box planned prominent-box" style={{ borderLeft: '4px solid var(--color-secondary)' }}>
                        <div className="meal-box-header">
                          <h4>{meal.slot}</h4>
                          <span className="status-badge" style={{background: 'var(--color-secondary)', color: 'white'}}>Planned</span>
                        </div>
                        <p className="meal-name">{meal.name}</p>
                        <div className="meal-macros">
                          <span className="macro-chip kcal">🔥 {meal.kcal} kcal</span>
                          <span className="macro-chip pro">💪 {meal.protein}g P</span>
                        </div>
                        <button className="btn-add-mini" onClick={(e) => handleCompleteMeal(e, meal.slot)} style={{ background: 'var(--color-secondary)', color: 'white' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px' }}>check</span> Mark Eaten
                        </button>
                      </div>
                    ) : (
                      <div className="meal-box upcoming hoverable prominent-box">
                        <div className="meal-box-header">
                          <h4>{meal.slot}</h4>
                        </div>
                        <p className="meal-name">Recommended ~{meal.recommended} kcal</p>
                        <button className="btn-add-mini">+ Add Food</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Daily Summary & Trackers (Secondary Focus) */}
        <div className="bento-right">
          
          {/* Stats Panel */}
          <div className="bento-card hero-macro-card glass-panel sidebar-stats">
            <h3 className="bento-card-title">Daily Summary</h3>
            <div className="hero-macro-content vertical">
              
              {/* Calorie Ring */}
              <div className="calorie-ring-container small-ring">
                <svg width="150" height="150" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r={circleRadius} className="ring-bg" />
                  <circle 
                    cx="80" 
                    cy="80" 
                    r={circleRadius} 
                    className="ring-fill" 
                    strokeDasharray={circleCircumference}
                    strokeDashoffset={strokeDashoffset}
                  />
                </svg>
                <div className="calorie-ring-text">
                  <span className="cal-current">{mockMacros.caloriesTarget - mockMacros.calories}</span>
                  <span className="cal-label">kcal left</span>
                </div>
              </div>

              {/* Macro Bars */}
              <div className="macro-bars-container full-width">
                <div className="macro-bar-row">
                  <div className="macro-bar-label">
                    <span>Protein</span>
                    <span>{mockMacros.protein} / {mockMacros.proteinTarget}g</span>
                  </div>
                  <div className="macro-bar-track">
                    <div className="macro-bar-fill bg-purple" style={{ width: `${(mockMacros.protein / mockMacros.proteinTarget) * 100}%` }}></div>
                  </div>
                </div>
                
                <div className="macro-bar-row">
                  <div className="macro-bar-label">
                    <span>Carbs</span>
                    <span>{mockMacros.carbs} / {mockMacros.carbsTarget}g</span>
                  </div>
                  <div className="macro-bar-track">
                    <div className="macro-bar-fill bg-teal" style={{ width: `${(mockMacros.carbs / mockMacros.carbsTarget) * 100}%` }}></div>
                  </div>
                </div>

                <div className="macro-bar-row">
                  <div className="macro-bar-label">
                    <span>Fat</span>
                    <span>{mockMacros.fat} / {mockMacros.fatTarget}g</span>
                  </div>
                  <div className="macro-bar-track">
                    <div className="macro-bar-fill bg-gold" style={{ width: `${(mockMacros.fat / mockMacros.fatTarget) * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Water Tracker */}
          <div className="bento-card water-card glass-panel" style={{ marginTop: '24px' }}>
            <h3 className="bento-card-title">Hydration</h3>
            <div className="water-glasses compact">
              {Array.from({ length: maxWater }).map((_, i) => (
                <button 
                  key={i} 
                  className={`water-glass ${i < waterGlasses ? 'filled' : ''}`}
                  onClick={() => handleWaterClick(i)}
                  aria-label={`Glass ${i + 1}`}
                >
                  💧
                </button>
              ))}
            </div>
            <p className="water-status">{waterGlasses} / {maxWater} glasses</p>
          </div>

        </div>
      </div>

      {showScheduleModal && (
        <ScheduleModal 
          onClose={() => setShowScheduleModal(false)}
          onSave={handleSaveModal}
          initialData={scheduleConfig}
          title="Configure Today's Schedule"
        />
      )}
    </div>
  );
};

export default DashboardPage;
