import React, { useState, useEffect } from 'react';
import heightSilhouette from '../../../assets/silhouette_height.png';

const StepHeight = ({ formData, update }) => {
  const [unit, setUnit] = useState('cm');
  const minCm = 100;
  const maxCm = 250;
  
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

  useEffect(() => {
    if (!formData.height) {
      setLocalText('');
    }
  }, [formData.height]);

  const handleSliderChange = (e) => {
    const val = parseFloat(e.target.value);
    update('height', val);
    setLocalText(unit === 'ft' ? formatFtIn(val) : val.toString());
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
       let clampedCm = cmVal;
       if (clampedCm < minCm) clampedCm = minCm;
       if (clampedCm > maxCm) clampedCm = maxCm;
       update('height', clampedCm.toString());
       setLocalText(unit === 'ft' ? formatFtIn(clampedCm) : clampedCm.toString());
    } else {
       setLocalText('');
       update('height', '');
    }
  };

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

  return (
    <div className="onb-step-inner">
      <h2 className="onb-step-title">Your Height</h2>
      <p className="onb-step-desc">This helps us personalize your fitness goals.</p>

      <div className="onb-unit-toggle" style={{ margin: '20px auto' }}>
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

      <div className="onb-height-hero-container">
        <div className="onb-height-silhouette-wrapper">
          <img 
            src={heightSilhouette} 
            alt="Height reference" 
            className="onb-height-silhouette-img"
            style={{ transform: 'scale(1.15)' }}
          />
        </div>
        
        <div className="onb-weight-input-container" style={{ position: 'relative' }}>
          {!localText && (
            <div className="onb-age-guide-arrow onb-height-guide-arrow">
              <span>Type height</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </div>
          )}
          <input
            type="text"
            className="onb-weight-large-input"
            value={localText}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={() => setLocalText('')}
            placeholder={unit === 'ft' ? "5'7\"" : '170'}
          />
          <span className="onb-weight-unit-label">{unit}</span>
        </div>
      </div>

      <div className="onb-height-slider-wrapper">
        <input 
          type="range" 
          min={minCm} 
          max={maxCm} 
          step="1" 
          value={currentHeightCm} 
          onChange={handleSliderChange}
          className="onb-height-range-slider"
        />
        <div className="onb-height-slider-labels">
          <span>{unit === 'cm' ? '100 cm' : "3'3\""}</span>
          <span>{unit === 'cm' ? '250 cm' : "8'2\""}</span>
        </div>
      </div>
    </div>
  );
};

export default StepHeight;
