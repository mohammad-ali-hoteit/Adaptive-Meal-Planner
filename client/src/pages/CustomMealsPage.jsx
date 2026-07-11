import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import './CustomMealsPage.css';

// Mock targets based on algorithm approximation (assuming 2000 kcal total)
const SLOT_TARGETS = {
  'Breakfast': 400,
  'Lunch': 600,
  'Dinner': 700,
  'Snack': 300
};

const INITIAL_CUSTOM_MEALS = [
  { id: 1, name: 'My Power Smoothie', slot: 'Breakfast', kcal: 380, pro: 25, carb: 45, fat: 12, img: '' }
];

const CustomMealsPage = () => {
  const [view, setView] = useState('gallery'); // 'gallery' | 'builder'
  
  // Gallery State
  const [search, setSearch] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('All');
  const [customMeals, setCustomMeals] = useState([]);
  const [allFoods, setAllFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [foodsRes, mealsRes] = await Promise.all([
          API.get('/foods?limit=100'),
          API.get('/custom-meals')
        ]);
        
        if (foodsRes.data.success) {
          setAllFoods(foodsRes.data.foods);
        }
        if (mealsRes.data.success) {
          // Transform backend structure if necessary, or just set it
          const formattedMeals = mealsRes.data.meals.map(m => ({
            id: m._id,
            name: m.name,
            slot: m.slot,
            kcal: m.kcal,
            pro: m.pro,
            carb: m.carb,
            fat: m.fat,
            img: m.image,
            ingredients: m.ingredients.map(ing => ({
              id: ing.foodId?._id,
              foodId: ing.foodId?._id,
              name: ing.foodId?.name?.en,
              grams: ing.grams,
              cal: Math.round(ing.foodId?.nutrition?.calories * (ing.grams / (ing.foodId?.size_g || 100)) || 0),
              pro: Math.round(ing.foodId?.nutrition?.protein_g * (ing.grams / (ing.foodId?.size_g || 100)) || 0),
              carb: Math.round(ing.foodId?.nutrition?.carbs_g * (ing.grams / (ing.foodId?.size_g || 100)) || 0),
              fat: Math.round(ing.foodId?.nutrition?.fat_g * (ing.grams / (ing.foodId?.size_g || 100)) || 0),
            }))
          }));
          setCustomMeals(formattedMeals);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // Builder State
  const [editingMealId, setEditingMealId] = useState(null);
  const [buildMode, setBuildMode] = useState('quick'); // 'quick' | 'recipe'
  const [mealName, setMealName] = useState('');
  const [mealSlot, setMealSlot] = useState('Lunch');
  const [imagePreview, setImagePreview] = useState(null);
  
  const [ingredients, setIngredients] = useState([]);
  const [newIngredientSearch, setNewIngredientSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState(null);
  const [newGrams, setNewGrams] = useState('');
  
  const [quickMacros, setQuickMacros] = useState({ kcal: '', pro: '', carb: '', fat: '' });
  
  const fileInputRef = useRef(null);

  const openBuilder = () => {
    setEditingMealId(null);
    setBuildMode('quick');
    setMealName('');
    setMealSlot('Lunch');
    setImagePreview(null);
    setIngredients([]);
    setQuickMacros({ kcal: '', pro: '', carb: '', fat: '' });
    setView('builder');
  };

  const handleEditMeal = (meal) => {
    setEditingMealId(meal.id);
    setMealName(meal.name);
    setMealSlot(meal.slot);
    setImagePreview(meal.img || null);
    if (meal.ingredients && meal.ingredients.length > 0) {
      setIngredients(meal.ingredients);
      setBuildMode('recipe');
      setQuickMacros({ kcal: '', pro: '', carb: '', fat: '' });
    } else {
      setIngredients([]);
      setBuildMode('quick');
      setQuickMacros({ kcal: meal.kcal, pro: meal.pro, carb: meal.carb, fat: meal.fat });
    }
    setView('builder');
  };

  // Computed Plate Totals
  const totalKcal = buildMode === 'quick' ? Number(quickMacros.kcal) || 0 : ingredients.reduce((sum, item) => sum + (Number(item.cal) || 0), 0);
  const totalPro = buildMode === 'quick' ? Number(quickMacros.pro) || 0 : ingredients.reduce((sum, item) => sum + (Number(item.pro) || 0), 0);
  const totalCarb = buildMode === 'quick' ? Number(quickMacros.carb) || 0 : ingredients.reduce((sum, item) => sum + (Number(item.carb) || 0), 0);
  const totalFat = buildMode === 'quick' ? Number(quickMacros.fat) || 0 : ingredients.reduce((sum, item) => sum + (Number(item.fat) || 0), 0);

  const targetKcal = SLOT_TARGETS[mealSlot] || 500;

  // Search logic for ingredients
  const [showDropdown, setShowDropdown] = useState(false);
  
  const filteredSearchFoods = (newIngredientSearch && showDropdown)
    ? allFoods.filter(f => f.name?.en?.toLowerCase().includes(newIngredientSearch.toLowerCase())).slice(0, 5)
    : [];

  const handleSelectFood = (food) => {
    setNewIngredientSearch(food.name?.en || '');
    setSelectedFood(food);
    setNewGrams(food.size_g || 100);
    setShowDropdown(false);
  };

  // Actions
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addIngredient = () => {
    if (!selectedFood || !newGrams) return;
    
    const grams = Number(newGrams);
    const baseSize = selectedFood.size_g || 100;
    const ratio = grams / baseSize;
    
    setIngredients([...ingredients, {
      id: Date.now(),
      foodId: selectedFood._id,
      name: selectedFood.name?.en,
      grams: grams,
      cal: Math.round(selectedFood.nutrition.calories * ratio),
      pro: Math.round(selectedFood.nutrition.protein_g * ratio),
      carb: Math.round(selectedFood.nutrition.carbs_g * ratio),
      fat: Math.round(selectedFood.nutrition.fat_g * ratio)
    }]);
    
    setNewIngredientSearch('');
    setSelectedFood(null);
    setNewGrams('');
  };

  const removeIngredient = (id) => {
    setIngredients(ingredients.filter(i => i.id !== id));
  };

  const handleSaveMeal = async () => {
    if (!mealName) {
      alert("Please enter a meal name.");
      return;
    }
    if (buildMode === 'recipe' && ingredients.length === 0) {
      alert("Please add at least one ingredient.");
      return;
    }
    
    const payload = {
      name: mealName,
      slot: mealSlot,
      image: imagePreview || '',
      ingredients: buildMode === 'recipe' ? ingredients.map(i => ({ foodId: i.foodId, grams: i.grams })) : [],
      manualMacros: buildMode === 'quick' ? quickMacros : undefined
    };
    
    try {
      if (editingMealId) {
        await API.put(`/custom-meals/${editingMealId}`, payload);
      } else {
        await API.post('/custom-meals', payload);
      }
      
      // Refresh the gallery from DB
      const res = await API.get('/custom-meals');
      if (res.data.success) {
        const formattedMeals = res.data.meals.map(m => ({
            id: m._id,
            name: m.name,
            slot: m.slot,
            kcal: m.kcal,
            pro: m.pro,
            carb: m.carb,
            fat: m.fat,
            img: m.image,
            ingredients: m.ingredients.map(ing => ({
              id: ing.foodId?._id,
              foodId: ing.foodId?._id,
              name: ing.foodId?.name?.en,
              grams: ing.grams,
              cal: Math.round(ing.foodId?.nutrition?.calories * (ing.grams / (ing.foodId?.size_g || 100)) || 0),
              pro: Math.round(ing.foodId?.nutrition?.protein_g * (ing.grams / (ing.foodId?.size_g || 100)) || 0),
              carb: Math.round(ing.foodId?.nutrition?.carbs_g * (ing.grams / (ing.foodId?.size_g || 100)) || 0),
              fat: Math.round(ing.foodId?.nutrition?.fat_g * (ing.grams / (ing.foodId?.size_g || 100)) || 0),
            }))
        }));
        setCustomMeals(formattedMeals);
      }
      
      setView('gallery');
      setEditingMealId(null);
      setMealName('');
      setImagePreview(null);
      setIngredients([]);
      setQuickMacros({ kcal: '', pro: '', carb: '', fat: '' });
    } catch (err) {
      console.error('Error saving meal:', err);
      alert('Failed to save meal.');
    }
  };

  const filteredMeals = customMeals.filter(m => {
    if (selectedSlot !== 'All' && m.slot !== selectedSlot) return false;
    if (search && !m.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="custom-meals-container fade-in">
      
      {view === 'gallery' && (
        <>
          <div className="discovery-header-section">
            <div className="discovery-header-text">
              <p>Your personal collection of crafted meals.</p>
            </div>

            <div className="discovery-controls">
              <div className="filter-search-top">
                <span className="material-symbols-outlined search-icon">search</span>
                <input 
                  type="text" 
                  placeholder="Search your custom meals..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="type-pills">
                {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'].map(slot => (
                  <button 
                    key={slot}
                    className={`type-pill ${selectedSlot === slot ? 'active' : ''}`}
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="discovery-gallery">
            <div className="gallery-header-small">
              <span className="results-count">{filteredMeals.length} Custom Meals</span>
            </div>

            <div className="gallery-grid-compact custom-scrollbar">
              
              {/* Special Create Button Card */}
              {selectedSlot === 'All' && !search && (
                <div className="meal-card-compact glass-panel create-new-card" onClick={openBuilder}>
                  <div className="create-new-icon">
                    <span className="material-symbols-outlined">add</span>
                  </div>
                  <h3>Create New</h3>
                  <p>Build a custom meal</p>
                </div>
              )}

              {filteredMeals.map((meal) => (
                <div key={meal.id} className="meal-card-compact glass-panel" style={{cursor: 'pointer'}} onClick={() => handleEditMeal(meal)}>
                  <div className="compact-img-wrap">
                    {meal.img ? (
                      <img src={meal.img} alt={meal.name} className="compact-img" />
                    ) : (
                      <div className="compact-img-placeholder">
                        <span className="material-symbols-outlined">restaurant</span>
                      </div>
                    )}
                    <span className="compact-type-badge">{meal.slot}</span>
                  </div>
                  
                  <div className="compact-content">
                    <h4 className="compact-title">{meal.name}</h4>
                    <span className="compact-kcal">{meal.kcal} kcal</span>
                    
                    <div className="compact-macros">
                      <span className="m-pro">{meal.pro}g P</span>
                      <span className="m-carb">{meal.carb}g C</span>
                      <span className="m-fat">{meal.fat}g F</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {view === 'builder' && (
        <div className="builder-view">
          <div className="builder-header">
            <button className="btn-back" onClick={() => {
              setView('gallery');
              setEditingMealId(null);
              setMealName('');
              setImagePreview(null);
              setIngredients([]);
              setQuickMacros({ kcal: '', pro: '', carb: '', fat: '' });
            }}>
              <span className="material-symbols-outlined">arrow_back</span> {editingMealId ? 'Cancel' : 'Back'}
            </button>
            
            <div className="build-mode-toggle" style={{ display: 'flex', gap: '8px', background: 'var(--color-bg)', padding: '4px', borderRadius: '12px' }}>
              <button 
                className={buildMode === 'quick' ? 'btn-primary' : 'btn-outline'} 
                style={{ border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '14px' }}
                onClick={() => setBuildMode('quick')}
              >
                Quick Add
              </button>
              <button 
                className={buildMode === 'recipe' ? 'btn-primary' : 'btn-outline'} 
                style={{ border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '14px' }}
                onClick={() => setBuildMode('recipe')}
              >
                Recipe Builder
              </button>
            </div>

            <button className="btn-primary" onClick={handleSaveMeal}>{editingMealId ? 'Update Meal' : 'Save Custom Meal'}</button>
          </div>

          <div className="builder-layout">
            {/* Left Col: Info & Image */}
            <div className="builder-col-left">
              <div className="bento-card glass-panel">
                <h3 className="bento-card-title">Basic Info</h3>
                
                <div className="form-group">
                  <label>Meal Name</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="e.g. My Epic Salad"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Meal Slot</label>
                  <select 
                    className="form-input"
                    value={mealSlot}
                    onChange={(e) => setMealSlot(e.target.value)}
                  >
                    <option value="Breakfast">Breakfast (~400 kcal target)</option>
                    <option value="Lunch">Lunch (~600 kcal target)</option>
                    <option value="Dinner">Dinner (~700 kcal target)</option>
                    <option value="Snack">Snack (~300 kcal target)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Photo (Optional)</label>
                  <div className="image-upload-area" onClick={() => fileInputRef.current?.click()}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="img-preview" />
                    ) : (
                      <div className="upload-placeholder">
                        <span className="material-symbols-outlined">add_a_photo</span>
                        <span>Click to upload</span>
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef} 
                      style={{display: 'none'}}
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
              </div>
              
              <div className="bento-card glass-panel totals-card">
                <h3 className="bento-card-title">Plate Totals</h3>
                
                {/* Smart Guidance Alerts */}
                {totalKcal > targetKcal + 50 && (
                  <div className="guidance-alert alert-warning">
                    <span className="material-symbols-outlined">warning</span>
                    <div>
                      <strong>Over Target:</strong> This meal exceeds your {mealSlot} target by {Math.abs(targetKcal - totalKcal)} kcal.
                    </div>
                  </div>
                )}
                {totalKcal > 0 && totalKcal < targetKcal - 100 && (
                  <div className="guidance-alert alert-info">
                    <span className="material-symbols-outlined">lightbulb</span>
                    <div>
                      <strong>Under Target:</strong> You can add ~{targetKcal - totalKcal} more kcal to hit your {mealSlot} goal.
                    </div>
                  </div>
                )}
                {totalKcal > 0 && Math.abs(targetKcal - totalKcal) <= 50 && (
                  <div className="guidance-alert alert-success">
                    <span className="material-symbols-outlined">check_circle</span>
                    <div>
                      <strong>Perfect Match:</strong> This hits your {mealSlot} calorie goal perfectly!
                    </div>
                  </div>
                )}

                <div className="totals-row">
                  <div className="total-stat cal">
                    <span className="val">{totalKcal}</span>
                    <span className="lbl">kcal</span>
                  </div>
                  <div className="total-stat pro">
                    <span className="val">{totalPro}g</span>
                    <span className="lbl">Protein</span>
                  </div>
                  <div className="total-stat carb">
                    <span className="val">{totalCarb}g</span>
                    <span className="lbl">Carbs</span>
                  </div>
                  <div className="total-stat fat">
                    <span className="val">{totalFat}g</span>
                    <span className="lbl">Fat</span>
                  </div>
                </div>
                <div className="target-context">
                  Target for {mealSlot}: <strong>{targetKcal} kcal</strong>
                </div>
              </div>
            </div>

            {/* Right Col: Ingredients or Quick Macros */}
            <div className="builder-col-right bento-card glass-panel">
              <h3 className="bento-card-title">{buildMode === 'recipe' ? 'Ingredients' : 'Manual Macros'}</h3>
              
              {buildMode === 'recipe' ? (
                <>
                  <div className="ingredients-list custom-scrollbar">
                {ingredients.length === 0 ? (
                  <div className="empty-plate">Your plate is empty. Add ingredients below!</div>
                ) : (
                  ingredients.map(item => (
                    <div key={item.id} className="ingredient-row">
                      <div className="ing-info">
                        <span className="ing-name">{item.name}</span>
                        <div className="ing-macros-tiny">
                          <span className="pro">{item.pro}g P</span>
                          <span className="carb">{item.carb}g C</span>
                          <span className="fat">{item.fat}g F</span>
                        </div>
                      </div>
                      <div className="ing-actions">
                        <span className="ing-cal">{item.cal} kcal</span>
                        <button className="btn-del-ing" onClick={() => removeIngredient(item.id)}>
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="add-ingredient-form">
                <h4>Add Ingredient</h4>
                <div className="ing-inputs">
                  <div className="ing-search-container" style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      placeholder="Search Food Name (Database)" 
                      className="form-input full-w" 
                      value={newIngredientSearch} 
                      onChange={e => {
                        setNewIngredientSearch(e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                    />
                    {showDropdown && filteredSearchFoods.length > 0 && (
                      <div className="ing-dropdown custom-scrollbar" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', zIndex: 10, maxHeight: '150px', overflowY: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: '4px' }}>
                        {filteredSearchFoods.map(food => (
                          <div 
                            key={food._id || food.name?.en} 
                            className="ing-dropdown-item"
                            style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--color-bg)', display: 'flex', justifyContent: 'space-between' }}
                            onClick={() => handleSelectFood(food)}
                          >
                            <span style={{ fontSize: '13px', fontWeight: 600 }}>{food.name?.en}</span>
                            <span style={{ fontSize: '12px', color: 'var(--color-accent)' }}>{food.nutrition?.calories} kcal / {food.size_g || 100}g</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {selectedFood && (
                    <div className="ing-macros-row" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', alignItems: 'center' }}>
                      <input 
                        type="number" 
                        placeholder="Grams" 
                        className="form-input" 
                        value={newGrams} 
                        onChange={e => setNewGrams(e.target.value)} 
                        min="1"
                      />
                      <div className="live-macro-preview" style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                        {(() => {
                          const ratio = (Number(newGrams) || 0) / (selectedFood.size_g || 100);
                          return (
                            <>
                              <span style={{color: 'var(--color-accent)', fontWeight: 600}}>{Math.round(selectedFood.nutrition.calories * ratio)} kcal</span>
                              <span style={{color: 'var(--color-purple)'}}>{Math.round(selectedFood.nutrition.protein_g * ratio)}g P</span>
                              <span style={{color: 'var(--color-teal)'}}>{Math.round(selectedFood.nutrition.carbs_g * ratio)}g C</span>
                              <span style={{color: 'var(--color-gold-dark, #8B7355)'}}>{Math.round(selectedFood.nutrition.fat_g * ratio)}g F</span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  <button className="btn-secondary add-btn-full" onClick={addIngredient} disabled={!selectedFood || !newGrams}>
                    <span className="material-symbols-outlined">add</span> Add to Plate
                  </button>
                </div>
              </div>
                </>
              ) : (
                <div className="quick-add-form" style={{ marginTop: '16px' }}>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '14px', marginBottom: '16px' }}>
                    Enter the total macros for this meal manually.
                  </p>
                  
                  <div className="form-group">
                    <label>Calories (kcal)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={quickMacros.kcal}
                      onChange={(e) => setQuickMacros({...quickMacros, kcal: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Protein (g)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={quickMacros.pro}
                      onChange={(e) => setQuickMacros({...quickMacros, pro: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Carbs (g)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={quickMacros.carb}
                      onChange={(e) => setQuickMacros({...quickMacros, carb: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Fat (g)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={quickMacros.fat}
                      onChange={(e) => setQuickMacros({...quickMacros, fat: e.target.value})}
                    />
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomMealsPage;
