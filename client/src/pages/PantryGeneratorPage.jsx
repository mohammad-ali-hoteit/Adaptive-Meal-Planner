import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api/axios';
import './PantryGeneratorPage.css';

const PantryGeneratorPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialSlot = queryParams.get('slot') || '';
  const initialDate = queryParams.get('date') || ''; // Read date from URL

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [allFoods, setAllFoods] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [activeTab, setActiveTab] = useState(initialSlot ? 'meals' : 'ingredients'); // 'ingredients' or 'meals'
  const [categoryFilter, setCategoryFilter] = useState('All'); // 'All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'
  
  // Right Sidebar (Modal) State
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(initialSlot || '');
  const [selectedDate, setSelectedDate] = useState(initialDate ? initialDate.split('T')[0] : getLocalDateString());
  const [dailyLog, setDailyLog] = useState(null);
  const [adding, setAdding] = useState(false);

  // Fetch foods once
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await API.get('/foods?limit=500');
        if (res.data.success) {
          setAllFoods(res.data.foods);
        }
      } catch (err) {
        console.error('Failed to fetch foods:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  // Fetch daily log when selectedDate changes
  useEffect(() => {
    const fetchLog = async () => {
      try {
        const urlParams = selectedDate ? `?date=${selectedDate}` : '';
        const res = await API.get(`/dashboard/daily-meals${urlParams}`);
        if (res.data.success) {
          setDailyLog(res.data.log);
        }
      } catch (err) {
        console.error('Failed to fetch daily log:', err);
      }
    };
    fetchLog();
  }, [selectedDate]);

  // When initialSlot changes or is provided, auto-switch to meals tab
  useEffect(() => {
    if (initialSlot) {
      setActiveTab('meals');
      setCategoryFilter(initialSlot);
    }
  }, [initialSlot]);

  // Derived Data
  const baseIngredients = allFoods.filter(f => !f.ingredients || f.ingredients.length <= 1);
  const fullMeals = allFoods.filter(f => f.ingredients && f.ingredients.length > 1);

  // Apply Category Filter
  const applyCategory = (list) => {
    if (categoryFilter === 'All') return list;
    return list.filter(item => {
      if (!item.meal_type || item.meal_type.length === 0) return false;
      return item.meal_type.map(t => t.toLowerCase()).includes(categoryFilter.toLowerCase());
    });
  };

  const displayIngredients = applyCategory(baseIngredients);
  const displayMeals = applyCategory(fullMeals);

  // Instant Filtering Logic for Ingredients
  const matchedMeals = selectedIngredients.length === 0 ? [] : fullMeals.filter(meal => {
    if (!meal.ingredients || meal.ingredients.length === 0) return false;
    return selectedIngredients.every(selected => {
      const selectedName = selected.name?.en?.toLowerCase() || '';
      return meal.ingredients.some(ingName => 
        ingName.toLowerCase() === selectedName ||
        ingName.toLowerCase().includes(selectedName)
      );
    });
  });

  const toggleIngredient = (food) => {
    const exists = selectedIngredients.find(f => f._id === food._id);
    if (exists) {
      setSelectedIngredients(selectedIngredients.filter(f => f._id !== food._id));
    } else {
      setSelectedIngredients([...selectedIngredients, food]);
    }
  };

  const removeIngredient = (id) => {
    setSelectedIngredients(selectedIngredients.filter(f => f._id !== id));
  };

  const openMealSidebar = (meal) => {
    setSelectedMeal(meal);
    if (initialSlot && !isSlotTaken(initialSlot)) {
      setSelectedSlot(initialSlot);
    } else {
      setSelectedSlot('');
    }
  };

  const closeSidebar = () => {
    setSelectedMeal(null);
    setSelectedSlot('');
  };

  // Check if a slot is already taken in today's log
  const isSlotTaken = (slotName) => {
    if (!dailyLog || !dailyLog.mealsAssigned) return false;
    const assignment = dailyLog.mealsAssigned.find(m => m.mealType.toLowerCase() === slotName.toLowerCase());
    return assignment && (assignment.foodId || assignment.customMealId);
  };

  const availableSlots = ['Breakfast', 'Lunch', 'Dinner', 'Snack'].filter(slot => !isSlotTaken(slot));

  // Add meal to timeline
  const handleAddToDay = async () => {
    if (!selectedSlot) {
      alert("Please select a meal time first.");
      return;
    }

    setAdding(true);
    try {
      const payload = {
        mealType: selectedSlot.toLowerCase(),
        foodId: selectedMeal._id,
        date: selectedDate
      };

      const res = await API.post('/dashboard/assign-meal', payload);
      if (res.data.success) {
        // Navigate back to weekly plan if we came from there, else dashboard
        navigate(initialDate ? '/weekly-plan' : '/dashboard');
      }
    } catch (error) {
      console.error(error);
      alert('Failed to add meal to timeline.');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="pantry-container fade-in custom-scrollbar" style={{ overflowY: 'auto', position: 'relative', height: '100%' }}>
      
      {/* Header text - Cleaned up to match requested simple sentence */}
      <div className="discovery-header-section" style={{ marginBottom: '16px' }}>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Select ingredients to find recipes, or browse full meals to add to your day.</p>
      </div>

      {/* Tabs & Filters */}
      <div className="pantry-controls glass-panel" style={{ padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
          <button 
            onClick={() => setActiveTab('ingredients')}
            className={`tab-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'ingredients' ? 'var(--color-accent)' : 'transparent', color: activeTab === 'ingredients' ? 'white' : 'var(--color-text)', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Ingredients
          </button>
          <button 
            onClick={() => setActiveTab('meals')}
            className={`tab-btn ${activeTab === 'meals' ? 'active' : ''}`}
            style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'meals' ? 'var(--color-accent)' : 'transparent', color: activeTab === 'meals' ? 'white' : 'var(--color-text)', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Full Meals
          </button>
        </div>

        <div className="category-filters" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '6px 16px', borderRadius: '99px', border: '1px solid var(--color-border)',
                background: categoryFilter === cat ? 'var(--color-text)' : 'white',
                color: categoryFilter === cat ? 'white' : 'var(--color-text)',
                cursor: 'pointer', fontSize: '13px', fontWeight: '500'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* INGREDIENTS TAB */}
      {activeTab === 'ingredients' && (
        <div className="pantry-generator-section">
          
          {/* Matched Meals (Results at the Top) */}
          {selectedIngredients.length > 0 && (
            <div className="pantry-results-area glass-panel" style={{ padding: '20px', borderRadius: '16px', marginBottom: '24px', background: 'white' }}>
              <h3 className="section-title" style={{ margin: '0 0 16px 0', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
                Meals you can make ({matchedMeals.length})
              </h3>
              
              {matchedMeals.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-error)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', marginBottom: '8px' }}>search_off</span>
                  <p>No meals in the database combine all these ingredients. Try removing some!</p>
                </div>
              ) : (
                <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {matchedMeals.map(meal => (
                    <div key={meal._id} onClick={() => openMealSidebar(meal)} className="meal-card" style={{ border: '1px solid #EAEDF3', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer' }}>
                      <div style={{ height: '120px', background: '#f5f0e8' }}>
                        {meal.image_url ? (
                          <img src={meal.image_url} alt={meal.name?.en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="material-symbols-outlined">restaurant</span></div>
                        )}
                      </div>
                      <div style={{ padding: '12px' }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{meal.name?.en}</h4>
                        <span style={{ fontSize: '12px', color: 'var(--color-accent)', fontWeight: 'bold' }}>{meal.nutrition?.calories || 0} kcal</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Selected Chips directly below results */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #EAEDF3' }}>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginRight: '8px' }}>Selected Filters:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {selectedIngredients.map(ing => (
                    <div key={ing._id} style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', border: '1px solid var(--color-border)' }}>
                      <span style={{ marginRight: '6px' }}>{ing.name?.en}</span>
                      <span className="material-symbols-outlined" onClick={() => removeIngredient(ing._id)} style={{ fontSize: '14px', cursor: 'pointer', color: 'var(--color-error)' }}>close</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Grid of Ingredients */}
          <div className="pantry-grid-container">
            <h3 className="section-title" style={{ margin: '0 0 12px 0' }}>Available Ingredients</h3>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}><span className="spinner"></span></div>
            ) : displayIngredients.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No ingredients found for this category.</div>
            ) : (
              <div className="ingredients-grid custom-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
                {displayIngredients.map(food => {
                  const isSelected = selectedIngredients.some(s => s._id === food._id);
                  return (
                    <div 
                      key={food._id} 
                      onClick={() => toggleIngredient(food)}
                      style={{ 
                        background: 'white', border: isSelected ? '2px solid var(--color-accent)' : '1px solid #EAEDF3', 
                        borderRadius: '12px', cursor: 'pointer', overflow: 'hidden', position: 'relative',
                        boxShadow: isSelected ? '0 4px 12px rgba(201, 168, 76, 0.15)' : 'none',
                        display: 'flex', flexDirection: 'column'
                      }}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined" style={{ position: 'absolute', top: '4px', right: '4px', color: 'var(--color-accent)', background: 'white', borderRadius: '50%', zIndex: 10, fontSize: '18px' }}>check_circle</span>
                      )}
                      <div style={{ width: '100%', height: '80px', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {food.image_url ? (
                          <img src={food.image_url} alt={food.name?.en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span className="material-symbols-outlined" style={{ color: '#b5a898', fontSize: '24px' }}>kitchen</span>
                        )}
                      </div>
                      <div style={{ padding: '8px', fontSize: '12px', fontWeight: '500', textAlign: 'center', color: '#1f1b11', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {food.name?.en}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MEALS TAB */}
      {activeTab === 'meals' && (
        <div className="meals-discovery-section">
          <h3 className="section-title" style={{ margin: '0 0 16px 0' }}>Browse Full Meals</h3>
          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center' }}><span className="spinner"></span></div>
          ) : displayMeals.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No meals found for this category.</div>
          ) : (
            <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
              {displayMeals.map(meal => (
                <div key={meal._id} onClick={() => openMealSidebar(meal)} className="meal-card glass-panel" style={{ cursor: 'pointer', background: 'white', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: '160px', position: 'relative' }}>
                    {meal.image_url ? (
                      <img src={meal.image_url} alt={meal.name?.en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined">restaurant</span>
                      </div>
                    )}

                  </div>
                  <div style={{ padding: '12px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '15px' }}>{meal.name?.en}</h4>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                      <span>🔥 {meal.nutrition?.calories || 0}</span>
                      <span>💪 {meal.nutrition?.protein_g || 0}g</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* RIGHT SIDEBAR OVERLAY */}
      {selectedMeal && (
        <>
          {/* Backdrop */}
          <div 
            onClick={closeSidebar}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, backdropFilter: 'blur(2px)' }} 
          />
          
          {/* Sidebar Panel */}
          <div className="right-sidebar slide-in-right custom-scrollbar" style={{ 
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '420px', maxWidth: '100vw', 
            background: 'white', zIndex: 1000, overflowY: 'auto', display: 'flex', flexDirection: 'column',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.1)'
          }}>
            
            {/* Image Header */}
            <div style={{ position: 'relative', height: '140px', width: '100%', flexShrink: 0 }}>
              {selectedMeal.image_url ? (
                <img src={selectedMeal.image_url} alt={selectedMeal.name?.en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#f5f0e8' }} />
              )}
              
              <button 
                onClick={closeSidebar}
                style={{ position: 'absolute', top: '16px', left: '16px', background: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
              </button>
            </div>

            {/* Content Body */}
            <div style={{ padding: '24px', flex: 1 }}>

              
              <h2 style={{ margin: '0 0 16px 0', fontSize: '28px', color: '#1f1b11', lineHeight: '1.2' }}>{selectedMeal.name?.en}</h2>

              {/* Macros Box */}
              <div style={{ display: 'flex', background: '#fcfaf7', border: '1px solid #f1eae0', borderRadius: '12px', padding: '16px', justifyContent: 'space-between', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--color-error)' }}>local_fire_department</span>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{selectedMeal.nutrition?.calories || 0} <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>kcal</span></div>
                  </div>
                </div>
                
                <div style={{ width: '1px', background: '#eae0d5' }}></div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Carbs</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-tertiary)' }}>{selectedMeal.nutrition?.carbs_g || 0}g</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Protein</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-secondary)' }}>{selectedMeal.nutrition?.protein_g || 0}g</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Fat</div>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-accent)' }}>{selectedMeal.nutrition?.fat_g || 0}g</div>
                  </div>
                </div>
              </div>

              {/* Ingredients List */}
              {selectedMeal.ingredients && selectedMeal.ingredients.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '12px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>Ingredients</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedMeal.ingredients.map((ing, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--color-text)' }}>
                        <span style={{ textTransform: 'capitalize' }}>{ing}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Sticky Action Area */}
            <div style={{ padding: '24px', background: 'white', borderTop: '1px solid #eee', position: 'sticky', bottom: 0 }}>
              
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px', fontWeight: 'bold' }}>Assign to Date</label>
                  <input 
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px', fontWeight: 'bold' }}>Assign to Slot</label>
                  <select 
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '14px', outline: 'none' }}
                  >
                    <option value="" disabled>Select...</option>
                    {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(slot => {
                      const taken = isSlotTaken(slot);
                      return (
                        <option key={slot} value={slot} disabled={taken}>
                          {slot} {taken ? '(Planned)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Warning if High Calorie */}
              {selectedMeal.nutrition?.calories > 800 && (
                <div style={{ background: '#fff9e6', color: '#856404', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>warning</span>
                  <span>This is a high calorie meal. Make sure it fits your daily goal!</span>
                </div>
              )}

              <button 
                onClick={handleAddToDay}
                disabled={adding || !selectedSlot}
                className="btn-primary"
                style={{ width: '100%', padding: '16px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', background: '#745B25', color: 'white' }}
              >
                {adding ? <span className="spinner" style={{ width: '20px', height: '20px', borderWidth: '3px' }}></span> : 'Add to Day'}
                {adding ? '' : <span className="material-symbols-outlined">chevron_right</span>}
              </button>
            </div>
            
          </div>
        </>
      )}
    </div>
  );
};

export default PantryGeneratorPage;
