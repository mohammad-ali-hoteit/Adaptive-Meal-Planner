import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { generateMealSchedule, parseTimeStringToMinutes, parseBusyPeriods } from '../utils/timeScheduleAlgorithm';
import './WeeklyPlanPage.css';

const WeeklyPlanPage = () => {
  const { user } = useAuth();
  const [weeklyPlan, setWeeklyPlan] = useState([]);
  const [expandedDay, setExpandedDay] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyData = async () => {
      try {
        const res = await API.get('/dashboard/weekly-logs');
        let logs = [];
        if (res.data.success) {
          logs = res.data.logs;
        }

        // Generate base schedule
        const wakeMin = parseTimeStringToMinutes(user?.schedule?.wakeTime || '07:00');
        const sleepMin = parseTimeStringToMinutes(user?.schedule?.sleepTime || '23:00');
        const busyIntervals = parseBusyPeriods(user?.schedule?.busyPeriods || []);
        const totalCal = 2000; // Mock base or get from metrics
        
        const scheduleData = generateMealSchedule(wakeMin, sleepMin, busyIntervals, totalCal);

        // Map 7 days starting from today
        const generatedWeek = [];
        const today = new Date();
        today.setHours(0,0,0,0);

        for (let i = 0; i < 7; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() + i);
          
          const log = logs.find(l => new Date(l.date).getTime() === d.getTime());
          
          // Map meals based on schedule and log
          const mappedMeals = scheduleData.meals.map(meal => {
            const assigned = log?.mealsAssigned?.find(m => m.mealType.toLowerCase() === meal.name.toLowerCase());
            let kcal = meal.calories;
            let name = 'Recommended';
            
            if (assigned?.customMealId) {
              name = assigned.customMealId.name;
              kcal = assigned.customMealId.kcal;
            } else if (assigned?.foodId) {
              name = assigned.foodId.name?.en || 'Food';
              kcal = assigned.foodId.nutrition?.calories || 0;
            }
            
            return {
              slot: meal.name,
              name,
              kcal,
              time: meal.timeStr
            };
          });

          const totalDayKcal = mappedMeals.reduce((sum, m) => sum + m.kcal, 0);

          generatedWeek.push({
            id: `day-${i}`,
            day: d.toLocaleDateString('en-US', { weekday: 'long' }),
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            isToday: i === 0,
            logged: !!log,
            upcoming: i > 0 && !log,
            kcal: totalDayKcal,
            meals: mappedMeals
          });
        }

        setWeeklyPlan(generatedWeek);
        setExpandedDay(generatedWeek[0].id);
      } catch (err) {
        console.error("Failed to fetch weekly plan", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchWeeklyData();
  }, [user]);

  if (loading) return <div style={{padding: '40px', textAlign: 'center'}}>Loading...</div>;

  return (
    <div className="weekly-plan-container fade-in">
      <div className="weekly-plan-header">
        <div className="header-text">
          <h2>Weekly Plan</h2>
          <p>Your interactive nutrition schedule.</p>
        </div>
        <div className="week-nav">
          <button className="icon-btn"><span className="material-symbols-outlined">chevron_left</span></button>
          <span className="week-date-range">Oct 23 – Oct 29</span>
          <button className="icon-btn"><span className="material-symbols-outlined">chevron_right</span></button>
        </div>
      </div>

      <div className="accordion-container">
        {weeklyPlan.map((dayData) => {
          const isExpanded = expandedDay === dayData.id;
          
          return (
            <div 
              key={dayData.id} 
              className={`accordion-panel glass-panel ${isExpanded ? 'expanded' : 'collapsed'} ${dayData.isToday ? 'is-today' : ''}`}
              onMouseEnter={() => setExpandedDay(dayData.id)}
              onClick={() => setExpandedDay(dayData.id)}
            >
              
              {/* --- COLLAPSED CONTENT --- */}
              <div className="panel-collapsed-content">
                {dayData.isToday && <div className="today-dot"></div>}
                <span className="collapsed-day-name">{dayData.day.substring(0,3).toUpperCase()}</span>
                <span className="collapsed-date">{dayData.date.split(' ')[1]}</span>
              </div>

              {/* --- EXPANDED CONTENT --- */}
              <div className="panel-expanded-content">
                <div className="expanded-header">
                  <div className="eh-title-wrap">
                    {dayData.isToday && <span className="today-badge">TODAY</span>}
                    <h3>{dayData.day}, {dayData.date}</h3>
                  </div>
                  {dayData.logged && (
                    <div className="eh-macros">
                      <span className="eh-kcal">{dayData.kcal} kcal</span>
                    </div>
                  )}
                </div>

                <div className="expanded-body custom-scrollbar">
                  {dayData.meals && dayData.meals.length > 0 ? (
                    <div className="meals-timeline">
                      {dayData.meals.map((meal, mIdx) => (
                        <div key={mIdx} className="timeline-meal-card">
                          <div className="tmc-icon">
                            <span className="material-symbols-outlined">
                              {meal.slot === 'Breakfast' ? 'bakery_dining' : meal.slot === 'Lunch' ? 'lunch_dining' : meal.slot === 'Dinner' ? 'restaurant' : 'cookie'}
                            </span>
                          </div>
                          <div className="tmc-info">
                            <span className="tmc-slot">{meal.slot}</span>
                            <span className="tmc-name">{meal.name}</span>
                          </div>
                          <div className="tmc-cal">{meal.kcal} kcal</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="expanded-empty-state">
                      <span className="material-symbols-outlined empty-icon">event_busy</span>
                      <p>{dayData.upcoming ? 'No meals scheduled yet.' : 'Nothing logged for this day.'}</p>
                    </div>
                  )}
                </div>

                <div className="expanded-footer">
                  <button className="btn-secondary">
                    <span className="material-symbols-outlined">edit_calendar</span>
                    Configure Schedule
                  </button>
                  <button className="btn-primary">
                    <span className="material-symbols-outlined">add</span>
                    Add Meal
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyPlanPage;
