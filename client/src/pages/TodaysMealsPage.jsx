import React, { useState } from 'react';
import './TodaysMealsPage.css';

const MOCK_CATEGORIES = [
  { name: 'Proteins', items: ['Chicken Breast', 'Salmon Filet', 'Tofu (Firm)', 'Eggs', 'Tuna'] },
  { name: 'Carbohydrates', items: ['Quinoa', 'Sweet Potato', 'Brown Rice', 'Oats', 'Pasta'] },
  { name: 'Vegetables', items: ['Broccoli', 'Asparagus', 'Spinach', 'Tomatoes', 'Cucumber'] }
];

const MOCK_SUGGESTIONS = [
  {
    name: 'Herb-Crusted Salmon',
    desc: 'Served with steamed asparagus and quinoa.',
    protein: 42, carbs: 30, fat: 18, kcal: 450
  },
  {
    name: 'Lemon Garlic Chicken',
    desc: 'Roasted chicken breast with broccoli and quinoa.',
    protein: 38, carbs: 45, fat: 12, kcal: 380
  }
];

const TodaysMealsPage = () => {
  const [selectedIngredients, setSelectedIngredients] = useState(new Set());
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [search, setSearch] = useState('');

  const toggleIngredient = (item) => {
    const newSet = new Set(selectedIngredients);
    if (newSet.has(item)) newSet.delete(item);
    else newSet.add(item);
    setSelectedIngredients(newSet);
  };

  const handleGetSuggestions = () => {
    setShowSuggestions(true);
  };

  return (
    <div className="todays-meals-container">
      <div className="meals-panel left-panel card">
        <div className="panel-header">
          <h2>Ingredient Stash</h2>
          <p>Select what you have to generate today's meals.</p>
        </div>

        <div className="search-wrap">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Search ingredients..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="categories-list custom-scrollbar">
          {MOCK_CATEGORIES.map(category => (
            <div key={category.name} className="category-group">
              <h3>{category.name}</h3>
              <div className="category-items">
                {category.items
                  .filter(item => item.toLowerCase().includes(search.toLowerCase()))
                  .map(item => {
                  const isSelected = selectedIngredients.has(item);
                  return (
                    <label key={item} className={`ingredient-item ${isSelected ? 'selected' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleIngredient(item)}
                      />
                      <span className="checkbox-custom">{isSelected ? '✔️' : ''}</span>
                      <span className="item-name">{item}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button 
          className="btn-primary full-width get-suggestions-btn"
          onClick={handleGetSuggestions}
        >
          ✦ Get Suggestions
        </button>
      </div>

      <div className="meals-panel right-panel">
        {!showSuggestions ? (
          <div className="empty-suggestions">
            <div className="sparkle-icon">✦</div>
            <h3>Select ingredients and get suggestions</h3>
          </div>
        ) : (
          <div className="suggestions-list">
            <h3 className="suggestions-title">Suggested Combinations ({MOCK_SUGGESTIONS.length} Matches)</h3>
            {MOCK_SUGGESTIONS.map((meal, idx) => (
              <div key={idx} className="suggestion-card card">
                <div className="suggestion-header">
                  <h4>{meal.name}</h4>
                  <span className="suggestion-kcal">{meal.kcal} kcal</span>
                </div>
                <p className="suggestion-desc">{meal.desc}</p>
                <div className="suggestion-macros">
                  <span className="macro-badge protein">P: {meal.protein}g</span>
                  <span className="macro-badge carbs">C: {meal.carbs}g</span>
                  <span className="macro-badge fat">F: {meal.fat}g</span>
                </div>
                <button className="btn-outline full-width mt-4">Add to Lunch</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaysMealsPage;
