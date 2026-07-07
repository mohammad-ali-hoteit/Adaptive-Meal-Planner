import { useState, useEffect, useCallback } from 'react';
import API from '../api/axios';
import './FoodsPage.css';

const MEAL_TABS = ['all', 'breakfast', 'lunch', 'dinner', 'snack'];

const FOOD_ICONS = {
  breakfast: '🥣',
  lunch: '🥗',
  dinner: '🍖',
  snack: '🍎',
  default: '🍽️',
};

const getFoodIcon = (tags) => {
  if (!tags || tags.length === 0) return FOOD_ICONS.default;
  return FOOD_ICONS[tags[0]] || FOOD_ICONS.default;
};

const FoodsPage = () => {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [total, setTotal] = useState(0);

  // Fetch foods — either search or filter by tab
  const fetchFoods = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (searchQuery.trim()) {
        res = await API.get(`/foods/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setFoods(res.data.foods);
        setTotal(res.data.foods.length);
      } else {
        const params = activeTab !== 'all' ? `?mealType=${activeTab}` : '';
        res = await API.get(`/foods${params}`);
        setFoods(res.data.foods);
        setTotal(res.data.total);
      }
    } catch (err) {
      console.error('Failed to load foods:', err);
      setFoods([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeTab]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFoods();
    }, searchQuery ? 350 : 0);
    return () => clearTimeout(timer);
  }, [fetchFoods, searchQuery]);

  // Reset search when tab changes
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  return (
    <div>
      {/* Search */}
      <div className="foods-search-row">
        <div className="foods-search-wrap">
          <span className="foods-search-icon">🔍</span>
          <input
            className="foods-search-input"
            type="text"
            placeholder="Search foods..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="foods-tabs">
        {MEAL_TABS.map((tab) => (
          <button
            key={tab}
            className={`foods-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabClick(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Results info */}
      {!loading && (
        <div className="foods-results-info">
          Showing <span>{foods.length}</span> of <span>{total}</span> foods
          {searchQuery && <> matching "<span>{searchQuery}</span>"</>}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="foods-loading">
          <div className="spinner"></div>
        </div>
      )}

      {/* Empty */}
      {!loading && foods.length === 0 && (
        <div className="foods-empty">
          <div className="foods-empty-icon">🔍</div>
          <div className="foods-empty-text">No foods found</div>
          <div className="foods-empty-hint">
            {searchQuery ? 'Try a different search term' : 'No foods in this category yet'}
          </div>
        </div>
      )}

      {/* Grid */}
      {!loading && foods.length > 0 && (
        <div className="foods-grid">
          {foods.map((food) => (
            <div key={food._id} className="food-card">
              <div className="food-card-img">
                {getFoodIcon(food.mealTypeTags)}
              </div>
              <div className="food-card-body">
                <div className="food-card-name">{food.name}</div>
                <div className="food-card-calories">🔥 {food.calories} cal</div>
                <div className="food-card-macros">
                  <span className="food-macro protein">P: {food.protein}g</span>
                  <span className="food-macro carbs">C: {food.carbs}g</span>
                  <span className="food-macro fat">F: {food.fat}g</span>
                </div>
                <div className="food-card-tags">
                  {food.mealTypeTags.map((tag) => (
                    <span key={tag} className="food-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodsPage;
