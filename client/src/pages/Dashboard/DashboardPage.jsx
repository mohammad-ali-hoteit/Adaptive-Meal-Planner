import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../../components/Modals/ConfirmModal';
import API from '../../api/axios';
import { generateMealSchedule, parseTimeStringToMinutes, parseBusyPeriods, toTimeStr } from '../../utils/algorithms/timeScheduleAlgorithm';
import ScheduleModal from '../../components/Modals/ScheduleModal';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [hasConfiguredSchedule, setHasConfiguredSchedule] = useState(!!user?.schedule?.wakeTime);
  const [scheduleConfig, setScheduleConfig] = useState(user?.schedule || {
    wakeTime: '07:00',
    sleepTime: '23:00',
    busyPeriods: []
  });
  
  // Daily Log State
  const [dailyLog, setDailyLog] = useState(null);
  const [waterGlasses, setWaterGlasses] = useState(0);

  // State for confirm modal
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, slot: null, idx: null });

  // Fetch Daily Log from Backend
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;
        
        const res = await API.get(`/dashboard/${todayStr}`);
        if (res.data.success) {
          setDailyLog(res.data.log);
          setWaterGlasses(res.data.log.waterGlasses || 0);
          
          // If log has a schedule override, use that
          if (res.data.log.scheduleOverride?.wakeTime) {
            setHasConfiguredSchedule(true);
          }
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
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleSaveModal = async (config) => {
    try {
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      // Save schedule override for today via API
      const res = await API.put('/dashboard/schedule-override', {
        date: todayStr,
        wakeTime: config.wakeTime,
        sleepTime: config.sleepTime,
        busyPeriods: config.busyPeriods
      });

      if (res.data.success) {
        setDailyLog(res.data.log);
      }

      // Also update default user schedule
      await API.put('/settings', config).catch(e => console.warn('Failed to update default schedule'));
      
      setHasConfiguredSchedule(true);
      setShowScheduleModal(false);
      setScheduleConfig(config);
    } catch (err) {
      console.error(err);
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
      
      const res = await API.post('/dashboard/water', { waterGlasses: newAmount, date: todayStr });
      if (res.data.success) {
        setDailyLog(res.data.log);
      }
    } catch (err) {
      console.error('Failed to update water', err);
    }
  };

  const handleCompleteMeal = async (e, slot, idx) => {
    e.stopPropagation();
    try {
      const res = await API.post('/dashboard/complete-meal', { 
        mealType: slot.toLowerCase(), 
        date: dailyLog.date,
        snackIndex: idx 
      });
      if (res.data.success) {
        setDailyLog(res.data.log);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddFood = (meal) => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const params = new URLSearchParams({
      slot: meal.slot || 'Breakfast',
      date: dailyLog?.date || todayStr,
      snackIndex: meal.snackIndex ?? '',
      targetCal: meal.kcal || 500,
      targetPro: meal.protein || 40,
      targetCarb: meal.carbs || 45,
      targetFat: meal.fat || 15
    });
    navigate(`/my-meals?${params.toString()}`);
  };

  const handleRemoveMealClick = (e, slot, idx) => {
    e.stopPropagation();
    setConfirmModal({ isOpen: true, slot, idx });
  };

  const handleConfirmRemoveMeal = async () => {
    const { slot, idx } = confirmModal;
    if (!slot) return;
    try {
      const res = await API.delete('/dashboard/remove-meal', { 
        data: { mealType: slot.toLowerCase(), date: dailyLog.date, snackIndex: idx } 
      });
      if (res.data.success) {
        setDailyLog(res.data.log);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmModal({ isOpen: false, slot: null, idx: null });
    }
  };

  const activeScheduleConfig = dailyLog?.scheduleOverride?.wakeTime ? dailyLog.scheduleOverride : scheduleConfig;

  // Process Schedule Config
  const wakeMin = parseTimeStringToMinutes(activeScheduleConfig.wakeTime) || 7 * 60;
  const sleepMin = parseTimeStringToMinutes(activeScheduleConfig.sleepTime) || 22 * 60;
  const busyIntervals = parseBusyPeriods(activeScheduleConfig.busyPeriods || []);
  
  // Define our macro goals from user data
  const userMacros = user ? {
    totalCal: user.totalCal || 2000,
    totalPro: user.totalPro || 150,
    totalCarb: user.totalCarb || 200,
    totalFat: user.totalFat || 65
  } : {
    totalCal: 2000,
    totalPro: 150,
    totalCarb: 200,
    totalFat: 65
  };
  
  // Generate Schedule with the new macro logic
  const scheduleData = generateMealSchedule(wakeMin, sleepMin, busyIntervals, userMacros, hasConfiguredSchedule);
  
  // Transform algorithm meals for UI
  let snackIdxAssigned = 0;

  const timelineMeals = scheduleData.meals.map((meal) => {
    let assigned, isCompleted;
    let currentSnackIdx = 0;

    if (meal.name.toLowerCase() === 'snack') {
      currentSnackIdx = snackIdxAssigned++;
      assigned = dailyLog?.mealsAssigned?.find(m => m.mealType === 'snack' && m.snackIndex === currentSnackIdx);
      isCompleted = dailyLog?.mealsCompleted?.find(m => m.mealType === 'snack' && m.snackIndex === currentSnackIdx);
    } else {
      assigned = dailyLog?.mealsAssigned?.find(m => m.mealType.toLowerCase() === meal.name.toLowerCase());
      isCompleted = dailyLog?.mealsCompleted?.find(m => m.mealType.toLowerCase() === meal.name.toLowerCase());
    }
    
    // Default values generated by algorithm
    let kcal = meal.calories;
    let protein = meal.macros?.pro || 0;
    let carbs = meal.macros?.carb || 0;
    let fat = meal.macros?.fat || 0;
    let name = '';
    
    // Override if user actually logged/assigned food
    if (assigned && assigned.snapshotMacros) {
      name = assigned.customMealId?.name || assigned.foodId?.name?.en || 'Logged Meal';
      kcal = assigned.snapshotMacros.kcal || 0;
      protein = assigned.snapshotMacros.pro || 0;
      carbs = assigned.snapshotMacros.carb || assigned.snapshotMacros.carbs || 0;
      fat = assigned.snapshotMacros.fat || 0;
    } else if (assigned && assigned.customMealId) {
      name = assigned.customMealId.name;
      kcal = assigned.customMealId.kcal || 0;
      protein = assigned.customMealId.pro || 0;
      carbs = assigned.customMealId.carb || 0;
      fat = assigned.customMealId.fat || 0;
    } else if (assigned && assigned.foodId) {
      name = assigned.foodId.name?.en || 'Food';
      kcal = assigned.foodId.nutrition?.calories || 0;
      protein = assigned.foodId.nutrition?.protein_g || 0;
      carbs = assigned.foodId.nutrition?.carbohydrates_g || 0;
      fat = assigned.foodId.nutrition?.fat_g || 0;
    }

    return {
      slot: meal.name,
      time: meal.timeStr,
      logged: !!isCompleted,
      assigned: !!name,
      name,
      kcal,
      protein,
      carbs,
      fat,
      recommended: meal.calories,
      recommendedPro: meal.macros?.pro || 0,
      recommendedCarb: meal.macros?.carb || 0,
      recommendedFat: meal.macros?.fat || 0,
      snackIndex: currentSnackIdx,
      macroBadge: meal.macroBadge,
      macroReason: meal.macroReason
    };
  });

  // Calculate actual consumed macros
  const consumed = timelineMeals.filter(m => m.logged).reduce((acc, curr) => {
    acc.kcal += curr.kcal;
    acc.pro += curr.protein;
    acc.carb += curr.carbs;
    acc.fat += curr.fat;
    return acc;
  }, { kcal: 0, pro: 0, carb: 0, fat: 0 });

  const mockMacros = { 
    calories: Math.round(consumed.kcal), 
    caloriesTarget: Math.round(userMacros.totalCal), 
    protein: Math.round(consumed.pro), 
    proteinTarget: Math.round(userMacros.totalPro), 
    carbs: Math.round(consumed.carb), carbsTarget: Math.round(userMacros.totalCarb), 
    fat: Math.round(consumed.fat), fatTarget: Math.round(userMacros.totalFat) 
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
                  <div className="timeline-time prominent-time">
                    {hasConfiguredSchedule ? meal.time : '--:--'}
                  </div>
                  <div className="timeline-node">
                    <div className="node-dot"></div>
                    {idx !== timelineMeals.length - 1 && <div className="node-line"></div>}
                  </div>
                  <div className="timeline-content prominent-content" onClick={() => !meal.logged && !meal.assigned && handleAddFood(meal)}>
                    {meal.logged ? (
                      <div className="meal-box logged prominent-box">
                        <div className="meal-box-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4>{meal.slot}</h4>
                            {meal.macroBadge && meal.macroBadge !== 'balanced' && (
                              <span className="status-badge" title={meal.macroReason} style={{ background: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-border)', textTransform: 'capitalize' }}>
                                {meal.macroBadge.replace('-', ' ')}
                              </span>
                            )}
                            <span className="status-badge logged">Logged</span>
                          </div>
                          <div className="meal-actions-container">
                            <button className="btn-meal-action remove" onClick={(e) => handleRemoveMealClick(e, meal.slot, meal.snackIndex)} title="Remove Meal">
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                            </button>
                          </div>
                        </div>
                        <p className="meal-name">{meal.name}</p>
                        <div className="meal-macros">
                          <span className="macro-chip kcal">🔥 {meal.kcal} kcal</span>
                          <span className="macro-chip pro">💪 {meal.protein}g P</span>
                          <span className="macro-chip carb">🍞 {meal.carbs}g C</span>
                          <span className="macro-chip fat">🥑 {meal.fat}g F</span>
                        </div>
                      </div>
                    ) : meal.assigned ? (
                      <div className="meal-box planned prominent-box">
                        <div className="meal-box-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4>{meal.slot}</h4>
                            {meal.macroBadge && meal.macroBadge !== 'balanced' && (
                              <span className="status-badge" title={meal.macroReason} style={{ background: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-border)', textTransform: 'capitalize' }}>
                                {meal.macroBadge.replace('-', ' ')}
                              </span>
                            )}
                            <span className="status-badge planned">Planned</span>
                          </div>
                          <div className="meal-actions-container">
                            <button className="btn-meal-action remove" onClick={(e) => handleRemoveMealClick(e, meal.slot, meal.snackIndex)} title="Remove Meal">
                              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                            </button>
                          </div>
                        </div>
                        <p className="meal-name">{meal.name}</p>
                        <div className="meal-macros" style={{ marginBottom: '16px' }}>
                          <span className="macro-chip kcal">🔥 {meal.kcal} kcal</span>
                          <span className="macro-chip pro">💪 {meal.protein}g P</span>
                          <span className="macro-chip carb">🍞 {meal.carbs}g C</span>
                          <span className="macro-chip fat">🥑 {meal.fat}g F</span>
                        </div>
                        <button className="btn-add-mini" onClick={(e) => handleCompleteMeal(e, meal.slot, meal.snackIndex)} style={{ background: 'var(--color-primary)', color: 'white', border: 'none' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '16px', marginRight: '4px' }}>check</span> Mark Eaten
                        </button>
                      </div>
                    ) : (
                      <div className="meal-box upcoming hoverable prominent-box">
                        <div className="meal-box-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h4>{meal.slot}</h4>
                            {meal.macroBadge && meal.macroBadge !== 'balanced' && (
                              <span className="status-badge" title={meal.macroReason} style={{ background: 'var(--color-surface)', color: 'var(--color-primary)', border: '1px solid var(--color-border)', textTransform: 'capitalize' }}>
                                {meal.macroBadge.replace('-', ' ')}
                              </span>
                            )}
                            <span className="status-badge upcoming">To Plan</span>
                          </div>
                        </div>
                        <p className="meal-name">Recommended ~{meal.recommended} kcal</p>
                        <button className="btn-add-mini" onClick={(e) => { e.stopPropagation(); handleAddFood(meal); }}>+ Add Food</button>
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
                  <span className="cal-current" style={{ color: mockMacros.calories > mockMacros.caloriesTarget ? '#e53935' : 'inherit' }}>
                    {mockMacros.calories}
                  </span>
                  <span className="cal-label">
                    / {mockMacros.caloriesTarget} kcal
                  </span>
                </div>
              </div>

              {/* Macro Bars */}
              <div className="macro-bars-container full-width">
                <div className="macro-bar-row">
                  <div className="macro-bar-label">
                    <span>Protein</span>
                    <span style={{ color: mockMacros.protein > mockMacros.proteinTarget ? '#e53935' : 'inherit' }}>{mockMacros.protein} / {mockMacros.proteinTarget}g</span>
                  </div>
                  <div className="macro-bar-track">
                    <div className="macro-bar-fill bg-purple" style={{ width: `${Math.min((mockMacros.protein / mockMacros.proteinTarget) * 100, 100)}%` }}></div>
                  </div>
                </div>
                
                <div className="macro-bar-row">
                  <div className="macro-bar-label">
                    <span>Carbs</span>
                    <span style={{ color: mockMacros.carbs > mockMacros.carbsTarget ? '#e53935' : 'inherit' }}>{mockMacros.carbs} / {mockMacros.carbsTarget}g</span>
                  </div>
                  <div className="macro-bar-track">
                    <div className="macro-bar-fill bg-teal" style={{ width: `${Math.min((mockMacros.carbs / mockMacros.carbsTarget) * 100, 100)}%` }}></div>
                  </div>
                </div>

                <div className="macro-bar-row">
                  <div className="macro-bar-label">
                    <span>Fat</span>
                    <span style={{ color: mockMacros.fat > mockMacros.fatTarget ? '#e53935' : 'inherit' }}>{mockMacros.fat} / {mockMacros.fatTarget}g</span>
                  </div>
                  <div className="macro-bar-track">
                    <div className="macro-bar-fill bg-red" style={{ width: `${Math.min((mockMacros.fat / mockMacros.fatTarget) * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>

              {/* Macro Exceeded Warning */}
              {(mockMacros.calories > mockMacros.caloriesTarget || 
                mockMacros.protein > mockMacros.proteinTarget || 
                mockMacros.carbs > mockMacros.carbsTarget || 
                mockMacros.fat > mockMacros.fatTarget) && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-surface-low)', color: 'var(--color-primary)', borderRadius: 'var(--radius-card)', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'flex-start', gap: '8px', border: '1px solid var(--color-border-warm)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>warning</span>
                  <span>You have exceeded one or more of your daily macro targets. Try to balance your remaining meals carefully.</span>
                </div>
              )}
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
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, slot: null, idx: null })}
        onConfirm={handleConfirmRemoveMeal}
        title="Remove Meal"
        message={`Are you sure you want to remove this meal from your plan?`}
      />

    </div>
  );
};

export default DashboardPage;
