import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock Data
  const mockMacros = { calories: 1850, caloriesTarget: 2400, protein: 120, proteinTarget: 150, carbs: 190, carbsTarget: 250, fat: 45, fatTarget: 65 };
  const mockMeals = [
    { slot: 'Breakfast', logged: true, name: 'Avocado Toast & Eggs', kcal: 420, protein: 22 },
    { slot: 'Lunch', logged: false, recommended: 600 },
    { slot: 'Dinner', logged: false, recommended: 700 },
    { slot: 'Snack', logged: false, recommended: 200 },
  ];

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="dashboard-container">
      {/* Greeting Section */}
      <section className="dashboard-greeting">
        <h2 className="dashboard-title">Hello, {user?.name || 'Alex'}!</h2>
        <p className="dashboard-subtitle">Today is {today}. Here is your daily overview.</p>
      </section>

      {/* Macro Summary Cards */}
      <section className="macro-cards-row">
        {/* Calories */}
        <div className="macro-card">
          <div className="macro-card-header">
            <h3>Calories</h3>
            <span className="macro-icon icon-calories">🔥</span>
          </div>
          <div className="macro-values">
            <span className="macro-current">{mockMacros.calories}</span>
            <span className="macro-target">/ {mockMacros.caloriesTarget} kcal</span>
          </div>
          <div className="macro-progress-bar bg-olive-light">
            <div className="macro-progress-fill bg-olive" style={{ width: `${(mockMacros.calories / mockMacros.caloriesTarget) * 100}%` }}></div>
          </div>
        </div>

        {/* Protein */}
        <div className="macro-card">
          <div className="macro-card-header">
            <h3>Protein</h3>
            <span className="macro-icon icon-protein">💪</span>
          </div>
          <div className="macro-values">
            <span className="macro-current">{mockMacros.protein}</span>
            <span className="macro-target">/ {mockMacros.proteinTarget} g</span>
          </div>
          <div className="macro-progress-bar bg-purple-light">
            <div className="macro-progress-fill bg-purple" style={{ width: `${(mockMacros.protein / mockMacros.proteinTarget) * 100}%` }}></div>
          </div>
        </div>

        {/* Carbs */}
        <div className="macro-card">
          <div className="macro-card-header">
            <h3>Carbs</h3>
            <span className="macro-icon icon-carbs">🌾</span>
          </div>
          <div className="macro-values">
            <span className="macro-current">{mockMacros.carbs}</span>
            <span className="macro-target">/ {mockMacros.carbsTarget} g</span>
          </div>
          <div className="macro-progress-bar bg-teal-light">
            <div className="macro-progress-fill bg-teal" style={{ width: `${(mockMacros.carbs / mockMacros.carbsTarget) * 100}%` }}></div>
          </div>
        </div>

        {/* Fat */}
        <div className="macro-card">
          <div className="macro-card-header">
            <h3>Fat</h3>
            <span className="macro-icon icon-fat">🥑</span>
          </div>
          <div className="macro-values">
            <span className="macro-current">{mockMacros.fat}</span>
            <span className="macro-target">/ {mockMacros.fatTarget} g</span>
          </div>
          <div className="macro-progress-bar bg-gold-light">
            <div className="macro-progress-fill bg-gold" style={{ width: `${(mockMacros.fat / mockMacros.fatTarget) * 100}%` }}></div>
          </div>
        </div>
      </section>

      {/* Main Two Columns */}
      <section className="dashboard-main-cols">
        {/* Left: Today's Meals */}
        <div className="todays-meals-card card">
          <div className="card-header-row">
            <h3>Today's Meals</h3>
            <button className="btn-link" onClick={() => navigate('/weekly-plan')}>See Weekly Plan</button>
          </div>
          <div className="meals-list">
            {mockMeals.map((meal, idx) => (
              meal.logged ? (
                <div key={idx} className="meal-row logged">
                  <div className="meal-icon-box logged-bg">
                    <span>✔️</span>
                  </div>
                  <div className="meal-info">
                    <h4>{meal.name}</h4>
                    <p>{meal.slot} • Logged</p>
                  </div>
                  <div className="meal-stats">
                    <span className="meal-kcal">{meal.kcal} kcal</span>
                    <span className="meal-protein">{meal.protein}g Protein</span>
                  </div>
                </div>
              ) : (
                <div key={idx} className="meal-row unlogged" onClick={() => navigate('/todays-meals')}>
                  <div className="meal-icon-box unlogged-bg">
                    <span>➕</span>
                  </div>
                  <div className="meal-info">
                    <h4>{meal.slot}</h4>
                    <p>Recommended: ~{meal.recommended} kcal</p>
                  </div>
                  <button className="btn-outline-small">+ Add</button>
                </div>
              )
            ))}
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="quick-actions-card card">
          <div className="quick-actions-header">
            <div className="quick-icon-wrap">⚡</div>
            <h3>Quick Actions</h3>
            <p>Log your food instantly or plan something new.</p>
          </div>
          <div className="quick-actions-buttons">
            <button className="btn-primary full-width flex-center" onClick={() => navigate('/todays-meals')}>
              <span>📸</span> Log Food I Have
            </button>
            <button className="btn-outline full-width flex-center" onClick={() => navigate('/add-custom-meal')}>
              <span>✏️</span> Add Custom Meal
            </button>
            <button className="btn-outline full-width flex-center" onClick={() => navigate('/progress')}>
              <span>📈</span> View Progress
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
