import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import './MealDiscoveryPage.css';

const MEAL_TYPES = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];

const MealDiscoveryPage = () => {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        const res = await API.get('/foods?limit=300');
        if (res.data.success) {
          // Fake some tags for UI filtering since the DB might not have explicit slot tags yet
          const enhancedMeals = res.data.foods.map((m, idx) => {
            const types = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
            return {
              ...m,
              typeTag: types[idx % types.length]
            };
          });
          setMeals(enhancedMeals);
        }
      } catch (err) {
        console.error('Error fetching meals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeals();
  }, []);

  const filteredMeals = meals.filter(meal => {
    const nameStr = meal.name?.en?.toLowerCase() || '';
    const ingredientsStr = meal.ingredients?.join(' ').toLowerCase() || '';
    
    if (search && !nameStr.includes(search.toLowerCase()) && !ingredientsStr.includes(search.toLowerCase())) {
      return false;
    }
    
    if (selectedType !== 'All' && meal.typeTag !== selectedType) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="discovery-container fade-in">
      
      {/* Top Header & Filters */}
      <div className="discovery-header-section">
        <div className="discovery-header-text">
          <h2>Meal Discovery</h2>
          <p>Find the perfect meal for your goals.</p>
        </div>

        <div className="discovery-controls">
          <div className="filter-search-top">
            <span className="material-symbols-outlined search-icon">search</span>
            <input 
              type="text" 
              placeholder="Search meals or ingredients..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="type-pills">
            {MEAL_TYPES.map(type => (
              <button 
                key={type}
                className={`type-pill ${selectedType === type ? 'active' : ''}`}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Gallery */}
      <div className="discovery-gallery">
        <div className="gallery-header-small">
          <span className="results-count">{filteredMeals.length} Results</span>
        </div>

        {loading ? (
          <div className="gallery-loading">
            <span className="spinner"></span>
            <p>Curating your meals...</p>
          </div>
        ) : filteredMeals.length === 0 ? (
          <div className="gallery-empty">
            <span className="material-symbols-outlined empty-icon">restaurant_menu</span>
            <h3>No meals found</h3>
            <p>Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="gallery-grid-compact custom-scrollbar">
            {filteredMeals.map((meal) => (
              <div key={meal._id} className="meal-card-compact glass-panel">
                <div className="compact-img-wrap">
                  {meal.image_url ? (
                    <img src={meal.image_url} alt={meal.name?.en} className="compact-img" />
                  ) : (
                    <div className="compact-img-placeholder">
                      <span className="material-symbols-outlined">restaurant</span>
                    </div>
                  )}
                  <button className="btn-add-hover" title="Add to Schedule">
                    <span className="material-symbols-outlined">add</span>
                  </button>
                  <span className="compact-type-badge">{meal.typeTag}</span>
                </div>
                
                <div className="compact-content">
                  <h4 className="compact-title" title={meal.name?.en}>{meal.name?.en || 'Unknown Meal'}</h4>
                  <span className="compact-kcal">{meal.nutrition?.calories || 0} kcal</span>
                  
                  <div className="compact-macros">
                    <span className="m-pro" title="Protein">{meal.nutrition?.protein_g || 0}g P</span>
                    <span className="m-carb" title="Carbs">{meal.nutrition?.carbs_g || 0}g C</span>
                    <span className="m-fat" title="Fat">{meal.nutrition?.fat_g || 0}g F</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MealDiscoveryPage;
