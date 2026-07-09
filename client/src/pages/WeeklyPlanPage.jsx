import React from 'react';
import './WeeklyPlanPage.css';

const MOCK_WEEK = [
  { 
    day: 'Monday', date: 'Oct 23', logged: true, kcal: 2150, 
    meals: [
      { slot: 'Breakfast', name: 'Oatmeal & Berries', kcal: 350 },
      { slot: 'Lunch', name: 'Grilled Chicken Salad', kcal: 650 },
      { slot: 'Dinner', name: 'Salmon & Quinoa', kcal: 850 },
      { slot: 'Snack', name: 'Protein Bar', kcal: 300 }
    ] 
  },
  { day: 'Tuesday', date: 'Oct 24', logged: true, kcal: 2300, meals: [] },
  { day: 'Wednesday', date: 'Oct 25', logged: false, upcoming: false, meals: [] },
  { day: 'Thursday', date: 'Oct 26', logged: false, upcoming: false, meals: [] },
  { day: 'Friday', date: 'Oct 27', logged: false, upcoming: false, meals: [] },
  { day: 'Saturday', date: 'Oct 28', logged: false, upcoming: true, meals: [] },
  { day: 'Sunday', date: 'Oct 29', logged: false, upcoming: true, meals: [] }
];

const WeeklyPlanPage = () => {
  return (
    <div className="weekly-plan-container">
      <div className="weekly-plan-header">
        <h2>Weekly Plan</h2>
        <div className="week-nav">
          <button className="icon-btn">⬅️</button>
          <span className="week-date-range">Oct 23 – Oct 29</span>
          <button className="icon-btn">➡️</button>
        </div>
      </div>

      <div className="weekly-grid">
        {MOCK_WEEK.map((dayData, idx) => {
          const isFeatured = idx === 0; // Highlight Monday for demo

          return (
            <div key={idx} className={`day-card card ${isFeatured ? 'featured' : ''}`}>
              <div className="day-header">
                <div>
                  <h3 className="day-name">{dayData.day}</h3>
                  <span className="day-date">{dayData.date}</span>
                </div>
                {dayData.logged && (
                  <span className="day-kcal-badge">{dayData.kcal} / 2400 kcal</span>
                )}
              </div>

              <div className="day-meals-list custom-scrollbar">
                {dayData.logged ? (
                  dayData.meals.length > 0 ? (
                    dayData.meals.map((meal, mIdx) => (
                      <div key={mIdx} className="mini-meal-row">
                        <span className="mini-meal-slot">{meal.slot.charAt(0)}</span>
                        <div className="mini-meal-info">
                          <p className="mini-meal-name">{meal.name}</p>
                          <span className="mini-meal-kcal">{meal.kcal} kcal</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-day-state">
                      <p>Meals logged, but details hidden.</p>
                    </div>
                  )
                ) : (
                  <div className="empty-day-state">
                    {dayData.upcoming ? 'Upcoming' : 'Not logged yet'}
                  </div>
                )}
              </div>

              {dayData.logged && (
                <button className="btn-outline full-width mt-auto">Edit Day</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyPlanPage;
