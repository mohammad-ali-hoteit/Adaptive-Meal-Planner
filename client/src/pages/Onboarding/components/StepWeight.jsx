import React, { useState, useRef, useEffect, useMemo } from 'react';

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

  useEffect(() => {
    if (!formData.weight) {
      setLocalText('');
    }
  }, [formData.weight]);

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
    let val = e.target.value;
    const parts = val.split('.');
    if (parts[0].length > 3) {
      parts[0] = parts[0].slice(0, 3);
      val = parts.join('.');
    }
    setLocalText(val);
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

      <div className="onb-weight-input-container" style={{ position: 'relative' }}>
        {!localText && (
          <div className="onb-age-guide-arrow" style={{ left: '-135px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
            <span>Type weight</span>
          </div>
        )}
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

export default StepWeight;
