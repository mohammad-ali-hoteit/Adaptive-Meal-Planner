import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import maleSilhouette from '../assets/silhouette_male.png';
import femaleSilhouette from '../assets/silhouette_female.png';
import './OnboardingPage.css';

/* =====================================================
   ONBOARDING — 8-step wizard
   ===================================================== */

const TOTAL_STEPS = 8;

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    age:         '',
    gender:      '',        // 'male' | 'female'
    weight:      '',        // kg
    height:      '',        // cm
    neck:        '',        // cm
    waist:       '',        // cm
    wakeTime:    '07:00',
    sleepTime:   '23:00',
    busyPeriods: [],        // [{ label, startTime, endTime }]
    planDuration: 30,
    startDate:   new Date().toISOString().split('T')[0],
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
    try {
      await API.post('/onboarding', formData);
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      // Navigate to dashboard regardless for now (backend may not be ready)
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const progressPct = ((step - 1) / TOTAL_STEPS) * 100;

  return (
    <div className="onb-page">
      {/* Progress bar */}
      <div className="onb-progress-bar-bg">
        <div className="onb-progress-bar-fill" style={{ width: `${progressPct}%` }} />
      </div>

      {/* Step label */}
      <div className="onb-step-label">STEP {step} OF {TOTAL_STEPS}</div>

      {/* Step content */}
      <div className={`onb-card${[4, 5].includes(step) ? ' onb-card-wide' : ''}`}>
        {step === 1 && <StepAge formData={formData} update={update} />}
        {step === 2 && <StepGender formData={formData} update={update} />}
        {step === 3 && <StepWeight formData={formData} update={update} />}
        {step === 4 && <StepHeight formData={formData} update={update} />}
        {step === 5 && <StepNeckWaist formData={formData} update={update} />}
        {step === 6 && <StepResults formData={formData} />}
        {step === 7 && <StepSchedule formData={formData} update={update} setFormData={setFormData} />}
        {step === 8 && <StepPlanDuration formData={formData} update={update} />}

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
  );
};

/* =====================================================
   STEP 1 — Age
   ===================================================== */
const StepAge = ({ formData, update }) => (
  <div className="onb-step-inner">
    <div className="onb-icon-circle">🎂</div>
    <h2 className="onb-step-title">Your Age</h2>
    <p className="onb-step-desc">Tell us your age so we can calibrate your nutritional baseline.</p>
    <div className="onb-number-input-wrap">
      <input
        id="onb-age"
        className="onb-number-input"
        type="number"
        min="10"
        max="120"
        value={formData.age}
        onChange={(e) => update('age', e.target.value)}
        placeholder="25"
        autoFocus
      />
      <span className="onb-unit-label">years</span>
    </div>
  </div>
);

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

  const handleChange = (val) => {
    if (unit === 'lbs') {
      update('weight', val ? Math.round(parseFloat(val) / 2.20462).toString() : '');
    } else {
      update('weight', val);
    }
  };

  const displayVal = unit === 'lbs' && formData.weight
    ? Math.round(parseFloat(formData.weight) * 2.20462).toString()
    : formData.weight;

  return (
    <div className="onb-step-inner">
      <div className="onb-icon-circle">⚖️</div>
      <h2 className="onb-step-title">What's your current weight?</h2>
      <p className="onb-step-desc">We'll use this to estimate your daily calorie needs.</p>
      <div className="onb-number-input-wrap">
        <input
          id="onb-weight"
          className="onb-number-input"
          type="number"
          min="20"
          max="400"
          step="0.1"
          value={displayVal}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="70"
        />
        <div className="onb-unit-toggle">
          {['kg', 'lbs'].map((u) => (
            <button
              key={u}
              type="button"
              className={`onb-unit-pill${unit === u ? ' active' : ''}`}
              onClick={() => setUnit(u)}
              id={`onb-weight-unit-${u}`}
            >
              {u}
            </button>
          ))}
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

  const handleChange = (val) => {
    if (unit === 'ft') {
      const parts = val.split("'");
      const ft = parseFloat(parts[0]) || 0;
      const inch = parseFloat(parts[1]) || 0;
      update('height', Math.round((ft * 30.48) + (inch * 2.54)).toString());
    } else {
      update('height', val);
    }
  };

  return (
    <div className="onb-two-panel">
      {/* Left panel */}
      <div className="onb-two-panel-left">
        <img
          src={maleSilhouette}
          alt="Height reference silhouette"
          className="onb-panel-silhouette"
        />
        <div className="onb-panel-ruler">
          {[170, 160, 150].map((h) => (
            <div key={h} className="onb-ruler-mark">
              <span>{h}</span>
              <div className="onb-ruler-line" />
            </div>
          ))}
        </div>
        <p className="onb-panel-hint">Height Reference</p>
      </div>

      {/* Right panel */}
      <div className="onb-two-panel-right">
        <div className="onb-icon-circle">📏</div>
        <h2 className="onb-step-title">Your Height</h2>
        <p className="onb-step-desc">Stand straight and measure from floor to top of head.</p>
        <div className="onb-number-input-wrap">
          <input
            id="onb-height"
            className="onb-number-input"
            type={unit === 'cm' ? 'number' : 'text'}
            min="100"
            max="250"
            value={formData.height}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={unit === 'cm' ? '170' : "5'8\""}
          />
          <div className="onb-unit-toggle">
            {['cm', 'ft'].map((u) => (
              <button
                key={u}
                type="button"
                className={`onb-unit-pill${unit === u ? ' active' : ''}`}
                onClick={() => setUnit(u)}
                id={`onb-height-unit-${u}`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   STEP 5 — Neck & Waist (two-panel)
   ===================================================== */
const StepNeckWaist = ({ formData, update }) => (
  <div className="onb-two-panel">
    {/* Left panel */}
    <div className="onb-two-panel-left">
      <img
        src={maleSilhouette}
        alt="Body measurement reference"
        className="onb-panel-silhouette"
      />
      <div className="onb-measurement-markers">
        <div className="onb-meas-marker onb-meas-neck">
          <span className="onb-meas-dot" />
          <span className="onb-meas-line" />
          <span className="onb-meas-text">Neck</span>
        </div>
        <div className="onb-meas-marker onb-meas-waist">
          <span className="onb-meas-dot" />
          <span className="onb-meas-line" />
          <span className="onb-meas-text">Waist</span>
        </div>
      </div>
      <p className="onb-panel-hint">Measurement Points</p>
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

/* =====================================================
   STEP 6 — Results (donut chart)
   ===================================================== */
const StepResults = ({ formData }) => {
  // Navy Method body fat estimate
  const calcBodyFat = () => {
    const { gender, height, neck, waist } = formData;
    const h = parseFloat(height) || 170;
    const n = parseFloat(neck)   || 38;
    const w = parseFloat(waist)  || 80;
    if (gender === 'female') {
      const hip = w * 0.95; // estimate
      return Math.max(0, Math.min(60,
        163.205 * Math.log10(w + hip - n) - 97.684 * Math.log10(h) - 78.387
      ));
    }
    return Math.max(0, Math.min(50,
      86.010 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76
    ));
  };

  const bodyFat  = Math.round(calcBodyFat());
  const leanMass = 100 - bodyFat;

  // SVG donut
  const R  = 70;
  const C  = 2 * Math.PI * R;
  const pct = bodyFat / 100;

  // Estimated TDEE
  const weight = parseFloat(formData.weight) || 70;
  const height = parseFloat(formData.height) || 170;
  const age    = parseFloat(formData.age)    || 25;
  const bmr = formData.gender === 'female'
    ? 10 * weight + 6.25 * height - 5 * age - 161
    : 10 * weight + 6.25 * height - 5 * age + 5;
  const tdee = Math.round(bmr * 1.375);

  return (
    <div className="onb-step-inner">
      <div className="onb-results-top">
        <div className="onb-donut-wrap">
          <svg className="onb-donut-svg" viewBox="0 0 180 180">
            {/* Track */}
            <circle
              cx="90" cy="90" r={R}
              fill="none"
              stroke="#f1e7d6"
              strokeWidth="18"
            />
            {/* Body fat arc */}
            <circle
              cx="90" cy="90" r={R}
              fill="none"
              stroke="#C9A84C"
              strokeWidth="18"
              strokeDasharray={`${pct * C} ${C}`}
              strokeLinecap="round"
              transform="rotate(-90 90 90)"
            />
            {/* Center label */}
            <text x="90" y="84" textAnchor="middle" className="onb-donut-pct">{bodyFat}%</text>
            <text x="90" y="104" textAnchor="middle" className="onb-donut-sub">Body Fat</text>
          </svg>
        </div>
        <div className="onb-results-info">
          <h2 className="onb-step-title" style={{ marginBottom: '8px' }}>Analysis Complete!</h2>
          <p className="onb-step-desc" style={{ marginBottom: '16px' }}>
            Here's your estimated body composition based on your measurements.
          </p>
          <div className="onb-results-stats">
            <div className="onb-stat-pill onb-stat-fat">
              <span className="onb-stat-val">{bodyFat}%</span>
              <span className="onb-stat-label">Body Fat</span>
            </div>
            <div className="onb-stat-pill onb-stat-lean">
              <span className="onb-stat-val">{leanMass}%</span>
              <span className="onb-stat-label">Lean Mass</span>
            </div>
            <div className="onb-stat-pill onb-stat-tdee">
              <span className="onb-stat-val">{tdee}</span>
              <span className="onb-stat-label">kcal / day</span>
            </div>
          </div>
        </div>
      </div>
      <div className="onb-results-note">
        <span>💡</span>
        <span>These are estimates. Your plan will adjust weekly based on your progress and logged meals.</span>
      </div>
    </div>
  );
};

/* =====================================================
   STEP 7 — Schedule
   ===================================================== */
const StepSchedule = ({ formData, update, setFormData }) => {
  const [newPeriod, setNewPeriod] = useState({ label: '', startTime: '', endTime: '' });

  const addPeriod = () => {
    if (!newPeriod.label || !newPeriod.startTime || !newPeriod.endTime) return;
    setFormData(prev => ({
      ...prev,
      busyPeriods: [...prev.busyPeriods, { ...newPeriod }],
    }));
    setNewPeriod({ label: '', startTime: '', endTime: '' });
  };

  const removePeriod = (idx) => {
    setFormData(prev => ({
      ...prev,
      busyPeriods: prev.busyPeriods.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="onb-step-inner">
      <div className="onb-icon-circle">⏰</div>
      <h2 className="onb-step-title">Your Daily Schedule</h2>
      <p className="onb-step-desc">
        We'll space your meals around your day automatically.
      </p>

      {/* Wake / Sleep */}
      <div className="onb-schedule-times">
        <div className="onb-field">
          <label className="onb-field-label" htmlFor="onb-wake">Wake Time</label>
          <input
            id="onb-wake"
            className="onb-input"
            type="time"
            value={formData.wakeTime}
            onChange={(e) => update('wakeTime', e.target.value)}
          />
        </div>
        <div className="onb-field">
          <label className="onb-field-label" htmlFor="onb-sleep">Sleep Time</label>
          <input
            id="onb-sleep"
            className="onb-input"
            type="time"
            value={formData.sleepTime}
            onChange={(e) => update('sleepTime', e.target.value)}
          />
        </div>
      </div>

      {/* Busy periods */}
      <div className="onb-busy-section">
        <h3 className="onb-busy-title">Busy Periods <span>(optional)</span></h3>
        <p className="onb-busy-desc">Add times when you can't eat (meetings, gym, etc.)</p>

        {/* Existing periods */}
        {formData.busyPeriods.map((p, i) => (
          <div key={i} className="onb-busy-item">
            <span className="onb-busy-item-label">{p.label}</span>
            <span className="onb-busy-item-time">{p.startTime} – {p.endTime}</span>
            <button type="button" className="onb-busy-remove" onClick={() => removePeriod(i)} aria-label="Remove">✕</button>
          </div>
        ))}

        {/* Add new */}
        <div className="onb-busy-add-row">
          <input
            className="onb-input onb-busy-label-input"
            type="text"
            placeholder="Label (e.g. Gym)"
            value={newPeriod.label}
            onChange={(e) => setNewPeriod(p => ({ ...p, label: e.target.value }))}
            id="onb-busy-label"
          />
          <input
            className="onb-input onb-busy-time-input"
            type="time"
            value={newPeriod.startTime}
            onChange={(e) => setNewPeriod(p => ({ ...p, startTime: e.target.value }))}
            id="onb-busy-start"
          />
          <span className="onb-busy-separator">–</span>
          <input
            className="onb-input onb-busy-time-input"
            type="time"
            value={newPeriod.endTime}
            onChange={(e) => setNewPeriod(p => ({ ...p, endTime: e.target.value }))}
            id="onb-busy-end"
          />
          <button type="button" className="onb-busy-add-btn" onClick={addPeriod} id="onb-add-busy-btn">
            + Add
          </button>
        </div>
      </div>
    </div>
  );
};

/* =====================================================
   STEP 8 — Plan Duration
   ===================================================== */
const StepPlanDuration = ({ formData, update }) => (
  <div className="onb-step-inner">
    <div className="onb-icon-circle">📅</div>
    <h2 className="onb-step-title">Plan Duration</h2>
    <p className="onb-step-desc">
      How long would you like your initial meal plan to run?
    </p>

    <div className="onb-duration-cards">
      {[
        { days: 30,  label: '30 Days',  desc: 'Quick start' },
        { days: 60,  label: '60 Days',  desc: 'Build habits' },
        { days: 90,  label: '90 Days',  desc: 'Transform' },
      ].map((d) => (
        <label
          key={d.days}
          className={`onb-duration-card${formData.planDuration === d.days ? ' selected' : ''}`}
          htmlFor={`onb-duration-${d.days}`}
          id={`onb-duration-card-${d.days}`}
        >
          <input
            id={`onb-duration-${d.days}`}
            type="radio"
            name="planDuration"
            value={d.days}
            checked={formData.planDuration === d.days}
            onChange={() => update('planDuration', d.days)}
            className="onb-duration-radio"
          />
          <span className="onb-duration-days">{d.label}</span>
          <span className="onb-duration-desc">{d.desc}</span>
        </label>
      ))}
    </div>

    <div className="onb-start-date-field">
      <label className="onb-field-label" htmlFor="onb-start-date">Start Date</label>
      <input
        id="onb-start-date"
        className="onb-input"
        type="date"
        value={formData.startDate}
        onChange={(e) => update('startDate', e.target.value)}
        min={new Date().toISOString().split('T')[0]}
      />
    </div>
  </div>
);

export default OnboardingPage;
