import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { generateMealSchedule, parseTimeStringToMinutes, parseBusyPeriods, toTimeStr } from '../utils/timeScheduleAlgorithm';
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
  const [newBusy, setNewBusy] = useState({ label: '', startTime: '', endTime: '' });
  
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
        const res = await API.get('/dashboard/daily-meals');
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

  // Add/Remove Busy Period
  const addBusyPeriod = () => {
    setBusyError('');
    if (!newBusy.label) {
      setBusyError('Please provide a label for your busy period.');
      return;
    }
    if (!newBusy.startTime || !newBusy.endTime) {
      setBusyError('Start and end times are required.');
      return;
    }
    // HTML time input value is always 24h format "HH:MM"
    const sParts = newBusy.startTime.split(':');
    const eParts = newBusy.endTime.split(':');
    const sMin = parseInt(sParts[0], 10) * 60 + parseInt(sParts[1], 10);
    const eMin = parseInt(eParts[0], 10) * 60 + parseInt(eParts[1], 10);
    
    if (sMin >= eMin) {
      setBusyError('Start time must be before end time.');
      return;
    }

    setScheduleConfig(prev => ({
      ...prev,
      busyPeriods: [...prev.busyPeriods, { ...newBusy }]
    }));
    setNewBusy({ label: '', startTime: '', endTime: '' });
  };

  const removeBusyPeriod = (idx) => {
    setScheduleConfig(prev => ({
      ...prev,
      busyPeriods: prev.busyPeriods.filter((_, i) => i !== idx)
    }));
  };

  const handleSaveModal = async () => {
    setScheduleError('');
    if (!scheduleConfig.wakeTime || !scheduleConfig.sleepTime) {
      setScheduleError('Wake time and sleep time are required.');
      return;
    }
    try {
      await API.put('/settings', scheduleConfig);
      setHasConfiguredSchedule(true);
      setShowScheduleModal(false);
    } catch (err) {
      console.error(err);
      setScheduleError('Failed to save settings.');
    }
  };

  const maxWater = 8;

  const handleWaterClick = async (index) => {
    let newAmount = index === waterGlasses - 1 ? index : index + 1;
    setWaterGlasses(newAmount);
    try {
      await API.post('/dashboard/water', { waterGlasses: newAmount });
    } catch (err) {
      console.error('Failed to update water', err);
    }
  };

  // Process Schedule Config
  const wakeMin = parseTimeStringToMinutes(scheduleConfig.wakeTime) || 7 * 60;
  const sleepMin = parseTimeStringToMinutes(scheduleConfig.sleepTime) || 22 * 60;
  const busyIntervals = parseBusyPeriods(scheduleConfig.busyPeriods);
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
          <h2 className="dashboard-title">Hello, {user?.name?.split(' ')[0] || 'Alex'}! 👋</h2>
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
                <div key={idx} className={`timeline-item ${meal.logged ? 'is-logged' : 'is-upcoming'}`}>
                  <div className="timeline-time prominent-time">{meal.time}</div>
                  <div className="timeline-node">
                    <div className="node-dot"></div>
                    {idx !== timelineMeals.length - 1 && <div className="node-line"></div>}
                  </div>
                  <div className="timeline-content prominent-content" onClick={() => !meal.logged && navigate('/todays-meals')}>
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

      {/* --- Schedule Configurator Modal --- */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel schedule-modal">
            <div className="modal-header">
              <div className="modal-header-text">
                <h3 className="modal-title">Configure Today's Schedule</h3>
                <p className="modal-desc">Adjust your wake, sleep, and busy times. We'll perfectly space your meals.</p>
              </div>
              <button className="btn-close-modal" onClick={() => setShowScheduleModal(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="onb-schedule-times" style={{ marginBottom: '24px' }}>
              <div className="onb-field">
                <label className="onb-field-label">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-teal)' }}>wb_twilight</span> Wake Time
                </label>
                <input
                  type="time"
                  className="onb-input"
                  value={scheduleConfig.wakeTime}
                  onChange={(e) => setScheduleConfig({...scheduleConfig, wakeTime: e.target.value})}
                />
              </div>
              <div className="onb-field">
                <label className="onb-field-label">
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-purple)' }}>bedtime</span> Sleep Time
                </label>
                <input
                  type="time"
                  className="onb-input"
                  value={scheduleConfig.sleepTime}
                  onChange={(e) => setScheduleConfig({...scheduleConfig, sleepTime: e.target.value})}
                />
              </div>
            </div>

            <div className="busy-periods-section">
              <label className="onb-field-label">
                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--color-red)' }}>event_busy</span> Busy Periods (Work, Gym, etc.)
              </label>
              
              <div className="busy-periods-list custom-scrollbar">
                {scheduleConfig.busyPeriods.length === 0 ? (
                  <div className="empty-busy-state">No busy periods added yet.</div>
                ) : (
                  scheduleConfig.busyPeriods.map((bp, i) => (
                    <div key={i} className="busy-period-card">
                      <div className="busy-period-info">
                        <span className="busy-period-label">{bp.label}</span>
                        <span className="busy-period-time">{bp.startTime} - {bp.endTime}</span>
                      </div>
                      <button className="btn-remove-busy" onClick={() => removeBusyPeriod(i)} title="Remove">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  ))
                )}
              </div>

              {busyError && <div className="modal-error-msg"><span className="material-symbols-outlined">error</span> {busyError}</div>}
              <div className="add-busy-wrapper">
                <div className="add-busy-inputs">
                  <div className="input-col label-col">
                    <span className="tiny-label">Label</span>
                    <input type="text" placeholder="e.g. Work" className="onb-input small-input" value={newBusy.label} onChange={e => setNewBusy({...newBusy, label: e.target.value})} />
                  </div>
                  <div className="input-col">
                    <span className="tiny-label">Start</span>
                    <input type="time" className="onb-input small-input time-input-custom" value={newBusy.startTime} onChange={e => setNewBusy({...newBusy, startTime: e.target.value})} />
                  </div>
                  <div className="input-col">
                    <span className="tiny-label">End</span>
                    <input type="time" className="onb-input small-input time-input-custom" value={newBusy.endTime} onChange={e => setNewBusy({...newBusy, endTime: e.target.value})} />
                  </div>
                </div>
                <button className="btn-add-busy" onClick={addBusyPeriod}>
                  <span className="material-symbols-outlined">add</span> Add
                </button>
              </div>
            </div>

            {scheduleError && <div className="modal-error-msg"><span className="material-symbols-outlined">error</span> {scheduleError}</div>}
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowScheduleModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSaveModal}>Save & Generate Schedule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
