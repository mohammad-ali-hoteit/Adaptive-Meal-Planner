import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import { generateMealSchedule, parseTimeStringToMinutes, parseBusyPeriods } from '../utils/timeScheduleAlgorithm';
import ScheduleModal from '../components/ScheduleModal';
import './HistoryPage.css';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
}

const HistoryPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // For editing a specific day
  const [selectedDayObj, setSelectedDayObj] = useState(null);
  
  // Custom schedule modal for specific day
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDateForSchedule, setSelectedDateForSchedule] = useState(null);
  const [dateStringForSchedule, setDateStringForSchedule] = useState(null);
  
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, slot: null, dateISO: null, idx: null });

  const fetchHistory = async () => {
    try {
      const res = await API.get('/history');
      if (res.data.success) {
        setHistoryLogs(res.data.history);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  // Update selectedDayObj if history logs change and a day is already selected
  useEffect(() => {
    if (selectedDayObj) {
      buildDayObject(selectedDayObj.dateObject);
    }
  }, [historyLogs, user]);

  const prevMonth = () => {
      // Rule: Cannot view past years
      if (year === currentYear && month === 0) return;
      if (month === 0) { setMonth(11); setYear(y => y - 1); }
      else setMonth(m => m - 1);
  };

  const nextMonth = () => {
      // Rule: Cannot view future months
      if (year === currentYear && month === currentMonth) return;
      if (month === 11) { setMonth(0); setYear(y => y + 1); }
      else setMonth(m => m + 1);
  };

  const isCurrentRealMonth = year === currentYear && month === currentMonth;

  const hasLogsForMonth = historyLogs.some(log => {
      const [y, m] = log.date.split('T')[0].split('-');
      return parseInt(y) === year && parseInt(m) === month + 1;
  });

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const getLogForDate = (y, m, d) => {
    const localStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return historyLogs.find(log => log.date.split('T')[0] === localStr);
  };

  const buildDayObject = (dObj) => {
    const localDateISO = `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`;
    const log = historyLogs.find(l => l.date.split('T')[0] === localDateISO);
    
    const activeScheduleConfig = log?.scheduleOverride || user?.schedule || {
      wakeTime: '07:00', sleepTime: '23:00', busyPeriods: []
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

    const isToday = dObj.getDate() === today.getDate() && dObj.getMonth() === today.getMonth() && dObj.getFullYear() === today.getFullYear();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isPast = dObj < todayDateOnly;

    const built = {
      id: `day-${localDateISO}`,
      dateObject: dObj,
      dateISO: localDateISO,
      day: dObj.toLocaleDateString('en-US', { weekday: 'long' }),
      date: dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday,
      isPast,
      hasOverride: !!log?.scheduleOverride,
      kcal: totalDayKcal,
      loggedKcal: loggedDayKcal,
      targetKcal: totalCal,
      meals: mappedMeals
    };
    setSelectedDayObj(built);
  };

  const handleDayClick = (d) => {
    // Allow viewing past days, but logic inside selectedDayObj will restrict updates
    const clickedDate = new Date(year, month, d);
    buildDayObject(clickedDate);
  };

  const handleAddFood = (slot, dateISO, idx) => {
    navigate(`/pantry?slot=${slot}&date=${dateISO}&returnTo=/history&snackIndex=${idx}`);
  };
  
  const handleConfigureDay = (dayObj) => {
    setSelectedDateForSchedule(dayObj.dateObject);
    setDateStringForSchedule(dayObj.dateISO);
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
        fetchHistory(); 
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
        fetchHistory();
        if (selectedDayObj && selectedDayObj.dateISO === dateISO) {
          buildDayObject(selectedDayObj.dateObject);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConfirmModal({ isOpen: false, slot: null, dateISO: null, idx: null });
    }
  };

  if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>Loading...</div>;

  return (
    <div className="history-container fade-in custom-scrollbar" style={{ height: '100%', overflowY: 'auto' }}>
      <div className="history-header" style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: 'var(--color-text)' }}>History & Calendar</h2>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Review your past daily scores and manage your current month.</p>
      </div>

      <div className="calendar-page">
        <div className="card calendar-card glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <div className="cal-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <button 
                  className="cal-nav-btn btn-icon" 
                  onClick={prevMonth} 
                  disabled={year === currentYear && month === 0}
                  style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: (year === currentYear && month === 0) ? 'not-allowed' : 'pointer', opacity: (year === currentYear && month === 0) ? 0.3 : 1 }}
                >
                  <MdChevronLeft size={24} />
                </button>
                <h2 className="cal-month-title" style={{ fontSize: '18px', fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
                  {MONTHS[month]} {year}
                </h2>
                <button 
                  className="cal-nav-btn btn-icon" 
                  onClick={nextMonth} 
                  disabled={isCurrentRealMonth}
                  style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', cursor: isCurrentRealMonth ? 'not-allowed' : 'pointer', opacity: isCurrentRealMonth ? 0.3 : 1 }}
                >
                  <MdChevronRight size={24} />
                </button>
            </div>

            {(!isCurrentRealMonth && !hasLogsForMonth) ? (
              <div className="empty-month-state" style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-border)', marginBottom: '16px', display: 'block' }}>event_busy</span>
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--color-text)', fontSize: '18px' }}>No Logs Found</h3>
                <p style={{ margin: 0 }}>You haven't tracked any meals or schedule data for {MONTHS[month]} {year}.</p>
              </div>
            ) : (
              <>
                <div className="cal-days-header" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
                    {DAYS.map(d => <div key={d} className="cal-day-name" style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>{d}</div>)}
                </div>

                <div className="cal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {cells.map((day, idx) => {
                    const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                    const log = day ? getLogForDate(year, month, day) : null;
                    const mealsAssigned = log?.mealsAssigned || [];
                    const mealsLogged = mealsAssigned.filter(m => m.customMealId || m.foodId).length;
                    
                    return (
                        <div 
                          key={idx} 
                          onClick={() => day && handleDayClick(day)}
                          className={`cal-cell ${day ? '' : 'cal-cell--empty'} ${isToday ? 'cal-cell--today' : ''} ${selectedDayObj?.dateObject.getDate() === day && month === selectedDayObj?.dateObject.getMonth() ? 'cal-cell--selected' : ''}`}
                          style={{ 
                            minHeight: '80px', 
                            border: isToday ? '2px solid var(--color-accent)' : '1px solid var(--color-border)', 
                            borderRadius: '8px', 
                            padding: '8px', 
                            background: isToday ? 'rgba(201,168,76,0.1)' : day ? 'white' : 'transparent',
                            cursor: day ? 'pointer' : 'default',
                            borderColor: selectedDayObj?.dateObject.getDate() === day && month === selectedDayObj?.dateObject.getMonth() ? 'var(--color-accent)' : isToday ? 'var(--color-accent)' : 'var(--color-border)',
                            transition: 'all 0.2s',
                            boxShadow: isToday ? '0 0 8px rgba(201,168,76,0.3)' : 'none'
                          }}
                        >
                            {day && (
                                <>
                                    <span className="cal-day-num" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: isToday ? 'var(--color-accent)' : 'transparent', color: isToday ? 'white' : 'var(--color-text)', fontWeight: 'bold', fontSize: '13px', marginBottom: '8px' }}>
                                      {day}
                                    </span>
                                    {isToday && <span style={{ fontSize: '10px', color: 'var(--color-accent)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px', display: 'block' }}>Today</span>}
                                    <div className="cal-events" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {mealsLogged > 0 && (
                                            <div className="cal-event" style={{ fontSize: '10px', background: 'var(--color-teal)', color: 'white', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {mealsLogged} Meals Logged
                                            </div>
                                        )}
                                        {log?.waterGlasses > 0 && (
                                            <div className="cal-event" style={{ fontSize: '10px', background: 'rgba(52, 152, 219, 0.1)', color: '#3498db', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                💧 {log.waterGlasses}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
            </>
          )}
        </div>
        
        {/* Right Panel: Selected Day details OR Read-only summary */}
        <div className="selected-day-panel">
            {selectedDayObj ? (
              <div className="day-card glass-panel expanded" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                  <div className="day-header" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: selectedDayObj.isToday ? 'var(--color-bg)' : 'white' }}>
                    <div className="day-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: selectedDayObj.isToday ? 'var(--color-accent)' : '#f5f0e8', color: selectedDayObj.isToday ? 'white' : 'var(--color-text)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>{selectedDayObj.day.substring(0,3)}</span>
                        <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedDayObj.dateObject.getDate()}</span>
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {selectedDayObj.day} 
                          {selectedDayObj.isToday && <span style={{ fontSize: '10px', background: 'var(--color-accent)', color: 'white', padding: '2px 8px', borderRadius: '99px' }}>Today</span>}
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{selectedDayObj.kcal} kcal planned</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                        <strong style={{ color: 'var(--color-text)', fontSize: '18px' }}>{selectedDayObj.loggedKcal}</strong> / {selectedDayObj.targetKcal} kcal
                      </p>
                      <div style={{ background: '#eee', height: '6px', width: '100px', borderRadius: '3px', marginTop: '6px', overflow: 'hidden', marginLeft: 'auto' }}>
                        <div style={{ height: '100%', background: 'var(--color-accent)', width: `${Math.min(100, (selectedDayObj.loggedKcal / selectedDayObj.targetKcal) * 100)}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="day-content" style={{ padding: '0 20px 20px 20px', borderTop: '1px solid var(--color-border)', background: selectedDayObj.isToday ? 'var(--color-bg)' : 'white' }}>
                      {!selectedDayObj.isPast && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', marginBottom: '16px' }}>
                          <button 
                            onClick={() => handleConfigureDay(selectedDayObj)}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold', color: 'var(--color-text)' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                            Configure Custom Schedule
                          </button>
                        </div>
                      )}

                      <div className="meals-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: selectedDayObj.isPast ? '16px' : '0' }}>
                        {selectedDayObj.meals.map((meal, idx) => (
                          <div key={idx} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', position: 'relative', background: meal.isAssigned ? 'white' : 'transparent' }}>
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
                                  {!selectedDayObj.isPast && (
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                                      <button onClick={(e) => handleRemoveMealClick(e, meal.slot, selectedDayObj.dateISO, meal.snackIndex)} title="Remove Meal" style={{ background: 'transparent', border: 'none', borderRadius: '6px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-red)' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div style={{ padding: '8px 0' }}>
                                <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>Recommended: ~{meal.recommended} kcal</p>
                                {!selectedDayObj.isPast ? (
                                  <button className="btn btn-outline" onClick={() => handleAddFood(meal.slot, selectedDayObj.dateISO, meal.snackIndex)} style={{ width: '100%', fontSize: '14px', padding: '10px' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px', marginRight: '8px' }}>add</span>
                                    Add to {meal.slot}
                                  </button>
                                ) : (
                                  <div style={{ fontSize: '14px', color: 'var(--color-red)', background: 'rgba(217,83,79,0.1)', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
                                    Missed Meal
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                  </div>
              </div>
            ) : (
              <div className="card glass-panel" style={{ padding: '24px', borderRadius: '16px', textAlign: 'center', color: 'var(--color-text-secondary)', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--color-border)', marginBottom: '16px' }}>touch_app</span>
                <p>Select a day in the calendar to view or manage its meals.</p>
              </div>
            )}
        </div>
      </div>

      {showScheduleModal && (
        <ScheduleModal 
          onClose={() => setShowScheduleModal(false)}
          onSave={handleSaveScheduleOverride}
          initialData={selectedDayObj?.hasOverride ? historyLogs.find(l => l.date.split('T')[0] === dateStringForSchedule)?.scheduleOverride : user?.schedule}
          title={`Custom Schedule for ${selectedDateForSchedule?.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
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

export default HistoryPage;
