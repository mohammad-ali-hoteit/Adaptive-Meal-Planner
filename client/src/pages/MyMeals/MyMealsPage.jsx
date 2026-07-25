import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { generateMealSchedule, parseTimeStringToMinutes, parseBusyPeriods } from '../../utils/algorithms/timeScheduleAlgorithm';
import { autoBalanceMeal, getMacrosForQuantity, formatQuantity } from '../../utils/optimizer';
import './MyMealsPage.css';

const CATEGORIES = [
  { key: 'Dairy, Eggs & Cheese', label: 'Dairy & Eggs', icon: 'egg' },
  { key: 'Bakery & Manakeesh', label: 'Bakery', icon: 'bakery_dining' },
  { key: 'Grains, Cereals & Legumes', label: 'Grains', icon: 'grain' },
  { key: 'Meats, Poultry & Seafood', label: 'Meats', icon: 'set_meal' },
  { key: 'Vegetables & Greens', label: 'Vegetables', icon: 'eco' },
  { key: 'Fruits', label: 'Fruits', icon: 'nutrition' },
  { key: 'Drinks', label: 'Drinks', icon: 'local_cafe' },
  { key: 'Fats, Oils & Sweeteners', label: 'Fats & Oils', icon: 'water_drop' },
  { key: 'Condiments & Spices', label: 'Condiments', icon: 'kitchen' }
];

const MyMealsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const [allIngredients, setAllIngredients] = useState([]);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const { data } = await API.get('/ingredients');
        setAllIngredients(data);
      } catch (err) {
        console.error("Failed to load ingredients", err);
      } finally {
        setDbLoading(false);
      }
    };
    fetchIngredients();
  }, []);

  // ═══════════════════════════════════════════════════════════
  //  TAB STATE
  // ═══════════════════════════════════════════════════════════
  const [activeTab, setActiveTab] = useState('builder');

  // ═══════════════════════════════════════════════════════════
  //  BUILDER TAB STATE
  // ═══════════════════════════════════════════════════════════

  const [builderSlot, setBuilderSlot] = useState('');

  // Target macros (from URL params or defaults)
  const [targetCal, setTargetCal] = useState(() =>
    parseFloat(searchParams.get('targetCal')) || 0
  );
  const [targetPro, setTargetPro] = useState(() =>
    parseFloat(searchParams.get('targetPro')) || 0
  );
  const [targetCarb, setTargetCarb] = useState(() =>
    parseFloat(searchParams.get('targetCarb')) || 0
  );
  const [targetFat, setTargetFat] = useState(() =>
    parseFloat(searchParams.get('targetFat')) || 0
  );

  // Main Part ingredients (can be 1+)
  const [mainIngredients, setMainIngredients] = useState([]);
  // Side Parts (each is a single ingredient)
  const [sideIngredients, setSideIngredients] = useState([]);

  // Search states
  const [mainSearch, setMainSearch] = useState('');
  const [sideSearch, setSideSearch] = useState('');
  const [showMainDropdown, setShowMainDropdown] = useState(false);
  const [showSideDropdown, setShowSideDropdown] = useState(false);

  // Category browser
  const [showCategoryBrowser, setShowCategoryBrowser] = useState(false);
  const [browserTarget, setBrowserTarget] = useState('main'); // 'main' or 'side'
  const [browserCategory, setBrowserCategory] = useState(null);

  // Optimization results
  const [result, setResult] = useState(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [hasSavedCurrentMeal, setHasSavedCurrentMeal] = useState(false);

  // ═══════════════════════════════════════════════════════════
  //  SAVED MEALS TAB STATE
  // ═══════════════════════════════════════════════════════════
  const [savedMeals, setSavedMeals] = useState([]);

  // Sidebar State (for Add to Timeline from Saved Meals)
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState('Breakfast-0');
  const [dailyLog, setDailyLog] = useState(null);

  // Timeline sidebar for builder results
  const [showTimelineSidebar, setShowTimelineSidebar] = useState(false);
  const [timelineDate, setTimelineDate] = useState(new Date().toISOString().split('T')[0]);
  const [timelineSlot, setTimelineSlot] = useState('Breakfast-0');

  // ═══════════════════════════════════════════════════════════
  //  SCHEDULE & SLOT LOGIC (shared)
  // ═══════════════════════════════════════════════════════════

  // Determine initial slot from URL
  useEffect(() => {
    const slot = searchParams.get('slot');
    if (slot) {
      const snackIdx = searchParams.get('snackIndex');
      let slotValue;
      if (slot.toLowerCase() === 'snack' && snackIdx !== null && snackIdx !== '') {
        slotValue = `Snack-${snackIdx}`;
      } else {
        slotValue = `${slot.charAt(0).toUpperCase() + slot.slice(1)}-0`;
      }
      setSelectedSlot(slotValue);
      setTimelineSlot(slotValue);
      setBuilderSlot(slotValue);
    }
    const date = searchParams.get('date');
    if (date) {
      setSelectedDate(date);
      setTimelineDate(date);
    }
  }, [searchParams]);

  // Load saved meals
  useEffect(() => {
    const loadMeals = async () => {
      try {
        const res = await API.get('/meals');
        if (res.data.success) {
          setSavedMeals(res.data.meals);
        }
      } catch (err) {
        console.error('Failed to load custom meals:', err);
      }
    };
    loadMeals();
  }, []);

  // Fetch daily log when selecting a meal or changing date
  useEffect(() => {
    if (!selectedMeal && !showTimelineSidebar) return;
    const targetDate = selectedMeal ? selectedDate : timelineDate;
    const fetchDailyLog = async () => {
      try {
        const res = await API.get(`/dashboard/${targetDate}`);
        if (res.data.success && res.data.log) {
          setDailyLog(res.data.log);
        } else {
          setDailyLog(null);
        }
      } catch (err) {
        console.error('Failed to fetch daily log:', err);
        setDailyLog(null);
      }
    };
    fetchDailyLog();
  }, [selectedDate, timelineDate, selectedMeal, showTimelineSidebar]);

  const MEAL_OPTIONS = useMemo(() => {
    const fallback = [
      { label: 'Breakfast', value: 'Breakfast-0', isLogged: false, isPlanned: false },
      { label: 'Lunch', value: 'Lunch-0', isLogged: false, isPlanned: false },
      { label: 'Dinner', value: 'Dinner-0', isLogged: false, isPlanned: false },
      { label: 'Snack', value: 'Snack-0', isLogged: false, isPlanned: false }
    ];

    if (!user) return fallback;

    const activeScheduleConfig = dailyLog?.scheduleOverride?.wakeTime
      ? dailyLog.scheduleOverride
      : (user.schedule || { wakeTime: '07:00', sleepTime: '23:00', busyPeriods: [] });

    const wakeMin = parseTimeStringToMinutes(activeScheduleConfig.wakeTime) || 7 * 60;
    const sleepMin = parseTimeStringToMinutes(activeScheduleConfig.sleepTime) || 22 * 60;
    const busyIntervals = parseBusyPeriods(activeScheduleConfig.busyPeriods || []);
    const userMacros = {
      totalCal: user.totalCal || 2000,
      totalPro: user.totalPro || 150,
      totalCarb: user.totalCarb || 200,
      totalFat: user.totalFat || 65
    };

    const scheduleData = generateMealSchedule(wakeMin, sleepMin, busyIntervals, userMacros, !!activeScheduleConfig.wakeTime);
    if (!scheduleData?.meals || scheduleData.meals.length === 0) return fallback;

    let snackCount = scheduleData.meals.filter(m => m.type === 'snack').length;
    let snackIdxAssigned = 0;

    return scheduleData.meals.map(m => {
      const isSnack = m.type === 'snack';
      let slotName = m.type.charAt(0).toUpperCase() + m.type.slice(1);
      let sIdx = 0;

      if (isSnack) {
        sIdx = snackIdxAssigned;
        if (snackCount > 1) {
          slotName = `Snack ${snackIdxAssigned + 1}`;
        }
        snackIdxAssigned++;
      }

      const typeLower = m.type.toLowerCase();
      const isLogged = dailyLog?.mealsCompleted?.some(mc => {
        if (mc.mealType.toLowerCase() === 'snack' && isSnack) return mc.snackIndex === sIdx;
        return mc.mealType.toLowerCase() === typeLower;
      }) || false;

      const isPlanned = dailyLog?.mealsAssigned?.some(ma => {
        if (ma.mealType.toLowerCase() === 'snack' && isSnack) return ma.snackIndex === sIdx;
        return ma.mealType.toLowerCase() === typeLower;
      }) || false;

      return {
        label: slotName,
        value: `${m.type.charAt(0).toUpperCase() + m.type.slice(1)}-${sIdx}`,
        isLogged,
        isPlanned,
        calories: m.calories,
        macros: m.macros
      };
    });
  }, [user, dailyLog]);

  const handleBuilderSlotChange = (e) => {
    const val = e.target.value;
    setBuilderSlot(val);
    const selectedOpt = MEAL_OPTIONS.find(o => o.value === val);
    if (selectedOpt) {
      setTargetCal(Math.round(selectedOpt.calories));
      setTargetPro(Math.round(selectedOpt.macros.pro));
      setTargetCarb(Math.round(selectedOpt.macros.carb));
      setTargetFat(Math.round(selectedOpt.macros.fat));
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  INGREDIENT MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  const allSelectedIds = useMemo(() => {
    const ids = new Set();
    mainIngredients.forEach(ing => ids.add(ing.id));
    sideIngredients.forEach(ing => ids.add(ing.id));
    return ids;
  }, [mainIngredients, sideIngredients]);

  const searchIngredients = useCallback((query) => {
    if (!query) return [];
    const lower = query.toLowerCase();
    return allIngredients.filter(ing => 
      ing.name.toLowerCase().includes(lower) || 
      ing.category.toLowerCase().includes(lower)
    );
  }, [allIngredients]);

  const mainSearchResults = useMemo(() => {
    if (!mainSearch.trim()) return [];
    return searchIngredients(mainSearch);
  }, [mainSearch, searchIngredients]);

  const sideSearchResults = useMemo(() => {
    if (!sideSearch.trim()) return [];
    return searchIngredients(sideSearch);
  }, [sideSearch, searchIngredients]);

  const addToMain = useCallback((ingredient) => {
    if (mainIngredients.some(ing => ing.id === ingredient.id)) {
      setMainIngredients(prev => prev.filter(ing => ing.id !== ingredient.id));
    } else if (!allSelectedIds.has(ingredient.id)) {
      setMainIngredients(prev => [...prev, ingredient]);
    }
    setResult(null);
  }, [mainIngredients, allSelectedIds]);

  const addToSide = useCallback((ingredient) => {
    if (sideIngredients.some(ing => ing.id === ingredient.id)) {
      setSideIngredients(prev => prev.filter(ing => ing.id !== ingredient.id));
    } else if (!allSelectedIds.has(ingredient.id)) {
      setSideIngredients(prev => [...prev, ingredient]);
    }
    setResult(null);
  }, [sideIngredients, allSelectedIds]);

  const removeFromMain = useCallback((id) => {
    setMainIngredients(prev => prev.filter(ing => ing.id !== id));
    setResult(null);
  }, []);

  const removeFromSide = useCallback((id) => {
    setSideIngredients(prev => prev.filter(ing => ing.id !== id));
    setResult(null);
  }, []);

  // ═══════════════════════════════════════════════════════════
  //  AUTO-BALANCE
  // ═══════════════════════════════════════════════════════════

  const handleAutoBalance = useCallback(() => {
    if (mainIngredients.length === 0) return;

    setIsOptimizing(true);
    setResult(null);

    // Use setTimeout to allow UI to update (show spinner)
    setTimeout(() => {
      const target = {
        calories: targetCal,
        protein: targetPro,
        carbs: targetCarb,
        fat: targetFat
      };

      const optimizationResult = autoBalanceMeal(mainIngredients, sideIngredients, target);
      setResult(optimizationResult);
      setHasSavedCurrentMeal(false);
      setIsOptimizing(false);

      // Scroll to results
      setTimeout(() => {
        document.getElementById('balance-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 50);
  }, [mainIngredients, sideIngredients, targetCal, targetPro, targetCarb, targetFat]);

  // ═══════════════════════════════════════════════════════════
  //  SAVE & LOG ACTIONS
  // ═══════════════════════════════════════════════════════════

  const handleSaveAsCustomMeal = async () => {
    if (!result || hasSavedCurrentMeal) return;

    const allParts = [...result.mainPart, ...result.sideParts].filter(p => p.quantity > 0);
    const mealName = allParts.map(p => p.ingredient.name.split(' (')[0]).join(' + ');

    const newMeal = {
      name: mealName,
      mealType: 'Breakfast',
      image: '',
      calories: Math.round(result.totalCalories),
      protein: Math.round(result.totalProtein),
      carbs: Math.round(result.totalCarbs),
      fat: Math.round(result.totalFat),
      ingredients: allParts.map(p => ({
        foodId: p.ingredient.id,
        name: p.ingredient.name,
        grams: Math.round(p.quantity)
      }))
    };

    try {
      const res = await API.post('/meals', newMeal);
      if (res.data.success) {
        setSavedMeals(prev => [res.data.meal, ...prev]);
        setHasSavedCurrentMeal(true);
        setShowSaveToast(true);
        setTimeout(() => setShowSaveToast(false), 1500);
      }
    } catch (err) {
      console.error('Failed to save meal:', err);
      alert('Failed to save meal. Please try again.');
    }
  };

  const handleLogToTimeline = () => {
    if (!result) return;
    setShowTimelineSidebar(true);
  };

  const confirmLogToTimeline = async () => {
    if (!result) return;

    const allParts = [...result.mainPart, ...result.sideParts].filter(p => p.quantity > 0);
    const mealName = allParts.map(p => {
      const shortName = p.ingredient.name.split(' (')[0];
      return `${formatQuantity(p.ingredient, p.quantity)} ${shortName}`;
    }).join(' + ');

    const [type, idxStr] = timelineSlot.split('-');
    const sIdx = parseInt(idxStr) || 0;

    try {
      await API.post('/dashboard/assign-meal', {
        date: timelineDate,
        mealType: type.toLowerCase(),
        snackIndex: type.toLowerCase() === 'snack' ? sIdx : undefined,
        snapshotMacros: {
          kcal: Math.round(result.totalCalories),
          pro: Math.round(result.totalProtein),
          carb: Math.round(result.totalCarbs),
          fat: Math.round(result.totalFat)
        },
        customMealId: {
          name: mealName,
          kcal: Math.round(result.totalCalories),
          pro: Math.round(result.totalProtein),
          carb: Math.round(result.totalCarbs),
          fat: Math.round(result.totalFat),
          ingredients: allParts.map(p => `${formatQuantity(p.ingredient, p.quantity)} ${p.ingredient.name}`)
        }
      });

      setShowTimelineSidebar(false);
      const d = new Date();
      const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (timelineDate === todayStr) {
        navigate('/dashboard');
      } else {
        navigate('/weekly-plan');
      }
    } catch (err) {
      console.error('Failed to log meal:', err);
      alert('Failed to log meal. Please try again.');
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  SAVED MEALS HANDLERS (preserved from original)
  // ═══════════════════════════════════════════════════════════

  const openSavedMealSidebar = (meal) => {
    setSelectedMeal(meal);
    if (meal.mealType) {
      const type = meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1);
      const isSnack = type.toLowerCase() === 'snack';
      setSelectedSlot(isSnack ? 'Snack-0' : `${type}-0`);
    }
  };

  const closeSavedMealSidebar = () => {
    setSelectedMeal(null);
  };

  const handleAddSavedMealToTimeline = async () => {
    if (!selectedMeal) return;

    try {
      const [type, idxStr] = selectedSlot.split('-');
      const sIdx = parseInt(idxStr) || 0;

      await API.post('/dashboard/assign-meal', {
        date: selectedDate,
        mealType: type.toLowerCase(),
        snackIndex: type.toLowerCase() === 'snack' ? sIdx : undefined,
        snapshotMacros: {
          kcal: selectedMeal.calories,
          pro: selectedMeal.protein,
          carb: selectedMeal.carbs,
          fat: selectedMeal.fat
        },
        customMealId: {
          name: selectedMeal.name,
          kcal: selectedMeal.calories,
          pro: selectedMeal.protein,
          carb: selectedMeal.carbs,
          fat: selectedMeal.fat
        }
      });

      closeSavedMealSidebar();
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to add meal to timeline:', err);
      alert('Failed to add meal. Please try again.');
    }
  };

  const handleDeleteCustomMeal = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this custom meal?')) return;
    try {
      await API.delete(`/meals/${id}`);
      setSavedMeals(savedMeals.filter(m => m._id !== id));
      if (selectedMeal && selectedMeal._id === id) {
        closeSavedMealSidebar();
      }
    } catch (err) {
      console.error('Failed to delete meal:', err);
      alert('Failed to delete meal.');
    }
  };

  // Auto-select first available slot if current is disabled
  useEffect(() => {
    if (selectedMeal) {
      const currentOpt = MEAL_OPTIONS.find(o => o.value === selectedSlot);
      if (!currentOpt || currentOpt.isLogged || currentOpt.isPlanned) {
        const available = MEAL_OPTIONS.find(o => !o.isLogged && !o.isPlanned);
        if (available) setSelectedSlot(available.value);
      }
    }
  }, [MEAL_OPTIONS, selectedMeal, selectedSlot]);

  // ═══════════════════════════════════════════════════════════
  //  CATEGORY BROWSER HELPERS
  // ═══════════════════════════════════════════════════════════

  const browsedIngredients = useMemo(() => {
    if (!browserCategory) return [];
    return allIngredients
      .filter(ing => ing.category === browserCategory);
  }, [browserCategory]);

  const handleBrowseAdd = (ingredient) => {
    if (browserTarget === 'main') {
      addToMain(ingredient);
    } else {
      addToSide(ingredient);
    }
  };

  // ═══════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="my-meals-container">
      {showSaveToast && (
        <div className="save-toast">
          <span className="material-symbols-outlined">check_circle</span>
          Meal saved to My Meals!
        </div>
      )}
      {/* ─── TAB HEADER ─────────────────────────────────────── */}
      <div className="my-meals-header">
        <div className="my-meals-title">
          <h1>{activeTab === 'builder' ? 'Meal Builder' : 'My Meals'}</h1>
          <div className="my-meals-subtitle">
            {activeTab === 'builder'
              ? 'Build & auto-balance your perfect meal'
              : 'Your saved custom recipes'
            }
          </div>
        </div>
        <div className="tab-switcher">
          <button
            className={`tab-btn ${activeTab === 'builder' ? 'active' : ''}`}
            onClick={() => setActiveTab('builder')}
          >
            <span className="material-symbols-outlined">science</span>
            Meal Builder
          </button>
          <button
            className={`tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            <span className="material-symbols-outlined">bookmark</span>
            Saved Meals
            {savedMeals.length > 0 && (
              <span className="tab-count">{savedMeals.length}</span>
            )}
          </button>
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════ */}
      {/*  TAB 1: MEAL BUILDER                                 */}
      {/* ═════════════════════════════════════════════════════ */}
      {activeTab === 'builder' && (
        <div className="builder-content">
          {/* ─── TARGET INPUTS ────────────────────────────── */}
          <div className="target-bar">
            <div className="target-bar-header-row">
              <div className="target-bar-title">
                <span className="material-symbols-outlined">track_changes</span>
                Target Macros
              </div>
              <div className="target-slot-selector">
                <select
                  value={builderSlot}
                  onChange={handleBuilderSlotChange}
                  className="builder-slot-select"
                >
                  <option value="" disabled>Select a Meal Slot...</option>
                  {MEAL_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — {Math.round(opt.calories)} kcal ({Math.round(opt.macros.pro)}P, {Math.round(opt.macros.carb)}C, {Math.round(opt.macros.fat)}F)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="target-inputs">
              <div className="target-input-group cal">
                <label>Calories</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    value={targetCal}
                    onChange={e => setTargetCal(Math.max(0, parseFloat(e.target.value) || 0))}
                    min="0"
                  />
                  <span className="unit-label">kcal</span>
                </div>
              </div>
              <div className="target-input-group pro">
                <label>Protein</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    value={targetPro}
                    onChange={e => setTargetPro(Math.max(0, parseFloat(e.target.value) || 0))}
                    min="0"
                  />
                  <span className="unit-label">g</span>
                </div>
              </div>
              <div className="target-input-group carb">
                <label>Carbs</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    value={targetCarb}
                    onChange={e => setTargetCarb(Math.max(0, parseFloat(e.target.value) || 0))}
                    min="0"
                  />
                  <span className="unit-label">g</span>
                </div>
              </div>
              <div className="target-input-group fat">
                <label>Fat</label>
                <div className="input-with-unit">
                  <input
                    type="number"
                    value={targetFat}
                    onChange={e => setTargetFat(Math.max(0, parseFloat(e.target.value) || 0))}
                    min="0"
                  />
                  <span className="unit-label">g</span>
                </div>
              </div>
            </div>
          </div>

          {/* ─── INGREDIENT COMPOSER ─────────────────────── */}
          <div className="composer-grid">
            {!builderSlot && (
              <div className="composer-lock-overlay" onClick={() => {
                const select = document.querySelector('.builder-slot-select');
                if (select) {
                  select.focus();
                  // Optional: highlight it briefly
                  select.style.boxShadow = '0 0 0 4px rgba(201, 168, 76, 0.3)';
                  setTimeout(() => select.style.boxShadow = '', 500);
                }
              }}>
                <span className="material-symbols-outlined lock-icon">arrow_upward</span>
                <span className="lock-text">Select a Meal Slot to unlock the builder</span>
                <span className="lock-subtext">Choose a slot from the dropdown above to start adding ingredients.</span>
              </div>
            )}
            {/* MAIN PART */}
            <div className="composer-section main-section">
              <div className="section-header">
                <div className="section-title-row">
                  <span className="section-icon">🥩</span>
                  <h3>Main Part</h3>
                  <span className="section-badge">{mainIngredients.length > 1 ? 'Multi' : mainIngredients.length === 1 ? '1 item' : 'Empty'}</span>
                </div>
                <p className="section-hint">The primary nutritional base — can contain one or multiple ingredients</p>
              </div>

              {/* Search Bar */}
              <div className="ingredient-search-wrapper">
                <div className="search-input-row">
                  <span className="material-symbols-outlined search-icon">search</span>
                  <input
                    type="text"
                    placeholder="Search ingredients..."
                    value={mainSearch}
                    onChange={e => { setMainSearch(e.target.value); setShowMainDropdown(true); }}
                    onFocus={() => setShowMainDropdown(true)}
                    onBlur={() => setTimeout(() => setShowMainDropdown(false), 200)}
                  />
                  <button
                    className="browse-btn"
                    title="Browse categories"
                    onClick={() => {
                      setBrowserTarget('main');
                      setBrowserCategory(null);
                      setShowCategoryBrowser(true);
                    }}
                  >
                    <span className="material-symbols-outlined">category</span>
                  </button>
                </div>

                {showMainDropdown && mainSearchResults.length > 0 && (
                  <div className="search-dropdown">
                    {mainSearchResults.slice(0, 8).map(ing => (
                      <div key={ing.id} className={`search-dropdown-item ${mainIngredients.some(i => i.id === ing.id) ? 'selected' : ''}`} onMouseDown={(e) => { e.preventDefault(); addToMain(ing); }}>
                        <span className="dropdown-name">
                          {mainIngredients.some(i => i.id === ing.id) && <span className="material-symbols-outlined" style={{fontSize: '16px', marginRight: '6px', color: 'var(--color-primary)'}}>check_circle</span>}
                          {ing.name}
                        </span>
                        <span className="dropdown-meta">{ing.calories} cal/{ing.unit === 'piece' ? 'pc' : '100' + (ing.unit === '100ml' ? 'ml' : 'g')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Main Ingredients */}
              <div className="selected-ingredients">
                {mainIngredients.length === 0 && (
                  <div className="empty-slot">
                    <span className="material-symbols-outlined">add_circle_outline</span>
                    <span>Add at least one ingredient</span>
                  </div>
                )}
                {mainIngredients.map(ing => (
                  <div key={ing.id} className="ingredient-chip main-chip">
                    <div className="chip-info">
                      <span className="chip-name">{ing.name}</span>
                      <span className="chip-meta">
                        {ing.calories} cal · {ing.protein}g P · {ing.carbs}g C · {ing.fat}g F
                        <span className="chip-unit">/{ing.unit === 'piece' ? 'pc' : '100' + (ing.unit === '100ml' ? 'ml' : 'g')}</span>
                      </span>
                    </div>
                    <button className="chip-remove" onClick={() => removeFromMain(ing.id)}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SIDE PARTS */}
            <div className="composer-section side-section">
              <div className="section-header">
                <div className="section-title-row">
                  <span className="section-icon">🥗</span>
                  <h3>Side Parts</h3>
                  <span className="section-badge">{sideIngredients.length} {sideIngredients.length === 1 ? 'side' : 'sides'}</span>
                </div>
                <p className="section-hint">Each side contains strictly one ingredient — add as many sides as you want</p>
              </div>

              {/* Search Bar */}
              <div className="ingredient-search-wrapper">
                <div className="search-input-row">
                  <span className="material-symbols-outlined search-icon">search</span>
                  <input
                    type="text"
                    placeholder="Add a side ingredient..."
                    value={sideSearch}
                    onChange={e => { setSideSearch(e.target.value); setShowSideDropdown(true); }}
                    onFocus={() => setShowSideDropdown(true)}
                    onBlur={() => setTimeout(() => setShowSideDropdown(false), 200)}
                  />
                  <button
                    className="browse-btn"
                    title="Browse categories"
                    onClick={() => {
                      setBrowserTarget('side');
                      setBrowserCategory(null);
                      setShowCategoryBrowser(true);
                    }}
                  >
                    <span className="material-symbols-outlined">category</span>
                  </button>
                </div>

                {showSideDropdown && sideSearchResults.length > 0 && (
                  <div className="search-dropdown">
                    {sideSearchResults.slice(0, 8).map(ing => (
                      <div key={ing.id} className={`search-dropdown-item ${sideIngredients.some(i => i.id === ing.id) ? 'selected' : ''}`} onMouseDown={(e) => { e.preventDefault(); addToSide(ing); }}>
                        <span className="dropdown-name">
                          {sideIngredients.some(i => i.id === ing.id) && <span className="material-symbols-outlined" style={{fontSize: '16px', marginRight: '6px', color: 'var(--color-primary)'}}>check_circle</span>}
                          {ing.name}
                        </span>
                        <span className="dropdown-meta">{ing.calories} cal/{ing.unit === 'piece' ? 'pc' : '100' + (ing.unit === '100ml' ? 'ml' : 'g')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Side Ingredients */}
              <div className="selected-ingredients">
                {sideIngredients.length === 0 && (
                  <div className="empty-slot subtle">
                    <span className="material-symbols-outlined">restaurant</span>
                    <span>Optional — add sides like bread, veggies, etc.</span>
                  </div>
                )}
                {sideIngredients.map((ing, idx) => (
                  <div key={ing.id} className="ingredient-chip side-chip">
                    <div className="chip-info">
                      <span className="chip-side-label">Side {idx + 1}</span>
                      <span className="chip-name">{ing.name}</span>
                      <span className="chip-meta">
                        {ing.calories} cal · {ing.protein}g P · {ing.carbs}g C · {ing.fat}g F
                      </span>
                    </div>
                    <button className="chip-remove" onClick={() => removeFromSide(ing.id)}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── AUTO-BALANCE BUTTON ─────────────────────── */}
          <div className="balance-action-row">
            <button
              className="btn-auto-balance"
              onClick={handleAutoBalance}
              disabled={isOptimizing || mainIngredients.length === 0}
            >
              {isOptimizing ? (
                <>
                  <span className="material-symbols-outlined spinning">sync</span>
                  Optimizing...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">bolt</span>
                  Auto-Balance Meal
                </>
              )}
            </button>
            {mainIngredients.length === 0 && (
              <p className="balance-hint">Add at least one Main ingredient to start</p>
            )}
          </div>

          {/* ─── RESULTS PANEL ───────────────────────────── */}
          {result && (
            <div id="balance-results" className="results-panel slide-in-bottom">
              <div className="results-header">
                <div className="results-title-row">
                  <h3>
                    <span className="material-symbols-outlined">check_circle</span>
                    Optimized Meal
                  </h3>
                  <div className={`accuracy-badge ${result.accuracy >= 90 ? 'excellent' : result.accuracy >= 70 ? 'great' : result.accuracy >= 50 ? 'good' : 'poor'}`}>
                    {result.accuracy >= 90 ? '⭐' : result.accuracy >= 70 ? '✅' : result.accuracy >= 50 ? '👍' : '⚠️'}
                    {' '}{Math.round(result.accuracy)}% Match
                  </div>
                </div>
                {result.isSingleIngredient && (
                  <div className="single-ingredient-notice">
                    <span className="material-symbols-outlined">info</span>
                    Single ingredient detected — direct calculation applied (no optimization needed)
                  </div>
                )}
              </div>

              {/* Macro Comparison */}
              <div className="macro-comparison">
                <div className="macro-compare-row header-row">
                  <span className="macro-label-col"></span>
                  <span className="macro-target-col">Target</span>
                  <span className="macro-actual-col">Achieved</span>
                  <span className="macro-diff-col">Diff</span>
                </div>
                {[
                  { label: '🔥 Calories', target: targetCal, actual: result.totalCalories, unit: 'kcal', cls: 'cal' },
                  { label: '💪 Protein', target: targetPro, actual: result.totalProtein, unit: 'g', cls: 'pro' },
                  { label: '🍞 Carbs', target: targetCarb, actual: result.totalCarbs, unit: 'g', cls: 'carb' },
                  { label: '🥑 Fat', target: targetFat, actual: result.totalFat, unit: 'g', cls: 'fat' },
                ].map(row => {
                  const diff = row.actual - row.target;
                  const diffClass = Math.abs(diff) < (row.cls === 'cal' ? 15 : 3) ? 'diff-ok' :
                                    diff > 0 ? 'diff-over' : 'diff-under';
                  return (
                    <div key={row.cls} className={`macro-compare-row ${row.cls}`}>
                      <span className="macro-label-col">{row.label}</span>
                      <span className="macro-target-col">{Math.round(row.target)} {row.unit}</span>
                      <span className="macro-actual-col">{Math.round(row.actual)} {row.unit}</span>
                      <span className={`macro-diff-col ${diffClass}`}>
                        {diff >= 0 ? '+' : ''}{Math.round(diff)} {row.unit}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Macro Progress Bar */}
              <div className="macro-visual-bar">
                {(() => {
                  const total = result.totalProtein + result.totalCarbs + result.totalFat;
                  if (total === 0) return null;
                  const pPct = (result.totalProtein / total) * 100;
                  const cPct = (result.totalCarbs / total) * 100;
                  const fPct = (result.totalFat / total) * 100;
                  return (
                    <>
                      <div className="bar-segment pro" style={{ width: `${pPct}%` }} title={`Protein: ${Math.round(pPct)}%`}></div>
                      <div className="bar-segment carb" style={{ width: `${cPct}%` }} title={`Carbs: ${Math.round(cPct)}%`}></div>
                      <div className="bar-segment fat" style={{ width: `${fPct}%` }} title={`Fat: ${Math.round(fPct)}%`}></div>
                    </>
                  );
                })()}
              </div>
              <div className="bar-legend">
                <span className="legend-item pro">● Protein {Math.round(result.totalProtein)}g</span>
                <span className="legend-item carb">● Carbs {Math.round(result.totalCarbs)}g</span>
                <span className="legend-item fat">● Fat {Math.round(result.totalFat)}g</span>
              </div>

              {/* Ingredient Quantities */}
              <div className="quantities-section">
                {result.mainPart.length > 0 && (
                  <div className="quantities-group">
                    <h4><span className="section-icon">🥩</span> Main Part</h4>
                    {result.mainPart.map((part, i) => (
                      <div key={i} className={`quantity-row ${part.quantity === 0 ? 'zero-qty' : ''}`}>
                        <div className="qty-ingredient-name">{part.ingredient.name}</div>
                        <div className="qty-amount">
                          <span className="qty-value">{formatQuantity(part.ingredient, part.quantity)}</span>
                        </div>
                        <div className="qty-macros-mini">
                          <span className="mini-cal">{Math.round(part.macros.calories)} cal</span>
                          <span className="mini-pro">{part.macros.protein.toFixed(1)}g P</span>
                          <span className="mini-carb">{part.macros.carbs.toFixed(1)}g C</span>
                          <span className="mini-fat">{part.macros.fat.toFixed(1)}g F</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {result.sideParts.length > 0 && (
                  <div className="quantities-group">
                    <h4><span className="section-icon">🥗</span> Side Parts</h4>
                    {result.sideParts.map((part, i) => (
                      <div key={i} className={`quantity-row ${part.quantity === 0 ? 'zero-qty' : ''}`}>
                        <div className="qty-ingredient-name">
                          <span className="side-index">Side {i + 1}:</span> {part.ingredient.name}
                        </div>
                        <div className="qty-amount">
                          <span className="qty-value">{formatQuantity(part.ingredient, part.quantity)}</span>
                        </div>
                        <div className="qty-macros-mini">
                          <span className="mini-cal">{Math.round(part.macros.calories)} cal</span>
                          <span className="mini-pro">{part.macros.protein.toFixed(1)}g P</span>
                          <span className="mini-carb">{part.macros.carbs.toFixed(1)}g C</span>
                          <span className="mini-fat">{part.macros.fat.toFixed(1)}g F</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="results-actions">
                <button 
                  className="btn-save-meal" 
                  onClick={handleSaveAsCustomMeal}
                  disabled={hasSavedCurrentMeal}
                  style={{ opacity: hasSavedCurrentMeal ? 0.6 : 1, cursor: hasSavedCurrentMeal ? 'not-allowed' : 'pointer' }}
                >
                  <span className="material-symbols-outlined">
                    {hasSavedCurrentMeal ? 'done_all' : 'bookmark_add'}
                  </span>
                  {hasSavedCurrentMeal ? 'Saved!' : 'Save to My Meals'}
                </button>
                <button className="btn-log-meal" onClick={handleLogToTimeline}>
                  <span className="material-symbols-outlined">calendar_add_on</span>
                  Log to Timeline
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════ */}
      {/*  TAB 2: SAVED MEALS                                  */}
      {/* ═════════════════════════════════════════════════════ */}
      {activeTab === 'saved' && (
        <>
          <div className="saved-meals-content">
            {savedMeals.map((meal, index) => (
              <div key={index} className="meal-card" onClick={() => openSavedMealSidebar(meal)}>
                <button
                  className="delete-meal-btn"
                  onClick={(e) => handleDeleteCustomMeal(e, meal._id)}
                  title="Delete Custom Meal"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                </button>

                <div className="meal-card-visual">
                  <div className="meal-card-icon-wrapper">
                    <span className="material-symbols-outlined">restaurant</span>
                  </div>
                  <h3 className="meal-name">{meal.name}</h3>
                </div>

                <div className="meal-info">
                  <div className="meal-macros">
                    <span className="macro-pill cal">🔥 {Math.round(meal.calories)} kcal</span>
                    <span className="macro-pill pro">💪 {Math.round(meal.protein)}g P</span>
                    <span className="macro-pill carb">🍞 {Math.round(meal.carbs)}g C</span>
                    <span className="macro-pill fat">🥑 {Math.round(meal.fat)}g F</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ═════════════════════════════════════════════════════ */}
      {/*  CATEGORY BROWSER MODAL                              */}
      {/* ═════════════════════════════════════════════════════ */}
      {showCategoryBrowser && (
        <div className="modal-overlay" onClick={() => setShowCategoryBrowser(false)}>
          <div className="category-browser-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {browserCategory
                  ? <>
                      <button className="modal-back-btn" onClick={() => setBrowserCategory(null)}>
                        <span className="material-symbols-outlined">arrow_back</span>
                      </button>
                      {CATEGORIES.find(c => c.key === browserCategory)?.icon}{' '}
                      {CATEGORIES.find(c => c.key === browserCategory)?.label}
                    </>
                  : 'Browse Ingredients'
                }
              </h3>
              <button className="modal-close-btn" onClick={() => setShowCategoryBrowser(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="modal-body">
              {!browserCategory ? (
                <div className="category-grid">
                  {CATEGORIES.map(cat => {
                    const count = allIngredients.filter(ing => ing.category === cat.key).length;
                    return (
                      <div
                        key={cat.key}
                        className="category-tile"
                        onClick={() => setBrowserCategory(cat.key)}
                      >
                        <span className="cat-icon material-symbols-outlined">{cat.icon}</span>
                        <span className="cat-name">{cat.label}</span>
                        <span className="cat-count">{count} items</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="browse-ingredients-list">
                  {browsedIngredients.length === 0 ? (
                    <div className="empty-browse">All ingredients from this category are already added.</div>
                  ) : (
                    browsedIngredients.map(ing => {
                      const isSelected = browserTarget === 'main' ? mainIngredients.some(i => i.id === ing.id) : sideIngredients.some(i => i.id === ing.id);
                      return (
                        <div
                          key={ing.id}
                          className={`browse-ingredient-row ${isSelected ? 'selected' : ''}`}
                          onClick={() => browserTarget === 'main' ? addToMain(ing) : addToSide(ing)}
                          style={{ cursor: 'pointer', opacity: (allSelectedIds.has(ing.id) && !isSelected) ? 0.5 : 1 }}
                        >
                          <div className="browse-ing-info">
                            <span className="browse-ing-name">{ing.name}</span>
                            <span className="browse-ing-meta">
                              {ing.calories} cal · P: {ing.protein}g · C: {ing.carbs}g · F: {ing.fat}g
                              {' '}/ {ing.unit === 'piece' ? 'piece' : ing.unit}
                            </span>
                          </div>
                          {isSelected ? (
                            <span className="material-symbols-outlined browse-add-icon" style={{color: 'var(--color-primary)'}}>check_circle</span>
                          ) : (
                            <span className="material-symbols-outlined browse-add-icon">add_circle</span>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════ */}
      {/*  TIMELINE SIDEBAR (Builder Results)                  */}
      {/* ═════════════════════════════════════════════════════ */}
      <div className={`my-meals-sidebar ${showTimelineSidebar ? 'open' : ''}`}>
        {showTimelineSidebar && result && (
          <>
            <div className="sidebar-header">
              <h2>Log to Timeline</h2>
              <button className="close-btn" onClick={() => setShowTimelineSidebar(false)}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="sidebar-content">
              <div className="sidebar-meal-title">
                {[...result.mainPart, ...result.sideParts]
                  .filter(p => p.quantity > 0)
                  .map(p => p.ingredient.name.split(' (')[0])
                  .join(' + ')}
              </div>

              <div className="sidebar-macros" style={{ display: 'flex', gap: '8px', fontSize: '12px', fontWeight: '700', flexWrap: 'wrap', marginBottom: '24px' }}>
                <span style={{ background: 'var(--macro-cal-bg)', color: 'var(--macro-cal)', padding: '4px 8px', borderRadius: '4px' }}>🔥 {Math.round(result.totalCalories)} kcal</span>
                <span style={{ background: 'var(--macro-pro-bg)', color: 'var(--macro-pro)', padding: '4px 8px', borderRadius: '4px' }}>💪 {Math.round(result.totalProtein)}g P</span>
                <span style={{ background: 'var(--macro-carb-bg)', color: 'var(--macro-carb)', padding: '4px 8px', borderRadius: '4px' }}>🍞 {Math.round(result.totalCarbs)}g C</span>
                <span style={{ background: 'var(--macro-fat-bg)', color: 'var(--macro-fat)', padding: '4px 8px', borderRadius: '4px' }}>🥑 {Math.round(result.totalFat)}g F</span>
              </div>

              <div className="sidebar-section">
                <label>Date</label>
                <input
                  type="date"
                  value={timelineDate}
                  min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                  onChange={e => setTimelineDate(e.target.value)}
                />
              </div>

              <div className="sidebar-section">
                <label>Meal Slot</label>
                <select
                  value={timelineSlot}
                  onChange={e => setTimelineSlot(e.target.value)}
                >
                  {MEAL_OPTIONS.map(opt => {
                    let label = opt.label;
                    if (opt.isLogged) label += ' (Logged)';
                    else if (opt.isPlanned) label += ' (Planned)';

                    return (
                      <option
                        key={opt.value}
                        value={opt.value}
                        disabled={opt.isLogged || opt.isPlanned}
                      >
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                className="add-btn"
                onClick={confirmLogToTimeline}
                disabled={MEAL_OPTIONS.find(o => o.value === timelineSlot)?.isLogged || MEAL_OPTIONS.find(o => o.value === timelineSlot)?.isPlanned}
                style={{
                  opacity: (MEAL_OPTIONS.find(o => o.value === timelineSlot)?.isLogged || MEAL_OPTIONS.find(o => o.value === timelineSlot)?.isPlanned) ? 0.5 : 1,
                  cursor: (MEAL_OPTIONS.find(o => o.value === timelineSlot)?.isLogged || MEAL_OPTIONS.find(o => o.value === timelineSlot)?.isPlanned) ? 'not-allowed' : 'pointer'
                }}
              >
                Log to Timeline
              </button>
            </div>
          </>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════ */}
      {/*  SAVED MEAL SIDEBAR (Add to Timeline)                */}
      {/* ═════════════════════════════════════════════════════ */}
      <div className={`my-meals-sidebar ${selectedMeal ? 'open' : ''}`}>
        {selectedMeal && (
          <>
            <div className="sidebar-header">
              <h2>Add to Timeline</h2>
              <button className="close-btn" onClick={closeSavedMealSidebar}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="sidebar-content">
              <div className="sidebar-meal-title">{selectedMeal.name}</div>

              <div className="sidebar-macros" style={{ display: 'flex', gap: '8px', fontSize: '12px', fontWeight: '700', flexWrap: 'wrap', marginBottom: '24px' }}>
                <span style={{ background: 'var(--macro-cal-bg)', color: 'var(--macro-cal)', padding: '4px 8px', borderRadius: '4px' }}>🔥 {Math.round(selectedMeal.calories)} kcal</span>
                <span style={{ background: 'var(--macro-pro-bg)', color: 'var(--macro-pro)', padding: '4px 8px', borderRadius: '4px' }}>💪 {Math.round(selectedMeal.protein)}g P</span>
                <span style={{ background: 'var(--macro-carb-bg)', color: 'var(--macro-carb)', padding: '4px 8px', borderRadius: '4px' }}>🍞 {Math.round(selectedMeal.carbs)}g C</span>
                <span style={{ background: 'var(--macro-fat-bg)', color: 'var(--macro-fat)', padding: '4px 8px', borderRadius: '4px' }}>🥑 {Math.round(selectedMeal.fat)}g F</span>
              </div>

              <div className="sidebar-section">
                <label>Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                  onChange={e => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="sidebar-section">
                <label>Meal Slot</label>
                <select
                  value={selectedSlot}
                  onChange={e => setSelectedSlot(e.target.value)}
                >
                  {MEAL_OPTIONS.map(opt => {
                    let label = opt.label;
                    if (opt.isLogged) label += ' (Logged)';
                    else if (opt.isPlanned) label += ' (Planned)';

                    return (
                      <option
                        key={opt.value}
                        value={opt.value}
                        disabled={opt.isLogged || opt.isPlanned}
                      >
                        {label}
                      </option>
                    );
                  })}
                </select>
                {MEAL_OPTIONS.find(o => o.value === selectedSlot)?.isLogged && (
                  <p style={{ fontSize: '12px', color: 'var(--color-primary)', marginTop: '8px' }}>
                    This slot is already logged. You cannot overwrite a logged meal.
                  </p>
                )}
                {MEAL_OPTIONS.find(o => o.value === selectedSlot)?.isPlanned && (
                  <p style={{ fontSize: '12px', color: 'var(--color-primary)', marginTop: '8px' }}>
                    This slot is already planned. Choose another slot.
                  </p>
                )}
              </div>

              <button
                className="add-btn"
                onClick={handleAddSavedMealToTimeline}
                disabled={MEAL_OPTIONS.find(o => o.value === selectedSlot)?.isLogged || MEAL_OPTIONS.find(o => o.value === selectedSlot)?.isPlanned}
                style={{
                  opacity: (MEAL_OPTIONS.find(o => o.value === selectedSlot)?.isLogged || MEAL_OPTIONS.find(o => o.value === selectedSlot)?.isPlanned) ? 0.5 : 1,
                  cursor: (MEAL_OPTIONS.find(o => o.value === selectedSlot)?.isLogged || MEAL_OPTIONS.find(o => o.value === selectedSlot)?.isPlanned) ? 'not-allowed' : 'pointer'
                }}
              >
                Add to Timeline
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyMealsPage;
