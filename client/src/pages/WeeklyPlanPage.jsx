import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { generateMealSchedule, parseTimeStringToMinutes, parseBusyPeriods } from '../utils/timeScheduleAlgorithm';
import ScheduleModal from '../components/ScheduleModal';
import './WeeklyPlanPage.css';

const WeeklyPlanPage = () => {
  const { user, updateUser } = useAuth();
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
      const res = await API.get('/dashboard/weekly-logs');
      let logs = [];
      if (res.data.success) {
        logs = res.data.logs;
      }

      // Map 7 days starting from Monday (startOfWeek)
      const generatedWeek = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(d.getDate() + i);
        
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const dayString = String(d.getDate()).padStart(2, '0');
        const localDateISO = `${year}-${month}-${dayString}`;
        
        const log = logs.find(l => l.date.split('T')[0] === localDateISO);
        
        // Determine which schedule config to use (override vs global)
        const activeScheduleConfig = log?.scheduleOverride || user?.schedule || {
          wakeTime: '07:00',
          sleepTime: '23:00',
          busyPeriods: []
        };
        
        const wakeMin = parseTimeStringToMinutes(activeScheduleConfig.wakeTime || '07:00');
        const sleepMin = parseTimeStringToMinutes(activeScheduleConfig.sleepTime || '23:00');
        const busyIntervals = parseBusyPeriods(activeScheduleConfig.busyPeriods || []);
        const totalCal = 2000;
        
        const scheduleData = generateMealSchedule(wakeMin, sleepMin, busyIntervals, totalCal);
        
        const snacksAssigned = log?.mealsAssigned?.filter(m => m.mealType.toLowerCase() === 'snack') || [];
        const snacksCompleted = log?.mealsCompleted?.filter(m => m.mealType.toLowerCase() === 'snack') || [];
        let snackIdxAssigned = 0;
        let snackIdxCompleted = 0;

        const mappedMeals = scheduleData.meals.map(meal => {
          let assigned, isCompleted = false;
          if (meal.name.toLowerCase() === 'snack') {
            assigned = snacksAssigned[snackIdxAssigned];
            isCompleted = !!snacksCompleted[snackIdxAssigned];
            snackIdxAssigned++;
            snackIdxCompleted++;
          } else {
            assigned = log?.mealsAssigned?.find(m => m.mealType.toLowerCase() === meal.name.toLowerCase());
            isCompleted = !!log?.mealsCompleted?.find(m => m.mealType.toLowerCase() === meal.name.toLowerCase());
          }
          let kcal = meal.calories;
          let name = '';
          let isAssigned = false;
          
          if (assigned?.customMealId) {
            name = assigned.customMealId.name;
            kcal = assigned.customMealId.kcal;
            isAssigned = true;
          } else if (assigned?.foodId) {
            name = assigned.foodId.name?.en || 'Food';
            kcal = assigned.foodId.nutrition?.calories || 0;
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
            snackIndex: meal.name.toLowerCase() === 'snack' ? (snackIdxAssigned - 1) : 0
          };
        });

        const totalDayKcal = mappedMeals.reduce((sum, m) => sum + m.kcal, 0);
        const loggedDayKcal = mappedMeals.filter(m => m.isLogged).reduce((sum, m) => sum + m.kcal, 0);


        generatedWeek.push({
          id: `day-${i}`,
          dateObject: d,
          dateISO: localDateISO,
          day: d.toLocaleDateString('en-US', { weekday: 'long' }),
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          isToday: d.getTime() === currentToday.getTime(),
          isPast: d.getTime() < currentToday.getTime(),
          hasOverride: !!log?.scheduleOverride,
          kcal: totalDayKcal,
          loggedKcal: loggedDayKcal,
          targetKcal: totalCal,
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
      // Small timeout ensures the DOM has fully rendered the cards
      setTimeout(() => {
        todayCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [loading, weeklyPlan]);

  const handleAddFood = (slot, dateISO, idx) => {
    navigate(`/pantry?slot=${slot}&date=${dateISO}&snackIndex=${idx}`);
  };
  
  const handleConfigureDay = (day) => {
    setSelectedDateForSchedule(day.dateObject);
    setDateStringForSchedule(day.dateISO);
    setShowScheduleModal(true);
  };
  
  const handleSaveScheduleOverride = async (config) => {
    try {
      const res = await API.post('/dashboard/override-schedule', {
        date: dateStringForSchedule,
        scheduleOverride: config
      });
      if (res.data.success) {
        setShowScheduleModal(false);
        fetchWeeklyData(); // Refresh to see new slots
      }
    } catch (err) {
      console.error("Failed to override schedule", err);
      alert("Failed to override schedule");
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
      const res = await API.delete('/dashboard/remove-meal', { 
        data: { mealType: slot.toLowerCase(), date: dateISO, snackIndex: idx } 
      });
      if (res.data.success) {
        fetchWeeklyData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmModal({ isOpen: false, slot: null, dateISO: null, idx: null });
    }
  };

  if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>Loading...</div>;

  return (
    <div className="weekly-plan-container fade-in custom-scrollbar" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="weekly-plan-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="header-text">
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Plan your meals and schedules for the upcoming week.</p>
        </div>
        <div className="week-nav" style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'white', padding: '8px 16px', borderRadius: '99px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--color-accent)' }}>calendar_month</span>
          <span className="week-date-range" style={{ fontWeight: 'bold' }}>{dateRangeStr}</span>
        </div>
      </div>

      <div className="days-list">
        {weeklyPlan.map(day => (
          <div key={day.id} ref={day.isToday ? todayCardRef : null} className={`day-card glass-panel expanded ${day.isToday ? 'is-today' : ''}`} style={{ marginBottom: '16px', borderRadius: '16px', overflow: 'hidden' }}>
            
            {/* Day Header (Static) */}
            <div className="day-header" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: day.isToday ? 'var(--color-bg)' : 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: day.isToday ? 'var(--color-accent)' : '#f5f0e8', color: day.isToday ? 'white' : 'var(--color-ink)', width: '64px', height: '64px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxShadow: day.isToday ? '0 4px 12px rgba(201,168,76,0.3)' : 'none' }}>
                  <span style={{ fontSize: '20px', fontWeight: 'bold' }}>{day.date.split(' ')[1]}</span>
                  <span style={{ fontSize: '12px', textTransform: 'uppercase', opacity: 0.8 }}>{day.date.split(' ')[0]}</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {day.day} 
                    {day.isToday && <span style={{ fontSize: '10px', background: 'var(--color-accent)', color: 'white', padding: '2px 8px', borderRadius: '99px' }}>Today</span>}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{day.kcal} kcal planned</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                  <strong style={{ color: 'var(--color-text)', fontSize: '18px' }}>{day.loggedKcal}</strong> / {day.targetKcal} kcal
                </p>
                <div style={{ background: '#eee', height: '6px', width: '100px', borderRadius: '3px', marginTop: '6px', overflow: 'hidden', marginLeft: 'auto' }}>
                  <div style={{ height: '100%', background: 'var(--color-accent)', width: `${Math.min(100, (day.loggedKcal / day.targetKcal) * 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* Day Details (Always Expanded) */}
            <div className="day-content" style={{ padding: '0 20px 20px 20px', borderTop: '1px solid var(--color-border)' }}>
                
                {!day.isPast && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', marginBottom: '16px' }}>
                    <button 
                      onClick={() => handleConfigureDay(day)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                      Configure Custom Schedule
                    </button>
                  </div>
                )}

                <div className="meals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                  {day.meals.map((meal, idx) => (
                    <div key={idx} style={{ border: '1px solid #eee', borderRadius: '12px', padding: '16px', position: 'relative', background: meal.isAssigned ? '#fcfaf7' : 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{meal.slot}</h4>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{meal.time}</span>
                      </div>
                      
                      {meal.isAssigned ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <p style={{ margin: '8px 0', fontWeight: 'bold', fontSize: '16px' }}>{meal.name}</p>
                              <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                <span style={{ background: '#f5f0e8', padding: '2px 8px', borderRadius: '4px' }}>🔥 {meal.kcal} kcal</span>
                              </div>
                            </div>
                            {!day.isPast && (
                              <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                                <button onClick={(e) => handleRemoveMealClick(e, meal.slot, day.dateISO, meal.snackIndex)} title="Remove Meal" style={{ background: 'transparent', border: 'none', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-red)' }}>
                                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 12px 0' }}>~{meal.recommended} kcal recommended</p>
                          {!day.isPast && (
                            <button 
                              className="btn btn-outline" 
                              onClick={() => handleAddFood(meal.slot, day.dateISO, meal.snackIndex)}
                              style={{ width: '100%', padding: '8px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '12px' }}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span> Add Food
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
          </div>
        ))}
      </div>

      {showScheduleModal && (
        <ScheduleModal 
          onClose={() => setShowScheduleModal(false)}
          onSave={handleSaveScheduleOverride}
          initialData={user?.schedule}
          title={`Custom Schedule for ${selectedDateForSchedule?.toLocaleDateString('en-US', { weekday: 'long' })}`}
        />
      )}
      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, slot: null, dateISO: null, idx: null })}
        onConfirm={handleConfirmRemoveMeal}
        title="Remove Meal"
        message={`Are you sure you want to remove this meal from your plan?`}
      />
    </div>
  );
};

export default WeeklyPlanPage;
