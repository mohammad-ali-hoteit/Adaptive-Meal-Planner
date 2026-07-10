import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import maleSilhouette from '../assets/silhouette_male.png';
import femaleSilhouette from '../assets/silhouette_female.png';
import heightSilhouette from '../assets/silhouette_height.png';
import neckWaistSilhouette from '../assets/silhouette_neck_waist.png';
import {
  navyBodyFatMale, navyBodyFatFemale, heymsfieldMuscleMale, heymsfieldMuscleFemale,
  fatNormsByAge, smmiNormsByAge, getAgeGroup, getFatStatus, getMuscleStatus,
  calculateTargetWeight, calculateTargetCalories, calculateMacronutrients, determineGoalStrategy,
  STRATEGY_GOALS, ACTIVITY_MULTIPLIERS, getAllowedFatTargets, getAllowedMuscleTargets, smmiToKg
} from '../utils/calculations';
import './OnboardingPage.css';

/* =====================================================
   ONBOARDING — 7-step wizard
   ===================================================== */

const TOTAL_STEPS = 7;

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFullLoader, setShowFullLoader] = useState(false);

  const [formData, setFormData] = useState(() => {
    const m = user?.metrics || {};
    return {
      age:         m.age || 25,
      gender:      m.gender || '',        // 'male' | 'female'
      weight:      m.weight || '',        // kg
      targetWeight:m.targetWeight || '',  // kg (new)
      worksOut:    m.activityLevel === 'heavy' || false,     // gym checkbox
      height:      m.height || '',        // cm
      neck:        m.neck || '',          // cm
      waist:       m.waist || '',         // cm
      wakeTime:    user?.schedule?.wakeTime || '07:00',
      sleepTime:   user?.schedule?.sleepTime || '23:00',
      busyPeriods: user?.schedule?.busyPeriods || [],        // [{ label, startTime, endTime }]
      planDuration: 30,
      startDate:   new Date().toISOString().split('T')[0],
      targetFatPercent: m.targetFatPercent || '',
      targetSMM: m.targetSMM || '',
      targetFatCategory: '',
      targetMuscleCategory: '',
      activityLevel: m.activityLevel || 'light',
      lossRate: 0.5,
      _calculatedBF: 0,
      _calculatedSMM: 0
    };
  });

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const goNext = () => {
    setError('');
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setError('');
    setStep(s => Math.max(s - 1, 1));
  };

  const handleComplete = async () => {
    setLoading(true);
    setError('');
    setShowFullLoader(true);

    // Fake 3-second luxury loading
    setTimeout(async () => {
      try {
        await API.post('/onboarding', formData);
        await refreshUser();
        navigate('/dashboard', { state: { autoOpenSchedule: true } });
      } catch (err) {
        // Navigate to dashboard regardless for now (backend may not be ready)
        navigate('/dashboard', { state: { autoOpenSchedule: true } });
      }
    }, 3000);
  };

  if (showFullLoader) {
    return (
      <div className="onb-page onb-full-loader-page">
        <div className="onb-luxury-loader">
          <div className="onb-luxury-spinner"></div>
          <h2 className="onb-loader-title">Crafting Your Plan...</h2>
          <p className="onb-loader-sub">Analyzing your biometrics and building your adaptive schedule.</p>
        </div>
      </div>
    );
  }

  const progressPct = ((step - 1) / TOTAL_STEPS) * 100;

  return (
    <div className="onb-page">
      <div className="onb-wizard-container">
        {/* Progress bar */}
        <div className="onb-progress-bar-bg">
          <div className="onb-progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>

        {/* Step label */}
        <div className="onb-step-label">STEP {step} OF {TOTAL_STEPS}</div>

        {/* Step content */}
        <div className="onb-card">
          {step === 1 && <StepAge formData={formData} update={update} />}
          {step === 2 && <StepGender formData={formData} update={update} />}
          {step === 3 && <StepWeight formData={formData} update={update} />}
          {step === 4 && <StepHeight formData={formData} update={update} />}
          {step === 5 && <StepNeckWaist formData={formData} update={update} />}
          {step === 6 && <StepResults formData={formData} update={update} />}
          {step === 7 && <StepGoal formData={formData} update={update} />}

          {error && <div className="onb-error" role="alert">{error}</div>}

          {/* Navigation */}
          <div className="onb-nav">
            {step > 1 && (
              <button className="onb-back-btn" onClick={goBack} type="button">
                ← Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < TOTAL_STEPS ? (
              <button className="onb-continue-btn" onClick={goNext} type="button" id={`onb-continue-step-${step}`}>
                Continue →
              </button>
            ) : (
              <button
                className="onb-continue-btn"
                onClick={handleComplete}
                disabled={loading}
                type="button"
                id="onb-complete-btn"
              >
                {loading ? <span className="onb-spinner" /> : 'Complete Setup ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   STEP 1 — Age
   ===================================================== */
const StepAge = ({ formData, update }) => {
  const currentAge = Number(formData.age) || 25;

  const ageBrackets = [
    { label: 'Young Adults', range: '18–24', min: 18, max: 24 },
    { label: 'Early Adults', range: '25–34', min: 25, max: 34 },
    { label: 'Adults',       range: '35–44', min: 35, max: 44 },
    { label: 'Middle-Aged',  range: '45–54', min: 45, max: 54 },
    { label: 'Older Adults', range: '55–64', min: 55, max: 64 },
    { label: 'Seniors',      range: '65+',   min: 65, max: 120 },
  ];

  const handleUp = () => {
    if (currentAge < 120) update('age', currentAge + 1);
  };
  const handleDown = () => {
    if (currentAge > 18) update('age', currentAge - 1);
  };

  return (
    <div className="onb-step-inner">
      <h2 className="onb-step-title">How old are you?</h2>
      <p className="onb-step-desc">Your age helps us fine-tune your caloric limits.</p>
      
      <div className="onb-age-cards-grid">
        {ageBrackets.map(b => {
          const isActive = currentAge >= b.min && currentAge <= b.max;
          return (
            <div 
              key={b.label}
              className={`onb-age-card ${isActive ? 'active' : ''}`}
              onClick={() => update('age', b.min)}
            >
              <div className="onb-age-card-title">{b.label}</div>
              <div className="onb-age-card-range">{b.range}</div>
            </div>
          );
        })}
      </div>

      <div className="onb-age-counter-box">
        <div className="onb-age-counter-display">
          <span className="onb-age-counter-number">{currentAge}</span>
          <span className="onb-age-counter-label">years old</span>
        </div>
        <div className="onb-age-counter-controls">
          <button type="button" className="onb-age-btn-arrow" onClick={handleUp} aria-label="Increase age">
            <svg viewBox="0 0 24 24"><path d="M12 8l-6 6h12z"/></svg>
          </button>
          <button type="button" className="onb-age-btn-arrow" onClick={handleDown} aria-label="Decrease age">
            <svg viewBox="0 0 24 24"><path d="M12 16l6-6H6z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   STEP 2 — Gender
   ===================================================== */
const StepGender = ({ formData, update }) => (
  <div className="onb-step-inner">
    <div className="onb-icon-circle">⚧</div>
    <h2 className="onb-step-title">What is your gender?</h2>
    <p className="onb-step-desc">Used to calculate accurate body fat percentage estimates.</p>
    <div className="onb-gender-cards">
      {[
        { value: 'male',   label: 'Male',   img: maleSilhouette },
        { value: 'female', label: 'Female', img: femaleSilhouette },
      ].map((g) => (
        <button
          key={g.value}
          type="button"
          className={`onb-gender-card${formData.gender === g.value ? ' selected' : ''}`}
          onClick={() => update('gender', g.value)}
          id={`onb-gender-${g.value}`}
          aria-pressed={formData.gender === g.value}
        >
          <img src={g.img} alt={`${g.label} silhouette`} className="onb-gender-img" />
          <span className="onb-gender-label">{g.label}</span>
        </button>
      ))}
    </div>
  </div>
);

/* =====================================================
   STEP 3 — Weight
   ===================================================== */
const StepWeight = ({ formData, update }) => {
  const [unit, setUnit] = useState('kg');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  
  // Mouse drag state
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const updateTimeoutRef = useRef(null);

  const minKg = 30;
  const maxKg = 160;
  const ticksPerUnit = 10;
  const tickSpacing = 14;

  const currentWeightKg = parseFloat(formData.weight) || 70.0;

  const [localText, setLocalText] = useState(
    formData.weight 
      ? (unit === 'lbs' ? (parseFloat(formData.weight) * 2.20462).toFixed(1) : parseFloat(formData.weight).toFixed(1))
      : ''
  );

  useEffect(() => {
    if (scrollRef.current && document.activeElement !== inputRef.current) {
      const index = (currentWeightKg - minKg) * ticksPerUnit;
      scrollRef.current.scrollLeft = index * tickSpacing;
    }
  }, [unit]);

  const handleScroll = (e) => {
    if (document.activeElement === inputRef.current) return;
    
    const scrollLeft = e.target.scrollLeft;
    const targetTickIndex = Math.round(scrollLeft / tickSpacing);
    let calculatedKg = minKg + (targetTickIndex / ticksPerUnit);
    
    if (calculatedKg < minKg) calculatedKg = minKg;
    if (calculatedKg > maxKg) calculatedKg = maxKg;

    if (Math.abs(calculatedKg - currentWeightKg) > 0.05) {
      const displayVal = unit === 'lbs' 
        ? (calculatedKg * 2.20462).toFixed(1)
        : calculatedKg.toFixed(1);
      setLocalText(displayVal);
      
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => {
        update('weight', calculatedKg.toFixed(1));
      }, 100);
    }
  };

  // Mouse Drag Logic for Desktop Smoothing
  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - scrollRef.current.offsetLeft;
    scrollLeftStart.current = scrollRef.current.scrollLeft;
  };
  const handleMouseLeave = () => { isDragging.current = false; };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftStart.current - walk;
  };

  const handleInputChange = (e) => {
    setLocalText(e.target.value);
  };

  const handleInputBlur = () => {
    if (!localText) {
       update('weight', '');
       return;
    }
    const val = parseFloat(localText);
    if (!isNaN(val)) {
       let kgVal = unit === 'lbs' ? val / 2.20462 : val;
       update('weight', kgVal);
       
       if (scrollRef.current) {
          let clampedKg = kgVal;
          if (clampedKg < minKg) clampedKg = minKg;
          if (clampedKg > maxKg) clampedKg = maxKg;
          const index = (clampedKg - minKg) * ticksPerUnit;
          scrollRef.current.scrollLeft = index * tickSpacing;
       }
    } else {
       setLocalText('');
       update('weight', '');
    }
  };

  const handleInputFocus = () => {
    setLocalText('');
  };

  const handleUnitToggle = (u) => {
    if (localText && !isNaN(parseFloat(localText))) {
      const val = parseFloat(localText);
      if (unit === 'kg' && u === 'lbs') {
        setLocalText((val * 2.20462).toFixed(1));
      } else if (unit === 'lbs' && u === 'kg') {
        setLocalText((val / 2.20462).toFixed(1));
      }
    }
    setUnit(u);
  };

  // Memoize 1300 DOM nodes to prevent re-render lag!
  const memoizedTicks = useMemo(() => {
    let ticks = [];
    for (let i = minKg * ticksPerUnit; i <= maxKg * ticksPerUnit; i++) {
      const kgValue = i / ticksPerUnit;
      const isMajor = i % ticksPerUnit === 0;
      ticks.push(
        <div key={i} className={`onb-ruler-tick ${isMajor ? 'major' : ''}`}>
          {isMajor && (
            <div className="onb-ruler-tick-label">
              {unit === 'kg' ? kgValue : Math.round(kgValue * 2.20462)}
            </div>
          )}
        </div>
      );
    }
    return ticks;
  }, [unit]);

  return (
    <div className="onb-step-inner">
      <div className="onb-icon-circle">⚖️</div>
      <h2 className="onb-step-title">What's your current weight?</h2>
      <p className="onb-step-desc">This helps us calibrate your fitness plan.</p>
      
      <div className="onb-unit-toggle" style={{ margin: '20px auto 30px' }}>
        {['kg', 'lbs'].map((u) => (
          <button
            key={u}
            type="button"
            className={`onb-unit-pill${unit === u ? ' active' : ''}`}
            onClick={() => handleUnitToggle(u)}
          >
            {u}
          </button>
        ))}
      </div>

      <div className="onb-weight-input-container">
        <input
          ref={inputRef}
          type="number"
          className="onb-weight-large-input"
          value={localText}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          step="0.1"
          placeholder={unit === 'lbs' ? '154.0' : '70.0'}
        />
        <span className="onb-weight-unit-label">{unit}</span>
      </div>

      <div className="onb-ruler-wrapper">
        <div className="onb-ruler-center-indicator"></div>
        <div 
          className="onb-ruler-outer" 
          ref={scrollRef} 
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
        >
          <div className="onb-ruler-container">
            <div className="onb-ruler-spacer"></div>
            {memoizedTicks}
            <div className="onb-ruler-spacer"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   STEP 4 — Height (two-panel)
   ===================================================== */
const StepHeight = ({ formData, update }) => {
  const [unit, setUnit] = useState('cm');
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  
  const isDragging = useRef(false);
  const startY = useRef(0);
  const scrollTopStart = useRef(0);
  const updateTimeoutRef = useRef(null);

  const minCm = 100;
  const maxCm = 250;
  const ticksPerUnit = 1; 
  const tickSpacing = 15; 

  const currentHeightCm = parseFloat(formData.height) || 170;

  const formatFtIn = (cm) => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    if (inches === 12) return `${feet + 1}'0"`;
    return `${feet}'${inches}"`;
  };

  const [localText, setLocalText] = useState(
    formData.height 
      ? (unit === 'ft' ? formatFtIn(currentHeightCm) : currentHeightCm.toString())
      : ''
  );

  const silhouette = heightSilhouette;

  useEffect(() => {
    if (scrollRef.current && document.activeElement !== inputRef.current) {
      const index = maxCm - currentHeightCm;
      scrollRef.current.scrollTop = index * tickSpacing;
    }
  }, [unit]);

  const handleScroll = (e) => {
    if (document.activeElement === inputRef.current) return;
    
    const scrollTop = e.target.scrollTop;
    const targetIndex = Math.round(scrollTop / tickSpacing);
    let calculatedCm = maxCm - targetIndex;
    
    if (calculatedCm < minCm) calculatedCm = minCm;
    if (calculatedCm > maxCm) calculatedCm = maxCm;

    if (Math.abs(calculatedCm - currentHeightCm) > 0.05) {
      const displayVal = unit === 'ft' 
        ? formatFtIn(calculatedCm)
        : calculatedCm.toString();
      setLocalText(displayVal);
      
      if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
      updateTimeoutRef.current = setTimeout(() => {
        update('height', calculatedCm.toString());
      }, 100);
    }
  };

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startY.current = e.pageY;
    scrollTopStart.current = scrollRef.current.scrollTop;
  };
  const handleMouseLeave = () => { isDragging.current = false; };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const y = e.pageY;
    const walk = (y - startY.current) * 1.5;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollTopStart.current - walk;
    }
  };

  const handleInputChange = (e) => {
    setLocalText(e.target.value);
  };

  const handleInputBlur = () => {
    if (!localText) {
       update('height', '');
       return;
    }
    
    let cmVal = 170;
    if (unit === 'ft') {
       const match = localText.match(/(\d+)'?(\d*)"?/);
       if (match) {
         const ft = parseInt(match[1]) || 0;
         const inc = parseInt(match[2]) || 0;
         cmVal = Math.round((ft * 30.48) + (inc * 2.54));
       }
    } else {
       cmVal = parseFloat(localText);
    }

    if (!isNaN(cmVal)) {
       update('height', cmVal.toString());
       if (scrollRef.current) {
          let clampedCm = cmVal;
          if (clampedCm < minCm) clampedCm = minCm;
          if (clampedCm > maxCm) clampedCm = maxCm;
          const index = maxCm - clampedCm;
          scrollRef.current.scrollTop = index * tickSpacing;
       }
    } else {
       setLocalText('');
       update('height', '');
    }
  };

  const handleInputFocus = () => setLocalText('');

  const handleUnitToggle = (u) => {
    if (currentHeightCm) {
      if (u === 'ft') {
        setLocalText(formatFtIn(currentHeightCm));
      } else {
        setLocalText(currentHeightCm.toString());
      }
    }
    setUnit(u);
  };

  const memoizedTicks = useMemo(() => {
    let ticks = [];
    for (let i = maxCm; i >= minCm; i--) {
      const isMajor = i % 10 === 0;
      ticks.push(
        <div key={i} className={`onb-vruler-tick ${isMajor ? 'major' : ''}`}>
          {isMajor && <span className="onb-vruler-label">{i}</span>}
          <div className="onb-vruler-line" />
        </div>
      );
    }
    return ticks;
  }, []);

  return (
    <div className="onb-two-panel">
      {/* Left panel */}
      <div className="onb-height-left-panel">
        <div className="onb-height-model-container">
          <img src={silhouette} alt="Height reference silhouette" />
        </div>
        
        <div className="onb-vruler-container-wrapper">
          <div className="onb-vruler-pointer"></div>
          <div 
            className="onb-vruler-outer" 
            ref={scrollRef}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
          >
            <div className="onb-vruler-inner">
              {memoizedTicks}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="onb-two-panel-right">
        <div className="onb-icon-circle">📏</div>
        <h2 className="onb-step-title">Your Height</h2>
        <p className="onb-step-desc">This helps us personalize your fitness goals.</p>
        
        <div className="onb-unit-toggle" style={{ margin: '30px 0', alignSelf: 'flex-start' }}>
          {['cm', 'ft'].map((u) => (
            <button
              key={u}
              type="button"
              className={`onb-unit-pill${unit === u ? ' active' : ''}`}
              onClick={() => handleUnitToggle(u)}
            >
              {u}
            </button>
          ))}
        </div>

        <div className="onb-height-input-container" style={{ justifyContent: 'flex-start', margin: 0, paddingLeft: '25px' }}>
          <input
            ref={inputRef}
            type="text"
            className="onb-weight-large-input"
            value={localText}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={handleInputFocus}
            placeholder={unit === 'ft' ? "5'7\"" : '170'}
            style={{ width: '120px', textAlign: 'left', fontSize: '44px' }}
          />
          <span className="onb-weight-unit-label" style={{ paddingBottom: '6px' }}>{unit}</span>
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   STEP 5 — Neck & Waist (two-panel)
   ===================================================== */
const StepNeckWaist = ({ formData, update }) => {
  const silhouette = neckWaistSilhouette;
  
  return (
    <div className="onb-two-panel">
      {/* Left panel */}
      <div className="onb-two-panel-left" style={{ justifyContent: 'center' }}>
        <div className="onb-neck-waist-illustration">
          <img
            src={silhouette}
            alt="Body measurement reference"
            className="onb-nw-image"
          />
          
          {/* Custom Golden Overlay Markers */}
          <div className="onb-nw-marker" style={{ top: '33.7%' }}>
            <div className="onb-nw-dot" />
            <div className="onb-nw-line" />
            <span className="onb-nw-label">Neck</span>
          </div>

          <div className="onb-nw-marker" style={{ top: '42%' }}>
            <div className="onb-nw-dot" />
            <div className="onb-nw-line" />
            <span className="onb-nw-label">Waist</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="onb-two-panel-right">
        <div className="onb-icon-circle">📐</div>
        <h2 className="onb-step-title">Neck &amp; Waist</h2>
        <p className="onb-step-desc">Used to calculate body fat % with the Navy Method.</p>

        <div className="onb-two-fields">
          <div className="onb-field">
            <label className="onb-field-label" htmlFor="onb-neck">Neck circumference</label>
            <div className="onb-field-input-wrap">
              <input
                id="onb-neck"
                className="onb-input"
                type="number"
                min="20"
                max="60"
                step="0.1"
                value={formData.neck}
                onChange={(e) => update('neck', e.target.value)}
                placeholder="38"
              />
              <span className="onb-field-unit">cm</span>
            </div>
          </div>
          <div className="onb-field">
            <label className="onb-field-label" htmlFor="onb-waist">Waist circumference</label>
            <div className="onb-field-input-wrap">
              <input
                id="onb-waist"
                className="onb-input"
                type="number"
                min="40"
                max="200"
                step="0.1"
                value={formData.waist}
                onChange={(e) => update('waist', e.target.value)}
                placeholder="80"
              />
              <span className="onb-field-unit">cm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   STEP 6 — Results
   ===================================================== */
const StepResults = ({ formData }) => {
  const [bfOffset, setBfOffset] = useState(502);
  const [fatPtr, setFatPtr] = useState(0);
  const [smmiPtr, setSmmiPtr] = useState(0);

  const { gender, age, weight, height, neck, waist } = formData;
  const g = gender || 'male';
  const a = parseFloat(age) || 25;
  const w = parseFloat(weight) || 75;
  const h = parseFloat(height) || 180;
  const n = parseFloat(neck) || 38;
  const wa = parseFloat(waist) || 85;

  const ageGroup = getAgeGroup(a);
  const fNorms = fatNormsByAge[g][ageGroup];
  const mNorms = smmiNormsByAge[g][ageGroup];

  let bodyFat = 0;
  if (g === 'male') {
      bodyFat = navyBodyFatMale(h, wa, n);
  } else {
      // Approximation for female hip if not provided (waist * 1.1)
      const hip = wa * 1.1; 
      bodyFat = navyBodyFatFemale(h, wa, hip, n);
  }
  bodyFat = Math.max(2, Math.min(60, bodyFat));

  let sm = 0;
  if (g === 'male') {
      sm = heymsfieldMuscleMale(w, h, a, wa);
  } else {
      sm = heymsfieldMuscleFemale(w, h, a, wa);
  }
  sm = Math.max(10, Math.min(70, sm));
  
  const smPercent = (sm / w) * 100;
  const heightM = h / 100;
  const smmi = sm / (heightM * heightM);

  const fatStatus = getFatStatus(bodyFat, fNorms);
  const muscleStatus = getMuscleStatus(smmi, mNorms);

  const getFatDisplay = (status) => {
    switch(status) {
      case "very_low": return { title: "Very Low", color: "#3a86ff", ptr: 10 };
      case "low": return { title: "Athletic / Low", color: "#00d2ff", ptr: 30 };
      case "normal": return { title: "Healthy Normal", color: "#90ee02", ptr: 50 };
      case "high": return { title: "High Fat", color: "#ffaa00", ptr: 70 };
      case "very_high": return { title: "Very High Fat", color: "#ff3838", ptr: 90 };
      default: return { title: "Normal", color: "#90ee02", ptr: 50 };
    }
  };

  const getMuscleDisplay = (status) => {
    switch(status) {
      case "very_low": return { title: "Sarcopenic / Low", color: "#3a86ff", ptr: 10 };
      case "low": return { title: "Below Average", color: "#00d2ff", ptr: 30 };
      case "normal": return { title: "Healthy Muscle", color: "#90ee02", ptr: 50 };
      case "high": return { title: "High Muscularity", color: "#ffaa00", ptr: 70 };
      case "very_high": return { title: "Hypertrophic", color: "#ff3838", ptr: 90 };
      default: return { title: "Normal", color: "#90ee02", ptr: 50 };
    }
  };

  const fatInfo = getFatDisplay(fatStatus);
  const muscleInfo = getMuscleDisplay(muscleStatus);

  useEffect(() => {
    const circOffset = 502 - (Math.min(bodyFat, 50) / 50) * 502;
    setTimeout(() => {
      setBfOffset(circOffset);
      setFatPtr(fatInfo.ptr);
    }, 200);
    setTimeout(() => {
      setSmmiPtr(muscleInfo.ptr);
    }, 400);
  }, [bodyFat, fatInfo.ptr, muscleInfo.ptr]);

  // Update formData dynamically in parent (silently) so StepGoal can read it
  useEffect(() => {
    formData._calculatedBF = bodyFat;
    formData._calculatedSMM = sm;
  }, [bodyFat, sm, formData]);

  const diagnosticText = (muscleStatus === 'normal' || muscleStatus === 'high' || muscleStatus === 'very_high')
    ? `According to the Heymsfield Series 2 equation, your total skeletal muscle mass is ${sm.toFixed(1)} kg (SMMI = ${smmi.toFixed(1)} kg/m²). You possess an adequate and healthy muscle mass for your height and age group (${ageGroup} yrs).`
    : `According to the MRI NHANES model, your total skeletal muscle mass is ${sm.toFixed(1)} kg (SMMI = ${smmi.toFixed(1)} kg/m²). This indicates a muscle mass below the average for your age group (${ageGroup} yrs) and height. Resistance training is recommended.`;

  return (
    <div className="onb-step-inner onb-results-step">
      <div className="onb-header-section" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 className="onb-step-title" style={{ fontSize: '28px', marginBottom: '8px' }}>Body Composition Results</h2>
        <p className="onb-step-desc" style={{ fontSize: '13px' }}>Calculated via US Navy Equations & Heymsfield Series 2 (MRI Validated)</p>
      </div>

      <div className="onb-section-title">Body Fat Analysis</div>
      <div className="onb-result-card">
        <div className="onb-chart-wrapper">
          <div className="onb-chart-container">
            <svg className="onb-circular-progress" viewBox="0 0 180 180">
              <circle className="onb-bg-circle" cx="90" cy="90" r="80"></circle>
              <circle 
                className="onb-fg-circle" 
                cx="90" cy="90" r="80" 
                style={{ stroke: fatInfo.color, strokeDashoffset: bfOffset }}
              ></circle>
            </svg>
            <div className="onb-chart-text">
              <div className="onb-percentage">{bodyFat.toFixed(1)}%</div>
              <div className="onb-label">Body Fat</div>
            </div>
          </div>
          <div className="onb-status-summary">
            <span className="onb-status-badge" style={{ color: fatInfo.color, background: `${fatInfo.color}22` }}>
              {fatStatus.replace('_', ' ').toUpperCase()}
            </span>
            <div className="onb-status-main-val" style={{ color: fatInfo.color }}>{fatInfo.title}</div>
            <div className="onb-status-desc">Based on US Navy Model estimates.</div>
          </div>
        </div>
        <div className="onb-range-visualizer">
          <div className="onb-bar-wrapper">
            <div className="onb-bar-pointer" style={{ left: `${fatPtr}%` }}></div>
            <div className="onb-segments-bar">
              <div className="onb-segment onb-vl"></div>
              <div className="onb-segment onb-l"></div>
              <div className="onb-segment onb-n"></div>
              <div className="onb-segment onb-h"></div>
              <div className="onb-segment onb-vh"></div>
            </div>
          </div>
          <div className="onb-labels-grid">
            <div className={`onb-label-item ${fatStatus === 'very_low' ? 'active' : ''}`}>
              <div className="onb-label-name" style={{ color: '#3a86ff' }}>V.Low</div>
              <div className="onb-label-range">&lt;{fNorms.very_low.max}%</div>
            </div>
            <div className={`onb-label-item ${fatStatus === 'low' ? 'active' : ''}`}>
              <div className="onb-label-name" style={{ color: '#00d2ff' }}>Low</div>
              <div className="onb-label-range">{fNorms.low.min}-{fNorms.low.max}%</div>
            </div>
            <div className={`onb-label-item ${fatStatus === 'normal' ? 'active' : ''}`}>
              <div className="onb-label-name" style={{ color: '#90ee02' }}>Normal</div>
              <div className="onb-label-range">{fNorms.normal.min}-{fNorms.normal.max}%</div>
            </div>
            <div className={`onb-label-item ${fatStatus === 'high' ? 'active' : ''}`}>
              <div className="onb-label-name" style={{ color: '#ffaa00' }}>High</div>
              <div className="onb-label-range">{fNorms.high.min}-{fNorms.high.max}%</div>
            </div>
            <div className={`onb-label-item ${fatStatus === 'very_high' ? 'active' : ''}`}>
              <div className="onb-label-name" style={{ color: '#ff3838' }}>V.High</div>
              <div className="onb-label-range">&gt;{fNorms.very_high.min}%</div>
            </div>
          </div>
        </div>
      </div>

      <div className="onb-section-title">Skeletal Muscle Mass (SMM)</div>
      <div className="onb-metrics-grid">
        <div className="onb-metric-card">
          <div className="onb-metric-title">Total Muscle Mass (SM)</div>
          <div className="onb-metric-value">{sm.toFixed(1)} <span style={{fontSize: '16px'}}>kg</span></div>
          <div className="onb-metric-sub">{smPercent.toFixed(1)}% of Total Weight</div>
        </div>
        <div className="onb-metric-card">
          <div className="onb-metric-title">SMM Index (SMMI)</div>
          <div className="onb-metric-value">{smmi.toFixed(1)} <span style={{fontSize: '14px'}}>kg/m²</span></div>
          <div className="onb-metric-sub" style={{ color: muscleInfo.color }}>{muscleInfo.title}</div>
        </div>
      </div>

      <div className="onb-result-card" style={{ padding: '20px' }}>
        <div className="onb-range-visualizer" style={{ marginTop: '5px' }}>
          <div className="onb-bar-wrapper">
            <div className="onb-bar-pointer" style={{ left: `${smmiPtr}%` }}></div>
            <div className="onb-segments-bar">
              <div className="onb-segment onb-vl"></div>
              <div className="onb-segment onb-l"></div>
              <div className="onb-segment onb-n"></div>
              <div className="onb-segment onb-h"></div>
              <div className="onb-segment onb-vh"></div>
            </div>
          </div>
          <div className="onb-labels-grid">
            <div className={`onb-label-item ${muscleStatus === 'very_low' ? 'active' : ''}`}>
              <div className="onb-label-name" style={{ color: '#3a86ff' }}>V.Low</div>
              <div className="onb-label-range">&lt;{mNorms.very_low.max}</div>
            </div>
            <div className={`onb-label-item ${muscleStatus === 'low' ? 'active' : ''}`}>
              <div className="onb-label-name" style={{ color: '#00d2ff' }}>Low</div>
              <div className="onb-label-range">{mNorms.low.min}-{mNorms.low.max}</div>
            </div>
            <div className={`onb-label-item ${muscleStatus === 'normal' ? 'active' : ''}`}>
              <div className="onb-label-name" style={{ color: '#90ee02' }}>Normal</div>
              <div className="onb-label-range">{mNorms.normal.min}-{mNorms.normal.max}</div>
            </div>
            <div className={`onb-label-item ${muscleStatus === 'high' ? 'active' : ''}`}>
              <div className="onb-label-name" style={{ color: '#ffaa00' }}>High</div>
              <div className="onb-label-range">{mNorms.high.min}-{mNorms.high.max}</div>
            </div>
            <div className={`onb-label-item ${muscleStatus === 'very_high' ? 'active' : ''}`}>
              <div className="onb-label-name" style={{ color: '#ff3838' }}>V.High</div>
              <div className="onb-label-range">&gt;{mNorms.very_high.min}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="onb-muscle-insight-box">
        <div className="onb-muscle-insight-title">💪 Biological Muscle Diagnostic</div>
        <div className="onb-muscle-insight-text">{diagnosticText}</div>
      </div>
    </div>
  );
};

/* =====================================================
   STEP 7 — Goal Configuration
   ===================================================== */
const StepGoal = ({ formData, update }) => {
  const currentBf = formData._calculatedBF || 20;
  const currentSmm = formData._calculatedSMM || 30;
  const weight = parseFloat(formData.weight) || 75;
  const height = parseFloat(formData.height) || 180;
  const age = parseFloat(formData.age) || 25;
  const gender = formData.gender || 'male';

  const ageGroup = getAgeGroup(age);
  const fNorms = fatNormsByAge[gender][ageGroup];
  const mNorms = smmiNormsByAge[gender][ageGroup];

  const heightM = height / 100;
  const currentSmmi = currentSmm / (heightM * heightM);
  const currentMuscleStatus = getMuscleStatus(currentSmmi, mNorms);

  const allowedFatTargets = getAllowedFatTargets(fNorms);
  const allowedMuscleTargets = getAllowedMuscleTargets(currentMuscleStatus, mNorms);

  // Initialize targets if empty
  useEffect(() => {
    if (!formData.targetFatCategory) update('targetFatCategory', 'normal');
    if (!formData.targetMuscleCategory) update('targetMuscleCategory', allowedMuscleTargets[0].id);
  }, []);

  const fatCategoryObj = allowedFatTargets.find(f => f.id === formData.targetFatCategory) || allowedFatTargets[1];
  const muscleCategoryObj = allowedMuscleTargets.find(m => m.id === formData.targetMuscleCategory) || allowedMuscleTargets[0];

  // Enforce bounds when category changes, prioritizing current body fat
  useEffect(() => {
    let tf = parseFloat(formData.targetFatPercent);
    if (!tf) tf = currentBf; // fallback to current if empty

    // Clamp to the chosen category's min and max
    if (tf < fatCategoryObj.min) tf = fatCategoryObj.min;
    else if (tf > fatCategoryObj.max) tf = fatCategoryObj.max;

    update('targetFatPercent', tf.toFixed(1));
  }, [formData.targetFatCategory, currentBf]);

  let dynamicMinKg = smmiToKg(muscleCategoryObj.min, height);
  if (muscleCategoryObj.id === currentMuscleStatus) {
    dynamicMinKg = Math.max(dynamicMinKg, currentSmm);
  }
  dynamicMinKg = Math.round(dynamicMinKg * 10) / 10;

  useEffect(() => {
    let maxKg = smmiToKg(muscleCategoryObj.max, height);
    maxKg = Math.round(maxKg * 10) / 10;
    const tm = parseFloat(formData.targetSMM);
    if (!tm || tm < dynamicMinKg) update('targetSMM', dynamicMinKg.toFixed(1));
    else if (tm > maxKg) update('targetSMM', maxKg.toFixed(1));
  }, [formData.targetMuscleCategory, dynamicMinKg]);

  const targetFat = parseFloat(formData.targetFatPercent) || fatCategoryObj.min;
  const targetMuscle = parseFloat(formData.targetSMM) || dynamicMinKg;
  const lossRate = parseFloat(formData.lossRate) || 0.5;
  const activity = formData.activityLevel || 'light';

  const bmr = gender === 'female'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5;
    
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activity]);

  // Deltas
  const fatDelta = targetFat - currentBf;
  const muscleDelta = targetMuscle - currentSmm;

  // Engine logic
  const strategy = determineGoalStrategy(fatDelta, muscleDelta);
  const currentLeanMass = weight * (1.0 - (currentBf / 100.0));
  const targetWeight = calculateTargetWeight(currentLeanMass, muscleDelta, targetFat);
  const dailyCalories = calculateTargetCalories(strategy, lossRate, tdee, bmr);
  const macros = calculateMacronutrients(dailyCalories, currentLeanMass, tdee);

  const getStrategyLabel = (strat) => {
    switch (strat) {
      case STRATEGY_GOALS.FAT_LOSS: return "Aggressive Fat Loss";
      case STRATEGY_GOALS.BODY_RECOMPOSITION: return "Body Recomposition";
      case STRATEGY_GOALS.CONTROLLED_BULK: return "Controlled Bulk";
      default: return "Maintenance";
    }
  };

  const getStrategyColor = (strat) => {
    switch (strat) {
      case STRATEGY_GOALS.FAT_LOSS: return "#ffaa00";
      case STRATEGY_GOALS.BODY_RECOMPOSITION: return "#90ee02";
      case STRATEGY_GOALS.CONTROLLED_BULK: return "#3a86ff";
      default: return "#8B7355"; // Primary
    }
  };

  return (
    <div className="onb-step-inner onb-goal-step">
      <div className="onb-header-section" style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 className="onb-step-title" style={{ fontSize: '28px', marginBottom: '8px' }}>Target Configuration</h2>
        <p className="onb-step-desc">Scientifically constrained targets based on your current body composition.</p>
      </div>
      
      <div className="onb-field" style={{ marginBottom: '24px' }}>
        <label className="onb-field-label">Activity Level (for TDEE)</label>
        <select 
          className="onb-input" 
          value={formData.activityLevel} 
          onChange={(e) => update('activityLevel', e.target.value)}
        >
          <option value="sedentary">Sedentary (Little or no exercise)</option>
          <option value="light">Lightly Active (Light exercise 1-3 days/week)</option>
          <option value="moderate">Moderately Active (Moderate exercise 3-5 days/week)</option>
          <option value="active">Very Active (Hard exercise 6-7 days/week)</option>
        </select>
      </div>

      <div className="onb-goal-inputs-grid">
        <div className="onb-goal-input-card">
          <label className="onb-field-label" style={{ marginBottom: '12px', display: 'block' }}>Target Body Fat</label>
          
          <div className="onb-radio-group" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {allowedFatTargets.map(c => (
              <label key={c.id} style={{ flex: 1, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="radio" 
                  name="fatCategory" 
                  value={c.id} 
                  checked={formData.targetFatCategory === c.id} 
                  onChange={(e) => update('targetFatCategory', e.target.value)} 
                />
                {c.label}
              </label>
            ))}
          </div>

          <div className="onb-field-input-wrap">
            <input 
              type="number" 
              className="onb-input" 
              value={formData.targetFatPercent} 
              onChange={(e) => update('targetFatPercent', e.target.value)}
              step="0.1" 
              min={fatCategoryObj.min} 
              max={fatCategoryObj.max}
            />
            <span className="onb-field-unit">%</span>
          </div>
          <div style={{ fontSize: '11px', color: '#8A92A6', marginTop: '4px' }}>
            Range: {fatCategoryObj.min}% - {fatCategoryObj.max}%
          </div>
          <div className="onb-input-diff" style={{ color: fatDelta < 0 ? '#4AADA8' : '#D9534F', marginTop: '8px' }}>
            {fatDelta > 0 ? '+' : ''}{fatDelta.toFixed(1)}% from current
          </div>
        </div>

        <div className="onb-goal-input-card">
          <label className="onb-field-label" style={{ marginBottom: '12px', display: 'block' }}>Target Muscle Mass</label>
          
          <div className="onb-radio-group" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {allowedMuscleTargets.map(c => (
              <label key={c.id} style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input 
                  type="radio" 
                  name="muscleCategory" 
                  value={c.id} 
                  checked={formData.targetMuscleCategory === c.id} 
                  onChange={(e) => update('targetMuscleCategory', e.target.value)} 
                />
                {c.label}
              </label>
            ))}
          </div>

          <div className="onb-field-input-wrap">
            <input 
              type="number" 
              className="onb-input" 
              value={formData.targetSMM} 
              onChange={(e) => update('targetSMM', e.target.value)}
              step="0.1" 
              min={dynamicMinKg.toFixed(1)} 
              max={smmiToKg(muscleCategoryObj.max, height).toFixed(1)}
            />
            <span className="onb-field-unit">kg</span>
          </div>
          <div style={{ fontSize: '11px', color: '#8A92A6', marginTop: '4px' }}>
            Range: {dynamicMinKg.toFixed(1)}kg - {smmiToKg(muscleCategoryObj.max, height).toFixed(1)}kg
          </div>
          <div className="onb-input-diff" style={{ color: muscleDelta > 0 ? '#4AADA8' : '#D9534F', marginTop: '8px' }}>
            {muscleDelta > 0 ? '+' : ''}{muscleDelta.toFixed(1)}kg from current
          </div>
        </div>
      </div>

      {strategy === STRATEGY_GOALS.FAT_LOSS && (
        <div className="onb-loss-rate-container" style={{ marginTop: '16px', marginBottom: '24px' }}>
          <label className="onb-field-label">Weekly Fat Loss Rate</label>
          <select 
            className="onb-input" 
            value={formData.lossRate} 
            onChange={(e) => update('lossRate', e.target.value)}
          >
            <option value="0.25">0.25 kg / week (Conservative)</option>
            <option value="0.5">0.5 kg / week (Recommended)</option>
            <option value="0.75">0.75 kg / week (Aggressive)</option>
            <option value="1.0">1.0 kg / week (Extreme - Monitor Closely)</option>
          </select>
        </div>
      )}

      <div className="onb-strategy-card" style={{ borderColor: getStrategyColor(strategy) }}>
        <div className="onb-strategy-title" style={{ color: getStrategyColor(strategy) }}>
          Active Protocol: {getStrategyLabel(strategy)}
        </div>
        <div className="onb-strategy-grid">
          <div className="onb-strat-item">
            <span className="onb-strat-label">TDEE</span>
            <span className="onb-strat-val">{tdee} <small>kcal</small></span>
          </div>
          <div className="onb-strat-item">
            <span className="onb-strat-label">Daily Target</span>
            <span className="onb-strat-val" style={{ color: getStrategyColor(strategy) }}>{Math.round(dailyCalories)} <small>kcal</small></span>
          </div>
          <div className="onb-strat-item">
            <span className="onb-strat-label">Est. Final Wt.</span>
            <span className="onb-strat-val">{targetWeight.toFixed(1)} <small>kg</small></span>
          </div>
        </div>
      </div>

      <div className="onb-macros-section">
        <h3 className="onb-macros-title">Macronutrient Distribution</h3>
        <div className="onb-macros-grid">
          <div className="onb-macro-box">
            <div className="onb-macro-name" style={{ color: '#D9534F' }}>Protein</div>
            <div className="onb-macro-gram">{Math.round(macros.gProtein)}g</div>
            <div className="onb-macro-pct">{macros.pPct}%</div>
          </div>
          <div className="onb-macro-box">
            <div className="onb-macro-name" style={{ color: '#E8A317' }}>Fat</div>
            <div className="onb-macro-gram">{Math.round(macros.gFat)}g</div>
            <div className="onb-macro-pct">{macros.lPct}%</div>
          </div>
          <div className="onb-macro-box">
            <div className="onb-macro-name" style={{ color: '#4AADA8' }}>Carbs</div>
            <div className="onb-macro-gram">{Math.round(macros.gCarbs)}g</div>
            <div className="onb-macro-pct">{macros.cPct}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
