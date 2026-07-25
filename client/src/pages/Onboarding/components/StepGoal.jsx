import React, { useEffect, useState } from 'react';

const StepGoal = ({ formData, update }) => {
  const currentBf = formData._calculatedBF || 20;
  const currentSmm = formData._calculatedSMM || 30;
  const weight = parseFloat(formData.weight) || 75;
  const height = parseFloat(formData.height) || 180;
  const age = parseFloat(formData.age) || 25;
  const gender = formData.gender || 'male';

  const [fatGoalCat, setFatGoalCat] = useState('fitness');
  const [targetFat, setTargetFat] = useState(currentBf);
  const [muscleGoal, setMuscleGoal] = useState('maintain'); // 'gain' or 'maintain'
  const [speed, setSpeed] = useState(500); // 250, 500, 750, 1000
  const [activity, setActivity] = useState(1.2); // sedentary

  // ACE fat norms for slider bounds
  const aceFatNorms = {
    male: {
      athletes:  { min: 6,  max: 13 },
      fitness:   { min: 14, max: 17 },
      average:   { min: 18, max: 24 }
    },
    female: {
      athletes:  { min: 14, max: 20 },
      fitness:   { min: 21, max: 24 },
      average:   { min: 25, max: 31 }
    }
  };

  const norms = aceFatNorms[gender] || aceFatNorms.male;

  // Initialize targetFat to current category if within bounds
  useEffect(() => {
    let initialCat = 'fitness';
    if (currentBf <= norms.athletes.max) initialCat = 'athletes';
    else if (currentBf <= norms.fitness.max) initialCat = 'fitness';
    else initialCat = 'average';
    setFatGoalCat(initialCat);
    setTargetFat(currentBf);
  }, []);

  // Sync targetFat with category on click
  const handleCatClick = (cat) => {
    setFatGoalCat(cat);
    const range = norms[cat];
    if (range) {
      setTargetFat((range.min + range.max) / 2);
    }
  };

  // Determine Goal Type based on diff
  const diff = targetFat - currentBf;
  let goalType = 'gain';
  if (Math.abs(diff) < 0.01) goalType = 'maintain';
  else if (diff < 0) goalType = 'loss';

  // Enforce speed rules
  useEffect(() => {
    if (goalType === 'loss' && muscleGoal === 'gain' && speed > 500) {
      setSpeed(500);
    }
  }, [goalType, muscleGoal, speed]);

  // Calculations
  const calculateMacros = () => {
    const lbm = weight * (1 - currentBf / 100);
    const bmr = gender === 'female'
      ? 10 * weight + 6.25 * height - 5 * age - 161
      : 10 * weight + 6.25 * height - 5 * age + 5;
    
    const tdee = bmr * activity;
    
    let dailyCalories = 0;
    let proteinMultiplier = 0;
    let fatMultiplier = 0.8; 
    
    if (goalType === 'loss' && muscleGoal === 'gain') {
      if (speed <= 250) {
        dailyCalories = tdee - 275; proteinMultiplier = 2.0;
      } else if (speed <= 500) {
        dailyCalories = tdee - 550; proteinMultiplier = 2.2;
      } else if (speed <= 750) {
        dailyCalories = tdee - 825; proteinMultiplier = 2.3;
      } else {
        dailyCalories = tdee - 1100; proteinMultiplier = 2.4;
      }
    } else if (goalType === 'loss' && muscleGoal === 'maintain') {
      if (speed <= 250) {
        dailyCalories = tdee - 275; proteinMultiplier = 1.8;
      } else if (speed <= 500) {
        dailyCalories = tdee - 550; proteinMultiplier = 2.0;
      } else if (speed <= 750) {
        dailyCalories = tdee - 825; proteinMultiplier = 2.1;
      } else {
        dailyCalories = tdee - 1100; proteinMultiplier = 2.2;
      }
    } else if (goalType === 'maintain' && muscleGoal === 'maintain') {
      dailyCalories = tdee; proteinMultiplier = 1.8;
    } else if (goalType === 'maintain' && muscleGoal === 'gain') {
      if (speed <= 250) {
        dailyCalories = tdee + 275; proteinMultiplier = 2.0;
      } else if (speed <= 500) {
        dailyCalories = tdee + 550; proteinMultiplier = 2.0;
      } else if (speed <= 750) {
        dailyCalories = tdee + 825; proteinMultiplier = 2.0;
      } else {
        dailyCalories = tdee + 1100; proteinMultiplier = 2.0;
      }
    } else if (goalType === 'gain' && muscleGoal === 'maintain') {
      if (speed <= 250) {
        dailyCalories = tdee + 275; proteinMultiplier = 1.8;
      } else if (speed <= 500) {
        dailyCalories = tdee + 550; proteinMultiplier = 1.8;
      } else if (speed <= 750) {
        dailyCalories = tdee + 825; proteinMultiplier = 1.8;
      } else {
        dailyCalories = tdee + 1100; proteinMultiplier = 1.8;
      }
    } else if (goalType === 'gain' && muscleGoal === 'gain') {
      if (speed <= 250) {
        dailyCalories = tdee + 275; proteinMultiplier = 2.0;
      } else if (speed <= 500) {
        dailyCalories = tdee + 550; proteinMultiplier = 2.0;
      } else if (speed <= 750) {
        dailyCalories = tdee + 825; proteinMultiplier = 2.0;
      } else {
        dailyCalories = tdee + 1100; proteinMultiplier = 2.0;
      }
    }
    
    dailyCalories = Math.max(dailyCalories, 1200);
    
    const proteinG = Math.round(proteinMultiplier * lbm);
    const fatG = Math.round(fatMultiplier * lbm);
    
    const proteinCal = proteinG * 4;
    const fatCal = fatG * 9;
    
    let carbCal = dailyCalories - (proteinCal + fatCal);
    let carbsG = Math.round(carbCal / 4);
    
    if (carbsG < 100) {
      const newFatG = Math.round(0.6 * lbm);
      const newFatCal = newFatG * 9;
      const newCarbCal = dailyCalories - (proteinCal + newFatCal);
      carbsG = Math.round(newCarbCal / 4);
      
      if (carbsG >= 50) {
        const finalCarbs = Math.max(carbsG, 30);
        const finalTotalCal = proteinCal + newFatCal + (finalCarbs * 4);
        return {
          bmr: Math.round(bmr),
          tdee: Math.round(tdee),
          totalCalories: Math.round(finalTotalCal),
          proteinG, 
          fatG: newFatG, 
          carbsG: finalCarbs,
          proteinCal, 
          fatCal: newFatCal, 
          carbsCal: finalCarbs * 4
        };
      }
    }
    
    carbsG = Math.max(carbsG, 10);
    const actualTotalCal = proteinCal + fatCal + (carbsG * 4);
    
    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      totalCalories: Math.round(actualTotalCal),
      proteinG, fatG, carbsG,
      proteinCal, fatCal, carbsCal: carbsG * 4
    };
  };

  const macros = calculateMacros();

  // Export macros to parent
  useEffect(() => {
    formData._calculatedCalories = macros.totalCalories;
    formData._calculatedMacros = {
      gProtein: macros.proteinG,
      gFat: macros.fatG,
      gCarbs: macros.carbsG
    };
    update('lossRate', speed / 1000);
    update('targetFatPercent', targetFat);
    update('activityLevel', activity === 1.2 ? 'sedentary' : activity === 1.375 ? 'light' : activity === 1.55 ? 'moderate' : 'active');
  }, [macros.totalCalories, targetFat, speed, activity]);

  return (
    <div className="onb-step-inner onb-goal-step">
      <div className="onb-header-section" style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2 className="onb-step-title" style={{ fontSize: '28px', marginBottom: '8px' }}>Set Your Goal</h2>
        <p className="onb-step-desc">Adjust your targets and let our algorithm build your macros.</p>
      </div>

      <div className="onb-field" style={{ marginBottom: '24px' }}>
        <label className="onb-field-label">Activity Level</label>
        <select 
          className="onb-input" 
          value={activity} 
          onChange={(e) => setActivity(parseFloat(e.target.value))}
        >
          <option value="1.2">Sedentary (Office job, little exercise)</option>
          <option value="1.375">Lightly Active (Light exercise 1-3 days/wk)</option>
          <option value="1.55">Moderately Active (Moderate exercise 3-5 days/wk)</option>
          <option value="1.725">Very Active (Heavy exercise 6-7 days/wk)</option>
        </select>
      </div>

      <h3 className="onb-section-title">Target Body Fat</h3>
      <div className="onb-goal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        {['athletes', 'fitness', 'average'].map(cat => {
          const isSelected = fatGoalCat === cat;
          const range = norms[cat];
          const labels = { athletes: 'Athletes', fitness: 'Fitness', average: 'Average' };
          return (
            <div 
              key={cat}
              onClick={() => handleCatClick(cat)}
              className={`onb-age-card ${isSelected ? 'active' : ''}`}
              style={{ padding: '12px 8px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px', border: isSelected ? '1.5px solid #C9A84C' : '1.5px solid #EAEDF3' }}
            >
              <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{labels[cat]}</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>{range.min}-{range.max}%</div>
            </div>
          );
        })}
      </div>

      <div className="onb-field" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <label className="onb-field-label" style={{ margin: 0 }}>Exact Target: {targetFat.toFixed(1)}%</label>
          <span style={{ fontSize: '12px', color: diff < 0 ? '#4AADA8' : '#D9534F', fontWeight: 'bold' }}>
            {Math.abs(diff) < 0.1 ? 'Maintain Current' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}% from current`}
          </span>
        </div>
        <input 
          type="range" 
          min={norms[fatGoalCat]?.min || 5} 
          max={norms[fatGoalCat]?.max || 30} 
          step="0.1"
          value={targetFat}
          onChange={(e) => setTargetFat(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#C9A84C' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8A92A6', marginTop: '4px' }}>
          <span>{norms[fatGoalCat]?.min || 5}%</span>
          <span>{norms[fatGoalCat]?.max || 30}%</span>
        </div>
      </div>

      <h3 className="onb-section-title">Muscle Goal</h3>
      <div className="onb-goal-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '24px' }}>
        <div 
          onClick={() => setMuscleGoal('maintain')}
          className={`onb-age-card ${muscleGoal === 'maintain' ? 'active' : ''}`}
          style={{ padding: '16px 8px', margin: 0 }}
        >
          <div style={{ fontSize: '15px', fontWeight: 'bold' }}>Maintain Muscle</div>
        </div>
        <div 
          onClick={() => setMuscleGoal('gain')}
          className={`onb-age-card ${muscleGoal === 'gain' ? 'active' : ''}`}
          style={{ padding: '16px 8px', margin: 0 }}
        >
          <div style={{ fontSize: '15px', fontWeight: 'bold' }}>Gain Muscle</div>
        </div>
      </div>

      {!(goalType === 'maintain' && muscleGoal === 'maintain') && (
        <div style={{ marginBottom: '24px' }}>
          <h3 className="onb-section-title">Pace (Caloric {goalType === 'loss' ? 'Deficit' : 'Surplus'} / Day)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {[250, 500, 750, 1000].map(val => {
              const inactive = (goalType === 'loss' && muscleGoal === 'gain' && val > 500);
              const isActive = speed === val && !inactive;
              return (
                <div 
                  key={val}
                  onClick={() => !inactive && setSpeed(val)}
                  className={`onb-age-card ${isActive ? 'active' : ''}`}
                  style={{ 
                    padding: '12px 4px', margin: 0, opacity: inactive ? 0.4 : 1, 
                    cursor: inactive ? 'not-allowed' : 'pointer',
                    border: isActive ? '1.5px solid #C9A84C' : '1.5px solid #EAEDF3'
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{val}</div>
                  <div style={{ fontSize: '10px', opacity: 0.8 }}>≈{(val / 7700 * 7).toFixed(2)}kg/wk</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="onb-strategy-card" style={{ borderColor: '#C9A84C', marginBottom: '24px' }}>
        <div className="onb-strategy-title" style={{ color: '#C9A84C' }}>
          Daily Nutrition Target
        </div>
        <div className="onb-strategy-grid">
          <div className="onb-strat-item">
            <span className="onb-strat-label">TDEE</span>
            <span className="onb-strat-val">{macros.tdee} <small>kcal</small></span>
          </div>
          <div className="onb-strat-item">
            <span className="onb-strat-label">Daily Calories</span>
            <span className="onb-strat-val" style={{ color: '#C9A84C' }}>{macros.totalCalories} <small>kcal</small></span>
          </div>
        </div>
      </div>

      <div className="onb-macros-section">
        <h3 className="onb-macros-title">Macronutrient Split</h3>
        <div className="onb-macros-grid">
          <div className="onb-macro-box">
            <div className="onb-macro-name" style={{ color: '#D9534F' }}>Protein</div>
            <div className="onb-macro-gram">{macros.proteinG}g</div>
          </div>
          <div className="onb-macro-box">
            <div className="onb-macro-name" style={{ color: '#E8A317' }}>Fat</div>
            <div className="onb-macro-gram">{macros.fatG}g</div>
          </div>
          <div className="onb-macro-box">
            <div className="onb-macro-name" style={{ color: '#4AADA8' }}>Carbs</div>
            <div className="onb-macro-gram">{macros.carbsG}g</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepGoal;
