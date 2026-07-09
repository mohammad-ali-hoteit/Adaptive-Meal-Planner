import React, { useState, useMemo } from 'react';
import './AddCustomMealPage.css';

const DB_INGREDIENTS = [
  { id: 1, name: 'Whole Wheat Bread', unit: 'slice', kcal: 80, protein: 3, carbs: 15, fat: 1 },
  { id: 2, name: 'Hass Avocado', unit: '100g', kcal: 160, protein: 2, carbs: 9, fat: 15 },
  { id: 3, name: 'Egg', unit: 'large', kcal: 72, protein: 6, carbs: 0, fat: 5 },
  { id: 4, name: 'Chicken Breast', unit: '100g', kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: 5, name: 'Salmon', unit: '100g', kcal: 208, protein: 20, carbs: 0, fat: 13 },
  { id: 6, name: 'Brown Rice', unit: '100g', kcal: 216, protein: 5, carbs: 45, fat: 2 },
  { id: 7, name: 'Quinoa', unit: '100g', kcal: 120, protein: 4, carbs: 21, fat: 2 },
  { id: 8, name: 'Spinach', unit: '100g', kcal: 23, protein: 3, carbs: 4, fat: 0 },
  { id: 9, name: 'Oats', unit: '100g', kcal: 389, protein: 17, carbs: 66, fat: 7 }
];

const TARGET_KCAL_REMAINING = 224; // Mock value for demonstration

const AddCustomMealPage = () => {
  const [mealName, setMealName] = useState('Post-Workout Avocado Toast');
  const [slot, setSlot] = useState('Lunch');
  const [search, setSearch] = useState('');
  const [addedIngredients, setAddedIngredients] = useState([
    { ...DB_INGREDIENTS[0], amount: 2 }, // 2 slices bread
    { ...DB_INGREDIENTS[1], amount: 1 }, // 100g avocado
    { ...DB_INGREDIENTS[2], amount: 2 }  // 2 eggs
  ]);

  const searchResults = search.trim() 
    ? DB_INGREDIENTS.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const handleAddIngredient = (ingredient) => {
    if (!addedIngredients.find(i => i.id === ingredient.id)) {
      setAddedIngredients([...addedIngredients, { ...ingredient, amount: 1 }]);
    }
    setSearch('');
  };

  const handleRemoveIngredient = (id) => {
    setAddedIngredients(addedIngredients.filter(i => i.id !== id));
  };

  const handleUpdateAmount = (id, amount) => {
    if (amount < 0) return;
    setAddedIngredients(addedIngredients.map(i => 
      i.id === id ? { ...i, amount: Number(amount) } : i
    ));
  };

  const nutritionTotal = useMemo(() => {
    return addedIngredients.reduce((acc, curr) => ({
      kcal: acc.kcal + (curr.kcal * curr.amount),
      protein: acc.protein + (curr.protein * curr.amount),
      carbs: acc.carbs + (curr.carbs * curr.amount),
      fat: acc.fat + (curr.fat * curr.amount)
    }), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
  }, [addedIngredients]);

  const isExceeded = nutritionTotal.kcal > TARGET_KCAL_REMAINING;
  const exceedAmount = Math.round(nutritionTotal.kcal - TARGET_KCAL_REMAINING);

  return (
    <div className="add-meal-container">
      {isExceeded && (
        <div className="warning-banner">
          <span className="warning-icon">⚠️</span>
          <div className="warning-text">
            <strong>Warning: Target Exceeded</strong> — This meal exceeds your remaining daily calorie target by {exceedAmount} kcal. Consider reducing portion sizes.
          </div>
        </div>
      )}

      <div className="add-meal-header">
        <h2>Add Custom Meal</h2>
      </div>

      <div className="add-meal-layout">
        {/* Left Panel: Form */}
        <div className="add-meal-form card">
          <div className="form-group">
            <label>Meal Name</label>
            <input 
              type="text" 
              value={mealName} 
              onChange={(e) => setMealName(e.target.value)}
              placeholder="e.g. Healthy Salad"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Meal Slot</label>
            <div className="slot-tabs">
              {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(s => (
                <button 
                  key={s}
                  className={`slot-tab ${slot === s ? 'active' : ''}`}
                  onClick={() => setSlot(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="ingredients-section">
            <label>Ingredients</label>
            <div className="ingredient-search">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                placeholder="Search ingredients database..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input"
              />
              {searchResults.length > 0 && (
                <div className="search-dropdown custom-scrollbar">
                  {searchResults.map(res => (
                    <div 
                      key={res.id} 
                      className="search-item"
                      onClick={() => handleAddIngredient(res)}
                    >
                      <span className="search-item-name">{res.name}</span>
                      <span className="search-item-kcal">{res.kcal} kcal / {res.unit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="added-ingredients-list custom-scrollbar">
              {addedIngredients.length === 0 ? (
                <p className="empty-ingredients">No ingredients added yet.</p>
              ) : (
                addedIngredients.map(item => (
                  <div key={item.id} className="added-ingredient-row">
                    <div className="added-info">
                      <span className="added-name">{item.name}</span>
                      <span className="added-kcal">{Math.round(item.kcal * item.amount)} kcal</span>
                    </div>
                    <div className="added-controls">
                      <input 
                        type="number" 
                        min="0"
                        step="0.5"
                        value={item.amount}
                        onChange={(e) => handleUpdateAmount(item.id, e.target.value)}
                        className="amount-input"
                      />
                      <span className="unit-label">{item.unit}s</span>
                      <button 
                        className="remove-btn"
                        onClick={() => handleRemoveIngredient(item.id)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Nutrition */}
        <div className="add-meal-nutrition card">
          <h3 className="nutrition-title">Nutrition Total</h3>
          
          <div className="total-kcal-display">
            <span className="total-kcal-val">{Math.round(nutritionTotal.kcal)}</span>
            <span className={`total-kcal-target ${isExceeded ? 'exceeded' : ''}`}>
              / {TARGET_KCAL_REMAINING} left
            </span>
          </div>

          <div className="macro-bars">
            <div className="macro-bar-row">
              <div className="macro-bar-label">
                <span>Protein</span>
                <span>{Math.round(nutritionTotal.protein)}g</span>
              </div>
              <div className="macro-bar-bg">
                <div className="macro-bar-fill protein" style={{ width: `${Math.min(100, (nutritionTotal.protein / 50) * 100)}%` }}></div>
              </div>
            </div>

            <div className="macro-bar-row">
              <div className="macro-bar-label">
                <span>Carbs</span>
                <span>{Math.round(nutritionTotal.carbs)}g</span>
              </div>
              <div className="macro-bar-bg">
                <div className="macro-bar-fill carbs" style={{ width: `${Math.min(100, (nutritionTotal.carbs / 80) * 100)}%` }}></div>
              </div>
            </div>

            <div className="macro-bar-row">
              <div className="macro-bar-label">
                <span>Fat</span>
                <span>{Math.round(nutritionTotal.fat)}g</span>
              </div>
              <div className="macro-bar-bg">
                <div className="macro-bar-fill fat" style={{ width: `${Math.min(100, (nutritionTotal.fat / 30) * 100)}%` }}></div>
              </div>
            </div>
          </div>

          <button className="btn-primary full-width mt-auto">Confirm & Add Meal</button>
        </div>
      </div>
    </div>
  );
};

export default AddCustomMealPage;
