import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';
import ConfirmModal from '../../components/Modals/ConfirmModal';
import { generateMealSchedule, parseTimeStringToMinutes, parseBusyPeriods } from '../../utils/algorithms/timeScheduleAlgorithm';
import ScheduleModal from '../../components/Modals/ScheduleModal';
import './WeeklyPlanPage.css';

const WeeklyPlanPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Custom schedule modal for specific day
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDateForSchedule, setSelectedDateForSchedule] = useState(null);
  const [dateStringForSchedule, setDateStringForSchedule] = useState(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, slot: null, dateISO: null, idx: null });

  const todayCardRef = useRef(null);

  const getStartOfWeek = (d) => {
    const date = new Date(d);
    date.setHours(0,0,0,0);
    const day = date.getDay(); // 0 is Sunday, 1 is Monday
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const currentToday = new Date();
  currentToday.setHours(0,0,0,0);
  const startOfWeek = getStartOfWeek(currentToday);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  
  const dateRangeStr = `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const fetchWeeklyData = async () => {
    try {
      const startDateStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
      
      // Fetch 7 days of logs from backend
      const res = await API.get(`/dashboard/weekly/${startDateStr}`);
      const logs = res.data?.logs || [];

      const generatedWeek = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const dayString = String(d.getDate()).padStart(2, '0');
        const localDateISO = `${year}-${month}-${dayString}`;
        
        const log = logs.find(l => l.date === localDateISO);
        
        const hasConfiguredSchedule = !!log?.scheduleOverride?.wakeTime || !!user?.schedule;
        const activeScheduleConfig = log?.scheduleOverride?.wakeTime ? log.scheduleOverride : (user?.schedule || {
          wakeTime: '07:00',
          sleepTime: '23:00',
          busyPeriods: []
        });
        
        const wakeMin = parseTimeStringToMinutes(activeScheduleConfig.wakeTime || '07:00');
        const sleepMin = parseTimeStringToMinutes(activeScheduleConfig.sleepTime || '23:00');
        const busyIntervals = parseBusyPeriods(activeScheduleConfig.busyPeriods || []);
        const userMacros = {
          totalCal: user?.totalCal || 2000,
          totalPro: user?.totalPro || 150,
          totalCarb: user?.totalCarb || 200,
          totalFat: user?.totalFat || 65
        };
        
        const scheduleData = generateMealSchedule(wakeMin, sleepMin, busyIntervals, userMacros, hasConfiguredSchedule);
        
        let snackIdxAssigned = 0;

        const mappedMeals = scheduleData.meals.map(meal => {
          let assigned, isCompleted = false;
          let currentSnackIdx = 0;

          if (meal.name.toLowerCase() === 'snack') {
            currentSnackIdx = snackIdxAssigned++;
            assigned = log?.mealsAssigned?.find(m => m.mealType === 'snack' && m.snackIndex === currentSnackIdx);
            isCompleted = !!log?.mealsCompleted?.find(m => m.mealType === 'snack' && m.snackIndex === currentSnackIdx);
          } else {
            assigned = log?.mealsAssigned?.find(m => m.mealType.toLowerCase() === meal.name.toLowerCase());
            isCompleted = !!log?.mealsCompleted?.find(m => m.mealType.toLowerCase() === meal.name.toLowerCase());
          }
          let kcal = meal.calories;
          let pro = meal.macros?.pro || 0;
          let carb = meal.macros?.carb || 0;
          let fat = meal.macros?.fat || 0;
          let name = '';
          let isAssigned = false;
          
          if (assigned?.snapshotMacros) {
            name = assigned.customMealId?.name || assigned.foodId?.name?.en || 'Logged Meal';
            kcal = assigned.snapshotMacros.kcal || 0;
            pro = assigned.snapshotMacros.pro || 0;
            carb = assigned.snapshotMacros.carb || 0;
            fat = assigned.snapshotMacros.fat || 0;
            isAssigned = true;
          } else if (assigned?.customMealId) {
            name = assigned.customMealId.name;
            kcal = assigned.customMealId.kcal;
            pro = assigned.customMealId.pro || 0;
            carb = assigned.customMealId.carb || 0;
            fat = assigned.customMealId.fat || 0;
            isAssigned = true;
          } else if (assigned?.foodId) {
            name = assigned.foodId.name?.en || assigned.foodId.name || 'Food';
            kcal = assigned.foodId.nutrition?.calories || 0;
            pro = assigned.foodId.nutrition?.protein_g || 0;
            carb = assigned.foodId.nutrition?.carbs_g || 0;
            fat = assigned.foodId.nutrition?.fat_g || 0;
            isAssigned = true;
          }
          
          return {
            slot: meal.name,
            name,
            kcal,
            time: meal.timeStr,
            isAssigned,
            isLogged: isCompleted,
            recommended: meal.calories,
            snackIndex: currentSnackIdx,
            protein: pro,
            carbs: carb,
            fat: fat
          };
        });

        const totalDayKcal = mappedMeals.reduce((sum, m) => sum + (m.isAssigned ? (Number(m.kcal) || 0) : 0), 0);
        const loggedDayKcal = mappedMeals.reduce((sum, m) => sum + (m.isAssigned ? (Number(m.kcal) || 0) : 0), 0);
        const loggedDayPro = mappedMeals.reduce((sum, m) => sum + (m.isAssigned ? (Number(m.protein) || 0) : 0), 0);
        const loggedDayCarb = mappedMeals.reduce((sum, m) => sum + (m.isAssigned ? (Number(m.carbs) || 0) : 0), 0);
        const loggedDayFat = mappedMeals.reduce((sum, m) => sum + (m.isAssigned ? (Number(m.fat) || 0) : 0), 0);
        
        const isToday = d.getTime() === currentToday.getTime();
        const id = `day-${i}`;

        generatedWeek.push({
          id: id,
          dateObject: d,
          dateISO: localDateISO,
          day: d.toLocaleDateString('en-US', { weekday: 'long' }),
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          isToday: isToday,
          isPast: d.getTime() < currentToday.getTime(),
          hasOverride: !!log?.scheduleOverride?.wakeTime,
          kcal: totalDayKcal,
          loggedKcal: loggedDayKcal,
          loggedPro: loggedDayPro,
          loggedCarb: loggedDayCarb,
          loggedFat: loggedDayFat,
          targetKcal: userMacros.totalCal,
          targetPro: userMacros.totalPro,
          targetCarb: userMacros.totalCarb,
          targetFat: userMacros.totalFat,
          meals: mappedMeals
        });
      }

      setWeeklyPlan(generatedWeek);
      
    } catch (err) {
      console.error("Failed to fetch weekly plan", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyData();
  }, [user]);

  useEffect(() => {
    if (!loading && weeklyPlan.length > 0 && todayCardRef.current) {
      setTimeout(() => {
        todayCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [loading, weeklyPlan]);

  const handleAddFood = (meal, dateISO) => {
    const params = new URLSearchParams({
      slot: meal.slot || 'Breakfast',
      date: dateISO,
      snackIndex: meal.snackIndex ?? '',
      targetCal: meal.recommended || 500,
      targetPro: meal.protein || 40,
      targetCarb: meal.carbs || 45,
      targetFat: meal.fat || 15
    });
    navigate(`/my-meals?${params.toString()}`);
  };
  
  const handleConfigureDay = (day) => {
    setSelectedDateForSchedule(day.dateObject);
    setDateStringForSchedule(day.dateISO);
    setShowScheduleModal(true);
  };
  
  const handleSaveScheduleOverride = async (config) => {
    try {
      await API.put('/dashboard/schedule-override', {
        date: dateStringForSchedule,
        wakeTime: config.wakeTime,
        sleepTime: config.sleepTime,
        busyPeriods: config.busyPeriods
      });
      
      setShowScheduleModal(false);
      fetchWeeklyData();
    } catch (err) {
      console.error("Failed to override schedule", err);
    }
  };

  const handleRemoveMealClick = (e, slot, dateISO, idx) => {
    e.stopPropagation();
    setConfirmModal({ isOpen: true, slot, dateISO, idx });
  };

  const handleConfirmRemoveMeal = async () => {
    const { slot, dateISO, idx } = confirmModal;
    if (!slot) return;
    try {
      await API.delete('/dashboard/remove-meal', {
        data: { mealType: slot.toLowerCase(), date: dateISO, snackIndex: idx }
      });
      
      fetchWeeklyData();
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmModal({ isOpen: false, slot: null, dateISO: null, idx: null });
    }
  };

  if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>Loading...</div>;

  return (
    <div className="weekly-plan-container fade-in custom-scrollbar">
      <div className="weekly-plan-header">
        <div className="header-text">
          <h2>Weekly Plan</h2>
          <p>Plan your meals and schedules for the upcoming week.</p>
        </div>
        <div className="week-nav">
          <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>calendar_month</span>
          <span className="week-date-range">{dateRangeStr}</span>
        </div>
      </div>

      <div className="days-list">
        {weeklyPlan.map(day => {
          const isEmptyPastDay = day.isPast && day.meals.every(m => !m.isAssigned);
          
          return (
            <div key={day.id} ref={day.isToday ? todayCardRef : null} className={`day-card ${day.isToday ? 'is-today' : ''}`}>
              
              <div className="day-header">
                <div className="day-info">
                  <div className="date-box">
                    <span className="date-box-num">{day.date.split(' ')[1]}</span>
                    <span className="date-box-month">{day.date.split(' ')[0]}</span>
                  </div>
                  <div className="day-info-text">
                    <h3>
                      {day.day} 
                      {day.isToday && <span className="today-tag">Today</span>}
                    </h3>
                    <p className="planned-kcal">{day.kcal} kcal planned</p>
                  </div>
                </div>
                
                <div className="day-progress">
                  <div className="weekly-macro-grid">
                    {/* Calories */}
                    <div className="weekly-macro-item">
                      <p className="weekly-macro-text" style={{ color: day.loggedKcal > day.targetKcal ? '#e53935' : 'inherit' }}>
                        <span>Cal</span> <span><strong>{Math.round(day.loggedKcal || 0)}</strong> / {day.targetKcal || 2000}</span>
                      </p>
                      <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ backgroundColor: 'var(--color-primary)', width: `${Math.min(100, ((day.loggedKcal || 0) / (day.targetKcal || 1)) * 100)}%` }}></div></div>
                    </div>
                    {/* Protein */}
                    <div className="weekly-macro-item">
                      <p className="weekly-macro-text" style={{ color: day.loggedPro > day.targetPro ? '#e53935' : 'inherit' }}>
                        <span>Pro</span> <span><strong>{Math.round(day.loggedPro || 0)}</strong> / {day.targetPro || 150}</span>
                      </p>
                      <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ backgroundColor: 'var(--macro-pro)', width: `${Math.min(100, ((day.loggedPro || 0) / (day.targetPro || 1)) * 100)}%` }}></div></div>
                    </div>
                    {/* Carbs */}
                    <div className="weekly-macro-item">
                      <p className="weekly-macro-text" style={{ color: day.loggedCarb > day.targetCarb ? '#e53935' : 'inherit' }}>
                        <span>Carb</span> <span><strong>{Math.round(day.loggedCarb || 0)}</strong> / {day.targetCarb || 200}</span>
                      </p>
                      <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ backgroundColor: 'var(--macro-carb)', width: `${Math.min(100, ((day.loggedCarb || 0) / (day.targetCarb || 1)) * 100)}%` }}></div></div>
                    </div>
                    {/* Fat */}
                    <div className="weekly-macro-item">
                      <p className="weekly-macro-text" style={{ color: day.loggedFat > day.targetFat ? '#e53935' : 'inherit' }}>
                        <span>Fat</span> <span><strong>{Math.round(day.loggedFat || 0)}</strong> / {day.targetFat || 65}</span>
                      </p>
                      <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ backgroundColor: 'var(--macro-fat)', width: `${Math.min(100, ((day.loggedFat || 0) / (day.targetFat || 1)) * 100)}%` }}></div></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Macro Warning Message */}
              {(day.loggedKcal > day.targetKcal || day.loggedPro > day.targetPro || day.loggedCarb > day.targetCarb || day.loggedFat > day.targetFat) && (
                <div style={{ margin: '0 24px', padding: '10px 16px', background: 'var(--color-surface-low)', color: '#e53935', borderRadius: 'var(--radius-card)', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #ef9a9a' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>warning</span>
                  <span>You exceeded one or more of your daily macro targets on this day.</span>
                </div>
              )}

              <div className="day-content">
                {!day.isPast && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '24px', paddingBottom: '16px' }}>
                    <button 
                      className="btn-outline"
                      onClick={() => handleConfigureDay(day)}
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>schedule</span>
                      Configure Custom Schedule
                    </button>
                  </div>
                )}
                
                {isEmptyPastDay && (
                  <div className="past-day-empty">
                    <span className="material-symbols-outlined">event_busy</span>
                    <p>No meals were planned or logged for this day.</p>
                  </div>
                )}

                {(!isEmptyPastDay && day.isPast) && (
                  <div style={{ marginTop: '24px' }}></div>
                )}

                {!isEmptyPastDay && (
                  <div className="meals-grid">
                    {day.meals.map((meal, idx) => (
                      <div key={idx} className={`meal-grid-card ${meal.isAssigned ? 'assigned' : ''}`}>
                        <div className="meal-slot-header">
                          <h4 className="meal-slot-name">{meal.slot}</h4>
                          <span className="meal-slot-time">{meal.time}</span>
                        </div>
                        
                        {meal.isAssigned ? (
                          <div className="meal-assigned-info">
                            <div>
                              <p className="meal-assigned-title">{meal.name}</p>
                              <span className="meal-assigned-cal">🔥 {Math.round(meal.kcal)} kcal</span>
                            </div>
                            {!day.isPast && (
                              <button 
                                onClick={(e) => handleRemoveMealClick(e, meal.slot, day.dateISO, meal.snackIndex)} 
                                title="Remove Meal" 
                                className="remove-btn"
                                style={{ width: '32px', height: '32px' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="meal-unassigned-info">
                            <p className="meal-rec-cal">~{Math.round(meal.recommended)} kcal recommended</p>
                            {!day.isPast && (
                              <button 
                                className="btn-primary" 
                                onClick={() => handleAddFood(meal, day.dateISO)}
                                style={{ width: '100%', padding: '10px' }}
                              >
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span> 
                                Add Food
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showScheduleModal && (
        <ScheduleModal 
          onClose={() => setShowScheduleModal(false)}
          onSave={handleSaveScheduleOverride}
          initialData={user?.schedule || { wakeTime: '07:00', sleepTime: '23:00', busyPeriods: [] }}
          title={`Custom Schedule for ${selectedDateForSchedule?.toLocaleDateString('en-US', { weekday: 'long' })}`}
        />
      )}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, slot: null, dateISO: null, idx: null })}
        onConfirm={handleConfirmRemoveMeal}
        title="Remove Meal"
        message="Are you sure you want to remove this meal from your plan?"
      />
    </div>
  );
};

export default WeeklyPlanPage;
