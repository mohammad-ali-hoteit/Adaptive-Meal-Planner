import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import './PantryGeneratorPage.css';

const PantryGeneratorPage = () => {
  const [allFoods, setAllFoods] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  
  const [mealTime, setMealTime] = useState('Breakfast');
  const [targetCalories, setTargetCalories] = useState(500);

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedMeals, setGeneratedMeals] = useState(null);

  // Meal Discovery State
  const [activeTab, setActiveTab] = useState('pantry'); // 'pantry' or 'discovery'
  const [discoveryMeals, setDiscoveryMeals] = useState([]);
  const [discoverySearch, setDiscoverySearch] = useState('');
  const [discoveryType, setDiscoveryType] = useState('All');

  // Fetch foods for ingredients AND discovery
  useEffect(() => {
    const fetchFoods = async () => {
      try {
        const res = await API.get('/foods?limit=500');
        if (res.data.success) {
          setAllFoods(res.data.foods);
          
          // Enhanced meals for discovery (mocking tags for now)
          const enhancedMeals = res.data.foods.map((m, idx) => {
            const types = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
            return {
              ...m,
              typeTag: types[idx % types.length]
            };
          });
          setDiscoveryMeals(enhancedMeals);
        }
      } catch (err) {
        console.error('Failed to fetch foods:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  const toggleIngredient = (food) => {
    const exists = selectedIngredients.find(f => f._id === food._id);
    if (exists) {
      setSelectedIngredients(selectedIngredients.filter(f => f._id !== food._id));
    } else {
      setSelectedIngredients([...selectedIngredients, food]);
    }
  };

  const handleGenerate = async () => {
    if (selectedIngredients.length === 0) {
      alert('Please select at least one ingredient first.');
      return;
    }
    if (!targetCalories || targetCalories <= 0) {
      alert('Please enter a valid calorie target.');
      return;
    }

    setGenerating(true);
    setGeneratedMeals(null);
    try {
      const ingredientIds = selectedIngredients.map(f => f._id);
      const res = await API.post('/pantry/generate', {
        ingredientIds,
        mealTime: mealTime.toLowerCase(),
        targetCalories: Number(targetCalories)
      });
      if (res.data.success) {
        setGeneratedMeals(res.data.combinations);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate meals. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const filteredDiscoveryMeals = discoveryMeals.filter(meal => {
    const nameStr = meal.name?.en?.toLowerCase() || '';
    if (discoverySearch && !nameStr.includes(discoverySearch.toLowerCase())) {
      return false;
    }
    if (discoveryType !== 'All' && meal.typeTag !== discoveryType) {
      return false;
    }
    return true;
  });

  return (
    <div className="pantry-container fade-in custom-scrollbar" style={{ overflowY: 'auto' }}>
      
      {/* Unified Header */}
      <div className="discovery-header-section">
        <div className="discovery-header-text">
          <h2>Smart Meal Engine 🪄</h2>
          <p>Discover new meals or generate custom combinations from your pantry ingredients.</p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '16px', borderBottom: '2px solid var(--color-border)', paddingBottom: '16px' }}>
          <button 
            onClick={() => setActiveTab('pantry')}
            style={{ 
              padding: '10px 24px', 
              borderRadius: '8px', 
              border: 'none',
              background: activeTab === 'pantry' ? 'var(--color-accent)' : 'transparent',
              color: activeTab === 'pantry' ? 'white' : 'var(--color-text-muted)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Pantry Generator
          </button>
          <button 
            onClick={() => setActiveTab('discovery')}
            style={{ 
              padding: '10px 24px', 
              borderRadius: '8px', 
              border: 'none',
              background: activeTab === 'discovery' ? 'var(--color-accent)' : 'transparent',
              color: activeTab === 'discovery' ? 'white' : 'var(--color-text-muted)',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Meal Discovery
          </button>
        </div>
      </div>

      {activeTab === 'pantry' && (
        <div className="pantry-generator-section">
          {/* Configuration Controls */}
          <div className="pantry-config-bar glass-panel" style={{ display: 'flex', gap: '16px', padding: '16px', borderRadius: '12px', alignItems: 'center', marginBottom: '16px' }}>
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Meal Time (Slot)</label>
              <select 
                value={mealTime} 
                onChange={(e) => setMealTime(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontFamily: 'Inter' }}
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
                <option value="Snack">Snack</option>
              </select>
            </div>
            
            <div className="form-group" style={{ margin: 0, flex: 1 }}>
              <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px', display: 'block' }}>Target Calories (kcal)</label>
              <input 
                type="number" 
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', fontFamily: 'Inter' }}
              />
            </div>
          </div>

          {/* Visual Ingredients Grid */}
          <div className="pantry-grid-container glass-panel" style={{ padding: '16px', borderRadius: '12px', minHeight: '300px' }}>
            <h3 className="section-title" style={{ margin: '0 0 12px 0' }}>Select Ingredients (Images from DB)</h3>
            
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center' }}><span className="spinner"></span> Loading Ingredients...</div>
            ) : allFoods.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>No foods found in the database.</div>
            ) : (
              <div className="ingredients-grid custom-scrollbar" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '16px', maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
                {allFoods.map(food => {
                  const isSelected = selectedIngredients.some(s => s._id === food._id);
                  return (
                    <div 
                      key={food._id} 
                      className={`ingredient-select-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleIngredient(food)}
                      style={{ 
                        background: 'white', border: isSelected ? '2px solid var(--color-accent)' : '1px solid #EAEDF3', 
                        borderRadius: '12px', cursor: 'pointer', overflow: 'hidden', position: 'relative',
                        boxShadow: isSelected ? '0 4px 16px rgba(201, 168, 76, 0.2)' : '0 2px 8px rgba(0,0,0,0.05)',
                        display: 'flex', flexDirection: 'column'
                      }}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined" style={{ position: 'absolute', top: '4px', right: '4px', color: 'var(--color-accent)', background: 'white', borderRadius: '50%', zIndex: 10 }}>check_circle</span>
                      )}
                      <div className="isc-img-wrap" style={{ width: '100%', height: '100px', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {food.image_url ? (
                          <img 
                            src={food.image_url} 
                            alt={food.name?.en} 
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <span className="material-symbols-outlined" style={{ color: '#b5a898', fontSize: '32px' }}>kitchen</span>
                        )}
                      </div>
                      <div className="isc-title" title={food.name?.en} style={{ padding: '8px', fontSize: '13px', fontWeight: '600', textAlign: 'center', color: '#1f1b11', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {food.name?.en || 'Unknown Food'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Action Area */}
          <div className="pantry-selected-area glass-panel" style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h3 className="section-title" style={{ margin: '0 0 8px 0' }}>Selected ({selectedIngredients.length})</h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
                  {selectedIngredients.map(f => f.name?.en).join(', ') || 'None selected'}
                </p>
              </div>
              
              <button 
                className="btn-primary pantry-generate-btn" 
                onClick={handleGenerate}
                disabled={generating || selectedIngredients.length === 0}
                style={{ margin: 0, padding: '12px 24px', fontWeight: 'bold' }}
              >
                {generating ? <span className="spinner"></span> : <span className="material-symbols-outlined">magic_button</span>}
                {generating ? 'Calculating...' : `Generate Combinations`}
              </button>
            </div>
          </div>

          {/* Generated Results Area */}
          {generatedMeals && (
            <div className="pantry-results-area" style={{ marginTop: '24px' }}>
              <div className="gallery-header-small" style={{ marginBottom: '16px' }}>
                <h3 className="section-title">Logical Combinations ({generatedMeals.length})</h3>
              </div>
              
              <div className="gallery-grid-compact custom-scrollbar" style={{ paddingBottom: '40px' }}>
                {generatedMeals.length === 0 ? (
                  <div style={{ padding: '20px', color: 'var(--color-text-muted)', background: 'white', borderRadius: '12px' }}>
                    No logical combinations could be generated with the selected ingredients.
                  </div>
                ) : (
                  generatedMeals.map((meal, idx) => (
                    <div key={idx} className="meal-card-compact glass-panel pantry-result-card" style={{ background: 'white', padding: '16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="compact-img-wrap" style={{ height: '140px', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                        {meal.ingredients[0]?.image ? (
                          <img src={meal.ingredients[0].image} alt={meal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined">restaurant</span>
                          </div>
                        )}
                        <span className="compact-type-badge" style={{ position: 'absolute', top: '8px', right: '8px', background: 'var(--color-accent)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                          {meal.slot}
                        </span>
                      </div>
                      
                      <div className="compact-content" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <h4 className="compact-title" style={{ margin: 0, fontSize: '16px' }}>{meal.name}</h4>
                        <span className="compact-kcal text-accent" style={{ fontWeight: 'bold', fontSize: '14px' }}>{meal.totalKcal} kcal</span>
                        
                        <div className="compact-macros" style={{ display: 'flex', gap: '8px', fontSize: '12px', fontWeight: '600' }}>
                          <span style={{ color: 'var(--color-secondary)' }}>{meal.totalPro}g P</span>
                          <span style={{ color: 'var(--color-tertiary)' }}>{meal.totalCarb}g C</span>
                          <span style={{ color: 'var(--color-accent)' }}>{meal.totalFat}g F</span>
                        </div>

                        <div className="pantry-ingredients-list" style={{ marginTop: '8px', borderTop: '1px solid #EAEDF3', paddingTop: '8px' }}>
                          <h5 style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Exact Portions:</h5>
                          {meal.ingredients.map((ing, i) => (
                            <div key={i} className="pantry-ingredient-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                              <span style={{ color: 'var(--color-text)' }}>{ing.name}</span>
                              <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>{ing.grams}g</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'discovery' && (
        <div className="discovery-section">
          {/* Filters */}
          <div className="filter-bar glass-panel" style={{ display: 'flex', gap: '16px', padding: '16px', borderRadius: '12px', marginBottom: '24px', alignItems: 'center' }}>
            <div className="filter-search" style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'white', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-text-secondary)', marginRight: '8px' }}>search</span>
              <input 
                type="text" 
                placeholder="Search all database meals..." 
                value={discoverySearch}
                onChange={(e) => setDiscoverySearch(e.target.value)}
                style={{ border: 'none', outline: 'none', width: '100%', fontFamily: 'Inter' }}
              />
            </div>
            <div className="filter-tags" style={{ display: 'flex', gap: '8px' }}>
              {['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => (
                <button 
                  key={type}
                  className={`filter-tag ${discoveryType === type ? 'active' : ''}`}
                  onClick={() => setDiscoveryType(type)}
                  style={{
                    padding: '8px 16px', borderRadius: '99px', border: 'none', fontWeight: '600', cursor: 'pointer',
                    background: discoveryType === type ? 'var(--color-accent)' : 'white',
                    color: discoveryType === type ? 'white' : 'var(--color-text-muted)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}><span className="spinner"></span></div>
          ) : (
            <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '24px' }}>
              {filteredDiscoveryMeals.map(meal => (
                <div key={meal._id} className="meal-card glass-panel" style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div className="meal-card-img-wrap" style={{ height: '180px', position: 'relative' }}>
                    {meal.image_url ? (
                      <img src={meal.image_url} alt={meal.name?.en} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-outlined">restaurant</span>
                      </div>
                    )}
                    <div className="meal-card-badges" style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '8px' }}>
                      <span className="badge badge-accent" style={{ background: 'var(--color-accent)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{meal.typeTag}</span>
                    </div>
                  </div>
                  <div className="meal-card-content" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div className="mc-header">
                      <h3 className="mc-title" style={{ margin: 0, fontSize: '16px' }}>{meal.name?.en}</h3>
                      <p className="mc-subtitle" style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>{meal.name?.ar}</p>
                    </div>
                    <div className="mc-macros" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--color-bg)', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Kcal</span>
                        <span>{meal.nutrition?.calories || 0}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-secondary)' }}>Pro</span>
                        <span>{meal.nutrition?.protein_g || 0}g</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-tertiary)' }}>Carb</span>
                        <span>{meal.nutrition?.carbs_g || 0}g</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ color: 'var(--color-accent)' }}>Fat</span>
                        <span>{meal.nutrition?.fat_g || 0}g</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredDiscoveryMeals.length === 0 && (
                <p style={{ color: 'var(--color-text-muted)' }}>No meals found matching your criteria.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PantryGeneratorPage;
