import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { generateMealSchedule, parseTimeStringToMinutes, parseBusyPeriods } from '../utils/timeScheduleAlgorithm';
import ScheduleModal from '../components/ScheduleModal';
import './WeeklyPlanPage.css';

const WeeklyPlanPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [expandedDay, setExpandedDay] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Custom schedule modal for specific day
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDateForSchedule, setSelectedDateForSchedule] = useState(null);
  const [dateStringForSchedule, setDateStringForSchedule] = useState(null);

  // Generate date range string
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 6);
  const dateRangeStr = `${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${nextWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const fetchWeeklyData = async () => {
    try {
      const res = await API.get('/dashboard/weekly-logs');
      let logs = [];
      if (res.data.success) {
        logs = res.data.logs;
      }

      // Map 7 days starting from today
      const generatedWeek = [];
      const currentToday = new Date();
      currentToday.setHours(0,0,0,0);

      for (let i = 0; i < 7; i++) {
        const d = new Date(currentToday);
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
        
        const mappedMeals = scheduleData.meals.map(meal => {
          const assigned = log?.mealsAssigned?.find(m => m.mealType.toLowerCase() === meal.name.toLowerCase());
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
            recommended: meal.calories
          };
        });

        const totalDayKcal = mappedMeals.reduce((sum, m) => sum + m.kcal, 0);


        generatedWeek.push({
          id: `day-${i}`,
          dateObject: d,
          dateISO: localDateISO,
          day: d.toLocaleDateString('en-US', { weekday: 'long' }),
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          isToday: i === 0,
          hasOverride: !!log?.scheduleOverride,
          kcal: totalDayKcal,
          meals: mappedMeals
        });
      }

      setWeeklyPlan(generatedWeek);
      if (!expandedDay) setExpandedDay(generatedWeek[0].id);
    } catch (err) {
      console.error("Failed to fetch weekly plan", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyData();
  }, [user]);

  const toggleDay = (id) => {
    setExpandedDay(expandedDay === id ? null : id);
  };

  const handleAddFood = (slot, dateISO) => {
    navigate(`/pantry?slot=${slot}&date=${dateISO}`);
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
          <div key={day.id} className={`day-card glass-panel ${expandedDay === day.id ? 'expanded' : ''}`} style={{ marginBottom: '16px', borderRadius: '16px', overflow: 'hidden' }}>
            
            {/* Day Header (Click to expand) */}
            <div 
              className="day-header" 
              onClick={() => toggleDay(day.id)}
              style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: day.isToday ? 'var(--color-bg)' : 'white' }}
            >
              <div className="day-info" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: day.isToday ? 'var(--color-accent)' : '#f5f0e8', color: day.isToday ? 'white' : 'var(--color-text)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold' }}>{day.day.substring(0,3)}</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{day.dateObject.getDate()}</span>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {day.day} 
                    {day.isToday && <span style={{ fontSize: '10px', background: 'var(--color-primary)', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>TODAY</span>}
                    {day.hasOverride && <span style={{ fontSize: '10px', background: 'var(--color-secondary)', color: 'white', padding: '2px 8px', borderRadius: '4px' }}>CUSTOM SCHEDULE</span>}
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>{day.kcal} kcal planned</p>
                </div>
              </div>
              <span className="material-symbols-outlined" style={{ transform: expandedDay === day.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                expand_more
              </span>
            </div>

            {/* Day Details (Expanded) */}
            {expandedDay === day.id && (
              <div className="day-content" style={{ padding: '0 20px 20px 20px', borderTop: '1px solid #eee' }}>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', marginBottom: '16px' }}>
                  <button 
                    onClick={() => handleConfigureDay(day)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                    Configure Custom Schedule
                  </button>
                </div>

                <div className="meals-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                  {day.meals.map((meal, idx) => (
                    <div key={idx} style={{ border: '1px solid #eee', borderRadius: '12px', padding: '16px', position: 'relative', background: meal.isAssigned ? '#fcfaf7' : 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{meal.slot}</h4>
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{meal.time}</span>
                      </div>
                      
                      {meal.isAssigned ? (
                        <>
                          <p style={{ margin: '8px 0', fontWeight: 'bold', fontSize: '16px' }}>{meal.name}</p>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                            <span style={{ background: '#f5f0e8', padding: '2px 8px', borderRadius: '4px' }}>🔥 {meal.kcal} kcal</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <p style={{ margin: '8px 0', fontSize: '14px', color: 'var(--color-text-muted)' }}>Recommended ~{meal.recommended} kcal</p>
                          <button 
                            onClick={() => handleAddFood(meal.slot, day.dateISO)}
                            style={{ width: '100%', padding: '8px', background: 'var(--color-accent)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', marginTop: '12px' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span> Add Food
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
    </div>
  );
};

export default WeeklyPlanPage;
