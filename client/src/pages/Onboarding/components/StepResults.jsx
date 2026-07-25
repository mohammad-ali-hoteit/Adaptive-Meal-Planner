import React, { useState, useEffect } from 'react';
import { navyBodyFatMale, navyBodyFatFemale, heymsfieldMuscleMale, heymsfieldMuscleFemale } from '../../../utils/calculations';

const aceFatNorms = {
  male: {
      essential: { min: 2,  max: 5 },
      athletes:  { min: 6,  max: 13 },
      fitness:   { min: 14, max: 17 },
      average:   { min: 18, max: 24 },
      obese:     { min: 25, max: 60 }
  },
  female: {
      essential: { min: 10, max: 13 },
      athletes:  { min: 14, max: 20 },
      fitness:   { min: 21, max: 24 },
      average:   { min: 25, max: 31 },
      obese:     { min: 32, max: 60 }
  }
};

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

  const ace = aceFatNorms[g];
  
  let bodyFat = 0;
  if (g === 'male') {
      bodyFat = navyBodyFatMale(h, wa, n);
  } else {
      const hip = parseFloat(formData.hip) || (wa * 1.1); 
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

  let fatKey = "average", fatTitle = "Average", fatColor = "#ffaa00", calculatedFatPtr = 50;

  if (bodyFat <= ace.essential.max) {
      fatKey = "essential"; fatTitle = "Essential Fat"; fatColor = "#3a86ff"; calculatedFatPtr = 10;
  } else if (bodyFat <= ace.athletes.max) {
      fatKey = "athletes"; fatTitle = "Athletes"; fatColor = "#00d2ff"; calculatedFatPtr = 30;
  } else if (bodyFat <= ace.fitness.max) {
      fatKey = "fitness"; fatTitle = "Fitness"; fatColor = "#90ee02"; calculatedFatPtr = 50;
  } else if (bodyFat <= ace.average.max) {
      fatKey = "average"; fatTitle = "Average"; fatColor = "#ffaa00"; calculatedFatPtr = 70;
  } else {
      fatKey = "obese"; fatTitle = "High / Obese"; fatColor = "#ff3838"; calculatedFatPtr = 90;
  }

  const fatInfo = { title: fatTitle, color: fatColor, ptr: calculatedFatPtr, key: fatKey };

  // SMM Logic
  const smmiThreshold = (g === 'male') ? 7.0 : 5.5;
  const isSmmLow = smmi < smmiThreshold;
  
  const muscleInfo = {
    title: isSmmLow ? "Low Muscle Mass" : "Healthy Muscle Mass",
    color: isSmmLow ? "#ffaa00" : "#90ee02",
    ptr: isSmmLow ? 25 : 75,
    key: isSmmLow ? "low" : "not-low"
  };

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

  const diagnosticText = (!isSmmLow)
    ? `According to the Heymsfield Series 2 equation, your total skeletal muscle mass is ${sm.toFixed(1)} kg (SMMI = ${smmi.toFixed(1)} kg/m²). You possess an adequate and healthy muscle mass for your height and gender.`
    : `According to the Heymsfield Series 2 equation, your total skeletal muscle mass is ${sm.toFixed(1)} kg (SMMI = ${smmi.toFixed(1)} kg/m²). This indicates a muscle mass below the average cutoff (< ${smmiThreshold} kg/m²). Resistance training is recommended.`;

  return (
    <div className="onb-step-inner onb-results-step">
      <div className="onb-header-section" style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 className="onb-step-title" style={{ fontSize: '28px', marginBottom: '8px' }}>Body Composition Results</h2>
        <p className="onb-step-desc" style={{ fontSize: '13px' }}>Calculated via US Navy Equations & Heymsfield Series 2 (MRI Validated)</p>
      </div>

      <div className="onb-section-title">Body Fat Analysis (ACE Standards)</div>
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
              {fatInfo.key.toUpperCase()}
            </span>
            <div className="onb-status-main-val" style={{ color: fatInfo.color }}>{fatInfo.title}</div>
            <div className="onb-status-desc">Evaluating ACE body fat norm...</div>
          </div>
        </div>
        <div className="onb-range-visualizer">
          <div className="onb-bar-wrapper">
            <div className="onb-bar-pointer" style={{ left: `${fatPtr}%` }}></div>
            <div className="onb-segments-bar">
              <div className="onb-segment onb-vl" style={{ background: '#3a86ff' }}></div>
              <div className="onb-segment onb-l" style={{ background: '#00d2ff' }}></div>
              <div className="onb-segment onb-n" style={{ background: '#90ee02' }}></div>
              <div className="onb-segment onb-h" style={{ background: '#ffaa00' }}></div>
              <div className="onb-segment onb-vh" style={{ background: '#ff3838' }}></div>
            </div>
          </div>
          <div className="onb-labels-grid">
            <div className={`onb-label-item ${fatInfo.key === 'essential' ? 'active' : ''}`}>
              <div className="onb-label-name" style={{ color: '#3a86ff' }}>Essential</div>
              <div className="onb-label-range">{ace.essential.min}-{ace.essential.max}%</div>
            </div>
            <div className={`onb-label-item ${fatInfo.key === 'athletes' ? 'active' : ''}`}>
              <div className="onb-label-name" style={{ color: '#00d2ff' }}>Athletes</div>
              <div className="onb-label-range">{ace.athletes.min}-{ace.athletes.max}%</div>
            </div>
            <div className={`onb-label-item ${fatInfo.key === 'fitness' ? 'active' : ''}`}>
              <div className="onb-label-name" style={{ color: '#90ee02' }}>Fitness</div>
              <div className="onb-label-range">{ace.fitness.min}-{ace.fitness.max}%</div>
            </div>
            <div className={`onb-label-item ${fatInfo.key === 'average' ? 'active' : ''}`}>
              <div className="onb-label-name" style={{ color: '#ffaa00' }}>Average</div>
              <div className="onb-label-range">{ace.average.min}-{ace.average.max}%</div>
            </div>
            <div className={`onb-label-item ${fatInfo.key === 'obese' ? 'active' : ''}`}>
              <div className="onb-label-name" style={{ color: '#ff3838' }}>Obese</div>
              <div className="onb-label-range">&gt;{ace.obese.min}%</div>
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
              <div className="onb-segment" style={{ background: '#ffaa00', flex: 1 }}></div>
              <div className="onb-segment" style={{ background: '#90ee02', flex: 2 }}></div>
            </div>
          </div>
          <div className="onb-labels-grid">
            <div className={`onb-label-item ${muscleInfo.key === 'low' ? 'active' : ''}`} style={{ flex: 1 }}>
              <div className="onb-label-name" style={{ color: '#ffaa00' }}>Low</div>
              <div className="onb-label-range">&lt;{smmiThreshold}</div>
            </div>
            <div className={`onb-label-item ${muscleInfo.key === 'not-low' ? 'active' : ''}`} style={{ flex: 2 }}>
              <div className="onb-label-name" style={{ color: '#90ee02' }}>Not Low</div>
              <div className="onb-label-range">&ge;{smmiThreshold}</div>
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

export default StepResults;
